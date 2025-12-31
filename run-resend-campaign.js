#!/usr/bin/env node

const chalk = require('chalk');
const EmailSender = require('./src/server/email-sender-multi');
const fs = require('fs-extra');

async function sendWithResend() {
    const sender = new EmailSender();
    await sender.loadConfig();

    if (!sender.config.resend) {
        console.log(chalk.red.bold('\n❌ Resend not configured!'));
        console.log(chalk.yellow('\nAdd Resend to email-config.json:\n'));
        console.log(chalk.white('  "resend": {'));
        console.log(chalk.white('    "apiKey": "YOUR_API_KEY",'));
        console.log(chalk.white('    "fromEmail": "structcrew@gmail.com",'));
        console.log(chalk.white('    "dailyLimit": 100'));
        console.log(chalk.white('  }\n'));
        process.exit(1);
    }

    const emailFile = 'final_email_list.txt';

    if (!await fs.pathExists(emailFile)) {
        console.log(chalk.red(`\n❌ Email file not found: ${emailFile}`));
        process.exit(1);
    }

    const content = await fs.readFile(emailFile, 'utf8');
    const emails = content.split('\n').filter(e => e.trim() && e.includes('@'));

    const subject = 'Connect with StructCrew - Architecture & Design Recruitment';

    console.log(chalk.cyan.bold('\n🚀 RESEND EMAIL CAMPAIGN'));
    console.log(chalk.white('='.repeat(60)));
    console.log(chalk.cyan(`\n📧 Campaign Details:`));
    console.log(chalk.white(`   Provider: Resend`));
    console.log(chalk.white(`   From Email: ${sender.config.resend.fromEmail}`));
    console.log(chalk.white(`   Total Emails: ${emails.length}`));
    console.log(chalk.white(`   Subject: ${subject}`));
    console.log(chalk.white(`   Template: structcrew-clean\n`));

    console.log(chalk.cyan('✅ Resend Benefits:'));
    console.log(chalk.white('   - 3,000 free emails/month'));
    console.log(chalk.white('   - High delivery rate (90%+)'));
    console.log(chalk.white('   - Real-time analytics'));
    console.log(chalk.white('   - DKIM, SPF, DMARC configured\n'));

    console.log(chalk.yellow(`⚠️  This will send emails to ${emails.length} recipients.`));
    console.log(chalk.yellow(`   Press Ctrl+C to cancel...\n`));

    await new Promise(resolve => setTimeout(resolve, 2000));

    const results = await sender.sendBatch(
        emails,
        subject,
        '',
        {
            template: 'structcrew-clean',
            provider: 'resend'
        }
    );

    console.log(`\n${chalk.cyan('='.repeat(60))}`);
    console.log(chalk.cyan.bold('📊 CAMPAIGN RESULTS'));
    console.log(chalk.cyan('='.repeat(60) + '\n'));
    console.log(chalk.green(`✅ Sent: ${results.sent.length}`));
    console.log(chalk.red(`❌ Failed: ${results.failed.length}`));
    console.log(chalk.yellow(`⏭️  Skipped: ${results.skipped.length}\n`));

    if (results.failed.length > 0) {
        console.log(chalk.red.bold('Failed Emails:'));
        results.failed.slice(0, 10).forEach(f => {
            console.log(chalk.red(`  - ${f.email}: ${f.error}`));
        });
        if (results.failed.length > 10) {
            console.log(chalk.red(`  ... and ${results.failed.length - 10} more`));
        }
        console.log();
    }

    console.log(chalk.cyan('='.repeat(60)));
    console.log(chalk.cyan.bold('✅ CAMPAIGN COMPLETE!'));
    console.log(chalk.cyan('='.repeat(60)));

    console.log(chalk.white('\n💡 Track emails in Resend Dashboard:'));
    console.log(chalk.white('   https://resend.com/dashboard\n'));

    if (results.sent.length === emails.length) {
        console.log(chalk.green.bold('\n🎉 All emails sent successfully!\n'));
    }
}

sendWithResend().catch(error => {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
});
