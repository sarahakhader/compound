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
  let roamCat = null;
  let rain = [], ripples = [], dustMotes = [], cloudOff = 0;
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

  /* Lerp two "#rrggbb" hex colors — used by time-of-day sky */
  function lerpC(c1, c2, t) {
    const p = (s) => parseInt(s, 16);
    const r = (p(c1.slice(1,3)) + (p(c2.slice(1,3)) - p(c1.slice(1,3))) * t) | 0;
    const gv = (p(c1.slice(3,5)) + (p(c2.slice(3,5)) - p(c1.slice(3,5))) * t) | 0;
    const b = (p(c1.slice(5,7)) + (p(c2.slice(5,7)) - p(c1.slice(5,7))) * t) | 0;
    return `rgb(${r},${gv},${b})`;
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

  /* stone-course texture — horizontal mortar lines + staggered joints (no rng consumed) */
  function stoneCourses(g, x, y, w, h) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    for (let row = 0, ry = y; ry < y + h - 1; row++, ry += 3) {
      g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(x, ry + 2, w, 1);
      const off = (row % 2) * 4;
      for (let rx = x + off; rx < x + w; rx += 8) {
        g.fillStyle = "rgba(0,0,0,.13)";
        g.fillRect(Math.min(rx, x + w - 1), ry, 1, 2);
        const hv = ((row * 13 + (rx - x) * 7) * 48271 & 0x7fffffff) / 0x7fffffff;
        if (hv < .30) {
          g.fillStyle = hv < .15 ? "rgba(0,0,0,.10)" : "rgba(255,255,255,.06)";
          const sw = Math.min(6, x + w - rx);
          if (sw > 0) g.fillRect(Math.max(x, rx), ry, sw, 2);
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
      stoneCourses(g, F[0] - a, F[1] - a / 2 - h, a, h);
      stoneCourses(g, F[0], F[1] - h, b, h);
      /* foundation band */
      g.fillStyle = "rgba(0,0,0,.22)";
      g.fillRect(F[0] - a, F[1] - a / 2 - 4, a, 4); g.fillRect(F[0], F[1] - 4, b, 4);
      /* cornice trim */
      g.fillStyle = "rgba(204,74,18,.30)";
      g.fillRect(F[0] - a, F[1] - a / 2 - h + 5, a, 1); g.fillRect(F[0], F[1] - h + 5, b, 1);
      /* corner quoins at the front pillar */
      for (let qi = 0; qi < h; qi += 6) {
        g.fillStyle = qi % 12 === 0 ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.14)";
        g.fillRect(Math.round(F[0] - 2), Math.round(F[1] - a / 2 - h + qi), 2, 3);
      }
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
      warmWindow(g, F[0] - a * .62, F[1] - a * .31 - 12, 3, 4, false, false);
      doorArch(g, F[0] + b * .42, F[1] - b * .21, 6, 10);
      /* chimney stack */
      g.fillStyle = "#2a2c31";
      g.fillRect(Math.round(F[0] - a * .38), Math.round(F[1] - a * .19 - h - 5), 3, 5);
      g.fillStyle = "#35373e";
      g.fillRect(Math.round(F[0] - a * .38) - 1, Math.round(F[1] - a * .19 - h - 6), 5, 2);
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
      stoneCourses(g, F[0], F[1] - h, b, h);
      /* rivet grid on the dark metal left wall */
      g.fillStyle = "#22252c";
      for (let ry = F[1] - a / 2 - h + 4; ry < F[1] - a / 2 - 3; ry += 4) {
        for (let rx = F[0] - a + 3; rx < F[0] - 2; rx += 5) {
          g.fillRect(Math.round(rx), Math.round(ry), 1, 1);
        }
      }
      /* exposed pipe along left wall */
      g.fillStyle = "#1a1c22";
      g.fillRect(Math.round(F[0] - a + 6), Math.round(F[1] - a / 2 - h + 3), 1, h - 4);
      g.fillStyle = "#2a2c32";
      g.fillRect(Math.round(F[0] - a + 7), Math.round(F[1] - a / 2 - h + 3), 1, h - 4);
      for (let pj = Math.round(F[1] - a / 2 - h + 8); pj < F[1] - a / 2 - 4; pj += 7) {
        g.fillStyle = "#3a3c42"; g.fillRect(Math.round(F[0] - a + 5), pj, 3, 2);
      }
      /* foundation band */
      g.fillStyle = "rgba(0,0,0,.22)";
      g.fillRect(F[0] - a, F[1] - a / 2 - 3, a, 3); g.fillRect(F[0], F[1] - 3, b, 3);
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
      /* second smaller chimney */
      const ch2x = F[0] + b * .48 - a * .38, ch2y = F[1] - (a * .38 + b * .48) / 2 - h + 5;
      isoBox(g, ch2x, ch2y, 3, 3, 6, "#3a1c10", "#5e2a18", "#1a0d08");
      g.fillStyle = "#5e2a18"; g.fillRect(ch2x - 2, ch2y - 9, 4, 2);
      /* vent grilles on right wall */
      g.fillStyle = "#1a1a1a";
      g.fillRect(Math.round(F[0] + b * .55), Math.round(F[1] - b * .28 - 9), 6, 4);
      g.fillStyle = "#2a2a2a";
      for (let gv = 0; gv < 3; gv++)
        g.fillRect(Math.round(F[0] + b * .55) + 1, Math.round(F[1] - b * .28 - 8) + gv, 4, 1);
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
      stoneCourses(g, F[0] - a, F[1] - a / 2 - h, a, Math.round(h * .55));
      stoneCourses(g, F[0], F[1] - h, b, Math.round(h * .55));
      /* foundation band */
      g.fillStyle = "rgba(0,0,0,.22)";
      g.fillRect(F[0] - a, F[1] - a / 2 - 4, a, 4); g.fillRect(F[0], F[1] - 4, b, 4);
      /* cornice accent */
      g.fillStyle = C.glacier; g.globalAlpha = .18;
      g.fillRect(F[0] - a, F[1] - a / 2 - h + Math.round(h * .55), a, 1);
      g.fillRect(F[0], F[1] - h + Math.round(h * .55), b, 1);
      g.globalAlpha = 1;
      const Fp = [F[0], F[1] - h], Lp = [F[0] - a, F[1] - a / 2 - h],
            Rp = [F[0] + b, F[1] - b / 2 - h];
      /* parapet */
      g.fillStyle = "#231828";
      poly(g, [[Fp[0], Fp[1] - 2], [Lp[0], Lp[1] - 2], [Lp[0], Lp[1]], [Fp[0], Fp[1]]]);
      poly(g, [[Fp[0], Fp[1] - 2], [Rp[0], Rp[1] - 2], [Rp[0], Rp[1]], [Fp[0], Fp[1]]]);
      neonLine(g, Fp[0], Fp[1] - 2, Rp[0], Rp[1] - 2, "#3a7bff", C.cobalt);
      neonLine(g, Fp[0], Fp[1] - 2, Lp[0], Lp[1] - 2, "rgba(58,123,255,.5)", C.cobalt);
      /* cyan studio glass grid — 4 rows */
      for (let r = 0; r < 4; r++)
        for (let i = 0; i < 2; i++) {
          const k = .2 + i * .42, wx = F[0] + b * k, wy0 = F[1] - b * k / 2;
          warmWindow(g, wx, wy0 - 36 + r * 9, 5, 6, !(r === 3 && i === 0), true);
        }
      /* rooftop water tank */
      const tkx = Math.round(F[0] + 3), tky = Math.round(F[1] - h - 3);
      g.fillStyle = "#2a2c31"; g.fillRect(tkx, tky - 6, 8, 6);
      g.fillStyle = "#35373e"; g.fillRect(tkx - 1, tky - 7, 10, 2);
      g.fillStyle = "#1a1c22"; g.fillRect(tkx, tky, 8, 2);
      g.fillStyle = "#3a3c46"; g.fillRect(tkx + 1, tky - 5, 6, 1);
      /* rooftop AC unit */
      const acx = Math.round(F[0] - a * .4), acy = Math.round(F[1] - a * .2 - h - 1);
      g.fillStyle = "#25272e"; g.fillRect(acx, acy - 4, 5, 4);
      g.fillStyle = "#1a1c22"; g.fillRect(acx, acy - 2, 5, 1);
      g.fillStyle = "#2e303a"; g.fillRect(acx + 1, acy - 4, 1, 3);
      g.fillRect(acx + 3, acy - 4, 1, 3);
      /* molten awning over the door */
      const dk = .42, dx = F[0] + b * dk, dy = F[1] - b * dk / 2;
      doorArch(g, dx, dy, 5, 9);
      for (let s = 0; s < 4; s++) {
        g.fillStyle = s % 2 ? C.molten : C.linen;
        g.fillRect(dx - 2 + s * 3, dy - 11, 3, 2);
      }
      /* antenna array */
      g.fillStyle = "#15161c";
      g.fillRect(Fp[0] + 1, Fp[1] - 14, 1, 12);
      g.fillRect(Fp[0] + 4, Fp[1] - 11, 1, 9);
      g.fillStyle = "#2a2c32"; g.fillRect(Fp[0] + 1, Fp[1] - 10, 4, 1);
      g.fillStyle = C.acid; g.fillRect(Fp[0] + 1, Fp[1] - 15, 1, 1); /* blinker tip */
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
      stoneCourses(g, F[0] - a, F[1] - a / 2 - h, a, h);
      stoneCourses(g, F[0], F[1] - h, b, h);
      /* foundation band */
      g.fillStyle = "rgba(0,0,0,.22)";
      g.fillRect(F[0] - a, F[1] - a / 2 - 3, a, 3); g.fillRect(F[0], F[1] - 3, b, 3);
      /* crenellations — alternating merlons at parapet */
      g.fillStyle = C.stoneA;
      for (let mi = 0; mi <= 3; mi++) {
        if (mi % 2 === 0) {
          const mx0 = Math.round(F[0] - a + (a * mi) / 3);
          const my0 = Math.round(F[1] - a / 2 - h - 3 + (a / 2 * mi) / 3);
          g.fillRect(mx0, my0 - 3, 3, 3);
        }
      }
      for (let mi = 0; mi <= 3; mi++) {
        if (mi % 2 === 0) {
          const mx0 = Math.round(F[0] + (b * mi) / 3);
          const my0 = Math.round(F[1] - h - 3 - (b / 2 * mi) / 3);
          g.fillRect(mx0, my0 - 3, 3, 3);
        }
      }
      /* cornice below crenellations */
      g.fillStyle = C.glacier; g.globalAlpha = .20;
      g.fillRect(F[0] - a, F[1] - a / 2 - h - 1, a, 1);
      g.fillRect(F[0], F[1] - h - 1, b, 1);
      g.globalAlpha = 1;
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
      warmWindow(g, F[0] + b * .6, F[1] - b * .3 - 32, 3, 5, false, true);
      warmWindow(g, F[0] - a * .55, F[1] - a * .28 - 20, 2, 6, true, false);
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

  function lampostSprite() {
    const cv = sprite(20, 44, (g) => {
      /* ground shadow */
      g.fillStyle = "rgba(0,0,0,.25)";
      g.beginPath(); g.ellipse(10, 42, 5, 1.5, 0, 0, Math.PI * 2); g.fill();
      /* pedestal */
      g.fillStyle = "#22242c"; g.fillRect(8, 37, 4, 5);
      g.fillStyle = "#2e303a"; g.fillRect(7, 36, 6, 2);
      g.fillStyle = "#1a1c22"; g.fillRect(8, 36, 1, 2);
      /* pole */
      g.fillStyle = "#1c1e26"; g.fillRect(9, 8, 2, 29);
      g.fillStyle = "#26282e"; g.fillRect(9, 8, 1, 29); /* highlight edge */
      /* collar ring */
      g.fillStyle = "#32343e"; g.fillRect(8, 28, 4, 2);
      /* curved arm extending left */
      g.fillStyle = "#1c1e26";
      g.fillRect(3, 8, 7, 1);  /* horizontal arm */
      g.fillRect(2, 9, 2, 3);  /* downward bend */
      /* lantern housing */
      g.fillStyle = "#2e303a"; g.fillRect(0, 9, 6, 5);
      g.fillStyle = "#22242c"; g.fillRect(0, 8, 6, 1);  /* cap */
      g.fillStyle = "#3a3c46"; g.fillRect(0, 14, 6, 1); /* lip */
      /* glass panel with glacier glow */
      g.fillStyle = "#88e8e8"; g.fillRect(1, 10, 4, 2);
      g.fillStyle = "#d0ffff"; g.fillRect(1, 10, 4, 1); /* bright top band */
      g.fillStyle = "rgba(110,206,206,.16)"; g.fillRect(0, 8, 7, 8); /* halo bloom */
      /* finial on pole tip */
      g.fillStyle = "#3a3c46"; g.fillRect(9, 7, 2, 1);
    });
    return { cv, ax: 10, ay: 42 };
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

  /* Isometric tree: variant 0=round, 1=tall cypress, 2=wide spreading */
  function treeSprite(rng, variant) {
    const tall = variant === 1, wide = variant === 2;
    const ch = tall ? 36 : wide ? 22 : 28;
    const cw = tall ? 14 : wide ? 28 : 20;
    const cv = sprite(cw + 4, ch + 8, (g) => {
      g.fillStyle = "rgba(0,0,0,.22)";
      g.beginPath(); g.ellipse(cw / 2 + 2, ch + 5, cw / 2.8, cw / 7, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#2a1808"; g.fillRect(cw / 2, ch - 5, 3, 7);
      g.fillStyle = "#3a2010"; g.fillRect(cw / 2 + 1, ch - 5, 1, 7);
      const layers = tall ? 6 : wide ? 3 : 4;
      for (let i = layers - 1; i >= 0; i--) {
        const pct = i / (layers - 0.5);
        const lw2 = ((wide ? cw * (0.7 + pct * 0.6) : tall ? cw * (0.35 + pct * 0.65) : cw * (0.4 + pct * 0.55)) | 0) + 2;
        const ly = ((ch - 10) * (1 - pct)) | 0;
        const lx = (cw / 2 + 2 - lw2 / 2) | 0;
        const hv = ((i * 17 + (variant || 0) * 31) * 48271 & 0x7fffffff) / 0x7fffffff;
        g.fillStyle = hv > 0.65 ? "#2a5240" : hv > 0.35 ? "#1B3A2D" : "#224a34";
        g.fillRect(lx, ly, lw2, 5);
        if (i <= 1) { g.fillStyle = "rgba(181,204,69,.28)"; g.fillRect(lx + 1, ly - 1, Math.max(2, lw2 - 2), 2); }
        g.fillStyle = "rgba(0,0,0,.20)"; g.fillRect(lx, ly + 4, lw2, 1);
      }
    });
    return { cv, ax: cw / 2 + 2, ay: ch + 5 };
  }

  /* ════════════════════════════════════════════════════════════
     GROUND — sky, skyline, cobblestone diamond, moss (drawn once)
  ════════════════════════════════════════════════════════════ */
  function drawGround() {
    ground = document.createElement("canvas");
    ground.width = BW; ground.height = BH;
    const g = ground.getContext("2d");
    const rng = mulberry32(20260612);

    /* sky is drawn dynamically each frame in drawSky() — leave transparent */
    g.clearRect(0, 0, BW, BH);

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

    /* ── ornate plaza floor medallion — Persian-rug-inspired (static) ── */
    const [pmx, pmy] = iso(0, 0);
    /* subtle red wash fill */
    g.globalAlpha = .07; g.fillStyle = "#CC4A12";
    g.beginPath(); g.ellipse(pmx, pmy, tw * 1.9, th * 1.9, 0, 0, Math.PI * 2); g.fill();
    /* concentric border rings in brand palette */
    [[2.05, "#CC4A12", .28, 1.2], [1.80, "#EDE4D8", .16, .6],
     [1.55, "#CC4A12", .22, .8], [1.28, "#6ECECE", .18, .6],
     [0.95, "#EDE4D8", .16, .5], [0.60, "#CC4A12", .22, .8]].forEach(([r, col, a, lw]) => {
      g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = lw;
      g.beginPath(); g.ellipse(pmx, pmy, tw * r, th * r, 0, 0, Math.PI * 2); g.stroke();
    });
    /* radial spokes */
    g.globalAlpha = .11; g.strokeStyle = "#EDE4D8"; g.lineWidth = .5;
    for (let i = 0; i < 12; i++) {
      const ang = i * Math.PI / 6;
      g.beginPath();
      g.moveTo(pmx + Math.cos(ang) * tw * .18, pmy + Math.sin(ang) * th * .18);
      g.lineTo(pmx + Math.cos(ang) * tw * 1.52, pmy + Math.sin(ang) * th * 1.52);
      g.stroke();
    }
    /* small diamond dots at petal tips */
    g.globalAlpha = .22; g.fillStyle = "#CC4A12";
    for (let i = 0; i < 6; i++) {
      const ang = i * Math.PI / 3;
      const dx = Math.cos(ang) * tw * 1.25, dy = Math.sin(ang) * th * 1.25;
      g.beginPath(); g.ellipse(pmx + dx, pmy + dy, 2, 1, ang, 0, Math.PI * 2); g.fill();
    }
    /* center medallion */
    g.globalAlpha = .38; g.fillStyle = "#CC4A12";
    g.beginPath(); g.ellipse(pmx, pmy, tw * .28, th * .28, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = .26; g.strokeStyle = "#6ECECE"; g.lineWidth = .75;
    g.beginPath(); g.ellipse(pmx, pmy, tw * .44, th * .44, 0, 0, Math.PI * 2); g.stroke();
    g.globalAlpha = 1;

    /* puddles reflecting neon */
    const prng = mulberry32(31337);
    for (let p = 0; p < 18; p++) {
      const pgx = (prng() - .5) * 14, pgy = (prng() - .5) * 14;
      if (Math.abs(pgx) + Math.abs(pgy) > R * .84) continue;
      const [ppx, ppy] = iso(pgx, pgy);
      const pr = 2 + prng() * 6, phh = pr * .42;
      g.save(); g.globalAlpha = .17 + prng() * .13;
      const puddleCols = [C.cobalt, C.glacier, C.molten, "#3a7bff"];
      g.fillStyle = puddleCols[prng() * puddleCols.length | 0];
      g.beginPath(); g.ellipse(ppx, ppy, pr, phh, 0, 0, Math.PI * 2); g.fill();
      g.globalAlpha = .06; g.fillStyle = "#ffffff";
      g.beginPath(); g.ellipse(ppx - pr * .25, ppy - phh * .3, pr * .35, phh * .35, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    /* manhole cover at centre plaza */
    const [mhx, mhy] = iso(-.25, .3);
    g.fillStyle = "#2c2e34"; g.beginPath(); g.ellipse(mhx, mhy, 9, 4.5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#35383f"; g.beginPath(); g.ellipse(mhx, mhy, 7, 3.5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#222428";
    g.fillRect(mhx - 7, mhy - .5, 14, 1); g.fillRect(mhx - .5, mhy - 3.5, 1, 7);
    g.fillStyle = "rgba(110,206,206,.06)"; g.beginPath(); g.ellipse(mhx, mhy, 7, 3.5, 0, 0, Math.PI * 2); g.fill();
    /* painted dashed centre line on the E-W road */
    const dashRng = mulberry32(55555);
    g.globalAlpha = .08; g.fillStyle = "#d4cfc2";
    for (let gdx = -R + 1; gdx < R; gdx++) {
      if (dashRng() < .45) continue;
      const [dlx, dly] = iso(gdx - .05, .45);
      const [drx, dry] = iso(gdx + .05, .45);
      g.fillRect(Math.min(dlx, drx) | 0, Math.min(dly, dry) | 0,
                 Math.max(1, Math.abs(drx - dlx) | 0), Math.max(1, Math.abs(dry - dly) | 0));
    }
    g.globalAlpha = 1;

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
    roamCat = null;
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
        depth: y, draw(c) {
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

    /* ── extra decorative buildings for a denser skyline ── */
    function addScenery(gx, gy, spec) {
      const [sx, sy] = iso(gx, gy);
      drawables.push({
        depth: sy,
        draw(c) { c.drawImage(spec.cv, Math.round(sx - spec.ax), Math.round(sy - spec.ay)); },
      });
      (spec.lights || []).forEach(l =>
        torches.push({ x: sx + l[0], y: sy + l[1], gy: sy + 2, ph: rng() * 7, sconce: true }));
      if (spec.blink) blinkers.push({ x: sx + spec.blink[0], y: sy + spec.blink[1], ph: rng() * 7 });
    }
    /* inner ring — original 6 */
    addScenery( 1.5, -7.2, atelierSprite(rng));
    addScenery( 6.5, -2.0, archiveSprite(rng));
    addScenery( 4.5,  4.0, clockSprite(rng));
    addScenery(-7.0, -0.5, atelierSprite(rng));
    addScenery(-3.5,  5.5, archiveSprite(rng));
    addScenery(-5.5, -3.5, clockSprite(rng));
    /* outer city ring — fills the horizon */
    addScenery( 9.0, -1.0, archiveSprite(rng));
    addScenery(10.5,  1.5, atelierSprite(rng));
    addScenery( 7.5, -5.5, clockSprite(rng));
    addScenery( 3.0,-10.0, archiveSprite(rng));
    addScenery(-1.5,-10.5, atelierSprite(rng));
    addScenery(-6.0, -6.5, archiveSprite(rng));
    addScenery(-9.5,  0.5, clockSprite(rng));
    addScenery(-10.0, 3.5, atelierSprite(rng));
    addScenery(-6.0,  7.5, archiveSprite(rng));
    addScenery( 0.5, 10.5, clockSprite(rng));
    addScenery( 5.5,  7.5, atelierSprite(rng));
    addScenery( 8.5,  4.0, archiveSprite(rng));

    /* trees and greenery scattered across the city */
    function addTree(gx, gy, variant) {
      const ts = treeSprite(rng, variant);
      const [tx, ty] = iso(gx, gy);
      drawables.push({ depth: ty, draw(c) { c.drawImage(ts.cv, Math.round(tx - ts.ax), Math.round(ty - ts.ay)); } });
      flies.push({ ax: tx, ay: ty - 8, ph: rng() * 7, col: C.acid });
    }
    /* plaza corners — four round trees framing the monument */
    addTree( 2.0,  2.0, 0); addTree(-2.0, -2.0, 0);
    addTree( 2.0, -2.0, 0); addTree(-2.0,  2.0, 0);
    /* tall cypresses lining the main E-W road */
    addTree( 4.8,  0.8, 1); addTree(-4.8, -0.8, 1);
    addTree( 7.5,  0.6, 1); addTree(-7.5, -0.6, 1);
    /* wide canopy trees near the archive and forge */
    addTree(-4.8,  3.5, 2); addTree(-2.0,  4.8, 0);
    addTree(-4.0, -5.0, 2); addTree( 4.2, -5.8, 0);
    /* northern grove */
    addTree( 0.5, -8.5, 1); addTree(-1.2, -7.8, 0); addTree( 2.0, -9.2, 1);
    /* eastern grove near clocktower */
    addTree( 6.5,  3.0, 0); addTree( 8.0,  2.2, 1);
    /* south-west park cluster */
    addTree(-6.5,  5.5, 2); addTree(-4.5,  7.0, 0);
    /* scattered city trees */
    addTree( 3.5,  6.0, 1); addTree(-1.0,  7.8, 2);
    addTree(-8.0,  2.5, 0); addTree( 5.8, -4.0, 0);

    /* lampposts along the main streets */
    const lamp = lampostSprite();
    [
      [ 3.8,  0.3], [-3.8, -0.3], [ 6.8,  0.4], [-6.8, -0.4],
      [ 0.3,  3.8], [-0.3, -3.8], [ 0.3,  6.8], [-0.3, -6.8],
    ].forEach(([lgx, lgy]) => {
      if (Math.abs(lgx) + Math.abs(lgy) > R * .97) return;
      const [lx, ly] = iso(lgx, lgy);
      drawables.push({ depth: ly, draw(c) { c.drawImage(lamp.cv, Math.round(lx - lamp.ax), Math.round(ly - lamp.ay)); } });
      torches.push({ x: lx - 6, y: ly - 33, gy: ly, ph: rng() * 7, sconce: false, lamp: true });
    });

    /* Universe of Design holo billboards */
    const arch = buildings[0], atel = buildings[2];
    billboards.push({
      x: atel.x + 4, y: atel.y - atel.spec.cv.height - 10,
      lines: ["UNIVERSE", "OF DESIGN"], w: 52, h: 18, ph: 1.7, col: C.glacier,
    });
    billboards.push({
      x: arch.x - 60, y: arch.y - arch.spec.cv.height + 42,
      lines: ["FORM ×", "MATTER"], w: 48, h: 18, ph: 4.2, col: C.molten,
    });
    billboards.push({
      x: buildings[1].x + 18, y: buildings[1].y - buildings[1].spec.cv.height + 8,
      lines: ["DESIGN", "LAB 01"], w: 46, h: 18, ph: 2.6, col: C.acid,
    });

    /* roaming cat — starts near the north-east plaza */
    const [rc0x, rc0y] = iso(1.8, -1.4);
    roamCat = { x: rc0x, y: rc0y, tx: rc0x, ty: rc0y,
                state: "WAIT", waitTimer: 1.5, face: -1, phase: 0 };

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

    /* roaming cat AI */
    if (roamCat) {
      const pd = Math.hypot(player.x - roamCat.x, player.y - roamCat.y);
      if (pd < tw * 2.8 && roamCat.state !== "FLEE") {
        const fx = roamCat.x - player.x, fy = roamCat.y - player.y;
        const fd = Math.hypot(fx, fy) || 1;
        roamCat.tx = roamCat.x + fx / fd * tw * 4;
        roamCat.ty = roamCat.y + fy / fd * th * 4;
        roamCat.state = "FLEE";
      } else if (roamCat.state === "FLEE" && pd > tw * 5) {
        roamCat.state = "WAIT";
        roamCat.waitTimer = 2 + Math.random() * 4;
      }
      if (roamCat.state === "WAIT") {
        roamCat.waitTimer -= dt * .016;
        if (roamCat.waitTimer <= 0) {
          const ang = Math.random() * Math.PI * 2;
          const dist = tw * (1 + Math.random() * 2.5);
          const ntx = roamCat.x + Math.cos(ang) * dist;
          const nty = roamCat.y + Math.sin(ang) * dist * .55;
          const cddx = (ntx - ox) / (R * tw / 2), cddy = (nty - oy) / (R * th / 2);
          const cdd = Math.abs(cddx) + Math.abs(cddy);
          roamCat.tx = cdd > .82 ? ox + cddx / cdd * .82 * (R * tw / 2) : ntx;
          roamCat.ty = cdd > .82 ? oy + cddy / cdd * .82 * (R * th / 2) : nty;
          roamCat.state = "WANDER";
        }
      } else {
        const ddx = roamCat.tx - roamCat.x, ddy = roamCat.ty - roamCat.y;
        const ddd = Math.hypot(ddx, ddy);
        if (ddd < 2) {
          roamCat.state = "WAIT";
          roamCat.waitTimer = (roamCat.state === "FLEE" ? 1 : 2) + Math.random() * 3;
        } else {
          const spd = (roamCat.state === "FLEE" ? .9 : .35) * dt;
          roamCat.x += ddx / ddd * spd;
          roamCat.y += ddy / ddd * spd * .55;
          if (ddx) roamCat.face = ddx > 0 ? 1 : -1;
          roamCat.phase += .2 * dt;
        }
      }
    }

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

    /* rain drops */
    cloudOff += .003 * dt;
    while (rain.length < 38) {
      rain.push({ x: Math.random() * BW * 1.15, y: -8, spd: 1.6 + Math.random() * 1.2,
                  len: 3 + Math.random() * 4, a: .06 + Math.random() * .07 });
    }
    for (let i = rain.length - 1; i >= 0; i--) {
      const dr = rain[i];
      dr.x += .45 * dt; dr.y += dr.spd * dt;
      if (dr.y > BH + 10) {
        if (Math.random() < .28)
          ripples.push({ x: dr.x, y: dr.y < oy + 10 ? dr.y : oy + 5 + Math.random() * 20,
                         r: 0, maxR: 2 + Math.random() * 3.5, a: .35 });
        rain.splice(i, 1);
      }
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.r += .55 * dt; rp.a -= .028 * dt;
      if (rp.a <= 0) ripples.splice(i, 1);
    }

    /* ambient dust motes */
    while (dustMotes.length < 22) {
      dustMotes.push({
        x: Math.random() * BW, y: oy - R * th * .35 + Math.random() * R * th * .7,
        vx: (Math.random() - .5) * .14, vy: -.04 - Math.random() * .08,
        r: Math.random(), life: 1,
        rgb: Math.random() < .5 ? "110,206,206" : "204,74,18",
      });
    }
    for (let i = dustMotes.length - 1; i >= 0; i--) {
      const dm = dustMotes[i];
      dm.x += dm.vx * dt + Math.sin(t * .65 + dm.r * 5) * .07;
      dm.y += dm.vy * dt;
      dm.life -= .0035 * dt;
      if (dm.life <= 0 || dm.y < oy - R * th * .62) dustMotes.splice(i, 1);
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
    /* shadow — wider for platform boots */
    c.fillStyle = `rgba(0,0,0,${.38 / (1 + z * .08)})`;
    c.beginPath(); c.ellipse(x, y, 5 / (1 + z * .04), 2 / (1 + z * .04), 0, 0, Math.PI * 2); c.fill();

    /* ── sitting black cat companion (before save so it's behind player) ── */
    const catSide = player.face > 0 ? -1 : 1;
    const catBX = x + catSide * 10, catBY = y - 1;
    c.fillStyle = "rgba(0,0,0,.22)";
    c.beginPath(); c.ellipse(catBX, catBY, 3.5, 1.2, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#090608";
    c.fillRect(catBX - 2, catBY - 5, 5, 4);     /* body (sitting) */
    c.fillRect(catBX - 1, catBY - 7, 3, 3);     /* head */
    c.fillRect(catBX - 1, catBY - 8, 1, 1);     /* left ear */
    c.fillRect(catBX + 1, catBY - 8, 1, 1);     /* right ear */
    c.fillRect(catBX - 2, catBY - 1, 2, 1);     /* left paw */
    c.fillRect(catBX + 1, catBY - 1, 2, 1);     /* right paw */
    /* tail curled around body */
    c.fillRect(catBX + catSide * 2, catBY - 3, 1, 2);
    c.fillRect(catBX + catSide * 3, catBY - 4, 1, 2);
    c.fillRect(catBX + catSide * 2, catBY - 5, 2, 1);
    c.fillStyle = C.acid;
    c.fillRect(catBX - 1, catBY - 6, 1, 1);     /* left eye */
    c.fillRect(catBX + 1, catBY - 6, 1, 1);     /* right eye */
    c.fillStyle = "#c8c0b8";                     /* whisker dots */
    c.fillRect(catBX - 3, catBY - 6, 1, 1);
    c.fillRect(catBX + 3, catBY - 6, 1, 1);

    c.save();
    c.translate(x, y - z);
    if (player.face < 0) c.scale(-1, 1);
    const step = player.moving ? Math.sin(player.phase * Math.PI) * 2 : 0;

    /* ── platform boots ── chunky dark with thick sole */
    c.fillStyle = "#0d0d16";
    c.fillRect(-2, -4 + Math.max(0, -step), 2, 4 - Math.max(0, -step));
    c.fillRect( 0, -4 + Math.max(0,  step), 2, 4 - Math.max(0,  step));
    c.fillStyle = "#1c1c2a";   /* platform sole — wider */
    c.fillRect(-3, Math.max(0, -step) - 1, 3, 1);
    c.fillRect(-1, Math.max(0,  step) - 1, 3, 1);

    /* ── cargo pants ── dark olive with pocket seam */
    c.fillStyle = "#252818";
    c.fillRect(-2, -9, 4, 5);
    c.fillStyle = "#0e0f09";   /* centre seam */
    c.fillRect(0, -9, 1, 5);
    c.fillStyle = "#333620";   /* cargo pocket */
    c.fillRect(-2, -8, 2, 2);

    /* ── utility belt ── leather + gold buckle + extra pockets */
    c.fillStyle = "#5a3a10";
    c.fillRect(-3, -10, 6, 1);
    c.fillStyle = "#d4920a";
    c.fillRect(-1, -10, 2, 1);
    c.fillStyle = "#7a4e1a";   /* side pouches */
    c.fillRect(-3, -9, 1, 1); c.fillRect(2, -9, 1, 1);

    /* ── midriff gap ── warm skin between belt and top */
    c.fillStyle = "#bf7848";
    c.fillRect(-2, -11, 4, 1);

    /* ── black crop top ── */
    c.fillStyle = "#111111";
    c.fillRect(-3, -15, 6, 4);
    c.fillStyle = "#1e1e1e";   /* neckline highlight */
    c.fillRect(-1, -15, 2, 1);

    /* ── tattooed left arm (front) ── */
    c.fillStyle = "#bf7848";
    c.fillRect(-4, -14 + step * .5, 1, 5);
    c.fillStyle = C.glacier;            /* teal band */
    c.fillRect(-4, -14 + step * .5, 1, 1);
    c.fillStyle = C.molten;             /* orange band */
    c.fillRect(-4, -12 + step * .5, 1, 1);
    c.fillStyle = C.acid;               /* acid green */
    c.fillRect(-4, -11 + step * .5, 1, 1);
    c.fillStyle = "#9b5a30";            /* wrist detail */
    c.fillRect(-4, -10 + step * .5, 1, 1);

    /* ── right arm (back) — plain ── */
    c.fillStyle = "#bf7848";
    c.fillRect(3, -14 - step * .5, 1, 5);

    /* ── glowing tablet in right hand (when idle) ── */
    if (!player.moving) {
      c.fillStyle = "#0a1420";
      c.fillRect(3, -12, 3, 2);
      c.fillStyle = "rgba(0,240,255,0.8)";
      c.fillRect(3, -12, 2, 1);
      c.fillStyle = "rgba(0,200,255,0.3)";
      c.fillRect(3, -13, 3, 1);          /* screen glow */
    }

    /* ── face ── warm medium skin */
    c.fillStyle = "#bf7848";
    c.fillRect(-2, -18, 4, 3);

    /* ── necklace ── delicate gold chain with small pendant */
    c.fillStyle = "#d4a020";
    c.fillRect(-2, -15, 1, 1); c.fillRect(0, -16, 1, 1); c.fillRect(2, -15, 1, 1);
    c.fillStyle = C.glacier;    /* teal pendant */
    c.fillRect(0, -15, 1, 1);

    /* ── round glasses ── dark frames + glacier tint */
    c.fillStyle = "#0a0a12";
    c.fillRect(-2, -18, 2, 2);
    c.fillRect( 1, -18, 2, 2);
    c.fillStyle = "rgba(110,206,206,0.45)";
    c.fillRect(-1, -18, 1, 1);
    c.fillRect( 1, -18, 1, 1);
    c.fillStyle = "#0a0a12";
    c.fillRect( 0, -18, 1, 1);  /* nose bridge */
    c.fillStyle = "#1a0a04";
    c.fillRect(-1, -17, 1, 1);  /* left eye */
    c.fillRect( 2, -17, 1, 1);  /* right eye */

    /* ── gold hoop earring ── */
    c.fillStyle = "#d4a020";
    c.fillRect(-3, -17, 1, 2);

    /* ── VERY voluminous dark curly hair ── */
    c.fillStyle = "#140b04";
    c.fillRect(-4, -23, 8, 5);    /* wide top mass */
    c.fillRect(-5, -22, 2, 6);    /* left side poof */
    c.fillRect( 4, -22, 2, 5);    /* right side poof */
    c.fillRect(-6, -20, 2, 4);    /* far left volume */
    c.fillRect( 5, -20, 2, 4);    /* far right volume */
    c.fillRect(-6, -17, 2, 2);    /* lower left curl */
    c.fillRect( 5, -17, 2, 2);    /* lower right curl */
    c.fillRect(-5, -16, 2, 1);    /* left tendril */
    c.fillRect( 4, -16, 2, 1);    /* right tendril */
    c.fillStyle = "#221208";       /* highlight curls */
    c.fillRect(-2, -23, 3, 1);
    c.fillRect( 1, -21, 2, 1);
    c.fillStyle = "#0d0704";       /* depth shadows */
    c.fillRect(-3, -21, 1, 3);
    c.fillRect( 3, -21, 1, 2);
    /* bangs across forehead */
    c.fillStyle = "#140b04";
    c.fillRect(-3, -18, 5, 1);

    c.restore();
  }

  function drawRoamingCat(c) {
    if (!roamCat) return;
    const cx = Math.round(roamCat.x), cy = Math.round(roamCat.y);
    /* shadow */
    c.fillStyle = "rgba(0,0,0,.25)";
    c.beginPath(); c.ellipse(cx, cy, 3.5, 1.2, 0, 0, Math.PI * 2); c.fill();
    c.save();
    c.translate(cx, cy);
    if (roamCat.face < 0) c.scale(-1, 1);
    const moving = roamCat.state !== "WAIT";
    const step = moving ? Math.sin(roamCat.phase * Math.PI) * 1.8 : 0;
    /* body */
    c.fillStyle = "#090608";
    c.fillRect(-3, -4, 5, 3);
    /* head */
    c.fillRect(-1, -6, 3, 2);
    /* ears */
    c.fillRect(-1, -7, 1, 1);
    c.fillRect(1, -7, 1, 1);
    /* nose */
    c.fillStyle = "#1a0a0a"; c.fillRect(0, -5, 1, 1);
    /* eyes — acid yellow */
    c.fillStyle = C.acid;
    c.fillRect(-1, -6, 1, 1);
    c.fillRect(1, -6, 1, 1);
    /* tail curves up when sitting */
    c.fillStyle = "#090608";
    const tailUp = roamCat.state === "WAIT" ? -2 : 0;
    c.fillRect(2, -3, 1, 2);
    c.fillRect(3, -4 + tailUp, 1, 2);
    c.fillRect(4, -5 + tailUp, 1, 1);
    /* legs */
    if (moving) {
      c.fillRect(-3, -1 + Math.max(0,  step * .5), 1, 1);
      c.fillRect(-1, -1 + Math.max(0, -step * .5), 1, 1);
      c.fillRect( 1, -1 + Math.max(0,  step * .3), 1, 1);
    } else {
      c.fillRect(-3, -1, 1, 1); c.fillRect(-1, -1, 1, 1); c.fillRect(1, -1, 1, 1);
    }
    c.restore();
  }

  /* ── ATMOSPHERE ── twinkling stars, fog, rain, light shafts, dust motes ── */

  function getToD() {
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    const ss = (t) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
    const NIGHT   = { top:"#05060a", mid:"#080a10", bot:"#11101c", moon:1.0, star:1.0, sun:0, sunX:0.5, sunY:0.15 };
    const PREDAWN = { top:"#06080e", mid:"#0e0a14", bot:"#1c1018", moon:0.9, star:0.8, sun:0, sunX:0.18, sunY:0.36 };
    const DAWN    = { top:"#0a0a1e", mid:"#201426", bot:"#7a2c18", moon:0.4, star:0.2, sun:0.5, sunX:0.18, sunY:0.30 };
    const DAY     = { top:"#0b1522", mid:"#14305a", bot:"#1e4070", moon:0.0, star:0.0, sun:1.0, sunX:0.5, sunY:0.12 };
    const DUSK    = { top:"#080810", mid:"#201020", bot:"#962c10", moon:0.5, star:0.5, sun:0.4, sunX:0.85, sunY:0.24 };
    const EVENING = { top:"#060810", mid:"#100c18", bot:"#180e1c", moon:0.8, star:0.8, sun:0.0, sunX:0.9, sunY:0.3 };
    function blend(a, b, t) {
      const p = ss(t);
      return {
        top: lerpC(a.top, b.top, p), mid: lerpC(a.mid, b.mid, p), bot: lerpC(a.bot, b.bot, p),
        moon: a.moon + (b.moon - a.moon) * p, star: a.star + (b.star - a.star) * p,
        sun:  a.sun  + (b.sun  - a.sun)  * p,
        sunX: a.sunX + (b.sunX - a.sunX) * p, sunY: a.sunY + (b.sunY - a.sunY) * p,
      };
    }
    if      (h >= 22 || h < 4)  return NIGHT;
    else if (h < 5)              return blend(NIGHT, PREDAWN, h - 4);
    else if (h < 6)              return blend(PREDAWN, DAWN, h - 5);
    else if (h < 7)              return blend(DAWN, DAY, h - 6);
    else if (h < 17) {
      const dayP = (h - 7) / 10;
      return { ...DAY, sunX: 0.12 + dayP * 0.76, sunY: 0.22 - Math.sin(dayP * Math.PI) * 0.12 };
    }
    else if (h < 18)             return blend(DAY, DUSK, h - 17);
    else if (h < 20)             return blend(DUSK, EVENING, (h - 18) / 2);
    else                         return blend(EVENING, NIGHT, (h - 20) / 2);
  }

  function drawSky(c) {
    const tod = getToD();
    const sky = c.createLinearGradient(0, 0, 0, BH);
    sky.addColorStop(0, tod.top);
    sky.addColorStop(0.5, tod.mid);
    sky.addColorStop(1, tod.bot);
    c.fillStyle = sky; c.fillRect(0, 0, BW, BH);
    if (tod.sun > 0.01) {
      const sx = BW * tod.sunX, sy = BH * tod.sunY;
      c.globalAlpha = tod.sun * 0.12;
      c.fillStyle = "#ffe880";
      c.beginPath(); c.arc(sx, sy, 20, 0, Math.PI * 2); c.fill();
      c.globalAlpha = tod.sun * 0.45;
      c.fillStyle = "#fff4b0";
      c.beginPath(); c.arc(sx, sy, 9, 0, Math.PI * 2); c.fill();
      c.globalAlpha = tod.sun;
      c.fillStyle = "#fffef8";
      c.beginPath(); c.arc(sx, sy, 4, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
    }
    if (tod.moon > 0.01) {
      const mx = BW * .82, my = BH * .13;
      c.globalAlpha = tod.moon * 0.10;
      c.fillStyle = "#6ecece";
      c.beginPath(); c.arc(mx, my, 14, 0, Math.PI * 2); c.fill();
      c.globalAlpha = tod.moon;
      c.fillStyle = "#cfe8e4";
      c.beginPath(); c.arc(mx, my, 7, 0, Math.PI * 2); c.fill();
      c.globalAlpha = tod.moon * 0.25;
      c.fillStyle = "#1b3a2d";
      c.fillRect(mx - 3, my - 2, 2, 2); c.fillRect(mx + 1, my + 2, 3, 1);
      c.globalAlpha = 1;
    }
  }

  function drawStarOverlay(c) {
    const starA = getToD().star;
    if (starA <= 0.01) return;
    const sRng = mulberry32(42);
    for (let i = 0; i < 35; i++) {
      const sx = sRng() * BW, sy = sRng() * BH * .40;
      const base = .12 + sRng() * .52, ph = sRng() * Math.PI * 2, fr = .6 + sRng() * 2.4;
      c.globalAlpha = starA * Math.max(0, base * (.42 + .58 * Math.sin(t * fr + ph)));
      c.fillStyle = "#ede4d8"; c.fillRect(sx | 0, sy | 0, 1, 1);
    }
    [[BW * .18, BH * .07], [BW * .67, BH * .12], [BW * .44, BH * .05]].forEach(([sx, sy], i) => {
      const pulse = .55 + .45 * Math.sin(t * 1.3 + i * 2.1);
      c.globalAlpha = starA * pulse * .7;
      c.fillStyle = "#d8f0ff"; c.fillRect(sx | 0, sy | 0, 2, 1);
      c.fillRect((sx + 1) | 0, (sy - 1) | 0, 1, 2);
    });
    c.globalAlpha = 1;
  }

  function drawFog(c) {
    const drift = Math.sin(t * .28) * 10, drift2 = Math.cos(t * .19) * 7;
    /* low-lying ground mist — two drifting lobes */
    const f1 = c.createRadialGradient(ox + drift, oy + 8, 0, ox + drift, oy + 8, BW * .52);
    f1.addColorStop(0, "rgba(38,14,55,.14)");
    f1.addColorStop(.45, "rgba(28,10,44,.08)");
    f1.addColorStop(1, "rgba(28,10,44,0)");
    c.fillStyle = f1; c.fillRect(0, oy - 20, BW, BH);
    const f2 = c.createRadialGradient(ox + drift2 - 30, oy + 16, 0, ox + drift2 - 30, oy + 16, BW * .35);
    f2.addColorStop(0, "rgba(20,8,36,.10)");
    f2.addColorStop(1, "rgba(20,8,36,0)");
    c.fillStyle = f2; c.fillRect(0, oy - 10, BW, BH);
    /* horizon warm city glow — Art Deco ambiance */
    const hg = c.createLinearGradient(0, oy - R * th / 2 - 8, 0, oy - R * th / 2 + 18);
    hg.addColorStop(0, "rgba(204,74,18,0)");
    hg.addColorStop(.5, `rgba(204,74,18,${.04 + .02 * Math.sin(t * .7)})`);
    hg.addColorStop(1, "rgba(204,74,18,0)");
    c.fillStyle = hg; c.fillRect(0, oy - R * th / 2 - 8, BW, 26);
  }

  function drawRain(c) {
    /* rain streaks */
    c.strokeStyle = "rgba(155,200,235,.09)"; c.lineWidth = .5;
    c.beginPath();
    rain.forEach((r) => { c.moveTo(r.x, r.y); c.lineTo(r.x + r.len * .45, r.y + r.len); });
    c.stroke();
    /* ripples — isometric oval on the cobblestones */
    ripples.forEach((rp) => {
      c.globalAlpha = rp.a;
      c.strokeStyle = "rgba(120,185,225,.6)"; c.lineWidth = .5;
      c.beginPath(); c.ellipse(rp.x, rp.y, rp.r * 2.4, rp.r * .75, 0, 0, Math.PI * 2); c.stroke();
    });
    c.globalAlpha = 1;
  }

  function drawLightShafts(c) {
    c.globalCompositeOperation = "lighter";
    /* amber window shafts from buildings */
    buildings.forEach((b) => {
      (b.spec.lights || []).forEach((l) => {
        const lx = b.x + l[0], ly = b.y + l[1] + 12;
        const a = (.035 + .015 * Math.sin(t * .8 + b.x * .09));
        const sg = c.createLinearGradient(lx, ly, lx + 14, ly + 28);
        sg.addColorStop(0, `rgba(255,195,90,${a * 1.8})`);
        sg.addColorStop(1, "rgba(255,195,90,0)");
        c.fillStyle = sg;
        c.beginPath();
        c.moveTo(lx - 3, ly); c.lineTo(lx + 3, ly);
        c.lineTo(lx + 18, ly + 28); c.lineTo(lx - 6, ly + 28);
        c.closePath(); c.fill();
      });
    });
    /* glacier shaft from atelier windows */
    if (buildings[2]) {
      const b = buildings[2];
      const la = .028 + .012 * Math.sin(t * 1.1 + 3);
      const sg = c.createLinearGradient(b.x, b.y - 28, b.x + 18, b.y + 8);
      sg.addColorStop(0, `rgba(110,206,206,${la * 1.5})`);
      sg.addColorStop(1, "rgba(110,206,206,0)");
      c.fillStyle = sg;
      c.beginPath();
      c.moveTo(b.x - 4, b.y - 28); c.lineTo(b.x + 6, b.y - 28);
      c.lineTo(b.x + 22, b.y + 8); c.lineTo(b.x - 6, b.y + 8);
      c.closePath(); c.fill();
    }
    c.globalCompositeOperation = "source-over";
  }

  function drawDustMotes(c) {
    c.globalCompositeOperation = "lighter";
    dustMotes.forEach((dm) => {
      const a = Math.max(0, dm.life);
      c.globalAlpha = a * .22;
      glowAt(c, dm.x, dm.y, 3, dm.rgb, .28);
      c.globalAlpha = a * .55;
      c.fillStyle = `rgba(${dm.rgb},${a * .7})`;
      c.fillRect(dm.x | 0, dm.y | 0, 1, 1);
    });
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
  }

  function drawHolo(c, b) {
    const bob = Math.sin(t * 1.4 + b.ph) * 1.5;
    const glitch = Math.sin(t * 17 + b.ph * 5) > .96;
    const gx = b.x + (glitch ? (Math.random() < .5 ? -1 : 1) : 0);
    const gy = b.y + bob;
    c.globalAlpha = glitch ? .4 : .8 + Math.sin(t * 2 + b.ph) * .12;
    c.fillStyle = "rgba(8,12,16,.66)";
    c.fillRect(gx - b.w / 2, gy - b.h / 2, b.w, b.h);
    c.strokeStyle = b.col || C.glacier; c.lineWidth = 1;
    c.strokeRect(gx - b.w / 2 + .5, gy - b.h / 2 + .5, b.w - 1, b.h - 1);
    /* billboard text rendered hi-res in renderHiResText() */
    /* projection beam */
    c.globalAlpha = .12;
    c.fillStyle = b.col || C.glacier;
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

  /* ── NEON LOGO SIGN — bare concentric-circle orb, no backing panel ── */
  function drawNeonLogoSign(c) {
    if (!monument) return;
    const x = monument.x;
    const bob = Math.sin(t * 1.2) * 1.5;
    const pulse = .75 + Math.sin(t * 1.6) * .25;
    const sCX = x, sCY = monument.y - 70 + bob;

    c.save();

    /* suspension wires from just above the orb edge */
    c.strokeStyle = "rgba(50,40,60,0.85)";
    c.lineWidth = .5;
    c.beginPath();
    c.moveTo(Math.round(sCX - 10), Math.round(sCY - 12));
    c.lineTo(Math.round(sCX - 10), Math.round(sCY - 28));
    c.moveTo(Math.round(sCX + 10), Math.round(sCY - 12));
    c.lineTo(Math.round(sCX + 10), Math.round(sCY - 28));
    c.stroke();
    /* bracket bolts */
    c.fillStyle = C.stoneB;
    c.fillRect(Math.round(sCX - 11), Math.round(sCY - 29), 2, 1);
    c.fillRect(Math.round(sCX +  9), Math.round(sCY - 29), 2, 1);

    /* broad atmospheric glow (additive) */
    c.globalCompositeOperation = "lighter";
    glowAt(c, sCX, sCY, 26, "204,74,18",  .14 * pulse);
    glowAt(c, sCX, sCY, 12, "110,206,206", .12 * pulse);
    c.globalCompositeOperation = "source-over";

    /* neon pre-glow halos under rings */
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = .22 * pulse;
    c.fillStyle = C.molten;
    c.beginPath(); c.arc(sCX, sCY, 14, 0, Math.PI * 2); c.fill();
    c.globalAlpha = .18 * pulse;
    c.fillStyle = C.glacier;
    c.beginPath(); c.arc(sCX, sCY, 3.5, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;

    /* concentric rings — brand proportions */
    const rings = [
      { r: 11,  col: "#3A1A08" },
      { r: 9.4, col: "#8B3A1E" },
      { r: 7.7, col: "#CC4A12" },
      { r: 6.0, col: "#5C2510" },
      { r: 4.4, col: "#3D2645" },
      { r: 2.7, col: "#6ECECE" },
      { r: 1.1, col: "#050403" },
    ];
    rings.forEach(({ r, col }) => {
      c.fillStyle = col;
      c.beginPath(); c.arc(sCX, sCY, r, 0, Math.PI * 2); c.fill();
    });

    /* outer white circle */
    c.strokeStyle = "rgba(218,210,192,0.72)";
    c.lineWidth = .5;
    c.beginPath(); c.arc(sCX, sCY, 11, 0, Math.PI * 2); c.stroke();

    /* horizontal crosshair */
    c.strokeStyle = "rgba(0,0,0,0.65)";
    c.lineWidth = .5;
    c.beginPath();
    c.moveTo(sCX - 11, sCY); c.lineTo(sCX + 11, sCY);
    c.stroke();

    /* additive shimmer on orange + cyan rings */
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = .15 * pulse;
    c.strokeStyle = C.molten; c.lineWidth = 2.5;
    c.beginPath(); c.arc(sCX, sCY, 8.5, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = .22 * pulse;
    c.strokeStyle = C.glacier; c.lineWidth = 1.5;
    c.beginPath(); c.arc(sCX, sCY, 2.7, 0, Math.PI * 2); c.stroke();
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;

    c.restore();
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
      const bpy = Math.max(20, Math.round(b.y - b.spec.ay + 10));
      const [sx, sy] = b2s(bpx, bpy);

      /* measure at the larger size first */
      sc.font = `bold 15px "Courier New",monospace`;
      const nameW = sc.measureText(b.label).width;
      sc.font = `10px "Courier New",monospace`;
      const hintW = sc.measureText(b.hint).width;
      const wdt = Math.round(Math.max(nameW, hintW)) + 22;
      const ht = near ? 42 : 36;

      sc.globalAlpha = near ? 1 : 0.82;

      /* background */
      sc.fillStyle = "rgba(4,5,10,0.94)";
      sc.fillRect(sx - Math.round(wdt / 2), sy - Math.round(ht / 2), wdt, ht);

      /* border — double-stroke neon effect */
      sc.lineWidth = near ? 1.5 : 1;
      sc.strokeStyle = near ? C.acid : "rgba(110,206,206,0.65)";
      if (near) { sc.shadowColor = C.acid; sc.shadowBlur = 10; }
      sc.strokeRect(sx - Math.round(wdt / 2) + 0.5, sy - Math.round(ht / 2) + 0.5, wdt - 1, ht - 1);
      sc.shadowBlur = 0;

      /* top accent line */
      sc.fillStyle = near ? C.acid : C.glacier;
      sc.globalAlpha = near ? 0.9 : 0.5;
      sc.fillRect(sx - Math.round(wdt / 2) + 4, sy - Math.round(ht / 2), wdt - 8, 2);
      sc.globalAlpha = near ? 1 : 0.82;

      /* building name — always bold, large */
      sc.font = `bold 15px "Courier New",monospace`;
      sc.fillStyle = near ? C.acid : C.linen;
      sc.textAlign = "center";
      if (near) { sc.shadowColor = C.acid; sc.shadowBlur = 12; }
      sc.fillText(b.label, sx, sy - 7);
      sc.shadowBlur = 0;

      /* hint subtitle — small, dimmed */
      sc.font = `10px "Courier New",monospace`;
      sc.fillStyle = near ? "rgba(181,204,69,0.85)" : "rgba(110,206,206,0.6)";
      sc.fillText(b.hint, sx, sy + 9);

      /* "»" enter indicator when near */
      if (near) {
        sc.font = `bold 10px "Courier New",monospace`;
        sc.fillStyle = C.acid;
        sc.shadowColor = C.acid; sc.shadowBlur = 6;
        sc.fillText("» ENTER", sx, sy + 22);
        sc.shadowBlur = 0;
      }

      sc.globalAlpha = 1;
    });

    /* monument wordmark removed — logo orb speaks for itself */

    /* Billboard text */
    billboards.forEach((b) => {
      const bob = Math.sin(t * 1.4 + b.ph) * 1.5;
      const glitch = Math.sin(t * 17 + b.ph * 5) > 0.96;
      const bbx = b.x + (glitch ? (Math.random() < 0.5 ? -1 : 1) : 0);
      const [sx, sy] = b2s(bbx, b.y + bob);
      sc.globalAlpha = glitch ? 0.4 : 0.85 + Math.sin(t * 2 + b.ph) * 0.1;
      sc.textAlign = "center";
      const lineH = 13;
      const bc = b.col || C.glacier;
      b.lines.forEach((ln, i) => {
        sc.font = `${i === 0 ? "bold " : ""}9px "Courier New",monospace`;
        sc.fillStyle = i === 0 ? bc : "rgba(181,204,69,0.75)";
        sc.shadowColor = i === 0 ? bc : C.acid;
        sc.shadowBlur = 5;
        sc.fillText(ln, sx, sy - (b.lines.length - 1) * lineH / 2 + i * lineH);
      });
      sc.shadowBlur = 0; sc.globalAlpha = 1;
    });

    /* hi-res rain streaks — crisper on retina/upscaled canvas */
    sc.strokeStyle = "rgba(150,200,235,.055)"; sc.lineWidth = .6;
    sc.beginPath();
    rain.forEach((r) => {
      const [rx, ry] = [r.x * S + ofx, r.y * S + ofy];
      sc.moveTo(rx, ry); sc.lineTo(rx + r.len * .45 * S, ry + r.len * S);
    });
    sc.stroke();
    /* hi-res ripple ovals */
    sc.lineWidth = .5;
    ripples.forEach((rp) => {
      sc.globalAlpha = rp.a * .55;
      sc.strokeStyle = "rgba(120,185,225,.7)";
      sc.beginPath();
      sc.ellipse(rp.x * S + ofx, rp.y * S + ofy, rp.r * 2.4 * S, rp.r * .75 * S, 0, 0, Math.PI * 2);
      sc.stroke();
    });
    sc.globalAlpha = 1;

    sc.textAlign = "left";
    sc.restore();
  }

  function render() {
    bctx.clearRect(0, 0, BW, BH);
    drawSky(bctx);           /* time-of-day sky behind everything */
    bctx.drawImage(ground, 0, 0);

    /* twinkling star overlay — before anything so buildings occlude */
    drawStarOverlay(bctx);

    /* additive ground light pools */
    bctx.globalCompositeOperation = "lighter";
    torches.forEach((tc) => {
      const f = flick(tc.ph);
      if (tc.lamp) {
        /* lamppost — cool glacier steady glow, two-tier */
        glowAt(bctx, tc.x, tc.gy, 22, "110,206,206", .055);
        glowAt(bctx, tc.x, tc.gy,  9, "200,240,240", .09);
      } else {
        /* torch — warm amber flicker, two-tier */
        glowAt(bctx, tc.x, tc.gy, 22 + 5 * f, "204,74,18", .06 * f);
        glowAt(bctx, tc.x, tc.gy, 13 + 4 * f, "204,74,18", .13 * f);
      }
    });
    const mp = .75 + Math.sin(t * 1.6) * .25;
    glowAt(bctx, monument.x, monument.y, 36, "204,74,18", .09 * mp);
    glowAt(bctx, monument.x, monument.y, 16, "110,206,206", .07);
    glowAt(bctx, monument.x, monument.y - 70, 26, "204,74,18", .08 * mp);
    bctx.globalCompositeOperation = "source-over";

    /* depth-sorted world + player + roaming cat */
    const items = drawables.slice();
    items.push({ depth: player.y, draw: drawPlayer });
    if (roamCat) items.push({ depth: roamCat.y, draw: drawRoamingCat });
    items.sort((p, q) => p.depth - q.depth);
    items.forEach((d) => d.draw(bctx));

    /* warm window light shafts through the scene */
    drawLightShafts(bctx);

    /* flames above everything */
    torches.forEach((tc) => {
      if (!tc.lamp) drawFlame(bctx, tc.x, tc.y, flick(tc.ph));
    });
    blinkers.forEach((bl) => {
      const on = Math.sin(t * 3 + bl.ph) > 0;
      if (on) {
        bctx.fillStyle = "#ff3b30"; bctx.fillRect(bl.x, bl.y, 1, 1);
        glowAt(bctx, bl.x, bl.y, 4, "255,59,48", .4);
      }
    });

    drawMonumentHolo(bctx);
    drawNeonLogoSign(bctx);
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

    /* atmospheric layers (fog, dust, rain) on top of scene */
    drawDustMotes(bctx);
    drawFog(bctx);
    drawRain(bctx);

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
    S = W < 640 ? 3 : 2;   /* S=2 gives finer 2×2 pixels vs old 3×3 on most screens */
    screen.width = W; screen.height = H;
  }

  function exitThen(fn) {
    stop();
    window.dispatchEvent(new CustomEvent("compound-universe:exit"));
    if (fn) setTimeout(fn, 420);
  }

  /* true if user asked for reduced motion */
  const reduceMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function injectStyles() {
    if (document.getElementById("cu-styles")) return;
    const st = document.createElement("style");
    st.id = "cu-styles";
    st.textContent = `
/* ── compound-universe overlay — all classes namespaced cu- ── */
#cu-root{position:fixed;inset:0;z-index:999998;background:${C.night};
  opacity:0;cursor:default;outline:none;}
#cu-root{transition:opacity .6s ease;}
@media (prefers-reduced-motion:reduce){
  #cu-root{transition:opacity .15s ease;}
  #cu-prompt{transition:none !important;}
}
#cu-root.on{opacity:1;}
#cu-canvas{display:block;width:100%;height:100%;image-rendering:pixelated;
  filter:saturate(1.18) contrast(1.06) brightness(0.97);}
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
#cu-close{position:absolute;top:16px;right:20px;z-index:1;
  background:rgba(6,8,12,.82);border:1px solid rgba(255,0,60,.45);
  color:#ff003c;font:700 10px "Courier New",monospace;letter-spacing:2px;
  padding:8px 14px;cursor:pointer;border-radius:3px;
  text-shadow:0 0 6px rgba(255,0,60,.6);
  transition:background .2s ease, border-color .2s ease;}
#cu-close:hover,#cu-close:focus{background:rgba(255,0,60,.18);
  border-color:rgba(255,0,60,.8);outline:2px solid rgba(255,0,60,.5);outline-offset:2px;}
#cu-hint{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);
  display:flex;gap:14px;align-items:center;white-space:nowrap;
  font:700 10px "Courier New",monospace;letter-spacing:1px;
  color:rgba(237,228,216,.75);background:rgba(6,8,12,.78);
  border:1px solid rgba(110,206,206,.25);
  padding:8px 16px;border-radius:20px;pointer-events:none;}
/* mobile d-pad — shown only on touch screens */
#cu-dpad{position:absolute;bottom:24px;right:20px;
  display:none;grid-template-columns:repeat(3,40px);grid-template-rows:repeat(3,40px);
  gap:3px;z-index:2;}
#cu-root.touch #cu-dpad{display:grid;}
#cu-root.touch #cu-hint{display:none;}
.cu-dp{background:rgba(6,8,12,.75);border:1px solid rgba(110,206,206,.3);
  color:${C.glacier};font-size:16px;display:flex;align-items:center;
  justify-content:center;border-radius:4px;cursor:pointer;user-select:none;
  -webkit-user-select:none;touch-action:manipulation;}
.cu-dp:active{background:rgba(110,206,206,.18);}
.cu-dp-blank{pointer-events:none;}
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
  opacity:0;transition:opacity .2s ease, transform .2s ease;pointer-events:none;
  aria-live:polite;}
#cu-prompt.on{opacity:1;transform:translate(-50%,0);}
@media (max-width:640px){#cu-hint{display:none;}}
    `;
    document.head.appendChild(st);
  }

  /* ── touch / swipe control ── */
  let touchStart = null, touchKeys = {};
  function onTouchStart(e) {
    const t2 = e.touches[0];
    touchStart = { x: t2.clientX, y: t2.clientY };
    touchKeys = {};
  }
  function onTouchMove(e) {
    if (!touchStart) return;
    e.preventDefault();
    const t2 = e.touches[0];
    const dx = t2.clientX - touchStart.x, dy = t2.clientY - touchStart.y;
    const thresh = 12;
    touchKeys = {};
    if (Math.abs(dx) > thresh || Math.abs(dy) > thresh) {
      /* isometric swipe mapping: screen X → iso right/left, screen Y → iso down/up */
      if (dx > thresh)  touchKeys.right = true;
      if (dx < -thresh) touchKeys.left  = true;
      if (dy > thresh)  touchKeys.down  = true;
      if (dy < -thresh) touchKeys.up    = true;
    }
    Object.assign(keys, touchKeys);
  }
  function onTouchEnd() {
    touchStart = null;
    ["left","right","up","down"].forEach(k => { if (touchKeys[k]) keys[k] = false; });
    touchKeys = {};
  }

  /* ── focus trap ── */
  let prevFocus = null;
  function trapFocus(e) {
    if (!root) return;
    const focusable = Array.from(root.querySelectorAll(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.disabled);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  }

  function start() {
    if (active) return;
    active = true;
    injectStyles();

    prevFocus = document.activeElement;

    root = document.createElement("div");
    root.id = "cu-root";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Compound Universe — interactive isometric world");
    root.setAttribute("tabindex", "-1");

    screen = document.createElement("canvas");
    screen.id = "cu-canvas";
    screen.setAttribute("aria-hidden", "true");
    root.appendChild(screen);

    const scan = document.createElement("div");
    scan.id = "cu-scan"; root.appendChild(scan);

    const title = document.createElement("div");
    title.id = "cu-title"; title.textContent = "COMPOUND // UNIVERSE 01";
    title.setAttribute("aria-hidden", "true");
    root.appendChild(title);

    /* close button — keyboard-accessible, always visible */
    const closeBtn = document.createElement("button");
    closeBtn.id = "cu-close";
    closeBtn.type = "button";
    closeBtn.textContent = "↩ RETURN TO THE MUNDANE";
    closeBtn.setAttribute("aria-label", "Exit Compound Universe and return to the main site");
    closeBtn.addEventListener("click", () => exitThen(null));
    root.appendChild(closeBtn);

    promptEl = document.createElement("div");
    promptEl.id = "cu-prompt";
    promptEl.setAttribute("role", "status");
    promptEl.setAttribute("aria-live", "polite");
    root.appendChild(promptEl);

    hintEl = document.createElement("div");
    hintEl.id = "cu-hint";
    hintEl.setAttribute("aria-hidden", "true");
    hintEl.innerHTML =
      '<span><span class="cu-key">↑↓←→</span> move</span>' +
      '<span><span class="cu-key">SPACE</span> jump</span>' +
      '<span><span class="cu-key">ENTER</span> interact</span>' +
      '<span><span class="cu-key">ESC</span> leave</span>';
    root.appendChild(hintEl);

    /* mobile d-pad — only shown on touch devices */
    const dpad = document.createElement("div");
    dpad.id = "cu-dpad"; dpad.setAttribute("aria-hidden", "true");
    const dp = (label, dir) => {
      const b = document.createElement("div");
      b.className = dir ? "cu-dp" : "cu-dp cu-dp-blank";
      b.textContent = label;
      if (dir) {
        b.addEventListener("pointerdown", () => { keys[dir] = true; });
        b.addEventListener("pointerup",   () => { keys[dir] = false; });
        b.addEventListener("pointerleave",() => { keys[dir] = false; });
      }
      return b;
    };
    dpad.append(dp("",""), dp("▲","up"), dp("",""),
                dp("◀","left"), dp("",""), dp("▶","right"),
                dp("",""), dp("▼","down"), dp("",""));
    root.appendChild(dpad);

    /* detect touch device */
    if (window.matchMedia("(hover:none) and (pointer:coarse)").matches)
      root.classList.add("touch");

    document.body.appendChild(root);
    sctx = screen.getContext("2d");

    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    sizeScreen();
    buildWorld();

    keys = {};
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keydown", trapFocus);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);
    screen.addEventListener("touchstart",  onTouchStart, { passive: true });
    screen.addEventListener("touchmove",   onTouchMove,  { passive: false });
    screen.addEventListener("touchend",    onTouchEnd,   { passive: true });
    screen.addEventListener("touchcancel", onTouchEnd,   { passive: true });

    requestAnimationFrame(() => {
      root.classList.add("on");
      closeBtn.focus();
    });
    lastNow = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (!active) return;
    active = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keydown", trapFocus);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("resize", onResize);
    clearTimeout(resizeTimer);
    document.documentElement.style.overflow = prevOverflow;
    if (prevFocus && prevFocus.focus) prevFocus.focus();
    prevFocus = null;
    if (root) {
      const r = root;
      r.classList.remove("on");
      setTimeout(() => r.remove(), reduceMotion() ? 0 : 650);
      root = null; screen = null; sctx = null;
    }
    ground = null; buf = null; bctx = null;
    drawables = []; torches = []; embers = []; flies = [];
    buildings = []; billboards = []; blinkers = [];
    roamCat = null;
    rain = []; ripples = []; dustMotes = []; cloudOff = 0;
    promptEl = null; hintEl = null; nearBuilding = null;
    touchStart = null; touchKeys = {};
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
