import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/utils/auth";
import { sendDiscordNotification } from "@/lib/utils/discord";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireSuperAdmin();
    const adminSupabase = createAdminClient();
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Rejected by admin";

    const { data, error } = await (adminSupabase as any)
      .from("incoming_certificates")
      .update({
        status: "rejected",
        rejection_reason: reason,
        processed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      await sendDiscordNotification(
        `incoming_certificates reject failed for ${id}: ${error.message}`
      );
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await sendDiscordNotification(
      `Incoming certificate rejected by ${user.email || user.id}: ${id} (${reason})`
    );

    return NextResponse.json({ item: data });
  } catch (error: any) {
    await sendDiscordNotification(
      `incoming_certificates reject exception: ${error.message || String(error)}`
    );
    return NextResponse.json(
      { error: error.message || "Failed to reject incoming certificate" },
      { status: 500 }
    );
  }
}
