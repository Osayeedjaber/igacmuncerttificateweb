# Certificate Bulk Import Schema

## Required JSON Structure

```json
{
  "event_code": "string (required)",
  "certificates": [
    {
      "certificate_type": "string (required)",
      "participant_name": "string (required, min 1 character)",
      "school": "string (required, min 1 character)",
      "date_issued": "string (required, format: YYYY-MM-DD)",
      // Additional fields based on certificate_type
    }
  ]
}
```

## Certificate Types and Required Fields

### MUN Certificates
**Types:**
- `"MUN Participant"`
- `"Campus Ambassador"`
- `"Secretariat Board Member"`

**Required Fields:**
- `certificate_type` (one of the types above)
- `participant_name` (string)
- `school` (string)
- `country` (string) - **single country only**
- `committee` (string)
- `date_issued` (YYYY-MM-DD format)

**Example:**
```json
{
  "certificate_type": "Campus Ambassador",
  "participant_name": "Darius Zarzis",
  "school": "ABC High School",
  "country": "U.S.A",
  "committee": "Disarmament and International Security Committee (DISEC)",
  "date_issued": "2025-03-15"
}
```

### Special Mention Certificates
**Types:**
- `"Special Mention 1"`
- `"Special Mention 2"`
- `"Special Mention 3"`
- `"Special Mention 5"`

**Note:** `"Special Mention"` (without number) is **NOT** valid. You must use one of the numbered types.

**Required Fields:**
- `certificate_type` (one of the types above)
- `participant_name` (string)
- `school` (string)
- `date_issued` (YYYY-MM-DD format)

**Optional Fields (will be stored in metadata):**
- `country` (string)
- `committee` (string)
- `countries` (array) - will be stored as metadata
- `email` (string) - will be stored as metadata

**Example:**
```json
{
  "certificate_type": "Special Mention 1",
  "participant_name": "Abdullah bin Mamun",
  "school": "XYZ Academy",
  "date_issued": "2025-03-15",
  "country": "America",
  "committee": "World Health Organization (WHO)"
}
```

### BizCom Certificates
**Types:**
- `"BizCom Participant"`
- `"BizCom Winner"`

**Required Fields:**
- `certificate_type` (one of the types above)
- `participant_name` (string)
- `school` (string)
- `segment` (string)
- `team_name` (string)
- `date_issued` (YYYY-MM-DD format)

**Optional Fields:**
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
  "team_members": ["Alice Johnson", "Bob Wilson", "Charlie Brown"]
}
```

## Common Issues and Fixes

### Issue 1: "Special Mention" without number
**Error:** Certificate type "Special Mention" is not valid
**Fix:** Use `"Special Mention 1"`, `"Special Mention 2"`, `"Special Mention 3"`, or `"Special Mention 5"`

### Issue 2: Missing "school" field
**Error:** School is required
**Fix:** Add `"school": "School Name"` to every certificate

### Issue 3: "countries" array instead of "country"
**Error:** Country is required (for MUN certificates)
**Fix:** 
- For MUN certificates, use `"country": "Country Name"` (single string)
- If you have multiple countries, use the first one as `country` and store the rest in `custom_fields`:
```json
{
  "certificate_type": "Campus Ambassador",
  "participant_name": "John Doe",
  "school": "ABC School",
  "country": "America",
  "committee": "UNSC",
  "date_issued": "2025-03-15",
  "custom_fields": {
    "countries": ["America", "England", "Canada"]
  }
}
```

### Issue 4: Additional fields (email, etc.)
**Solution:** Store in `custom_fields`:
```json
{
  "certificate_type": "Special Mention 1",
  "participant_name": "John Doe",
  "school": "ABC School",
  "date_issued": "2025-03-15",
  "custom_fields": {
    "email": "john@example.com",
    "countries": ["USA", "UK"]
  }
}
```

## Complete Example

```json
{
  "event_code": "igacmun-session-3-2025",
  "certificates": [
    {
      "certificate_type": "Special Mention 1",
      "participant_name": "Abdullah bin Mamun",
      "school": "ABC High School",
      "date_issued": "2025-03-15",
      "country": "America",
      "committee": "World Health Organization (WHO)",
      "custom_fields": {
        "email": "abdullahbinmamun290@gmail.com",
        "countries": ["America", "England", "Canada"]
      }
    },
    {
      "certificate_type": "Campus Ambassador",
      "participant_name": "Darius Zarzis",
      "school": "XYZ Academy",
      "date_issued": "2025-03-15",
      "country": "U.S.A",
      "committee": "Disarmament and International Security Committee (DISEC)"
    }
  ]
}
```

## Field Mapping Reference

| JSON Field | Database Field | Notes |
|------------|----------------|-------|
| `certificate_type` | `certificates.certificate_type` | Must match exact type names |
| `participant_name` | `certificates.participant_name` | Required |
| `school` | `certificates.school` | Required |
| `date_issued` | `certificates.date_issued` | Format: YYYY-MM-DD |
| `country` | `certificate_metadata` (field_name: 'country') | Required for MUN types |
| `committee` | `certificate_metadata` (field_name: 'committee') | Required for MUN types |
| `segment` | `certificate_metadata` (field_name: 'segment') | Required for BizCom types |
| `team_name` | `certificate_metadata` (field_name: 'team_name') | Required for BizCom types |
| `team_members` | `certificate_metadata` (field_name: 'team_members') | Array stored as JSON |
| `custom_fields.*` | `certificate_metadata` | Any additional fields |

