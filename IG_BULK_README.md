# Instagram Bulk Downloader & OCR Scanner

Download entire Instagram profiles (up to 50k posts) and extract emails/phones via OCR.

## Installation

```bash
npm install
npm link  # Makes `ig-bulk` command available globally
```

## Commands

### Download a Profile Only
```bash
ig-bulk download <username> [options]
```

**Options:**
- `-p, --posts <number>` - Total posts to download (default: 50000)
- `-b, --batch <number>` - Batch size per download (default: 1000)

**Example:**
```bash
ig-bulk download archi_jobs --posts 1000 --batch 500
```

### Download + OCR Scan
```bash
ig-bulk scan <username> [options]
```

**Options:**
- `-p, --posts <number>` - Total posts to download (default: 50000)
- `-b, --batch <number>` - Download batch size (default: 1000)
- `-c, --concurrency <number>` - OCR parallelism 1-5 (default: 3)
- `-o, --output <file>` - Output JSON filename
- `--csv` - Also export to CSV
- `-s, --sheet <id>` - Google Sheet ID for automatic lead storage
- `--creds <path>` - Path to Google credentials JSON (default: ./google-credentials.json)

**Example:**
```bash
ig-bulk scan archi_jobs --posts 5000 --concurrency 5 --csv --sheet YOUR_SHEET_ID --creds ./google-credentials.json
```

### Batch Process Multiple Profiles
```bash
ig-bulk batch <file> [options]
```

Create a text file with one username per line:
```
archi_jobs
another_profile
third_profile
```

**Options:**
- `-p, --posts <number>` - Total posts per profile (default: 50000)
- `-b, --batch <number>` - Download batch size (default: 1000)
- `-c, --concurrency <number>` - OCR concurrency (default: 3)
- `-o, --output <file>` - Output JSON filename

**Example:**
```bash
ig-bulk batch profiles.txt --posts 2000
```

### OCR on Already Downloaded Profile
```bash
ig-bulk ocr-only <username> [options]
```

**Options:**
- `-c, --concurrency <number>` - OCR concurrency (default: 3)

**Example:**
```bash
ig-bulk ocr-only archi_jobs --concurrency 5
```

### List Downloaded Profiles
```bash
ig-bulk list
```

### Google Sheets Commands

#### View Sheet Statistics
```bash
ig-bulk sheets-stats --sheet <SHEET_ID> --creds <CREDENTIALS_PATH>
```

#### Export OCR Results to Google Sheets
```bash
ig-bulk sheets-export --input <JSON_FILE> --sheet <SHEET_ID> --creds <CREDENTIALS_PATH>
```

**Note:** See `GOOGLE_SHEETS_SETUP.md` for complete Google Sheets setup guide.

## Output

Downloaded images are saved to: `./ig_downloads/<username>/`

Results are exported as JSON and optionally CSV:
- `ocr_results_<timestamp>.json`
- `ocr_results_<timestamp>.csv`

**Google Sheets Integration:**
- Leads automatically saved to Google Sheets when `--sheet` flag is used
- Duplicate detection based on email and phone number
- Automatic company name extraction from email domain
- Public shareable link for team collaboration

## Performance Tips

1. **Large Profiles (50k posts):** Use default batch size (1000) and concurrency (3)
2. **Smaller Profiles (<5k):** Use batch size 500, concurrency 5 for faster processing
3. **Rate Limits:** Built-in delays between batches (5s) and errors (15s)
4. **Parallel OCR:** Adjust concurrency based on your CPU (3-5 is optimal)

## Example Workflow

```bash
# Download and scan a large profile
ig-bulk scan archi_jobs --posts 50000 --concurrency 3 --csv

# Check what's been downloaded
ig-bulk list

# Re-run OCR with different settings
ig-bulk ocr-only archi_jobs --concurrency 5

# Process multiple profiles from a file
ig-bulk batch profiles.txt --posts 10000
```

## Downloaded Files Structure

```
ig_downloads/
├── .sessions/              # Session files (for login support)
├── download_history.json   # Download history
├── archi_jobs/            # Profile directory
│   ├── 2025-12-25_06-13-39_UTC.jpg
│   ├── 2025-12-25_06-15-31_UTC.jpg
│   └── ...
└── another_profile/
    └── ...
```