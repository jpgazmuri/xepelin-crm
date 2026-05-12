import { Operation, Interaction } from "@/lib/api";

type TimelineEvent =
  | { type: "operation";    date: string; data: Operation }
  | { type: "interaction";  date: string; data: Interaction };

function formatAmount(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

const productLabels: Record<string, string> = {
  factoring:       "Factoring",
  confirming:      "Confirming",
  capital_trabajo: "Capital de trabajo",
};

const channelConfig: Record<string, { label: string; color: string; bg: string }> = {
  whatsapp: { label: "WhatsApp", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  email:    { label: "Email",    color: "#5B4EE8", bg: "rgba(91,78,232,0.1)" },
  call:     { label: "Llamada",  color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  completed: { label: "Completada", color: "#22C55E" },
  overdue:   { label: "En mora",    color: "#EF4444" },
  pending:   { label: "Pendiente",  color: "#F59E0B" },
};

export default function ActivityTimeline({
  operations,
  interactions,
}: {
  operations: Operation[];
  interactions: Interaction[];
}) {
  // Combinar y ordenar por fecha descendente
  const events: TimelineEvent[] = [
    ...operations.map(o => ({
      type: "operation" as const,
      date: o.operation_date,
      data: o,
    })),
    ...interactions.map(i => ({
      type: "interaction" as const,
      date: i.interaction_date,
      data: i,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (events.length === 0) {
    return (
      <div style={{
        background: "white", border: "1px solid #E0E0EE",
        borderRadius: "12px", padding: "1.5rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0D0D2B", marginBottom: "1rem" }}>
          Actividad
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#C0C0D8" }}>Sin actividad registrada.</p>
      </div>
    );
  }

  return (
    <div style={{
      background: "white", border: "1px solid #E0E0EE",
      borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <h2 style={{
        fontSize: "0.9rem", fontWeight: 700, color: "#0D0D2B",
        marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem"
      }}>
        Actividad
        <span style={{
          fontSize: "0.7rem", fontWeight: 600, color: "#8888AA",
          background: "#F0F0F8", padding: "0.1rem 0.5rem", borderRadius: "9999px"
        }}>
          {events.length}
        </span>
      </h2>

      <div style={{ position: "relative" }}>
        {/* Línea vertical */}
        <div style={{
          position: "absolute", left: 15, top: 8, bottom: 8,
          width: 2, background: "#F0F0F8", borderRadius: 1,
        }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {events.map((event, idx) => (
            <div key={idx} style={{
              display: "flex", gap: "1rem", alignItems: "flex-start",
              paddingBottom: idx < events.length - 1 ? "1.25rem" : 0,
            }}>
              {/* Dot */}
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.8rem", zIndex: 1,
                background: event.type === "operation"
                  ? (event.data as Operation).status === "overdue"
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(91,78,232,0.1)"
                  : "rgba(34,197,94,0.1)",
                border: `2px solid ${
                  event.type === "operation"
                    ? (event.data as Operation).status === "overdue" ? "#EF4444" : "#5B4EE8"
                    : "#22C55E"
                }`,
              }}>
                {event.type === "operation" ? "💳" : "💬"}
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingTop: "0.25rem" }}>
                {event.type === "operation" ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0D0D2B" }}>
                        {productLabels[(event.data as Operation).product_type] || (event.data as Operation).product_type}
                      </span>
                      <span style={{
                        fontSize: "0.75rem", fontWeight: 600,
                        color: (event.data as Operation).status === "overdue" ? "#EF4444" : "#22C55E",
                      }}>
                        {formatAmount((event.data as Operation).amount)}
                      </span>
                      <span style={{
                        fontSize: "0.65rem", fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        color: statusConfig[(event.data as Operation).status]?.color || "#8888AA",
                        background: (event.data as Operation).status === "overdue"
                          ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                        padding: "0.1rem 0.4rem", borderRadius: "9999px",
                      }}>
                        {statusConfig[(event.data as Operation).status]?.label || (event.data as Operation).status}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#8888AA" }}>
                      {event.date} · vence {(event.data as Operation).due_date}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                      {(() => {
                        const ch = channelConfig[(event.data as Interaction).channel];
                        return ch ? (
                          <span style={{
                            fontSize: "0.65rem", fontWeight: 700,
                            textTransform: "uppercase", letterSpacing: "0.06em",
                            color: ch.color, background: ch.bg,
                            padding: "0.1rem 0.4rem", borderRadius: "9999px",
                          }}>
                            {ch.label}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "#4A4A6A", lineHeight: 1.5 }}>
                      {(event.data as Interaction).summary}
                    </p>
                    <div style={{ fontSize: "0.75rem", color: "#8888AA", marginTop: "0.2rem" }}>
                      {event.date}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}