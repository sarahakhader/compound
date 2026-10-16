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

  /* ── Button body — the cloud base. Purely decorative: no click behavior. ── */
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
    cursor: default;
  }

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
  wrap.setAttribute("role", "img");
  wrap.setAttribute("aria-label", "Compound cloud");

  /* bump container */
  const bumps = document.createElement("div");
  bumps.id = "cu-cloud-bumps";

  /* third bump (right) as a real element so we avoid box-shadow shape issues */
  const bumpR = document.createElement("div");
  bumpR.id = "cu-cloud-bump-r";
  bumps.appendChild(bumpR);

  /* the actual button — decorative only, no interaction */
  const btn = document.createElement("button");
  btn.id = "cyberpunk-toggle-btn";
  btn.type = "button";
  btn.disabled = true;
  btn.tabIndex = -1;
  btn.setAttribute("aria-hidden", "true");

  const isCompact = () => window.matchMedia("(max-width: 768px)").matches;
  function setLabel() {
    btn.textContent = isCompact() ? "☁" : "☁ ENTER COMPOUND'S UNIVERSE";
  }
  setLabel();
  window.matchMedia("(max-width: 768px)").addEventListener("change", setLabel);

  wrap.appendChild(bumps);
  wrap.appendChild(btn);

  function mount() { document.body.appendChild(wrap); }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mount);
  else mount();

  /* The /universe page has its own district-hub UI in that bottom-right
     corner — showing this decorative cloud there would overlap it.
     Re-check on every client-side (SPA) navigation, not just full loads. */
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
