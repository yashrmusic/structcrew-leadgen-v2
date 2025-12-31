const twilio = require('twilio');

class TwilioWhatsAppSender {
    constructor(accountSid, authToken, fromNumber) {
        this.client = twilio(accountSid, authToken);
        this.fromNumber = fromNumber;
    }

    async sendMessage(toNumber, message) {
        try {
            const response = await this.client.messages.create({
                from: `whatsapp:${this.fromNumber.replace('+', '')}`,
                to: `whatsapp:${toNumber.replace('+', '')}`,
                body: message
            });

            return {
                success: true,
                sid: response.sid,
                to: toNumber,
                status: response.status
            };
        } catch (error) {
            console.error(`❌ Failed to send to ${toNumber}:`, error.message);
            return {
                success: false,
                to: toNumber,
                error: error.message
            };
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
                console.log(`✅ Sent successfully (SID: ${result.sid})`);
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

    async getMessageStatus(messageSid) {
        try {
            const message = await this.client.messages(messageSid).fetch();
            return {
                success: true,
                status: message.status,
                errorMessage: message.errorMessage
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getAccountInfo() {
        try {
            const account = await this.client.api.accounts(this.client.accountSid).fetch();
            return {
                success: true,
                accountSid: account.sid,
                friendlyName: account.friendlyName,
                status: account.status,
                type: account.type
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = TwilioWhatsAppSender;