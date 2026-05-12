import type { Metadata } from "next";
import { SessionProvider } from "./SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xepelin CRM",
  description: "Gestión de cartera para KAMs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" style={{ margin: 0, padding: 0 }}>
      <body style={{
        margin: 0,
        padding: 0,
        background: "#F0F0F8",
        minHeight: "100vh",
      }}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}