import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "Chief Scout",
  description: "Player scouting and evaluation platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d0f14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "var(--bg)", height: "100dvh", overflow: "hidden", display: "flex" }}>
        <Sidebar />
        <main className="main-content" style={{ flex: 1, overflow: "auto", height: "100dvh", marginLeft: 220 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
