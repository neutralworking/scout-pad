"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  {
    label: "Players",
    href: "/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: "Scout Pad",
    href: "/scout-pad",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="16" height="16" rx="2" />
        <rect x="6" y="2" width="16" height="16" rx="2" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname.startsWith("/players");
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle sidebar"
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 1100,
          display: "none",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          color: "var(--text)",
          padding: "6px 8px",
          cursor: "pointer",
          lineHeight: 0,
        }}
        className="sidebar-hamburger"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Backdrop for mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
            display: "none",
          }}
          className="sidebar-backdrop"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-nav ${open ? "sidebar-nav--open" : ""}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 220,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1000,
          transition: "transform 0.2s ease",
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "0.02em",
            }}
          >
            Chief Scout
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 0" }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 20px",
                  margin: "2px 0",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--accent)" : "var(--text2)",
                  textDecoration: "none",
                  borderLeft: active
                    ? "3px solid var(--accent)"
                    : "3px solid transparent",
                  background: active ? "var(--surface2)" : "transparent",
                  transition: "color 0.15s, background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "var(--text)";
                    e.currentTarget.style.background = "var(--surface2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "var(--text2)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Responsive styles injected once */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-hamburger {
            display: block !important;
          }
          .sidebar-backdrop {
            display: block !important;
          }
          .sidebar-nav {
            transform: translateX(-100%);
          }
          .sidebar-nav--open {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </>
  );
}
