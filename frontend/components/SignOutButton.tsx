"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        padding: "0.4rem 0.875rem",
        borderRadius: "6px",
        border: "1px solid #E0E0EE",
        background: "transparent",
        cursor: "pointer",
        fontSize: "0.8rem", fontWeight: 500,
        color: "#8888AA",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "#5B4EE8";
        e.currentTarget.style.color = "#5B4EE8";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "#E0E0EE";
        e.currentTarget.style.color = "#8888AA";
      }}
    >
      Cerrar sesión
    </button>
  );
}