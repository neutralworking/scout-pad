"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";

interface Player {
  id: number;
  name: string;
  club: string | null;
  division: string | null;
  nation: string | null;
  position: string | null;
  secondary_position: string | null;
  level: number | null;
  peak: number | null;
  Character: string | null;
  Mentality: string | null;
  primary: string | null;
  archetype: string | null;
  market_value_tier: number | null;
  scarcity_score: number | null;
  pursuit_status: string | null;
  director_valuation_meur: number | null;
  fit_note: string | null;
}

const POSITIONS = ["GK", "WD", "CD", "DM", "CM", "WM", "AM", "WF", "CF"];
const PURSUIT_OPTIONS = ["Priority", "Interested", "Watch", "Pass"];
const MVT_OPTIONS = [5, 4, 3, 2, 1];

function mvtClass(mvt: number) {
  if (mvt >= 5) return "badge badge-mvt5";
  if (mvt >= 4) return "badge badge-mvt4";
  if (mvt >= 3) return "badge badge-mvt3";
  return "badge badge-mvt2";
}

function pursuitClass(status: string | null) {
  if (!status) return "";
  const map: Record<string, string> = {
    Priority: "pursuit-pill pursuit-pill-priority",
    Interested: "pursuit-pill pursuit-pill-interested",
    Watch: "pursuit-pill pursuit-pill-watch",
    Pass: "pursuit-pill pursuit-pill-pass",
  };
  return map[status] ?? "";
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [mvtFilter, setMvtFilter] = useState("");
  const [pursuitFilter, setPursuitFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 50;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchPlayers = useCallback(async (newOffset = 0) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(newOffset));
    if (search) params.set("search", search);
    if (posFilter) params.set("position", posFilter);
    if (mvtFilter) params.set("mvt", mvtFilter);
    if (pursuitFilter) params.set("pursuit", pursuitFilter);

    try {
      const res = await fetch(`/api/players?${params}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data ?? [];
      setPlayers(list);
      // Store IDs for prev/next navigation on the profile page
      try { sessionStorage.setItem("playerListIds", JSON.stringify(list.map((p: Player) => p.id))); } catch {}
      if (data.count !== undefined) setTotal(data.count);
      else setTotal(list.length + newOffset);
      setOffset(newOffset);
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [search, posFilter, mvtFilter, pursuitFilter]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPlayers(0), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchPlayers]);

  const hasMore = players.length === limit;
  const hasPrev = offset > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
      {/* ── Header ── */}
      <div style={{
        padding: "16px 24px 12px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 12, letterSpacing: "-0.02em" }}>Players</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: "1 1 200px", minWidth: 180, padding: "8px 12px",
              background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: 8, color: "var(--text)", fontSize: "0.85rem",
              outline: "none", fontFamily: "inherit",
            }}
          />
          <select value={posFilter} onChange={e => setPosFilter(e.target.value)}
            style={selectStyle}>
            <option value="">All positions</option>
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={mvtFilter} onChange={e => setMvtFilter(e.target.value)}
            style={selectStyle}>
            <option value="">All MVT</option>
            {MVT_OPTIONS.map(v => <option key={v} value={v}>MVT {v}</option>)}
          </select>
          <select value={pursuitFilter} onChange={e => setPursuitFilter(e.target.value)}
            style={selectStyle}>
            <option value="">All status</option>
            <option value="unset">Unassessed</option>
            {PURSUIT_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 2 }}>
              {["Name", "Club", "Nation", "Pos", "MVT", "Level", "Archetype", "Status", "Fit Note"].map(h => (
                <th key={h} style={{
                  padding: "10px 12px", textAlign: "left", fontWeight: 700,
                  fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em",
                  color: "var(--text3)", whiteSpace: "nowrap",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !players.length ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "var(--text3)" }}>Loading...</td></tr>
            ) : !players.length ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "var(--text3)" }}>No players found</td></tr>
            ) : players.map(p => (
              <Link key={p.id} href={`/players/${p.id}`} style={{ display: "contents", color: "inherit", textDecoration: "none" }}>
                <tr style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={cellStyle}>
                    <span style={{ fontWeight: 700, color: "var(--text)" }}>{p.name}</span>
                  </td>
                  <td style={cellStyle}>{p.club || p.division || "—"}</td>
                  <td style={cellStyle}>{p.nation || "—"}</td>
                  <td style={cellStyle}>
                    {p.position && <span className="badge badge-pos" style={{ fontSize: "0.7rem" }}>{p.position}</span>}
                    {p.secondary_position && <span style={{ color: "var(--text3)", fontSize: "0.7rem", marginLeft: 4 }}>{p.secondary_position}</span>}
                  </td>
                  <td style={cellStyle}>
                    {p.market_value_tier && <span className={mvtClass(p.market_value_tier)} style={{ fontSize: "0.7rem" }}>{p.market_value_tier}</span>}
                  </td>
                  <td style={{ ...cellStyle, fontVariantNumeric: "tabular-nums" }}>
                    {p.level ?? "—"}
                  </td>
                  <td style={{ ...cellStyle, color: "var(--text3)", fontSize: "0.75rem" }}>
                    {p.archetype || "—"}
                  </td>
                  <td style={cellStyle}>
                    {p.pursuit_status && <span className={pursuitClass(p.pursuit_status)}>{p.pursuit_status}</span>}
                  </td>
                  <td style={{ ...cellStyle, color: "var(--text3)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.fit_note || ""}
                  </td>
                </tr>
              </Link>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 24px", borderTop: "1px solid var(--border)", flexShrink: 0,
        fontSize: "0.78rem", color: "var(--text3)",
      }}>
        <span>{loading && !players.length ? "Loading..." : `${offset + 1}–${offset + players.length} shown`}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => fetchPlayers(Math.max(0, offset - limit))} disabled={!hasPrev}
            style={pageBtnStyle(hasPrev)}>Prev</button>
          <button onClick={() => fetchPlayers(offset + limit)} disabled={!hasMore}
            style={pageBtnStyle(hasMore)}>Next</button>
        </div>
      </div>
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  padding: "10px 12px", whiteSpace: "nowrap", color: "var(--text2)",
};

const selectStyle: React.CSSProperties = {
  padding: "8px 10px", background: "var(--surface2)", border: "1px solid var(--border)",
  borderRadius: 8, color: "var(--text2)", fontSize: "0.82rem", outline: "none",
  fontFamily: "inherit", cursor: "pointer",
};

function pageBtnStyle(enabled: boolean): React.CSSProperties {
  return {
    padding: "6px 14px", borderRadius: 6, fontSize: "0.78rem", fontWeight: 600,
    background: enabled ? "var(--surface2)" : "transparent",
    border: `1px solid ${enabled ? "var(--border2)" : "var(--border)"}`,
    color: enabled ? "var(--text2)" : "var(--text3)",
    cursor: enabled ? "pointer" : "default",
    opacity: enabled ? 1 : 0.5,
  };
}
