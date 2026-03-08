import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserTier } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ tier: "free" });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ tier: "free" });
    }

    const tier = await getUserTier(supabase, user.id);
    return NextResponse.json({ tier });
  } catch {
    return NextResponse.json({ tier: "free" });
  }
}
