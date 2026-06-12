(function () {
  const STORAGE_KEY = "cyberpunk-mode";

  /* ── Styles ─────────────────────────────────────────────────────────── */
  const style = document.createElement("style");
  style.id = "cyberpunk-theme-styles";
  style.textContent = `

/* ================================================================
   COMPOUND — ALTERNATE UNIVERSE
   Performance rule: only animate transform + opacity (GPU layers).
   No box-shadow, filter, or color keyframes on looping animations.
================================================================ */

/* ── Keyframes (GPU-only) ── */
@keyframes cyber-scan {
  0%   { transform: translateY(-100vh); }
  100% { transform: translateY(100vh); }
}
@keyframes cyber-flicker {
  0%,89%,100% { opacity:1; }
  90% { opacity:.72; } 92% { opacity:.98; }
  94% { opacity:.68; } 96% { opacity:.96; }
}
@keyframes cyber-glitch {
  0%,95%,100% { clip-path:none; transform:none; }
  96% { clip-path:inset(18% 0 55% 0); transform:translate(-4px,0); }
  97% { clip-path:inset(62% 0 8% 0);  transform:translate(4px,0); }
  98% { clip-path:inset(38% 0 30% 0); transform:translate(-2px,0); }
  99% { clip-path:none; transform:none; }
}
@keyframes cyber-pulse-opacity {
  0%,100% { opacity:.5; }
  50%      { opacity:1; }
}
@keyframes cyber-logo-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ── Base ── */
html.cyberpunk-mode { background:#0a0a12 !important; }
html.cyberpunk-mode body {
  background:#0a0a12 !important;
  color:#e6e6fa !important;
}

/* Scanline texture (static, no animation cost) */
html.cyberpunk-mode body::before {
  content:"";
  position:fixed; inset:0; pointer-events:none; z-index:999997;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px,
    rgba(0,240,255,.014) 3px, rgba(0,0,0,.05) 4px
  );
  mix-blend-mode:overlay;
}

/* Moving scan line (transform only → GPU) */
html.cyberpunk-mode body::after {
  content:"";
  position:fixed; left:0; right:0; height:2px; top:0;
  background:linear-gradient(90deg,transparent,rgba(0,240,255,.55),transparent);
  pointer-events:none; z-index:999997;
  will-change:transform;
  animation: cyber-scan 8s linear infinite;
  box-shadow:0 0 14px rgba(0,240,255,.4);
}

/* ── HERO ── */
html.cyberpunk-mode #hero {
  background: #0a0a12 !important;
  position: relative;
}

/* Canvas world sits behind all hero content */
#cp-world {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 0;
  will-change: transform;
  opacity: 0;
  transition: opacity 1s ease;
}
#cp-world.visible { opacity: 1; }

/* All hero content above canvas */
html.cyberpunk-mode #hero .hero-top,
html.cyberpunk-mode #hero .hero-center,
html.cyberpunk-mode #hero .hero-bottom { position: relative; z-index: 1; }

/* Logo */
html.cyberpunk-mode #logo-mark {
  will-change: transform;
  filter: drop-shadow(0 0 16px rgba(0,240,255,.5)) !important;
}

/* Hero top words */
html.cyberpunk-mode .hero-top-word {
  color:#b5ff00 !important;
  text-shadow:0 0 8px rgba(181,255,0,.7), 0 0 18px rgba(181,255,0,.25) !important;
  letter-spacing:.32em !important;
}

/* Hero big text base */
html.cyberpunk-mode .hero-bc {
  color:#00f0ff !important;
  text-shadow:0 0 12px rgba(0,240,255,.35) !important;
}

/* Hero side labels */
html.cyberpunk-mode .hero-bl,
html.cyberpunk-mode .hero-br {
  color:#bf00ff !important;
  text-shadow:0 0 5px rgba(191,0,255,.6) !important;
}

/* ── NAV ── */
html.cyberpunk-mode nav { background:transparent !important; }
html.cyberpunk-mode .nav-brand {
  color:#00f0ff !important;
  text-shadow:0 0 8px rgba(0,240,255,.8) !important;
  letter-spacing:.38em !important;
}
html.cyberpunk-mode .nav-btn {
  color:#b5ff00 !important;
  text-shadow:0 0 6px rgba(181,255,0,.7) !important;
}

/* ── MARQUEE ── */
html.cyberpunk-mode .marquee-strip {
  background:#0d0d1a !important;
  border-top:1px solid rgba(0,240,255,.2) !important;
  border-bottom:1px solid rgba(0,240,255,.2) !important;
}
html.cyberpunk-mode .marquee-inner {
  will-change: transform;
}
html.cyberpunk-mode .marquee-inner span {
  color:#b5ff00 !important;
  text-shadow: 0 0 10px rgba(181,255,0,.7) !important;
}

/* ── ABOUT (manifesto) ── */
html.cyberpunk-mode #about {
  background:
    radial-gradient(ellipse 60% 80% at 80% 50%, rgba(191,0,255,.05) 0%, transparent 70%),
    #0f0a1a !important;
}
html.cyberpunk-mode .at-welcome {
  color:#FF003C !important;
  text-shadow:0 0 8px rgba(255,0,60,.7), 0 0 28px rgba(255,0,60,.3) !important;
  animation: cyber-glitch 9s infinite !important;
}
html.cyberpunk-mode .at-intro,
html.cyberpunk-mode .at-body { color:rgba(230,230,250,.8) !important; }
html.cyberpunk-mode .at-pullquote {
  color:#00f0ff !important;
  text-shadow:0 0 10px rgba(0,240,255,.5) !important;
}
html.cyberpunk-mode .at-rule { background:#00f0ff !important; opacity:.35 !important; }
html.cyberpunk-mode .at-def-line {
  color:#bf00ff !important;
  text-shadow:0 0 5px rgba(191,0,255,.45) !important;
}
html.cyberpunk-mode .at-philosophy {
  color:#b5ff00 !important;
  text-shadow:0 0 5px rgba(181,255,0,.4) !important;
}
html.cyberpunk-mode .at-closing p {
  color:#FF003C !important;
  text-shadow:0 0 8px rgba(255,0,60,.6), 0 0 20px rgba(255,0,60,.25) !important;
}
html.cyberpunk-mode .about-label { color:#00f0ff !important; text-shadow:0 0 10px rgba(0,240,255,.6) !important; }
html.cyberpunk-mode .about-est   { color:rgba(230,230,250,.4) !important; }
html.cyberpunk-mode .about-divider { background:#00f0ff !important; opacity:.18 !important; }

/* Pillars */
html.cyberpunk-mode .pillar h3 { color:#b5ff00 !important; text-shadow:0 0 5px rgba(181,255,0,.4) !important; }
html.cyberpunk-mode .pillar p  { color:rgba(230,230,250,.7) !important; }
html.cyberpunk-mode .pillar::before { background:#00f0ff !important; }

/* Colour blocks */
html.cyberpunk-mode .cb-block {
  filter:saturate(1.3) brightness(.75) !important;
  border:1px solid rgba(0,240,255,.12) !important;
}

/* ── CONTACT ── */
html.cyberpunk-mode #contact {
  background:
    radial-gradient(ellipse 70% 50% at 20% 80%, rgba(0,240,255,.04) 0%, transparent 60%),
    #080810 !important;
  border-top:1px solid rgba(0,240,255,.12) !important;
}
html.cyberpunk-mode .c-tag { color:rgba(0,240,255,.5) !important; }
html.cyberpunk-mode .inquire {
  color:#FF003C !important;
  text-shadow:0 0 14px rgba(255,0,60,.7), 0 0 36px rgba(255,0,60,.3) !important;
  animation: cyber-flicker 5s infinite !important;
  will-change: opacity;
}
html.cyberpunk-mode .inquire-arrow { color:#00f0ff !important; }
html.cyberpunk-mode .c-info h3 { color:#00f0ff !important; text-shadow:0 0 7px rgba(0,240,255,.5) !important; }
html.cyberpunk-mode .etype { color:rgba(181,255,0,.6) !important; }
html.cyberpunk-mode .edet a { color:#00f0ff !important; text-shadow:0 0 4px rgba(0,240,255,.4) !important; }

/* Form */
html.cyberpunk-mode .field label { color:rgba(181,255,0,.7) !important; }
html.cyberpunk-mode .field input,
html.cyberpunk-mode .field textarea {
  color:#e6e6fa !important;
  caret-color:#FF003C !important;
  background:transparent !important;
}
html.cyberpunk-mode .field input::placeholder,
html.cyberpunk-mode .field textarea::placeholder { color:transparent !important; }
html.cyberpunk-mode .field-line { background:#00f0ff !important; }
html.cyberpunk-mode .f-submit {
  color:#00f0ff !important;
  text-shadow:0 0 7px rgba(0,240,255,.6) !important;
  border:none !important; box-shadow:none !important; background:none !important;
}

/* ── FOOTER ── */
html.cyberpunk-mode footer {
  background:#080810 !important;
  border-top:1px solid rgba(0,240,255,.1) !important;
}
html.cyberpunk-mode .f-brand  { color:rgba(0,240,255,.35) !important; }
html.cyberpunk-mode .f-tagline { color:rgba(181,255,0,.3) !important; }

/* ── MENU OVERLAY ── */
html.cyberpunk-mode #menu {
  background:#0a0a14 !important;
  border-bottom:1px solid rgba(0,240,255,.18) !important;
}
html.cyberpunk-mode .m-links a {
  color:#e6e6fa !important;
  text-shadow:none !important;
}
html.cyberpunk-mode .m-links a:hover {
  color:#FF003C !important;
  text-shadow:0 0 14px rgba(255,0,60,.7) !important;
}
html.cyberpunk-mode .m-tag { color:rgba(0,240,255,.4) !important; }
html.cyberpunk-mode .m-foot p { color:rgba(181,255,0,.3) !important; }

/* ── THE TOGGLE BUTTON ── */
#cyberpunk-toggle-btn {
  position:fixed; bottom:24px; right:24px; z-index:999999;
  padding:11px 17px;
  font-family:"Courier New", monospace;
  font-size:11px; font-weight:700; letter-spacing:1.5px;
  max-width:300px; text-align:center;
  cursor:pointer; border-radius:3px;
  will-change: transform, opacity;
  transition: transform .18s ease, opacity .2s ease, border-color .2s ease, color .2s ease;
}
html.cyberpunk-mode #cyberpunk-toggle-btn {
  background:#0a0a12;
  color:#00f0ff;
  border:1px solid #00f0ff;
  box-shadow:0 0 10px rgba(0,240,255,.5), inset 0 0 6px rgba(0,240,255,.06);
  text-shadow:0 0 5px rgba(0,240,255,.7);
  animation: cyber-pulse-opacity 2.8s ease-in-out infinite;
}
html.cyberpunk-mode #cyberpunk-toggle-btn:hover {
  transform:translateY(-2px);
  border-color:#FF003C;
  color:#FF003C;
  text-shadow:0 0 7px rgba(255,0,60,.8);
  animation:none;
  opacity:1;
}
html:not(.cyberpunk-mode) #cyberpunk-toggle-btn {
  background:rgba(10,10,18,.82);
  color:#e6e6fa;
  border:1px solid rgba(230,230,250,.22);
  box-shadow:0 2px 10px rgba(0,0,0,.45);
  backdrop-filter:blur(8px);
}
html:not(.cyberpunk-mode) #cyberpunk-toggle-btn:hover {
  transform:translateY(-2px);
  border-color:rgba(0,240,255,.45);
  color:#00f0ff;
}
  `;
  document.head.appendChild(style);

  /* ── Canvas World ────────────────────────────────────────────────────── */
  let canvas = null, ctx = null, raf = null;
  let W = 0, H = 0, scrollOff = 0, t = 0;
  const pts = [];

  const HUES = [180, 280, 60, 0]; // cyan, violet, lime, crimson

  function spawnParticles() {
    pts.length = 0;
    for (let i = 0; i < 38; i++) {
      pts.push({
        x:  Math.random(),
        y:  Math.random(),
        vx: (Math.random() - 0.5) * 0.00018,
        vy: (Math.random() - 0.5) * 0.00018,
        r:  Math.random() * 1.4 + 0.5,
        hue: HUES[Math.floor(Math.random() * HUES.length)],
        ph: Math.random() * Math.PI * 2,
      });
    }
  }

  function resize() {
    if (!canvas) return;
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function onScroll() { scrollOff = window.scrollY; }

  function tick() {
    if (!canvas || !ctx) return;
    t += 0.006;
    ctx.clearRect(0, 0, W, H);

    /* Grid — shifts upward on scroll (parallax 0.25) */
    const gSize = 64;
    const gOffY = (scrollOff * 0.25) % gSize;
    ctx.lineWidth = 1;

    /* Vertical lines (no parallax) */
    ctx.strokeStyle = "rgba(0,240,255,0.035)";
    for (let x = 0; x < W; x += gSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    /* Horizontal lines (scroll parallax) */
    for (let y = -gSize + gOffY; y < H + gSize; y += gSize) {
      const dist = Math.abs(y - H * 0.5) / (H * 0.5);
      ctx.strokeStyle = `rgba(0,240,255,${0.055 - dist * 0.045})`;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    /* Horizon glow line */
    const horizY = H * 0.72 - scrollOff * 0.18;
    const hg = ctx.createLinearGradient(0, horizY - 2, 0, horizY + 2);
    hg.addColorStop(0, "transparent");
    hg.addColorStop(0.5, `rgba(0,240,255,${0.18 + Math.sin(t) * 0.06})`);
    hg.addColorStop(1, "transparent");
    ctx.fillStyle = hg;
    ctx.fillRect(0, horizY - 2, W, 4);

    /* Aurora bands */
    const bands = [
      { hue: 180, cy: 0.28 + Math.sin(t * 0.6) * 0.04, px: 0.12, size: 0.55 },
      { hue: 280, cy: 0.55 + Math.sin(t * 0.45 + 1.2) * 0.05, px: 0.2, size: 0.6 },
    ];
    bands.forEach(b => {
      const cy = b.cy * H - scrollOff * b.px;
      const g = ctx.createRadialGradient(W * 0.5, cy, 0, W * 0.5, cy, W * b.size);
      g.addColorStop(0, `hsla(${b.hue},100%,60%,0.055)`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });

    /* Particles */
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
      const px = p.x * W;
      const py = p.y * H - scrollOff * 0.08;
      const alpha = 0.35 + Math.sin(t + p.ph) * 0.28;
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},100%,70%,${Math.max(0, alpha)})`;
      ctx.fill();
    });

    raf = requestAnimationFrame(tick);
  }

  function buildWorld() {
    const hero = document.getElementById("hero");
    if (!hero || canvas) return;

    canvas = document.createElement("canvas");
    canvas.id = "cp-world";
    hero.insertBefore(canvas, hero.firstChild);
    ctx = canvas.getContext("2d");

    resize();
    spawnParticles();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    requestAnimationFrame(() => canvas.classList.add("visible"));
    tick();
  }

  function teardownWorld() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (canvas) { canvas.remove(); canvas = null; ctx = null; }
    pts.length = 0;
    window.removeEventListener("resize", resize);
    window.removeEventListener("scroll", onScroll);
  }

  /* ── Toggle Button ───────────────────────────────────────────────────── */
  const btn = document.createElement("button");
  btn.id = "cyberpunk-toggle-btn";
  btn.type = "button";
  btn.setAttribute("aria-pressed", "false");

  function applyMode(on) {
    btn.textContent = on ? "↩ RETURN TO THE MUNDANE" : "⚡ EXPLORE COMPOUND'S ALTERNATE UNIVERSE";
    btn.setAttribute("aria-pressed", String(on));
    if (on) buildWorld(); else teardownWorld();
  }

  btn.addEventListener("click", function () {
    const on = document.documentElement.classList.toggle("cyberpunk-mode");
    try { localStorage.setItem(STORAGE_KEY, on ? "1" : "0"); } catch (e) {}
    applyMode(on);
  });

  function mount() {
    document.body.appendChild(btn);
    const on = document.documentElement.classList.contains("cyberpunk-mode");
    applyMode(on);
  }

  /* Restore persisted state before first paint */
  try {
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      document.documentElement.classList.add("cyberpunk-mode");
    }
  } catch (e) {}

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
