import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useLiveAssistPiP
 *
 * Manages a Document Picture-in-Picture window (Chrome 116+).
 * The PiP window floats on top of ALL windows — Teams, GMeet tab, etc.
 *
 * Returns:
 *   openPiP()        – opens the always-on-top window
 *   closePiP()       – closes it
 *   isOpen           – boolean
 *   portalTarget     – DOM node inside the PiP window to portal React into
 *   isSupported      – whether the browser supports documentPictureInPicture
 */
export function useLiveAssistPiP({ width = 430, height = 640 } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  const pipWinRef = useRef(null);

  const isSupported =
    typeof window !== "undefined" && "documentPictureInPicture" in window;

  const closePiP = useCallback(() => {
    try {
      if (pipWinRef.current && !pipWinRef.current.closed) {
        pipWinRef.current.close();
      }
    } catch (_) {}
    pipWinRef.current = null;
    setPortalTarget(null);
    setIsOpen(false);
  }, []);

  const openPiP = useCallback(async () => {
    if (!isSupported) return;

    // If already open, just focus it
    if (pipWinRef.current && !pipWinRef.current.closed) {
      try { pipWinRef.current.focus(); } catch (_) {}
      return;
    }

    try {
      const pip = await window.documentPictureInPicture.requestWindow({
        width,
        height,
        disallowReturnToOpener: false,
      });

      pipWinRef.current = pip;

      // ── Inject styles into PiP window ──────────────────────────────────
      // 1. CSS custom properties (--vars) from main document root
      const rootStyles = getComputedStyle(document.documentElement);
      const cssVars = [...rootStyles]
        .filter((p) => p.startsWith("--"))
        .map((p) => `${p}:${rootStyles.getPropertyValue(p)}`)
        .join(";");

      const varStyle = pip.document.createElement("style");
      varStyle.textContent = `:root{${cssVars}}`;
      pip.document.head.appendChild(varStyle);

      // 2. Google Fonts links
      document.querySelectorAll('link[href*="fonts.google"]').forEach((el) => {
        pip.document.head.appendChild(el.cloneNode(true));
      });

      // 3. Copy all style sheets (both <style> and <link rel="stylesheet">) dynamically
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          if (styleSheet.cssRules) {
            const newStyle = pip.document.createElement("style");
            const cssText = [...styleSheet.cssRules].map(rule => rule.cssText).join("\n");
            newStyle.textContent = cssText;
            pip.document.head.appendChild(newStyle);
          } else if (styleSheet.href) {
            const newLink = pip.document.createElement("link");
            newLink.rel = "stylesheet";
            newLink.href = styleSheet.href;
            pip.document.head.appendChild(newLink);
          }
        } catch (e) {
          const ownerNode = styleSheet.ownerNode;
          if (ownerNode) {
            try {
              pip.document.head.appendChild(ownerNode.cloneNode(true));
            } catch (_) {}
          }
        }
      });

      // 4. Base reset + body style for PiP
      const base = pip.document.createElement("style");
      base.textContent = `
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          width: 100%; height: 100%;
          overflow: hidden;
          background: transparent !important;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          color: #e2e8f0;
          -webkit-font-smoothing: antialiased;
        }
        #pip-root {
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.40); border-radius: 4px; }
        /* Animations */
        @keyframes pipPulse {
          0%,100% { opacity:1; box-shadow:0 0 0 4px rgba(16,185,129,0.20),0 0 10px rgba(16,185,129,0.4); }
          50% { opacity:0.6; box-shadow:0 0 0 2px rgba(16,185,129,0.08),0 0 4px rgba(16,185,129,0.15); }
        }
        @keyframes pipSlideIn {
          from { opacity:0; transform:translateY(-6px); }
          to { opacity:1; transform:translateY(0); }
        }
        .pip-fade-in { animation: pipSlideIn 0.22s ease forwards; }
      `;
      pip.document.head.appendChild(base);

      // ── Mount portal target ────────────────────────────────────────────
      const root = pip.document.createElement("div");
      root.id = "pip-root";
      pip.document.body.appendChild(root);

      pip.addEventListener("pagehide", () => {
        pipWinRef.current = null;
        setPortalTarget(null);
        setIsOpen(false);
      });

      setPortalTarget(root);
      setIsOpen(true);
    } catch (err) {
      console.error("[PiP] Failed to open:", err.message);
      throw err;
    }
  }, [isSupported, width, height]);

  // Cleanup on unmount
  useEffect(() => () => closePiP(), [closePiP]);

  return { openPiP, closePiP, isOpen, portalTarget, isSupported };
}
