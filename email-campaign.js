#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const Table = require('cli-table3');
const EmailSender = require('./src/server/email-sender-multi');
const GoogleSheetsStorage = require('./src/server/google-sheets');
const fs = require('fs-extra');
const path = require('path');

const program = new Command();

program
    .name('email-campaign')
    .description('StructCrew Email Marketing CLI')
    .version('1.0.0');

program
    .command('config')
    .description('Configure email settings')
    .option('--add-smtp', 'Add SMTP account')
    .option('--list', 'List current configuration')
    .option('--from-name <name>', 'Set sender name')
    .option('--from-email <email>', 'Set sender email')
    .option('--daily-limit <number>', 'Set daily email limit')
    .action(async (options) => {
        const configPath = path.join(process.cwd(), 'email-config.json');

        let config = {
            smtpAccounts: [],
            fromName: 'StructCrew',
            fromEmail: '',
            dailyLimit: 500,
            batchDelay: 5000,
            retryAttempts: 3,
            retryDelay: 10000,
            trackingEnabled: false
        };

        if (await fs.pathExists(configPath)) {
            config = await fs.readJson(configPath);
        }

        if (options.addSmtp) {
            console.log(chalk.cyan.bold('\n📧 Adding SMTP Account\n'));

            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

            const host = await question('SMTP Host (e.g., smtp.gmail.com): ');
            const port = await question('SMTP Port (e.g., 587): ');
            const user = await question('Email/Username: ');
            const pass = await question('Password/App Password: ');
            const secure = (await question('Use SSL/TLS? (y/n): ')).toLowerCase() === 'y';

            config.smtpAccounts.push({
                email: user,
                host,
                port: parseInt(port),
                secure
            });

            await fs.writeJson(configPath, config, { spaces: 2 });

            console.log(chalk.green('\n✅ SMTP account added successfully!\n'));
            console.log(chalk.white('💡 Tip: For Gmail, use App Passwords: https://myaccount.google.com/apppasswords'));
            console.log(chalk.white('💡 For high volume, use multiple SMTP accounts for rotation.\n'));

            rl.close();
        } else if (options.fromName) {
            config.fromName = options.fromName;
            await fs.writeJson(configPath, config, { spaces: 2 });
            console.log(chalk.green(`✅ From name set to: ${options.fromName}\n`));
        } else if (options.fromEmail) {
            config.fromEmail = options.fromEmail;
            await fs.writeJson(configPath, config, { spaces: 2 });
            console.log(chalk.green(`✅ From email set to: ${options.fromEmail}\n`));
        } else if (options.dailyLimit) {
            config.dailyLimit = parseInt(options.dailyLimit);
            await fs.writeJson(configPath, config, { spaces: 2 });
            console.log(chalk.green(`✅ Daily limit set to: ${options.dailyLimit}\n`));
        } else if (options.list) {
            console.log(chalk.cyan.bold('\n📋 Current Configuration\n'));

            console.log(chalk.white('From Name:') + ` ${config.fromName}`);
            console.log(chalk.white('From Email:') + ` ${config.fromEmail || 'Not set'}`);
            console.log(chalk.white('Daily Limit:') + ` ${config.dailyLimit}`);
            console.log(chalk.white('Batch Delay:') + ` ${config.batchDelay}ms`);
            console.log(chalk.white('Retry Attempts:') + ` ${config.retryAttempts}`);
            console.log(chalk.white('SMTP Accounts:') + ` ${config.smtpAccounts.length}`);

            if (config.smtpAccounts.length > 0) {
                console.log(chalk.cyan('\nSMTP Accounts:'));
                config.smtpAccounts.forEach((acc, i) => {
                    console.log(`  ${i + 1}. ${acc.email} (${acc.host}:${acc.port})`);
                });
            }

            console.log();
        } else {
            console.log(chalk.cyan.bold('\n📋 Current Configuration\n'));

            console.log(chalk.white('From Name:') + ` ${config.fromName}`);
            console.log(chalk.white('From Email:') + ` ${config.fromEmail || 'Not set'}`);
            console.log(chalk.white('Daily Limit:') + ` ${config.dailyLimit}`);
            console.log(chalk.white('Batch Delay:') + ` ${config.batchDelay}ms`);
            console.log(chalk.white('Retry Attempts:') + ` ${config.retryAttempts}`);
            console.log(chalk.white('SMTP Accounts:') + ` ${config.smtpAccounts.length}`);

            if (config.smtpAccounts.length > 0) {
                console.log(chalk.cyan('\nSMTP Accounts:'));
                config.smtpAccounts.forEach((acc, i) => {
                    console.log(`  ${i + 1}. ${acc.email} (${acc.host}:${acc.port})`);
                });
            }

            console.log();
            console.log(chalk.yellow('Use options to modify configuration:'));
            console.log(chalk.white('  --add-smtp      Add SMTP account'));
            console.log(chalk.white('  --from-name      Set sender name'));
            console.log(chalk.white('  --from-email     Set sender email'));
            console.log(chalk.white('  --daily-limit    Set daily limit\n'));
        }
    });

program
    .command('test')
    .description('Test SMTP connection')
    .action(async () => {
        const sender = new EmailSender();
        await sender.loadConfig();

        console.log(chalk.cyan.bold('\n🔌 Testing SMTP Connections\n'));

        await sender.testConnection();
        console.log();
    });

program
    .command('send')
    .description('Send email campaign')
    .requiredOption('-s, --subject <subject>', 'Email subject line')
    .option('-t, --template <name>', 'Use email template (intro/outreach/structcrew-clean)')
    .option('-e, --emails <file>', 'Email list file (one per line)')
    .option('-g, --google-sheets <id>', 'Fetch emails from Google Sheet')
    .option('--creds <path>', 'Path to Google credentials', './google-credentials.json')
    .option('-b, --business-type <type>', 'Filter by business type')
    .option('--status <status>', 'Filter by status (New/Contacted/Replied)')
    .option('-n, --dry-run', 'Test without actually sending')
    .option('-l, --limit <number>', 'Limit number of emails', '50')
    .option('-p, --provider <name>', 'Email provider (smtp/mailgun/resend/multi)', 'multi')
    .action(async (options) => {
        const sender = new EmailSender();
        await sender.loadConfig();

        console.log(chalk.cyan.bold(`\n📧 EMAIL CAMPAIGN`));
        console.log(chalk.white(`Subject: ${options.subject}`));
        console.log(chalk.white(`Template: ${options.template || 'None'}\n`));

        let emails = [];

        if (options.emails) {
            if (!await fs.pathExists(options.emails)) {
                console.log(chalk.red(`❌ Email file not found: ${options.emails}\n`));
                process.exit(1);
            }

            const content = await fs.readFile(options.emails, 'utf8');
            emails = content.split('\n').map(e => e.trim()).filter(e => e && e.includes('@'));
            console.log(chalk.cyan(`Loaded ${emails.length} emails from file\n`));

        } else if (options.googleSheets) {
            if (!await fs.pathExists(options.creds)) {
                console.log(chalk.red(`❌ Google credentials not found: ${options.creds}\n`));
                process.exit(1);
            }

            const sheets = new GoogleSheetsStorage(options.googleSheets, options.creds);
            await sheets.connect();

            console.log(chalk.cyan('Fetching leads from Google Sheets...\n'));

            const leads = await sheets.getAllLeads();
            let filteredLeads = leads.filter(l => l['Email'] && l['Email'].includes('@'));

            if (options.businessType) {
                filteredLeads = filteredLeads.filter(l => 
                    l['Business Type'] && l['Business Type'].toLowerCase().includes(options.businessType.toLowerCase())
                );
            }

            if (options.status) {
                filteredLeads = filteredLeads.filter(l => 
                    l['Status'] && l['Status'].toLowerCase() === options.status.toLowerCase()
                );
            }

            emails = filteredLeads.map(l => ({
                email: l['Email'],
                companyName: l['Company Name'],
                businessType: l['Business Type'],
                phone: l['Phone'],
                instagramHandle: l['Instagram Handle']
            }));

            console.log(chalk.cyan(`Found ${leads.length} total leads`));
            console.log(chalk.cyan(`Filtered to ${emails.length} leads\n`));

            if (emails.length === 0) {
                console.log(chalk.yellow('No leads match the criteria.\n'));
                process.exit(0);
            }

            const table = new Table({
                head: [chalk.cyan('Email'), chalk.cyan('Company'), chalk.cyan('Type')],
                colWidths: [35, 20, 20]
            });

            emails.slice(0, 5).forEach(e => {
                table.push([e.email.substring(0, 33), e.companyName || '-', e.businessType || '-']);
            });

            if (emails.length > 5) {
                table.push(['...', `and ${emails.length - 5} more`, '']);
            }

            console.log(table.toString());
        }

        const limit = Math.min(parseInt(options.limit), emails.length);
        const emailsToSend = emails.slice(0, limit);

        console.log(chalk.white(`\nSending to ${emailsToSend.length} emails (dry-run: ${options.dryRun})\n`));

        if (!options.dryRun) {
            const content = options.template ? null : '';
            const sendOptions = options.template ? { template: options.template } : {};

            const results = await sender.sendBatch(emailsToSend, options.subject, content, sendOptions);

            console.log(`\n${'='.repeat(60)}`);
            console.log(chalk.green.bold(`📊 CAMPAIGN RESULTS`));
            console.log(`${'='.repeat(60)}\n`);
            console.log(chalk.cyan(`Sent:`) + ` ${results.sent.length}`);
            console.log(chalk.red(`Failed:`) + ` ${results.failed.length}`);
            console.log(chalk.yellow(`Skipped:`) + ` ${results.skipped.length}\n`);

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
        } else {
            console.log(chalk.yellow('🔍 DRY RUN - No emails actually sent\n'));
            emailsToSend.forEach(e => {
                console.log(chalk.white(`  Would send to: ${e.email || e}`));
            });
            console.log();
        }
    });

program
    .command('history')
    .description('View email sending history')
    .option('-n, --number <n>', 'Number of recent entries', '20')
    .action(async (options) => {
        const sender = new EmailSender();
        await sender.loadConfig();

        const history = await sender.getHistory(parseInt(options.number));

        if (history.length === 0) {
            console.log(chalk.yellow('\nNo email history found.\n'));
            process.exit(0);
        }

        const table = new Table({
            head: [chalk.cyan('Date'), chalk.cyan('To'), chalk.cyan('Subject'), chalk.cyan('Status')],
            colWidths: [12, 30, 25, 10]
        });

        history.forEach(h => {
            const date = h.date || h.timestamp?.split('T')[0] || '';
            table.push([date, h.to.substring(0, 28), h.subject.substring(0, 23), h.status]);
        });

        console.log(chalk.cyan.bold('\n📧 Email History\n'));
        console.log(table.toString());
        console.log();
    });

program
    .command('stats')
    .description('View email statistics')
    .action(async () => {
        const sender = new EmailSender();
        await sender.loadConfig();

        const stats = sender.getStats();
        const sentToday = await sender.getSentToday();
        const history = await sender.getHistory(1000);

        const uniqueRecipients = new Set(history.filter(h => h.status === 'sent').map(h => h.to)).size;
        const uniqueFailed = new Set(history.filter(h => h.status === 'failed').map(h => h.to)).size;

        console.log(chalk.cyan.bold('\n📊 Email Statistics\n'));
        console.log(chalk.cyan('Current Session:'));
        console.log(`  Sent: ${stats.sent}`);
        console.log(`  Failed: ${stats.failed}`);
        console.log(`  Bounced: ${stats.bounced}\n`);

        console.log(chalk.cyan('All-Time:'));
        console.log(`  Total sent today: ${sentToday}`);
        console.log(`  Unique recipients: ${uniqueRecipients}`);
        console.log(`  Unique failed: ${uniqueFailed}\n`);

        const config = sender.config;
        console.log(chalk.cyan('Quota:'));
        console.log(`  Daily limit: ${config.dailyLimit}`);
        console.log(`  Remaining: ${Math.max(0, config.dailyLimit - sentToday)}\n`);
    });

program.parse();