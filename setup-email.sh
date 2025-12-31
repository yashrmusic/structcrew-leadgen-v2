#!/bin/bash

echo "📧 EMAIL SETUP WIZARD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Step 1: Enter your Gmail address"
read -p "Gmail address: " EMAIL

echo ""
echo "Step 2: Enter your Gmail App Password"
echo "(Get it from: https://myaccount.google.com/apppasswords)"
read -s -p "App Password: " PASSWORD
echo ""

echo ""
echo "Step 3: Updating email-config.json..."

# Create the config file
cat > email-config.json << EOF
{
  "smtpAccounts": [
    {
      "email": "$EMAIL",
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "pass": "$PASSWORD"
    }
  ],
  "fromName": "StructCrew",
  "fromEmail": "$EMAIL",
  "dailyLimit": 500,
  "batchDelay": 5000,
  "retryAttempts": 3,
  "retryDelay": 10000,
  "trackingEnabled": false
}
EOF

echo "✅ Configuration updated!"
echo ""
echo "Email: $EMAIL"
echo "Password: [HIDDEN]"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing connection..."
echo ""

# Test the connection
node email-campaign.js test

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo ""
echo "You can now send emails with:"
echo "  email-campaign send --subject 'Test' --emails demo_emails.txt --limit 1"
echo ""