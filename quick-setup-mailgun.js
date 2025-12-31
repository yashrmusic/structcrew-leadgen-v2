#!/usr/bin/env node

console.log('🚀 SETUP MAILGUN FOR MASS EMAILS');
console.log('='.repeat(60));

const fs = require('fs-extra');
const readline = require('readline');

async function setup() {
    console.log('\n📝 STEP 1: Get your Mailgun API Key\n');
    console.log('1. Go to: https://signup.mailgun.com/signup');
    console.log('2. Sign up for free account (no credit card needed)');
    console.log('3. Verify your email address');
    console.log('4. Go to: https://app.mailgun.com/app/dashboard');
    console.log('5. Click: "Sending" → "Domain settings"');
    console.log('6. Copy your Private API Key\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

    const apiKey = await question('Enter your Mailgun Private API Key: ');
    const domain = await question('Enter your Mailgun domain (or press Enter for sandbox): ');

    const mailgunConfig = {
        apiKey: apiKey.trim(),
        domain: domain.trim() || 'sandbox.mailgun.org',
        fromEmail: domain.trim() ? `info@${domain.trim()}` : 'structcrew@gmail.com'
    };

    const configPath = './email-config.json';
    let config = {};

    if (await fs.pathExists(configPath)) {
        config = await fs.readJson(configPath);
    } else {
        config = {
            smtpAccounts: [],
            fromName: 'StructCrew',
            fromEmail: 'structcrew@gmail.com',
            dailyLimit: 500,
            batchDelay: 5000,
            retryAttempts: 3,
            retryDelay: 10000,
            trackingEnabled: false
        };
    }

    config.mailgun = mailgunConfig;
    config.dailyLimit = 500;

    await fs.writeJson(configPath, config, { spaces: 2 });

    console.log('\n' + '='.repeat(60));
    console.log('✅ MAILGUN SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\nDomain: ${mailgunConfig.domain}`);
    console.log(`From Email: ${mailgunConfig.fromEmail}`);
    console.log(`Free Tier: 5,000 emails/month (~166/day)`);
    console.log(`Current Email List: 120 emails\n`);

    console.log('🚀 READY TO SEND MAILS!\n');

    console.log('Send all 120 emails:');
    console.log(`  node email-campaign.js send --provider mailgun \\`);
    console.log(`    -s "Connect with StructCrew - Architecture & Design Recruitment" \\`);
    console.log(`    -t structcrew-clean \\`);
    console.log(`    -e final_email_list.txt \\`);
    console.log(`    --limit 120\n`);

    console.log('Or use auto-provider selection (recommends best provider):');
    console.log(`  node email-campaign.js send --provider multi \\`);
    console.log(`    -s "Connect with StructCrew" \\`);
    console.log(`    -t structcrew-clean \\`);
    console.log(`    -e final_email_list.txt \\`);
    console.log(`    --limit 120\n`);

    console.log('Benefits of Mailgun:');
    console.log('  ✅ 5,000 free emails/month');
    console.log('  ✅ High delivery rate (85-90%)');
    console.log('  ✅ No daily limit (only monthly)');
    console.log('  ✅ Real-time analytics');
    console.log('  ✅ Bounce & complaint handling\n');

    console.log('Testing connection...');
    console.log('  Run: node email-campaign.js test\n');

    rl.close();
}

setup().catch(console.error);
