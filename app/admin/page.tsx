"use client";

import { useEffect, useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface TableInfo {
  name: string;
  count: number;
  group: string;
  lastSync: string | null;
}

interface FbrefSyncEntry {
  comp_id: number;
  comp_name: string;
  season: string;
  stat_type: string;
  rows_fetched: number;
  synced_at: string;
}

interface PipelineData {
  tables: TableInfo[];
  fbrefSync: FbrefSyncEntry[];
}

interface HealthData {
  totalPeople: number;
  withProfiles: number;
  withMarket: number;
  withFbref: number;
  unmatchedFbref: number;
  unassessed: number;
}

interface ParsedCSV {
  fileName: string;
  statType: string;
  headers: string[];
  rows: Record<string, string>[];
}

interface MatchResult {
  matched: number;
  unmatched: number;
  total: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const COMPETITIONS: Record<number, string> = {
  9: "Premier League",
  12: "La Liga",
  20: "Bundesliga",
  11: "Serie A",
  13: "Ligue 1",
  8: "Champions League",
  19: "Europa League",
  882: "Europa Conference League",
  1: "World Cup",
  676: "European Championship",
  531: "UEFA U21 Championship",
};

const TABS = ["Import", "Pipeline", "Data Health"] as const;
type Tab = (typeof TABS)[number];

// ── CSV Parsing ──────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // FBRef CSVs may have a group header row — detect and skip it
  // The group header has fewer filled cells and repeated empty cells
  let headerIdx = 0;
  const firstRow = parseCSVLine(lines[0]);
  const secondRow = parseCSVLine(lines[1]);

  // If the second row looks more like headers (has more non-empty values that are text),
  // skip the first row as a group header
  const firstEmpty = firstRow.filter((c) => c === "").length;
  const secondEmpty = secondRow.filter((c) => c === "").length;
  if (firstEmpty > secondEmpty && firstEmpty > firstRow.length * 0.3) {
    headerIdx = 1;
  }

  const headers = parseCSVLine(lines[headerIdx]);
  const rows: Record<string, string>[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 3) continue;
    // Skip sub-header rows that repeat column names
    if (values[0] === headers[0] && values[1] === headers[1]) continue;

    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      if (headers[j]) row[headers[j]] = values[j] ?? "";
    }
    rows.push(row);
  }

  return { headers, rows };
}

function detectStatType(headers: string[]): string {
  const h = new Set(headers);
  if (h.has("gk_saves")) return "keepers";
  if (h.has("tackles") && h.has("interceptions")) return "defense";
  if (h.has("passes_completed")) return "passing";
  if (h.has("touches") && h.has("carries")) return "possession";
  if (h.has("shots") && !h.has("games")) return "shooting";
  return "standard";
}

// ── Season helpers ───────────────────────────────────────────────────────────

function generateSeasons(): string[] {
  const now = new Date();
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return Array.from({ length: 4 }, (_, i) => `${year - i}-${year - i + 1}`);
}

// ── Freshness ────────────────────────────────────────────────────────────────

function freshnessDot(lastSync: string | null): { color: string; label: string } {
  if (!lastSync) return { color: "#ef4444", label: "Never synced" };
  const age = Date.now() - new Date(lastSync).getTime();
  const hours = age / (1000 * 60 * 60);
  if (hours < 24) return { color: "#22c55e", label: "< 24h ago" };
  if (hours < 168) return { color: "#eab308", label: "< 7 days ago" };
  return { color: "#ef4444", label: "> 7 days ago" };
}

function pct(num: number, den: number): string {
  if (den === 0) return "0%";
  return `${Math.round((num / den) * 100)}%`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("Import");

  // Import state
  const [compId, setCompId] = useState(9);
  const [season, setSeason] = useState(generateSeasons()[0]);
  const [csvFiles, setCsvFiles] = useState<ParsedCSV[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Pipeline state
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);

  // Health state
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  // ── Data fetchers ────────────────────────────────────────────────────────

  const loadPipeline = useCallback(async () => {
    setPipelineLoading(true);
    try {
      const res = await fetch("/api/admin/pipeline");
      if (res.ok) setPipeline(await res.json());
    } finally {
      setPipelineLoading(false);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/admin/health");
      if (res.ok) setHealth(await res.json());
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "Pipeline" && !pipeline) loadPipeline();
    if (tab === "Data Health" && !health) loadHealth();
  }, [tab, pipeline, health, loadPipeline, loadHealth]);

  // ── CSV file handler ─────────────────────────────────────────────────────

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setImportResult(null);

    const parsed: ParsedCSV[] = [];
    let loaded = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const { headers, rows } = parseCSV(text);
        const statType = detectStatType(headers);
        parsed.push({ fileName: file.name, statType, headers, rows });
        loaded++;
        if (loaded === files.length) {
          setCsvFiles(parsed);
        }
      };
      reader.readAsText(file);
    });
  };

  // ── Import handler ───────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!csvFiles.length) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/admin/fbref-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comp_id: compId,
          comp_name: COMPETITIONS[compId],
          season,
          statTypes: csvFiles.map((f) => ({
            type: f.statType,
            rows: f.rows,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult(
          `Imported ${data.players} players, ${data.stats} stat rows (${data.statTypes.join(", ")})`
        );
        setCsvFiles([]);
      } else {
        setImportResult(`Error: ${data.error}`);
      }
    } catch (err) {
      setImportResult(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setImporting(false);
    }
  };

  // ── Match handler ────────────────────────────────────────────────────────

  const handleMatch = async () => {
    setMatching(true);
    setMatchResult(null);
    try {
      const res = await fetch("/api/admin/match", { method: "POST" });
      if (res.ok) {
        setMatchResult(await res.json());
        loadHealth();
      }
    } finally {
      setMatching(false);
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: 16,
  };

  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 12,
  };

  const btn = (active?: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    border: "1px solid var(--border)",
    borderRadius: 6,
    cursor: "pointer",
    background: active ? "var(--accent)" : "var(--surface)",
    color: active ? "#fff" : "var(--text2)",
    transition: "all 0.15s",
  });

  const primaryBtn: React.CSSProperties = {
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    background: "var(--accent)",
    color: "#fff",
  };

  const badge = (type: string): React.CSSProperties => {
    const colors: Record<string, string> = {
      standard: "#3b82f6",
      shooting: "#ef4444",
      passing: "#22c55e",
      defense: "#f59e0b",
      possession: "#8b5cf6",
      keepers: "#06b6d4",
    };
    return {
      display: "inline-block",
      padding: "2px 8px",
      fontSize: 11,
      fontWeight: 600,
      borderRadius: 4,
      background: `${colors[type] ?? "#6b7280"}22`,
      color: colors[type] ?? "#6b7280",
      textTransform: "uppercase" as const,
    };
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1100 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
        Admin
      </h1>
      <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 24 }}>
        Pipeline management, data import, and health monitoring
      </p>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={btn(tab === t)}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Import Tab ────────────────────────────────────────────────────── */}
      {tab === "Import" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...card, display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text3)", display: "block", marginBottom: 4 }}>
                Competition
              </label>
              <select
                value={compId}
                onChange={(e) => setCompId(Number(e.target.value))}
                style={{
                  padding: "8px 12px",
                  fontSize: 13,
                  background: "var(--surface2)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  minWidth: 200,
                }}
              >
                {Object.entries(COMPETITIONS).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, color: "var(--text3)", display: "block", marginBottom: 4 }}>
                Season
              </label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                style={{
                  padding: "8px 12px",
                  fontSize: 13,
                  background: "var(--surface2)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  minWidth: 140,
                }}
              >
                {generateSeasons().map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, color: "var(--text3)", display: "block", marginBottom: 4 }}>
                FBRef CSV files
              </label>
              <input
                type="file"
                accept=".csv"
                multiple
                onChange={handleFiles}
                style={{
                  fontSize: 13,
                  color: "var(--text2)",
                }}
              />
            </div>
          </div>

          {/* Preview cards */}
          {csvFiles.length > 0 && (
            <>
              <div style={grid}>
                {csvFiles.map((f, i) => (
                  <div key={i} style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                        {f.fileName}
                      </span>
                      <span style={badge(f.statType)}>{f.statType}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>
                      {f.rows.length} players &middot; {f.headers.length} columns
                    </div>
                    {/* Sample table */}
                    <div style={{ overflowX: "auto", maxHeight: 120 }}>
                      <table style={{ fontSize: 11, borderCollapse: "collapse", width: "100%" }}>
                        <thead>
                          <tr>
                            {f.headers.slice(0, 6).map((h) => (
                              <th
                                key={h}
                                style={{
                                  textAlign: "left",
                                  padding: "2px 6px",
                                  color: "var(--text3)",
                                  borderBottom: "1px solid var(--border)",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {f.rows.slice(0, 3).map((row, ri) => (
                            <tr key={ri}>
                              {f.headers.slice(0, 6).map((h) => (
                                <td
                                  key={h}
                                  style={{
                                    padding: "2px 6px",
                                    color: "var(--text2)",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {row[h] ?? ""}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  style={{
                    ...primaryBtn,
                    opacity: importing ? 0.6 : 1,
                    cursor: importing ? "not-allowed" : "pointer",
                  }}
                >
                  {importing ? "Importing..." : `Import to Database (${csvFiles.reduce((s, f) => s + f.rows.length, 0)} rows)`}
                </button>
              </div>
            </>
          )}

          {importResult && (
            <div
              style={{
                ...card,
                borderColor: importResult.startsWith("Error") ? "#ef4444" : "var(--accent)",
                color: importResult.startsWith("Error") ? "#ef4444" : "var(--text)",
                fontSize: 13,
              }}
            >
              {importResult}
            </div>
          )}
        </div>
      )}

      {/* ── Pipeline Tab ──────────────────────────────────────────────────── */}
      {tab === "Pipeline" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {pipelineLoading && (
            <p style={{ fontSize: 13, color: "var(--text3)" }}>Loading...</p>
          )}

          {pipeline && (
            <>
              {/* Group tables by source */}
              {["Core", "FBRef", "StatsBomb", "Understat", "News"].map((group) => {
                const tables = pipeline.tables.filter((t) => t.group === group);
                if (tables.length === 0) return null;
                return (
                  <div key={group}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                      {group}
                    </h3>
                    <div style={grid}>
                      {tables.map((t) => {
                        const f = freshnessDot(t.lastSync);
                        return (
                          <div key={t.name} style={card}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                                {t.name}
                              </span>
                              {t.group !== "Core" && (
                                <span
                                  title={f.label}
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: f.color,
                                    display: "inline-block",
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
                              {t.count.toLocaleString()}
                            </div>
                            {t.lastSync && (
                              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
                                {new Date(t.lastSync).toLocaleDateString()} {new Date(t.lastSync).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* FBRef sync detail */}
              {pipeline.fbrefSync.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                    FBRef Sync Log
                  </h3>
                  <div style={{ ...card, overflowX: "auto" }}>
                    <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["Competition", "Season", "Stat Type", "Rows", "Synced At"].map((h) => (
                            <th
                              key={h}
                              style={{
                                textAlign: "left",
                                padding: "6px 10px",
                                color: "var(--text3)",
                                borderBottom: "1px solid var(--border)",
                                whiteSpace: "nowrap",
                                fontWeight: 500,
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pipeline.fbrefSync.slice(0, 50).map((s, i) => (
                          <tr key={i}>
                            <td style={{ padding: "6px 10px", color: "var(--text)" }}>{s.comp_name}</td>
                            <td style={{ padding: "6px 10px", color: "var(--text)" }}>{s.season}</td>
                            <td style={{ padding: "6px 10px" }}>
                              <span style={badge(s.stat_type)}>{s.stat_type}</span>
                            </td>
                            <td style={{ padding: "6px 10px", color: "var(--text)" }}>
                              {s.rows_fetched.toLocaleString()}
                            </td>
                            <td style={{ padding: "6px 10px", color: "var(--text3)", whiteSpace: "nowrap" }}>
                              {new Date(s.synced_at).toLocaleDateString()}{" "}
                              {new Date(s.synced_at).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button
                onClick={loadPipeline}
                style={{ ...btn(), alignSelf: "flex-start" }}
              >
                Refresh
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Data Health Tab ───────────────────────────────────────────────── */}
      {tab === "Data Health" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {healthLoading && (
            <p style={{ fontSize: 13, color: "var(--text3)" }}>Loading...</p>
          )}

          {health && (
            <>
              <div style={grid}>
                {[
                  {
                    label: "Total People",
                    value: health.totalPeople.toLocaleString(),
                    sub: null,
                  },
                  {
                    label: "With Profiles",
                    value: health.withProfiles.toLocaleString(),
                    sub: pct(health.withProfiles, health.totalPeople),
                  },
                  {
                    label: "With Market Data",
                    value: health.withMarket.toLocaleString(),
                    sub: pct(health.withMarket, health.totalPeople),
                  },
                  {
                    label: "FBRef Matched",
                    value: health.withFbref.toLocaleString(),
                    sub: `${health.unmatchedFbref.toLocaleString()} unmatched`,
                  },
                  {
                    label: "Unassessed",
                    value: health.unassessed.toLocaleString(),
                    sub: pct(health.unassessed, health.totalPeople) + " of total",
                  },
                ].map((m) => (
                  <div key={m.label} style={card}>
                    <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
                      {m.value}
                    </div>
                    {m.sub && (
                      <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                        {m.sub}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button
                  onClick={handleMatch}
                  disabled={matching}
                  style={{
                    ...primaryBtn,
                    opacity: matching ? 0.6 : 1,
                    cursor: matching ? "not-allowed" : "pointer",
                  }}
                >
                  {matching ? "Matching..." : "Run Player Matching"}
                </button>

                <button onClick={loadHealth} style={btn()}>
                  Refresh
                </button>

                {matchResult && (
                  <span style={{ fontSize: 13, color: "var(--text2)" }}>
                    Matched {matchResult.matched} of {matchResult.total} ({matchResult.unmatched} remaining)
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
