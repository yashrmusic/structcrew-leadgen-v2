#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs-extra');
const validator = require('email-validator');
const EmailSender = require('./src/server/email-sender-multi');

async function fullSystemCheck() {
    console.log(chalk.cyan.bold('\n🔍 COMPLETE SYSTEM CHECK'));
    console.log(chalk.white('='.repeat(60)));

    let allPassed = true;

    console.log(chalk.cyan('\n📧 Step 1: Email Configuration Check'));
    console.log(chalk.white('-'.repeat(60)));

    try {
        const configPath = './email-config.json';
        if (!(await fs.pathExists(configPath))) {
            console.log(chalk.red('❌ email-config.json not found'));
            allPassed = false;
        } else {
            const config = await fs.readJson(configPath);
            console.log(chalk.green('✅ Config file exists'));
            console.log(chalk.white('   From Name: ' + config.fromName));
            console.log(chalk.white('   From Email: ' + config.fromEmail));
            console.log(chalk.white('   Daily Limit: ' + config.dailyLimit));

            if (config.smtpAccounts && config.smtpAccounts.length > 0) {
                console.log(chalk.green('✅ SMTP Accounts: ' + config.smtpAccounts.length));
                config.smtpAccounts.forEach((acc, i) => {
                    console.log(chalk.white('   ' + (i + 1) + '. ' + acc.email + ' (' + acc.host + ':' + acc.port + ')'));
                });
            } else {
                console.log(chalk.yellow('⚠️  No SMTP accounts configured'));
            }

            if (config.mailgun) {
                console.log(chalk.green('✅ Mailgun configured: ' + config.mailgun.domain));
            } else {
                console.log(chalk.yellow('⚠️  Mailgun not configured'));
                console.log(chalk.white('   Setup: node quick-setup-mailgun.js'));
            }
        }
    } catch (error) {
        console.log(chalk.red('❌ Config check failed: ' + error.message));
        allPassed = false;
    }

    console.log(chalk.cyan('\n📋 Step 2: Email List Check'));
    console.log(chalk.white('-'.repeat(60)));

    try {
        const emailFile = 'final_email_list.txt';
        if (!(await fs.pathExists(emailFile))) {
            console.log(chalk.red('❌ final_email_list.txt not found'));
            allPassed = false;
        } else {
            const content = await fs.readFile(emailFile, 'utf8');
            const emails = content.split('\n').filter(e => e.trim());

            console.log(chalk.green('✅ Email file exists'));
            console.log(chalk.white('   Total emails: ' + emails.length));

            const validEmails = emails.filter(e => validator.validate(e.trim()));
            const invalidEmails = emails.filter(e => !validator.validate(e.trim()));

            console.log(chalk.green('   Valid emails: ' + validEmails.length));

            if (validEmails.length === 0) {
                console.log(chalk.red('❌ No valid emails to send!'));
                allPassed = false;
            } else {
                console.log(chalk.white('\n   Sample emails:'));
                validEmails.slice(0, 5).forEach(e => {
                    console.log(chalk.white('     ' + e));
                });
                if (validEmails.length > 5) {
                    console.log(chalk.white('     ... and ' + (validEmails.length - 5) + ' more'));
                }
            }
        }
    } catch (error) {
        console.log(chalk.red('❌ Email list check failed: ' + error.message));
        allPassed = false;
    }

    console.log(chalk.cyan('\n📄 Step 3: Template Check'));
    console.log(chalk.white('-'.repeat(60)));

    try {
        const templateFile = './templates/structcrew-clean.html';
        if (!(await fs.pathExists(templateFile))) {
            console.log(chalk.red('❌ Template not found: structcrew-clean.html'));
            allPassed = false;
        } else {
            const templateContent = await fs.readFile(templateFile, 'utf8');
            console.log(chalk.green('✅ Template exists: structcrew-clean.html'));
            console.log(chalk.white('   File size: ' + Math.round(templateContent.length / 1024) + ' KB'));
        }
    } catch (error) {
        console.log(chalk.red('❌ Template check failed: ' + error.message));
        allPassed = false;
    }

    console.log(chalk.cyan('\n🔌 Step 4: Connection Test'));
    console.log(chalk.white('-'.repeat(60)));

    try {
        const sender = new EmailSender();
        await sender.loadConfig();

        const results = await sender.testConnection();

        const hasWorkingProvider = results.some(r => r.status === 'connected' || r.status === 'ready');

        if (hasWorkingProvider) {
            console.log(chalk.green('✅ At least one provider is working'));
        } else {
            console.log(chalk.red('❌ No working providers found'));
            allPassed = false;
        }
    } catch (error) {
        console.log(chalk.red('❌ Connection test failed: ' + error.message));
        allPassed = false;
    }

    console.log(chalk.cyan('\n📊 Step 5: System Status'));
    console.log(chalk.white('-'.repeat(60)));

    try {
        const historyFile = './email-history.json';
        if (await fs.pathExists(historyFile)) {
            const history = await fs.readJson(historyFile);
            const today = new Date().toISOString().split('T')[0];
            const sentToday = history.filter(h => h.date === today && h.status === 'sent').length;
            const failedToday = history.filter(h => h.date === today && h.status === 'failed').length;

            console.log(chalk.white('   Emails sent today: ' + sentToday));
            console.log(chalk.white('   Emails failed today: ' + failedToday));

            if (sentToday >= 500) {
                console.log(chalk.yellow('⚠️  Gmail daily limit reached!'));
                console.log(chalk.white('   Use Mailgun to send more emails: node quick-setup-mailgun.js'));
            }
        } else {
            console.log(chalk.yellow('⚠️  No email history found'));
        }
    } catch (error) {
        console.log(chalk.yellow('⚠️  Could not check history: ' + error.message));
    }

    console.log(chalk.cyan('\n✅ FINAL RESULT'));
    console.log(chalk.white('='.repeat(60)));

    if (allPassed) {
        console.log(chalk.green.bold('\n🎉 ALL SYSTEMS READY!\n'));
        console.log(chalk.white('Ready to send email campaign:'));
        console.log(chalk.cyan('  node run-mailgun-campaign.js\n'));
    } else {
        console.log(chalk.red.bold('\n⚠️  SOME ISSUES FOUND\n'));
        console.log(chalk.white('Please fix issues above before sending.\n'));
        console.log(chalk.cyan('Quick Fixes:'));
        console.log(chalk.white('  • Setup Mailgun: node quick-setup-mailgun.js'));
        console.log(chalk.white('  • Test connection: node email-campaign.js test'));
        console.log(chalk.white('  • View history: node email-campaign.js history'));
        console.log(chalk.white('  • View stats: node email-campaign.js stats\n'));
    }

    console.log(chalk.white('='.repeat(60)) + '\n');
}

fullSystemCheck().catch(error => {
    console.error(chalk.red('\n❌ System check failed: '), error.message);
    process.exit(1);
});
