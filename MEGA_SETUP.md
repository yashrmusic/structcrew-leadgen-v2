# MEGA Cloud Storage Integration

## Overview

Upload your Instagram images to MEGA cloud storage instead of storing locally. This saves disk space and allows access from anywhere.

## Setup

### Step 1: Install Dependencies

```bash
npm install megajs --save
```

### Step 2: Configure MEGA Credentials

```bash
node setup-mega.js
```

Enter your MEGA email and password when prompted.

**⚠️ Important:** Your credentials are saved in `mega-config.json` which is in `.gitignore` and will not be uploaded to GitHub.

## Usage

### Check Storage Space

```bash
node mega-upload.js --storage
```

Shows your MEGA storage usage (used/available/total).

### Upload Single Folder

```bash
node mega-upload.js ./archi_jobs "Architect Jobs"
```

### Upload Existing Folder

```bash
node mega-upload.js --upload-archi
```

Uploads the `./archi_jobs` folder to MEGA.

### Upload All Folders

```bash
node mega-upload.js --upload-all
```

Uploads all image folders:
- `./archi_jobs`
- `./ig_downloads/archi_jobs`
- `./ig_downloads_test/archi_jobs`

### Upload Multiple Folders (Bulk Mode)

```bash
node mega-upload.js --bulk
```

Interactive mode to upload all folders with confirmation.

## Storage Requirements

Based on current image sizes (avg 143.5 KB):

| Posts | Storage Needed |
|-------|----------------|
| 1,000 | 140 MB |
| 10,000 | 1.4 GB |
| 50,000 | 7.0 GB |
| 100,000 | 14 GB |

**MEGA Free Tier:** 20 GB ✅ (sufficient for ~140,000 posts)

## Features

- ✅ Automatic storage tracking
- ✅ Progress indicators
- ✅ Upload history saved
- ✅ Error handling and retry
- ✅ Batch upload support
- ✅ Storage space monitoring

## Integration with Scraper

### Option 1: Upload After Scraping

Modify your scraper to upload images after download:

```javascript
const MegaUploader = require('./src/mega-uploader');

const uploader = new MegaUploader();

// After downloading images
await uploader.uploadFolder('./archi_jobs', 'Architect Jobs');
await uploader.saveUploadHistory();
```

### Option 2: Scheduled Uploads

Run upload command daily/weekly:

```bash
# Add to crontab
0 2 * * * cd /path/to/project && node mega-upload.js --upload-all
```

### Option 3: Real-time Upload

Upload each image immediately after download:

```javascript
await uploader.uploadFile(filePath, folderName);
```

## Upload History

Upload history is saved to `mega-upload-history.json`:

```json
{
  "timestamp": "2025-12-31T00:00:00.000Z",
  "uploadedFiles": [
    {
      "name": "image.jpg",
      "size": 143500,
      "url": "https://mega.nz/file/..."
    }
  ],
  "uploadErrors": [],
  "summary": {
    "totalUploaded": 100,
    "totalFailed": 0,
    "totalSize": 14350000
  }
}
```

## Troubleshooting

### Connection Error

```
❌ MEGA connection error
```

**Solution:** Check your credentials in `mega-config.json`

### Upload Failed

```
❌ Failed: image.jpg
```

**Solution:** Check your internet connection and available storage space

### Low Storage Warning

```
⚠️  WARNING: Low storage space!
```

**Solution:** Delete old files from MEGA or upgrade your account

## Best Practices

1. **Upload in batches** - Don't upload all at once
2. **Monitor storage** - Check space before uploading
3. **Keep local backup** - Keep recent images locally
4. **Compress images** - Reduce file size before upload
5. **Schedule uploads** - Upload during off-peak hours

## API Reference

### MegaUploader Class

```javascript
const uploader = new MegaUploader(configPath);
```

#### Methods

- `loadConfig()` - Load MEGA credentials
- `connect()` - Connect to MEGA
- `getStorageInfo()` - Get storage usage
- `uploadFile(filePath, folderName)` - Upload single file
- `uploadFolder(folderPath, folderName)` - Upload entire folder
- `uploadMultipleFolders(folders)` - Upload multiple folders
- `saveUploadHistory(filename)` - Save upload history

## Security

- Credentials stored in `mega-config.json`
- File is in `.gitignore` - not committed to GitHub
- Never share your config file
- Consider using environment variables for production

## Support

For MEGA account issues:
- MEGA Help: https://help.mega.nz
- Upgrade Storage: https://mega.nz/pro

## Next Steps

1. Configure MEGA: `node setup-mega.js`
2. Check storage: `node mega-upload.js --storage`
3. Upload test folder: `node mega-upload.js --upload-archi`
4. Integrate with scraper for automatic uploads
