# Cloud Storage Integration Guide

## Overview

Choose from multiple cloud storage options for your Instagram images:

| Provider | Free Tier | Cost for 50k | API Support | Speed |
|----------|-----------|----------------|-------------|--------|
| **MEGA** | 20 GB | $0 (sufficient!) | ⚠️ Limited | Good |
| **AWS S3** | None | ~$0.16/month | ✅ Excellent | Fast |
| **DigitalOcean** | None | ~$0.10/month | ✅ Good | Fast |
| **Google Cloud** | None | ~$0.14/month | ✅ Excellent | Fast |

## Storage Requirements

Based on current image sizes (avg 143.5 KB):

| Posts | Uncompressed | Compressed (80%) | Savings |
|-------|-------------|------------------|---------|
| 1,000 | 140 MB | 70 MB | 50% |
| 10,000 | 1.4 GB | 700 MB | 50% |
| 50,000 | 7.0 GB | 3.5 GB | 50% |
| 100,000 | 14 GB | 7.0 GB | 50% |

## Option 1: MEGA (Recommended for Free Storage)

**Best for:** Free storage, no coding required

### Manual Upload Steps

1. **Compress images first:**
   ```bash
   node compress-images.js ./archi_jobs 80
   ```

2. **Upload to MEGA:**
   - Go to https://mega.nz
   - Login with `iamyash95@gmail.com`
   - Upload `./compressed-images` folder

3. **Organize:**
   - Create folder: `StructCrew Images`
   - Create subfolders by date: `2025-12-31`, `2026-01-01`, etc.

### Advantages
- ✅ 20 GB free storage
- ✅ No API key required
- ✅ Easy web interface
- ✅ Shareable links

### Disadvantages
- ❌ No programmatic upload (limited API)
- ❌ Manual process required

## Option 2: AWS S3 (Best for Automation)

**Best for:** Programmatic uploads, reliability

### Setup Steps

1. **Create AWS Account:**
   - Go to https://aws.amazon.com
   - Sign up (free tier available)

2. **Create S3 Bucket:**
   ```bash
   node setup-aws-s3.js
   ```

3. **Upload Images:**
   ```bash
   node upload-to-s3.js ./archi_jobs structcrew-images
   ```

### Costs (for 50k posts)
- Storage: 7 GB × $0.023/GB = **$0.16/month**
- Requests: 50,000 uploads × $0.005/1,000 = **$0.25 (one-time)**
- Data transfer: Minimal (uploads only)

### Advantages
- ✅ Full API support
- ✅ Highly reliable (99.999999999%)
- ✅ Easy to automate
- ✅ CDN support via CloudFront
- ✅ Very low cost

### Disadvantages
- ❌ Requires AWS account
- ❌ Slight learning curve

## Option 3: DigitalOcean Spaces

**Best for:** Simple, affordable

### Setup Steps

1. **Create DO Account:**
   - Go to https://digitalocean.com
   - Sign up

2. **Create Space:**
   - Create "Space" in DO dashboard
   - Get API keys

3. **Upload:**
   ```bash
   node upload-to-do.js ./archi_jobs structcrew-images
   ```

### Costs
- Storage: 7 GB × $0.015/GB = **$0.10/month**
- Bandwidth: First 250 GB free

### Advantages
- ✅ Simple interface
- ✅ AWS S3 compatible
- ✅ Free bandwidth tier
- ✅ Easy setup

## Quick Start Guide

### For 50k Posts (Recommended Workflow):

#### Day 1: Compress & Upload to MEGA
```bash
# Compress images
node compress-images.js ./archi_jobs 80

# Upload to MEGA manually via web interface
```

#### Day 2+: Set up AWS S3 for automation
```bash
# Configure AWS
node setup-aws-s3.js

# Upload to S3 (automated)
node upload-to-s3.js ./archi_jobs structcrew-images
```

## Image Compression

Compress before uploading to save 50% space:

```bash
# Recommended quality (80%)
node compress-images.js ./archi_jobs 80

# High compression (60%)
node compress-images.js ./archi_jobs 60

# Best quality (90%)
node compress-images.js ./archi_jobs 90
```

Output: `./compressed-images/` folder

## Automation Strategies

### Strategy 1: Upload After Each Session

Modify scraper to upload after scraping:

```javascript
const compressor = require('./compress-images');
const s3Uploader = require('./upload-to-s3');

// After scraping
await compressor.compressFolder('./archi_jobs');
await s3Uploader.uploadFolder('./compressed-images', 'structcrew-images');
```

### Strategy 2: Scheduled Uploads

Upload daily at midnight:

```bash
# Crontab entry
0 2 * * * cd /path/to/project && node compress-images.js ./archi_jobs 80 && node upload-to-s3.js ./compressed-images structcrew-images
```

### Strategy 3: Real-time Upload

Upload each image immediately:

```javascript
// In your scraper
const fs = require('fs-extra');
const s3 = require('@aws-sdk/client-s3');

// After downloading each image
await s3.send(new PutObjectCommand({
    Bucket: 'structcrew-images',
    Key: `archi_jobs/${filename}`,
    Body: await fs.readFile(filepath)
}));
```

## Cost Comparison (Annual)

| Provider | 50k Posts | 100k Posts | 1M Posts |
|----------|-------------|--------------|------------|
| MEGA Free | $0 | $0 | $0 |
| AWS S3 | $1.92/yr | $3.84/yr | $38.40/yr |
| DigitalOcean | $1.20/yr | $2.40/yr | $24.00/yr |
| Google Cloud | $1.68/yr | $3.36/yr | $33.60/yr |

## Best Practices

1. **Always compress first** - Saves 50% space and bandwidth
2. **Use organized structure** - Date-based folders: `YYYY-MM-DD/`
3. **Keep local backup** - Don't delete local files immediately
4. **Monitor costs** - Set up billing alerts
5. **Use lifecycle policies** - Auto-delete old files (if needed)
6. **Add metadata** - Include source, date, business type

## Troubleshooting

### Upload Failed

**Check:**
- Internet connection
- Storage space available
- API credentials (if using cloud service)
- File permissions

### High Costs

**Solutions:**
- Compress images (saves 50%)
- Delete old images
- Use lifecycle policies
- Check bandwidth costs

### Storage Full

**Solutions:**
- Delete old images
- Compress and re-upload
- Upgrade storage plan
- Use multiple providers

## Quick Reference

```bash
# Compress images
node compress-images.js ./archi_jobs 80

# Setup AWS S3
node setup-aws-s3.js

# Upload to AWS S3
node upload-to-s3.js ./compressed-images structcrew-images

# Setup MEGA (manual)
# 1. Compress: node compress-images.js ./archi_jobs 80
# 2. Go to https://mega.nz
# 3. Upload ./compressed-images folder
```

## Next Steps

1. **Start with MEGA** (free, no setup required)
2. **Compress existing images** to save space
3. **Consider AWS S3** for long-term automation
4. **Set up scheduled uploads** for new images
5. **Monitor storage usage** regularly

## Support Links

- MEGA: https://help.mega.nz
- AWS S3: https://docs.aws.amazon.com/s3/
- DigitalOcean: https://docs.digitalocean.com/products/spaces
