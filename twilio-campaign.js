#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const TwilioWhatsAppSender = require('./twilio-sender');

let config = null;

try {
    config = require('./twilio-config.json');
} catch (error) {
    console.error('❌ Error: twilio-config.json not found. Please create it first.');
    process.exit(1);
}

const sender = new TwilioWhatsAppSender(
    config.accountSid,
    config.authToken,
    config.fromNumber
);

program
    .name('twilio-campaign')
    .description('Twilio WhatsApp marketing campaign tool')
    .version('1.0.0');

program
    .command('send')
    .description('Send bulk WhatsApp messages via Twilio')
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

            console.log('📱 Twilio WhatsApp Campaign');
            console.log('=============================\n');
            console.log(`📊 Numbers to send: ${phones.length}`);
            console.log(`⏱️  Delay: ${options.delay}ms (${options.delay / 1000}s)`);
            console.log(`📱 From: ${config.fromNumber}`);
            console.log(`📝 Message preview:\n${message.substring(0, 200)}${message.length > 200 ? '...' : ''}\n`);

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
                const errorFile = `twilio_errors_${Date.now()}.txt`;
                await fs.writeFile(
                    errorFile,
                    results.errors.map(e => `${e.to}: ${e.error}`).join('\n')
                );
                console.log(`\n📄 Errors saved to: ${errorFile}`);
            }

            process.exit(0);

        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

program
    .command('test')
    .description('Send a test message')
    .option('-p, --phone <number>', 'Phone number to send test message to')
    .option('-m, --message <text>', 'Test message', 'This is a test message from Twilio WhatsApp')
    .action(async (options) => {
        if (!options.phone) {
            console.error('❌ Error: Please provide a phone number with --phone');
            process.exit(1);
        }

        try {
            console.log(`\n📱 Sending test message to ${options.phone}...`);
            console.log(`📱 From: ${config.fromNumber}`);
            
            const result = await sender.sendMessage(options.phone, options.message);

            if (result.success) {
                console.log('✅ Test message sent successfully!');
                console.log(`📄 Message SID: ${result.sid}`);
                console.log(`📊 Status: ${result.status}`);
                console.log('\n💡 Tip: You need to join the Twilio sandbox first:');
                console.log(`   Send "join ${config.fromNumber}" to ${config.fromNumber} on WhatsApp`);
            } else {
                console.log('❌ Failed to send test message:', result.error);
                console.log('\n💡 Make sure you have joined the Twilio sandbox:');
                console.log(`   Send "join ${config.fromNumber}" to ${config.fromNumber} on WhatsApp`);
            }

            process.exit(0);

        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

program
    .command('status')
    .description('Check Twilio account status')
    .action(async () => {
        try {
            console.log('📱 Checking Twilio account status...\n');
            const accountInfo = await sender.getAccountInfo();

            if (accountInfo.success) {
                console.log('✅ Account Details:');
                console.log(`   Account SID: ${accountInfo.accountSid}`);
                console.log(`   Name: ${accountInfo.friendlyName}`);
                console.log(`   Status: ${accountInfo.status}`);
                console.log(`   Type: ${accountInfo.type}`);
                console.log(`\n📱 WhatsApp Number: ${config.fromNumber}`);
            } else {
                console.log('❌ Failed to fetch account info:', accountInfo.error);
            }

            process.exit(0);
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

program
    .command('sandbox')
    .description('Show sandbox join instructions')
    .action(async () => {
        console.log('📱 Twilio WhatsApp Sandbox Setup');
        console.log('=================================\n');
        console.log('To send messages, you need to join the sandbox:\n');
        console.log('1️⃣  Open WhatsApp on your phone');
        console.log('2️⃣  Send this message:');
        console.log(`   join ${config.fromNumber}`);
        console.log(`   to: ${config.fromNumber}`);
        console.log('\n3️⃣  Wait for the confirmation message');
        console.log('4️⃣  You can now receive test messages!\n');
        console.log('💡 For production use, you need to:');
        console.log('   - Apply for WhatsApp Business API');
        console.log('   - Get a dedicated WhatsApp number');
        console.log('   - This usually takes 1-3 business days');
        console.log('\nNow you can test with:');
        console.log(`node twilio-campaign.js test --phone YOUR_NUMBER`);

        process.exit(0);
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
            console.log('📱 Twilio WhatsApp - Interactive Mode\n');

            const phoneFile = await question('Enter phone numbers file path: ');
            const message = await question('Enter message: ');
            const delay = await question('Enter delay between messages (ms, default: 5000): ') || '5000';

            const phones = (await fs.readFile(phoneFile, 'utf-8'))
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            console.log(`\n📊 Sending to ${phones.length} numbers...`);

            const results = await sender.sendBulkMessages(phones, message, parseInt(delay));

            console.log('\n📊 Results:');
            console.log(`✅ Sent: ${results.sent}`);
            console.log(`❌ Failed: ${results.failed}`);

            rl.close();
            process.exit(0);

        } catch (error) {
            console.error('❌ Error:', error.message);
            rl.close();
            process.exit(1);
        }
    });

program.parse();