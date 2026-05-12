import Image from "next/image";
import SignOutButton from "@/components/SignOutButton";

export default function Navbar({ userName, showSignOut = true }: { 
  userName?: string | null;
  showSignOut?: boolean;
}) {
  return (
    <nav style={{
      background: "#FFFFFF",
      borderBottom: "1px solid #E0E0EE",
      padding: "0 2rem",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 60, position: "sticky", top: 0, zIndex: 10,
      boxShadow: "0 1px 8px rgba(91,78,232,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <img
          src="/logo-xepelin.png"
          alt="Xepelin"
          style={{ width: "110px", height: "auto" }}
        />
        <span style={{
          background: "rgba(91,78,232,0.08)", color: "#5B4EE8",
          fontSize: "0.65rem", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.1em",
          padding: "0.2rem 0.6rem", borderRadius: "9999px",
        }}>
          CRM
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {userName && (
          <span style={{ fontSize: "0.8rem", color: "#8888AA" }}>
            {userName}
          </span>
        )}
        {showSignOut && <SignOutButton />}
      </div>
    </nav>
  );
}