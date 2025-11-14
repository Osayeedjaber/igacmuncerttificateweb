# AI Prompt for Certificate JSON Formatting

Copy and paste this prompt to ChatGPT, Claude, or any AI assistant along with your raw data:

---

## Prompt:

I need you to convert my certificate data into a JSON format for bulk importing into a certificate management system. Here are the requirements:

### JSON Structure:
```json
{
  "event_code": "string (required - e.g., 'igacmun-session-3-2025')",
  "certificates": [
    {
      "certificate_type": "string (required)",
      "participant_name": "string (required)",
      "school": "string (required)",
      "date_issued": "string (required, format: YYYY-MM-DD)",
      // Additional fields based on certificate_type
    }
  ]
}
```

### Certificate Types and Required Fields:

#### 1. MUN Certificates
**Valid types:**
- `"MUN Participant"`
- `"Campus Ambassador"`
- `"Secretariat Board Member"`

**Required fields for MUN certificates:**
- `certificate_type` (must be one of the types above)
- `participant_name` (string)
- `school` (string)
- `country` (string - single country only, not an array)
- `committee` (string)
- `date_issued` (format: YYYY-MM-DD)

**Example:**
```json
{
  "certificate_type": "Campus Ambassador",
  "participant_name": "John Doe",
  "school": "ABC High School",
  "country": "United States",
  "committee": "United Nations Security Council (UNSC)",
  "date_issued": "2025-03-15"
}
```

#### 2. Special Mention Certificates
**Valid types (MUST include the number):**
- `"Special Mention 1"`
- `"Special Mention 2"`
- `"Special Mention 3"`
- `"Special Mention 5"`

**IMPORTANT:** `"Special Mention"` without a number is INVALID. You must use one of the numbered versions.

**Required fields for Special Mention:**
- `certificate_type` (must be one of the numbered types above)
- `participant_name` (string)
- `school` (string)
- `date_issued` (format: YYYY-MM-DD)

**Optional fields (will be stored in metadata):**
- `country` (string)
- `committee` (string)
- `email` (string)
- `custom_fields` (object) - for any additional data

**Example:**
```json
{
  "certificate_type": "Special Mention 1",
  "participant_name": "Jane Smith",
  "school": "XYZ Academy",
  "date_issued": "2025-03-15",
  "country": "Canada",
  "committee": "World Health Organization (WHO)"
}
```

#### 3. BizCom Certificates
**Valid types:**
- `"BizCom Participant"`
- `"BizCom Winner"`

**Required fields for BizCom certificates:**
- `certificate_type` (must be one of the types above)
- `participant_name` (string)
- `school` (string)
- `segment` (string)
- `team_name` (string)
- `date_issued` (format: YYYY-MM-DD)

**Optional fields:**
- `team_members` (array of strings)

**Example:**
```json
{
  "certificate_type": "BizCom Participant",
  "participant_name": "Alice Johnson",
  "school": "Business School",
  "segment": "Finance",
  "team_name": "Team Alpha",
  "date_issued": "2025-03-15",
  "team_members": ["Alice Johnson", "Bob Wilson"]
}
```

### Critical Rules:

1. **ALL certificates MUST have:**
   - `certificate_type`
   - `participant_name`
   - `school` (cannot be empty or missing)
   - `date_issued` (format: YYYY-MM-DD)

2. **For MUN certificates, you MUST include:**
   - `country` (single string, not an array)
   - `committee`

3. **For Special Mention:**
   - If the type says "Special Mention" without a number, you MUST assign it to "Special Mention 1", "Special Mention 2", "Special Mention 3", or "Special Mention 5" based on context or ask me which number to use
   - Country and committee are optional but can be included

4. **For BizCom certificates, you MUST include:**
   - `segment`
   - `team_name`

5. **Handling multiple countries:**
   - If a certificate has multiple countries, use the FIRST country as the `country` field
   - Store all countries in `custom_fields.countries` as an array

6. **Additional data:**
   - Any extra fields (like email, phone, etc.) should go in `custom_fields` object
   - Example: `"custom_fields": { "email": "example@email.com", "countries": ["USA", "UK", "Canada"] }`

7. **Date format:**
   - All dates must be in `YYYY-MM-DD` format (e.g., "2025-03-15")
   - If dates are in other formats, convert them

### Your Task:

I will provide you with raw data (could be from a spreadsheet, list, or any format). Please:
1. Parse the data
2. Identify the certificate type for each entry
3. Map the fields correctly according to the rules above
4. Generate a valid JSON object with the `event_code` and `certificates` array
5. Ensure all required fields are present
6. Handle any missing data appropriately (ask me if critical fields are missing)
7. Format dates correctly
8. If you see "Special Mention" without a number, ask me which number to use or use "Special Mention 1" as default

### Example Output Format:
```json
{
  "event_code": "igacmun-session-3-2025",
  "certificates": [
    {
      "certificate_type": "Campus Ambassador",
      "participant_name": "John Doe",
      "school": "ABC High School",
      "country": "United States",
      "committee": "UNSC",
      "date_issued": "2025-03-15"
    },
    {
      "certificate_type": "Special Mention 1",
      "participant_name": "Jane Smith",
      "school": "XYZ Academy",
      "date_issued": "2025-03-15"
    }
  ]
}
```

Now, please provide your raw data and I will format it according to these rules.

---

## How to Use This Prompt:

1. Copy the entire prompt above
2. Paste it into ChatGPT, Claude, or any AI assistant
3. Add your raw data at the end (spreadsheet data, list, etc.)
4. The AI will format it into the correct JSON structure
5. Review the output and make any necessary adjustments
6. Use the generated JSON in your bulk import feature

## Example Usage:

**You:** [Paste the prompt above]

**You:** Here's my data:
```
Name: Abdullah bin Mamun
Type: Special Mention
School: ABC School
Date: March 15, 2025
Committee: WHO
Countries: America, England, Canada
Email: abdullah@email.com
```

**AI Response:** [Formatted JSON according to the schema]

---

## Tips:

- If your data is in a spreadsheet, paste it as a table or CSV
- If dates are in different formats, mention it in your data
- If certificate types are abbreviated or unclear, include a legend
- Always verify the output JSON before importing

