# 🔑 KEYS NEEDED - ALL EMAIL MARKETING CHANNELS

## ✅ ALREADY CONFIGURED

### 1. Gmail SMTP
**Status**: ✅ **Working** (14 emails sent today)
```
✅ Email: structcrew@gmail.com
✅ App Password: jzrw fzvj hpao ztyj (already in config)
✅ Daily Limit: 500 emails
✅ Remaining Today: 486 emails
```
**No action needed** - Already working!

---

## ⏳ NEEDS SETUP

### 2. Mailgun ⭐ Recommended
**Status**: ⚠️  **Ready - Needs API Key**

**What You Need:**
1. **Private API Key** (free)
   - Go to: https://signup.mailgun.com/signup
   - Sign up (no credit card)
   - Verify email
   - Go to: https://app.mailgun.com/app/dashboard
   - Click: "Sending" → "Domain settings" → "API Keys"
   - Copy: "Private API Key"

2. **Domain** (optional)
   - Option A: Use sandbox (no verification needed)
   - Option B: Verify your own domain (better delivery)

**Free Tier:**
- 5,000 emails/month
- ~166 emails/day
- No credit card required

**Setup Command:**
```bash
node quick-setup-mailgun.js
```

---

### 3. Brevo (Sendinblue)
**Status**: ⚠️  **Ready - Needs API Key**

**What You Need:**
1. **API Key** (free)
   - Go to: https://www.brevo.com
   - Sign up free
   - Verify email
   - Go to: Settings → API Keys
   - Click: "Generate new key"
   - Copy: API Key

**Free Tier:**
- 300 emails/day
- No credit card required

**Manual Setup:**
Edit `email-config.json`:
```json
{
  "brevo": {
    "apiKey": "YOUR_API_KEY_HERE",
    "fromEmail": "structcrew@gmail.com",
    "dailyLimit": 300
  }
}
```

---

### 4. Resend
**Status**: ⚠️  **Ready - Needs API Key**

**What You Need:**
1. **API Key** (free)
   - Go to: https://resend.com
   - Sign up free
   - Verify email
   - Go to: Dashboard → API Keys
   - Click: "Create API Key"
   - Copy: API Key

**Free Tier:**
- 3,000 emails/month
- ~100 emails/day
- No credit card required

**Manual Setup:**
Edit `email-config.json`:
```json
{
  "resend": {
    "apiKey": "YOUR_API_KEY_HERE",
    "fromEmail": "your@domain.com",
    "dailyLimit": 100
  }
}
```

**Note**: Requires your own domain for best delivery

---

### 5. AWS SES (Amazon)
**Status**: ⚠️  **Advanced - Needs AWS Account**

**What You Need:**
1. **AWS Account** (free tier available)
   - Go to: https://aws.amazon.com/ses/
   - Sign up for AWS
   - Verify email or domain

2. **Access Keys**
   - Go to: AWS Console → IAM
   - Create user with SES permissions
   - Copy: Access Key ID
   - Copy: Secret Access Key

**Pricing:**
- $0.10 per 1,000 emails
- Free tier: 62,000 emails/month (first 12 months)
- Daily limit: 200,000 (sandbox: 200)

**Setup**: Advanced - requires AWS CLI configuration

---

## 📊 COMPARISON

| Provider | Key Needed | Free Tier | Setup Time | Difficulty |
|----------|-------------|-----------|------------|------------|
| **Gmail** | ✅ Done | 500/day | 0 min | Easy |
| **Mailgun** | API Key | 5,000/mo | 5 min | Easy |
| **Brevo** | API Key | 300/day | 5 min | Easy |
| **Resend** | API Key | 3,000/mo | 5 min | Medium |
| **AWS SES** | AWS Keys | 62,000/mo | 15 min | Hard |

---

## 🎯 RECOMMENDATION

### Option A: Use Gmail Only (Quick)
**Keys Needed**: ✅ None (already configured)
**Can Send**: 486 more emails today
**Total**: 500 emails/day

```bash
# Send now
node email-campaign.js send -s "Subject" -t structcrew-clean -e final_email_list.txt --limit 118
```

---

### Option B: Add Mailgun (Best Balance)
**Keys Needed**: 1 API Key (free)
**Can Send**: 5,000 emails/month
**Benefits**: High delivery, analytics

**Steps:**
1. Sign up: https://signup.mailgun.com/signup
2. Get API Key: Dashboard → API Keys
3. Run: `node quick-setup-mailgun.js`
4. Send: `node run-mailgun-campaign.js`

---

### Option C: Activate All (Maximum Volume)
**Keys Needed**: 3 API Keys (all free)

**Setup Time**: 15 minutes
**Total Capacity:**
- Gmail: 500/day
- Mailgun: 5,000/month (~166/day)
- Brevo: 300/day
- **Combined**: ~1,000 emails/day

**Commands:**
```bash
# Setup Mailgun
node quick-setup-mailgun.js

# Setup Brevo (manual config edit)
# Setup Resend (manual config edit)

# Send with auto-provider selection
node email-campaign.js send --provider multi -s "Subject" -t structcrew-clean -e final_email_list.txt
```

---

## 📝 QUICK SETUP SUMMARY

### To Send 118 Emails NOW:
```bash
# No keys needed - Gmail ready
node email-campaign.js send -s "Connect with StructCrew" -t structcrew-clean -e final_email_list.txt --limit 118
```

### To Setup Mailgun (2 min setup):
```bash
# 1. Get API Key from https://signup.mailgun.com
# 2. Run setup
node quick-setup-mailgun.js
# 3. Send
node run-mailgun-campaign.js
```

### To Activate All Channels (15 min setup):
1. **Mailgun API Key** (2 min) → https://signup.mailgun.com
2. **Brevo API Key** (2 min) → https://www.brevo.com
3. **Resend API Key** (2 min) → https://resend.com

Then edit `email-config.json` to add all keys.

---

## 🔍 CHECK YOUR CURRENT CONFIG

```bash
node email-campaign.js config --list
```

Current Config:
```json
{
  "smtpAccounts": [
    {
      "email": "structcrew@gmail.com",
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "pass": "jzrw fzvj hpao ztyj"
    }
  ],
  "fromName": "StructCrew",
  "fromEmail": "structcrew@gmail.com",
  "dailyLimit": 500,
  "mailgun": null,      // ← Needs API Key
  "brevo": null,        // ← Needs API Key
  "resend": null        // ← Needs API Key
}
```

---

## ✅ KEYS SUMMARY

### ✅ Already Have:
- Gmail App Password: `jzrw fzvj hpao ztyj`

### ❌ Need to Get:
1. **Mailgun Private API Key** → https://signup.mailgun.com
2. **Brevo API Key** → https://www.brevo.com
3. **Resend API Key** → https://resend.com

### 💰 Cost:
All keys: **FREE** (no credit card required)

### ⏱️ Time to Get All:
- Mailgun: 2 minutes
- Brevo: 2 minutes
- Resend: 2 minutes
- **Total: 6 minutes**

---

## 🚀 READY TO SEND NOW?

**Yes!** Gmail is already configured with 486 emails remaining.

```bash
node email-campaign.js send -s "Connect with StructCrew" -t structcrew-clean -e final_email_list.txt --limit 118
```

**Total time**: ~15 minutes (5s delay × 118 emails)

---

**Last Updated**: December 26, 2025
