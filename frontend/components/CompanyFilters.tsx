"use client";
import { useState } from "react";
import { CompanySummary } from "@/lib/api";

interface Filters {
  status: string;
  country: string;
  industry: string;
  search: string;
}

export function useFilters(companies: CompanySummary[]) {
  const [filters, setFilters] = useState<Filters>({
    status: "", country: "", industry: "", search: "",
  });

  const filtered = companies.filter(c => {
    if (filters.status   && c.status   !== filters.status)   return false;
    if (filters.country  && c.country  !== filters.country)  return false;
    if (filters.industry && c.industry !== filters.industry) return false;
    if (filters.search   && !c.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return { filters, setFilters, filtered };
}

export default function CompanyFilters({
  companies,
  filters,
  setFilters,
  filteredCount,
}: {
  companies: CompanySummary[];
  filters: { status: string; country: string; industry: string; search: string };
  setFilters: (f: any) => void;
  filteredCount: number;
}) {
  // Valores únicos para cada filtro
  const statuses   = [...new Set(companies.map(c => c.status))];
  const countries  = [...new Set(companies.map(c => c.country))];
  const industries = [...new Set(companies.map(c => c.industry))];

  const statusLabels: Record<string, string> = {
    active: "Activo", at_risk: "En riesgo", churned: "Churned",
  };

  const hasFilters = filters.status || filters.country || filters.industry || filters.search;

  const selectStyle = {
    padding: "0.4rem 0.75rem",
    border: "1px solid #E0E0EE",
    borderRadius: "6px",
    fontSize: "0.8rem",
    color: "#4A4A6A",
    background: "white",
    cursor: "pointer",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      padding: "0.875rem 1.25rem",
      borderBottom: "1px solid #F0F0F8",
      flexWrap: "wrap",
    }}>
      {/* Búsqueda */}
      <input
        type="text"
        placeholder="Buscar empresa..."
        value={filters.search}
        onChange={e => setFilters({ ...filters, search: e.target.value })}
        style={{
          ...selectStyle,
          width: 180,
          paddingLeft: "0.75rem",
        }}
        onFocus={e => e.currentTarget.style.borderColor = "#5B4EE8"}
        onBlur={e => e.currentTarget.style.borderColor = "#E0E0EE"}
      />

      {/* Filtro status */}
      <select
        value={filters.status}
        onChange={e => setFilters({ ...filters, status: e.target.value })}
        style={{
          ...selectStyle,
          borderColor: filters.status ? "#5B4EE8" : "#E0E0EE",
          color: filters.status ? "#5B4EE8" : "#4A4A6A",
        }}
      >
        <option value="">Todos los estados</option>
        {statuses.map(s => (
          <option key={s} value={s}>{statusLabels[s] || s}</option>
        ))}
      </select>

      {/* Filtro país */}
      <select
        value={filters.country}
        onChange={e => setFilters({ ...filters, country: e.target.value })}
        style={{
          ...selectStyle,
          borderColor: filters.country ? "#5B4EE8" : "#E0E0EE",
          color: filters.country ? "#5B4EE8" : "#4A4A6A",
        }}
      >
        <option value="">Todos los países</option>
        {countries.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Filtro industria */}
      <select
        value={filters.industry}
        onChange={e => setFilters({ ...filters, industry: e.target.value })}
        style={{
          ...selectStyle,
          borderColor: filters.industry ? "#5B4EE8" : "#E0E0EE",
          color: filters.industry ? "#5B4EE8" : "#4A4A6A",
        }}
      >
        <option value="">Todas las industrias</option>
        {industries.map(i => <option key={i} value={i}>{i}</option>)}
      </select>

      {/* Contador y reset */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ fontSize: "0.75rem", color: "#8888AA" }}>
          {filteredCount} empresa{filteredCount !== 1 ? "s" : ""}
        </span>
        {hasFilters && (
          <button
            onClick={() => setFilters({ status: "", country: "", industry: "", search: "" })}
            style={{
              padding: "0.3rem 0.75rem", borderRadius: "6px",
              border: "1px solid #E0E0EE", background: "transparent",
              cursor: "pointer", fontSize: "0.75rem", color: "#8888AA",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "#EF4444";
              e.currentTarget.style.color = "#EF4444";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "#E0E0EE";
              e.currentTarget.style.color = "#8888AA";
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}