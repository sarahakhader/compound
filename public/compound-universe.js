/* ================================================================
   COMPOUND UNIVERSE — Top-down freely navigable cyberpunk city
   Compound aesthetic: brutalist, organic, biophilic, luxury.
   Brown-skinned woman protagonist + black cat companion.
   API: window.CompoundUniverse = { start, stop, active, debug }
   Dispatches 'compound-universe:exit' on stop.
================================================================ */
(function () {
  "use strict";
  if (window.CompoundUniverse) return;

  /* ── Palette ── */
  const C = {
    bg:           "#050608",
    road:         "#080a0f",
    roadHi:       "#0d0f16",
    sidewalk:     "#0e1018",
    sidewalkEdge: "#181b25",
    acid:         "#B5CC45",
    glacier:      "#6ECECE",
    plum:         "#3D2645",
    linen:        "#EDE4D8",
    molten:       "#CC4A12",
    terra:        "#8B3A1E",
    jungle:       "#1B3A2D",
    cobalt:       "#0047AB",
    neonCyan:     "#00f5e4",
    neonViolet:   "#9b5de5",
    neonAmber:    "#f59e0b",
    neonGreen:    "#84cc16",
    skin:         "#8B5E3C",
  };

  /* ── Module state ── */
  let active = false;
  let root = null, canvas = null, ctx = null;
  let W = 0, H = 0;
  let raf = null, lastNow = 0, t = 0;
  let keys = {}, prevOverflow = "";
  let interactionPrompt = null;

  /* World size */
  const WW = 3200, WH = 3200;

  /* Camera */
  const cam = { x: 1600, y: 1600 };

  /* Player */
  const player = {
    x: 1600, y: 1700,
    speed: 140,
    facing: 0,
    walkPhase: 0,
    moving: false,
  };

  /* Cat — trails player through history */
  const catHist = [];
  const cat = { x: 1565, y: 1730 };
  const CAT_LAG = 40;

  /* Particles */
  const DUST = [];
  const RAIN = [];

  /* ── World definition ──
     Each building: x,y = top-left in world space (px)
     glowColor drives all neon: border, sign, windows.
     interact:true + link = navigates on [E].                  */
  const BUILDINGS = [
    /* ── COMPOUND CENTRAL PLAZA (surrounding open center ~1480–1720) ── */
    { x:1160, y:1060, w:260, h:180, name:"COMPOUND WORLD",            glowColor:C.acid,      col:"#0c0d11", desc:"The flagship house of Compound. Objects for future habitats." },
    { x:1440, y:1040, w:200, h:200, name:"HOUSE OF COMPOUND",         glowColor:C.glacier,   col:"#0e0c17", desc:"Textiles, materials and objects from the Compound archive." },
    { x:1660, y:1050, w:190, h:190, name:"MATERIAL ARCHIVE",          glowColor:C.neonGreen, col:"#0a110e", desc:"Every material that has passed through Compound. Curated forever." },
    { x:1870, y:1065, w:230, h:175, name:"ATMOSPHERE LAB",            glowColor:C.neonViolet,col:"#110c0f", desc:"Experimental sensory environments. Entry by appointment." },
    { x:1160, y:1760, w:210, h:190, name:"BEDROCK TEXTILES",          glowColor:C.terra,     col:"#0d1117", desc:"Stone-woven blankets and textile installations.",         interact:true, link:"/blankets" },
    { x:1390, y:1775, w:250, h:175, name:"ACID CANOPY",               glowColor:C.acid,      col:"#0b110a", desc:"Where acid meets green. Compound's canopy garden and living textile studio." },
    { x:1660, y:1760, w:210, h:190, name:"OBJECTS FOR FUTURE HABITATS",glowColor:C.glacier,  col:"#0e0d14", desc:"Functional objects designed for the architecture of tomorrow." },
    { x:1890, y:1775, w:210, h:175, name:"DATA SHRINE",               glowColor:C.neonCyan,  col:"#0c0e18", desc:"The living memory of Compound. All decisions archived here." },
    { x:1000, y:1290, w:150, h:160, name:"ARCHITECTURE OF WARMTH",    glowColor:C.molten,    col:"#110d0b", desc:"Structural warmth. Where brutalism meets fire." },
    { x:1000, y:1470, w:150, h:150, name:"GLACIER DISTRICT",          glowColor:C.glacier,   col:"#0a0e11", desc:"A cool glass-faced residential zone above the Lower City." },
    { x:2130, y:1290, w:160, h:160, name:"CHROME MATERIAL WORKS",     glowColor:"#c0c8d4",   col:"#0e0f12", desc:"Burnished metal and mineral finishes for architectural surfaces." },
    { x:2130, y:1470, w:160, h:150, name:"SENSORY SYSTEMS",           glowColor:C.neonViolet,col:"#100c16", desc:"Compound's R&D wing for material perception and spatial sensation." },

    /* ── ARRIVAL BOULEVARD (north, wide road) ── */
    { x: 870, y: 680, w:240, h:260, name:"COMPOUND RESIDENTIAL",  glowColor:C.cobalt,       col:"#0d0e14", desc:"Compound's residential towers. Private. Composed." },
    { x:1130, y: 655, w:210, h:285, name:"TERRACOTTA HOUSE",       glowColor:C.terra,        col:"#130d09", desc:"Warm terracotta and fired clay forms. A house of earth." },
    { x:1360, y: 635, w:290, h:305, name:"THE ARCHIVE",            glowColor:C.acid,         col:"#0b0c12", desc:"The Compound story. History, vision, origin. Enter the archive.", interact:true, link:"/story" },
    { x:1670, y: 650, w:270, h:290, name:"DEEP JUNGLE TRANSIT",    glowColor:C.neonGreen,    col:"#091109", desc:"Transit hub. Connections to the outer districts. Dense and alive." },
    { x:1960, y: 670, w:240, h:270, name:"FORMING",                glowColor:"#444",         col:"#0e0d10", desc:"District in formation. The city grows.", locked:true },
    { x:2220, y: 685, w:210, h:255, name:"FUTURE HABITAT 01",      glowColor:"#333",         col:"#0b0c14", desc:"A residential prototype. One day everyone will live like this.", locked:true },

    /* ── DESIGN DISTRICT (east) ── */
    { x:2380, y:1090, w:210, h:190, name:"FURNITURE GALLERY NO.1",  glowColor:C.linen,       col:"#0d0d10", desc:"Original furniture from the Compound design studio." },
    { x:2400, y:1305, w:190, h:170, name:"LIGHTING STUDIO",         glowColor:C.neonAmber,   col:"#100e09", desc:"Mineral-inspired lighting objects. Each one named." },
    { x:2380, y:1495, w:210, h:185, name:"TEXTILES + OBJECTS",      glowColor:C.acid,        col:"#0d100e", desc:"A curated archive of Compound textile objects and surface materials." },
    { x:2400, y:1700, w:190, h:170, name:"CAFÉ COMPOUND",           glowColor:C.molten,      col:"#0f0b09", desc:"Compound's café. Dark roast. Architectural seating." },

    /* ── RESIDENTIAL HILLS (west) ── */
    { x: 580, y:1090, w:280, h:230, name:"COMPOUND MANSION",    glowColor:C.plum,       col:"#0c0c10", desc:"The Compound founder's private residence. Invitation only." },
    { x: 600, y:1345, w:240, h:190, name:"PRIVATE GARDENS",     glowColor:C.neonGreen,  col:"#08100a", desc:"Sculptural landscape. Water, moss, stone." },
    { x: 580, y:1555, w:280, h:210, name:"COMPOUND SPA",        glowColor:C.glacier,    col:"#0a0c10", desc:"Thermal pools, mineral water, dark stone interiors." },

    /* ── CANOPY DISTRICT (south) ── */
    { x: 880, y:2090, w:250, h:210, name:"ACID CANOPY LABS",    glowColor:C.acid,       col:"#09110a", desc:"Canopy-level laboratories where living material is developed." },
    { x:1150, y:2110, w:210, h:190, name:"GLASSHOUSE 01",       glowColor:C.glacier,    col:"#0a100d", desc:"A full-spectrum growing facility. Living architecture." },
    { x:1380, y:2090, w:250, h:210, name:"MOSS + STONE GALLERY",glowColor:C.neonGreen,  col:"#0c110b", desc:"Material conversations between geological time and living organisms." },
    { x:1650, y:2110, w:210, h:190, name:"WATER PAVILION",      glowColor:C.glacier,    col:"#0a0e11", desc:"Still water. Reflecting pools. The city seen from below." },
    { x:1880, y:2090, w:250, h:210, name:"TERRACE RESIDENCES",  glowColor:C.plum,       col:"#0d0c10", desc:"Elevated residential terraces above the canopy." },
    { x:2150, y:2090, w:210, h:210, name:"DEEP JUNGLE GATE",    glowColor:"#333",       col:"#091009", desc:"The boundary of the known city. Beyond: uncharted growth.", locked:true },

    /* ── LOWER CITY (south-west) ── */
    { x: 620, y:1785, w:230, h:190, name:"LOWER CITY ENTRANCE",  glowColor:C.neonViolet, col:"#0a090d", desc:"Descend into the Lower City. Concrete tunnels and hidden workshops." },
    { x: 630, y:1995, w:210, h:175, name:"WORKSHOP 03",           glowColor:C.neonAmber,  col:"#0d0c0e", desc:"Prototype shop. Experiments in form and material under the city." },
    { x: 870, y:1890, w:190, h:190, name:"HIDDEN COURTYARD",      glowColor:C.acid,       col:"#090a0c", desc:"A forgotten plaza. Rain falls vertically here." },
  ];

  /* Street lights — generated along major arteries */
  const LIGHTS = [];

  function initLights() {
    LIGHTS.length = 0;
    /* Main N-S boulevard x ≈ 1480, 1730 */
    for (let y = 500; y < 2700; y += 180) {
      LIGHTS.push({ x:1465, y, col:C.acid    });
      LIGHTS.push({ x:1745, y, col:C.acid    });
    }
    /* Main E-W boulevard y ≈ 1460, 1745 */
    for (let x = 500; x < 2700; x += 180) {
      LIGHTS.push({ x, y:1455, col:C.glacier });
      LIGHTS.push({ x, y:1755, col:C.glacier });
    }
    /* Arrival Blvd northern cross y ≈ 620 */
    for (let x = 800; x < 2500; x += 200) {
      LIGHTS.push({ x, y:625, col:C.neonViolet });
    }
    /* Canopy district southern x ≈ 2055 */
    for (let y = 600; y < 2600; y += 200) {
      LIGHTS.push({ x:2055, y, col:C.neonGreen });
      LIGHTS.push({ x:570,  y, col:C.neonViolet });
    }
  }

  function initParticles() {
    DUST.length = 0;
    RAIN.length = 0;
    for (let i = 0; i < 80; i++) {
      DUST.push({
        x: Math.random() * WW, y: Math.random() * WH,
        vx:(Math.random()-0.5)*12, vy:(Math.random()-0.5)*12,
        r: 0.8 + Math.random()*1.8,
        a: 0.15 + Math.random()*0.45,
        col:[C.acid,C.glacier,C.neonViolet,C.neonCyan,C.neonGreen][Math.floor(Math.random()*5)],
        phase: Math.random()*Math.PI*2,
      });
    }
    for (let i = 0; i < 200; i++) {
      RAIN.push({
        x: Math.random()*WW, y: Math.random()*WH,
        len: 10 + Math.random()*20,
        spd: 300 + Math.random()*250,
        a: 0.06 + Math.random()*0.18,
      });
    }
  }

  /* ── Collision ── */
  function collides(px, py, r) {
    if (px < 180 || px > WW-180 || py < 180 || py > WH-180) return true;
    for (const b of BUILDINGS) {
      if (px+r > b.x && px-r < b.x+b.w && py+r > b.y && py-r < b.y+b.h) return true;
    }
    return false;
  }

  function nearestInteractable() {
    let best = null, bestD = 160;
    for (const b of BUILDINGS) {
      if (!b.interact) continue;
      const cx = b.x+b.w/2, cy = b.y+b.h/2;
      const d = Math.hypot(player.x-cx, player.y-cy);
      if (d < bestD) { bestD = d; best = b; }
    }
    return best;
  }

  function nearestBuilding() {
    let best = null, bestD = 230;
    for (const b of BUILDINGS) {
      const cx = b.x+b.w/2, cy = b.y+b.h/2;
      const d = Math.hypot(player.x-cx, player.y-cy);
      if (d < bestD) { bestD = d; best = b; }
    }
    return best;
  }

  /* ── Update ── */
  function update(dt) {
    t += dt;

    let dx=0, dy=0;
    if (keys["ArrowLeft"] ||keys["a"]||keys["A"]) dx-=1;
    if (keys["ArrowRight"]||keys["d"]||keys["D"]) dx+=1;
    if (keys["ArrowUp"]   ||keys["w"]||keys["W"]) dy-=1;
    if (keys["ArrowDown"] ||keys["s"]||keys["S"]) dy+=1;

    const len = Math.hypot(dx,dy);
    if (len>0){dx/=len;dy/=len;}
    player.moving = len>0;
    if (player.moving){
      player.facing = Math.atan2(dy,dx);
      player.walkPhase += dt*9;
    }

    const spd = player.speed*dt;
    const nx = player.x+dx*spd, ny = player.y+dy*spd;
    if (!collides(nx, player.y, 11)) player.x = nx;
    if (!collides(player.x, ny, 11)) player.y = ny;

    /* Camera lerp */
    const cx = Math.max(W/2, Math.min(WW-W/2, player.x));
    const cy = Math.max(H/2, Math.min(WH-H/2, player.y));
    cam.x += (cx-cam.x)*0.085;
    cam.y += (cy-cam.y)*0.085;

    /* Cat history trail */
    catHist.push({x:player.x, y:player.y});
    if (catHist.length > CAT_LAG*2) catHist.shift();
    const tgt = catHist[0]||{x:player.x+32, y:player.y+22};
    cat.x += (tgt.x-cat.x)*0.12;
    cat.y += (tgt.y-cat.y)*0.12;

    /* Rain */
    for (const r of RAIN){
      r.y += r.spd*dt; r.x -= r.spd*0.14*dt;
      if (r.y>WH){r.y=0;r.x=Math.random()*WW;}
      if (r.x<0) r.x=WW;
    }

    /* Dust */
    for (const p of DUST){
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.phase+=dt*1.2;
      if (p.x<0)p.x=WW; if (p.x>WW)p.x=0;
      if (p.y<0)p.y=WH; if (p.y>WH)p.y=0;
    }

    /* Interaction prompt */
    const ib = nearestInteractable();
    if (ib){
      interactionPrompt.textContent = `[E]  ENTER  —  ${ib.name}`;
      interactionPrompt.style.display="block";
    } else {
      interactionPrompt.style.display="none";
    }
  }

  /* ── Helpers ── */
  function ws(wx,wy){ return [wx-cam.x+W/2, wy-cam.y+H/2]; }

  function hexR(hex){ const n=parseInt(hex.replace('#',''),16); return (n>>16)&255; }
  function hexG(hex){ const n=parseInt(hex.replace('#',''),16); return (n>>8)&255; }
  function hexB(hex){ const n=parseInt(hex.replace('#',''),16); return n&255; }
  function glowStyle(hex,a){ return `rgba(${hexR(hex)},${hexG(hex)},${hexB(hex)},${a})`; }

  function lighten(hex, amt){
    const r=Math.min(255,hexR(hex)+(amt*255)|0);
    const g=Math.min(255,hexG(hex)+(amt*255)|0);
    const b=Math.min(255,hexB(hex)+(amt*255)|0);
    return `rgb(${r},${g},${b})`;
  }

  /* ── Drawing ── */
  function drawGround(){
    /* Sky-to-ground base */
    ctx.fillStyle = C.road;
    ctx.fillRect(0,0,W,H);

    ctx.save();
    ctx.translate(W/2-cam.x, H/2-cam.y);

    /* Sidewalk pads behind buildings */
    for (const b of BUILDINGS){
      ctx.fillStyle = C.sidewalk;
      ctx.fillRect(b.x-18, b.y-18, b.w+36, b.h+36);
    }

    /* Sidewalk edge lines */
    for (const b of BUILDINGS){
      ctx.strokeStyle = C.sidewalkEdge;
      ctx.lineWidth=1;
      ctx.strokeRect(b.x-18, b.y-18, b.w+36, b.h+36);
    }

    /* Wet road sheen — faint reflections of neon */
    const rsh = ctx.createLinearGradient(0,0,WW,WH);
    rsh.addColorStop(0,"rgba(0,245,228,0.012)");
    rsh.addColorStop(0.5,"rgba(181,204,69,0.008)");
    rsh.addColorStop(1,"rgba(155,93,229,0.012)");
    ctx.fillStyle=rsh;
    ctx.fillRect(0,0,WW,WH);

    /* Road centre dashes */
    ctx.save();
    ctx.setLineDash([22,16]);
    ctx.strokeStyle="rgba(255,255,255,0.035)";
    ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(1600,0); ctx.lineTo(1600,WH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,1600); ctx.lineTo(WW,1600); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* Plaza circle */
    const pg = ctx.createRadialGradient(1600,1600,0,1600,1600,240);
    pg.addColorStop(0,"rgba(25,22,42,0.95)");
    pg.addColorStop(0.55,"rgba(12,10,24,0.7)");
    pg.addColorStop(1,"transparent");
    ctx.fillStyle=pg;
    ctx.beginPath(); ctx.arc(1600,1600,240,0,Math.PI*2); ctx.fill();

    /* Plaza rings */
    for (let ri=50; ri<=210; ri+=40){
      const ra = 0.07 - ri*0.00028;
      ctx.strokeStyle=`rgba(181,204,69,${Math.max(0.01,ra)})`;
      ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(1600,1600,ri,0,Math.PI*2); ctx.stroke();
    }

    /* Plaza central fountain */
    const fc=ctx.createRadialGradient(1600,1600,0,1600,1600,32);
    fc.addColorStop(0,"rgba(110,206,206,0.35)");
    fc.addColorStop(0.6,"rgba(110,206,206,0.08)");
    fc.addColorStop(1,"transparent");
    ctx.fillStyle=fc;
    ctx.beginPath(); ctx.arc(1600,1600,32,0,Math.PI*2); ctx.fill();
    ctx.shadowColor=C.glacier; ctx.shadowBlur=20;
    ctx.strokeStyle=glowStyle(C.glacier,0.5);
    ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(1600,1600,28,0,Math.PI*2); ctx.stroke();
    ctx.shadowBlur=0;

    ctx.restore();
  }

  function drawStreetLights(){
    ctx.save();
    ctx.translate(W/2-cam.x, H/2-cam.y);

    for (const sl of LIGHTS){
      /* Skip if off-screen */
      const [sx,sy]=ws(sl.x,sl.y);
      if (sx<-80||sx>W+80||sy<-80||sy>H+80) continue;

      /* Ground pool */
      const pool=ctx.createRadialGradient(sl.x,sl.y,0,sl.x,sl.y,70);
      pool.addColorStop(0,glowStyle(sl.col,0.12));
      pool.addColorStop(1,"transparent");
      ctx.fillStyle=pool;
      ctx.beginPath(); ctx.arc(sl.x,sl.y,70,0,Math.PI*2); ctx.fill();

      /* Post */
      ctx.fillStyle="#181b22";
      ctx.fillRect(sl.x-1.5, sl.y-34, 3, 36);

      /* Head */
      ctx.fillStyle="#22252e";
      ctx.fillRect(sl.x-7, sl.y-38, 14, 5);

      /* Bulb glow */
      ctx.shadowColor=sl.col; ctx.shadowBlur=18;
      ctx.fillStyle=sl.col;
      ctx.beginPath(); ctx.arc(sl.x, sl.y-36, 3.5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
    }

    ctx.restore();
  }

  function drawDust(){
    ctx.save();
    ctx.translate(W/2-cam.x, H/2-cam.y);
    for (const p of DUST){
      const [sx,sy]=ws(p.x,p.y);
      if (sx<-10||sx>W+10||sy<-10||sy>H+10) continue;
      const a=p.a*Math.abs(Math.sin(p.phase));
      ctx.globalAlpha=Math.max(0,a);
      ctx.shadowColor=p.col; ctx.shadowBlur=10;
      ctx.fillStyle=p.col;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1; ctx.shadowBlur=0;
    ctx.restore();
  }

  function drawBuildings(){
    ctx.save();
    ctx.translate(W/2-cam.x, H/2-cam.y);

    for (const b of BUILDINGS){
      const [sx,sy]=ws(b.x+b.w/2, b.y+b.h/2);
      if (sx<-300||sx>W+300||sy<-300||sy>H+300) continue;

      const glow = b.locked ? "#3a3a3a" : b.glowColor;
      const alpha = b.locked ? 0.45 : 1;
      ctx.globalAlpha=alpha;

      /* Drop shadow */
      ctx.shadowBlur=0;
      ctx.fillStyle="rgba(0,0,0,0.55)";
      ctx.fillRect(b.x+7, b.y+9, b.w, b.h);

      /* Wall body */
      const wg=ctx.createLinearGradient(b.x,b.y, b.x+b.w,b.y+b.h);
      wg.addColorStop(0, b.col);
      wg.addColorStop(1, lighten(b.col, 0.045));
      ctx.fillStyle=wg;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      /* Roof edge */
      ctx.fillStyle=lighten(b.col, 0.14);
      ctx.fillRect(b.x, b.y, b.w, 3);

      /* Side edge (right face) */
      ctx.fillStyle=lighten(b.col, 0.06);
      ctx.fillRect(b.x+b.w-3, b.y, 3, b.h);

      /* Neon border glow (box shadow equivalent) */
      ctx.shadowColor=glow; ctx.shadowBlur=22;
      ctx.strokeStyle=glowStyle(glow,0.55);
      ctx.lineWidth=1;
      ctx.strokeRect(b.x,b.y,b.w,b.h);

      /* Top neon accent line */
      ctx.shadowBlur=28;
      ctx.strokeStyle=glow;
      ctx.lineWidth=1.5;
      ctx.beginPath();
      ctx.moveTo(b.x+2,  b.y+0.75);
      ctx.lineTo(b.x+b.w-2, b.y+0.75);
      ctx.stroke();
      ctx.shadowBlur=0;

      /* Windows */
      drawWindows(b, glow);

      /* Neon sign */
      drawSign(b, glow);

      ctx.globalAlpha=1;
    }

    ctx.restore();
  }

  function drawWindows(b, glow){
    const ww=8, wh=6, gx=14, gy=14;
    const cols=Math.max(1, Math.floor((b.w-24)/( ww+gx)));
    const rows=Math.max(1, Math.floor((b.h-28)/(wh+gy)));
    const sx0=b.x+12, sy0=b.y+22;

    for (let row=0;row<rows;row++){
      for (let col=0;col<cols;col++){
        const wx=sx0+col*(ww+gx);
        const wy=sy0+row*(wh+gy);
        /* Deterministic flicker based on position + slow time */
        const lit=Math.sin(wx*0.28+wy*0.19+t*0.35+row*1.7+col*2.3)>0.05;
        if (lit){
          ctx.fillStyle=glowStyle(glow, 0.45);
          ctx.shadowColor=glow; ctx.shadowBlur=8;
          ctx.fillRect(wx,wy,ww,wh);
          ctx.shadowBlur=0;
        } else {
          ctx.fillStyle="rgba(0,0,0,0.85)";
          ctx.fillRect(wx,wy,ww,wh);
        }
      }
    }
  }

  function drawSign(b, glow){
    const cx=b.x+b.w/2;
    const cy=b.y-6;

    ctx.save();
    ctx.shadowColor=glow; ctx.shadowBlur=18;
    ctx.fillStyle=glow;
    ctx.textAlign="center"; ctx.textBaseline="bottom";

    /* Wrap to 2 lines max */
    const fs=Math.min(8.5, b.w/(b.name.length*0.72));
    ctx.font=`700 ${fs}px "Courier New",monospace`;

    const words=b.name.split(" ");
    const lines=[];
    let line="";
    for (const w of words){
      const test=line?`${line} ${w}`:w;
      if (test.length>17 && line){ lines.push(line); line=w; } else line=test;
    }
    if (line) lines.push(line);

    const lh=fs+3;
    const totalH=lines.length*lh;
    for (let i=0;i<lines.length;i++){
      ctx.fillText(lines[i], cx, cy - totalH + (i+1)*lh);
    }

    /* Dot indicator */
    ctx.shadowBlur=14;
    ctx.beginPath();
    ctx.arc(cx, cy-totalH-5, 2.5, 0, Math.PI*2);
    ctx.fill();

    /* If interactable: small arrow hint */
    if (b.interact && !b.locked){
      ctx.shadowBlur=10;
      ctx.font=`600 7px "Courier New",monospace`;
      ctx.fillStyle=C.acid;
      ctx.fillText("↑ ENTER", cx, cy-totalH-13);
    }

    ctx.restore();
  }

  function drawRain(){
    ctx.save();
    ctx.translate(W/2-cam.x, H/2-cam.y);
    ctx.lineWidth=0.9;
    for (const r of RAIN){
      const [sx,sy]=ws(r.x,r.y);
      if (sx<-30||sx>W+30||sy<-30||sy>H+30) continue;
      ctx.strokeStyle=`rgba(180,220,255,${r.a})`;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - r.len*0.14, r.y+r.len);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer(){
    const [sx,sy]=ws(player.x, player.y);
    ctx.save();
    ctx.translate(sx,sy);

    /* Ground shadow */
    ctx.fillStyle="rgba(0,0,0,0.38)";
    ctx.beginPath(); ctx.ellipse(0,8,9,3.5,0,0,Math.PI*2); ctx.fill();

    const bob = player.moving ? Math.sin(player.walkPhase)*1.8 : 0;
    const lp  = player.moving ? player.walkPhase : 0;

    /* Legs */
    ctx.fillStyle="#4a2c4e"; /* plum pants */
    ctx.fillRect(-5, 5+bob, 4, 9+Math.sin(lp)*3.5);
    ctx.fillRect( 1, 5+bob, 4, 9-Math.sin(lp)*3.5);

    /* Shoes */
    ctx.fillStyle="#1a1a22";
    ctx.fillRect(-6,14+bob+Math.sin(lp)*3.5,  5,3);
    ctx.fillRect( 1, 14+bob-Math.sin(lp)*3.5, 5,3);

    /* Torso */
    ctx.fillStyle=C.acid+"cc";  /* acid-lime crop top */
    ctx.fillRect(-6,-2+bob,12,8);

    /* Skin */
    ctx.fillStyle=C.skin;

    /* Arms */
    ctx.fillRect(-9,-1+bob, 4, 7+Math.sin(lp)*2);
    ctx.fillRect( 6,-1+bob, 4, 7-Math.sin(lp)*2);

    /* Neck */
    ctx.fillRect(-2,-5+bob,4,4);

    /* Head */
    ctx.beginPath();
    ctx.ellipse(0,-12+bob, 6.5,7.5, 0,0,Math.PI*2);
    ctx.fill();

    /* Hair — dark wavy */
    ctx.fillStyle="#2c1810";
    /* Top mass */
    ctx.beginPath();
    ctx.ellipse(0,-17+bob, 7,5, 0, Math.PI,0);
    ctx.fill();
    /* Left wave */
    ctx.strokeStyle="#2c1810"; ctx.lineWidth=3.5;
    ctx.beginPath();
    ctx.moveTo(-5,-14+bob);
    ctx.bezierCurveTo(-8,-10+bob,-10,-7+bob,-9,-3+bob);
    ctx.stroke();
    /* Right wave */
    ctx.beginPath();
    ctx.moveTo(5,-14+bob);
    ctx.bezierCurveTo(8,-10+bob,10,-7+bob,9,-3+bob);
    ctx.stroke();
    /* Centre curl */
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(-2,-20+bob);
    ctx.bezierCurveTo(0,-23+bob,2,-23+bob,3,-20+bob);
    ctx.stroke();

    /* Eyes — white then dark */
    ctx.fillStyle="#fff";
    ctx.fillRect(-4,-14+bob, 3,2);
    ctx.fillRect( 1,-14+bob, 3,2);
    ctx.fillStyle="#111";
    ctx.fillRect(-3,-14+bob, 2,2);
    ctx.fillRect( 2,-14+bob, 2,2);
    /* Highlight */
    ctx.fillStyle="#fff";
    ctx.fillRect(-2,-14+bob,1,1);
    ctx.fillRect( 3,-14+bob,1,1);

    /* Acid neon aura when near an interactable */
    const ib = nearestInteractable();
    if (ib){
      ctx.shadowColor=C.acid; ctx.shadowBlur=28;
      ctx.strokeStyle=glowStyle(C.acid,0.35);
      ctx.lineWidth=2;
      ctx.beginPath(); ctx.ellipse(0,-2+bob,14,16,0,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
    }

    ctx.restore();
  }

  function drawCat(){
    const [sx,sy]=ws(cat.x, cat.y);
    ctx.save();
    ctx.translate(sx,sy);

    /* Shadow */
    ctx.fillStyle="rgba(0,0,0,0.28)";
    ctx.beginPath(); ctx.ellipse(0,6,5.5,2,0,0,Math.PI*2); ctx.fill();

    /* Body */
    ctx.fillStyle="#111";
    ctx.beginPath(); ctx.ellipse(0,2,5.5,4,0,0,Math.PI*2); ctx.fill();

    /* Head */
    ctx.beginPath(); ctx.ellipse(0,-6,4.5,4.5,0,0,Math.PI*2); ctx.fill();

    /* Ears */
    ctx.fillStyle="#111";
    ctx.beginPath(); ctx.moveTo(-3,-9); ctx.lineTo(-6,-13); ctx.lineTo(-0.5,-10); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo( 3,-9); ctx.lineTo( 6,-13); ctx.lineTo( 0.5,-10); ctx.closePath(); ctx.fill();

    /* Cyan eyes */
    ctx.shadowColor=C.glacier; ctx.shadowBlur=12;
    ctx.fillStyle=C.glacier;
    ctx.fillRect(-3.5,-7.5, 2.5,2);
    ctx.fillRect( 1,  -7.5, 2.5,2);
    ctx.shadowBlur=0;

    /* Whiskers */
    ctx.strokeStyle=glowStyle(C.glacier,0.45); ctx.lineWidth=0.7;
    for(const [x1,y1,x2,y2] of [[-2,-6,-8,-5],[-2,-6,-8,-7],[2,-6,8,-5],[2,-6,8,-7]]){
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    }

    /* Tail */
    ctx.strokeStyle="#1a1a1a"; ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(4,4);
    ctx.bezierCurveTo(12,0,13,-7,8,-9);
    ctx.stroke();

    ctx.restore();
  }

  function drawFog(){
    /* Radial vignette */
    const vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.22,W/2,H/2,Math.max(W,H)*0.82);
    vg.addColorStop(0,"transparent");
    vg.addColorStop(1,"rgba(4,5,9,0.8)");
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);

    /* Top atmospheric haze */
    const tg=ctx.createLinearGradient(0,0,0,H*0.28);
    tg.addColorStop(0,"rgba(5,6,16,0.65)");
    tg.addColorStop(1,"transparent");
    ctx.fillStyle=tg; ctx.fillRect(0,0,W,H*0.28);

    /* Scanlines */
    ctx.fillStyle="rgba(0,0,0,0.035)";
    for (let y=0;y<H;y+=3) ctx.fillRect(0,y,W,1);
  }

  function drawMinimap(){
    const mW=110, mH=110, mX=W-mW-16, mY=52;
    const s=mW/WW;

    ctx.save();
    ctx.globalAlpha=0.88;
    ctx.fillStyle="rgba(4,5,10,0.92)";
    ctx.strokeStyle=glowStyle(C.acid,0.25); ctx.lineWidth=1;
    ctx.fillRect(mX,mY,mW,mH);
    ctx.strokeRect(mX,mY,mW,mH);

    for (const b of BUILDINGS){
      ctx.fillStyle=b.locked ? "#222" : glowStyle(b.glowColor,0.35);
      ctx.fillRect(mX+b.x*s, mY+b.y*s, Math.max(2,b.w*s), Math.max(2,b.h*s));
    }

    /* Player dot */
    ctx.shadowColor=C.acid; ctx.shadowBlur=8;
    ctx.fillStyle=C.acid;
    ctx.beginPath();
    ctx.arc(mX+player.x*s, mY+player.y*s, 3,0,Math.PI*2);
    ctx.fill();
    ctx.shadowBlur=0;

    /* Label */
    ctx.fillStyle=glowStyle(C.acid,0.35);
    ctx.font="6.5px 'Courier New',monospace";
    ctx.textAlign="left";
    ctx.fillText("COMPOUND WORLD", mX+4, mY+mH-5);

    ctx.globalAlpha=1;
    ctx.restore();
  }

  function drawInfoPanel(){
    const nb=nearestBuilding();
    if (!nb) return;

    const [bsx] = ws(nb.x+nb.w/2, nb.y);
    const bsy = ws(nb.x+nb.w/2, nb.y)[1];

    ctx.save();
    const maxW=230;
    ctx.font="8px 'Courier New',monospace";
    ctx.textAlign="center";

    /* Word-wrap desc */
    const words=nb.desc.split(" ");
    const lines=[]; let curr="";
    for (const w of words){
      const test=curr?`${curr} ${w}`:w;
      if (ctx.measureText(test).width>maxW-24){lines.push(curr);curr=w;}
      else curr=test;
    }
    if (curr) lines.push(curr);

    const boxH=lines.length*12+26;
    const boxX=Math.max(10,Math.min(W-maxW-10, bsx-maxW/2));
    const boxY=Math.max(10, bsy-boxH-18);

    /* Panel */
    ctx.fillStyle="rgba(4,5,10,0.93)";
    ctx.strokeStyle=nb.locked?"rgba(80,80,80,0.5)":glowStyle(nb.glowColor,0.45);
    ctx.lineWidth=1;
    ctx.fillRect(boxX,boxY,maxW,boxH);
    ctx.strokeRect(boxX,boxY,maxW,boxH);

    /* Name */
    ctx.fillStyle=nb.locked?"#666":nb.glowColor;
    ctx.shadowColor=nb.locked?"transparent":nb.glowColor;
    ctx.shadowBlur=nb.locked?0:14;
    ctx.font=`700 8px 'Courier New',monospace`;
    ctx.fillText(nb.name, boxX+maxW/2, boxY+14);
    ctx.shadowBlur=0;

    /* Desc lines */
    ctx.fillStyle="rgba(237,228,216,0.5)";
    ctx.font="7.5px 'Courier New',monospace";
    for (let i=0;i<lines.length;i++){
      ctx.fillText(lines[i], boxX+maxW/2, boxY+24+i*12);
    }

    ctx.restore();
  }

  function drawHUD(){
    /* Top-left title */
    ctx.save();
    ctx.font="700 9px 'Courier New',monospace";
    ctx.textAlign="left";
    ctx.shadowColor=C.acid; ctx.shadowBlur=12;
    ctx.fillStyle=C.acid;
    ctx.fillText("COMPOUND", 20, 34);
    ctx.shadowBlur=0;
    ctx.fillStyle="rgba(237,228,216,0.3)";
    ctx.fillText("UNIVERSE", 95, 34);
    ctx.restore();

    /* Controls hint */
    ctx.save();
    ctx.font="7.5px 'Courier New',monospace";
    ctx.textAlign="center";
    ctx.fillStyle="rgba(237,228,216,0.18)";
    ctx.fillText("WASD · ARROWS TO MOVE   E TO ENTER LOCATIONS   ESC TO EXIT", W/2, H-14);
    ctx.restore();
  }

  /* ── Main loop ── */
  function frame(now){
    const dt=Math.min((now-lastNow)/1000, 0.05);
    lastNow=now;
    update(dt);

    ctx.clearRect(0,0,W,H);
    drawGround();
    drawStreetLights();
    drawDust();
    drawBuildings();
    drawRain();
    drawCat();
    drawPlayer();
    drawFog();
    drawInfoPanel();
    drawMinimap();
    drawHUD();

    raf=requestAnimationFrame(frame);
  }

  /* ── Input ── */
  function onKeyDown(e){
    keys[e.key]=true;
    if (e.key==="Escape") stop();
    if ((e.key==="e"||e.key==="E")){
      const ib=nearestInteractable();
      if (ib?.link){ setTimeout(()=>{stop();window.location.href=ib.link;},300); }
    }
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)){
      e.preventDefault();
    }
  }
  function onKeyUp(e){ keys[e.key]=false; }

  /* ── Setup ── */
  function setup(){
    root=document.createElement("div");
    root.id="cu-root";
    Object.assign(root.style,{
      position:"fixed",inset:"0",zIndex:"99998",
      background:C.bg,overflow:"hidden",
    });

    canvas=document.createElement("canvas");
    Object.assign(canvas.style,{display:"block",width:"100%",height:"100%"});
    root.appendChild(canvas);
    ctx=canvas.getContext("2d");

    /* Interaction prompt */
    interactionPrompt=document.createElement("div");
    Object.assign(interactionPrompt.style,{
      position:"absolute",bottom:"70px",left:"50%",
      transform:"translateX(-50%)",
      background:"rgba(0,0,0,0.88)",
      border:`1px solid ${C.acid}`,
      color:C.acid,
      fontFamily:"'Courier New',monospace",
      fontSize:"10px",letterSpacing:"0.22em",
      padding:"8px 22px",textTransform:"uppercase",
      display:"none",pointerEvents:"none",whiteSpace:"nowrap",
      boxShadow:`0 0 20px ${C.acid}44`,
    });
    root.appendChild(interactionPrompt);

    /* Exit button */
    const exitBtn=document.createElement("button");
    exitBtn.textContent="✕  EXIT";
    Object.assign(exitBtn.style,{
      position:"absolute",top:"14px",right:"16px",
      background:"rgba(0,0,0,0.55)",
      border:"1px solid rgba(237,228,216,0.15)",
      color:"rgba(237,228,216,0.45)",
      fontFamily:"'Courier New',monospace",
      fontSize:"9px",letterSpacing:"0.2em",
      padding:"6px 14px",cursor:"pointer",
    });
    exitBtn.onclick=stop;
    root.appendChild(exitBtn);

    /* Mobile d-pad */
    if (/Mobi|Android|Touch/i.test(navigator.userAgent)||window.innerWidth<768){
      buildDpad(root);
    }

    document.body.appendChild(root);
    resize();
    window.addEventListener("resize",resize);
  }

  function buildDpad(container){
    const pad=document.createElement("div");
    Object.assign(pad.style,{
      position:"absolute",bottom:"50px",right:"24px",
      display:"flex",flexDirection:"column",
      alignItems:"center",gap:"4px",zIndex:"10",
    });

    const mkBtn=(lbl,key)=>{
      const b=document.createElement("button");
      b.textContent=lbl;
      Object.assign(b.style,{
        width:"46px",height:"46px",
        background:"rgba(0,0,0,0.55)",
        border:`1px solid ${glowStyle(C.acid,0.3)}`,
        color:C.acid,borderRadius:"6px",
        fontSize:"16px",cursor:"pointer",touchAction:"none",
      });
      b.addEventListener("touchstart",e=>{e.preventDefault();keys[key]=true;},{passive:false});
      b.addEventListener("touchend",  e=>{e.preventDefault();keys[key]=false;},{passive:false});
      b.addEventListener("mousedown",()=>keys[key]=true);
      b.addEventListener("mouseup",  ()=>keys[key]=false);
      return b;
    };

    const r0=document.createElement("div");
    r0.appendChild(mkBtn("▲","ArrowUp"));
    const r1=document.createElement("div");
    Object.assign(r1.style,{display:"flex",gap:"4px"});
    r1.appendChild(mkBtn("◀","ArrowLeft"));
    r1.appendChild(mkBtn("▼","ArrowDown"));
    r1.appendChild(mkBtn("▶","ArrowRight"));
    pad.appendChild(r0); pad.appendChild(r1);
    container.appendChild(pad);
  }

  function resize(){
    if (!canvas) return;
    W=canvas.offsetWidth; H=canvas.offsetHeight;
    canvas.width=W; canvas.height=H;
  }

  /* ── Public API ── */
  function start(){
    if (active) return;
    active=true;

    prevOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";

    setup();
    initLights();
    initParticles();

    player.x=1600; player.y=1700;
    cat.x=1565; cat.y=1730; catHist.length=0;
    cam.x=1600; cam.y=1700;

    window.addEventListener("keydown",onKeyDown);
    window.addEventListener("keyup",  onKeyUp);

    lastNow=performance.now();
    raf=requestAnimationFrame(frame);
  }

  function stop(){
    if (!active) return;
    active=false;

    cancelAnimationFrame(raf); raf=null;
    window.removeEventListener("keydown",onKeyDown);
    window.removeEventListener("keyup",  onKeyUp);
    window.removeEventListener("resize", resize);

    document.body.style.overflow=prevOverflow;
    if (root){ root.remove(); root=null; canvas=null; ctx=null; }

    window.dispatchEvent(new CustomEvent("compound-universe:exit"));
  }

  window.CompoundUniverse={
    get active(){ return active; },
    start, stop,
    debug:()=>console.log({player,cam,t,buildingCount:BUILDINGS.length}),
  };
})();
