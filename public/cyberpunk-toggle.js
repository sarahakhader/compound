(function () {
  const STORAGE_KEY = "cyberpunk-mode";

  const style = document.createElement("style");
  style.id = "cyberpunk-theme-styles";
  style.textContent = `

/* ================================================================
   COMPOUND — ALTERNATE UNIVERSE
   Neon palette mapped from brand colours:
     Cobalt       → #00f0ff  (neon cyan)
     Molten       → #FF003C  (neon crimson)
     Smoked Plum  → #bf00ff  (neon violet)
     Acid         → #b5ff00  (neon lime)
     Glacier      → #00f0ff  (neon cyan)
     Linen        → #e6e6fa  (ghost white)
     Deep Jungle  → #0a0a12  (night black)
================================================================ */

/* ── Keyframes ── */
@keyframes cyber-flicker {
  0%,89%,100% { opacity:1; }
  90% { opacity:.72; }
  92% { opacity:.98; }
  94% { opacity:.68; }
  96% { opacity:.96; }
}
@keyframes cyber-glitch {
  0%,95%,100% { clip-path:none; transform:none; text-shadow:inherit; }
  96% { clip-path:inset(18% 0 55% 0); transform:translate(-4px,0); }
  97% { clip-path:inset(62% 0 8% 0);  transform:translate(4px,0); }
  98% { clip-path:inset(38% 0 30% 0); transform:translate(-2px,0); }
  99% { clip-path:none; transform:none; }
}
@keyframes hud-pulse {
  0%,100% { opacity:.55; box-shadow:0 0 8px rgba(0,240,255,.4); }
  50%      { opacity:1;   box-shadow:0 0 20px rgba(0,240,255,.9); }
}
@keyframes neon-border-spin {
  0%   { border-color:#00f0ff rgba(0,240,255,.1) rgba(0,240,255,.1) #00f0ff; }
  25%  { border-color:#bf00ff #00f0ff rgba(0,240,255,.1) rgba(0,240,255,.1); }
  50%  { border-color:rgba(0,240,255,.1) #bf00ff #00f0ff rgba(0,240,255,.1); }
  75%  { border-color:rgba(0,240,255,.1) rgba(0,240,255,.1) #bf00ff #00f0ff; }
  100% { border-color:#00f0ff rgba(0,240,255,.1) rgba(0,240,255,.1) #00f0ff; }
}
@keyframes logo-breathe {
  0%,100% { filter: drop-shadow(0 0 12px rgba(0,240,255,.7)) drop-shadow(0 0 28px rgba(191,0,255,.3)); }
  50%      { filter: drop-shadow(0 0 28px rgba(0,240,255,.95)) drop-shadow(0 0 60px rgba(191,0,255,.6)) drop-shadow(0 0 80px rgba(255,0,60,.2)); }
}
@keyframes scan-h {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
@keyframes marquee-glow {
  0%,100% { text-shadow:0 0 6px rgba(181,255,0,.6); }
  50%      { text-shadow:0 0 16px rgba(181,255,0,1), 0 0 30px rgba(181,255,0,.5); }
}

/* ── Base ── */
html.cyberpunk-mode { background:#0a0a12 !important; }
html.cyberpunk-mode body {
  background:#0a0a12 !important;
  color:#e6e6fa !important;
}

/* Scanline overlay */
html.cyberpunk-mode body::before {
  content:"";
  position:fixed; inset:0; pointer-events:none; z-index:999997;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px,
    rgba(0,240,255,.018) 3px, rgba(0,0,0,.07) 4px
  );
  mix-blend-mode:overlay;
}

/* Moving scan line */
html.cyberpunk-mode body::after {
  content:"";
  position:fixed; left:0; right:0; height:2px;
  background:linear-gradient(90deg,transparent,rgba(0,240,255,.6),transparent);
  pointer-events:none; z-index:999997;
  animation: scan-h 7s linear infinite;
  box-shadow:0 0 18px rgba(0,240,255,.5);
}

/* ── HERO ── */
html.cyberpunk-mode #hero {
  background:
    radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,64,255,.08) 0%, transparent 70%),
    linear-gradient(rgba(0,240,255,.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,240,255,.025) 1px, transparent 1px),
    #0a0a12 !important;
  background-size: auto, 70px 70px, 70px 70px !important;
}

/* Logo — breathing neon */
html.cyberpunk-mode #logo-mark {
  animation: logo-breathe 3.5s ease-in-out infinite !important;
}

/* Hero top words → neon lime */
html.cyberpunk-mode .hero-top-word {
  color:#b5ff00 !important;
  text-shadow:0 0 8px rgba(181,255,0,.8), 0 0 20px rgba(181,255,0,.3) !important;
  letter-spacing:.32em !important;
}

/* Hero big text base → neon cyan (hover handled by React) */
html.cyberpunk-mode .hero-bc {
  color:#00f0ff !important;
  text-shadow:0 0 15px rgba(0,240,255,.4) !important;
}

/* Hero side labels */
html.cyberpunk-mode .hero-bl,
html.cyberpunk-mode .hero-br {
  color:#bf00ff !important;
  text-shadow:0 0 6px rgba(191,0,255,.7) !important;
}

/* ── NAV ── */
html.cyberpunk-mode nav { background:transparent !important; }
html.cyberpunk-mode .nav-brand {
  color:#00f0ff !important;
  text-shadow:0 0 10px rgba(0,240,255,.9) !important;
  letter-spacing:.38em !important;
}
html.cyberpunk-mode .nav-btn {
  color:#b5ff00 !important;
  text-shadow:0 0 8px rgba(181,255,0,.8) !important;
}

/* ── MARQUEE ── */
html.cyberpunk-mode .marquee-strip {
  background:#0d0d1a !important;
  border-top:1px solid rgba(0,240,255,.25) !important;
  border-bottom:1px solid rgba(0,240,255,.25) !important;
  box-shadow:0 0 20px rgba(0,240,255,.08) inset !important;
}
html.cyberpunk-mode .marquee-inner span {
  color:#b5ff00 !important;
  animation: marquee-glow 2s ease-in-out infinite !important;
}

/* ── ABOUT (manifesto) ── */
html.cyberpunk-mode #about {
  background:
    radial-gradient(ellipse 60% 80% at 80% 50%, rgba(191,0,255,.06) 0%, transparent 70%),
    #0f0a1a !important;
}
html.cyberpunk-mode .at-welcome {
  color:#FF003C !important;
  text-shadow:0 0 8px rgba(255,0,60,.8), 0 0 30px rgba(255,0,60,.35) !important;
  animation: cyber-glitch 9s infinite !important;
}
html.cyberpunk-mode .at-intro,
html.cyberpunk-mode .at-body { color:rgba(230,230,250,.8) !important; }
html.cyberpunk-mode .at-pullquote {
  color:#00f0ff !important;
  text-shadow:0 0 12px rgba(0,240,255,.6) !important;
}
html.cyberpunk-mode .at-rule { background:#00f0ff !important; opacity:.4 !important; }
html.cyberpunk-mode .at-def-line {
  color:#bf00ff !important;
  text-shadow:0 0 6px rgba(191,0,255,.5) !important;
}
html.cyberpunk-mode .at-philosophy {
  color:#b5ff00 !important;
  text-shadow:0 0 6px rgba(181,255,0,.5) !important;
}
html.cyberpunk-mode .at-closing p {
  color:#FF003C !important;
  text-shadow:0 0 8px rgba(255,0,60,.7), 0 0 24px rgba(255,0,60,.3) !important;
}
html.cyberpunk-mode .about-label { color:#00f0ff !important; text-shadow:0 0 12px rgba(0,240,255,.7) !important; }
html.cyberpunk-mode .about-est   { color:rgba(230,230,250,.4) !important; }
html.cyberpunk-mode .about-divider { background:#00f0ff !important; opacity:.2 !important; }

/* Pillars */
html.cyberpunk-mode .pillar h3 { color:#b5ff00 !important; text-shadow:0 0 6px rgba(181,255,0,.5) !important; }
html.cyberpunk-mode .pillar p  { color:rgba(230,230,250,.7) !important; }
html.cyberpunk-mode .pillar::before { background:#00f0ff !important; }

/* Colour blocks */
html.cyberpunk-mode .cb-block {
  filter:saturate(1.4) brightness(.8) !important;
  border:1px solid rgba(0,240,255,.15) !important;
}

/* ── CONTACT ── */
html.cyberpunk-mode #contact {
  background:
    radial-gradient(ellipse 70% 50% at 20% 80%, rgba(0,240,255,.05) 0%, transparent 60%),
    #080810 !important;
  border-top:1px solid rgba(0,240,255,.15) !important;
}
html.cyberpunk-mode .c-tag { color:rgba(0,240,255,.5) !important; }
html.cyberpunk-mode .inquire {
  color:#FF003C !important;
  text-shadow:0 0 16px rgba(255,0,60,.8), 0 0 40px rgba(255,0,60,.35) !important;
  animation: cyber-flicker 5s infinite !important;
}
html.cyberpunk-mode .inquire-arrow { color:#00f0ff !important; }
html.cyberpunk-mode .c-info h3 { color:#00f0ff !important; text-shadow:0 0 8px rgba(0,240,255,.6) !important; }
html.cyberpunk-mode .etype { color:rgba(181,255,0,.6) !important; }
html.cyberpunk-mode .edet a { color:#00f0ff !important; text-shadow:0 0 4px rgba(0,240,255,.5) !important; }

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
  text-shadow:0 0 8px rgba(0,240,255,.7) !important;
  border:none !important; box-shadow:none !important; background:none !important;
}

/* ── FOOTER ── */
html.cyberpunk-mode footer {
  background:#080810 !important;
  border-top:1px solid rgba(0,240,255,.12) !important;
}
html.cyberpunk-mode .f-brand  { color:rgba(0,240,255,.4) !important; }
html.cyberpunk-mode .f-tagline { color:rgba(181,255,0,.35) !important; }

/* ── MENU OVERLAY ── */
html.cyberpunk-mode #menu {
  background:#0a0a14 !important;
  border-bottom:1px solid rgba(0,240,255,.2) !important;
}
html.cyberpunk-mode .m-links a {
  color:#e6e6fa !important;
  text-shadow:none !important;
}
html.cyberpunk-mode .m-links a:hover {
  color:#FF003C !important;
  text-shadow:0 0 16px rgba(255,0,60,.8) !important;
}
html.cyberpunk-mode .m-tag { color:rgba(0,240,255,.4) !important; }
html.cyberpunk-mode .m-foot p { color:rgba(181,255,0,.35) !important; }

/* ── THE TOGGLE BUTTON ── */
#cyberpunk-toggle-btn {
  position:fixed; bottom:24px; right:24px; z-index:999999;
  padding:12px 18px;
  font-family:"Courier New", monospace;
  font-size:11px; font-weight:700; letter-spacing:1.5px;
  max-width:300px; text-align:center;
  cursor:pointer; border-radius:3px;
  transition:transform .15s ease, box-shadow .2s ease, border-color .2s ease, color .2s ease;
}
html.cyberpunk-mode #cyberpunk-toggle-btn {
  background:#0a0a12;
  color:#00f0ff;
  border:1px solid #00f0ff;
  box-shadow:0 0 12px rgba(0,240,255,.6), inset 0 0 8px rgba(0,240,255,.08);
  text-shadow:0 0 6px rgba(0,240,255,.8);
  animation:hud-pulse 2.5s ease-in-out infinite;
}
html.cyberpunk-mode #cyberpunk-toggle-btn:hover {
  transform:translateY(-2px);
  box-shadow:0 0 24px rgba(255,0,60,.8), inset 0 0 12px rgba(255,0,60,.15);
  border-color:#FF003C;
  color:#FF003C;
  text-shadow:0 0 8px rgba(255,0,60,.9);
  animation:none;
}
html:not(.cyberpunk-mode) #cyberpunk-toggle-btn {
  background:rgba(10,10,18,.85);
  color:#e6e6fa;
  border:1px solid rgba(230,230,250,.25);
  box-shadow:0 2px 12px rgba(0,0,0,.5);
  backdrop-filter:blur(8px);
}
html:not(.cyberpunk-mode) #cyberpunk-toggle-btn:hover {
  transform:translateY(-2px);
  border-color:rgba(0,240,255,.5);
  color:#00f0ff;
  box-shadow:0 0 16px rgba(0,240,255,.3);
}
  `;
  document.head.appendChild(style);

  const btn = document.createElement("button");
  btn.id = "cyberpunk-toggle-btn";
  btn.type = "button";
  btn.setAttribute("aria-pressed", "false");

  function render() {
    const on = document.documentElement.classList.contains("cyberpunk-mode");
    btn.textContent = on ? "↩ RETURN TO THE MUNDANE" : "⚡ EXPLORE COMPOUND'S ALTERNATE UNIVERSE";
    btn.setAttribute("aria-pressed", String(on));
  }

  btn.addEventListener("click", function () {
    const on = document.documentElement.classList.toggle("cyberpunk-mode");
    try { localStorage.setItem(STORAGE_KEY, on ? "1" : "0"); } catch (e) {}
    render();
  });

  try {
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      document.documentElement.classList.add("cyberpunk-mode");
    }
  } catch (e) {}

  function mount() {
    document.body.appendChild(btn);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
