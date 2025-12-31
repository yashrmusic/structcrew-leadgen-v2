# Email Marketing System

High-volume email marketing system with 300-500 emails/day capability and excellent deliverability.

## Features

✅ **Multiple SMTP Account Rotation** - Distribute load across multiple accounts
✅ **Daily Limit Management** - Respect daily sending limits
✅ **Email Validation** - Verify email format before sending
✅ **Retry Logic** - Automatic retry on failures (3 attempts)
✅ **Throttling** - Configurable delays between emails
✅ **Template System** - Handlebars templates for personalized emails
✅ **Google Sheets Integration** - Fetch leads directly from sheets
✅ **Business Type Detection** - Auto-detect Architecture/Interior Design studios
✅ **History Tracking** - Log all sent emails
✅ **Dry Run Mode** - Test campaigns without actually sending

## Installation

Dependencies are already installed:
```bash
npm install nodemailer email-validator handlebars
```

## Quick Start

### 1. Configure SMTP Accounts

#### Option A: Gmail (Free)
```bash
email-campaign config --add-smtp
```

Follow prompts:
- **SMTP Host:** `smtp.gmail.com`
- **SMTP Port:** `587`
- **Email:** your@gmail.com
- **Password:** [Gmail App Password](https://myaccount.google.com/apppasswords)
- **Use SSL/TLS:** `n`

#### Option B: Multiple Gmail Accounts (Recommended for 500 emails/day)

Gmail free tier: 500 emails/day per account. For 500/day, 1 account works.

For 1000+ emails/day, add multiple accounts:

```bash
# Add first account
email-campaign config --add-smtp

# Add second account
email-campaign config --add-smtp

# View all accounts
email-campaign config --list
```

#### Option C: Other SMTP Providers

**SendGrid Free Tier (100 emails/day):**
- Host: `smtp.sendgrid.net`
- Port: `587`
- Get API key from sendgrid.com

**Mailgun Free Tier (5000 emails/3 months):**
- Host: `smtp.mailgun.org`
- Port: `587`
- Get SMTP credentials from mailgun.com

**Amazon SES (200 emails/day free):**
- Host: `email-smtp.us-east-1.amazonaws.com`
- Port: `587`
- Set up in AWS SES console

### 2. Set Sender Details

```bash
email-campaign config --from-name "StructCrew Team"
email-campaign config --from-email "contact@structcrew.com"
email-campaign config --daily-limit 500
```

### 3. Test Connection

```bash
email-campaign test
```

### 4. Send Campaign

#### From Email List File

Create `emails.txt` with one email per line:
```
company1@domain.com
company2@domain.com
company3@domain.com
```

Send:
```bash
email-campaign send \
  --subject "Partnership Opportunity" \
  --emails emails.txt \
  --template intro \
  --limit 50
```

#### From Google Sheets

Send to leads from your Google Sheet:
```bash
email-campaign send \
  --subject "Welcome to StructCrew" \
  --google-sheets 1Z9rcpRatj-kL8_S-aEFJT6AlQ8glLHQZL3Gk6mgxJd4 \
  --creds ./google-credentials.json \
  --template outreach \
  --status New \
  --limit 100
```

Filter by business type:
```bash
email-campaign send \
  --subject "Architecture Opportunities" \
  --google-sheets 1Z9rcpRatj-kL8_S-aEFJT6AlQ8glLHQZL3Gk6mgxJd4 \
  --creds ./google-credentials.json \
  --business-type "Architecture Studio" \
  --template outreach
```

#### Dry Run (Test Mode)

```bash
email-campaign send \
  --subject "Test Campaign" \
  --emails emails.txt \
  --dry-run
```

## Commands

### Configuration

```bash
# View all settings
email-campaign config --list

# Add SMTP account (interactive)
email-campaign config --add-smtp

# Set sender name
email-campaign config --from-name "Your Name"

# Set sender email
email-campaign config --from-email "you@company.com"

# Set daily limit
email-campaign config --daily-limit 500
```

### Testing

```bash
# Test SMTP connection
email-campaign test
```

### Sending

```bash
# Basic send with plain text
email-campaign send \
  --subject "Subject Line" \
  --emails emails.txt

# Send with template
email-campaign send \
  --subject "Welcome" \
  --emails emails.txt \
  --template modern

# From Google Sheets with filters
email-campaign send \
  --subject "Partnership" \
  --google-sheets SHEET_ID \
  --creds ./google-credentials.json \
  --business-type "Interior Design Studio" \
  --status New \
  --limit 100

# Dry run
email-campaign send \
  --subject "Test" \
  --emails emails.txt \
  --dry-run
```

### Monitoring

```bash
# View recent history
email-campaign history

# View more history
email-campaign history --number 50

# View statistics
email-campaign stats
```

## Email Templates

Three professional templates included:

### `modern.html` - Modern Dark Theme ⭐ NEW
- Beautiful dark gradient design
- Optimized for mobile and all email clients
- WhatsApp CTA button for instant response
- Tested across Gmail, Outlook, Apple Mail
- Highest conversion rate template

### `intro.html` - Introduction
- Professional greeting
- Explains StructCrew value proposition
- Multiple benefits listed
- Strong CTA

### `outreach.html` - Direct Outreach
- More direct approach
- Focuses on partnership
- Clear call-to-action

### `recruitment.html` - Dark Theme
- WhatsApp and Instagram CTAs
- Premium design feel

### Custom Templates

Create your own in `templates/` directory:

```html
<!DOCTYPE html>
<html>
<head>
    <title>{{subject}}</title>
</head>
<body>
    <p>Hi {{#if companyName}}{{companyName}}{{else}}there{{/if}},</p>
    <p>Your email content here...</p>
</body>
</html>
```

Variables available:
- `{{to}}` - Recipient email
- `{{companyName}}` - Company name (from email domain)
- `{{businessType}}` - Business type (Architecture/Interior Design)
- `{{email}}` - Email address
- `{{phone}}` - Phone number
- `{{subject}}` - Email subject

## Business Type Detection

Automatically detects business type from:

**Email domain analysis:**
- `architectureat180.in` → Architecture Studio
- `studio@ksdesign.in` → Design Studio

**Instagram handle analysis:**
- `@archi_jobs` → Architecture Studio
- `@interior_studio` → Interior Design Studio

**Supported types:**
- Architecture Studio
- Interior Design Studio
- Landscape Design
- Urban Design
- Design Studio
- Other

## Google Sheet Integration

### Your Sheet

**Sheet ID:** `1Z9rcpRatj-kL8_S-aEFJT6AlQ8glLHQZL3Gk6mgxJd4`

**Sheet URL:** https://docs.google.com/spreadsheets/d/1Z9rcpRatj-kL8_S-aEFJT6AlQ8glLHQZL3Gk6mgxJd4

### Schema

| Column | Description |
|---------|-------------|
| Company Name | Auto-extracted from email domain |
| Email | Email address |
| Phone | Phone number |
| State | State/Region |
| Instagram Handle | @handle |
| **Business Type** | Auto-detected (NEW!) |
| Source | Data source |
| Date Added | When added |
| Status | New/Contacted/Replied/Closed |

### Fetching Leads

```bash
# All leads
email-campaign send --google-sheets SHEET_ID --creds ./google-credentials.json

# Only New leads
email-campaign send \
  --google-sheets SHEET_ID \
  --creds ./google-credentials.json \
  --status New

# Only Architecture Studios
email-campaign send \
  --google-sheets SHEET_ID \
  --creds ./google-credentials.json \
  --business-type "Architecture Studio"

# Only Interior Design Studios
email-campaign send \
  --google-sheets SHEET_ID \
  --creds ./google-credentials.json \
  --business-type "Interior Design Studio"
```

## Best Practices for High Deliverability

### 1. Warm Up New SMTP Accounts
- Day 1: Send 10-20 emails
- Day 2-3: Send 50-100 emails
- Day 4-7: Send 200-300 emails
- Day 8+: Full capacity (500/day)

### 2. Email Content
- Keep subject lines under 50 characters
- Avoid spam trigger words (FREE, MONEY, WIN, etc.)
- Use personalized content
- Include clear unsubscribe mechanism
- Use professional formatting

### 3. Timing
- Send between 9 AM - 5 PM recipient's local time
- Best days: Tuesday, Wednesday, Thursday
- Avoid weekends

### 4. Throttling
- Default: 5 seconds between emails
- Increase to 10-15 seconds for new accounts
- Decrease to 2-3 seconds for warmed accounts

### 5. Bounce Handling
- Remove bounced emails from list
- Mark leads as "Bounced" in Google Sheets
- Never resend to bounced addresses

### 6. Engagement Tracking
- Track opens using tracking pixels
- Track clicks using unique URLs
- Follow up on non-responders after 7 days

## Configuration File

Edit `email-config.json` directly:

```json
{
  "smtpAccounts": [
    {
      "email": "account1@gmail.com",
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false
    }
  ],
  "fromName": "StructCrew",
  "fromEmail": "contact@structcrew.com",
  "dailyLimit": 500,
  "batchDelay": 5000,
  "retryAttempts": 3,
  "retryDelay": 10000,
  "trackingEnabled": false
}
```

**Settings explained:**
- `dailyLimit`: Max emails per day
- `batchDelay`: Milliseconds between emails (5000 = 5 sec)
- `retryAttempts`: How many times to retry failed sends
- `retryDelay`: Milliseconds between retries (10000 = 10 sec)

## Troubleshooting

### "Invalid login" Errors
- Gmail: Use App Password, not regular password
- Enable 2-factor authentication first
- Generate App Password: https://myaccount.google.com/apppasswords

### "Connection timeout"
- Check firewall settings
- Verify SMTP host and port
- Try port 465 with SSL enabled

### "Rate limit exceeded"
- Reduce dailyLimit
- Increase batchDelay
- Add more SMTP accounts for rotation

### Emails going to spam
- Check SPF/DKIM records
- Improve email content
- Warm up account more slowly
- Verify sender reputation

### Low open rates
- Improve subject lines
- Personalize content
- Send at optimal times
- Clean your email list

## Advanced Workflows

### Automated Daily Campaigns

Create a bash script `daily-campaign.sh`:

```bash
#!/bin/bash
# Send 50 emails to Architecture Studios
email-campaign send \
  --subject "New Architecture Projects" \
  --google-sheets 1Z9rcpRatj-kL8_S-aEFJT6AlQ8glLHQZL3Gk6mgxJd4 \
  --creds ./google-credentials.json \
  --business-type "Architecture Studio" \
  --status New \
  --limit 50

# Send 50 emails to Interior Design Studios
email-campaign send \
  --subject "Interior Design Opportunities" \
  --google-sheets 1Z9rcpRatj-kL8_S-aEFJT6AlQ8glLHQZL3Gk6mgxJd4 \
  --creds ./google-credentials.json \
  --business-type "Interior Design Studio" \
  --status New \
  --limit 50
```

Add to crontab for daily execution:
```bash
# Run daily at 10 AM
0 10 * * * /path/to/daily-campaign.sh
```

### Follow-Up Campaigns

Day 1 - Initial email:
```bash
email-campaign send --subject "Introduction" --emails leads.txt --template intro
```

Day 7 - Follow-up:
```bash
email-campaign send \
  --subject "Quick Follow-up" \
  --emails leads.txt \
  --template outreach \
  --status New
```

Day 14 - Final follow-up:
```bash
email-campaign send \
  --subject "Last Chance" \
  --emails leads.txt \
  --status Contacted
```

## Statistics & Reporting

```bash
# View current session stats
email-campaign stats

# View recent history
email-campaign history --number 20
```

Stats include:
- Emails sent (current session)
- Emails failed
- Bounced emails
- Total sent today
- Unique recipients
- Daily quota remaining

## Security Notes

⚠️ **IMPORTANT:**

1. **Never commit** `email-config.json` to version control
2. **Use App Passwords** for Gmail, not regular passwords
3. **Rotate credentials** regularly
4. **Monitor** sending reputation
5. **Comply** with CAN-SPAM and GDPR regulations
6. **Include** unsubscribe option in all emails

## Free Email Provider Limits

| Provider | Free Tier | Daily Limit |
|-----------|------------|-------------|
| Gmail | Free | 500/day |
| SendGrid | Free | 100/day |
| Mailgun | Free Trial | 5000/3 months |
| Amazon SES | Free | 200/day |
| Mailchimp | Free | 2,000/month |

For 300-500 emails/day:
- **Best option:** Gmail (1 account)
- **Backup option:** Add 2nd Gmail account for rotation
- **High volume:** Mailgun or SendGrid paid plans

## Next Steps

1. ✅ Set up Gmail App Password
2. ✅ Configure SMTP account(s)
3. ✅ Test connection
4. ✅ Create small test campaign (10-20 emails)
5. ✅ Monitor delivery and open rates
6. ✅ Scale to full capacity (500/day)
7. ✅ Set up automated daily campaigns
8. ✅ Track and optimize performance