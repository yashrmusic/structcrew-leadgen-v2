const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const path = require('path');

class WhatsAppSender {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });
        
        this.ready = false;
        this.qrCode = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.client.on('qr', (qr) => {
                console.log('\n📱 Scan this QR code with WhatsApp:');
                qrcode.generate(qr, { small: true });
                this.qrCode = qr;
            });

            this.client.on('ready', () => {
                console.log('\n✅ WhatsApp Client is ready!');
                this.ready = true;
                resolve();
            });

            this.client.on('auth_failure', (msg) => {
                console.error('❌ Authentication failure:', msg);
                reject(msg);
            });

            this.client.on('disconnected', (reason) => {
                console.log('🔌 WhatsApp Client disconnected:', reason);
                this.ready = false;
            });

            this.client.initialize();
        });
    }

    async sendMessage(phoneNumber, message) {
        if (!this.ready) {
            throw new Error('WhatsApp client is not ready. Please wait for initialization.');
        }

        try {
            const chatId = phoneNumber.includes('@c.us') 
                ? phoneNumber 
                : `${phoneNumber.replace(/\D/g, '')}@c.us`;
            
            await this.client.sendMessage(chatId, message);
            return { success: true, phoneNumber };
        } catch (error) {
            console.error(`❌ Failed to send to ${phoneNumber}:`, error.message);
            return { success: false, phoneNumber, error: error.message };
        }
    }

    async sendBulkMessages(phoneNumbers, message, delayMs = 5000) {
        const results = {
            sent: 0,
            failed: 0,
            errors: []
        };

        console.log(`\n📤 Starting bulk send to ${phoneNumbers.length} numbers...`);
        console.log(`⏱️  Delay between messages: ${delayMs / 1000}s\n`);

        for (let i = 0; i < phoneNumbers.length; i++) {
            const phone = phoneNumbers[i];
            console.log(`[${i + 1}/${phoneNumbers.length}] Sending to ${phone}...`);

            const result = await this.sendMessage(phone, message);
            
            if (result.success) {
                results.sent++;
                console.log(`✅ Sent successfully`);
            } else {
                results.failed++;
                results.errors.push(result);
                console.log(`❌ Failed: ${result.error}`);
            }

            if (i < phoneNumbers.length - 1) {
                console.log(`⏳ Waiting ${delayMs / 1000}s before next message...\n`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        return results;
    }

    async destroy() {
        await this.client.destroy();
        console.log('🔌 WhatsApp client destroyed');
    }
}

module.exports = WhatsAppSender;