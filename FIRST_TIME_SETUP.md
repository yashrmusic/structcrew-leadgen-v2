# 🚀 First Time Setup Guide

## New Machine Setup (5 Minutes)

When you clone this project on a new laptop, you need to configure all the credentials. 

**Important:** This guide walks you through setting up **all** the credential files.

---

## ✅ STEP 1: Clone the Repository

```bash
# Clone the project
git clone https://github.com/yashrmusic/structcrew-leadgen-v2.git

# Navigate to project
cd structcrew-leadgen-v2

# Install dependencies
npm install
```

---

## 🔐 STEP 2: Configure All Credentials

### 2.1 Create `.env` File

Create a new file named `.env` in the project root:

```bash
# Create .env file
nano .env
```

Add your environment variables (if any):

```env
# Add any environment variables here
# Example:
# NODE_ENV=production
# PORT=3000
```

Save and exit: `Ctrl+X`, `Y`, `Enter`

---

### 2.2 Configure Gmail SMTP

Create `email-config.json`:

```bash
# Create email-config.json
nano email-config.json
```

Add your Gmail credentials:

```json
{
  "smtpAccounts": [
    {
      "email": "structcrew@gmail.com",
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "pass": "YOUR_GMAIL_APP_PASSWORD",
      "name": "gmail"
    }
  ],
  "fromName": "StructCrew",
  "fromEmail": "structcrew@gmail.com",
  "dailyLimit": 500,
  "batchDelay": 5000,
  "retryAttempts": 3,
  "retryDelay": 10000
}
```

**Important:** Use an App Password, not your regular Gmail password:
1. Go to: https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to: App Passwords
4. Generate: "StructCrew Email" app password
5. Copy and paste in the file

Save and exit: `Ctrl+X`, `Y`, `Enter`

---

### 2.3 Configure AWS S3

Create `aws-config.json`:

```bash
nano aws-config.json
```

Add your AWS credentials:

```json
{
  "accessKeyId": "YOUR_AWS_ACCESS_KEY_ID",
  "secretAccessKey": "YOUR_AWS_SECRET_ACCESS_KEY",
  "region": "us-east-1",
  "bucket": "structcrew-images"
}
```

**To get AWS credentials:**
1. Go to: https://console.aws.amazon.com
2. Login: `rakhianiy@gmail.com`
3. Click: Your name (top right) → **Security Credentials**
4. Scroll down to: **Access Keys**
5. Click: **Create access key**
6. Copy: Access Key ID and Secret Access Key
7. Paste in the file above

Save and exit: `Ctrl+X`, `Y`, `Enter`

---

### 2.4 Configure MEGA (Optional)

Create `mega-config.json`:

```bash
nano mega-config.json
```

Add your MEGA credentials:

```json
{
  "email": "iamyash95@gmail.com",
  "password": "YOUR_MEGA_PASSWORD"
}
```

Save and exit: `Ctrl+X`, `Y`, `Enter`

---

### 2.5 Configure Twilio (Optional - for WhatsApp)

Create `twilio-config.json`:

```bash
nano twilio-config.json
```

Add your Twilio credentials:

```json
{
  "accountSid": "YOUR_TWILIO_ACCOUNT_SID",
  "authToken": "YOUR_TWILIO_AUTH_TOKEN",
  "fromNumber": "YOUR_TWILIO_PHONE_NUMBER"
}
```

Save and exit: `Ctrl+X`, `Y`, `Enter`

---

### 2.6 Configure Resend (Optional)

**Note:** Already configured in email-config.json, just add if using separate Resend config:

Add to your `email-config.json`:

```json
{
  "resend": {
    "apiKey": "YOUR_RESEND_API_KEY",
    "fromEmail": "mail@structcrew.online",
    "dailyLimit": 100
  }
}
```

---

## ✅ STEP 3: Verify Setup

### Test Email Configuration

```bash
# Test email sending
node email-campaign.js send -s "Test Setup" -t structcrew-clean -e YOUR_EMAIL_HERE --limit 1
```

### Test AWS S3

```bash
# List S3 buckets
node upload-to-s3.js --list-buckets

# Should show: structcrew-images
```

### Test MEGA

```bash
# No test needed - will work when you run upload commands
```

---

## 🚀 QUICK SETUP (Automated Option)

I can create an automated setup script for you. Just answer the questions and it will configure everything.

**Want this?** Reply: `YES - create automated setup script`

Then run:

```bash
# This will ask you for all credentials and create all files
node first-time-setup.js
```

---

## 📋 QUICK REFERENCE

### All Files to Configure

| File | Purpose | Required |
|------|---------|----------|
| `.env` | Environment variables | Optional |
| `email-config.json` | Email sending (Gmail, Brevo, Resend) | **Required** |
| `aws-config.json` | AWS S3 cloud storage | **Required** |
| `mega-config.json` | MEGA cloud storage | Optional |
| `twilio-config.json` | Twilio WhatsApp | Optional |

### Your Credentials Summary

| Service | Account | Credentials Location |
|---------|---------|--------------------|
| Gmail | structcrew@gmail.com | `email-config.json` |
| AWS S3 | rakhianiy@gmail.com | `aws-config.json` |
| MEGA | iamyash95@gmail.com | `mega-config.json` |
| Twilio | - | `twilio-config.json` |

---

## 🔐 SECURITY BEST PRACTICES

### DO's

✅ Store credentials in config files
✅ Keep config files in `.gitignore`
✅ Use separate config files for each service
✅ Never commit secrets to GitHub
✅ Use strong passwords
✅ Enable 2FA where possible

### DON'Ts

❌ Don't commit secrets to GitHub
❌ Don't share config files with others
❌ Don't store passwords in plain code
❌ Don't use same password everywhere
❌ Don't paste credentials in public issues

---

## 🔄 WORKING ON MULTIPLE MACHINES

### Option 1: Manual Setup (Recommended)

Follow this guide on each machine:

**Laptop 1:**
```bash
git clone https://github.com/yashrmusic/structcrew-leadgen-v2.git
cd structcrew-leadgen-v2
npm install
# Configure all credential files (this guide)
```

**Laptop 2:**
```bash
git clone https://github.com/yashrmusic/structcrew-leadgen-v2.git
cd structcrew-leadgen-v2
npm install
# Configure all credential files (this guide)
```

### Option 2: Secure Storage Service

Use a password manager (1Password, LastPass, Bitwarden):

**Benefits:**
- Store all credentials securely
- Auto-fill on all devices
- Sync across all machines
- Generate strong passwords

**Setup:**
1. Sign up for password manager
2. Store all API keys and passwords
3. Access from any device

### Option 3: Environment Variables Store

Use a service like **GitHub Secrets** (for CI/CD) or **Vercel Env**:

**For GitHub Actions:**
1. Go to: Repository → Settings → Secrets
2. Add: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.
3. Use in workflows: `process.env.AWS_ACCESS_KEY_ID`

---

## 💾 BACKUP YOUR CREDENTIALS

### Create a Secure Backup

1. Copy all credential files to a secure location
2. Encrypt the backup
3. Store in password manager or encrypted USB

**Example:**

```bash
# Create backup directory
mkdir ~/structcrew-configs-backup

# Copy all config files
cp .env ~/structcrew-configs-backup/
cp email-config.json ~/structcrew-configs-backup/
cp aws-config.json ~/structcrew-configs-backup/
cp mega-config.json ~/structcrew-configs-backup/
cp twilio-config.json ~/structcrew-configs-backup/

# Optional: Encrypt backup
# cd ~/structcrew-configs-backup
# zip -r config-backup.zip *
# Encrypt with password manager
```

---

## 🐛 TROUBLESHOOTING

### File Already Exists

If you try to create a file that already exists:

```bash
# Remove existing file first
rm email-config.json

# Then create new one
nano email-config.json
```

### Permission Denied

If you get permission errors:

```bash
# Make file writable
chmod 600 email-config.json
```

### npm Install Fails

```bash
# Clear cache and retry
npm cache clean --force
npm install
```

### Can't Connect to Services

**Email:**
- Check password in `email-config.json`
- Verify 2FA is enabled
- Use App Password for Gmail

**AWS S3:**
- Verify credentials in `aws-config.json`
- Check bucket name matches
- Ensure region is correct

**MEGA:**
- Verify email and password
- Check account is active

---

## 📞 NEED HELP?

If you need help setting up on a new machine, provide:

1. Which service is failing? (Email, AWS, MEGA, Twilio)
2. What error message are you seeing?
3. Which step are you stuck on?

---

## ✅ CHECKLIST FOR NEW MACHINE

- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Create `.env` file (optional)
- [ ] Configure `email-config.json` (G SMTP)
- [ ] Configure `aws-config.json` (AWS S3)
- [ ] Configure `mega-config.json` (MEGA - optional)
- [ ] Configure `twilio-config.json` (Twilio - optional)
- [ ] Test email sending
- [ ] Test AWS S3 connection
- [ ] Backup credential files
- [ ] Add to password manager (optional)

---

## 📚 ADDITIONAL DOCUMENTATION

- `AWS_S3_QUICKSTART.md` - AWS S3 setup details
- `CLOUD_STORAGE_GUIDE.md` - Cloud storage options
- `MEGA_SETUP.md` - MEGA setup details
- `EMAIL_SERVICES_SUMMARY.txt` - Email provider comparison

---

**Last Updated:** December 31, 2025
**Status:** ✅ Ready for new machine setup

**Remember:** Never commit credential files to GitHub! Use this guide on each new machine.
