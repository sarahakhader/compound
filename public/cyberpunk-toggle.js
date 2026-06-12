(function () {
  const style = document.createElement("style");
  style.textContent = `
  #cyberpunk-toggle-btn {
    position:fixed;bottom:24px;right:24px;z-index:999999;
    padding:11px 18px;
    font-family:"Courier New",monospace;
    font-size:11px;font-weight:700;letter-spacing:1.5px;
    max-width:310px;text-align:center;cursor:pointer;border-radius:3px;
    background:rgba(7,8,15,0.88);color:#e6e6fa;
    border:1px solid rgba(230,230,250,0.22);
    box-shadow:0 2px 12px rgba(0,0,0,0.5);
    backdrop-filter:blur(8px);
    will-change:transform;
    transition:transform .18s ease,border-color .22s ease,color .22s ease;
  }
  #cyberpunk-toggle-btn:hover {
    transform:translateY(-2px);
    border-color:rgba(0,240,255,0.5);
    color:#00f0ff;
  }
  #cyberpunk-toggle-btn.game-active {
    border-color:#FF003C;color:#FF003C;
    text-shadow:0 0 6px rgba(255,0,60,0.7);
    background:rgba(7,8,15,0.95);
  }
  `;
  document.head.appendChild(style);

  const btn = document.createElement("button");
  btn.id = "cyberpunk-toggle-btn";
  btn.type = "button";

  function setActive(on) {
    btn.textContent = on
      ? "↩ RETURN TO THE MUNDANE"
      : "⚡ EXPLORE COMPOUND'S ALTERNATE UNIVERSE";
    btn.setAttribute("aria-pressed", String(on));
    btn.classList.toggle("game-active", on);
  }
  setActive(false);

  btn.addEventListener("click", () => {
    const cu = window.CompoundUniverse;
    if (!cu) return;
    if (cu.active) {
      cu.stop();
    } else {
      cu.start();
      setActive(true);
    }
  });

  window.addEventListener("compound-universe:exit", () => setActive(false));

  function mount() { document.body.appendChild(btn); }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
