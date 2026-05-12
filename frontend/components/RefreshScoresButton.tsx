"use client";
import { useState } from "react";
import { generateAllHealthScores } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RefreshScoresButton({ kamId }: { kamId: number }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const router                = useRouter();

  async function handleRefresh() {
    setLoading(true);
    setDone(false);
    try {
      await generateAllHealthScores(kamId);
      setDone(true);
      setTimeout(() => {
        setDone(false);
        router.refresh();
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      style={{
        padding: "0.5rem 1rem", borderRadius: "8px",
        border: "1px solid #E0E0EE",
        background: done ? "#22C55E" : "white",
        cursor: loading ? "not-allowed" : "pointer",
        fontSize: "0.8rem", fontWeight: 600,
        color: done ? "white" : loading ? "#C0C0D8" : "#5B4EE8",
        transition: "all 0.2s", display: "flex", alignItems: "center", gap: "0.4rem",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => { if (!loading && !done) e.currentTarget.style.borderColor = "#5B4EE8"; }}
      onMouseLeave={e => { if (!done) e.currentTarget.style.borderColor = "#E0E0EE"; }}
    >
      {done ? "✓ Actualizado" : loading ? "Analizando..." : "↻ Actualizar scores"}
    </button>
  );
}