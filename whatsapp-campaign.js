#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const WhatsAppSender = require('./whatsapp-sender');

program
    .name('whatsapp-campaign')
    .description('WhatsApp marketing campaign tool')
    .version('1.0.0');

program
    .command('send')
    .description('Send bulk WhatsApp messages')
    .option('-f, --file <path>', 'File containing phone numbers (one per line)')
    .option('-m, --message <text>', 'Message to send')
    .option('-d, --delay <ms>', 'Delay between messages in ms (default: 5000)', '5000')
    .option('--message-file <path>', 'File containing message template')
    .action(async (options) => {
        try {
            let phones = [];
            let message = options.message;

            if (!options.file) {
                console.error('❌ Error: Please provide a phone number file with --file');
                process.exit(1);
            }

            if (!message && !options.messageFile) {
                console.error('❌ Error: Please provide a message with --message or --message-file');
                process.exit(1);
            }

            if (options.messageFile) {
                message = await fs.readFile(options.messageFile, 'utf-8');
            }

            phones = (await fs.readFile(options.file, 'utf-8'))
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (phones.length === 0) {
                console.error('❌ Error: No phone numbers found in file');
                process.exit(1);
            }

            console.log('📱 WhatsApp Marketing Campaign');
            console.log('================================\n');
            console.log(`📊 Numbers to send: ${phones.length}`);
            console.log(`⏱️  Delay: ${options.delay}ms (${options.delay / 1000}s)`);
            console.log(`📝 Message preview:\n${message.substring(0, 200)}${message.length > 200 ? '...' : ''}\n`);

            const sender = new WhatsAppSender();
            await sender.initialize();

            const results = await sender.sendBulkMessages(
                phones,
                message,
                parseInt(options.delay)
            );

            console.log('\n📊 Campaign Results');
            console.log('==================');
            console.log(`✅ Sent: ${results.sent}`);
            console.log(`❌ Failed: ${results.failed}`);
            console.log(`📈 Success rate: ${((results.sent / phones.length) * 100).toFixed(2)}%`);

            if (results.errors.length > 0) {
                const errorFile = `whatsapp_errors_${Date.now()}.txt`;
                await fs.writeFile(
                    errorFile,
                    results.errors.map(e => `${e.phoneNumber}: ${e.error}`).join('\n')
                );
                console.log(`\n📄 Errors saved to: ${errorFile}`);
            }

            await sender.destroy();
            process.exit(0);

        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

program
    .command('interactive')
    .description('Interactive mode to send messages')
    .action(async () => {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (prompt) => {
            return new Promise((resolve) => {
                rl.question(prompt, resolve);
            });
        };

        try {
            console.log('📱 WhatsApp Marketing - Interactive Mode\n');

            const phoneFile = await question('Enter phone numbers file path: ');
            const message = await question('Enter message: ');
            const delay = await question('Enter delay between messages (ms, default: 5000): ') || '5000';

            const phones = (await fs.readFile(phoneFile, 'utf-8'))
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            console.log(`\n📊 Sending to ${phones.length} numbers...`);

            const sender = new WhatsAppSender();
            await sender.initialize();

            const results = await sender.sendBulkMessages(phones, message, parseInt(delay));

            console.log('\n📊 Results:');
            console.log(`✅ Sent: ${results.sent}`);
            console.log(`❌ Failed: ${results.failed}`);

            await sender.destroy();
            rl.close();
            process.exit(0);

        } catch (error) {
            console.error('❌ Error:', error.message);
            rl.close();
            process.exit(1);
        }
    });

program
    .command('test')
    .description('Send a test message')
    .option('-p, --phone <number>', 'Phone number to send test message to')
    .option('-m, --message <text>', 'Test message', 'This is a test message from WhatsApp Marketing')
    .action(async (options) => {
        if (!options.phone) {
            console.error('❌ Error: Please provide a phone number with --phone');
            process.exit(1);
        }

        try {
            const sender = new WhatsAppSender();
            await sender.initialize();

            console.log(`\n📱 Sending test message to ${options.phone}...`);
            const result = await sender.sendMessage(options.phone, options.message);

            if (result.success) {
                console.log('✅ Test message sent successfully!');
            } else {
                console.log('❌ Failed to send test message:', result.error);
            }

            await sender.destroy();
            process.exit(0);

        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

program
    .command('templates')
    .description('List available message templates')
    .action(async () => {
        const templatesDir = path.join(__dirname, 'templates', 'whatsapp');
        
        if (await fs.pathExists(templatesDir)) {
            const templates = await fs.readdir(templatesDir);
            
            if (templates.length === 0) {
                console.log('No templates found in templates/whatsapp/');
            } else {
                console.log('📋 Available Templates:');
                console.log('======================\n');
                for (const template of templates) {
                    console.log(`📄 ${template}`);
                }
            }
        } else {
            console.log('Templates directory not found. Creating it...');
            await fs.ensureDir(templatesDir);
            console.log('Created templates/whatsapp/');
        }

        process.exit(0);
    });

program.parse();