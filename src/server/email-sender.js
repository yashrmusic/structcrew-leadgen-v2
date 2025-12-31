const nodemailer = require('nodemailer');
const validator = require('email-validator');
const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');

class EmailSender {
    constructor(configPath = './email-config.json') {
        this.configPath = configPath;
        this.config = null;
        this.transporters = [];
        this.currentTransporterIndex = 0;
        this.stats = {
            sent: 0,
            failed: 0,
            bounced: 0,
            opened: 0,
            clicked: 0
        };
        this.historyFile = path.join(process.cwd(), 'email-history.json');
    }

    async loadConfig() {
        try {
            if (await fs.pathExists(this.configPath)) {
                this.config = await fs.readJson(this.configPath);
            } else {
                this.config = {
                    smtpAccounts: [],
                    fromName: 'StructCrew',
                    fromEmail: '',
                    dailyLimit: 500,
                    batchDelay: 5000,
                    retryAttempts: 3,
                    retryDelay: 10000,
                    trackingEnabled: false
                };
                await fs.writeJson(this.configPath, this.config, { spaces: 2 });
            }

            this.initializeTransporters();
            console.log(`Loaded ${this.transporters.length} SMTP account(s)`);

        } catch (error) {
            throw new Error(`Failed to load email config: ${error.message}`);
        }
    }

    initializeTransporters() {
        this.transporters = [];

        for (const account of this.config.smtpAccounts) {
            try {
                const transporter = nodemailer.createTransport({
                    host: account.host,
                    port: account.port,
                    secure: account.secure || false,
                    auth: {
                        user: account.email,
                        pass: account.pass
                    },
                    pool: true,
                    maxConnections: 5,
                    maxMessages: 100
                });

                this.transporters.push({
                    transporter,
                    account: account.email
                });
            } catch (error) {
                console.error(`Failed to initialize transporter for ${account.email}: ${error.message}`);
            }
        }
    }

    getNextTransporter() {
        if (this.transporters.length === 0) {
            throw new Error('No SMTP accounts configured');
        }

        const transporter = this.transporters[this.currentTransporterIndex];
        this.currentTransporterIndex = (this.currentTransporterIndex + 1) % this.transporters.length;

        return transporter;
    }

    validateEmail(email) {
        return validator.validate(email);
    }

    async loadTemplate(templateName) {
        // Try root templates folder first
        let templatePath = path.join(process.cwd(), 'templates', `${templateName}.html`);

        if (await fs.pathExists(templatePath)) {
            const templateContent = await fs.readFile(templatePath, 'utf8');
            return Handlebars.compile(templateContent);
        }

        // Fallback to src/templates
        templatePath = path.join(__dirname, '../templates', `${templateName}.html`);

        if (await fs.pathExists(templatePath)) {
            const templateContent = await fs.readFile(templatePath, 'utf8');
            return Handlebars.compile(templateContent);
        }

        console.log(`⚠️ Template not found: ${templateName}`);
        return null;
    }

    async sendEmail(to, subject, content, options = {}) {
        const { email, phone, companyName, businessType } = options;

        if (!this.validateEmail(to)) {
            console.log(`❌ Invalid email: ${to}`);
            this.stats.failed++;
            return { success: false, error: 'Invalid email' };
        }

        let htmlContent = content || '';
        let textContent = content ? content.replace(/<[^>]*>/g, '') : '';

        if (options.template) {
            const template = await this.loadTemplate(options.template);
            if (template) {
                htmlContent = template({ to, subject, companyName, businessType, email, phone });
                textContent = htmlContent.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n').trim();
            }
        }

        const transporterInfo = this.getNextTransporter();
        const from = this.config.fromEmail || transporterInfo.account;
        const fromName = this.config.fromName;

        const mailOptions = {
            from: `"${fromName}" <${from}>`,
            to: to,
            subject: subject,
            text: textContent,
            html: htmlContent,
            priority: 'normal',
            headers: {
                'X-Priority': '3',
                'X-Mailer': 'StructCrew Email Marketing',
                'List-Unsubscribe': `<mailto:${from}?subject=Unsubscribe>`
            }
        };

        let attempt = 0;
        while (attempt < this.config.retryAttempts) {
            try {
                const info = await transporterInfo.transporter.sendMail(mailOptions);

                this.stats.sent++;
                await this.addToHistory(to, subject, 'sent', { ...options, transporter: transporterInfo.account });

                console.log(`✅ Sent to ${to} [${info.messageId.substring(0, 15)}...]`);
                return { success: true, messageId: info.messageId };

            } catch (error) {
                attempt++;

                if (attempt < this.config.retryAttempts) {
                    console.log(`⚠️  Retry ${attempt}/${this.config.retryAttempts} for ${to}: ${error.message}`);
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
                } else {
                    this.stats.failed++;
                    await this.addToHistory(to, subject, 'failed', { ...options, error: error.message });
                    console.log(`❌ Failed to send to ${to}: ${error.message}`);
                    return { success: false, error: error.message };
                }
            }
        }
    }

    async sendBatch(emails, subject, content, options = {}) {
        const results = {
            sent: [],
            failed: [],
            skipped: []
        };

        console.log(`\n📧 Starting email batch: ${emails.length} recipients`);
        console.log(`Subject: ${subject}\n`);

        const dailyLimit = this.config.dailyLimit;
        const sentToday = await this.getSentToday();

        const remainingQuota = Math.max(0, dailyLimit - sentToday);
        const emailsToSend = emails.slice(0, remainingQuota);

        console.log(`Daily limit: ${dailyLimit}`);
        console.log(`Already sent today: ${sentToday}`);
        console.log(`Remaining quota: ${remainingQuota}`);
        console.log(`Sending to: ${emailsToSend.length} emails\n`);

        for (let i = 0; i < emailsToSend.length; i++) {
            const emailData = emailsToSend[i];
            const emailAddress = typeof emailData === 'string' ? emailData : emailData.email;

            if (!emailAddress) {
                results.skipped.push(emailData);
                continue;
            }

            const leadOptions = typeof emailData === 'object' ? emailData : options;

            const result = await this.sendEmail(
                emailAddress,
                subject,
                content,
                leadOptions
            );

            if (result.success) {
                results.sent.push(emailData);
            } else {
                results.failed.push({ email: emailAddress, error: result.error });
            }

            if (i < emailsToSend.length - 1) {
                await new Promise(resolve => setTimeout(resolve, this.config.batchDelay));
            }
        }

        if (emails.length > remainingQuota) {
            console.log(`\n⚠️  Daily limit reached. ${emails.length - remainingQuota} emails skipped.`);
        }

        return results;
    }

    async getSentToday() {
        try {
            if (await fs.pathExists(this.historyFile)) {
                const history = await fs.readJson(this.historyFile);
                const today = new Date().toISOString().split('T')[0];
                return history.filter(h => h.date === today && h.status === 'sent').length;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }

    async addToHistory(to, subject, status, meta = {}) {
        try {
            let history = [];
            if (await fs.pathExists(this.historyFile)) {
                history = await fs.readJson(this.historyFile);
            }

            history.push({
                to,
                subject,
                status,
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString(),
                ...meta
            });

            await fs.writeJson(this.historyFile, history, { spaces: 2 });
        } catch (error) {
            console.error('Failed to add to history:', error.message);
        }
    }

    async getHistory(limit = 100) {
        try {
            if (await fs.pathExists(this.historyFile)) {
                const history = await fs.readJson(this.historyFile);
                return history.slice(-limit).reverse();
            }
            return [];
        } catch (error) {
            return [];
        }
    }

    getStats() {
        return this.stats;
    }

    async testConnection() {
        const results = [];

        for (const { transporter, account } of this.transporters) {
            try {
                await transporter.verify();
                console.log(`✅ ${account} - Connected`);
                results.push({ account, status: 'connected' });
            } catch (error) {
                console.log(`❌ ${account} - Failed: ${error.message}`);
                results.push({ account, status: 'failed', error: error.message });
            }
        }

        return results;
    }
}

module.exports = EmailSender;