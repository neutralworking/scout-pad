import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const SELECT = [
  "id","name","club","division","nation",
  "position","secondary_position",
  "level","peak",
  '"Character"','"Mentality"','"Foot"','"Physique"',
  "model",'"primary"','"secondary"',
  "archetype","archetype_confidence","archetype_override",
  "market_value_tier","scarcity_score","national_scarcity","market_premium",
  "scouting_notes",
  "pursuit_status","director_valuation_meur","fit_note",
  "squad_role","loan_status",
  "blueprint","attributes",
].join(", ");

const ALLOWED = [
  "position","secondary_position","level","peak",
  "Character","Mentality","Foot","Physique",
  "model","primary","secondary","archetype_override",
  "scouting_notes",
  "pursuit_status","director_valuation_meur","fit_note",
  "squad_role","loan_status",
  "blueprint","attributes",
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("players")
    .select(SELECT)
    .eq("id", id)
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json(data);
}
