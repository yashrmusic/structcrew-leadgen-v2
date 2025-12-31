const nodemailer = require('nodemailer');
const validator = require('email-validator');
const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');

class MultiProviderEmailSender {
    constructor(configPath = './email-config.json') {
        this.configPath = configPath;
        this.config = null;
        this.providers = {
            smtp: [],
            mailgun: null,
            brevo: null,
            resend: null
        };
        this.currentProviderIndex = 0;
        this.currentProviderType = 'smtp';
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

            this.initializeProviders();
            console.log(`Loaded ${this.providers.smtp.length} SMTP account(s)`);

            if (this.config.mailgun) {
                console.log(`✅ Mailgun configured (${this.config.mailgun.domain})`);
            }
            if (this.config.brevo) {
                console.log(`✅ Brevo configured`);
            }
            if (this.config.resend) {
                console.log(`✅ Resend configured`);
            }

        } catch (error) {
            throw new Error(`Failed to load email config: ${error.message}`);
        }
    }

    initializeProviders() {
        this.providers = {
            smtp: [],
            mailgun: null,
            brevo: null,
            resend: null
        };

        for (const account of this.config.smtpAccounts || []) {
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

                this.providers.smtp.push({
                    type: 'smtp',
                    transporter,
                    account: account.email
                });
            } catch (error) {
                console.error(`Failed to initialize SMTP for ${account.email}: ${error.message}`);
            }
        }

        if (this.config.mailgun) {
            try {
                const formData = require('form-data');
                const Mailgun = require('mailgun.js');
                const mailgun = new Mailgun(formData);
                const mg = mailgun.client({
                    username: 'api',
                    key: this.config.mailgun.apiKey
                });

                this.providers.mailgun = {
                    type: 'mailgun',
                    client: mg,
                    domain: this.config.mailgun.domain,
                    fromEmail: this.config.mailgun.fromEmail
                };
            } catch (error) {
                console.log(`⚠️  Mailgun not available (install: npm install mailgun.js form-data)`);
            }
        }

        if (this.config.resend) {
            try {
                const Resend = require('resend');
                const resend = new Resend(this.config.resend.apiKey);

                this.providers.resend = {
                    type: 'resend',
                    client: resend,
                    fromEmail: this.config.resend.fromEmail || this.config.fromEmail
                };
            } catch (error) {
                console.log(`⚠️  Resend not available (install: npm install resend)`);
            }
        }
    }

    getNextProvider() {
        const providerOrder = ['mailgun', 'resend', 'smtp'];

        for (const type of providerOrder) {
            if (this.providers[type] && Array.isArray(this.providers[type])) {
                if (this.providers[type].length > 0) {
                    const provider = this.providers[type][this.currentProviderIndex];
                    this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers[type].length;
                    return provider;
                }
            } else if (this.providers[type]) {
                return this.providers[type];
            }
        }

        if (this.providers.smtp.length > 0) {
            const provider = this.providers.smtp[this.currentProviderIndex];
            this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.smtp.length;
            return provider;
        }

        throw new Error('No email providers configured');
    }

    validateEmail(email) {
        return validator.validate(email);
    }

    async loadTemplate(templateName) {
        let templatePath = path.join(process.cwd(), 'templates', `${templateName}.html`);

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

        const fromName = this.config.fromName;
        let attempt = 0;

        while (attempt < this.config.retryAttempts) {
            try {
                const provider = this.getNextProvider();
                const fromEmail = provider.fromEmail || this.config.fromEmail;

                if (provider.type === 'mailgun') {
                    const result = await provider.client.messages.create(provider.domain, {
                        from: `${fromName} <${fromEmail}>`,
                        to: [to],
                        subject: subject,
                        text: textContent,
                        html: htmlContent
                    });

                    this.stats.sent++;
                    await this.addToHistory(to, subject, 'sent', { ...options, provider: 'mailgun', messageId: result.id });

                    console.log(`✅ Sent to ${to} via Mailgun [${result.id.substring(0, 20)}...]`);
                    return { success: true, messageId: result.id };

                } else if (provider.type === 'resend') {
                    const result = await provider.client.emails.send({
                        from: `${fromName} <${fromEmail}>`,
                        to: [to],
                        subject: subject,
                        text: textContent,
                        html: htmlContent
                    });

                    this.stats.sent++;
                    await this.addToHistory(to, subject, 'sent', { ...options, provider: 'resend', messageId: result.data?.id });

                    console.log(`✅ Sent to ${to} via Resend [${result.data?.id?.substring(0, 20) || 'sent'}...]`);
                    return { success: true, messageId: result.data?.id };

                } else {
                    const mailOptions = {
                        from: `${fromName} <${fromEmail || provider.account}>`,
                        to: to,
                        subject: subject,
                        text: textContent,
                        html: htmlContent,
                        priority: 'normal',
                        headers: {
                            'X-Priority': '3',
                            'X-Mailer': 'StructCrew Email Marketing',
                            'List-Unsubscribe': `<mailto:${fromEmail || provider.account}?subject=Unsubscribe>`
                        }
                    };

                    const info = await provider.transporter.sendMail(mailOptions);

                    this.stats.sent++;
                    await this.addToHistory(to, subject, 'sent', { ...options, provider: 'smtp', messageId: info.messageId });

                    console.log(`✅ Sent to ${to} via SMTP [${info.messageId.substring(0, 15)}...]`);
                    return { success: true, messageId: info.messageId };
                }

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

        for (const { transporter, account } of this.providers.smtp) {
            try {
                await transporter.verify();
                console.log(`✅ SMTP ${account} - Connected`);
                results.push({ provider: 'smtp', account, status: 'connected' });
            } catch (error) {
                console.log(`❌ SMTP ${account} - Failed: ${error.message}`);
                results.push({ provider: 'smtp', account, status: 'failed', error: error.message });
            }
        }

        if (this.providers.mailgun) {
            console.log(`✅ Mailgun - Ready (domain: ${this.providers.mailgun.domain})`);
            results.push({ provider: 'mailgun', domain: this.providers.mailgun.domain, status: 'ready' });
        }

        if (this.providers.resend) {
            console.log(`✅ Resend - Ready`);
            results.push({ provider: 'resend', status: 'ready' });
        }

        return results;
    }
}

module.exports = MultiProviderEmailSender;
