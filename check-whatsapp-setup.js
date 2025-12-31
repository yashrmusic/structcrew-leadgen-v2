#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

console.log('📱 WhatsApp Marketing System Check');
console.log('===================================\n');

const checks = [];

async function runChecks() {
    // Check if whatsapp-web.js is installed
    try {
        require('whatsapp-web.js');
        checks.push({ name: 'whatsapp-web.js', status: '✅ Installed' });
    } catch (e) {
        checks.push({ name: 'whatsapp-web.js', status: '❌ Not installed' });
    }

    // Check if qrcode-terminal is installed
    try {
        require('qrcode-terminal');
        checks.push({ name: 'qrcode-terminal', status: '✅ Installed' });
    } catch (e) {
        checks.push({ name: 'qrcode-terminal', status: '❌ Not installed' });
    }

    // Check WhatsApp sender file
    if (await fs.pathExists('whatsapp-sender.js')) {
        checks.push({ name: 'whatsapp-sender.js', status: '✅ Exists' });
    } else {
        checks.push({ name: 'whatsapp-sender.js', status: '❌ Not found' });
    }

    // Check WhatsApp campaign file
    if (await fs.pathExists('whatsapp-campaign.js')) {
        checks.push({ name: 'whatsapp-campaign.js', status: '✅ Exists' });
    } else {
        checks.push({ name: 'whatsapp-campaign.js', status: '❌ Not found' });
    }

    // Check config file
    if (await fs.pathExists('whatsapp-config.json')) {
        checks.push({ name: 'whatsapp-config.json', status: '✅ Exists' });
    } else {
        checks.push({ name: 'whatsapp-config.json', status: '❌ Not found' });
    }

    // Check templates directory
    if (await fs.pathExists('templates/whatsapp')) {
        checks.push({ name: 'templates/whatsapp', status: '✅ Exists' });
    } else {
        checks.push({ name: 'templates/whatsapp', status: '❌ Not found' });
    }

    // Check default template
    if (await fs.pathExists('templates/whatsapp/default.txt')) {
        checks.push({ name: 'default.txt template', status: '✅ Exists' });
    } else {
        checks.push({ name: 'default.txt template', status: '❌ Not found' });
    }

    // Print results
    checks.forEach(check => {
        console.log(`${check.status.padEnd(20)} ${check.name}`);
    });

    const allPassed = checks.every(c => c.status.includes('✅'));

    console.log('\n' + '='.repeat(40));
    if (allPassed) {
        console.log('✅ All checks passed! Ready to use.\n');
        console.log('Quick Start:');
        console.log('1. Link your WhatsApp:');
        console.log('   node whatsapp-campaign.js test --phone YOUR_NUMBER\n');
        console.log('2. Send bulk messages:');
        console.log('   node whatsapp-campaign.js send --file phones.txt --message "Hello!"\n');
        console.log('For more info, see WHATSAPP_SETUP.md');
    } else {
        console.log('❌ Some checks failed. Please fix the issues above.\n');
        console.log('To install missing dependencies:');
        console.log('npm install whatsapp-web.js qrcode-terminal');
    }

    process.exit(allPassed ? 0 : 1);
}

runChecks();