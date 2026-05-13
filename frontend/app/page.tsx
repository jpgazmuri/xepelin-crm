import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/options";
import CompanyTable from "@/components/CompanyTable";
import SignOutButton from "@/components/SignOutButton";
import { redirect } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import RefreshScoresButton from "@/components/RefreshScoresButton";
import CarteraSummary from "@/components/CarteraSummary";
import { getCompaniesByKam, getKamSummary } from "@/lib/api";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  console.log("SESSION COMPLETA:", JSON.stringify(session, null, 2));
  if (!session) redirect("/login");

  const kamId = (session as any).kamId;

  // Solo redirigir si hay error explícito, no si kamId es null
  if ((session as any).error === "not_authorized") {
    redirect("/login?error=not_authorized");
  }

  // Si no hay kamId todavía, usar 1 como fallback mientras se propaga el token
  const resolvedKamId = kamId ?? 1;
  // const companies = await getCompaniesByKam(resolvedKamId);
  const [companies, summary] = await Promise.all([
    getCompaniesByKam(kamId),
    getKamSummary(kamId),
  ]);

  const atRisk  = companies.filter(c => c.status === "at_risk").length;
  const churned = companies.filter(c => c.status === "churned").length;
  const active  = companies.filter(c => c.status === "active").length;

  return (
    <div style={{ minHeight: "100vh", background: "#F0F0F8" }}>

      {/* Navbar */}
      <Navbar userName={session.user?.name} />

      <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.75rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{
              fontSize: "1.6rem", fontWeight: 800, color: "#0D0D2B",
              letterSpacing: "-0.02em", marginBottom: "0.25rem"
            }}>
              Mi Cartera
            </h1>
            <p style={{ color: "#8888AA", fontSize: "0.875rem" }}>
              {companies.length} empresas · ordenadas por prioridad
            </p>
          </div>
          <RefreshScoresButton kamId={kamId} />
        </div>

        {/* Resumen global */}
        <CarteraSummary summary={summary} />

        {/* Stats */}
        {/* <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem", marginBottom: "1.75rem"
        }}>
          {[
            { label: "Activas",   value: active,   color: "#22C55E" },
            { label: "En riesgo", value: atRisk,   color: "#F59E0B" },
            { label: "Churned",   value: churned,  color: "#EF4444" },
          ].map(s => (
            <div key={s.label} style={{
              background: "#FFFFFF", border: "1px solid #E0E0EE",
              borderRadius: "12px", padding: "1.25rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                fontSize: "0.7rem", textTransform: "uppercase",
                letterSpacing: "0.1em", color: "#8888AA",
                marginBottom: "0.5rem", fontWeight: 600
              }}>
                {s.label}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div> */}

        {/* Tabla */}
        <div style={{
          background: "#FFFFFF", border: "1px solid #E0E0EE",
          borderRadius: "12px", overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <CompanyTable companies={companies} />
        </div>

      </main>
    </div>
  );
}