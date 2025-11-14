"use client";

import { Database } from "@/types/database";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastProvider";
import { getCurrentYear, getCurrentMonth } from "@/lib/utils/date-format";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

const EVENT_TYPES = ["MUN", "BizCom", "Conference", "Summit", "Workshop"];

export default function EventManager({ events }: { events: EventRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [formState, setFormState] = useState({
    base_event_name: "", // Just the base name like "igacmun"
    event_name: "",
    year: 2025, // Will be set in useEffect
    month: 1, // Will be set in useEffect
    session: 1,
    event_type: "MUN",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set current year/month on client side only
  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      year: getCurrentYear(),
      month: getCurrentMonth(),
    }));
  }, []);

  // Auto-generate event code and name when base name, session, or year changes
  const generateEventCode = (baseName: string, session: number, year: number): string => {
    if (!baseName) return "";
    const slug = baseName.toLowerCase().replace(/\s+/g, "-");
    return `${slug}-session-${session}-${year}`;
  };

  const generateEventName = (baseName: string, session: number): string => {
    if (!baseName) return "";
    return `${baseName} Session ${session}`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Auto-generate event_code and event_name
    const event_code = generateEventCode(formState.base_event_name, formState.session, formState.year);
    const event_name = formState.event_name || generateEventName(formState.base_event_name, formState.session);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formState,
          event_code,
          event_name,
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Failed to create event");
      }

      toast.showToast("Event created successfully!", "success");
      setFormState((prev) => ({
        ...prev,
        base_event_name: "",
        event_name: "",
      }));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">
          Events
        </p>
        <h2 className="text-2xl font-semibold text-white">Create Event Session</h2>
        <p className="text-sm text-slate-300">
          Generate the session container before adding certificates.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Base Event Name">
          <input
            required
            value={formState.base_event_name}
            onChange={(e) => {
              const baseName = e.target.value;
              setFormState((prev) => ({
                ...prev,
                base_event_name: baseName,
                event_name: prev.event_name || generateEventName(baseName, prev.session),
              }));
            }}
            className="input"
            placeholder="igacmun"
          />
          <p className="mt-1 text-xs text-slate-400">
            Just the base name (e.g., "igacmun"). The system will generate the full event code automatically.
          </p>
        </Field>
        <Field label="Event Name (Optional - Auto-generated if empty)">
          <input
            value={formState.event_name}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, event_name: e.target.value }))
            }
            className="input"
            placeholder={generateEventName(formState.base_event_name, formState.session) || "IGACMUN Session 3"}
          />
          <p className="mt-1 text-xs text-slate-400">
            Will auto-generate as "{generateEventName(formState.base_event_name, formState.session) || "Base Name Session X"}" if left empty.
          </p>
        </Field>
        <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-3">
          <p className="text-xs font-semibold text-blue-300">Auto-generated Event Code:</p>
          <p className="text-sm font-mono text-blue-200">
            {generateEventCode(formState.base_event_name, formState.session, formState.year) || "Enter base event name to see preview"}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Year">
            <input
              type="number"
              min={2020}
              max={2100}
              required
              value={formState.year}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  year: Number(e.target.value),
                }))
              }
              className="input"
            />
          </Field>
          <Field label="Month">
            <input
              type="number"
              min={1}
              max={12}
              required
              value={formState.month}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  month: Number(e.target.value),
                }))
              }
              className="input"
            />
          </Field>
          <Field label="Session #">
            <input
              type="number"
              min={1}
              required
              value={formState.session}
              onChange={(e) => {
                const session = Number(e.target.value);
                setFormState((prev) => ({
                  ...prev,
                  session,
                  event_name: prev.event_name || generateEventName(prev.base_event_name, session),
                }));
              }}
              className="input"
            />
          </Field>
        </div>
        <Field label="Event type">
          <select
            value={formState.event_type}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, event_type: e.target.value }))
            }
            className="input"
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        {error && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-600/50"
        >
          {loading ? "Publishing..." : "Create event"}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">
          Recently created sessions
        </h3>
        <ul className="space-y-2">
          {events.slice(0, 5).map((event) => (
            <li
              key={event.id}
              className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-100"
            >
              <div className="font-medium text-white">{event.event_name}</div>
              <div className="text-xs text-slate-300">{event.event_code}</div>
            </li>
          ))}
          {events.length === 0 && (
            <li className="text-sm text-slate-400">
              No events yet. Create your first session to begin tracking
              certificates.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1 text-sm text-slate-200">
      <span className="block text-xs uppercase tracking-[0.2em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

