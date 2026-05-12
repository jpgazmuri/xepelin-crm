"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function LoginForm() {
  const { status } = useSession();
  const router     = useRouter();
  const searchParams = useSearchParams();
  const urlError   = searchParams.get("error");

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.push("/");
  }, [status, router]);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Email o contraseña incorrectos.");
    } else {
      router.push("/");
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "#F0F0F8",
    }}>
      <div style={{
        background: "#FFFFFF", border: "1px solid #E0E0EE",
        borderRadius: "16px", padding: "2.5rem",
        width: "100%", maxWidth: "400px",
        boxShadow: "0 4px 24px rgba(91,78,232,0.08)",
      }}>
        {/* Logo */}
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "center" }}>
          <img src="/logo-xepelin.png" alt="Xepelin" style={{ width: "160px", height: "auto" }} />
        </div>

        <div style={{
          display: "block", width: "100%", textAlign: "center",
          background: "rgba(91,78,232,0.08)", color: "#5B4EE8",
          fontSize: "0.7rem", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.12em",
          padding: "0.25rem 0.75rem", borderRadius: "9999px",
          marginBottom: "1.5rem",
        }}>
          CRM · KAMs
        </div>

        <h1 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0D0D2B",
          marginBottom: "1.5rem", textAlign: "center" }}>
          Iniciar sesión
        </h1>

        {/* Error de OAuth no autorizado */}
        {urlError === "not_authorized" && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "8px", padding: "0.75rem 1rem",
            marginBottom: "1.25rem", fontSize: "0.8rem", color: "#EF4444",
            textAlign: "center",
          }}>
            Tu cuenta de Google no está registrada como KAM.
          </div>
        )}

        {/* Form email/password */}
        <form onSubmit={handleCredentials}>
          <div style={{ marginBottom: "0.875rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600,
              color: "#4A4A6A", display: "block", marginBottom: "0.35rem" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@xepelin.com"
              required
              style={{
                width: "100%", padding: "0.7rem 0.875rem",
                border: "1px solid #E0E0EE", borderRadius: "8px",
                fontSize: "0.875rem", color: "#0D0D2B",
                outline: "none", fontFamily: "inherit",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#5B4EE8"}
              onBlur={e => e.currentTarget.style.borderColor = "#E0E0EE"}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600,
              color: "#4A4A6A", display: "block", marginBottom: "0.35rem" }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%", padding: "0.7rem 0.875rem",
                border: "1px solid #E0E0EE", borderRadius: "8px",
                fontSize: "0.875rem", color: "#0D0D2B",
                outline: "none", fontFamily: "inherit",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#5B4EE8"}
              onBlur={e => e.currentTarget.style.borderColor = "#E0E0EE"}
            />
          </div>

          {error && (
            <p style={{ fontSize: "0.8rem", color: "#EF4444",
              marginBottom: "1rem", textAlign: "center" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "0.8rem",
              background: "#5B4EE8", border: "none",
              borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.9rem", fontWeight: 600, color: "white",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.25rem 0" }}>
          <div style={{ flex: 1, height: 1, background: "#E0E0EE" }} />
          <span style={{ fontSize: "0.75rem", color: "#8888AA" }}>o</span>
          <div style={{ flex: 1, height: 1, background: "#E0E0EE" }} />
        </div>

        {/* Google OAuth */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          style={{
            width: "100%", padding: "0.75rem 1rem",
            border: "1px solid #E0E0EE", borderRadius: "8px",
            background: "white", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "0.75rem", fontSize: "0.875rem", fontWeight: 500, color: "#0D0D2B",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#5B4EE8";
            e.currentTarget.style.background = "rgba(91,78,232,0.04)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "#E0E0EE";
            e.currentTarget.style.background = "white";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.75-2.7.75-2.07 0-3.82-1.4-4.45-3.28H1.86v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.53 10.52A4.8 4.8 0 0 1 4.28 9c0-.53.09-1.04.25-1.52V5.41H1.86A8 8 0 0 0 .98 9c0 1.29.31 2.51.88 3.59l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 3.58c1.16 0 2.2.4 3.02 1.19l2.26-2.26A8 8 0 0 0 .98 9l2.91 2.07C4.16 4.99 6.41 3.58 8.98 3.58z"/>
          </svg>
          Continuar con Google
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}