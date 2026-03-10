import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const TABLES = [
  { name: "people", group: "Core" },
  { name: "player_profiles", group: "Core" },
  { name: "player_status", group: "Core" },
  { name: "player_market", group: "Core" },
  { name: "fbref_players", group: "FBRef" },
  { name: "fbref_player_season_stats", group: "FBRef" },
  { name: "sb_matches", group: "StatsBomb" },
  { name: "sb_events", group: "StatsBomb" },
  { name: "sb_lineups", group: "StatsBomb" },
  { name: "understat_matches", group: "Understat" },
  { name: "understat_player_match_stats", group: "Understat" },
  { name: "news_stories", group: "News" },
  { name: "news_player_tags", group: "News" },
];

export async function GET() {
  // Count all tables in parallel
  const countResults = await Promise.all(
    TABLES.map((t) =>
      supabase.from(t.name).select("*", { count: "exact", head: true })
    )
  );

  const tables = TABLES.map((t, i) => ({
    name: t.name,
    count: countResults[i].count ?? 0,
    group: t.group,
    lastSync: null as string | null,
  }));

  // Get FBRef sync log
  const { data: fbrefSync } = await supabase
    .from("fbref_sync_log")
    .select("comp_id, comp_name, season, stat_type, rows_fetched, synced_at")
    .order("synced_at", { ascending: false });

  // Extract latest sync timestamps per group
  if (fbrefSync && fbrefSync.length > 0) {
    const latestFbref = fbrefSync[0].synced_at;
    for (const t of tables) {
      if (t.group === "FBRef") t.lastSync = latestFbref;
    }
  }

  // Try to get latest synced_at from other source tables
  const [understatSync, sbSync, newsSync] = await Promise.all([
    supabase
      .from("understat_matches")
      .select("synced_at")
      .order("synced_at", { ascending: false })
      .limit(1),
    supabase
      .from("sb_matches")
      .select("synced_at")
      .order("synced_at", { ascending: false })
      .limit(1),
    supabase
      .from("news_stories")
      .select("fetched_at")
      .order("fetched_at", { ascending: false })
      .limit(1),
  ]);

  if (understatSync.data?.[0]?.synced_at) {
    for (const t of tables) {
      if (t.group === "Understat") t.lastSync = understatSync.data[0].synced_at;
    }
  }
  if (sbSync.data?.[0]?.synced_at) {
    for (const t of tables) {
      if (t.group === "StatsBomb") t.lastSync = sbSync.data[0].synced_at;
    }
  }
  if (newsSync.data?.[0]?.fetched_at) {
    for (const t of tables) {
      if (t.group === "News") t.lastSync = newsSync.data[0].fetched_at;
    }
  }

  return NextResponse.json({ tables, fbrefSync: fbrefSync ?? [] });
}
