import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";

// Raw DB row type (snake_case from PostgreSQL)
type DreamRow = {
  id: string;
  name: string;
  dream: string;
  reason: string;
  language: "id" | "en";
  created_at: string;
};

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("dreams")
    .select("id,name,dream,reason,language,created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50) as { data: DreamRow[] | null; error: unknown };

  if (error || !data) {
    return NextResponse.json({ error: "Failed to fetch dreams" }, { status: 500 });
  }

  return NextResponse.json(
    {
      version: "1.0",
      title: "Before Die — Dream Wall",
      description: "A quiet wall of human dreams and milestones.",
      language: "en",
      dreams: data.map((item) => ({
        id: item.id,
        name: item.name,
        dream: item.dream,
        reason: item.reason,
        language: item.language,
        createdAt: item.created_at,
      })),
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      },
    },
  );
}
