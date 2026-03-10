import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function GET() {
  const [people, profiles, market, fbrefMatched, fbrefUnmatched, unassessed] =
    await Promise.all([
      supabase.from("people").select("*", { count: "exact", head: true }),
      supabase.from("player_profiles").select("*", { count: "exact", head: true }),
      supabase.from("player_market").select("*", { count: "exact", head: true }),
      supabase
        .from("fbref_players")
        .select("*", { count: "exact", head: true })
        .not("person_id", "is", null),
      supabase
        .from("fbref_players")
        .select("*", { count: "exact", head: true })
        .is("person_id", null),
      supabase
        .from("people")
        .select("id, player_status(pursuit_status)", { count: "exact", head: true })
        .is("player_status.pursuit_status", null),
    ]);

  return NextResponse.json({
    totalPeople: people.count ?? 0,
    withProfiles: profiles.count ?? 0,
    withMarket: market.count ?? 0,
    withFbref: fbrefMatched.count ?? 0,
    unmatchedFbref: fbrefUnmatched.count ?? 0,
    unassessed: unassessed.count ?? 0,
  });
}
