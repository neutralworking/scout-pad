"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RankedPlayer {
  id: number;
  name: string;
  club: string | null;
  position: string | null;
  level: number | null;
  peak: number | null;
  tag_name: string;
}

export default function RankingsPage() {
  const [players, setPlayers] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rankings")
      .then((r) => r.json())
      .then((d) => setPlayers(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ballonDor = players.filter((p) => p.tag_name === "Ballon d'Or Contention");
  const top30 = players.filter((p) => p.tag_name === "Ballon d'Or Top 30 Contention");

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontSize: "1.4rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: 4,
          }}
        >
          Rankings
        </h1>
        <p style={{ fontSize: "0.78rem", color: "var(--text3)", margin: 0 }}>
          Ballon d&apos;Or Contention
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              color: "var(--text3)",
            }}
          >
            Loading...
          </div>
        ) : players.length === 0 ? (
          <div
            style={{
              background: "var(--surface2)",
              border: "1px dashed var(--border2)",
              borderRadius: 12,
              padding: 40,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.82rem",
                color: "var(--text3)",
                marginBottom: 8,
              }}
            >
              No players tagged for Ballon d&apos;Or contention yet.
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text3)" }}>
              Add tags from individual player profiles.
            </div>
          </div>
        ) : (
          <>
            <RankingSection title="Ballon d'Or Contention" players={ballonDor} />
            <RankingSection title="Top 30 Contention" players={top30} />
          </>
        )}
      </div>
    </div>
  );
}

function RankingSection({
  title,
  players,
}: {
  title: string;
  players: RankedPlayer[];
}) {
  if (players.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          fontSize: "0.62rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--amber)",
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {players.map((p) => (
          <Link
            key={`${p.id}-${p.tag_name}`}
            href={`/players/${p.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--amber)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text3)",
                  marginTop: 2,
                }}
              >
                {[p.club, p.position].filter(Boolean).join(" · ")}
              </div>
            </div>
            {p.level != null && (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  background: "var(--amber-dim)",
                  color: "var(--amber)",
                  flexShrink: 0,
                }}
              >
                {p.level}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
