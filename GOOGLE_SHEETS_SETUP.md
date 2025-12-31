# Google Sheets Integration Setup

This guide will help you set up automatic lead storage in Google Sheets with duplicate detection.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "structcrew-leads") and click "Create"
4. Wait for the project to be created, then select it

## Step 2: Enable Google Sheets API

1. In the left sidebar, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"
4. Wait for the API to be enabled

## Step 3: Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in:
   - Service account name: `structcrew-automation`
   - Service account description: `Automated lead generation`
   - Click "Create and Continue"
   - Skip roles for now, click "Done"

## Step 4: Create JSON Credentials

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" → "Create New Key"
4. Select "JSON" and click "Create"
5. **Important:** Download the JSON file immediately
6. Rename it to `google-credentials.json`
7. **Keep this file secure! Never commit it to git**

## Step 5: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click "Blank" to create a new spreadsheet
3. Name it (e.g., "StructCrew Leads")
4. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```
5. The `SHEET_ID` is the long alphanumeric string

## Step 6: Share Sheet with Service Account

1. In your Google Sheet, click "Share"
2. Paste the `client_email` from your `google-credentials.json` file
3. Give it "Editor" permission
4. Click "Send"

The email will look like:
```
structcrew-automation@your-project-id.iam.gserviceaccount.com
```

## Step 7: Make Sheet Public (Optional but Recommended)

To share the sheet with others while keeping duplicate detection:

1. Click "Share" → "Get shareable link"
2. Change permission to "Anyone with the link can view"
3. The script will still use the service account to write data
4. Duplicates are checked before adding, preventing duplicates across runs

## Usage

### Scan and Save to Google Sheets

```bash
ig-bulk scan archi_jobs --posts 5000 --sheet YOUR_SHEET_ID --creds ./google-credentials.json --csv
```

### Export Existing OCR Results to Google Sheets

```bash
ig-bulk sheets-export --input test_results.json --sheet YOUR_SHEET_ID --creds ./google-credentials.json
```

### View Google Sheets Statistics

```bash
ig-bulk sheets-stats --sheet YOUR_SHEET_ID --creds ./google-credentials.json
```

## Data Stored in Google Sheets

| Column | Description | Example |
|--------|-------------|---------|
| Company Name | Extracted from email domain | `Studio Constantine` |
| Email | Email address | `info@example.com` |
| Phone | Phone number | `+919876543210` |
| State | State/Region | (Populated when available) |
| Instagram Handle | Source Instagram profile | `@archi_jobs` |
| Source | Data source | `Instagram OCR` |
| Date Added | When lead was added | `2025-12-25` |
| Status | Lead status | `New` |

## Duplicate Detection

The system automatically checks for duplicates based on:
- **Email address** (case-insensitive)
- **Phone number** (digits only, ignoring formatting)

If a duplicate is found, the lead is skipped and logged.

## Sheet Structure

The sheet will be automatically created with the following columns:
- Company Name
- Email
- Phone
- State
- Instagram Handle
- Source
- Date Added
- Status

## Troubleshooting

### "Failed to connect to Google Sheets"

- Verify `google-credentials.json` exists and is valid JSON
- Check that the Sheet ID is correct
- Ensure the service account email has Editor access to the sheet

### "Duplicate entry found"

This is expected behavior! The system is preventing duplicate leads.

### "Error: No such file or directory"

- Make sure the path to `google-credentials.json` is correct
- If running from a different directory, use an absolute path

### API Quota Exceeded

Google Sheets API has a free tier quota (100 reads + 100 writes/day for new projects).

For higher limits:
1. Go to Google Cloud Console → APIs & Services → Quotas
2. Request higher quota or enable billing
3. Or use multiple sheets to distribute load

## Security Notes

⚠️ **IMPORTANT SECURITY REMINDERS:**

1. Never commit `google-credentials.json` to version control
2. The `.gitignore` file is already configured to ignore it
3. Keep credentials file in a secure location
4. Rotate credentials if they're ever exposed
5. Use service accounts (not personal accounts) for automation
6. Restrict service account permissions to only necessary access

## Example Workflow

```bash
# 1. Scan profile and save to Google Sheets
ig-bulk scan archi_jobs --posts 1000 --sheet 1ABC...XYZ --creds ./google-credentials.json

# 2. Check what was added
ig-bulk sheets-stats --sheet 1ABC...XYZ --creds ./google-credentials.json

# 3. Scan another profile
ig-bulk scan another_profile --posts 500 --sheet 1ABC...XYZ --creds ./google-credentials.json

# 4. View updated stats (duplicates will be excluded)
ig-bulk sheets-stats --sheet 1ABC...XYZ --creds ./google-credentials.json
```

## Advanced: Adding State/Country Data

To add location data, you can:

1. **Option A:** Enable Instagram metadata download
   - Modify instaloader command to include `--comments` and `--geotags`
   - Extract location from post data

2. **Option B:** Use email domain inference
   - Parse emails for country codes (.in = India, .uk = UK, etc.)
   - Map to states based on known company locations

3. **Option C:** Manual enrichment
   - Export to CSV
   - Manually add state/country data
   - Re-import to Google Sheets

## Next Steps

After setting up Google Sheets integration:
1. Run a small test scan first (10-50 posts)
2. Verify data is appearing correctly
3. Check duplicate detection works
4. Scale up to larger profile scans
5. Set up regular scheduled scans using cron jobs