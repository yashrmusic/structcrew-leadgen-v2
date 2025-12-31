#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

console.log('📱 Twilio WhatsApp Marketing System Check');
console.log('==========================================\n');

const checks = [];

async function runChecks() {
    // Check if twilio is installed
    try {
        require('twilio');
        checks.push({ name: 'twilio package', status: '✅ Installed' });
    } catch (e) {
        checks.push({ name: 'twilio package', status: '❌ Not installed' });
    }

    // Check Twilio sender file
    if (await fs.pathExists('twilio-sender.js')) {
        checks.push({ name: 'twilio-sender.js', status: '✅ Exists' });
    } else {
        checks.push({ name: 'twilio-sender.js', status: '❌ Not found' });
    }

    // Check Twilio campaign file
    if (await fs.pathExists('twilio-campaign.js')) {
        checks.push({ name: 'twilio-campaign.js', status: '✅ Exists' });
    } else {
        checks.push({ name: 'twilio-campaign.js', status: '❌ Not found' });
    }

    // Check config file
    if (await fs.pathExists('twilio-config.json')) {
        try {
            const config = require('./twilio-config.json');
            if (config.accountSid && config.authToken && config.fromNumber) {
                checks.push({ name: 'twilio-config.json', status: '✅ Configured' });
                checks.push({ name: 'Account SID', status: `✅ ${config.accountSid.substring(0, 15)}...` });
                checks.push({ name: 'From Number', status: `✅ ${config.fromNumber}` });
            } else {
                checks.push({ name: 'twilio-config.json', status: '❌ Incomplete config' });
            }
        } catch (e) {
            checks.push({ name: 'twilio-config.json', status: '❌ Invalid JSON' });
        }
    } else {
        checks.push({ name: 'twilio-config.json', status: '❌ Not found' });
    }

    // Check templates directory
    if (await fs.pathExists('templates/whatsapp')) {
        checks.push({ name: 'templates/whatsapp', status: '✅ Exists' });
        
        // Check default template
        if (await fs.pathExists('templates/whatsapp/default.txt')) {
            checks.push({ name: 'default.txt template', status: '✅ Exists' });
        } else {
            checks.push({ name: 'default.txt template', status: '⚠️  Not found (optional)' });
        }
        
        // Check twilio template
        if (await fs.pathExists('templates/whatsapp/twilio-default.txt')) {
            checks.push({ name: 'twilio-default.txt template', status: '✅ Exists' });
        } else {
            checks.push({ name: 'twilio-default.txt template', status: '⚠️  Not found (optional)' });
        }
    } else {
        checks.push({ name: 'templates/whatsapp', status: '⚠️  Not found (optional)' });
    }

    // Print results
    checks.forEach(check => {
        console.log(`${check.status.padEnd(20)} ${check.name}`);
    });

    const hasErrors = checks.some(c => c.status.includes('❌'));

    console.log('\n' + '='.repeat(40));
    if (!hasErrors) {
        console.log('✅ All critical checks passed! Ready to use.\n');
        console.log('Quick Start:');
        console.log('1. Join the sandbox:');
        console.log('   Send "join +17656256033" to +17656256033 on WhatsApp\n');
        console.log('2. Test your setup:');
        console.log('   node twilio-campaign.js test --phone YOUR_NUMBER\n');
        console.log('3. Send bulk messages:');
        console.log('   node twilio-campaign.js send --file phones.txt --message "Hello!"\n');
        console.log('For more info, see TWILIO_SETUP.md');
    } else {
        console.log('❌ Some checks failed. Please fix the issues above.\n');
        console.log('To install missing dependencies:');
        console.log('npm install twilio');
    }

    process.exit(hasErrors ? 1 : 0);
}

runChecks();