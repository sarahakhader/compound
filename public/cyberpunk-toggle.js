(function () {
  const STORAGE_KEY = "cyberpunk-mode";

  const style = document.createElement("style");
  style.id = "cyberpunk-theme-styles";
  style.textContent = `
html.cyberpunk-mode { background-color: #0a0a12 !important; }

html.cyberpunk-mode body,
html.cyberpunk-mode main,
html.cyberpunk-mode section,
html.cyberpunk-mode article,
html.cyberpunk-mode aside,
html.cyberpunk-mode div,
html.cyberpunk-mode header,
html.cyberpunk-mode footer,
html.cyberpunk-mode nav {
  background-color: transparent !important;
  color: #e6e6fa !important;
  border-color: rgba(0, 240, 255, 0.35) !important;
}

html.cyberpunk-mode body { background-color: #0a0a12 !important; }

html.cyberpunk-mode [class*="card"],
html.cyberpunk-mode [class*="panel"],
html.cyberpunk-mode [class*="box"],
html.cyberpunk-mode [class*="container"] > div {
  background-color: rgba(20, 16, 31, 0.85) !important;
}

html.cyberpunk-mode h1,
html.cyberpunk-mode h2,
html.cyberpunk-mode h3,
html.cyberpunk-mode h4,
html.cyberpunk-mode h5,
html.cyberpunk-mode h6 {
  color: #ff2bd6 !important;
  text-shadow: 0 0 6px rgba(255,43,214,0.8), 0 0 18px rgba(255,43,214,0.4) !important;
}

html.cyberpunk-mode p,
html.cyberpunk-mode li,
html.cyberpunk-mode span,
html.cyberpunk-mode label,
html.cyberpunk-mode td,
html.cyberpunk-mode th { color: #e6e6fa !important; }

html.cyberpunk-mode a {
  color: #00f0ff !important;
  text-shadow: 0 0 4px rgba(0,240,255,0.6) !important;
}
html.cyberpunk-mode a:hover {
  color: #f9f002 !important;
  text-shadow: 0 0 8px rgba(249,240,2,0.8) !important;
}

html.cyberpunk-mode button,
html.cyberpunk-mode input[type="submit"],
html.cyberpunk-mode input[type="button"],
html.cyberpunk-mode [class*="btn"] {
  background-color: #14101f !important;
  color: #00f0ff !important;
  border: 1px solid #00f0ff !important;
  box-shadow: 0 0 8px rgba(0,240,255,0.5), inset 0 0 8px rgba(0,240,255,0.15) !important;
  text-shadow: 0 0 4px rgba(0,240,255,0.7) !important;
}
html.cyberpunk-mode button:hover,
html.cyberpunk-mode [class*="btn"]:hover {
  box-shadow: 0 0 16px rgba(255,43,214,0.7), inset 0 0 12px rgba(255,43,214,0.2) !important;
  border-color: #ff2bd6 !important;
  color: #ff2bd6 !important;
}

html.cyberpunk-mode input,
html.cyberpunk-mode textarea,
html.cyberpunk-mode select {
  background-color: #14101f !important;
  color: #e6e6fa !important;
  border: 1px solid rgba(0,240,255,0.5) !important;
  caret-color: #ff2bd6 !important;
}
html.cyberpunk-mode input::placeholder,
html.cyberpunk-mode textarea::placeholder { color: rgba(230,230,250,0.4) !important; }

html.cyberpunk-mode table,
html.cyberpunk-mode tr {
  background-color: transparent !important;
  border-color: rgba(0,240,255,0.3) !important;
}

html.cyberpunk-mode img,
html.cyberpunk-mode video {
  filter: saturate(1.25) contrast(1.1) hue-rotate(-8deg)
          drop-shadow(0 0 6px rgba(255,43,214,0.25)) !important;
}

html.cyberpunk-mode pre,
html.cyberpunk-mode code {
  background-color: #050508 !important;
  color: #f9f002 !important;
  border-color: rgba(249,240,2,0.3) !important;
}

html.cyberpunk-mode body::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 999998;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0,0,0,0) 0px,
    rgba(0,0,0,0) 2px,
    rgba(0,240,255,0.025) 3px,
    rgba(0,0,0,0.08) 4px
  );
  mix-blend-mode: overlay;
}

@keyframes cyber-flicker {
  0%, 92%, 100% { opacity: 1; }
  93% { opacity: 0.78; }
  95% { opacity: 0.95; }
  97% { opacity: 0.85; }
}
html.cyberpunk-mode h1 { animation: cyber-flicker 6s infinite !important; }
@media (prefers-reduced-motion: reduce) {
  html.cyberpunk-mode h1 { animation: none !important; }
}

#cyberpunk-toggle-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999999;
  padding: 12px 18px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  max-width: 280px;
  text-align: center;
  cursor: pointer;
  border-radius: 4px;
  background: #14101f;
  color: #00f0ff;
  border: 1px solid #00f0ff;
  box-shadow: 0 0 10px rgba(0,240,255,0.6);
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}
#cyberpunk-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(255,43,214,0.8);
  border-color: #ff2bd6;
  color: #ff2bd6;
}
html:not(.cyberpunk-mode) #cyberpunk-toggle-btn {
  background: #1a1a1a;
  color: #ffffff;
  border: 1px solid #555;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
  `;
  document.head.appendChild(style);

  const btn = document.createElement("button");
  btn.id = "cyberpunk-toggle-btn";
  btn.type = "button";
  btn.setAttribute("aria-pressed", "false");

  function render() {
    const on = document.documentElement.classList.contains("cyberpunk-mode");
    btn.textContent = on ? "RETURN TO THE MUNDANE" : "EXPLORE COMPOUND'S ALTERNATE UNIVERSE";
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
