import { getCompanyDetail } from "@/lib/api";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import NotesEditor from "@/components/NotesEditor";
import HealthScoreCard from "@/components/HealthScoreCard";
import ActivityTimeline from "@/components/ActivityTimeline";

function formatAmount(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

const churnColors: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const company = await getCompanyDetail(Number(id));

  return (
    <div style={{ minHeight: "100vh", background: "#F0F0F8" }}>
      <Navbar userName={session.user?.name} />
      <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>

        {/* Back */}
        <Link href="/" style={{
          fontSize: "0.875rem", color: "#6b7280",
          textDecoration: "none", display: "inline-block", marginBottom: "1.5rem"
        }}>
          ← Volver a cartera
        </Link>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: "2rem"
        }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              {company.name}
            </h1>
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
              {company.country} · {company.industry} · cliente desde {company.onboarding_date}
            </p>
          </div>
          <span style={{
            padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 600,
            background: company.status === "active" ? "#dcfce7" :
                        company.status === "at_risk" ? "#fed7aa" : "#fee2e2",
            color: company.status === "active" ? "#166534" :
                  company.status === "at_risk" ? "#9a3412" : "#991b1b",
          }}>
            {company.status === "active" ? "Activo" :
            company.status === "at_risk" ? "En riesgo" : "Churned"}
          </span>
        </div>

        {/* Health Score */}
        {/* {company.health_score && (
          <div style={{
            background: "#f9fafb", border: "1px solid #e5e7eb",
            borderRadius: "10px", padding: "1.5rem", marginBottom: "1.5rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: churnColors[company.health_score.churn_risk],
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.25rem", fontWeight: 800, color: "white", flexShrink: 0
              }}>
                {company.health_score.score}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem" }}>Health Score</div>
                <div style={{
                  fontSize: "0.8rem",
                  color: churnColors[company.health_score.churn_risk],
                  fontWeight: 600, textTransform: "uppercase"
                }}>
                  Churn risk: {company.health_score.churn_risk}
                </div>
              </div>
            </div>
            <p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1rem" }}>
              {company.health_score.summary}
            </p>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.05em", color: "#6b7280", marginBottom: "0.5rem" }}>
                Acciones recomendadas
              </div>
              {company.health_score.recommended_actions.map((action, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: "0.5rem",
                  padding: "0.4rem 0", borderBottom: i < company.health_score!.recommended_actions.length - 1
                    ? "1px solid #e5e7eb" : "none"
                }}>
                  <span style={{ color: "#00E5A0", fontWeight: 700, flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: "0.875rem", color: "#374151" }}>{action}</span>
                </div>
              ))}
            </div>
          </div>
        )} */}
        <HealthScoreCard
          companyId={company.id}
          initialScore={company.health_score}
        />

        {/* Métricas */}
        {/* <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem", marginBottom: "1.5rem"
        }}>
          {[
            { label: "Total operaciones", value: company.operations.length },
            { label: "Volumen total", value: formatAmount(company.operations.reduce((s, o) => s + o.amount, 0)) },
            { label: "Ops con mora", value: company.operations.filter(o => o.status === "overdue").length },
          ].map(m => (
            <div key={m.label} style={{
              background: "white", border: "1px solid #e5e7eb",
              borderRadius: "8px", padding: "1rem"
            }}>
              <div style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase",
                letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                {m.label}
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{m.value}</div>
            </div>
          ))}
        </div> */}
        
        {/* Métricas */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem", marginBottom: "1.5rem"
        }}>
          {[
            { label: "Total operaciones", value: company.operations.length },
            { label: "Volumen total",      value: formatAmount(company.operations.reduce((s, o) => s + o.amount, 0)) },
            { label: "Ops con mora",       value: company.operations.filter(o => o.status === "overdue").length },
          ].map(m => (
            <div key={m.label} style={{
              background: "white", border: "1px solid #E0E0EE",
              borderRadius: "8px", padding: "1rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: "0.7rem", color: "#8888AA", textTransform: "uppercase",
                letterSpacing: "0.08em", marginBottom: "0.25rem", fontWeight: 600 }}>
                {m.label}
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0D0D2B" }}>{m.value}</div>
            </div>
          ))}

          {/* Línea de crédito con barra de utilización */}
          <div style={{
            background: "white", border: "1px solid #E0E0EE",
            borderRadius: "8px", padding: "1rem",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: "0.7rem", color: "#8888AA", textTransform: "uppercase",
              letterSpacing: "0.08em", marginBottom: "0.25rem", fontWeight: 600 }}>
              Línea de crédito
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0D0D2B", marginBottom: "0.5rem" }}>
              {formatAmount(company.credit_utilized)}
              <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#8888AA" }}>
                {" "}/ {formatAmount(company.credit_limit)}
              </span>
            </div>
            {/* Barra de progreso */}
            <div style={{ height: 6, background: "#F0F0F8", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${Math.min(company.credit_utilization_rate * 100, 100)}%`,
                background: company.credit_utilization_rate > 0.8 ? "#EF4444"
                  : company.credit_utilization_rate > 0.5 ? "#F59E0B"
                  : "#5B4EE8",
                transition: "width 0.6s ease",
              }} />
            </div>
            <div style={{ fontSize: "0.7rem", color: "#8888AA", marginTop: "0.3rem" }}>
              {(company.credit_utilization_rate * 100).toFixed(0)}% utilizado (90d)
            </div>
          </div>
        </div>

        {/* Historial de operaciones */}
        {/* <div style={{
          background: "white", border: "1px solid #e5e7eb",
          borderRadius: "10px", padding: "1.5rem", marginBottom: "1.5rem"
        }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
            Historial de operaciones
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                {["Producto", "Monto", "Fecha", "Estado"].map(h => (
                  <th key={h} style={{
                    padding: "0.5rem 0.75rem", textAlign: "left", fontSize: "0.75rem",
                    textTransform: "uppercase", color: "#6b7280", letterSpacing: "0.05em"
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {company.operations.map(op => (
                <tr key={op.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "0.75rem", fontSize: "0.875rem" }}>{op.product_type}</td>
                  <td style={{ padding: "0.75rem", fontSize: "0.875rem", fontWeight: 500 }}>
                    {formatAmount(op.amount)}
                  </td>
                  <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#6b7280" }}>
                    {op.operation_date}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span style={{
                      padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem",
                      fontWeight: 600,
                      background: op.status === "completed" ? "#dcfce7" :
                                  op.status === "overdue"   ? "#fee2e2" : "#f3f4f6",
                      color: op.status === "completed" ? "#166534" :
                            op.status === "overdue"   ? "#991b1b" : "#374151",
                    }}>
                      {op.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> */}

        {/* Interacciones */}
        {/* <div style={{
          background: "#FFFFFF", border: "1px solid #E0E0EE",
          borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0D0D2B", marginBottom: "1rem" }}>
            Historial de interacciones
            <span style={{
              marginLeft: "0.5rem", fontSize: "0.7rem", fontWeight: 600,
              color: "#8888AA", background: "#F0F0F8",
              padding: "0.1rem 0.5rem", borderRadius: "9999px"
            }}>
              {company.interactions.length}
            </span>
          </h2>
          {company.interactions.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "#C0C0D8" }}>Sin interacciones registradas.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {company.interactions.map(i => {
                const channelConfig: Record<string, { label: string; color: string; bg: string }> = {
                  whatsapp: { label: "WhatsApp", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
                  email:    { label: "Email",    color: "#5B4EE8", bg: "rgba(91,78,232,0.1)" },
                  call:     { label: "Llamada",  color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
                };
                const ch = channelConfig[i.channel] || { label: i.channel, color: "#8888AA", bg: "#F0F0F8" };
                return (
                  <div key={i.id} style={{
                    display: "flex", gap: "0.75rem", alignItems: "flex-start",
                    padding: "0.75rem", background: "#FAFAFA",
                    border: "1px solid #F0F0F8", borderRadius: "8px",
                  }}>
                    <span style={{
                      padding: "0.2rem 0.6rem", borderRadius: "9999px",
                      fontSize: "0.65rem", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      background: ch.bg, color: ch.color, flexShrink: 0,
                    }}>
                      {ch.label}
                    </span>
                    <p style={{ fontSize: "0.875rem", color: "#4A4A6A", lineHeight: 1.6, flex: 1 }}>
                      {i.summary}
                    </p>
                    <span style={{ fontSize: "0.7rem", color: "#C0C0D8", flexShrink: 0 }}>
                      {i.interaction_date}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div> */}

        <ActivityTimeline
          operations={company.operations}
          interactions={company.interactions}
        />

        {/* Notas del KAM */}
        {/* <div style={{
          background: "white", border: "1px solid #e5e7eb",
          borderRadius: "10px", padding: "1.5rem"
        }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            Notas del KAM
          </h2>
          <p style={{ fontSize: "0.875rem", color: company.notes ? "#374151" : "#9ca3af" }}>
            {company.notes || "Sin notas aún."}
          </p>
        </div> */}
        <NotesEditor companyId={company.id} initialNotes={company.notes as any} />

      </main>
    </div>
  );
}