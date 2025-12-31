const fs = require('fs-extra');
const readline = require('readline');

async function setupMailgun() {
    console.log('🔫 MAILGUN SETUP');
    console.log('='.repeat(50));
    console.log('\n1. Go to https://signup.mailgun.com and create free account');
    console.log('2. Verify your email address');
    console.log('3. Go to Dashboard → API Keys');
    console.log('4. Copy your Private API Key\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

    const apiKey = await question('Enter your Mailgun API Key: ');
    const domain = await question('Enter your Mailgun domain (or press Enter for sandbox): ');

    const mailgunConfig = {
        apiKey: apiKey.trim(),
        domain: domain.trim() || 'sandbox.mailgun.org',
        fromEmail: domain.trim() ? `info@${domain.trim()}` : 'structcrew@gmail.com',
        dailyLimit: 166
    };

    const configPath = './email-config.json';
    let config = {
        smtpAccounts: [],
        fromName: 'StructCrew',
        fromEmail: 'structcrew@gmail.com',
        dailyLimit: 500,
        batchDelay: 5000,
        retryAttempts: 3,
        retryDelay: 10000,
        trackingEnabled: false
    };

    if (await fs.pathExists(configPath)) {
        config = await fs.readJson(configPath);
    }

    config.mailgun = mailgunConfig;

    await fs.writeJson(configPath, config, { spaces: 2 });

    console.log('\n✅ Mailgun configured successfully!');
    console.log(`   Domain: ${mailgunConfig.domain}`);
    console.log(`   Daily Limit: ${mailgunConfig.dailyLimit} emails`);
    console.log(`   Free Tier: 5,000 emails/month\n`);

    console.log('💡 Now you can send emails using Mailgun:');
    console.log('   node email-campaign.js send --provider mailgun -s "Subject" -t structcrew-clean -e final_email_list.txt\n');

    rl.close();
}

setupMailgun().catch(console.error);
