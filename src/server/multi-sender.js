const Mailgun = require('mailgun.js');
const formData = require('form-data');
const { Resend } = require('resend');
const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');

class MultiSender {
    constructor(configPath = './email-config.json') {
        this.configPath = configPath;
        this.config = null;
        this.mailgun = null;
        this.resend = null;
        this.stats = {
            mailgun: { sent: 0, failed: 0 },
            resend: { sent: 0, failed: 0 }
        };
    }

    async loadConfig() {
        if (await fs.pathExists(this.configPath)) {
            this.config = await fs.readJson(this.configPath);
        } else {
            throw new Error('Email config not found');
        }

        // Initialize Mailgun
        if (this.config.mailgun?.apiKey) {
            const mailgun = new Mailgun(formData);
            const url = this.config.mailgun.baseUrl || 'https://api.mailgun.net';
            this.mailgun = mailgun.client({
                username: 'api',
                key: this.config.mailgun.apiKey,
                url: url
            });
            console.log(`✅ Mailgun initialized (${url.includes('eu') ? 'EU' : 'US'} region)`);
        }

        // Initialize Resend
        if (this.config.resend?.apiKey) {
            this.resend = new Resend(this.config.resend.apiKey);
            console.log('✅ Resend initialized');
        }
    }

    async loadTemplate(templateName) {
        let templatePath = path.join(process.cwd(), 'templates', `${templateName}.html`);
        if (await fs.pathExists(templatePath)) {
            const content = await fs.readFile(templatePath, 'utf8');
            return Handlebars.compile(content);
        }
        return null;
    }

    async sendWithMailgun(to, subject, html, text) {
        if (!this.mailgun) throw new Error('Mailgun not configured');

        const domain = this.config.mailgun.domain;
        const fromEmail = this.config.mailgun.fromEmail || `mail@${domain}`;
        const from = `StructCrew <${fromEmail}>`;

        try {
            const result = await this.mailgun.messages.create(domain, {
                from,
                to: [to],
                subject,
                text: text || html.replace(/<[^>]*>/g, ''),
                html
            });

            this.stats.mailgun.sent++;
            console.log(`✅ [Mailgun] Sent to ${to}`);
            return { success: true, id: result.id, provider: 'mailgun' };
        } catch (error) {
            this.stats.mailgun.failed++;
            console.log(`❌ [Mailgun] Failed: ${error.message}`);
            return { success: false, error: error.message, provider: 'mailgun' };
        }
    }

    async sendWithResend(to, subject, html, text) {
        if (!this.resend) throw new Error('Resend not configured');

        const from = this.config.resend.fromEmail || 'info@structcrew.online';

        try {
            const result = await this.resend.emails.send({
                from: `StructCrew <${from}>`,
                to: [to],
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, '')
            });

            this.stats.resend.sent++;
            console.log(`✅ [Resend] Sent to ${to}`);
            return { success: true, id: result.id, provider: 'resend' };
        } catch (error) {
            this.stats.resend.failed++;
            console.log(`❌ [Resend] Failed: ${error.message}`);
            return { success: false, error: error.message, provider: 'resend' };
        }
    }

    async sendEmail(to, subject, options = {}) {
        const { template, provider = 'resend', ...templateVars } = options;

        let html = options.html || '';
        if (template) {
            const tmpl = await this.loadTemplate(template);
            if (tmpl) {
                html = tmpl({ to, subject, ...templateVars });
            }
        }

        const text = html.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n').trim();

        if (provider === 'mailgun') {
            return this.sendWithMailgun(to, subject, html, text);
        } else {
            return this.sendWithResend(to, subject, html, text);
        }
    }

    async sendBatch(emails, subject, options = {}) {
        const { provider = 'resend', delay = 1000 } = options;
        const results = { sent: [], failed: [] };

        console.log(`\n📧 Batch send: ${emails.length} emails via ${provider.toUpperCase()}\n`);

        for (let i = 0; i < emails.length; i++) {
            const emailData = typeof emails[i] === 'string' ? { email: emails[i] } : emails[i];
            const to = emailData.email;

            const result = await this.sendEmail(to, subject, {
                ...options,
                provider,
                companyName: emailData.companyName,
                businessType: emailData.businessType
            });

            if (result.success) {
                results.sent.push({ email: to, id: result.id });
            } else {
                results.failed.push({ email: to, error: result.error });
            }

            if (i < emails.length - 1 && delay > 0) {
                await new Promise(r => setTimeout(r, delay));
            }
        }

        console.log(`\n📊 Results: ${results.sent.length} sent, ${results.failed.length} failed\n`);
        return results;
    }

    getStats() {
        return this.stats;
    }
}

module.exports = MultiSender;
