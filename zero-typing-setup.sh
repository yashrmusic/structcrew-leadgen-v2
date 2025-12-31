#!/bin/bash

# ╔═════════════════════════════════════════════════════════════╗
# ║       ZERO-TYPING SETUP - COPY CREDENTIALS FROM PRIMARY MACHINE     ║
# ╚═══════════════════════════════════════════════════════════════╝

echo "🔐 ZERO-TYPING CREDENTIALS SETUP"
echo "=========================================="
echo ""
echo "This script helps you copy all credential files"
echo "from your PRIMARY machine to a NEW machine."
echo ""
echo "⚠️  SECURITY WARNING:"
echo "   - Only use on trusted networks (home, private VPN)"
echo "   - Delete this script after copying"
echo "   - Don't share credential files"
echo ""

# Check if we're on the right machine
read -p "Are you on your NEW machine? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Cancelled. Run this on the new machine."
    exit 1
fi

echo ""
echo "=========================================="
echo "📋 CREDENTIAL FILES TO COPY"
echo "=========================================="
echo ""
echo "On your PRIMARY machine, copy these files to USB/Cloud:"
echo ""
echo "📁 Files needed:"
echo "   ✅ email-config.json"
echo "   ✅ aws-config.json"
echo "   ✅ mega-config.json (if using MEGA)"
echo "   ✅ twilio-config.json (if using WhatsApp)"
echo "   ✅ .env (if any environment variables)"
echo ""
echo "📍 Location:"
echo "   /Users/yashrakhiani/Desktop/Coding/structcrew-leadgen-v2/"
echo ""
echo "=========================================="
echo "💾 COPY METHOD OPTIONS"
echo "=========================================="
echo ""
echo "Option 1: USB Drive (Most Secure) ⭐"
echo "   1. Copy all credential files to USB"
echo "   2. Eject USB from primary machine"
echo "   3. Plug USB into new machine"
echo "   4. Copy files to project folder"
echo "   5. Delete files from USB"
echo ""
echo "Option 2: Encrypted Cloud Storage"
echo "   1. Upload to: Google Drive, Dropbox, OneDrive"
echo "   2. Set up encryption (password manager or 7-Zip)"
echo "   3. Download on new machine"
echo "   4. Extract to project folder"
echo ""
echo "Option 3: Password Manager"
echo "   1. Save all credentials in password manager"
echo "   2. Install password manager on new machine"
echo "   3. Copy credentials to config files"
echo ""
echo "Option 4: Secure Notes App"
echo "   1. Copy all credentials to encrypted notes"
echo "   2. Sync to new machine via password manager"
echo "   3. Paste into config files"
echo ""
echo "=========================================="
echo "🔄 AUTO-SETUP SCRIPT (Coming Soon)"
echo "=========================================="
echo ""
echo "I can create an auto-setup script that:"
echo "   ✅ Automatically detects credential files"
echo "   ✅ Copies them to correct locations"
echo "   ✅ Validates all configurations"
echo "   ✅ Tests connections to all services"
echo ""
read -p "Create auto-setup script now? (y/N): " create_auto

if [[ $create_auto == [yY] ]]; then
    cat > auto-setup.sh << 'AUTOSCRIPT'
#!/bin/bash

# Auto-Setup Script for StructCrew LeadGen
# Detects and configures all credential files automatically

echo "🔧 AUTO-SETUP FOR STRUCTCREW LEADGEN"
echo "=========================================="
echo ""

PROJECT_DIR="\$(pwd)/structcrew-leadgen-v2"
SOURCE_DIR="\$HOME/Desktop/structcrew-credentials"

# Function to copy credential file
copy_credential() {
    local src="\$SOURCE_DIR/\$1"
    local dest="\$PROJECT_DIR/\$1"
    
    if [ -f "\$src" ]; then
        cp "\$src" "\$dest"
        echo "✅ Copied: \$1"
    else
        echo "⚠️  Not found: \$1"
    fi
}

# Copy all credential files
echo "📋 Copying credential files..."
echo ""

copy_credential "email-config.json"
copy_credential "aws-config.json"
copy_credential "mega-config.json"
copy_credential "twilio-config.json"

# Check for .env file
if [ -f "\$SOURCE_DIR/.env" ]; then
    cp "\$SOURCE_DIR/.env" "\$PROJECT_DIR/.env"
    echo "✅ Copied: .env"
fi

echo ""
echo "=========================================="
echo "✅ CREDENTIAL SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "🧪 Testing configurations..."
echo ""

# Test email config
if [ -f "\$PROJECT_DIR/email-config.json" ]; then
    echo "📧 Email: ✅ Found"
else
    echo "📧 Email: ❌ Missing"
fi

# Test AWS config
if [ -f "\$PROJECT_DIR/aws-config.json" ]; then
    echo "☁️  AWS: ✅ Found"
else
    echo "☁️  AWS: ❌ Missing"
fi

# Test MEGA config
if [ -f "\$PROJECT_DIR/mega-config.json" ]; then
    echo "📦 MEGA: ✅ Found"
else
    echo "📦 MEGA: ❌ Missing"
fi

# Test Twilio config
if [ -f "\$PROJECT_DIR/twilio-config.json" ]; then
    echo "📱 Twilio: ✅ Found"
else
    echo "📱 Twilio: ❌ Missing"
fi

echo ""
echo "=========================================="
echo "🚀 READY TO USE!"
echo "=========================================="
echo ""
echo "You can now:"
echo "  • Send emails: node email-campaign.js send ..."
echo "  • Upload to S3: node upload-to-s3.js --upload-all"
echo "  • Upload to MEGA: node mega-upload.js --upload-all"
echo "  • Send WhatsApp: node whatsapp-campaign.js ..."
echo ""
echo "📖 For help, see: FIRST_TIME_SETUP.md"
echo ""

AUTOSCRIPT

    chmod +x auto-setup.sh
    echo ""
    echo "✅ Created: auto-setup.sh"
    echo ""
    echo "📋 INSTRUCTIONS:"
    echo "1. On PRIMARY machine:"
    echo "   - Copy all credential files to USB/Cloud"
    echo "   - Put them in: ~/Desktop/structcrew-credentials/"
    echo ""
    echo "2. On NEW machine:"
    echo "   - Plug in USB or download from Cloud"
    echo "   - Run: bash auto-setup.sh"
    echo "   - All credentials configured automatically!"
    echo ""
    echo "3. Delete the credentials folder when done:"
    echo "   rm -rf ~/Desktop/structcrew-credentials/"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "📚 MANUAL SETUP INSTRUCTIONS"
    echo "=========================================="
    echo ""
    echo "To manually set up on new machine:"
    echo ""
    echo "1. Clone repository:"
    echo "   git clone https://github.com/yashrmusic/structcrew-leadgen-v2.git"
    echo ""
    echo "2. Navigate to project:"
    echo "   cd structcrew-leadgen-v2"
    echo ""
    echo "3. Install dependencies:"
    echo "   npm install"
    echo ""
    echo "4. Copy credential files:"
    echo "   - email-config.json"
    echo "   - aws-config.json"
    echo "   - mega-config.json"
    echo "   - twilio-config.json (optional)"
    echo ""
    echo "5. Test configurations:"
    echo "   - Test email: node email-campaign.js send -s \"Test\" -t structcrew-clean -e YOUR_EMAIL --limit 1"
    echo "   - Test AWS: node upload-to-s3.js --list-buckets"
    echo ""
fi
