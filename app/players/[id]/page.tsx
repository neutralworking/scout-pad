"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PlayerNews from "../../components/PlayerNews";

interface Player {
  id: number; name: string; club: string | null; division: string | null;
  nation: string | null; position: string | null; secondary_position: string | null;
  level: number | null; peak: number | null;
  Character: string | null; Mentality: string | null; Foot: string | null;
  Physique: string | null; model: string | null;
  primary: string | null; secondary: string | null;
  archetype: string | null; archetype_override: string | null;
  market_value_tier: number | null; scarcity_score: number | null;
  national_scarcity: number | null; market_premium: number | null;
  scouting_notes: string | null;
  pursuit_status: "Pass" | "Watch" | "Interested" | "Priority" | null;
  director_valuation_meur: number | null;
  fit_note: string | null;
}

const PURSUIT_OPTIONS = [
  { value: "Pass",       label: "Pass",       color: "var(--text3)",  bg: "var(--surface2)", border: "var(--border2)" },
  { value: "Watch",      label: "Watch",      color: "var(--text2)",  bg: "var(--surface2)", border: "var(--text3)" },
  { value: "Interested", label: "Interested", color: "var(--accent)", bg: "var(--accent-dim)", border: "var(--accent)" },
  { value: "Priority",   label: "Priority",   color: "var(--amber)",  bg: "var(--amber-dim)", border: "var(--amber)" },
] as const;

function tierLabel(v: number) {
  if (v >= 90) return "World Class";
  if (v >= 86) return "Elite";
  if (v >= 82) return "Top Flight";
  if (v >= 78) return "Championship";
  return "Lower League";
}

function dots(score: number | null, max = 5) {
  if (!score) return null;
  return Array.from({ length: max }, (_, i) => (
    <span key={i} style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%", marginRight: 2,
      background: i < score ? "var(--amber)" : "var(--border2)",
    }} />
  ));
}

export default function PlayerProfile() {
  const params = useParams();
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [suitability, setSuitability] = useState<{ score: number; breakdown: { factor: string; points: number; detail: string }[]; matched_need: Record<string, unknown> | null } | null>(null);

  // Editable fields
  const [pursuit, setPursuit] = useState<string>("");
  const [valuation, setValuation] = useState<string>("");
  const [fitNote, setFitNote] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/players/${params.id}`);
        if (!res.ok) { router.push("/"); return; }
        const p: Player = await res.json();
        setPlayer(p);
        setPursuit(p.pursuit_status ?? "");
        setValuation(p.director_valuation_meur != null ? String(p.director_valuation_meur) : "");
        setFitNote(p.fit_note ?? "");
        setNotes(p.scouting_notes ?? "");
      } catch { router.push("/"); }
      finally { setLoading(false); }
    })();
    // Fetch suitability score
    fetch(`/api/players/${params.id}/suitability`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.score != null) setSuitability(d); })
      .catch(() => {});
  }, [params.id, router]);

  const handleSave = useCallback(async () => {
    if (!player || saving) return;
    setSaving(true);
    const payload: Record<string, unknown> = { id: player.id };
    if (pursuit !== (player.pursuit_status ?? ""))
      payload.pursuit_status = pursuit || null;
    if (valuation !== (player.director_valuation_meur != null ? String(player.director_valuation_meur) : ""))
      payload.director_valuation_meur = valuation ? parseInt(valuation) : null;
    if (fitNote !== (player.fit_note ?? ""))
      payload.fit_note = fitNote.trim() || null;
    if (notes !== (player.scouting_notes ?? ""))
      payload.scouting_notes = notes.trim() || null;

    if (Object.keys(payload).length <= 1) { setSaving(false); return; }

    try {
      await fetch("/api/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    finally { setSaving(false); }
  }, [player, pursuit, valuation, fitNote, notes, saving]);

  if (loading || !player) return (
    <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)" }}>
      Loading...
    </div>
  );

  const arch = player.archetype_override ?? player.archetype;
  const traits = player.Character ? player.Character.split(",").map(s => s.trim()).filter(Boolean) : [];

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 24px",
        borderBottom: "1px solid var(--border)", flexShrink: 0,
      }}>
        <Link href="/" style={{
          color: "var(--text3)", textDecoration: "none", fontSize: "0.82rem",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Players
        </Link>
        <span style={{ color: "var(--text3)" }}>/</span>
        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{player.name}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {saved && <span style={{ fontSize: "0.75rem", color: "var(--green)", fontWeight: 700 }}>Saved</span>}
          <button onClick={handleSave} style={{
            padding: "7px 18px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 700,
            background: "var(--accent)", border: "none", color: "white", cursor: "pointer",
          }}>Save</button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 1100 }}>

          {/* ── Left column: Player info ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Header card */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>
                {player.name}
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {player.club && <span className="badge badge-club">{player.club}</span>}
                {player.division && <span className="badge badge-club">{player.division}</span>}
                {player.nation && <span className="badge badge-nation">{player.nation}</span>}
                {player.position && <span className="badge badge-pos">{player.position}</span>}
                {player.secondary_position && <span className="badge badge-pos" style={{ opacity: 0.6 }}>{player.secondary_position}</span>}
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {player.Mentality && <InfoItem label="Mentality" value={player.Mentality} />}
                {player.Foot && <InfoItem label="Foot" value={player.Foot} />}
                {player.Physique && <InfoItem label="Physique" value={player.Physique} />}
                {player.model && <InfoItem label="Model" value={player.model} />}
              </div>
            </div>

            {/* Rating card */}
            <div style={cardStyle}>
              <SectionLabel>Rating</SectionLabel>
              <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
                {player.level != null && (
                  <div>
                    <div style={{ fontSize: "2.2rem", fontWeight: 900, lineHeight: 1 }}>{player.level}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text3)", marginTop: 2 }}>
                      Level &middot; {tierLabel(player.level)}
                    </div>
                  </div>
                )}
                {player.peak != null && (
                  <div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 800, lineHeight: 1, color: "var(--text2)" }}>{player.peak}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text3)", marginTop: 2 }}>Peak</div>
                  </div>
                )}
                {player.market_value_tier != null && (
                  <div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 800, lineHeight: 1, color: "var(--amber)" }}>{player.market_value_tier}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text3)", marginTop: 2 }}>MVT</div>
                  </div>
                )}
              </div>
            </div>

            {/* Market card */}
            <div style={cardStyle}>
              <SectionLabel>Market Intelligence</SectionLabel>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <MetricBlock label="Scarcity" score={player.scarcity_score} />
                <MetricBlock label="National Scarcity" score={player.national_scarcity} />
                {player.market_premium != null && (
                  <div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Premium</div>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4, fontWeight: 700, fontSize: "0.82rem",
                      background: player.market_premium > 0 ? "var(--amber-dim)" : player.market_premium < 0 ? "var(--green-dim)" : "var(--surface2)",
                      color: player.market_premium > 0 ? "var(--amber)" : player.market_premium < 0 ? "var(--green)" : "var(--text3)",
                    }}>
                      {player.market_premium > 0 ? `+${player.market_premium}` : player.market_premium}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Class & Identity */}
            <div style={cardStyle}>
              <SectionLabel>Class & Identity</SectionLabel>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 12 }}>
                {player.primary && <InfoItem label="Primary Class" value={player.primary} />}
                {player.secondary && <InfoItem label="Secondary Class" value={player.secondary} />}
                {arch && <InfoItem label="Archetype" value={arch} />}
              </div>
              {traits.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.6rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Traits</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {traits.map(t => (
                      <span key={t} style={{
                        padding: "3px 8px", borderRadius: 12, fontSize: "0.72rem", fontWeight: 600,
                        background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text2)",
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right column: DoF evaluation ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Suitability score */}
            {suitability && suitability.score != null && (
              <div style={cardStyle}>
                <SectionLabel>Suitability Score</SectionLabel>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    background: suitability.score >= 70 ? "var(--green-dim)" : suitability.score >= 45 ? "var(--amber-dim)" : "var(--surface2)",
                    border: `2px solid ${suitability.score >= 70 ? "var(--green)" : suitability.score >= 45 ? "var(--amber)" : "var(--border2)"}`,
                  }}>
                    <span style={{
                      fontSize: "1.6rem", fontWeight: 900,
                      color: suitability.score >= 70 ? "var(--green)" : suitability.score >= 45 ? "var(--amber)" : "var(--text3)",
                    }}>{suitability.score}</span>
                  </div>
                  {suitability.matched_need && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text3)" }}>
                      Best fit: <span style={{ color: "var(--text2)", fontWeight: 600 }}>{String(suitability.matched_need.position)}</span>
                      {suitability.matched_need.preferred_archetype ? (
                        <span> ({String(suitability.matched_need.preferred_archetype)})</span>
                      ) : null}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {suitability.breakdown.map(b => (
                    <div key={b.factor} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.72rem" }}>
                      <span style={{ width: 80, color: "var(--text3)", flexShrink: 0 }}>{b.factor}</span>
                      <div style={{ flex: 1, height: 6, background: "var(--surface2)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 3,
                          width: `${Math.min(100, (b.points / { Position: 30, "Market Value": 20, Archetype: 15, Foot: 10, Quality: 15, Scarcity: 9 }[b.factor]!) * 100)}%`,
                          background: b.points > 0 ? "var(--accent)" : "var(--border2)",
                        }} />
                      </div>
                      <span style={{ width: 22, textAlign: "right", color: "var(--text2)", fontWeight: 600 }}>{b.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pursuit status */}
            <div style={cardStyle}>
              <SectionLabel>Director&apos;s Call</SectionLabel>
              <div style={{ fontSize: "0.6rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Pursuit Status</div>
              <div style={{ display: "flex", gap: 6 }}>
                {PURSUIT_OPTIONS.map(opt => {
                  const active = pursuit === opt.value;
                  return (
                    <button key={opt.value}
                      onClick={() => setPursuit(pursuit === opt.value ? "" : opt.value)}
                      style={{
                        flex: 1, height: 42, borderRadius: 10, fontSize: "0.82rem", fontWeight: 700,
                        border: `1px solid ${active ? opt.border : "var(--border2)"}`,
                        background: active ? opt.bg : "var(--surface2)",
                        color: active ? opt.color : "var(--text3)",
                        cursor: "pointer", transition: "all 0.15s",
                      }}>
                      {opt.value === "Priority" ? `\u2605 ${opt.label}` : opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Valuation */}
            <div style={cardStyle}>
              <SectionLabel>Valuation</SectionLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="number" min={0} max={999} placeholder="—"
                  value={valuation}
                  onChange={e => setValuation(e.target.value)}
                  style={{
                    width: 100, padding: "8px 12px", background: "var(--surface2)",
                    border: "1px solid var(--border)", borderRadius: 8,
                    color: "var(--text)", fontSize: "1.1rem", fontWeight: 700,
                    outline: "none", fontFamily: "inherit", textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
                <span style={{ fontWeight: 700, color: "var(--text2)", fontSize: "0.9rem" }}>M&euro;</span>
              </div>
            </div>

            {/* Fit note */}
            <div style={cardStyle}>
              <SectionLabel>Fit Note</SectionLabel>
              <input
                type="text"
                placeholder="e.g. plays behind our CF as the 10..."
                value={fitNote}
                onChange={e => setFitNote(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", background: "var(--surface2)",
                  border: "1px solid var(--border)", borderRadius: 8,
                  color: "var(--text)", fontSize: "0.85rem", outline: "none", fontFamily: "inherit",
                }}
              />
            </div>

            {/* Scouting notes */}
            <div style={{ ...cardStyle, flex: 1, display: "flex", flexDirection: "column" }}>
              <SectionLabel>Scouting Notes</SectionLabel>
              <textarea
                rows={10}
                placeholder="Your read on this player..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{
                  flex: 1, width: "100%", padding: "10px 12px", background: "var(--surface2)",
                  border: "1px solid var(--border)", borderRadius: 10,
                  color: "var(--text)", fontSize: "0.82rem", outline: "none",
                  fontFamily: "inherit", lineHeight: 1.6, resize: "none", minHeight: 160,
                }}
              />
            </div>

            {/* Player news (Gemini) */}
            <PlayerNews playerId={player.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──

const cardStyle: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em",
      textTransform: "uppercase", color: "var(--text3)", marginBottom: 12,
    }}>{children}</div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.6rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)" }}>{value}</div>
    </div>
  );
}

function MetricBlock({ label, score }: { label: string; score: number | null }) {
  if (score == null) return null;
  return (
    <div>
      <div style={{ fontSize: "0.6rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", gap: 2 }}>{dots(score)}</div>
    </div>
  );
}
