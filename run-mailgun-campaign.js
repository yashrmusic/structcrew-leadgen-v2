#!/usr/bin/env node

const chalk = require('chalk');
const EmailSender = require('./src/server/email-sender-multi');
const fs = require('fs-extra');

async function sendWithMailgun() {
    const sender = new EmailSender();
    await sender.loadConfig();

    if (!sender.config.mailgun) {
        console.log(chalk.red.bold('\n❌ Mailgun not configured!'));
        console.log(chalk.yellow('\nRun this to setup Mailgun:\n'));
        console.log(chalk.white('  node quick-setup-mailgun.js\n'));
        process.exit(1);
    }

    const emailFile = 'final_email_list.txt';

    if (!await fs.pathExists(emailFile)) {
        console.log(chalk.red(`\n❌ Email file not found: ${emailFile}`));
        console.log(chalk.yellow('\nRun this to create email list:\n'));
        console.log(chalk.white('  node save-leads-tomorrow.js\n'));
        process.exit(1);
    }

    const content = await fs.readFile(emailFile, 'utf8');
    const emails = content.split('\n').filter(e => e.trim() && e.includes('@'));

    const subject = 'Connect with StructCrew - Architecture & Design Recruitment';

    console.log(chalk.cyan.bold('\n🚀 MAILGUN EMAIL CAMPAIGN'));
    console.log(chalk.white('='.repeat(60)));
    console.log(chalk.cyan(`\n📧 Campaign Details:`));
    console.log(chalk.white(`   Provider: Mailgun (${sender.config.mailgun.domain})`));
    console.log(chalk.white(`   From Email: ${sender.config.mailgun.fromEmail}`));
    console.log(chalk.white(`   Total Emails: ${emails.length}`));
    console.log(chalk.white(`   Subject: ${subject}`));
    console.log(chalk.white(`   Template: structcrew-clean\n`));

    console.log(chalk.cyan('✅ Mailgun Benefits:'));
    console.log(chalk.white('   - 5,000 free emails/month'));
    console.log(chalk.white('   - High delivery rate (85-90%)'));
    console.log(chalk.white('   - Real-time analytics'));
    console.log(chalk.white('   - No daily limit\n'));

    console.log(chalk.yellow(`⚠️  This will send emails to ${emails.length} recipients.`));
    console.log(chalk.yellow(`   Press Ctrl+C to cancel...\n`));

    await new Promise(resolve => setTimeout(resolve, 2000));

    const results = await sender.sendBatch(
        emails,
        subject,
        '',
        {
            template: 'structcrew-clean',
            provider: 'mailgun'
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

    console.log(chalk.white('\n💡 View detailed history:'));
    console.log(chalk.white('   node email-campaign.js history\n'));

    console.log(chalk.white('💡 View statistics:'));
    console.log(chalk.white('   node email-campaign.js stats\n'));

    console.log(chalk.white('💡 Track emails in Mailgun Dashboard:'));
    console.log(chalk.white('   https://app.mailgun.com/app/dashboard\n'));

    if (results.sent.length === emails.length) {
        console.log(chalk.green.bold('\n🎉 All emails sent successfully!\n'));
    }
}

sendWithMailgun().catch(error => {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
});
