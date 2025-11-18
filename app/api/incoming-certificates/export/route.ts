import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    if (!verifySheetsAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const eventCode = searchParams.get("event_code");
    const section = searchParams.get("section");

    if (!eventCode || !section) {
      return NextResponse.json(
        { error: "event_code and section are required" },
        { status: 400 }
      );
    }

    const { data: event, error: eventError } = await (supabase as any)
      .from("events")
      .select("id, event_code")
      .eq("event_code", eventCode)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: `Event with code "${eventCode}" not found` },
        { status: 404 }
      );
    }

    const { data, error } = await (supabase as any)
      .from("incoming_certificates")
      .select("id, payload, status")
      .eq("event_id", event.id)
      .eq("section", section)
      .eq("status", "accepted")
      .order("created_at", { ascending: true });

    if (error) {
      await sendDiscordNotification(
        `incoming_certificates export failed: ${error.message}`
      );
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Each payload is expected to contain sheet_row_id so we can map back to rows
    const rows = (data || []).map((row: any) => ({
      sheet_row_id: row.payload.sheet_row_id,
      participant_name: row.payload.participant_name || row.payload.name,
      certificate_type: row.payload.certificate_type || row.payload.award_type,
      certificate_id: row.payload.certificate_id,
      qr_code_url: row.payload.qr_code_url,
    }));

    return NextResponse.json({ rows });
  } catch (error: any) {
    await sendDiscordNotification(
      `incoming_certificates export exception: ${error.message || String(error)}`
    );
    return NextResponse.json(
      { error: error.message || "Failed to export incoming certificates" },
      { status: 500 }
    );
  }
}
