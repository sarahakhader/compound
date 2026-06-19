"use client";

/**
 * CompoundUniverse — React wrapper for the isometric game overlay.
 *
 * Usage:
 *   import { CompoundUniverseButton } from "@/components/CompoundUniverse";
 *   <CompoundUniverseButton />
 *
 * The heavy game script (compound-universe.js) is lazy-loaded from /public
 * only when the user first clicks the button — zero impact on initial page load.
 */

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    CompoundUniverse?: {
      start(): void;
      stop(): void;
      readonly active: boolean;
      debug(): void;
    };
  }
}

function loadGameScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.CompoundUniverse) { resolve(); return; }
    if (document.querySelector('script[src="/compound-universe.js"]')) {
      /* Script tag injected but not yet executed — wait for it */
      const check = setInterval(() => {
        if (window.CompoundUniverse) { clearInterval(check); resolve(); }
      }, 50);
      return;
    }
    const s = document.createElement("script");
    s.src = "/compound-universe.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load compound-universe.js"));
    document.head.appendChild(s);
  });
}

export function CompoundUniverseButton() {
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const loadedRef = useRef(false);

  /* Keep active state in sync when game fires its exit event */
  useEffect(() => {
    const onExit = () => setActive(false);
    window.addEventListener("compound-universe:exit", onExit);
    return () => window.removeEventListener("compound-universe:exit", onExit);
  }, []);

  const toggle = useCallback(async () => {
    const cu = window.CompoundUniverse;
    if (cu?.active) {
      cu.stop();
      setActive(false);
      return;
    }
    if (!loadedRef.current) {
      setLoading(true);
      try {
        await loadGameScript();
        loadedRef.current = true;
      } catch (err) {
        console.error(err);
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    window.CompoundUniverse?.start();
    setActive(true);
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-pressed={active}
      aria-haspopup="dialog"
      aria-busy={loading}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 999999,
        padding: "14px 24px",
        fontFamily: '"Courier New", monospace',
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "2px",
        maxWidth: 420,
        textAlign: "center",
        cursor: loading ? "wait" : "pointer",
        borderRadius: 3,
        background: "rgba(7,8,15,0.88)",
        color: active ? "#FF003C" : "#e6e6fa",
        border: `1px solid ${active ? "rgba(255,0,60,.6)" : "rgba(230,230,250,0.22)"}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
        backdropFilter: "blur(8px)",
        textShadow: active ? "0 0 6px rgba(255,0,60,0.7)" : "none",
        opacity: loading ? 0.65 : 1,
        transition: "transform 0.18s ease, border-color 0.22s ease, color 0.22s ease",
      }}
    >
      {loading
        ? "LOADING UNIVERSE…"
        : active
        ? "↩ RETURN TO THE MUNDANE"
        : "⚡ EXPLORE COMPOUND'S ALTERNATE UNIVERSE"}
    </button>
  );
}
