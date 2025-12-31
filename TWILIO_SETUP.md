# Twilio WhatsApp Setup Guide

## Overview
Your Twilio WhatsApp marketing system is now configured and ready to use!

## Configuration

Your credentials are saved in `twilio-config.json`:
- Account SID: YOUR_TWILIO_ACCOUNT_SID
- Auth Token: YOUR_TWILIO_AUTH_TOKEN
- From Number: YOUR_TWILIO_FROM_NUMBER

## Quick Start (3 Steps)

### Step 1: Join the Twilio Sandbox
First, you need to join the sandbox to receive messages:

1. Open WhatsApp on your phone
2. Send this message: `join +17656256033`
3. Send it to: `+17656256033`
4. Wait for confirmation message

```bash
node twilio-campaign.js sandbox
```

### Step 2: Test Connection
```bash
node twilio-campaign.js test --phone YOUR_PHONE_NUMBER
```

### Step 3: Send Bulk Messages
Create a file `phones.txt` with phone numbers:
```txt
+14155551234
+441234567890
+919876543210
```

```bash
node twilio-campaign.js send --file phones.txt --message "Hello! This is a test."
```

## Commands

### Check Account Status
```bash
node twilio-campaign.js status
```

### Send Bulk Messages
```bash
node twilio-campaign.js send --file phones.txt --message "Your message" --delay 5000
```

**Options:**
- `--file <path>`: Phone numbers file (required)
- `--message <text>`: Message to send
- `--message-file <path>`: Use a message template
- `--delay <ms>`: Delay between messages (default: 5000ms)

### Test Message
```bash
node twilio-campaign.js test --phone YOUR_NUMBER --message "Test"
```

### Interactive Mode
```bash
node twilio-campaign.js interactive
```
Follow the prompts to send messages interactively.

### Sandbox Instructions
```bash
node twilio-campaign.js sandbox
```

## Phone Number Format

Use E.164 format with country code and plus sign:
```txt
+14155551234    # US
+441234567890   # UK
+919876543210   # India
```

## Message Templates

Templates are stored in `templates/whatsapp/`. You can use placeholders:
- `{{firstName}}`: Recipient's first name
- `{{yourName}}`: Your name
- `{{companyName}}`: Your company
- `{{service}}`: Your service
- `{{phone}}`: Your phone
- `{{website}}`: Your website

Example template:
```
Hi {{firstName}}! 👋

This is {{yourName}} from {{companyName}}. 
We help with {{service}}. Interested?

Best,
{{yourName}}
```

## Sandbox Mode vs Production

### Sandbox Mode (Current)
- ✅ Free to test
- ✅ Can send to yourself
- ✅ Can send to up to 10 numbers that have joined sandbox
- ❌ Limited to test environment
- ❌ Numbers must join with "join YOUR_NUMBER" first

### Production Mode
To upgrade to production:
1. Apply for WhatsApp Business API (1-3 days)
2. Get a dedicated WhatsApp number (~$1/month)
3. Pay $0.005 per message sent
4. No sandbox restrictions

## Pricing

### Current (Sandbox)
- Free to test
- No message fees

### Production
- $0.005 per message sent
- ~$1/month for WhatsApp number
- No minimum commitment

## Best Practices

1. **Join Sandbox First**: Make sure test numbers have joined
2. **Start Small**: Test with 1-2 numbers first
3. **Use Delays**: Default 5 seconds between messages
4. **Personalize**: Use templates with variables
5. **Monitor**: Check message status if needed

## Using Your Extracted Phone Numbers

Your system already extracts phone numbers from Instagram profiles:

```bash
# Use phone numbers from OCR results
node twilio-campaign.js send --file leads_phones_1234567890.txt --message-file templates/whatsapp/default.txt
```

**Important:** For each phone number you want to message, they need to:
1. Send "join +17656256033" to +17656256033 on WhatsApp
2. Wait for confirmation

## Troubleshooting

### "Not enrolled in sandbox"
**Problem:** Recipient hasn't joined the sandbox
**Solution:** Send them this message: "Please send 'join +17656256033' to +17656256033 on WhatsApp"

### "Permission denied"
**Problem:** Phone number format incorrect
**Solution:** Ensure format is +[countrycode][number] (e.g., +14155551234)

### Messages not delivering
**Problem:** Various issues
**Solutions:**
- Check sandbox enrollment
- Verify phone number format
- Check Twilio account status with `node twilio-campaign.js status`
- Check Twilio console for error logs

### Authentication Error
**Problem:** Invalid credentials
**Solution:** Check `twilio-config.json` - ensure SID, token, and phone are correct

## Next Steps

1. ✅ Join sandbox with your phone
2. ✅ Test with `node twilio-campaign.js test --phone YOUR_NUMBER`
3. ✅ Send small batch (5-10 numbers)
4. 🔄 Monitor for delivery issues
5. 🚀 Scale up or upgrade to production

## Comparison: Twilio vs WhatsApp Web.js

| Feature | Twilio | WhatsApp Web.js |
|---------|--------|-----------------|
| Cost | Free sandbox, $0.005/msg production | Free |
| Setup | 5 min | 2 min (scan QR) |
| Reliability | High (official API) | Medium (personal) |
| Rate Limits | None (production) | 50-100/day (personal) |
| Number | Business number | Personal number |
| Tracking | Yes (delivery status) | No |
| Sandbox Restrictions | Yes (only 10 numbers) | No |

**Recommendation:** Start with Twilio sandbox for testing. Upgrade to production when ready to scale.

## Support

For issues, check:
- Twilio Console: https://console.twilio.com
- WhatsApp API Docs: https://www.twilio.com/docs/whatsapp
- This guide: README.md or WHATSAPP_SETUP.md