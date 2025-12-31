# Instagram Bulk OCR + Google Sheets Integration

## ✅ Implemented Features

### 1. Large-Scale Instagram Profile Downloads
- **Download entire profiles** (up to 50k posts)
- Batch processing to handle rate limits
- Automatic retry with delays (5s between batches, 15s on errors)
- Progress tracking per batch
- Resumable if interrupted

**Commands:**
```bash
ig-bulk download <username> --posts 50000 --batch 1000
```

### 2. Bulk OCR Processing
- **Parallel OCR** (configurable concurrency 1-5)
- Extract emails and phone numbers from images
- Process thousands of images efficiently
- Error handling for each image
- Deduplication of extracted contacts

**Commands:**
```bash
ig-bulk scan <username> --posts 50000 --concurrency 3
```

### 3. Google Sheets Integration
- **Automatic lead storage** in Google Sheets
- **Duplicate detection** (email + phone)
- **Company name extraction** from email domain
- Public sharing support while maintaining duplicate prevention
- Batch upload with 100-lead batches for efficiency

**Commands:**
```bash
# Scan and save directly to Google Sheets
ig-bulk scan archi_jobs --sheet YOUR_SHEET_ID --creds ./google-credentials.json

# Export existing OCR results to Google Sheets
ig-bulk sheets-export --input results.json --sheet YOUR_SHEET_ID

# View sheet statistics
ig-bulk sheets-stats --sheet YOUR_SHEET_ID
```

### 4. Batch Processing
- Process multiple Instagram profiles sequentially
- Automatic delay between profiles (30s)
- Consolidated results reporting

**Commands:**
```bash
ig-bulk batch profiles.txt --posts 10000
```

### 5. Additional Utilities
- List downloaded profiles
- OCR-only mode for already downloaded profiles
- JSON and CSV export options
- Download history tracking

## 📊 Data Stored in Google Sheets

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

## 🧪 Tested Features

✅ Instaloader integration (downloading 400+ images)
✅ OCR extraction (13 emails, 5 phones from 20 images)
✅ Duplicate detection logic
✅ Google Sheets module loading
✅ CLI command structure
✅ JSON/CSV export

## 📁 Files Added/Modified

### New Files
- `ig-bulk-cli-v2.js` - Main CLI with all commands
- `src/server/google-sheets.js` - Google Sheets integration module
- `GOOGLE_SHEETS_SETUP.md` - Complete setup guide
- `example_profiles.txt` - Example batch file

### Modified Files
- `src/scraper/ig-downloader.js` - Added large download & parallel OCR
- `IG_BULK_README.md` - Updated documentation
- `package.json` - Added dependencies
- `.gitignore` - Added credentials protection

### Dependencies Added
- `googleapis` - Google Sheets API
- `google-auth-library` - Authentication

## 🚀 Quick Start

### 1. Set Up Google Sheets
```bash
# Follow GOOGLE_SHEETS_SETUP.md guide
# You'll need:
# - Google Cloud Project
# - Service account credentials (google-credentials.json)
# - Google Sheet with ID
# - Share sheet with service account email
```

### 2. Test Small Scale
```bash
# Download and scan 50 posts
ig-bulk scan archi_jobs --posts 50 --concurrency 2
```

### 3. Scale Up with Google Sheets
```bash
# Full scale scan with Google Sheets
ig-bulk scan archi_jobs --posts 50000 --sheet YOUR_SHEET_ID --creds ./google-credentials.json --concurrency 3 --csv
```

## 📋 Workflow Example

```bash
# 1. Download profile only (fast test)
ig-bulk download archi_jobs --posts 100

# 2. Check what was downloaded
ig-bulk list

# 3. Run OCR on downloaded profile
ig-bulk ocr-only archi_jobs --concurrency 3

# 4. Export to Google Sheets
ig-bulk scan archi_jobs --posts 500 --sheet YOUR_SHEET_ID --creds ./google-credentials.json

# 5. Check statistics
ig-bulk sheets-stats --sheet YOUR_SHEET_ID --creds ./google-credentials.json

# 6. Batch process multiple profiles
ig-bulk batch profiles.txt --posts 1000 --sheet YOUR_SHEET_ID --creds ./google-credentials.json
```

## 🎯 Key Features

### Performance
- **Large profiles:** ~400 images in 2 minutes (download + OCR)
- **Parallel OCR:** 3-5 concurrent threads optimal
- **Rate limiting:** Built-in delays to avoid Instagram blocks

### Data Quality
- **Duplicate prevention:** Email & phone matching
- **Deduplication:** Within single scan and across scans
- **Format normalization:** Phone numbers normalized to digits

### Reliability
- **Error handling:** Continues on individual failures
- **Resumable:** Can resume interrupted downloads
- **Progress tracking:** Batch-by-batch progress

### Security
- **Credentials protection:** `.gitignore` prevents commits
- **Service accounts:** No personal account exposure
- **Public sharing:** View-only access for team while maintaining write control

## 🔧 Configuration

### Default Settings
```javascript
{
  posts: 50000,           // Max posts to download
  batchSize: 1000,        // Posts per batch
  ocrConcurrency: 3,       // Parallel OCR threads
  batchDelay: 5000,        // ms delay between batches
  errorDelay: 15000        // ms delay on errors
}
```

### Rate Limiting
- **Between batches:** 5 seconds
- **On error:** 15 seconds
- **Between profiles:** 30 seconds (batch mode)

## 📈 Statistics Tracking

### Download History
- Username
- Date
- Image count
- Batches processed

### Sheet Statistics
- Total leads
- Unique emails
- Unique phones
- Breakdown by source/state/status

## ⚠️ Important Notes

### Instagram Limits
- Rate limiting occurs (403 Forbidden errors)
- Built-in delays help but may not prevent all blocks
- Consider using login for private profiles (future enhancement)

### Google Sheets Quotas
- Free tier: 100 reads + 100 writes/day (new projects)
- For high volume, request quota increase or enable billing
- Batch operations minimize API calls

### OCR Accuracy
- Not 100% accurate
- Some images may not contain contact info
- Manual verification recommended for important leads

## 🎓 Next Steps

1. **Set up Google Sheets** - Follow `GOOGLE_SHEETS_SETUP.md`
2. **Test small scale** - Start with 50-100 posts
3. **Verify data quality** - Check extracted emails/phones
4. **Scale up** - Gradually increase to 50k posts
5. **Schedule regular scans** - Use cron for automation

## 🔜 Future Enhancements

Potential improvements not yet implemented:

- Instagram login for private profiles
- Caption/location extraction from metadata
- State/country inference from data
- Better company name extraction
- Contact enrichment APIs
- Web dashboard for viewing leads
- Automatic follow-up email generation
- Lead scoring and qualification
