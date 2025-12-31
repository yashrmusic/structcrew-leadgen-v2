#!/usr/bin/env node

console.log('🚀 TOMORROW\'S EMAIL CAMPAIGN');
console.log('='.repeat(50));

const fs = require('fs-extra');

async function runCampaign() {
    const emailFile = 'leads_emails_1766693634324.txt';
    const subject = 'Connect with StructCrew - Architecture & Design Recruitment';
    
    if (!await fs.pathExists(emailFile)) {
        console.log(`❌ Email file not found: ${emailFile}`);
        console.log('Please run save-leads-tomorrow.js first.');
        process.exit(1);
    }
    
    const content = await fs.readFile(emailFile, 'utf8');
    const emails = content.split('\n').filter(e => e.trim());
    
    console.log(`\n📧 Campaign Details:`);
    console.log(`  Total emails: ${emails.length}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Template: structcrew-clean`);
    console.log(`  Batch delay: 5 seconds`);
    console.log(`  Daily limit: 500`);
    
    console.log(`\n⚠️  This will send emails to ${emails.length} recipients.`);
    console.log(`   Press Ctrl+C to cancel...\n`);
    
    const { spawn } = require('child_process');
    
    const process = spawn('node', ['email-campaign.js', 'send', 
        '-s', subject,
        '-t', 'structcrew-clean',
        '-e', emailFile
    ], {
        stdio: 'inherit'
    });
    
    process.on('close', (code) => {
        console.log(`\n${'='.repeat(50)}`);
        if (code === 0) {
            console.log('✅ Campaign completed!');
        } else {
            console.log(`❌ Campaign failed with code ${code}`);
        }
        console.log('='.repeat(50));
    });
}

runCampaign().catch(console.error);
