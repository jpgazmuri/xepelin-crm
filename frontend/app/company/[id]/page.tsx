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
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
          gap: "1rem", marginBottom: "1.5rem"
        }}>
          {[
            { label: "Total operaciones", value: company.operations.length },
            { label: "Volumen total",      value: formatAmount(company.operations.reduce((s, o) => s + o.amount, 0)) },
            { label: "Ops con mora",       value: company.operations.filter(o => o.status === "overdue").length },
            {
              label: "Tendencia 30d",
              value: company.trend_pct === 0 ? "—"
                : `${company.trend_pct > 0 ? "↑" : "↓"} ${Math.abs(company.trend_pct).toFixed(0)}%`,
              color: company.trend_pct > 0 ? "#22C55E"
                : company.trend_pct < 0 ? "#EF4444"
                : "#8888AA",
            },
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
        <ActivityTimeline
          operations={company.operations}
          interactions={company.interactions}
        />

        {/* Notas del KAM */}
        <NotesEditor companyId={company.id} initialNotes={company.notes as any} />

      </main>
    </div>
  );
}