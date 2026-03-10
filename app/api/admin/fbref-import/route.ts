import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

// FBRef CSV data-stat column → DB column mapping
const COLUMN_MAP: Record<string, { db: string; type: "int" | "float" }> = {
  games: { db: "matches_played", type: "int" },
  games_starts: { db: "starts", type: "int" },
  minutes: { db: "minutes", type: "int" },
  goals: { db: "goals", type: "int" },
  assists: { db: "assists", type: "int" },
  pens_made: { db: "penalties_made", type: "int" },
  pens_att: { db: "penalties_att", type: "int" },
  cards_yellow: { db: "yellow_cards", type: "int" },
  cards_red: { db: "red_cards", type: "int" },
  xg: { db: "xg", type: "float" },
  npxg: { db: "npxg", type: "float" },
  xg_assist: { db: "xag", type: "float" },
  shots: { db: "shots", type: "int" },
  shots_on_target: { db: "shots_on_target", type: "int" },
  passes_completed: { db: "passes_completed", type: "int" },
  passes: { db: "passes_attempted", type: "int" },
  passes_pct: { db: "pass_pct", type: "float" },
  progressive_passes: { db: "progressive_passes", type: "int" },
  assisted_shots: { db: "key_passes", type: "int" },
  tackles: { db: "tackles", type: "int" },
  tackles_won: { db: "tackles_won", type: "int" },
  interceptions: { db: "interceptions", type: "int" },
  blocks: { db: "blocks", type: "int" },
  clearances: { db: "clearances", type: "int" },
  touches: { db: "touches", type: "int" },
  carries: { db: "carries", type: "int" },
  progressive_carries: { db: "progressive_carries", type: "int" },
  dribbles_completed: { db: "successful_dribbles", type: "int" },
  dribbles: { db: "dribbles_attempted", type: "int" },
  gk_saves: { db: "gk_saves", type: "int" },
  gk_save_pct: { db: "gk_save_pct", type: "float" },
  gk_clean_sheets: { db: "gk_clean_sheets", type: "int" },
  gk_goals_against: { db: "gk_goals_against", type: "int" },
  gk_psxg: { db: "gk_psxg", type: "float" },
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function safeInt(v: string | undefined): number | null {
  if (!v || v.trim() === "") return null;
  const n = parseInt(v.replace(/,/g, ""), 10);
  return isNaN(n) ? null : n;
}

function safeFloat(v: string | undefined): number | null {
  if (!v || v.trim() === "") return null;
  const n = parseFloat(v.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

interface StatTypePayload {
  type: string;
  rows: Record<string, string>[];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { comp_id, comp_name, season, statTypes } = body as {
      comp_id: number;
      comp_name: string;
      season: string;
      statTypes: StatTypePayload[];
    };

    if (!comp_id || !season || !statTypes?.length) {
      return NextResponse.json(
        { error: "comp_id, season, and at least one statType required" },
        { status: 400 }
      );
    }

    // Merge rows across stat types by player composite key (name + team)
    const playerMap = new Map<
      string,
      { name: string; team: string; nation: string; position: string; age: string; stats: Record<string, string> }
    >();

    for (const st of statTypes) {
      for (const row of st.rows) {
        const name = row.player || row.Player || "";
        const team = row.team || row.Squad || "";
        if (!name) continue;

        const key = `${name}::${team}`;
        if (!playerMap.has(key)) {
          playerMap.set(key, {
            name,
            team,
            nation: row.nationality || row.Nation || "",
            position: row.position || row.Pos || "",
            age: row.age || row.Age || "",
            stats: {},
          });
        }

        // Merge all stat columns
        const entry = playerMap.get(key)!;
        for (const [csvCol, val] of Object.entries(row)) {
          if (val && val.trim() !== "" && COLUMN_MAP[csvCol]) {
            entry.stats[csvCol] = val;
          }
        }
      }
    }

    if (playerMap.size === 0) {
      return NextResponse.json({ error: "No valid player rows found" }, { status: 400 });
    }

    // Generate fbref_id and build upsert arrays
    const playerUpserts: Record<string, unknown>[] = [];
    const statUpserts: Record<string, unknown>[] = [];

    for (const [, p] of playerMap) {
      const fbrefId = `csv_${comp_id}_${season}_${slugify(p.team)}_${slugify(p.name)}`;

      playerUpserts.push({
        fbref_id: fbrefId,
        name: p.name,
        nation: p.nation || null,
        position: p.position || null,
      });

      const statRow: Record<string, unknown> = {
        fbref_id: fbrefId,
        comp_id,
        comp_name,
        season,
        team: p.team || null,
        age: p.age || null,
      };

      // Map CSV columns to DB columns
      for (const [csvCol, mapping] of Object.entries(COLUMN_MAP)) {
        const val = p.stats[csvCol];
        if (val !== undefined) {
          statRow[mapping.db] =
            mapping.type === "int" ? safeInt(val) : safeFloat(val);
        }
      }

      statUpserts.push(statRow);
    }

    // Upsert fbref_players
    const { error: playerError } = await supabase.from("fbref_players").upsert(
      playerUpserts,
      { onConflict: "fbref_id" }
    );
    if (playerError) {
      return NextResponse.json({ error: `fbref_players upsert: ${playerError.message}` }, { status: 500 });
    }

    // Upsert fbref_player_season_stats
    const { error: statError } = await supabase.from("fbref_player_season_stats").upsert(
      statUpserts,
      { onConflict: "fbref_id,comp_id,season" }
    );
    if (statError) {
      return NextResponse.json({ error: `fbref_player_season_stats upsert: ${statError.message}` }, { status: 500 });
    }

    // Log sync entries per stat type
    const syncTypes = statTypes.map((st) => st.type);
    for (const st of statTypes) {
      await supabase.from("fbref_sync_log").upsert(
        {
          comp_id,
          comp_name,
          season,
          stat_type: st.type,
          rows_fetched: st.rows.length,
        },
        { onConflict: "comp_id,season,stat_type" }
      );
    }

    return NextResponse.json({
      players: playerUpserts.length,
      stats: statUpserts.length,
      statTypes: syncTypes,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
