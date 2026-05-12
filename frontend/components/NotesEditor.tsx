"use client";
import { useState, useRef, useEffect } from "react";
import { Note, createNote, updateNote, deleteNote } from "@/lib/api";
import { useSession } from "next-auth/react";

function timeAgo(dateStr: string): string {
  // Asegurar que se interprete como UTC
  const utcStr = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
  const diff = Date.now() - new Date(utcStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Ahora";
  if (mins < 60)  return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      background: "linear-gradient(135deg, #5B4EE8, #8B7FF5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.65rem", fontWeight: 700, color: "white",
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export default function NotesEditor({ companyId, initialNotes }: {
  companyId: number;
  initialNotes: Note[];
}) {
  const { data: session } = useSession();
  const userName = session?.user?.name || "KAM";

  const [notes, setNotes]             = useState<Note[]>(initialNotes);
  const [content, setContent]         = useState("");
  const [saving, setSaving]           = useState(false);
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  async function handleCreate() {
    if (!content.trim() || saving) return;
    setSaving(true);
    const note = await createNote(companyId, content.trim());
    setNotes([note, ...notes]);
    setContent("");
    setSaving(false);
  }

  async function handleUpdate(noteId: number) {
    if (!editContent.trim()) return;
    const updated = await updateNote(noteId, editContent.trim());
    setNotes(notes.map(n => n.id === noteId ? updated : n));
    setEditingId(null);
  }

  async function handleDelete(noteId: number) {
    await deleteNote(noteId);
    setNotes(notes.filter(n => n.id !== noteId));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleCreate();
    }
  }

  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid #E0E0EE",
      borderRadius: "12px", overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      {/* Header */}
      <div style={{
        padding: "1rem 1.5rem",
        borderBottom: "1px solid #F0F0F8",
        display: "flex", alignItems: "center", gap: "0.5rem",
      }}>
        <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0D0D2B" }}>
          Notas del KAM
        </h2>
        <span style={{
          fontSize: "0.7rem", fontWeight: 600, color: "#8888AA",
          background: "#F0F0F8", padding: "0.1rem 0.5rem", borderRadius: "9999px"
        }}>
          {notes.length}
        </span>
      </div>

      {/* Lista de notas */}
      <div style={{ padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {notes.length === 0 ? (
          <p style={{ fontSize: "0.8rem", color: "#C0C0D8", textAlign: "center", padding: "1rem 0" }}>
            Sé el primero en agregar una nota.
          </p>
        ) : (
          notes.map(note => (
            <div key={note.id} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <Avatar name={userName} />
              <div style={{ flex: 1 }}>
                {/* Bubble header */}
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0D0D2B" }}>
                    {userName}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#C0C0D8" }}>
                    {timeAgo(note.created_at)}
                  </span>
                </div>

                {/* Bubble */}
                {editingId === note.id ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={3}
                      autoFocus
                      style={{
                        width: "100%", border: "1px solid #5B4EE8",
                        borderRadius: "8px", padding: "0.6rem 0.75rem",
                        fontSize: "0.875rem", color: "#0D0D2B",
                        fontFamily: "inherit", lineHeight: 1.6,
                        resize: "none", outline: "none",
                        background: "rgba(91,78,232,0.02)",
                      }}
                    />
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: "0.25rem 0.6rem", borderRadius: "5px",
                          border: "1px solid #E0E0EE", background: "transparent",
                          cursor: "pointer", fontSize: "0.7rem", color: "#8888AA",
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleUpdate(note.id)}
                        style={{
                          padding: "0.25rem 0.6rem", borderRadius: "5px",
                          border: "none", background: "#5B4EE8",
                          cursor: "pointer", fontSize: "0.7rem",
                          fontWeight: 600, color: "white",
                        }}
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: "#F8F8FC", borderRadius: "0 8px 8px 8px",
                    padding: "0.6rem 0.875rem",
                    border: "1px solid #EBEBF5",
                  }}>
                    <p style={{ fontSize: "0.875rem", color: "#4A4A6A", lineHeight: 1.6 }}>
                      {note.content}
                    </p>
                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.4rem" }}>
                      <button
                        onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                        style={{
                          background: "none", border: "none", padding: 0,
                          cursor: "pointer", fontSize: "0.7rem", color: "#8888AA",
                          textDecoration: "underline",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        style={{
                          background: "none", border: "none", padding: 0,
                          cursor: "pointer", fontSize: "0.7rem", color: "#EF4444",
                          textDecoration: "underline",
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input fijo abajo */}
      <div style={{
        borderTop: "1px solid #F0F0F8",
        padding: "0.875rem 1.5rem",
        display: "flex", gap: "0.75rem", alignItems: "flex-end",
        background: "#FAFAFA",
      }}>
        <Avatar name={userName} />
        <div style={{ flex: 1, position: "relative" }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe una nota... (⌘↵ para enviar)"
            rows={1}
            style={{
              width: "100%",
              border: "1px solid #E0E0EE",
              borderRadius: "8px",
              padding: "0.6rem 0.875rem",
              paddingRight: content.trim() ? "5rem" : "0.875rem",
              fontSize: "0.875rem", color: "#0D0D2B",
              fontFamily: "inherit", lineHeight: 1.6,
              resize: "none", outline: "none",
              background: "white",
              transition: "border-color 0.15s",
              overflow: "hidden",
              minHeight: "38px", maxHeight: "120px",
            }}
            onFocus={e => e.currentTarget.style.borderColor = "#5B4EE8"}
            onBlur={e => e.currentTarget.style.borderColor = "#E0E0EE"}
          />
          {content.trim() && (
            <button
              onClick={handleCreate}
              disabled={saving}
              style={{
                position: "absolute", right: "0.5rem",
                top: "50%", transform: "translateY(-50%)",
                padding: "0.3rem 0.75rem", borderRadius: "6px",
                border: "none", background: "#5B4EE8",
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: "0.75rem", fontWeight: 600, color: "white",
                opacity: saving ? 0.7 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {saving ? "..." : "Enviar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}