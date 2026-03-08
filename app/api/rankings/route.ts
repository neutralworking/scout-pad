import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function GET() {
  const { data, error } = await supabase
    .from("player_tags")
    .select("player_id, tag_id, tags(name, category), players(id, name, club, position, level, peak)")
    .eq("tags.category", "award_contention");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter out rows where the join didn't match (tags.category filter makes non-matching rows have null tags)
  const rows = (data ?? [])
    .filter((r: Record<string, unknown>) => r.tags !== null)
    .map((r: Record<string, unknown>) => {
      const tag = r.tags as { name: string; category: string };
      const player = r.players as { id: number; name: string; club: string | null; position: string | null; level: number | null; peak: number | null };
      return {
        id: player.id,
        name: player.name,
        club: player.club,
        position: player.position,
        level: player.level,
        peak: player.peak,
        tag_name: tag.name,
      };
    })
    .sort((a: { level: number | null }, b: { level: number | null }) => (b.level ?? 0) - (a.level ?? 0));

  return NextResponse.json(rows);
}
