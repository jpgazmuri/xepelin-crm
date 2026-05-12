"use client";
import { CompanySummary } from "@/lib/api";
import { useRouter } from "next/navigation";

const churnColors: Record<string, string> = {
  low:    "#22C55E",
  medium: "#F59E0B",
  high:   "#EF4444",
};

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  active:  { label: "Activo",    bg: "rgba(34,197,94,0.1)",   color: "#22C55E" },
  at_risk: { label: "En riesgo", bg: "rgba(245,158,11,0.1)",  color: "#F59E0B" },
  churned: { label: "Churned",   bg: "rgba(239,68,68,0.1)",   color: "#EF4444" },
};

function ScoreBadge({ score, risk }: { score: number; risk: string }) {
  const color = churnColors[risk] || "#8888AA";
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={radius} fill="none" stroke="#F0F0F8" strokeWidth="3"/>
          <circle
            cx="18" cy="18" r={radius} fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.65rem", fontWeight: 800, color,
        }}>
          {score}
        </div>
      </div>
      <span style={{ fontSize: "0.7rem", color, textTransform: "uppercase",
        letterSpacing: "0.05em", fontWeight: 600 }}>
        {risk}
      </span>
    </div>
  );
}

function formatAmount(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function daysSince(dateStr: string | null): { text: string; urgent: boolean } {
  if (!dateStr) return { text: "Sin ops", urgent: true };
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days === 0) return { text: "Hoy", urgent: false };
  if (days === 1) return { text: "Ayer", urgent: false };
  if (days > 30)  return { text: `hace ${days}d`, urgent: true };
  return { text: `hace ${days}d`, urgent: false };
}

export default function CompanyTable({ companies }: { companies: CompanySummary[] }) {
  const router = useRouter();
  // const headers = ["Empresa", "País · Industria", "Health Score", "Última op.", "Financiado 30d", "Ops", "Estado"];
  const headers = ["Empresa", "País · Industria", "Health Score", "Última op.", "Financiado 30d", "Utilización", "Ops", "Estado"];

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid #E0E0EE", background: "#F8F8FC" }}>
          {headers.map(h => (
            <th key={h} style={{
              padding: "0.875rem 1.25rem", textAlign: "left",
              fontSize: "0.7rem", textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#8888AA", fontWeight: 600,
            }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {companies.map((c, i) => {
          const lastOp = daysSince(c.last_operation_date);
          const sc = statusConfig[c.status] || statusConfig.active;
          return (
            <tr
              key={c.id}
              onClick={() => router.push(`/company/${c.id}`)}
              style={{
                borderBottom: i < companies.length - 1 ? "1px solid #F0F0F8" : "none",
                cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F8F8FC")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <td style={{ padding: "1rem 1.25rem" }}>
                <span style={{ fontWeight: 600, color: "#0D0D2B", fontSize: "0.9rem" }}>
                  {c.name}
                </span>
              </td>
              <td style={{ padding: "1rem 1.25rem", color: "#8888AA", fontSize: "0.8rem" }}>
                {c.country} · {c.industry}
              </td>
              <td style={{ padding: "1rem 1.25rem" }}>
                {c.health_score
                  ? <ScoreBadge score={c.health_score.score} risk={c.health_score.churn_risk} />
                  : <span style={{ color: "#C0C0D8", fontSize: "0.75rem" }}>— sin score</span>
                }
              </td>
              <td style={{ padding: "1rem 1.25rem", fontSize: "0.8rem",
                color: lastOp.urgent ? "#EF4444" : "#8888AA" }}>
                {lastOp.text}
              </td>
              <td style={{ padding: "1rem 1.25rem", fontSize: "0.875rem",
                fontWeight: 600, color: "#0D0D2B" }}>
                {formatAmount(c.total_financed_30d)}
              </td>
              <td style={{ padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: 48, height: 4, background: "#F0F0F8",
                    borderRadius: 2, overflow: "hidden", flexShrink: 0,
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min((c.credit_utilization_rate || 0) * 100, 100)}%`,
                      background: (c.credit_utilization_rate || 0) > 0.8 ? "#EF4444"
                        : (c.credit_utilization_rate || 0) > 0.5 ? "#F59E0B"
                        : "#5B4EE8",
                      borderRadius: 2,
                    }} />
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#4A4A6A", fontWeight: 500 }}>
                    {((c.credit_utilization_rate || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </td>
              <td style={{ padding: "1rem 1.25rem", fontSize: "0.8rem", color: "#8888AA" }}>
                {c.operation_count}
              </td>
              <td style={{ padding: "1rem 1.25rem" }}>
                <span style={{
                  padding: "0.2rem 0.65rem", borderRadius: "9999px",
                  fontSize: "0.7rem", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  background: sc.bg, color: sc.color,
                }}>
                  {sc.label}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}