# MUN Google Sheets + Apps Script Integration

This document defines how to structure Google Sheets and Apps Script for MUN certificates, using the existing `incoming_certificates` API.

## Overview

The Google Sheets workbook acts as a UI for data entry. The website (admin dashboard) is the source of truth and final router for events.

Flow:

1. **Input**
   - You maintain a Google Sheet with 4 tabs (sheets), one per MUN section.
   - Apps Script reads unsent rows and calls `POST /api/incoming-certificates` to stage them.
2. **Review / Routing**
   - A super admin uses the website inbox (backed by `incoming_certificates`) to approve or reject.
   - The admin can choose which `event` each row belongs to before approving.
3. **Output**
   - Apps Script calls `GET /api/incoming-certificates/export` to fetch accepted rows.
   - It writes back `certificate_id` and other fields into the Sheet.

This design works with your existing routes:

- `POST /api/incoming-certificates`
- `POST /api/incoming-certificates/[id]/approve`
- `POST /api/incoming-certificates/[id]/reject`
- `GET /api/incoming-certificates/export`

## Sheet structure: 4 tabs for MUN

Create one Google Sheet document with **4 sheets**:

1. `Participation`
2. `CampusAmbassador`
3. `Awards`
4. `Secretariat`

Each sheet has similar columns; the main difference is which `section` value is sent.

### Common columns per sheet

Recommended columns (order can vary, but these names are used by Apps Script):

- `sheet_row_id` (hidden or helper column)
  - Unique per row within a sheet.
  - Used to match data back on export.
- `participant_name`
- `school`
- `certificate_type`
  - Recommended values:
    - Participation: `MUN Participant`
    - CampusAmbassador: `Campus Ambassador`
    - Awards: e.g. `Best Delegate`, `High Commendation`, `Special Mention 1`, etc.
    - Secretariat: `Secretariat Board Member`.
- `date_issued` (YYYY-MM-DD, e.g. `2025-03-15`)
- `committee` (optional, MUN only)
- `country` (optional, MUN only)
- `segment` (optional, BizCom-related, can be ignored for pure MUN)
- `team_name` (optional)
- `team_members` (optional, comma-separated list)
- `Sent?` (boolean / text)
  - Marked by Apps Script once a row is pushed to the backend.
- `Approved?` (boolean / text)
  - Marked by Apps Script once a row has a final certificate.
- `certificate_id`
- `qr_code_url`

You can add more columns as needed; Apps Script will bundle them into a JSON `payload` row.

### Section mapping

For each sheet, Apps Script sends a fixed `section` string:

- `Participation` sheet → `section = "participation"`
- `CampusAmbassador` sheet → `section = "campus_ambassador"`
- `Awards` sheet → `section = "award"`
- `Secretariat` sheet → `section = "secretariat"`

These values are stored in `incoming_certificates.section` and can be used by the backend to pick defaults.

## Backend contract: input (POST)

Apps Script calls:

- `POST /api/incoming-certificates`
- Headers:
  - `Authorization: Bearer ${SHEETS_WEBHOOK_SECRET}`
  - `Content-Type: application/json`

Body format:

```json
{
  "event_code": "igacmun-session-3-2025",
  "section": "participation",
  "rows": [
    {
      "sheet_row_id": "participation-2",
      "participant_name": "Alice Johnson",
      "school": "ABC High School",
      "certificate_type": "MUN Participant",
      "date_issued": "2025-03-15",
      "committee": "UNSC",
      "country": "United States"
    }
  ]
}
```

Notes:

- `event_code`
  - Must match an existing `events.event_code` in Supabase.
  - The admin can later change the event via the website (by editing `incoming_certificates.event_id`).
- `section`
  - One of `"participation" | "campus_ambassador" | "award" | "secretariat"`.
- `rows`
  - Each row is a JSON object built from the sheet’s columns.
  - `sheet_row_id` should be stable per row (e.g. `${section}-${rowIndex}`).

What the backend does (current implementation):

1. Resolves `event_code` → `event_id`.
2. For each `row`:
   - Inserts into `incoming_certificates`:
     - `event_id`
     - `section`
     - `payload` = the entire row JSON
     - `status = "pending"`

## Backend contract: approval (POST [id]/approve)

When a super admin approves from the website, the backend:

1. Loads the `incoming_certificates` row and its `events` record.
2. Derives certificate fields from `payload`:
   - `participant_name` = `payload.participant_name` or `payload.name`.
   - `school` = `payload.school` or `"N/A"`.
   - `certificate_type` = `payload.certificate_type` or `payload.award_type` or default.
   - `date_issued` = `payload.date_issued` or today.
3. Generates a short `certificate_id` and QR code.
4. Inserts into `certificates` and marks the `incoming_certificates` row as `status = "accepted"`.

Admin workflow:

- Open the incoming certificates inbox page (admin dashboard).
- Optionally edit the event for each row.
- Approve or reject rows.

## Backend contract: output (GET export)

Apps Script calls:

- `GET /api/incoming-certificates/export?event_code={event_code}&section={section}`
- Headers:
  - `Authorization: Bearer ${SHEETS_WEBHOOK_SECRET}`

Example:

- `GET /api/incoming-certificates/export?event_code=igacmun-session-3-2025&section=participation`

Response shape (current code):

```json
{
  "rows": [
    {
      "sheet_row_id": "participation-2",
      "participant_name": "Alice Johnson",
      "certificate_type": "MUN Participant",
      "certificate_id": "k9x4za",
      "qr_code_url": "https://.../k9x4za.png"
    }
  ]
}
```

Recommended Apps Script behavior:

1. For each row in the response:
   - Find the corresponding line in the sheet by `sheet_row_id`.
   - Write:
     - `certificate_id` into the `certificate_id` column.
     - `qr_code_url` into `qr_code_url`.
     - Optionally re-write `certificate_type` into `certificate_type` or a `Final Type` column.
     - Set `Approved? = TRUE`.

## Apps Script responsibilities (high level)

### Pushing data (input)

Per sheet (Participation, CampusAmbassador, Awards, Secretariat):

1. Loop through all data rows.
2. Skip rows where `Sent?` is already marked.
3. Ensure each row has a `sheet_row_id` (set if empty):
   - For example: `"participation-" + rowIndex`.
4. Build a `rows` array of JSON objects using the column names above.
5. Call `POST /api/incoming-certificates` with the appropriate `section` and `event_code`.
6. If the call succeeds, mark those rows `Sent? = TRUE`.

### Syncing results (output)

Per sheet:

1. Call `GET /api/incoming-certificates/export` with `event_code` and corresponding `section`.
2. For each `rows[i]` in the response:
   - Find the row with `sheet_row_id`.
   - Write back `certificate_id`, `qr_code_url`, and `Approved? = TRUE`.

## Extending for BizCom or other events

Although this document focuses on MUN, the structure is flexible enough to handle other event types (BizCom, etc.):

- Reuse the same 4-sheet pattern, or add additional sheets.
- Add extra columns (e.g. `segment`, `team_name`, `team_members`).
- Ensure Apps Script includes those columns in the JSON `rows` payload.
- The backend will keep them in `payload`; you can later map them into `certificate_metadata` if needed.

This file is intended as the main reference for how the MUN Sheets + Apps Script integration should work against the existing backend.
