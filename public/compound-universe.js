/* ================================================================
   COMPOUND'S UNIVERSE — playable isometric pixel town
   Launched by the cyberpunk toggle button (cyberpunk-toggle.js).
   Exposes window.CompoundUniverse = { start, stop, active }.
   No libraries. One RAF loop. Static town pre-rendered offscreen;
   only lights, particles, holograms and the character redraw.
================================================================ */
(function () {
  "use strict";
  if (window.CompoundUniverse) return;

  /* ── Brand palette (globals.css) ── */
  const C = {
    molten: "#CC4A12",
    jungle: "#1B3A2D",
    plum: "#3D2645",
    glacier: "#6ECECE",
    linen: "#EDE4D8",
    terra: "#8B3A1E",
    acid: "#B5CC45",
    yellow: "#ffff02",
    cobalt: "#0047AB",
    night: "#05060a",
    nightHi: "#11101c",
    stoneA: "#3a3d42",
    stoneB: "#45484e",
    stoneC: "#50545b",
    gap: "#222428",
    mossA: "#1B3A2D",
    mossB: "#2a5240",
    wallA: "#2e2937",
    wallB: "#3a3344",
    slate: "#1d2026",
    slateHi: "#272b33",
    flameCore: "#ffd24a",
    flameMid: "#ff8c2e",
    windowWarm: "#ffb35c",
  };

  /* ── Module state ── */
  let active = false;
  let root = null, screen = null, sctx = null;
  let buf = null, bctx = null;          // low-res draw buffer
  let ground = null;                    // pre-rendered static town
  let raf = null, lastNow = 0, t = 0;
  let W = 0, H = 0, S = 3, BW = 0, BH = 0;
  let ox = 0, oy = 0, tw = 24, th = 12, R = 9;
  let drawables = [], torches = [], blinkers = [], billboards = [];
  let buildings = [], embers = [], flies = [];
  let monument = null;
  let keys = {}, resizeTimer = null, prevOverflow = "";
  let hintEl = null, promptEl = null, nearBuilding = null;

  const player = { x: 0, y: 0, z: 0, vz: 0, face: 1, phase: 0, moving: false };

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
      return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    };
  }

  const iso = (gx, gy) => [ox + (gx - gy) * tw / 2, oy + (gx + gy) * th / 2];

  /* ════════════════════════════════════════════════════════════
     SPRITES — each building/prop rendered once to its own canvas
  ════════════════════════════════════════════════════════════ */
  function sprite(w, h, fn) {
    const c = document.createElement("canvas");
    c.width = Math.ceil(w); c.height = Math.ceil(h);
    fn(c.getContext("2d"), c.width, c.height);
    return c;
  }

  /* Iso box at local front-corner F=(fx,fy). a = depth toward
     back-left, b = width toward back-right, h = wall height. */
  function isoBox(g, fx, fy, a, b, h, leftCol, rightCol, topCol) {
    const L = [fx - a, fy - a / 2], Rr = [fx + b, fy - b / 2],
          B = [fx + b - a, fy - (a + b) / 2];
    g.fillStyle = leftCol;
    poly(g, [[fx, fy], L, [L[0], L[1] - h], [fx, fy - h]]);
    g.fillStyle = rightCol;
    poly(g, [[fx, fy], Rr, [Rr[0], Rr[1] - h], [fx, fy - h]]);
    g.fillStyle = topCol;
    poly(g, [[fx, fy - h], [L[0], L[1] - h], [B[0], B[1] - h], [Rr[0], Rr[1] - h]]);
    return { L, R: Rr, B };
  }

  function poly(g, pts) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath(); g.fill();
  }

  function wallNoise(g, x, y, w, h, rng, light) {
    g.fillStyle = light ? "rgba(237,228,216,.05)" : "rgba(0,0,0,.14)";
    for (let i = 0; i < (w * h) / 26; i++)
      g.fillRect(x + (rng() * w | 0), y + (rng() * h | 0), 1 + (rng() * 2 | 0), 1);
  }

  /* Upright window on the right-hand wall. */
  function warmWindow(g, x, y, w, h, lit, cyan) {
    if (lit) {
      const col = cyan ? C.glacier : C.windowWarm;
      g.fillStyle = cyan ? "rgba(110,206,206,.20)" : "rgba(204,74,18,.25)";
      g.fillRect(x - 2, y - 2, w + 4, h + 4);            /* baked halo */
      g.fillStyle = col; g.fillRect(x, y, w, h);
      g.fillStyle = cyan ? "#d8ffff" : "#ffe9b0";
      g.fillRect(x + 1, y + 1, Math.max(1, w - 3), 1);
    } else {
      g.fillStyle = "#15161c"; g.fillRect(x, y, w, h);
      g.fillStyle = "rgba(110,206,206,.16)"; g.fillRect(x, y, w, 1);
    }
    g.fillStyle = "rgba(0,0,0,.5)";
    g.fillRect(x - 1, y - 1, w + 2, 1); g.fillRect(x - 1, y + h, w + 2, 1);
  }

  function doorArch(g, x, y, w, h) {
    g.fillStyle = "#0c0d11"; g.fillRect(x, y - h, w, h);
    const grad = g.createLinearGradient(0, y - h, 0, y);
    grad.addColorStop(0, "rgba(204,74,18,.10)");
    grad.addColorStop(1, "rgba(255,179,92,.55)");
    g.fillStyle = grad; g.fillRect(x + 1, y - h + 2, w - 2, h - 2);
    g.fillStyle = C.terra; g.fillRect(x - 1, y - h - 1, w + 2, 1);
    g.fillStyle = "#101116"; g.fillRect(x - 1, y, w + 2, 2); /* step */
  }

  function neonLine(g, x1, y1, x2, y2, col, glow) {
    g.strokeStyle = glow; g.lineWidth = 3; g.globalAlpha = .35;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  }

  function vines(g, x, y, h, rng) {
    for (let v = 0; v < 2; v++) {
      let vx = x + v * 3;
      g.fillStyle = v ? C.mossB : C.mossA;
      for (let yy = 0; yy < h; yy++) {
        if (rng() < .2) vx += rng() < .5 ? -1 : 1;
        g.fillRect(vx, y - yy, 1, 1);
        if (rng() < .25) {
          g.fillStyle = rng() < .25 ? C.acid : C.mossB;
          g.fillRect(vx + (rng() < .5 ? -1 : 1), y - yy, 1, 1);
          g.fillStyle = v ? C.mossB : C.mossA;
        }
      }
    }
  }

  /* ── THE ARCHIVE — grand gabled hall ── */
  function archiveSprite(rng) {
    const a = 26, b = 34, h = 34, rise = 13, pad = 8;
    const w = a + b + pad * 2, hh = h + (a + b) / 2 + rise + pad * 2;
    const ax = a + pad, ay = hh - pad;
    const cv = sprite(w, hh, (g) => {
      const F = [ax, ay];
      isoBox(g, F[0], F[1], a, b, h, C.wallA, C.wallB, C.slate);
      wallNoise(g, F[0] - a, F[1] - a / 2 - h, a, h, rng, false);
      wallNoise(g, F[0], F[1] - h, b, h, rng, true);
      /* gable roof, ridge along the right axis */
      const Fp = [F[0], F[1] - h], Lp = [F[0] - a, F[1] - a / 2 - h],
            Rp = [F[0] + b, F[1] - b / 2 - h], Bp = [F[0] + b - a, F[1] - (a + b) / 2 - h];
      const G1 = [(Fp[0] + Lp[0]) / 2, (Fp[1] + Lp[1]) / 2 - rise];
      const G2 = [(Rp[0] + Bp[0]) / 2, (Rp[1] + Bp[1]) / 2 - rise];
      g.fillStyle = C.slateHi; poly(g, [Fp, Rp, G2, G1]);          /* front plane */
      g.fillStyle = C.slate;   poly(g, [Lp, Bp, G2, G1]);          /* back sliver */
      g.fillStyle = C.wallA;   poly(g, [Fp, Lp, G1]);              /* gable end */
      neonLine(g, G1[0], G1[1], G2[1] === G2[1] ? G2[0] : G2[0], G2[1], "#3a7bff", C.cobalt);
      neonLine(g, Fp[0], Fp[1], Rp[0], Rp[1], C.glacier, C.glacier);
      /* attic rune */
      g.fillStyle = C.molten; g.fillRect(G1[0] - 1, G1[1] + 6, 3, 3);
      /* windows: two floors on the right wall */
      for (let i = 0; i < 3; i++) {
        const k = .18 + i * .3, wx = F[0] + b * k, wy0 = F[1] - b * k / 2;
        warmWindow(g, wx, wy0 - 26, 4, 5, true, i === 1);
        warmWindow(g, wx, wy0 - 15, 4, 5, i !== 2, false);
      }
      /* left-wall windows */
      warmWindow(g, F[0] - a * .62, F[1] - a * .31 - 24, 3, 4, true, false);
      doorArch(g, F[0] + b * .42, F[1] - b * .21, 6, 10);
      /* "01" plate near roof, like the reference hub */
      g.fillStyle = "#0c0d11"; g.fillRect(F[0] + b * .42, F[1] - b * .21 - 30, 9, 7);
      g.fillStyle = C.molten; g.font = "6px monospace"; g.textBaseline = "top";
      g.fillText("01", F[0] + b * .42 + 1, F[1] - b * .21 - 29);
      vines(g, F[0] - a + 2, F[1] - a / 2 - 1, h - 4, rng);
    });
    return { cv, ax, ay, doorK: .45,
      lights: [[b * .30, -b * .15 - 7], [b * .62, -b * .31 - 7]] };
  }

  /* ── TEXTILE FORGE — wide workshop, open glowing front ── */
  function forgeSprite(rng) {
    const a = 18, b = 40, h = 20, pad = 8;
    const w = a + b + pad * 2, hh = h + (a + b) / 2 + 14 + pad * 2;
    const ax = a + pad, ay = hh - pad;
    const cv = sprite(w, hh, (g) => {
      const F = [ax, ay];
      isoBox(g, F[0], F[1], a, b, h, "#4a2417", C.terra, C.slate);
      wallNoise(g, F[0] - a, F[1] - a / 2 - h, a, h, rng, false);
      wallNoise(g, F[0], F[1] - h, b, h, rng, false);
      /* parapet + glacier trim */
      const Fp = [F[0], F[1] - h], Lp = [F[0] - a, F[1] - a / 2 - h],
            Rp = [F[0] + b, F[1] - b / 2 - h];
      neonLine(g, Fp[0], Fp[1], Rp[0], Rp[1], C.glacier, C.glacier);
      neonLine(g, Fp[0], Fp[1], Lp[0], Lp[1], "rgba(110,206,206,.5)", C.glacier);
      /* chimney on the roof, molten mouth */
      const chx = F[0] + b * .72 - a * .55, chy = F[1] - (a + b * .72) / 2 - h + 6;
      isoBox(g, chx, chy, 5, 5, 9, "#3a1c10", "#5e2a18", "#1a0d08");
      g.fillStyle = C.molten; g.fillRect(chx - 3, chy - 13, 6, 2);
      g.fillStyle = C.flameMid; g.fillRect(chx - 2, chy - 13, 4, 1);
      /* wide open front with hot interior + loom/anvil silhouette */
      const ox0 = F[0] + b * .18, oy0 = F[1] - b * .09;
      g.fillStyle = "#0a0608"; g.fillRect(ox0, oy0 - 14, 16, 14);
      const grad = g.createLinearGradient(0, oy0 - 14, 0, oy0);
      grad.addColorStop(0, "rgba(204,74,18,.25)");
      grad.addColorStop(1, "rgba(255,140,46,.8)");
      g.fillStyle = grad; g.fillRect(ox0 + 1, oy0 - 13, 14, 13);
      g.fillStyle = "#0a0608";                       /* loom frame + anvil */
      g.fillRect(ox0 + 3, oy0 - 11, 1, 9); g.fillRect(ox0 + 9, oy0 - 11, 1, 9);
      g.fillRect(ox0 + 3, oy0 - 11, 7, 1); g.fillRect(ox0 + 4, oy0 - 7, 5, 1);
      g.fillRect(ox0 + 12, oy0 - 4, 3, 2); g.fillRect(ox0 + 13, oy0 - 2, 1, 2);
      warmWindow(g, F[0] + b * .8, F[1] - b * .4 - 13, 4, 4, true, false);
      vines(g, F[0] - a + 2, F[1] - a / 2 - 1, h - 3, rng);
    });
    return { cv, ax, ay, doorK: .38,
      lights: [[b * .08, -b * .04 - 7], [b * .62, -b * .31 - 7]],
      ember: [b * .72 - 18 * .55, -(18 + b * .72) / 2 - 20 + 6] };
  }

  /* ── THE ATELIER — tall studio, cyan glass, antenna ── */
  function atelierSprite(rng) {
    const a = 20, b = 22, h = 40, pad = 10;
    const w = a + b + pad * 2, hh = h + (a + b) / 2 + 14 + pad * 2;
    const ax = a + pad, ay = hh - pad;
    const cv = sprite(w, hh, (g) => {
      const F = [ax, ay];
      isoBox(g, F[0], F[1], a, b, h, "#2c1d33", C.plum, C.slate);
      wallNoise(g, F[0] - a, F[1] - a / 2 - h, a, h, rng, false);
      wallNoise(g, F[0], F[1] - h, b, h, rng, true);
      const Fp = [F[0], F[1] - h], Lp = [F[0] - a, F[1] - a / 2 - h],
            Rp = [F[0] + b, F[1] - b / 2 - h];
      /* parapet */
      g.fillStyle = "#231828";
      poly(g, [[Fp[0], Fp[1] - 2], [Lp[0], Lp[1] - 2], [Lp[0], Lp[1]], [Fp[0], Fp[1]]]);
      poly(g, [[Fp[0], Fp[1] - 2], [Rp[0], Rp[1] - 2], [Rp[0], Rp[1]], [Fp[0], Fp[1]]]);
      neonLine(g, Fp[0], Fp[1] - 2, Rp[0], Rp[1] - 2, "#3a7bff", C.cobalt);
      neonLine(g, Fp[0], Fp[1] - 2, Lp[0], Lp[1] - 2, "rgba(58,123,255,.5)", C.cobalt);
      /* cyan studio glass grid */
      for (let r = 0; r < 3; r++)
        for (let i = 0; i < 2; i++) {
          const k = .2 + i * .42, wx = F[0] + b * k, wy0 = F[1] - b * k / 2;
          warmWindow(g, wx, wy0 - 34 + r * 10, 5, 6, !(r === 2 && i === 0), true);
        }
      /* molten awning over the door */
      const dk = .42, dx = F[0] + b * dk, dy = F[1] - b * dk / 2;
      doorArch(g, dx, dy, 5, 9);
      for (let s = 0; s < 4; s++) {
        g.fillStyle = s % 2 ? C.molten : C.linen;
        g.fillRect(dx - 2 + s * 3, dy - 11, 3, 2);
      }
      /* antenna */
      g.fillStyle = "#15161c"; g.fillRect(Fp[0] + 2, Fp[1] - 12, 1, 10);
      vines(g, F[0] - a + 2, F[1] - a / 2 - 1, h - 6, rng);
    });
    return { cv, ax, ay, doorK: .42,
      lights: [[b * .18, -b * .09 - 7], [b * .66, -b * .33 - 7]],
      blink: [2, -40 - 12] };
  }

  /* ── CLOCKTOWER — spire, glowing clock face ── */
  function clockSprite(rng) {
    const a = 14, b = 14, h = 46, rise = 16, pad = 8;
    const w = a + b + pad * 2, hh = h + (a + b) / 2 + rise + pad * 2;
    const ax = a + pad, ay = hh - pad;
    const cv = sprite(w, hh, (g) => {
      const F = [ax, ay];
      isoBox(g, F[0], F[1], a, b, h, "#262a31", C.stoneA, C.slate);
      wallNoise(g, F[0] - a, F[1] - a / 2 - h, a, h, rng, false);
      wallNoise(g, F[0], F[1] - h, b, h, rng, true);
      /* pyramid spire */
      const Fp = [F[0], F[1] - h], Lp = [F[0] - a, F[1] - a / 2 - h],
            Rp = [F[0] + b, F[1] - b / 2 - h];
      const A = [F[0] + (b - a) / 2, F[1] - h - (a + b) / 4 - rise];
      g.fillStyle = C.slate;   poly(g, [Fp, Lp, A]);
      g.fillStyle = C.slateHi; poly(g, [Fp, Rp, A]);
      neonLine(g, Fp[0], Fp[1], A[0], A[1], C.glacier, C.glacier);
      neonLine(g, Rp[0], Rp[1], A[0], A[1], "rgba(110,206,206,.6)", C.glacier);
      g.fillStyle = C.acid; g.fillRect(A[0], A[1] - 3, 1, 3);     /* finial */
      /* clock face on the right wall */
      const cx = F[0] + b * .5, cy = F[1] - b * .25 - h + 12;
      g.fillStyle = "rgba(237,228,216,.18)";
      g.beginPath(); g.arc(cx, cy, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = C.linen;
      g.beginPath(); g.arc(cx, cy, 4.5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = C.glacier; g.lineWidth = 1;
      g.beginPath(); g.arc(cx, cy, 5.5, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = "#15161c";
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - 3.5); g.stroke();
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 2.5, cy + 1); g.stroke();
      warmWindow(g, F[0] + b * .4, F[1] - b * .2 - 22, 3, 4, true, false);
      doorArch(g, F[0] + b * .32, F[1] - b * .16, 5, 8);
    });
    return { cv, ax, ay, doorK: .35, lights: [[b * .72, -b * .36 - 7]] };
  }

  /* ── MONUMENT — plinth; hologram drawn live each frame ── */
  function monumentSprite() {
    const pad = 8, w = 52 + pad * 2, hh = 40 + pad * 2;
    const ax = w / 2, ay = hh - pad;
    const cv = sprite(w, hh, (g) => {
      const cx = ax, cy = ay;
      const step = (rw, rh, dy, colT, colS) => {
        g.fillStyle = colS;
        g.beginPath(); g.ellipse(cx, cy - dy + 2, rw, rh, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = colT;
        g.beginPath(); g.ellipse(cx, cy - dy, rw, rh, 0, 0, Math.PI * 2); g.fill();
      };
      step(24, 12, 0, C.stoneB, "#2c2e33");
      step(18, 9, 5, C.stoneC, C.stoneA);
      step(12, 6, 10, C.stoneB, "#2c2e33");
      /* moss creeping up the steps */
      g.fillStyle = C.mossB;
      g.fillRect(cx - 18, cy - 2, 5, 2); g.fillRect(cx + 10, cy - 7, 4, 2);
      g.fillStyle = C.acid;
      g.fillRect(cx - 16, cy - 3, 1, 1); g.fillRect(cx + 12, cy - 8, 1, 1);
      /* pillar */
      g.fillStyle = "#2c1d33"; g.fillRect(cx - 4, cy - 26, 4, 16);
      g.fillStyle = C.plum;    g.fillRect(cx, cy - 26, 4, 16);
      g.fillStyle = C.slateHi; g.fillRect(cx - 5, cy - 28, 10, 3);
      neonLine(g, cx - 5, cy - 27, cx + 5, cy - 27, C.glacier, C.glacier);
    });
    return { cv, ax, ay };
  }

  function torchPoleSprite() {
    const cv = sprite(12, 22, (g) => {
      g.fillStyle = "rgba(0,0,0,.35)";
      g.beginPath(); g.ellipse(6, 20, 4, 1.6, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#15161c"; g.fillRect(5, 4, 2, 16);
      g.fillStyle = "#26282c"; g.fillRect(5, 4, 1, 16);
      g.fillStyle = C.terra; g.fillRect(3, 3, 6, 2);
      g.fillStyle = "#5e2a18"; g.fillRect(3, 5, 6, 1);
    });
    return { cv, ax: 6, ay: 21 };
  }

  function shrubSprite(rng, big) {
    const s = big ? 16 : 11;
    const cv = sprite(s + 4, s, (g) => {
      g.fillStyle = "rgba(0,0,0,.3)";
      g.beginPath(); g.ellipse(s / 2 + 2, s - 1, s / 2, 2, 0, 0, Math.PI * 2); g.fill();
      const blob = (bx, by, r, col) => {
        g.fillStyle = col;
        g.beginPath(); g.arc(bx, by, r, 0, Math.PI * 2); g.fill();
      };
      blob(s / 2 + 2, s - 4, s / 2.6, C.mossA);
      blob(s / 2 - 1, s - 5, s / 3.4, C.mossB);
      blob(s / 2 + 4, s - 6, s / 4, C.mossA);
      g.fillStyle = C.acid;
      for (let i = 0; i < 3; i++)
        g.fillRect(2 + (rng() * s | 0), s - 8 + (rng() * 4 | 0), 1, 1);
    });
    return { cv, ax: s / 2 + 2, ay: s - 1 };
  }

  function crateSprite(barrel) {
    const cv = sprite(12, 13, (g) => {
      g.fillStyle = "rgba(0,0,0,.3)";
      g.beginPath(); g.ellipse(6, 11.5, 5, 1.5, 0, 0, Math.PI * 2); g.fill();
      if (barrel) {
        g.fillStyle = "#4a2417"; g.fillRect(3, 2, 6, 9);
        g.fillStyle = C.terra;   g.fillRect(6, 2, 3, 9);
        g.fillStyle = C.glacier; g.fillRect(3, 4, 6, 1); g.fillRect(3, 8, 6, 1);
        g.fillStyle = "#2c1810"; g.fillRect(3, 1, 6, 1);
      } else {
        isoBox(g, 4, 11, 4, 5, 5, "#3a1c10", "#5e2a18", C.terra);
        g.fillStyle = "#2c1810"; g.fillRect(4, 4, 5, 1);
      }
    });
    return { cv, ax: 6, ay: 11 };
  }

  /* ════════════════════════════════════════════════════════════
     GROUND — sky, skyline, cobblestone diamond, moss (drawn once)
  ════════════════════════════════════════════════════════════ */
  function drawGround() {
    ground = document.createElement("canvas");
    ground.width = BW; ground.height = BH;
    const g = ground.getContext("2d");
    const rng = mulberry32(20260612);

    /* sky */
    const sky = g.createLinearGradient(0, 0, 0, BH);
    sky.addColorStop(0, C.night);
    sky.addColorStop(.55, "#0a0a14");
    sky.addColorStop(1, C.nightHi);
    g.fillStyle = sky; g.fillRect(0, 0, BW, BH);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = `rgba(237,228,216,${.15 + rng() * .5})`;
      g.fillRect(rng() * BW | 0, rng() * BH * .45 | 0, 1, 1);
    }
    /* moon */
    const mx = BW * .82, my = BH * .13;
    g.fillStyle = "rgba(110,206,206,.08)";
    g.beginPath(); g.arc(mx, my, 14, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#cfe8e4";
    g.beginPath(); g.arc(mx, my, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(27,58,45,.25)";
    g.fillRect(mx - 3, my - 2, 2, 2); g.fillRect(mx + 1, my + 2, 3, 1);

    /* distant cyberpunk skyline */
    const horizon = oy - R * th / 2 - 4;
    g.fillStyle = "#0c0d14";
    let sx0 = 0;
    while (sx0 < BW) {
      const bw = 8 + rng() * 22, bh = 10 + rng() * 34;
      g.fillRect(sx0, horizon - bh, bw, bh + 8);
      if (rng() < .5) g.fillRect(sx0 + bw / 2, horizon - bh - 5, 1, 5);
      sx0 += bw + 1 + rng() * 4;
    }
    for (let i = 0; i < 90; i++) {
      const cols = [C.cobalt, C.glacier, C.molten, C.acid];
      g.fillStyle = cols[rng() * 4 | 0]; g.globalAlpha = .35 + rng() * .45;
      g.fillRect(rng() * BW | 0, horizon - 40 + rng() * 38 | 0, 1, 1);
    }
    g.globalAlpha = 1;
    /* plum haze at the horizon */
    const haze = g.createLinearGradient(0, horizon - 22, 0, horizon + 18);
    haze.addColorStop(0, "rgba(61,38,69,0)");
    haze.addColorStop(.6, "rgba(61,38,69,.35)");
    haze.addColorStop(1, "rgba(61,38,69,0)");
    g.fillStyle = haze; g.fillRect(0, horizon - 22, BW, 40);

    /* cobblestone diamond */
    for (let gx = -R; gx <= R; gx++) {
      for (let gy = -R; gy <= R; gy++) {
        if (Math.abs(gx) + Math.abs(gy) > R) continue;
        const [cx, cy] = iso(gx, gy);
        const street = gx === 0 || gy === 0;
        const plaza = Math.abs(gx) + Math.abs(gy) <= 2;
        g.fillStyle = C.gap;
        poly(g, [[cx, cy - th / 2], [cx + tw / 2, cy], [cx, cy + th / 2], [cx - tw / 2, cy]]);
        /* four small stones per tile */
        const greys = plaza ? [C.stoneC, "#585c63", C.stoneB]
                            : [C.stoneA, C.stoneB, C.stoneC];
        const q = [[-tw / 4, 0], [tw / 4, 0], [0, -th / 4], [0, th / 4]];
        q.forEach((o) => {
          const sxx = cx + o[0] + (rng() * 2 - 1), syy = cy + o[1] + (rng() - .5);
          let col = greys[rng() * greys.length | 0];
          g.fillStyle = col;
          if (street && rng() < .6) g.fillStyle = "#54585f";
          poly(g, [[sxx, syy - th / 4.4], [sxx + tw / 4.4, syy],
                   [sxx, syy + th / 4.4], [sxx - tw / 4.4, syy]]);
        });
        /* moss between the stones */
        const mossP = plaza ? .10 : street ? .14 : .30;
        if (rng() < mossP) {
          for (let m = 0; m < 3; m++) {
            g.fillStyle = rng() < .5 ? C.mossA : C.mossB;
            g.globalAlpha = .8;
            const mxx = cx + (rng() - .5) * tw * .7, myy = cy + (rng() - .5) * th * .7;
            g.beginPath(); g.arc(mxx, myy, .8 + rng() * 1.4, 0, Math.PI * 2); g.fill();
            if (rng() < .3) { g.fillStyle = C.acid; g.fillRect(mxx | 0, myy | 0, 1, 1); }
          }
          g.globalAlpha = 1;
        }
        /* grass tufts on the outskirts */
        if (Math.abs(gx) + Math.abs(gy) >= R - 2 && rng() < .3) {
          for (let f = 0; f < 3; f++) {
            g.fillStyle = rng() < .4 ? C.acid : C.mossB;
            const fx = cx + (rng() - .5) * tw * .6;
            g.fillRect(fx | 0, cy - 2 - (rng() * 2 | 0), 1, 2 + (rng() * 2 | 0));
          }
        }
      }
    }

    /* glowing street seams, like the hub's grid lines */
    g.globalAlpha = .22; g.strokeStyle = C.glacier; g.lineWidth = 1;
    let p1 = iso(-R, 0), p2 = iso(R, 0);
    g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.stroke();
    p1 = iso(0, -R); p2 = iso(0, R);
    g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.stroke();
    g.globalAlpha = .08; g.lineWidth = 3;
    g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.stroke();
    g.globalAlpha = 1;

    /* fade the town edges into the night */
    const fade = g.createRadialGradient(ox, oy, R * tw * .30, ox, oy, R * tw * .62);
    fade.addColorStop(0, "rgba(5,6,10,0)");
    fade.addColorStop(1, "rgba(5,6,10,.92)");
    g.fillStyle = fade;
    g.fillRect(0, oy - R * th / 2 - 2, BW, R * th + 30);
  }

  /* ════════════════════════════════════════════════════════════
     WORLD BUILD — place buildings, props, torches, billboards
  ════════════════════════════════════════════════════════════ */
  function buildWorld() {
    drawables = []; torches = []; blinkers = []; billboards = [];
    buildings = []; embers = []; flies = [];
    const rng = mulberry32(777);

    BW = Math.ceil(W / S); BH = Math.ceil(H / S);
    buf = document.createElement("canvas");
    buf.width = BW; buf.height = BH;
    bctx = buf.getContext("2d");
    ox = BW / 2; oy = BH * .54;
    tw = Math.max(18, Math.min(32, Math.floor(BW / 16)));
    th = tw / 2;

    drawGround();

    function addBuilding(id, label, hint, gx, gy, spec, action) {
      const [x, y] = iso(gx, gy);
      const b = {
        id, label, hint, x, y, spec, action,
        door: [x + spec.cv.width * 0, y],   /* refined below */
        depth: y,
        col: { x: x - spec.ax + 6, y: y - 16, w: spec.cv.width - 12, h: 20 },
      };
      /* door anchor: front corner shifted along the right wall */
      b.door = [x + (spec.doorK || .4) * 20, y - 4];
      drawables.push({
        depth: y, draw(c, tt) {
          c.drawImage(spec.cv, Math.round(x - spec.ax), Math.round(y - spec.ay));
        },
      });
      (spec.lights || []).forEach((l) =>
        torches.push({ x: x + l[0], y: y + l[1], gy: y + 2, ph: rng() * 7, sconce: true }));
      if (spec.ember) b.emberAt = [x + spec.ember[0], y + spec.ember[1]];
      if (spec.blink) blinkers.push({ x: x + spec.blink[0], y: y + spec.blink[1], ph: rng() * 7 });
      buildings.push(b);
      return b;
    }

    addBuilding("archive", "THE ARCHIVE", "the story of Compound",
      -3.6, -3.6, archiveSprite(rng),
      () => exitThen(() => { location.href = "/story"; }));
    addBuilding("forge", "TEXTILE FORGE", "blankets & material works",
      -4.6, 2.4, forgeSprite(rng),
      () => exitThen(() => { location.href = "/blankets"; }));
    addBuilding("atelier", "THE ATELIER", "commissions & inquiries",
      3.4, -4.2, atelierSprite(rng),
      () => exitThen(() => {
        const el = document.querySelector("#contact");
        if (el) el.scrollIntoView({ behavior: "smooth" });
        else location.href = "/#contact";
      }));
    addBuilding("clock", "CLOCKTOWER", "return to the present",
      5.2, 1.0, clockSprite(rng),
      () => exitThen(null));

    /* monument */
    const ms = monumentSprite();
    const [mx, my] = iso(0, 0);
    monument = { x: mx, y: my + th * .4 };
    drawables.push({
      depth: monument.y,
      draw(c) { c.drawImage(ms.cv, Math.round(monument.x - ms.ax), Math.round(monument.y - ms.ay)); },
    });

    /* plaza corner torch poles */
    const pole = torchPoleSprite();
    [[3, 0], [-3, 0], [0, 3], [0, -3]].forEach(([gx, gy]) => {
      const [x, y] = iso(gx, gy);
      drawables.push({ depth: y, draw(c) { c.drawImage(pole.cv, Math.round(x - pole.ax), Math.round(y - pole.ay)); } });
      torches.push({ x, y: y - 18, gy: y, ph: rng() * 7, sconce: false });
    });

    /* shrubs, crates, barrels */
    [[-6, -1.2, 1], [-1.5, -6, 0], [5.5, -1, 1], [1.4, 5.8, 0], [-5.5, 4.6, 0], [6.2, 1.4, 0]]
      .forEach(([gx, gy, big]) => {
        const s = shrubSprite(rng, big);
        const [x, y] = iso(gx, gy);
        drawables.push({ depth: y, draw(c) { c.drawImage(s.cv, Math.round(x - s.ax), Math.round(y - s.ay)); } });
        flies.push({ ax: x, ay: y - 6, ph: rng() * 7, col: rng() < .5 ? C.acid : C.glacier });
      });
    [[-3.4, 3.4, 0], [-2.9, 3.9, 1], [4.6, -2.6, 1]].forEach(([gx, gy, brl]) => {
      const cr = crateSprite(brl);
      const [x, y] = iso(gx, gy);
      drawables.push({ depth: y, draw(c) { c.drawImage(cr.cv, Math.round(x - cr.ax), Math.round(y - cr.ay)); } });
    });

    /* holo billboards */
    const arch = buildings[0], atel = buildings[2];
    billboards.push({
      x: atel.x + 4, y: atel.y - atel.spec.cv.height - 10,
      lines: ["EARTH,", "REMEMBERED"], w: 46, h: 16, ph: 1.7,
    });
    billboards.push({
      x: arch.x - 60, y: arch.y - arch.spec.cv.height + 42,
      lines: ["ARCHIVE 001"], w: 48, h: 10, ph: 4.2,
    });

    /* player spawn: south-west of the monument, in plain view */
    const [px0, py0] = iso(-.8, 2.4);
    player.x = px0; player.y = py0; player.z = 0; player.vz = 0;
  }

  /* ════════════════════════════════════════════════════════════
     UPDATE
  ════════════════════════════════════════════════════════════ */
  const flick = (ph) =>
    .72 + .28 * (Math.sin(t * 9 + ph) * .45 + Math.sin(t * 23 + ph * 3) * .3 +
                 Math.sin(t * 4.7 + ph * 7) * .25);

  function update(dt) {
    /* movement */
    let dx = 0, dy = 0;
    if (keys.left) dx -= 1; if (keys.right) dx += 1;
    if (keys.up) dy -= 1;   if (keys.down) dy += 1;
    player.moving = !!(dx || dy);
    if (player.moving) {
      const m = Math.hypot(dx, dy); dx /= m; dy /= m;
      if (dx) player.face = dx > 0 ? 1 : -1;
      const spd = 1.05 * dt;
      tryMove(dx * spd, 0);
      tryMove(0, dy * spd * .55);
      player.phase += .22 * dt;
    }
    /* jump */
    if (keys.jump && player.z === 0) { player.vz = 2.4; keys.jump = false; }
    if (player.z > 0 || player.vz > 0) {
      player.z += player.vz * dt;
      player.vz -= .24 * dt;
      if (player.z <= 0) { player.z = 0; player.vz = 0; }
    }
    /* clamp to the town diamond */
    const lim = .9, ddx = (player.x - ox) / (R * tw / 2), ddy = (player.y - oy) / (R * th / 2);
    const dd = Math.abs(ddx) + Math.abs(ddy);
    if (dd > lim) {
      player.x = ox + ddx / dd * lim * (R * tw / 2);
      player.y = oy + ddy / dd * lim * (R * th / 2);
    }
    /* proximity → interact target */
    nearBuilding = null;
    let best = tw * 1.5;
    buildings.forEach((b) => {
      const d = Math.hypot(player.x - b.door[0], player.y - b.door[1]);
      if (d < best) { best = d; nearBuilding = b; }
    });
    if (keys.interact) {
      keys.interact = false;
      if (nearBuilding) nearBuilding.action();
    }
    updatePrompt();

    /* embers: from torches + forge chimney */
    if (Math.random() < .22 * dt) {
      const src = Math.random() < .35 && buildings[1] && buildings[1].emberAt
        ? buildings[1].emberAt
        : (() => { const tt = torches[Math.random() * torches.length | 0]; return [tt.x, tt.y]; })();
      embers.push({
        x: src[0] + (Math.random() - .5) * 2, y: src[1],
        vx: (Math.random() - .5) * .12, vy: -.25 - Math.random() * .3,
        life: 1, hue: Math.random() < .5 ? C.flameCore : C.flameMid,
      });
    }
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.x += e.vx * dt + Math.sin(t * 6 + e.y) * .05;
      e.y += e.vy * dt; e.life -= .012 * dt;
      if (e.life <= 0) embers.splice(i, 1);
    }
  }

  function inBuilding(nx, ny) {
    for (const b of buildings) {
      const r = b.col;
      if (nx > r.x && nx < r.x + r.w && ny > r.y && ny < r.y + r.h) return true;
    }
    return false;
  }

  function tryMove(mx, my) {
    let nx = player.x + mx, ny = player.y + my;
    if (inBuilding(nx, ny)) return;
    if (monument) {
      /* slide around the monument instead of hard-stopping */
      const rad = tw * .62;
      const ddx = nx - monument.x, ddy = (ny - monument.y) * 2;
      const dd = Math.hypot(ddx, ddy);
      if (dd < rad) {
        const k = rad / (dd || 1);
        nx = monument.x + ddx * k;
        ny = monument.y + (ddy * k) / 2;
        if (inBuilding(nx, ny)) return;
      }
    }
    player.x = nx; player.y = ny;
  }

  /* ════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════ */
  function glowAt(c, x, y, r, rgb, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function drawFlame(c, x, y, f) {
    glowAt(c, x, y - 1, 9 + 3 * f, "204,74,18", .34 * f);
    c.fillStyle = C.molten;
    c.fillRect(x - 1.5, y - 2 - f, 3, 3 + f);
    c.fillStyle = C.flameMid;
    c.fillRect(x - 1, y - 2 - f * 1.6, 2, 3 + f);
    c.fillStyle = C.flameCore;
    c.fillRect(x - .5, y - 1 - f * 1.2, 1, 2);
  }

  function drawPlayer(c) {
    const x = Math.round(player.x), y = Math.round(player.y), z = player.z;
    /* shadow */
    c.fillStyle = `rgba(0,0,0,${.35 / (1 + z * .08)})`;
    c.beginPath(); c.ellipse(x, y, 4 / (1 + z * .04), 1.6 / (1 + z * .04), 0, 0, Math.PI * 2); c.fill();
    c.save();
    c.translate(x, y - z);
    if (player.face < 0) c.scale(-1, 1);
    const step = player.moving ? Math.sin(player.phase * Math.PI) * 2 : 0;
    /* legs */
    c.fillStyle = "#2c1d33";
    c.fillRect(-2, -4 + Math.max(0, -step), 2, 4 - Math.max(0, -step));
    c.fillRect(0, -4 + Math.max(0, step), 2, 4 - Math.max(0, step));
    /* body: linen coat */
    c.fillStyle = C.linen; c.fillRect(-3, -10, 6, 6);
    c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(-3, -10, 1, 6);
    /* glacier scarf */
    c.fillStyle = C.glacier; c.fillRect(-3, -10, 6, 1);
    /* arms */
    c.fillStyle = C.linen;
    c.fillRect(-4, -9 + step * .5, 1, 4); c.fillRect(3, -9 - step * .5, 1, 4);
    /* head */
    c.fillStyle = "#d9a06b"; c.fillRect(-2, -14, 5, 4);
    c.fillStyle = "#15161c"; c.fillRect(-2, -15, 5, 2); c.fillRect(-2, -14, 1, 3);
    c.fillStyle = "#0a0a0a"; c.fillRect(1, -12, 1, 1);
    c.restore();
  }

  function drawHolo(c, b) {
    const bob = Math.sin(t * 1.4 + b.ph) * 1.5;
    const glitch = Math.sin(t * 17 + b.ph * 5) > .96;
    const gx = b.x + (glitch ? (Math.random() < .5 ? -1 : 1) : 0);
    const gy = b.y + bob;
    c.globalAlpha = glitch ? .4 : .8 + Math.sin(t * 2 + b.ph) * .12;
    c.fillStyle = "rgba(8,12,16,.66)";
    c.fillRect(gx - b.w / 2, gy - b.h / 2, b.w, b.h);
    c.strokeStyle = C.glacier; c.lineWidth = 1;
    c.strokeRect(gx - b.w / 2 + .5, gy - b.h / 2 + .5, b.w - 1, b.h - 1);
    /* billboard text rendered hi-res in renderHiResText() */
    /* projection beam */
    c.globalAlpha = .12;
    c.fillStyle = C.glacier;
    c.beginPath();
    c.moveTo(gx - 2, gy + b.h / 2); c.lineTo(gx + 2, gy + b.h / 2);
    c.lineTo(gx + 5, gy + b.h / 2 + 14); c.lineTo(gx - 5, gy + b.h / 2 + 14);
    c.closePath(); c.fill();
    c.globalAlpha = 1;
  }

  function drawMonumentHolo(c) {
    const x = monument.x, baseY = monument.y - 30;
    const bob = Math.sin(t * 1.2) * 2;
    const pulse = .75 + Math.sin(t * 1.6) * .25;
    const y = baseY - 12 + bob;
    /* light pool + beam */
    glowAt(c, x, y, 26, "204,74,18", .22 * pulse);
    c.globalAlpha = .10 * pulse; c.fillStyle = C.molten;
    c.beginPath();
    c.moveTo(x - 2, baseY + 2); c.lineTo(x + 2, baseY + 2);
    c.lineTo(x + 8, y); c.lineTo(x - 8, y);
    c.closePath(); c.fill();
    c.globalAlpha = 1;
    /* spinning diamond: width oscillates to fake rotation */
    const spin = Math.abs(Math.sin(t * .9));
    const rw = 7 * (.35 + .65 * spin);
    c.fillStyle = C.molten;
    poly(c, [[x, y - 9], [x + rw, y], [x, y + 9], [x - rw, y]]);
    c.fillStyle = C.flameMid;
    poly(c, [[x, y - 6.5], [x + rw * .68, y], [x, y + 6.5], [x - rw * .68, y]]);
    /* pixel C monogram */
    c.fillStyle = C.linen;
    c.fillRect(x - 2, y - 3, 4, 1); c.fillRect(x - 3, y - 2, 1, 4);
    c.fillRect(x - 2, y + 2, 4, 1); c.fillRect(x + 2, y - 3, 1, 1);
    c.fillRect(x + 2, y + 2, 1, 1);
    /* wordmark rendered hi-res in renderHiResText() */
  }

  function drawPlaques(c) {
    c.font = "7px monospace"; c.textBaseline = "middle";
    buildings.forEach((b) => {
      const near = b === nearBuilding;
      const px = Math.round(b.x + (b.spec.cv.width / 2 - b.spec.ax) * .4);
      const py = Math.max(16, Math.round(b.y - b.spec.ay + 12));
      const wdt = c.measureText(b.label).width + 8;
      c.globalAlpha = near ? 1 : .78;
      c.fillStyle = "rgba(6,8,12,.85)";
      c.fillRect(px - wdt / 2, py - 5, wdt, 10);
      c.strokeStyle = near ? C.acid : "rgba(110,206,206,.55)";
      c.lineWidth = 1;
      c.strokeRect(px - wdt / 2 + .5, py - 4.5, wdt - 1, 9);
      c.fillStyle = near ? C.acid : C.glacier;
      c.textAlign = "center";
      c.fillText(b.label, px, py + .5);
      c.globalAlpha = 1;
    });
    c.textAlign = "left";
  }

  function renderHiResText(sc, ofx, ofy) {
    function b2s(bx, by) {
      return [Math.round(bx * S + ofx), Math.round(by * S + ofy)];
    }
    sc.save();
    sc.textBaseline = "middle";
    sc.imageSmoothingEnabled = false;

    /* Name plaques — drawn at full screen resolution */
    buildings.forEach((b) => {
      const near = b === nearBuilding;
      const bpx = Math.round(b.x + (b.spec.cv.width / 2 - b.spec.ax) * 0.4);
      const bpy = Math.max(16, Math.round(b.y - b.spec.ay + 12));
      const [sx, sy] = b2s(bpx, bpy);
      sc.font = `${near ? "bold " : ""}11px "Courier New",monospace`;
      const wdt = Math.round(sc.measureText(b.label).width) + 14;
      const ht = 20;
      sc.globalAlpha = near ? 1 : 0.72;
      sc.fillStyle = "rgba(5,6,10,0.9)";
      sc.fillRect(sx - Math.round(wdt / 2), sy - Math.round(ht / 2), wdt, ht);
      sc.strokeStyle = near ? C.acid : "rgba(110,206,206,0.5)";
      sc.lineWidth = 1;
      sc.strokeRect(sx - Math.round(wdt / 2) + 0.5, sy - Math.round(ht / 2) + 0.5, wdt - 1, ht - 1);
      sc.fillStyle = near ? C.acid : C.glacier;
      sc.textAlign = "center";
      if (near) { sc.shadowColor = C.acid; sc.shadowBlur = 8; }
      sc.fillText(b.label, sx, sy);
      sc.shadowBlur = 0;
      sc.globalAlpha = 1;
    });

    /* Monument wordmark */
    if (monument) {
      const bob = Math.sin(t * 1.2) * 2;
      const [mx, my] = b2s(monument.x, monument.y - 26 + bob);
      sc.font = 'bold 13px "Courier New",monospace';
      sc.textAlign = "center";
      sc.globalAlpha = 0.85 + Math.sin(t * 1.6) * 0.12;
      sc.fillStyle = C.linen;
      sc.shadowColor = C.molten; sc.shadowBlur = 14;
      sc.fillText("C O M P O U N D", mx, my);
      sc.shadowBlur = 0; sc.globalAlpha = 1;
    }

    /* Billboard text */
    billboards.forEach((b) => {
      const bob = Math.sin(t * 1.4 + b.ph) * 1.5;
      const glitch = Math.sin(t * 17 + b.ph * 5) > 0.96;
      const bbx = b.x + (glitch ? (Math.random() < 0.5 ? -1 : 1) : 0);
      const [sx, sy] = b2s(bbx, b.y + bob);
      sc.globalAlpha = glitch ? 0.4 : 0.85 + Math.sin(t * 2 + b.ph) * 0.1;
      sc.textAlign = "center";
      const lineH = 13;
      b.lines.forEach((ln, i) => {
        sc.font = `${i === 0 ? "bold " : ""}10px "Courier New",monospace`;
        sc.fillStyle = i === 0 ? C.glacier : "rgba(181,204,69,0.85)";
        sc.shadowColor = i === 0 ? C.glacier : C.acid;
        sc.shadowBlur = 5;
        sc.fillText(ln, sx, sy - (b.lines.length - 1) * lineH / 2 + i * lineH);
      });
      sc.shadowBlur = 0; sc.globalAlpha = 1;
    });

    sc.textAlign = "left";
    sc.restore();
  }

  function render() {
    bctx.clearRect(0, 0, BW, BH);
    bctx.drawImage(ground, 0, 0);

    /* additive ground light pools */
    bctx.globalCompositeOperation = "lighter";
    torches.forEach((tc) => {
      const f = flick(tc.ph);
      glowAt(bctx, tc.x, tc.gy, (13 + 4 * f), "204,74,18", .13 * f);
    });
    const mp = .75 + Math.sin(t * 1.6) * .25;
    glowAt(bctx, monument.x, monument.y, 30, "204,74,18", .10 * mp);
    glowAt(bctx, monument.x, monument.y, 14, "110,206,206", .05);
    bctx.globalCompositeOperation = "source-over";

    /* depth-sorted world + player */
    const items = drawables.slice();
    items.push({ depth: player.y, draw: drawPlayer });
    items.sort((p, q) => p.depth - q.depth);
    items.forEach((d) => d.draw(bctx, t));

    /* flames above everything at their spot */
    torches.forEach((tc) => drawFlame(bctx, tc.x, tc.y, flick(tc.ph)));
    blinkers.forEach((bl) => {
      const on = Math.sin(t * 3 + bl.ph) > 0;
      if (on) {
        bctx.fillStyle = "#ff3b30"; bctx.fillRect(bl.x, bl.y, 1, 1);
        glowAt(bctx, bl.x, bl.y, 4, "255,59,48", .4);
      }
    });

    drawMonumentHolo(bctx);
    billboards.forEach((b) => drawHolo(bctx, b));

    /* embers + fireflies (additive) */
    bctx.globalCompositeOperation = "lighter";
    embers.forEach((e) => {
      bctx.globalAlpha = Math.max(0, e.life);
      bctx.fillStyle = e.hue;
      bctx.fillRect(Math.round(e.x), Math.round(e.y), 1, 1);
    });
    flies.forEach((f) => {
      const blink = Math.max(0, Math.sin(t * 1.3 + f.ph));
      if (blink < .25) return;
      const fx = f.ax + Math.sin(t * .7 + f.ph) * 6;
      const fy = f.ay + Math.sin(t * 1.1 + f.ph * 2) * 3;
      bctx.globalAlpha = blink * .9;
      bctx.fillStyle = f.col;
      bctx.fillRect(Math.round(fx), Math.round(fy), 1, 1);
      glowAt(bctx, fx, fy, 3, f.col === C.acid ? "181,204,69" : "110,206,206", .3 * blink);
    });
    bctx.globalAlpha = 1;
    bctx.globalCompositeOperation = "source-over";

    /* upscale to screen, chunky pixels */
    const ofx = -Math.floor((BW * S - W) / 2), ofy = -Math.floor((BH * S - H) / 2);
    sctx.imageSmoothingEnabled = false;
    sctx.clearRect(0, 0, W, H);
    sctx.drawImage(buf, 0, 0, BW, BH, ofx, ofy, BW * S, BH * S);
    renderHiResText(sctx, ofx, ofy);
  }

  function updatePrompt() {
    if (!promptEl) return;
    if (nearBuilding) {
      promptEl.innerHTML =
        '<span class="cu-key">ENTER</span> ' + nearBuilding.label +
        ' <span class="cu-dim">— ' + nearBuilding.hint + "</span>";
      promptEl.classList.add("on");
    } else {
      promptEl.classList.remove("on");
    }
  }

  /* ════════════════════════════════════════════════════════════
     LOOP / INPUT / DOM
  ════════════════════════════════════════════════════════════ */
  function frame(now) {
    if (!active) return;
    const dt = Math.min(2, Math.max(.5, (now - lastNow) / 16.667));
    lastNow = now;
    t += dt * .016;
    update(dt);
    if (!active) return;   /* an interaction inside update() may exit */
    render();
    raf = requestAnimationFrame(frame);
  }

  const KEYMAP = {
    ArrowLeft: "left", a: "left", A: "left",
    ArrowRight: "right", d: "right", D: "right",
    ArrowUp: "up", w: "up", W: "up",
    ArrowDown: "down", s: "down", S: "down",
  };

  function onKeyDown(e) {
    if (!active) return;
    if (e.key === "Escape") { exitThen(null); return; }
    if (e.key === " ") { keys.jump = true; e.preventDefault(); return; }
    if (e.key === "Enter") { keys.interact = true; e.preventDefault(); return; }
    const k = KEYMAP[e.key];
    if (k) { keys[k] = true; e.preventDefault(); }
  }
  function onKeyUp(e) {
    const k = KEYMAP[e.key];
    if (k) keys[k] = false;
  }

  function onResize() {
    if (!active) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      sizeScreen();
      buildWorld();
    }, 150);
  }

  function sizeScreen() {
    W = window.innerWidth; H = window.innerHeight;
    S = W < 1100 ? 2 : 3;
    screen.width = W; screen.height = H;
  }

  function exitThen(fn) {
    stop();
    window.dispatchEvent(new CustomEvent("compound-universe:exit"));
    if (fn) setTimeout(fn, 420);
  }

  function injectStyles() {
    if (document.getElementById("cu-styles")) return;
    const st = document.createElement("style");
    st.id = "cu-styles";
    st.textContent = `
#cu-root{position:fixed;inset:0;z-index:999998;background:${C.night};
  opacity:0;transition:opacity .6s ease;cursor:default;}
#cu-root.on{opacity:1;}
#cu-canvas{display:block;width:100%;height:100%;image-rendering:pixelated;}
#cu-scan{position:absolute;inset:0;pointer-events:none;
  background:
    radial-gradient(ellipse 90% 90% at 50% 48%, transparent 55%, rgba(0,0,0,.5) 100%),
    repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0 2px,
      rgba(110,206,206,.012) 2px 3px, rgba(0,0,0,.07) 3px 4px);}
#cu-title{position:absolute;top:18px;left:50%;transform:translateX(-50%);
  font:700 11px "Courier New",monospace;letter-spacing:4px;
  color:${C.linen};background:rgba(6,8,12,.8);
  border:1px solid rgba(110,206,206,.45);
  padding:7px 16px;border-radius:3px;
  text-shadow:0 0 8px rgba(110,206,206,.6);pointer-events:none;}
#cu-hint{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);
  display:flex;gap:14px;align-items:center;white-space:nowrap;
  font:700 10px "Courier New",monospace;letter-spacing:1px;
  color:rgba(237,228,216,.75);background:rgba(6,8,12,.78);
  border:1px solid rgba(110,206,206,.25);
  padding:8px 16px;border-radius:20px;pointer-events:none;}
.cu-key{display:inline-block;padding:2px 7px;border-radius:3px;
  background:rgba(237,228,216,.12);border:1px solid rgba(237,228,216,.3);
  color:${C.glacier};text-shadow:0 0 6px rgba(110,206,206,.7);}
.cu-dim{color:rgba(237,228,216,.5);font-weight:400;}
#cu-prompt{position:absolute;bottom:66px;left:50%;transform:translate(-50%,6px);
  font:700 11px "Courier New",monospace;letter-spacing:1px;
  color:${C.acid};background:rgba(6,8,12,.85);
  border:1px solid rgba(181,204,69,.5);
  padding:7px 14px;border-radius:3px;
  text-shadow:0 0 8px rgba(181,204,69,.5);
  opacity:0;transition:opacity .2s ease, transform .2s ease;pointer-events:none;}
#cu-prompt.on{opacity:1;transform:translate(-50%,0);}
@media (max-width:640px){#cu-hint{display:none;}}
    `;
    document.head.appendChild(st);
  }

  function start() {
    if (active) return;
    active = true;
    injectStyles();

    root = document.createElement("div");
    root.id = "cu-root";
    screen = document.createElement("canvas");
    screen.id = "cu-canvas";
    root.appendChild(screen);

    const scan = document.createElement("div");
    scan.id = "cu-scan"; root.appendChild(scan);

    const title = document.createElement("div");
    title.id = "cu-title"; title.textContent = "COMPOUND // UNIVERSE 01";
    root.appendChild(title);

    promptEl = document.createElement("div");
    promptEl.id = "cu-prompt"; root.appendChild(promptEl);

    hintEl = document.createElement("div");
    hintEl.id = "cu-hint";
    hintEl.innerHTML =
      '<span><span class="cu-key">↑↓←→</span> move</span>' +
      '<span><span class="cu-key">SPACE</span> jump</span>' +
      '<span><span class="cu-key">ENTER</span> interact</span>' +
      '<span><span class="cu-key">ESC</span> leave</span>';
    root.appendChild(hintEl);

    document.body.appendChild(root);
    sctx = screen.getContext("2d");

    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    sizeScreen();
    buildWorld();

    keys = {};
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);

    requestAnimationFrame(() => root.classList.add("on"));
    lastNow = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (!active) return;
    active = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("resize", onResize);
    clearTimeout(resizeTimer);
    document.documentElement.style.overflow = prevOverflow;
    if (root) {
      const r = root;
      r.classList.remove("on");
      setTimeout(() => r.remove(), 650);
      root = null; screen = null; sctx = null;
    }
    ground = null; buf = null; bctx = null;
    drawables = []; torches = []; embers = []; flies = [];
    buildings = []; billboards = []; blinkers = [];
    promptEl = null; hintEl = null; nearBuilding = null;
  }

  window.CompoundUniverse = {
    start, stop,
    get active() { return active; },
    /* read-only state for tests/tuning */
    get debug() {
      if (!active) return null;
      return {
        player: { x: player.x, y: player.y },
        near: nearBuilding ? nearBuilding.id : null,
        doors: buildings.map((b) => ({ id: b.id, door: b.door, col: b.col })),
        view: { S, BW, BH, ox, oy, tw },
      };
    },
  };

  /* Game starts only when explicitly launched via CompoundUniverse.start() */
})();
