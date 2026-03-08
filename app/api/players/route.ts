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
].join(", ");

const ALLOWED = [
  "position","secondary_position","level","peak",
  "Character","Mentality","Foot","Physique",
  "model","primary","secondary","archetype_override",
  "scouting_notes",
  "pursuit_status","director_valuation_meur","fit_note",
];

const SORT_FIELDS: Record<string, { column: string; ascending: boolean; nullsFirst: boolean }> = {
  market_value_tier_desc: { column: "market_value_tier", ascending: false, nullsFirst: false },
  market_value_tier_asc:  { column: "market_value_tier", ascending: true,  nullsFirst: true },
  name_asc:               { column: "name",              ascending: true,  nullsFirst: false },
  name_desc:              { column: "name",              ascending: false, nullsFirst: false },
  scarcity_score_desc:    { column: "scarcity_score",    ascending: false, nullsFirst: false },
  scarcity_score_asc:     { column: "scarcity_score",    ascending: true,  nullsFirst: true },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit    = parseInt(searchParams.get("limit")  ?? "60");
  const offset   = parseInt(searchParams.get("offset") ?? "0");
  const search   = searchParams.get("search")?.trim()   ?? "";
  const position = searchParams.get("position")          ?? "";
  const mvt      = searchParams.get("mvt")               ?? "";
  const pursuit  = searchParams.get("pursuit")           ?? "";
  const division = searchParams.get("division")          ?? "";
  const sortKey  = searchParams.get("sort")              ?? "market_value_tier_desc";

  let query = supabase
    .from("players")
    .select(SELECT)
    .or("club.not.is.null,division.not.is.null");

  // --- filters ---

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (position) {
    query = query.eq("position", position);
  }

  if (mvt) {
    query = query.eq("market_value_tier", mvt);
  }

  if (pursuit === "unset") {
    query = query.is("pursuit_status", null);
  } else if (pursuit) {
    query = query.eq("pursuit_status", pursuit);
  } else {
    // Default behaviour: exclude "Pass"
    query = query.or("pursuit_status.is.null,pursuit_status.neq.Pass");
  }

  if (division) {
    query = query.eq("division", division);
  }

  // --- sorting ---

  const sort = SORT_FIELDS[sortKey] ?? SORT_FIELDS["market_value_tier_desc"];
  query = query
    .order("pursuit_status", { ascending: true, nullsFirst: true })
    .order(sort.column, { ascending: sort.ascending, nullsFirst: sort.nullsFirst });

  // --- pagination ---

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

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
