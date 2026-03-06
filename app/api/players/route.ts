import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const SELECT = [
  "id","name","club","division","nation",
  "position","secondary_position",
  "level","peak",
  '"Character"','"Mentality"','"Foot"','"Physique"',
  "model",'"primary"','"secondary"',
  "archetype","archetype_override",
  "market_value_tier","scarcity_score","national_scarcity","market_premium",
  "scouting_notes",
  "pursuit_status","director_valuation_meur","fit_note",
].join(", ");

const ALLOWED = [
  "position","secondary_position","level","peak",
  "Character","Mentality","Foot","Physique",
  "model","primary","secondary","archetype_override",
  "scouting_notes",
  "pursuit_status","director_valuation_meur","fit_note",
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit  = parseInt(searchParams.get("limit")  ?? "60");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  // Exclude Pass; unassessed (null pursuit_status) come first, then MVT desc
  const { data, error } = await supabase
    .from("players")
    .select(SELECT)
    .or("club.not.is.null,division.not.is.null")
    .or("pursuit_status.is.null,pursuit_status.neq.Pass")
    .order("pursuit_status", { ascending: true, nullsFirst: true })
    .order("market_value_tier", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const update: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in fields && fields[key] !== undefined) {
      update[key] = fields[key] === "" ? null : fields[key];
    }
  }
  if (!Object.keys(update).length)
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });

  const { error } = await supabase.from("players").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
