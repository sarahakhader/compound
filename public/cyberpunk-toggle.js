(function () {
  "use strict";

  const style = document.createElement("style");
  style.textContent = `
  /* ── Cloud wrapper — fixed position, owns the cloud silhouette ── */
  #cu-cloud-wrap {
    position: fixed;
    bottom: 28px;
    right: 36px;
    z-index: 999999;
    width: 248px;

    /* The drop-shadow applies to the whole cloud (body + bumps) as one shape */
    filter: drop-shadow(0 8px 24px rgba(0,0,0,0.46));
    transition: transform 0.22s ease, filter 0.22s ease;
    cursor: pointer;
  }

  #cu-cloud-wrap:hover {
    transform: translateY(-6px) scale(1.025);
    filter: drop-shadow(0 14px 32px rgba(0,0,0,0.54));
  }

  /* ── Three cloud bumps — sit ABOVE the button body ── */
  #cu-cloud-bumps {
    position: relative;
    height: 52px;          /* space for bumps; no background here */
    pointer-events: none;
  }

  /* left bump */
  #cu-cloud-bumps::before {
    content: '';
    position: absolute;
    background: #ffffff;
    border-radius: 50%;
    width: 74px;
    height: 74px;
    bottom: -18px;          /* deeper overlap so bumps merge flush into body */
    left: 8px;
  }

  /* centre bump — tallest */
  #cu-cloud-bumps::after {
    content: '';
    position: absolute;
    background: #ffffff;
    border-radius: 50%;
    width: 90px;
    height: 90px;
    bottom: -20px;
    left: 70px;
  }

  /* right bump */
  #cu-cloud-bump-r {
    position: absolute;
    background: #ffffff;
    border-radius: 50%;
    width: 62px;
    height: 62px;
    bottom: -16px;
    right: 8px;
    pointer-events: none;
  }

  /* ── Button body — the cloud base ── */
  #cyberpunk-toggle-btn {
    position: relative;
    display: block;
    width: 100%;
    height: 50px;
    z-index: 1;            /* above bump divs so text is always clear */

    background: #ffffff;
    color: #0c0d18;
    border: none;
    border-radius: 100px;

    font-family: "Courier New", monospace;
    font-size: 9.5px;
    font-weight: 900;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    white-space: nowrap;
    text-align: center;
    cursor: pointer;

    transition: background 0.2s ease, color 0.2s ease;
  }

  #cyberpunk-toggle-btn:focus-visible {
    outline: 3px solid rgba(110,206,206,0.9);
    outline-offset: 5px;
  }

  /* Active state — storm-grey cloud, red text */
  #cu-cloud-wrap.game-active #cyberpunk-toggle-btn  { background: #e2e2e2; color: #cc1800; }
  #cu-cloud-wrap.game-active #cu-cloud-bumps::before { background: #e2e2e2; }
  #cu-cloud-wrap.game-active #cu-cloud-bumps::after  { background: #e2e2e2; }
  #cu-cloud-wrap.game-active #cu-cloud-bump-r        { background: #e2e2e2; }

  /* Loading state */
  #cu-cloud-wrap.loading { opacity: 0.6; cursor: wait; }
  #cu-cloud-wrap.loading #cyberpunk-toggle-btn { cursor: wait; }

  @media (prefers-reduced-motion: reduce) {
    #cu-cloud-wrap { transition: none; }
  }

  /* Mobile — collapse to a small icon-only puck so it stops covering
     paragraph text; the full pill only fits on wide screens. */
  @media (max-width: 768px) {
    #cu-cloud-wrap {
      width: 60px;
      bottom: max(16px, env(safe-area-inset-bottom));
      right: max(14px, env(safe-area-inset-right));
    }
    #cu-cloud-bumps { display: none; }
    #cyberpunk-toggle-btn {
      height: 60px;
      width: 60px;
      border-radius: 50%;
      font-size: 20px;
      letter-spacing: 0;
      padding: 0;
    }
  }
  `;
  document.head.appendChild(style);

  /* ── Build DOM: wrapper > bumps + right-bump + button ── */
  const wrap = document.createElement("div");
  wrap.id = "cu-cloud-wrap";
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", "Compound Universe launcher");

  /* bump container */
  const bumps = document.createElement("div");
  bumps.id = "cu-cloud-bumps";

  /* third bump (right) as a real element so we avoid box-shadow shape issues */
  const bumpR = document.createElement("div");
  bumpR.id = "cu-cloud-bump-r";
  bumps.appendChild(bumpR);

  /* the actual button */
  const btn = document.createElement("button");
  btn.id = "cyberpunk-toggle-btn";
  btn.type = "button";
  btn.setAttribute("aria-haspopup", "dialog");

  wrap.appendChild(bumps);
  wrap.appendChild(btn);

  /* ── State helpers ── */
  const isCompact = () => window.matchMedia("(max-width: 768px)").matches;
  let active = false;
  function setActive(on) {
    active = on;
    btn.textContent = isCompact()
      ? (on ? "↩" : "☁")
      : (on ? "↩ RETURN TO THE MUNDANE" : "☁ ENTER COMPOUND'S UNIVERSE");
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "Return to the mundane" : "Enter Compound's Universe");
    wrap.classList.toggle("game-active", on);
  }
  setActive(false);
  window.matchMedia("(max-width: 768px)").addEventListener("change", () => setActive(active));

  /* ── Lazy-load compound-universe.js on first click ── */
  let loaded = false;
  function ensureLoaded(cb) {
    if (loaded || window.CompoundUniverse) { loaded = true; cb(); return; }
    wrap.classList.add("loading");
    btn.setAttribute("aria-busy", "true");
    const s = document.createElement("script");
    s.src = "/compound-universe.js";
    s.onload = () => {
      loaded = true;
      wrap.classList.remove("loading");
      btn.removeAttribute("aria-busy");
      cb();
    };
    s.onerror = () => {
      wrap.classList.remove("loading");
      btn.removeAttribute("aria-busy");
      console.error("Compound Universe: failed to load game script.");
    };
    document.head.appendChild(s);
  }

  /* On touch devices, the 3D world has no keyboard controls — send users to the hub page instead */
  const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

  btn.addEventListener("click", () => {
    if (isTouch()) { window.location.href = "/universe"; return; }
    const cu = window.CompoundUniverse;
    if (cu && cu.active) { cu.stop(); setActive(false); return; }
    ensureLoaded(() => {
      if (window.CompoundUniverse) { window.CompoundUniverse.start(); setActive(true); }
    });
  });

  window.addEventListener("compound-universe:exit", () => setActive(false));

  function mount() { document.body.appendChild(wrap); }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mount);
  else mount();

  /* The /universe page is itself the universe entry hub — showing this
     launcher there is redundant and overlaps the page's own CTA. Re-check
     on every client-side (SPA) navigation, not just full page loads. */
  function syncVisibility() {
    wrap.style.display = window.location.pathname.startsWith("/universe") ? "none" : "";
  }
  syncVisibility();
  window.addEventListener("popstate", syncVisibility);
  for (const fn of ["pushState", "replaceState"]) {
    const orig = history[fn];
    history[fn] = function (...args) {
      const ret = orig.apply(this, args);
      syncVisibility();
      return ret;
    };
  }
})();
