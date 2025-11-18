import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/utils/auth";
import { sendDiscordNotification } from "@/lib/utils/discord";

function verifySheetsAuth(request: NextRequest): boolean {
  const secret = process.env.SHEETS_WEBHOOK_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  return token === secret;
}

export async function GET(request: NextRequest) {
  try {
    // Admin-only listing for inbox UI
    await requireSuperAdmin();
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "pending";

    const { data, error } = await (supabase as any)
      .from("incoming_certificates")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      await sendDiscordNotification(
        `incoming_certificates GET failed: ${error.message}`
      );
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error: any) {
    await sendDiscordNotification(
      `incoming_certificates GET exception: ${error.message || String(error)}`
    );
    return NextResponse.json(
      { error: error.message || "Failed to list incoming certificates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifySheetsAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const body = await request.json();

    const { event_code, section, rows } = body as {
      event_code: string;
      section: string;
      rows: Array<Record<string, any>>;
    };

    if (!event_code || !section || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: "event_code, section and rows are required" },
        { status: 400 }
      );
    }

    const { data: event, error: eventError } = await (supabase as any)
      .from("events")
      .select("id, event_code")
      .eq("event_code", event_code)
      .single();

    if (eventError || !event) {
      await sendDiscordNotification(
        `incoming_certificates POST: event not found for code ${event_code}`
      );
      return NextResponse.json(
        { error: `Event with code "${event_code}" not found` },
        { status: 404 }
      );
    }

    const inserts = rows.map((row) => ({
      event_id: event.id,
      section,
      payload: row,
      status: "pending",
    }));

    const { data, error } = await (supabase as any)
      .from("incoming_certificates")
      .insert(inserts)
      .select();

    if (error) {
      await sendDiscordNotification(
        `incoming_certificates POST failed: ${error.message}`
      );
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Rows staged successfully", count: data?.length ?? 0 },
      { status: 201 }
    );
  } catch (error: any) {
    await sendDiscordNotification(
      `incoming_certificates POST exception: ${error.message || String(error)}`
    );
    return NextResponse.json(
      { error: error.message || "Failed to stage incoming certificates" },
      { status: 500 }
    );
  }
}
