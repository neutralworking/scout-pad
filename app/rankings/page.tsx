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
      <div style={{
        padding: "20px 24px 16px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        display: "flex",
        alignItems: "baseline",
        gap: 12,
      }}>
        <div>
          <h1 style={{
            fontSize: "1rem",
            fontWeight: 900,
            letterSpacing: "0.08em",
            margin: 0,
            fontFamily: "var(--font-orbitron), monospace",
            color: "var(--accent)",
            textShadow: "0 0 15px rgba(0,240,255,0.4)",
            textTransform: "uppercase",
          }}>
            Rankings
          </h1>
          <span style={{ fontSize: "0.75rem", color: "var(--text3)" }}>
            {players.length} players tagged
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
        {loading ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 200,
            color: "var(--text3)",
          }}>
            Loading...
          </div>
        ) : players.length === 0 ? (
          <div style={{
            background: "var(--surface)",
            border: "1px dashed var(--border2)",
            borderRadius: 12,
            padding: 40,
            textAlign: "center",
          }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text3)", marginBottom: 8 }}>
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
      {/* Section header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}>
        {/* Trophy icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
          <path d="M4 22h16" />
          <path d="M10 22V14a2 2 0 00-2-2H6V4h12v8h-2a2 2 0 00-2 2v8" />
        </svg>
        <span style={{
          fontSize: "0.58rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--amber)",
          fontFamily: "var(--font-orbitron), monospace",
          textShadow: "0 0 10px rgba(255,42,109,0.4)",
        }}>
          {title}
        </span>
        <span style={{
          fontSize: "0.62rem",
          fontWeight: 600,
          color: "var(--text3)",
          marginLeft: "auto",
        }}>
          {players.length} players
        </span>
      </div>

      {/* Player list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {players.map((p, i) => (
          <Link
            key={`${p.id}-${p.tag_name}`}
            href={`/players/${p.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 2,
              textDecoration: "none",
              color: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(0,240,255,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {/* Rank number */}
            <span style={{
              width: 24,
              fontSize: "0.72rem",
              fontWeight: 800,
              color: i < 3 ? "var(--amber)" : "var(--text3)",
              textAlign: "center",
              fontVariantNumeric: "tabular-nums",
              flexShrink: 0,
              fontFamily: "var(--font-orbitron), monospace",
              textShadow: i < 3 ? "0 0 8px rgba(255,42,109,0.4)" : "none",
            }}>
              {i + 1}
            </span>

            {/* Name + club */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: "var(--font-orbitron), monospace",
                letterSpacing: "0.02em",
              }}>
                {p.name}
              </div>
              <div style={{
                fontSize: "0.68rem",
                color: "var(--text3)",
                marginTop: 1,
              }}>
                {[p.club, p.position].filter(Boolean).join(" · ")}
              </div>
            </div>

            {/* Position badge */}
            {p.position && (
              <span style={{
                padding: "2px 7px",
                borderRadius: 2,
                fontSize: "0.65rem",
                fontWeight: 700,
                background: "var(--neon-purple-dim)",
                color: "var(--neon-purple)",
                border: "1px solid rgba(184,41,227,0.3)",
                flexShrink: 0,
                fontFamily: "var(--font-mono), monospace",
              }}>
                {p.position}
              </span>
            )}

            {/* Level + Peak */}
            <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
              {p.level != null && (
                <span style={{
                  padding: "3px 8px",
                  borderRadius: 2,
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  background: "var(--accent-dim)",
                  color: "var(--accent)",
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "var(--font-orbitron), monospace",
                  border: "1px solid rgba(0,240,255,0.2)",
                  textShadow: "0 0 6px rgba(0,240,255,0.3)",
                }}>
                  {p.level}
                </span>
              )}
              {p.peak != null && p.peak !== p.level && (
                <span style={{
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: "var(--text3)",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  pk {p.peak}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
