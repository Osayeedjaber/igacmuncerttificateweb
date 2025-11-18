import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/utils/auth";
import { sendDiscordNotification } from "@/lib/utils/discord";
import { generateCertificateId, ensureUniqueCertificateId } from "@/lib/utils/certificate-id";
import { generateQRCode, uploadQRCodeToStorage } from "@/lib/utils/qr-code";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdmin();
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { id } = await params;

    // Load incoming row
    const { data: incoming, error: incomingError } = await (supabase as any)
      .from("incoming_certificates")
      .select("*, events:events(*)")
      .eq("id", id)
      .single();

    if (incomingError || !incoming) {
      return NextResponse.json({ error: "Incoming certificate not found" }, { status: 404 });
    }

    if (incoming.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending rows can be approved" },
        { status: 400 }
      );
    }

    const payload = incoming.payload as Record<string, any>;

    // Derive certificate fields from payload
    const participant_name = payload.participant_name || payload.name;
    const school = payload.school || "N/A";
    const certificate_type = payload.certificate_type || payload.award_type || "MUN Participant";
    const date_issued = payload.date_issued || new Date().toISOString().split("T")[0];

    if (!participant_name) {
      return NextResponse.json(
        { error: "participant_name is required in payload" },
        { status: 400 }
      );
    }

    // Generate short certificate ID
    const baseCertificateId = generateCertificateId(
      incoming.event_id,
      new Date().getFullYear(),
      participant_name,
      school
    );
    const certificateId = await ensureUniqueCertificateId(adminSupabase, baseCertificateId);

    // Generate QR code
    const { data: qrCodeData, imageBuffer } = await generateQRCode(certificateId);
    const qrCodeImagePath = await uploadQRCodeToStorage(certificateId, imageBuffer);

    // Insert certificate
    const { data: certificate, error: certError } = await (adminSupabase as any)
      .from("certificates")
      .insert({
        certificate_id: certificateId,
        event_id: incoming.event_id,
        certificate_type,
        participant_name,
        school,
        date_issued,
        qr_code_data: qrCodeData,
        qr_code_image_path: qrCodeImagePath,
        created_by: user.id,
      })
      .select()
      .single();

    if (certError) {
      await sendDiscordNotification(
        `incoming_certificates approve failed for ${id}: ${certError.message}`
      );
      return NextResponse.json({ error: certError.message }, { status: 500 });
    }

    // Update incoming row status
    await (adminSupabase as any)
      .from("incoming_certificates")
      .update({ status: "accepted", processed_at: new Date().toISOString() })
      .eq("id", id);

    await sendDiscordNotification(
      `Incoming certificate approved by ${user.email || user.id}: ${certificateId}`
    );

    return NextResponse.json({ certificate });
  } catch (error: any) {
    await sendDiscordNotification(
      `incoming_certificates approve exception: ${error.message || String(error)}`
    );
    return NextResponse.json(
      { error: error.message || "Failed to approve incoming certificate" },
      { status: 500 }
    );
  }
}
