import { useEffect, useState } from "react";
import { subscribeRequestLoading } from "@/helper/apiHelper";

// Only show the loader if a request is slow (>150ms). Fast responses never flash
// the overlay, so the UI stays snappy and only "late" data triggers the loader.
const SHOW_DELAY_MS = 150;

const GlobalLoader = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let showTimer = null;

    const unsubscribe = subscribeRequestLoading((count) => {
      if (count > 0) {
        // A request is in flight — arm the delayed show (once).
        if (!showTimer) {
          showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
        }
      } else {
        // Everything finished — cancel any pending show and hide.
        if (showTimer) {
          clearTimeout(showTimer);
          showTimer = null;
        }
        setVisible(false);
      }
    });

    return () => {
      if (showTimer) clearTimeout(showTimer);
      unsubscribe();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.25)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "22px 30px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.18)",
        }}
      >
        <div
          className="spinner-border text-primary"
          role="status"
          style={{ width: 42, height: 42 }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>Loading...</span>
      </div>
    </div>
  );
};

export default GlobalLoader;
