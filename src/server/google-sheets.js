const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const BusinessTypeDetector = require('../scraper/business-type-detector');

class GoogleSheetsStorage {
    constructor(sheetId, credentialsPath) {
        this.sheetId = sheetId;
        this.credentialsPath = credentialsPath;
        this.sheets = null;
        this.range = 'Leads!A:I';
        this.businessDetector = new BusinessTypeDetector();
    }

    async connect() {
        try {
            const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));

            const auth = new JWT({
                email: credentials.client_email,
                key: credentials.private_key,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            await auth.authorize();

            this.sheets = google.sheets({ version: 'v4', auth });

            await this.ensureHeaders();

            console.log(`Connected to Google Sheet`);
            console.log(`Sheet URL: https://docs.google.com/spreadsheets/d/${this.sheetId}`);

        } catch (error) {
            throw new Error(`Failed to connect to Google Sheets: ${error.message}`);
        }
    }

    async ensureHeaders() {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.sheetId,
                range: this.range
            });

            const rows = response.data.values;

            if (!rows || rows.length === 0 || rows[0].length < 9 || rows[0][0] !== 'Company Name') {
                const headers = ['Company Name', 'Email', 'Phone', 'State', 'Instagram Handle', 'Business Type', 'Source', 'Date Added', 'Status'];
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.sheetId,
                    range: this.range,
                    valueInputOption: 'RAW',
                    resource: { values: [headers] }
                });
            }

        } catch (error) {
            throw new Error(`Failed to ensure headers: ${error.message}`);
        }
    }

    async getAllRows() {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.sheetId,
                range: this.range
            });

            const rows = response.data.values || [];
            if (rows.length <= 1) return [];

            const headers = rows[0];

            return rows.slice(1).map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            });

        } catch (error) {
            console.error('Error fetching rows:', error.message);
            return [];
        }
    }

    async checkDuplicate(email, phone) {
        try {
            const rows = await this.getAllRows();

            for (const row of rows) {
                if (email && row['Email'] && row['Email'].toLowerCase() === email.toLowerCase()) {
                    return { duplicate: true, field: 'Email', value: email, status: row['Status'] };
                }
                if (phone && row['Phone'] && row['Phone'].replace(/\D/g, '') === phone.replace(/\D/g, '')) {
                    return { duplicate: true, field: 'Phone', value: phone, status: row['Status'] };
                }
            }

            return { duplicate: false };
        } catch (error) {
            console.error('Error checking duplicates:', error.message);
            return { duplicate: false };
        }
    }

    async addLead(leadData) {
        try {
            const { companyName, email, phone, state, instagramHandle, source = 'OCR' } = leadData;

            if (!email && !phone) {
                return { success: false, error: 'Either email or phone is required' };
            }

            const duplicateCheck = await this.checkDuplicate(email, phone);

            if (duplicateCheck.duplicate) {
                return {
                    success: false,
                    duplicate: true,
                    field: duplicateCheck.field,
                    value: duplicateCheck.value,
                    message: `Duplicate entry found: ${duplicateCheck.field} = ${duplicateCheck.value}`
                };
            }

            const dateAdded = new Date().toISOString().split('T')[0];
            const businessType = this.businessDetector.detectBusinessType({ email, instagramHandle, bio: '' });

            const values = [[
                companyName || '',
                email || '',
                phone || '',
                state || '',
                instagramHandle || '',
                businessType,
                source,
                dateAdded,
                'New'
            ]];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.sheetId,
                range: this.range,
                valueInputOption: 'RAW',
                resource: { values }
            });

            return {
                success: true,
                message: `Lead added: ${email || phone}`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async batchAddLeads(leads) {
        const results = {
            added: [],
            duplicates: [],
            errors: []
        };

        const allRows = await this.getAllRows();
        const existingEmails = new Set(
            allRows
                .filter(r => r['Email'])
                .map(r => r['Email'].toLowerCase())
        );
        const existingPhones = new Set(
            allRows
                .filter(r => r['Phone'])
                .map(r => r['Phone'].replace(/\D/g, ''))
        );

        const newLeads = [];

        for (const lead of leads) {
            const email = lead.email?.toLowerCase();
            const phoneDigits = lead.phone?.replace(/\D/g, '');

            if (email && existingEmails.has(email)) {
                results.duplicates.push({ lead, reason: `Duplicate email: ${email}` });
            } else if (phoneDigits && existingPhones.has(phoneDigits)) {
                results.duplicates.push({ lead, reason: `Duplicate phone: ${lead.phone}` });
            } else {
                newLeads.push(lead);
            }
        }

        const batchSize = 100;
        for (let i = 0; i < newLeads.length; i += batchSize) {
            const batch = newLeads.slice(i, i + batchSize);
            const values = batch.map(lead => {
                const emailDomain = lead.email?.split('@')[1] || '';
                const companyName = emailDomain.split('.')[0]?.replace(/[^a-zA-Z0-9\s]/g, '').trim() || '';
                const formattedCompany = companyName.charAt(0).toUpperCase() + companyName.slice(1);
                const businessType = this.businessDetector.detectBusinessType({ email: lead.email, instagramHandle: lead.instagramHandle });

                return [
                    formattedCompany,
                    lead.email?.toLowerCase() || '',
                    lead.phone || '',
                    lead.state || '',
                    lead.instagramHandle || '',
                    businessType,
                    lead.source || 'Instagram OCR',
                    new Date().toISOString().split('T')[0],
                    'New'
                ];
            });

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.sheetId,
                range: this.range,
                valueInputOption: 'RAW',
                resource: { values }
            });

            results.added.push(...batch);
        }

        return results;
    }

    async getAllLeads() {
        return await this.getAllRows();
    }

    async getStats() {
        try {
            const rows = await this.getAllRows();

            const stats = {
                total: rows.length,
                uniqueEmails: new Set(rows.filter(r => r['Email']).map(r => r['Email'].toLowerCase())).size,
                uniquePhones: new Set(rows.filter(r => r['Phone']).map(r => r['Phone'].replace(/\D/g, ''))).size,
                bySource: {},
                byState: {},
                byStatus: {}
            };

            rows.forEach(row => {
                const source = row['Source'] || 'Unknown';
                const state = row['State'] || 'Unknown';
                const status = row['Status'] || 'Unknown';

                stats.bySource[source] = (stats.bySource[source] || 0) + 1;
                stats.byState[state] = (stats.byState[state] || 0) + 1;
                stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
            });

            return stats;

        } catch (error) {
            console.error('Error fetching stats:', error.message);
            return null;
        }
    }
}

module.exports = GoogleSheetsStorage;