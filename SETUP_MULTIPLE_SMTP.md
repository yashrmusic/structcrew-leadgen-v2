# 🚀 MULTIPLE SMTP SETUP FOR MASS EMAILS

Gmail has a 500 emails/day limit. To send more, you need multiple accounts.

## Option 1: Add Multiple Gmail Accounts (Recommended)

### Step 1: Create App Passwords
For each Gmail account:
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to https://myaccount.google.com/apppasswords
4. Create an App Password (save it!)

### Step 2: Add SMTP Accounts
Run this command for each account:

```bash
node email-campaign.js config --add-smtp
```

For each account, enter:
- **Host**: smtp.gmail.com
- **Port**: 587
- **Email**: yourgmail@gmail.com
- **Password**: [App Password from step 1]
- **Use SSL/TLS**: n

### Example with 5 accounts
After adding 5 accounts:
```bash
node email-campaign.js config --list
```

You should see:
```
SMTP Accounts: 5
  1. account1@gmail.com (smtp.gmail.com:587)
  2. account2@gmail.com (smtp.gmail.com:587)
  3. account3@gmail.com (smtp.gmail.com:587)
  4. account4@gmail.com (smtp.gmail.com:587)
  5. account5@gmail.com (smtp.gmail.com:587)
```

### Step 3: Send to All 118 Emails
With 5 accounts, you can send 2500 emails/day (500 × 5):

```bash
node email-campaign.js send \
  -s "Connect with StructCrew - Architecture & Design Recruitment" \
  -t structcrew-clean \
  -e enhanced_emails_1766694658999.txt \
  --limit 118
```

## Option 2: Use SendGrid (Professional)

### Step 1: Sign up
- Go to https://sendgrid.com
- Create free account (100 emails/day free)

### Step 2: Get API Key
- Settings → API Keys → Create API Key
- Copy the key

### Step 3: Update Config
Edit `email-config.json`:
```json
{
  "smtpAccounts": [
    {
      "email": "apikey",
      "host": "smtp.sendgrid.net",
      "port": 587,
      "pass": "YOUR_SENDGRID_API_KEY"
    }
  ],
  "fromName": "StructCrew",
  "fromEmail": "structcrew@gmail.com",
  "dailyLimit": 100,
  "batchDelay": 5000,
  "retryAttempts": 3,
  "retryDelay": 10000
}
```

## Today's Results

### Email Campaign
- ✅ Sent: 13 emails (hit Gmail limit)
- ❌ Failed: 106 emails (due to limit)
- ❌ Skipped: 0

### OCR Extraction
- 📸 Images scanned: 402
- 📧 Emails found: 118 (29% extraction rate)
- 📱 Phones found: 62
- ⏱️  Processing time: ~4 minutes

### Why Only 118 Emails from 402 Images?
Many Instagram posts are:
- Image-only carousels (no text)
- Graphics without email addresses
- Phone-only posts
- Low-quality images that OCR can't read

**Better approach**: 
1. Use Instagram API to get bio/caption text (contains most emails)
2. Use profile scraper for email extraction
3. Combine OCR + API data

## Tomorrow's Action Items

### 1. Setup Multiple SMTP Accounts
Run `node email-campaign.js config --add-smtp` for each account

### 2. Send All 118 Emails
```bash
node email-campaign.js send \
  -s "Connect with StructCrew - Architecture & Design Recruitment" \
  -t structcrew-clean \
  -e enhanced_emails_1766694658999.txt \
  --limit 118
```

### 3. Or Use Quick Script
```bash
node run-tomorrow-campaign.js
```

## Email Lists Available

### Today's Files
- `enhanced_emails_1766694658999.txt` - 118 emails
- `enhanced_phones_1766694658999.txt` - 62 phones
- `mass_email_list.txt` - 119 emails (combined)

### Previous Files
- `leads_emails_1766693634324.txt` - 116 emails
- `demo_emails.txt` - demo emails

## Statistics

| Metric | Value |
|---------|-------|
| Total Images | 402 |
| Email Extraction Rate | 29% |
| Total Unique Emails | 118 |
| Total Unique Phones | 62 |
| Emails Sent Today | 13 |
| Gmail Daily Limit | 500 |
| Quota Remaining | 487 |

## Contact
- WhatsApp: +91-9312943581
- Email: structcrew@gmail.com
- Instagram: @structcrew
