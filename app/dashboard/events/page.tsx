import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/auth";
import { Database } from "@/types/database";
import EventManager from "@/components/dashboard/EventManager";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export default async function EventsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: eventsData } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  const events: EventRow[] = eventsData ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Events</h1>
        <p className="text-slate-400 mt-2">
          Create and manage event sessions for certificate generation.
        </p>
      </div>
      <EventManager events={events} />
    </div>
  );
}

