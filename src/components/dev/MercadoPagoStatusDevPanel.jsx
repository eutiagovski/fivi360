/**
 * Painel temporário para testar getMercadoPagoStatus via httpsCallable.
 * Renderizado apenas em development.
 */

import { useState } from "react";
import { getMercadoPagoStatus } from "@/services/billing/mercadoPagoStatusService";

export function MercadoPagoStatusDevPanel() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleTest() {
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await getMercadoPagoStatus();
      setStatus(result);
      console.log("[FIVI360 dev] getMercadoPagoStatus:", result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error("[FIVI360 dev] getMercadoPagoStatus failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 9999,
        padding: "10px 12px",
        background: "#1e1e1e",
        color: "#f5f5f5",
        borderRadius: 8,
        fontSize: 12,
        fontFamily: "monospace",
        maxWidth: 320,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 600 }}>MP Status (dev)</div>
      <button
        type="button"
        onClick={handleTest}
        disabled={loading}
        style={{
          padding: "4px 10px",
          cursor: loading ? "wait" : "pointer",
          borderRadius: 4,
          border: "1px solid #555",
          background: "#333",
          color: "#f5f5f5",
        }}
      >
        {loading ? "Testando…" : "Testar getMercadoPagoStatus"}
      </button>
      {status && (
        <pre style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
          {JSON.stringify(status, null, 2)}
        </pre>
      )}
      {error && (
        <pre style={{ margin: "8px 0 0", color: "#f87171", whiteSpace: "pre-wrap" }}>
          {error}
        </pre>
      )}
    </div>
  );
}
