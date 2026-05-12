"use client";
import { useState } from "react";
import { HealthScore, generateHealthScore } from "@/lib/api";

const churnColors: Record<string, string> = {
  low:    "#22C55E",
  medium: "#F59E0B",
  high:   "#EF4444",
};

const churnLabels: Record<string, string> = {
  low:    "Riesgo bajo",
  medium: "Riesgo medio",
  high:   "Riesgo alto",
};

export default function HealthScoreCard({ companyId, initialScore }: {
  companyId: number;
  initialScore: HealthScore | null;
}) {
  const [score, setScore]       = useState<HealthScore | null>(initialScore);
  const [loading, setLoading]   = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const newScore = await generateHealthScore(companyId);
      setScore(newScore);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const color = score ? churnColors[score.churn_risk] : "#C0C0D8";

  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid #E0E0EE",
      borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "1.25rem"
      }}>
        <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0D0D2B" }}>
          Health Score — IA
        </h2>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: "0.35rem 0.875rem", borderRadius: "6px",
            border: "1px solid #E0E0EE", background: "transparent",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "0.75rem", fontWeight: 600,
            color: loading ? "#C0C0D8" : "#5B4EE8",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = "#5B4EE8"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#E0E0EE"; }}
        >
          {loading ? "Generando..." : score ? "↻ Regenerar" : "✦ Generar"}
        </button>
      </div>

      {!score ? (
        <div style={{
          textAlign: "center", padding: "2rem",
          color: "#C0C0D8", fontSize: "0.875rem"
        }}>
          {loading
            ? "Analizando datos del cliente con IA..."
            : "Sin score generado. Haz clic en Generar."
          }
        </div>
      ) : (
        <>
          {/* Score + risk */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.25rem" }}>
            {/* Círculo */}
            <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="#F0F0F8" strokeWidth="6"/>
                <circle
                  cx="36" cy="36" r="30" fill="none"
                  stroke={color} strokeWidth="6"
                  strokeDasharray={`${(score.score / 100) * 188.5} 188.5`}
                  strokeLinecap="round"
                  transform="rotate(-90 36 36)"
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.1rem", fontWeight: 800, color,
              }}>
                {score.score}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: "0.75rem", fontWeight: 700,
                color, textTransform: "uppercase", letterSpacing: "0.06em",
                marginBottom: "0.25rem"
              }}>
                {churnLabels[score.churn_risk]}
              </div>
              <p style={{ fontSize: "0.875rem", color: "#4A4A6A", lineHeight: 1.6 }}>
                {score.summary}
              </p>
            </div>
          </div>

          {/* Acciones recomendadas */}
          <div style={{
            background: "#F8F8FC", borderRadius: "8px",
            padding: "1rem", marginBottom: "0.75rem"
          }}>
            <div style={{
              fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#8888AA", marginBottom: "0.625rem"
            }}>
              Acciones recomendadas
            </div>
            {score.recommended_actions.map((action, i) => (
              <div key={i} style={{
                display: "flex", gap: "0.5rem", alignItems: "flex-start",
                padding: "0.35rem 0",
                borderBottom: i < score.recommended_actions.length - 1
                  ? "1px solid #EBEBF5" : "none"
              }}>
                <span style={{ color: "#5B4EE8", fontWeight: 700, flexShrink: 0, fontSize: "0.8rem" }}>
                  →
                </span>
                <span style={{ fontSize: "0.875rem", color: "#4A4A6A", lineHeight: 1.5 }}>
                  {action}
                </span>
              </div>
            ))}
          </div>

          {/* Timestamp */}
          <div style={{ fontSize: "0.7rem", color: "#C0C0D8", textAlign: "right" }}>
            Generado: {new Date(score.generated_at).toLocaleString("es-CL")}
          </div>
        </>
      )}
    </div>
  );
}