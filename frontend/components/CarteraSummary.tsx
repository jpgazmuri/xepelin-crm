import { KamSummary } from "@/lib/api";

function formatAmount(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function CarteraSummary({ summary }: { summary: KamSummary }) {
  return (
    <div style={{ marginBottom: "1.75rem" }}>

      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8888AA",
          textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Resumen de cartera
        </h2>
      </div>

      {/* Fila 1 — 5 métricas financieras */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
        gap: "1rem", marginBottom: "1rem",
      }}>
        {[
          {
            label: "Volumen 30d",
            value: formatAmount(summary.vol_30d),
            sub: `${formatAmount(summary.vol_90d)} en 90d`,
            color: "#5B4EE8",
          },
          {
            label: "Volumen total",
            value: formatAmount(summary.vol_total),
            sub: `${summary.total_empresas} empresas`,
            color: "#0D0D2B",
          },
          {
            label: "Mora",
            value: `${(summary.mora_rate * 100).toFixed(1)}%`,
            sub: formatAmount(summary.vol_en_mora) + " en mora",
            color: summary.mora_rate > 0.15 ? "#EF4444"
              : summary.mora_rate > 0.05 ? "#F59E0B" : "#22C55E",
          },
          {
            label: "Utilización crédito",
            value: `${(summary.credit_utilization * 100).toFixed(1)}%`,
            sub: `de ${formatAmount(summary.total_credit_limit)} total`,
            color: summary.credit_utilization > 0.8 ? "#EF4444"
              : summary.credit_utilization > 0.5 ? "#F59E0B" : "#5B4EE8",
          },
          {
            label: "Health score prom.",
            value: summary.avg_health_score !== null
              ? summary.avg_health_score.toFixed(0) : "—",
            sub: `${summary.empresas_sin_score} sin score`,
            color: summary.avg_health_score !== null
              ? summary.avg_health_score < 40 ? "#EF4444"
              : summary.avg_health_score < 60 ? "#F59E0B" : "#22C55E"
              : "#8888AA",
          },
        ].map(m => (
          <div key={m.label} style={{
            background: "white", border: "1px solid #E0E0EE",
            borderRadius: "12px", padding: "1.25rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#8888AA",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
              {m.label}
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: m.color,
              lineHeight: 1, marginBottom: "0.3rem" }}>
              {m.value}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#8888AA" }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Fila 2 — 4 métricas de estado */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1rem",
      }}>
        {[
          {
            label: "Activas",
            value: summary.activas,
            sub: `${((summary.activas / summary.total_empresas) * 100).toFixed(0)}% de la cartera`,
            color: "#22C55E",
          },
          {
            label: "En riesgo",
            value: summary.at_risk,
            sub: `${((summary.at_risk / summary.total_empresas) * 100).toFixed(0)}% de la cartera`,
            color: "#F59E0B",
          },
          {
            label: "Churned",
            value: summary.churned,
            sub: `${((summary.churned / summary.total_empresas) * 100).toFixed(0)}% de la cartera`,
            color: "#EF4444",
          },
          {
            label: "Sin actividad 30d",
            value: summary.inactivas_30d,
            sub: "requieren contacto",
            color: summary.inactivas_30d > 3 ? "#EF4444" : "#F59E0B",
          },
        ].map(m => (
          <div key={m.label} style={{
            background: "white", border: "1px solid #E0E0EE",
            borderRadius: "12px", padding: "1.25rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#8888AA",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
              {m.label}
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: m.color,
              lineHeight: 1, marginBottom: "0.3rem" }}>
              {m.value}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#8888AA" }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}