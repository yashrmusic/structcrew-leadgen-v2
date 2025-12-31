# Quick Start Guide: Cloud Storage Setup

## ✅ What's Ready

Your MEGA credentials are configured:
- **Email:** iamyash95@gmail.com
- **Storage:** 20 GB FREE tier
- **Capacity:** Sufficient for ~140,000 posts (50k = 7 GB)

## 📊 Your Current Images

```
Folder        | Files | Size
--------------|-------|----------
archi_jobs    | 55    | 6.65 MB
ig_downloads  | 1794  | 251.40 MB
```

**Total:** 1,849 images = **258 MB**

## 🚀 Quick Start (3 Steps)

### Step 1: Organize Images for Upload

```bash
node organize-images.js archi_jobs
```

Output: `./compressed-images/` folder ready for upload

### Step 2: Upload to MEGA

**Method A: Web Interface (Easiest)**

1. Go to: https://mega.nz
2. Login: iamyash95@gmail.com
3. Click: Upload → Upload Folder
4. Select: `./compressed-images/`
5. Rename folder: `StructCrew Images`

**Method B: Drag & Drop**

1. Open MEGA in browser
2. Open `./compressed-images/` in Finder
3. Drag folder from Finder to MEGA

### Step 3: Verify Upload

```bash
# Check storage space at MEGA (manual for now)
# Go to MEGA → Click your avatar → View storage
```

## 📁 Upload Multiple Folders

Organize and upload each folder:

```bash
# Folder 1
node organize-images.js archi_jobs
# Upload ./compressed-images to MEGA

# Folder 2
node organize-images.js ig_downloads/archi_jobs
# Upload ./compressed-images to MEGA

# Folder 3
node organize-images.js ig_downloads_test/archi_jobs
# Upload ./compressed-images to MEGA
```

## 💾 Storage Tracking

Keep track of your MEGA storage:

```bash
# Create storage log
echo "$(date), 258 MB uploaded" >> mega-storage-log.txt
```

## 📈 For 50,000 Posts

| Posts | Storage Needed | Upload Time | Cost |
|-------|----------------|-------------|------|
| 1,000 | 140 MB | ~2 min | FREE |
| 10,000 | 1.4 GB | ~15 min | FREE |
| 50,000 | 7.0 GB | ~1 hour | FREE |
| 100,000 | 14 GB | ~2 hours | FREE |

**All fits in your 20 GB FREE tier!**

## 🔄 Daily Workflow

**Option 1: Upload Daily**

```bash
# 1. Scrape (your scraper)
node ig-bulk-cli-v2.js

# 2. Organize new images
node organize-images.js archi_jobs

# 3. Upload to MEGA (web interface)
# Upload ./compressed-images folder
```

**Option 2: Upload Weekly**

```bash
# Run once per week to upload all new images
node organize-images.js archi_jobs
# Upload to MEGA
```

**Option 3: Delete Local After Upload**

```bash
# After confirming MEGA upload
rm -rf archi_jobs/*.jpg
```

## 🔧 Advanced: AWS S3 Automation

If you want **automated** uploads (no manual):

### Setup AWS S3

```bash
# 1. Install AWS CLI
npm install @aws-sdk/client-s3 --save

# 2. Create AWS account (free tier)
# https://aws.amazon.com

# 3. Create S3 bucket named: structcrew-images
# Get API keys

# 4. Configure AWS credentials
# aws configure
```

### Upload to S3

```bash
node upload-to-s3.js ./compressed-images structcrew-images
```

### Cost Comparison

| Provider | 50k Posts | Monthly |
|----------|-------------|---------|
| MEGA | FREE | $0 |
| AWS S3 | $0.16/month | $0.16 |
| DigitalOcean | $0.10/month | $0.10 |

## 📱 Access Images Anywhere

After uploading to MEGA:

**Web Access:**
- Go to mega.nz
- Login and access your folders
- Share links with team if needed

**Mobile Access:**
- Download MEGA app
- Login with iamyash95@gmail.com
- Access images from phone

## ⚠️ Important Notes

1. **MEGA has NO official Node.js API** - manual upload required
2. **Your credentials are in `mega-config.json`** - never share
3. **File is in .gitignore** - won't be uploaded to GitHub
4. **Check storage regularly** - before hitting 20 GB limit

## 🆘 Troubleshooting

### Upload Failed

**Check:**
- Internet connection
- Storage space on MEGA
- File size (should be < 10 GB per file)

### Can't Login to MEGA

**Try:**
- Reset password at mega.nz
- Use different browser
- Clear cache

### Storage Full

**Solutions:**
- Delete old folders from MEGA
- Archive older images to local drive
- Upgrade to MEGA PRO if needed

## 📚 Documentation

Full guides available:
- **CLOUD_STORAGE_GUIDE.md** - Complete cloud options
- **MEGA_SETUP.md** - MEGA-specific guide
- **README.md** - Project documentation

## 🎯 Next Steps

1. **Upload current images** → MEGA
2. **Test daily workflow** → Organize + Upload
3. **Consider AWS S3** → For full automation
4. **Monitor storage** → Keep under 20 GB
5. **Delete local copies** → After confirming cloud upload

## 💡 Pro Tips

- **Create folders by date:** `2025-12-31`, `2026-01-01`
- **Add descriptions:** To track source/industry
- **Keep backup:** Don't delete local files immediately
- **Share selectively:** Only share what's needed with team

---

**Ready to upload! Start with Step 1 above.** 🚀
