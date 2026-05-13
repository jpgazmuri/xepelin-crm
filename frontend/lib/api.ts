const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface HealthScore {
  score: number;
  churn_risk: "low" | "medium" | "high";
  summary: string;
  recommended_actions: string[];
  generated_at: string;
  confidence?: "low" | "medium" | "high";
  data_gaps?: string[];
}

export interface Interaction {
  id: number;
  channel: string;
  summary: string;
  interaction_date: string;
}

export interface CompanySummary {
  id: number;
  name: string;
  industry: string;
  country: string;
  status: string;
  last_operation_date: string | null;
  total_financed_30d: number;
  operation_count: number;
  health_score: HealthScore | null;
  credit_limit: number;
  credit_utilized: number;
  credit_utilization_rate: number;
}

export interface CompanyDetail extends CompanySummary {
  onboarding_date: string | null;
  notes: Note[];
  operations: Operation[];
  interactions: Interaction[];
}

export interface Operation {
  id: number;
  product_type: string;
  amount: number;
  operation_date: string;
  due_date: string;
  status: string;
}

export async function getCompaniesByKam(kamId: number): Promise<CompanySummary[]> {
  const res = await fetch(`${API_URL}/companies/kam/${kamId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error cargando empresas");
  return res.json();
}

export async function getCompanyDetail(id: number): Promise<CompanyDetail> {
  const res = await fetch(`${API_URL}/companies/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Empresa no encontrada");
  return res.json();
}

export async function updateCompanyNotes(id: number, notes: string): Promise<CompanyDetail> {
  const res = await fetch(`${API_URL}/companies/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) throw new Error("Error actualizando notas");
  return res.json();
}

export interface Note {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export async function getNotes(companyId: number): Promise<Note[]> {
  const res = await fetch(`${API_URL}/notes/company/${companyId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error cargando notas");
  return res.json();
}

export async function createNote(companyId: number, content: string): Promise<Note> {
  const res = await fetch(`${API_URL}/notes/company/${companyId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Error creando nota");
  return res.json();
}

export async function updateNote(noteId: number, content: string): Promise<Note> {
  const res = await fetch(`${API_URL}/notes/${noteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Error actualizando nota");
  return res.json();
}

export async function deleteNote(noteId: number): Promise<void> {
  const res = await fetch(`${API_URL}/notes/${noteId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error eliminando nota");
}

export async function generateHealthScore(companyId: number): Promise<HealthScore> {
  const res = await fetch(`${API_URL}/health/generate/${companyId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Error generando health score");
  return res.json();
}

export async function generateAllHealthScores(kamId: number): Promise<void> {
  const res = await fetch(`${API_URL}/health/generate-all/${kamId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Error generando health scores");
}

export interface KamSummary {
  total_empresas: number;
  activas: number;
  at_risk: number;
  churned: number;
  vol_30d: number;
  vol_90d: number;
  vol_total: number;
  mora_rate: number;
  vol_en_mora: number;
  total_credit_limit: number;
  credit_utilization: number;
  avg_health_score: number | null;
  empresas_sin_score: number;
  inactivas_30d: number;
}

export async function getKamSummary(kamId: number): Promise<KamSummary> {
  const res = await fetch(`${API_URL}/companies/kam/${kamId}/summary`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error cargando resumen");
  return res.json();
}