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
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const newScore = await generateHealthScore(companyId);
      setScore(newScore);
    } catch (e) {
      setError("No se pudo generar el score. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // async function handleGenerate() {
  //   setLoading(true);
  //   try {
  //     const newScore = await generateHealthScore(companyId);
  //     setScore(newScore);
  //   } catch (e) {
  //     console.error(e);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

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

          {/* Confidence + Data gaps */}
          {(score.confidence || (score.data_gaps && score.data_gaps.length > 0)) && (
            <div style={{
              display: "flex", gap: "0.75rem", marginBottom: "0.75rem",
              flexWrap: "wrap",
            }}>
              {/* Confidence badge */}
              {score.confidence && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.3rem 0.75rem",
                  background: score.confidence === "high"
                    ? "rgba(34,197,94,0.08)"
                    : score.confidence === "medium"
                    ? "rgba(245,158,11,0.08)"
                    : "rgba(239,68,68,0.08)",
                  borderRadius: "9999px",
                  border: `1px solid ${
                    score.confidence === "high" ? "rgba(34,197,94,0.2)"
                    : score.confidence === "medium" ? "rgba(245,158,11,0.2)"
                    : "rgba(239,68,68,0.2)"
                  }`,
                }}>
                  <span style={{ fontSize: "0.65rem" }}>
                    {score.confidence === "high" ? "●" : score.confidence === "medium" ? "◑" : "○"}
                  </span>
                  <span style={{
                    fontSize: "0.7rem", fontWeight: 600,
                    color: score.confidence === "high" ? "#22C55E"
                      : score.confidence === "medium" ? "#F59E0B"
                      : "#EF4444",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    Confianza {score.confidence === "high" ? "alta"
                      : score.confidence === "medium" ? "media" : "baja"}
                  </span>
                </div>
              )}

              {/* Data gaps */}
              {score.data_gaps && score.data_gaps.length > 0 && (
                <div style={{
                  padding: "0.3rem 0.75rem",
                  background: "rgba(139,139,170,0.08)",
                  borderRadius: "9999px",
                  border: "1px solid rgba(139,139,170,0.2)",
                  fontSize: "0.7rem", color: "#8888AA",
                  cursor: "pointer", position: "relative",
                }}
                  title={`Datos faltantes: ${score.data_gaps.join(", ")}`}
                >
                  ⚠ {score.data_gaps.length} dato{score.data_gaps.length > 1 ? "s" : ""} faltante{score.data_gaps.length > 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div style={{ fontSize: "0.7rem", color: "#C0C0D8", textAlign: "right" }}>
            Generado: {new Date(score.generated_at).toLocaleString("es-CL")}
          </div>
        </>
      )}

      {error && (
        <div style={{
          marginTop: "0.75rem",
          padding: "0.6rem 0.875rem",
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "8px",
          fontSize: "0.8rem",
          color: "#EF4444",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}