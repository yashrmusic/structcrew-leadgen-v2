# WhatsApp Marketing Setup Guide

## Overview
Your WhatsApp marketing system is now ready! It uses the WhatsApp Web API (no API keys needed - just scan QR code).

## Quick Start

### 1. Link Your WhatsApp Account
```bash
node whatsapp-campaign.js test --phone YOUR_PHONE_NUMBER
```
You'll see a QR code on your terminal. Scan it with your WhatsApp app to authenticate.

### 2. Prepare Phone Numbers
Create a text file with phone numbers (one per line):
```txt
14155551234
441234567890
919876543210
```

### 3. Send Messages
```bash
node whatsapp-campaign.js send --file phones.txt --message "Hello! This is a test message."
```

## Commands

### Interactive Mode
```bash
node whatsapp-campaign.js interactive
```
Follow the prompts to send messages interactively.

### Send Bulk Messages
```bash
node whatsapp-campaign.js send --file phones.txt --message-file templates/whatsapp/default.txt --delay 5000
```

**Options:**
- `--file <path>`: Phone numbers file (required)
- `--message <text>`: Message to send
- `--message-file <path>`: Use a message template
- `--delay <ms>`: Delay between messages (default: 5000ms)

### Test Message
```bash
node whatsapp-campaign.js test --phone YOUR_PHONE --message "Test"
```

### List Templates
```bash
node whatsapp-campaign.js templates
```

## Message Templates

Templates are stored in `templates/whatsapp/` directory. You can use placeholders:
- `{{firstName}}`: Recipient's first name
- `{{yourName}}`: Your name
- `{{companyName}}`: Your company
- `{{service}}`: Your service
- `{{website}}`: Your website

Example template:
```
Hi {{firstName}}! 👋

This is {{yourName}} from {{companyName}}. 
We help with {{service}}. Interested?

Best,
{{yourName}}
```

## Phone Number Format

Use international format without spaces or special characters:
- US: 14155551234
- UK: 441234567890
- India: 919876543210

## Best Practices

1. **Start Slow**: Use 5-10 second delays initially
2. **Test First**: Always test with 1-2 numbers first
3. **Personalize**: Use templates with placeholders
4. **Monitor**: Watch for WhatsApp rate limits
5. **Time Wisely**: Send during business hours (9 AM - 6 PM)

## Limitations

- **Free Tier**: Uses WhatsApp Web (personal account)
- **Rate Limits**: WhatsApp may limit bulk sending
- **Session**: Needs re-authentication periodically
- **Phone Required**: Must use a real phone number

## Session Management

The first time you run any command, you'll need to scan a QR code. After that, the session is saved locally and you won't need to scan again (unless you clear the `.wwebjs_auth` folder).

## Troubleshooting

### QR Code Not Appearing
- Check your internet connection
- Try running the command again
- Ensure nothing is blocking terminal output

### Messages Not Sending
- Check phone number format (must be international)
- Ensure recipient is saved in your WhatsApp contacts
- Verify your WhatsApp account is active
- Try increasing the delay between messages

### Session Expired
- Delete the `.wwebjs_auth` folder
- Run the command again and re-scan QR code

### WhatsApp Web Rate Limit
If you hit rate limits:
- Increase delay between messages (e.g., 10000ms or more)
- Send smaller batches
- Wait before resuming

## Integration with Existing System

Your system already extracts phone numbers from Instagram profiles. Use those phone lists:

```bash
# Use phone numbers from OCR results
node whatsapp-campaign.js send --file leads_phones_1234567890.txt --message-file templates/whatsapp/default.txt
```

## Next Steps

1. Test with your own phone number
2. Create custom message templates
3. Start with small batches (10-20 numbers)
4. Monitor response rates
5. Scale up gradually

Need help? Check the main project README or contact support.