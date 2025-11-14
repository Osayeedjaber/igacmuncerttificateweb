"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { useToast } from "./ToastProvider";

export default function BulkImportUploader() {
  const router = useRouter();
  const toast = useToast();
  const [fileName, setFileName] = useState<string | null>(null);
  const [jsonPayload, setJsonPayload] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [errors, setErrors] = useState<Array<{index: number, participant_name: string, error: string}>>([]);
  const [success, setSuccess] = useState<Array<{index: number, participant_name: string, certificate_id: string}>>([]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setStatus(null);
    setErrors([]);
    setSuccess([]);

    const text = await file.text();
    setJsonPayload(text);
  };

  const handleUpload = async () => {
    if (!jsonPayload.trim()) {
      setStatus("Please paste JSON or select a file first.");
      return;
    }
    setIsUploading(true);
    setStatus(null);
    setErrors([]);
    setSuccess([]);

    try {
      const parsed = JSON.parse(jsonPayload);
      const response = await fetch("/api/certificates/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(parsed),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Import failed");
      }

      const message = `Imported ${body.success_count} certificates${body.error_count > 0 ? ` with ${body.error_count} errors` : ""}.`;
      setStatus(message);
      
      // Display errors and successes
      if (body.results) {
        setErrors(body.results.errors || []);
        setSuccess(body.results.success || []);
      }
      
      // Show toast notification
      if (body.error_count === 0) {
        toast.showToast(message, "success");
      } else {
        toast.showToast(message, "info");
      }
      
      router.refresh();
    } catch (error: any) {
      setStatus(error.message || "Unable to import JSON file");
    } finally {
      setIsUploading(false);
    }
  };

  const aiPrompt = `Convert my certificate data into JSON for bulk import. Use this structure:

{
  "event_code": "igacmun-session-3-2025",
  "certificates": [
    {
      "certificate_type": "string",
      "participant_name": "string",
      "school": "string (REQUIRED for all)",
      "date_issued": "YYYY-MM-DD (REQUIRED for all)",
      // Additional fields based on type
    }
  ]
}

CERTIFICATE TYPES & REQUIREMENTS:

1. MUN Certificates (types: "MUN Participant", "Campus Ambassador", "Secretariat Board Member"):
   REQUIRED: certificate_type, participant_name, school, country (single string), committee, date_issued

2. Special Mention (types: "Special Mention 1", "Special Mention 2", "Special Mention 3", "Special Mention 5"):
   REQUIRED: certificate_type (MUST include number), participant_name, school, date_issued
   OPTIONAL: country, committee, email
   NOTE: "Special Mention" without number is INVALID - use numbered version

3. BizCom (types: "BizCom Participant", "BizCom Winner"):
   REQUIRED: certificate_type, participant_name, school, segment, team_name, date_issued
   OPTIONAL: team_members (array)

RULES:
- ALL certificates need: certificate_type, participant_name, school, date_issued
- MUN needs: country (single string, not array), committee
- If multiple countries exist, use first as "country", store rest in custom_fields.countries
- Dates must be YYYY-MM-DD format
- Extra fields go in custom_fields object
- If "Special Mention" has no number, ask me or default to "Special Mention 1"

Format my data now:

[Paste your data here]`;

  const copyAIPrompt = () => {
    navigator.clipboard.writeText(aiPrompt);
    toast.showToast("AI prompt copied to clipboard!", "success");
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">
            Bulk import
          </p>
          <h2 className="text-2xl font-semibold text-white">Upload JSON drop</h2>
          <p className="text-sm text-slate-300">
            Paste or upload the Apps Script JSON dump to mint IDs + QR codes.
          </p>
        </div>
        <button
          onClick={() => setShowTutorial(!showTutorial)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
        >
          {showTutorial ? "Hide" : "How to"} Tutorial
        </button>
      </div>
      
      {showTutorial && (
        <div className="mb-6 space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">📚 How to Format Your JSON</h3>
          </div>
          
          <div className="space-y-4 text-sm text-slate-300">
            <div>
              <h4 className="mb-2 font-semibold text-emerald-300">Basic Structure</h4>
              <pre className="rounded-lg border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-200">
{`{
  "event_code": "igacmun-session-3-2025",
  "certificates": [
    {
      "certificate_type": "Campus Ambassador",
      "participant_name": "John Doe",
      "school": "ABC High School",
      "date_issued": "2025-03-15",
      "country": "United States",
      "committee": "UNSC"
    }
  ]
}`}
              </pre>
            </div>

            <div>
              <h4 className="mb-2 font-semibold text-emerald-300">Certificate Types & Required Fields</h4>
              <div className="space-y-2 rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <div>
                  <p className="font-semibold text-white">MUN Certificates:</p>
                  <p className="text-xs">Types: "MUN Participant", "Campus Ambassador", "Secretariat Board Member"</p>
                  <p className="text-xs text-slate-400">Required: certificate_type, participant_name, school, country, committee, date_issued</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Special Mention:</p>
                  <p className="text-xs">Types: "Special Mention 1", "Special Mention 2", "Special Mention 3", "Special Mention 5"</p>
                  <p className="text-xs text-slate-400">Required: certificate_type, participant_name, school, date_issued</p>
                  <p className="text-xs text-amber-400">⚠️ Must include number! "Special Mention" alone is invalid.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">BizCom:</p>
                  <p className="text-xs">Types: "BizCom Participant", "BizCom Winner"</p>
                  <p className="text-xs text-slate-400">Required: certificate_type, participant_name, school, segment, team_name, date_issued</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold text-emerald-300">💡 Use AI to Format Your Data</h4>
              <p className="mb-2 text-xs text-slate-400">
                Don't want to format manually? Copy the prompt below and paste it into ChatGPT or Claude along with your raw data (spreadsheet, list, etc.), and the AI will format it correctly!
              </p>
              <button
                onClick={copyAIPrompt}
                className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
              >
                📋 Copy AI Prompt to Clipboard
              </button>
            </div>

            <div>
              <h4 className="mb-2 font-semibold text-emerald-300">Important Rules</h4>
              <ul className="list-inside list-disc space-y-1 text-xs text-slate-400">
                <li>ALL certificates need: certificate_type, participant_name, school, date_issued</li>
                <li>MUN certificates need: country (single string, not array), committee</li>
                <li>Dates must be in YYYY-MM-DD format (e.g., "2025-03-15")</li>
                <li>If you have multiple countries, use the first as "country" and store the rest in custom_fields.countries</li>
                <li>Extra fields (like email) go in custom_fields object</li>
              </ul>
            </div>

            <div className="rounded-lg border border-blue-500/20 bg-blue-950/20 p-3">
              <p className="text-xs font-semibold text-blue-300">💡 Pro Tip:</p>
              <p className="text-xs text-slate-300">
                Check <code className="text-blue-300">examples/bulk-import-example.json</code> for complete examples of all certificate types.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Upload file
          </span>
          <input
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            className="mt-2 w-full text-sm text-slate-200 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/20"
          />
        </label>
        {fileName && (
          <p className="text-xs text-slate-400">Loaded: {fileName}</p>
        )}
        <label className="block">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            JSON payload
          </span>
          <textarea
            value={jsonPayload}
            onChange={(event) => setJsonPayload(event.target.value)}
            rows={10}
            placeholder='{"event_code":"igacmun-session-3-2025","certificates":[...]}'
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 font-mono text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </label>
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:bg-white/5"
        >
          {isUploading ? "Importing..." : "Start bulk import"}
        </button>
        {status && (
          <div className="space-y-3">
            <p className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-xs text-slate-100">
              {status}
            </p>
            
            {errors.length > 0 && (
              <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-4">
                <p className="mb-2 text-sm font-semibold text-red-300">
                  ❌ Errors ({errors.length})
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {errors.map((err, idx) => (
                    <div key={idx} className="rounded-lg border border-red-500/10 bg-red-950/10 p-3 text-xs">
                      <p className="font-semibold text-red-200">
                        #{err.index + 1}: {err.participant_name || 'Unknown'}
                      </p>
                      <p className="mt-1 text-red-300/80">{err.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {success.length > 0 && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                <p className="mb-2 text-sm font-semibold text-emerald-300">
                  ✅ Successfully Imported ({success.length})
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto text-xs text-emerald-200/80">
                  {success.map((suc, idx) => (
                    <div key={idx} className="rounded-lg border border-emerald-500/10 bg-emerald-950/10 p-2">
                      <p className="font-semibold">#{suc.index + 1}: {suc.participant_name}</p>
                      <p className="text-xs text-emerald-300/60">ID: {suc.certificate_id}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="rounded-2xl border border-dashed border-white/10 p-4 text-xs text-slate-400">
          <p className="font-semibold text-white">📄 Template Reference</p>
          <p>
            Use the included{" "}
            <code className="text-emerald-300">
              examples/bulk-import-example.json
            </code>{" "}
            for complete examples of all certificate types.
          </p>
        </div>
      </div>
    </section>
  );
}

