"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastProvider";
import { Database } from "@/types/database";
import { getTodayDate } from "@/lib/utils/date-format";

type Event = Database["public"]["Tables"]["events"]["Row"];

export default function ManualCertificateForm({
  events,
}: {
  events: Event[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    event_id: "",
    certificate_type: "",
    participant_name: "",
    school: "",
    date_issued: "",
    country: "",
    committee: "",
    segment: "",
    team_name: "",
    email: "",
  });

  // Set default date on client side only
  useEffect(() => {
    if (!formData.date_issued) {
      setFormData(prev => ({
        ...prev,
        date_issued: getTodayDate(),
      }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Failed to create certificate");
      }

      toast.showToast("Certificate created successfully!", "success");
      
      // Reset form
      setFormData({
        event_id: "",
        certificate_type: "",
        participant_name: "",
        school: "",
        date_issued: new Date().toISOString().split("T")[0],
        country: "",
        committee: "",
        segment: "",
        team_name: "",
        email: "",
      });

      router.refresh();
    } catch (err: any) {
      toast.showToast(err.message || "Failed to create certificate", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.4em] text-blue-300">
          Manual Entry
        </p>
        <h2 className="text-2xl font-semibold text-white">Create Certificate</h2>
        <p className="text-sm text-slate-300">
          Manually create a single certificate.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
              Event *
            </label>
            <select
              value={formData.event_id}
              onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
              className="input"
              required
            >
              <option value="">Select an event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.event_name} ({event.event_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
              Certificate Type *
            </label>
            <input
              type="text"
              value={formData.certificate_type}
              onChange={(e) =>
                setFormData({ ...formData, certificate_type: e.target.value })
              }
              placeholder="e.g., MUN Participant, Special Mention 1"
              className="input"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
              Participant Name *
            </label>
            <input
              type="text"
              value={formData.participant_name}
              onChange={(e) =>
                setFormData({ ...formData, participant_name: e.target.value })
              }
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
              School *
            </label>
            <input
              type="text"
              value={formData.school}
              onChange={(e) =>
                setFormData({ ...formData, school: e.target.value })
              }
              className="input"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
            Date Issued *
          </label>
          <input
            type="date"
            value={formData.date_issued}
            onChange={(e) =>
              setFormData({ ...formData, date_issued: e.target.value })
            }
            className="input"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
              Committee
            </label>
            <input
              type="text"
              value={formData.committee}
              onChange={(e) =>
                setFormData({ ...formData, committee: e.target.value })
              }
              className="input"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
              Segment
            </label>
            <input
              type="text"
              value={formData.segment}
              onChange={(e) =>
                setFormData({ ...formData, segment: e.target.value })
              }
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
              Team Name
            </label>
            <input
              type="text"
              value={formData.team_name}
              onChange={(e) =>
                setFormData({ ...formData, team_name: e.target.value })
              }
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="input"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Certificate"}
        </button>
      </form>
    </div>
  );
}

