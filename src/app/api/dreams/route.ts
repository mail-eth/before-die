import { NextResponse } from "next/server";
import { sampleDreams } from "@/lib/content";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";
import { dreamSchema, moderateSubmission } from "@/lib/validation";

// Raw DB row type (snake_case from PostgreSQL)
type DreamRow = {
  id: string;
  name: string;
  dream: string;
  reason: string;
  language: string;
  created_at: string;
};

// ── Rate Limiting (in-memory, per-process) ──────────────────────────────────
// For production with multiple processes, use Upstash Redis.
// Track submissions per IP in the last 15 minutes.
const submissionTracker = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 3; // max 3 submissions per window per IP

function getRateLimitKey(ip: string): string {
  return ip.replace(/:/g, "_");
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = getRateLimitKey(ip);
  const entry = submissionTracker.get(key);

  // Clean up expired entries periodically
  if (submissionTracker.size > 10000) {
    for (const [k, v] of submissionTracker) {
      if (now > v.resetAt) submissionTracker.delete(k);
    }
  }

  if (!entry || now > entry.resetAt) {
    submissionTracker.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

// ── GET ─────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ items: sampleDreams, nextCursor: null, preview: true });
  }

  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "12", 10), 50);
  const cursor = searchParams.get("cursor") ?? null;

  try {
    let query = supabase
      .from("dreams")
      .select("id,name,dream,reason,language,created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit + 1); // fetch one extra to determine if there's a next page

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        query = query.lt("created_at", cursor);
      }
    }

    const { data, error } = await query as { data: DreamRow[] | null; error: { message?: string } | null };

    if (error || data === null) {
      console.error("[before-die] GET /api/dreams error:", error?.message);
      return NextResponse.json({ items: sampleDreams, nextCursor: null, preview: true });
    }

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore && items.length > 0
      ? items[items.length - 1].created_at
      : null;

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        dream: item.dream,
        reason: item.reason,
        language: item.language,
        createdAt: item.created_at,
      })),
      nextCursor,
      preview: false,
    });
  } catch (err) {
    console.error("[before-die] GET /api/dreams unexpected error:", err);
    return NextResponse.json({ items: sampleDreams, nextCursor: null, preview: true });
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for")
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        status: "rate_limited",
        message: `Too many submissions. Please try again in ${rateLimit.retryAfter} seconds.`,
      },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
    );
  }

  try {
    const json = await request.json();
    const parsed = dreamSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, status: "rejected", message: "Please review your submission and try again." },
        { status: 400 },
      );
    }

    const moderated = moderateSubmission(parsed.data);

    if (moderated.status !== "published") {
      return NextResponse.json(
        { ok: false, status: moderated.status, message: moderated.message },
        { status: 400 },
      );
    }

    if (!hasSupabaseEnv()) {
      return NextResponse.json({
        ok: true,
        status: "published",
        message: "Preview mode: your submission flow is ready, waiting for database connection.",
      });
    }

    const supabase = getSupabaseAdmin();
    const insertPayload = {
      name: moderated.value.name,
      dream: moderated.value.dream,
      reason: moderated.value.reason,
      language: moderated.value.language,
      status: "published",
      ip_hash: "pending",
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from("dreams")
      .insert(insertPayload);

    if (insertError) {
      console.error("[before-die] POST /api/dreams insert error:", insertError.message);
      return NextResponse.json(
        { ok: false, status: "rejected", message: "Failed to save your submission." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: "published",
      message: "Your dream has been received.",
    });
  } catch (err) {
    console.error("[before-die] POST /api/dreams unexpected error:", err);
    return NextResponse.json(
      { ok: false, status: "rejected", message: "Unexpected error." },
      { status: 500 },
    );
  }
}
