const fs = require('fs-extra');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const EnhancedOCR = require('./enhanced-ocr');

/**
 * AI-Powered OCR using Gemini Vision
 * Much better at reading stylized text from Instagram images
 */
class GeminiOCR {
    constructor(apiKey = null) {
        this.apiKey = apiKey || process.env.GEMINI_API_KEY;
        this.genAI = null;
        this.model = null;
        this.requestCount = 0;
        this.rateLimit = 15; // requests per minute for free tier
        this.lastRequestTime = 0;
        this.enhancedOcr = new EnhancedOCR(); // Fallback engine

        // Improved patterns for fallback regex
        this.emailPatterns = [
            /([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
            /([a-zA-Z0-9._+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,})/gi,
        ];

        this.phonePatterns = [
            /(?:\+?91[\s.-]?)?[6-9]\d{4}[\s.-]?\d{5}/g,
            /(?:\+?91[\s.-]?)?\d{5}[\s.-]?\d{5}/g,
            /\b[6-9]\d{9}\b/g,
            /\+91\s?\d{10}/g,
        ];
    }

    async init() {
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY not set in .env file.');
        }

        if (!this.genAI) {
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            // Default to Gemini Flash Lite for high quota, use 2.5-flash if needed for quality
            // Note: 2.5-flash has a strict 20 req/day limit on some free projects
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
            console.log('✅ Gemini Flash Lite OCR initialized');
        }
    }

    /**
     * Rate limiting to avoid API quota issues
     */
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minInterval = (60 * 1000) / this.rateLimit; // ms between requests

        if (timeSinceLastRequest < minInterval) {
            const waitTime = minInterval - timeSinceLastRequest;
            await new Promise(r => setTimeout(r, waitTime));
        }

        this.lastRequestTime = Date.now();
        this.requestCount++;
    }

    /**
     * Extract text and contact info from image using Gemini Vision
     */
    async processImage(imagePath) {
        await this.init();

        const models = [
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-2.5-flash-lite',
            'gemini-2.0-flash-lite',
            'gemini-flash-latest',
            'gemini-flash-lite-latest'
        ];

        let lastError = null;

        for (const modelName of models) {
            try {
                this.model = this.genAI.getGenerativeModel({ model: modelName });
                return await this._executeOcr(imagePath);
            } catch (error) {
                lastError = error;
                // If it's a quota error or rate limit, log and try the next model
                if (error.message.includes('429') || error.message.includes('quota')) {
                    console.log(`⚠️ Quota hit for ${modelName}. Trying next...`);
                    continue;
                }
                if (error.message.includes('404')) continue;
                throw error;
            }
        }

        // --- THE ULTIMATE FALLBACK: TESSERACT ---
        console.log('📉 All Gemini models exhausted. Falling back to Enhanced Tesseract OCR...');
        try {
            const tessResult = await this.enhancedOcr.processImage(imagePath);
            return {
                emails: tessResult.emails,
                phones: tessResult.phones,
                rawText: tessResult.text,
                success: true,
                method: 'tesseract'
            };
        } catch (tessError) {
            throw new Error(`Both Gemini and Tesseract failed: ${tessError.message}`);
        }
    }

    /**
     * Internal helper to execute the actual Gemini call
     * @private
     */
    async _executeOcr(imagePath) {
        await this.waitForRateLimit();

        if (!(await fs.pathExists(imagePath))) {
            throw new Error(`File not found: ${imagePath}`);
        }

        const stats = await fs.stat(imagePath);
        if (stats.size > 20 * 1024 * 1024) {
            throw new Error('Image size exceeds 20MB limit for Gemini');
        }

        // Read image as base64
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = this._getMimeType(imagePath);

        // Create prompt for extraction
        const prompt = `Analyze this Instagram post image and extract:
1. ANY email addresses found in the text, logo, or watermark.
2. ANY phone numbers (especially WhatsApp/Indian mobile numbers).

Return the results EXCLUSIVELY in this JSON format:
{
  "emails": ["list", "of", "emails"],
  "phones": ["list", "of", "phones"],
  "rawText": "full text found in image"
}

If no contact info is found, return empty arrays. Accuracy is critical.`;

        try {
            const result = await this.model.generateContent([
                prompt,
                {
                    inlineData: {
                        mimeType,
                        data: base64Image
                    }
                }
            ]);

            const response = await result.response;
            const textResponse = response.text();

            // Parse JSON response
            try {
                // Clean up response - remove markdown code blocks if present
                let cleanResponse = textResponse
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim();

                const data = JSON.parse(cleanResponse);

                return {
                    emails: this.validateEmails(data.emails || []),
                    phones: this.validatePhones(data.phones || []),
                    rawText: data.rawText || textResponse,
                    success: true
                };
            } catch (parseError) {
                // Fallback: extract using regex from the raw response
                const emails = this.extractEmails(textResponse);
                const phones = this.extractPhones(textResponse);

                return {
                    emails,
                    phones,
                    rawText: textResponse,
                    success: true
                };
            }
        } catch (error) {
            throw error; // Rethrow to be caught by processImage's fallback logic
        }
    }

    _getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
        };
        return mimeTypes[ext] || 'image/jpeg';
    }

    validateEmails(emails) {
        if (!Array.isArray(emails)) return [];
        return emails.filter(email => {
            if (!email || typeof email !== 'string') return false;
            const cleaned = email.toLowerCase().trim();
            return cleaned.includes('@') &&
                cleaned.includes('.') &&
                cleaned.length > 5 &&
                !cleaned.includes('example.com') &&
                !cleaned.startsWith('test@') &&
                !cleaned.startsWith('sample@');
        }).map(e => e.toLowerCase().trim());
    }

    validatePhones(phones) {
        if (!Array.isArray(phones)) return [];
        return phones.filter(phone => {
            if (!phone) return false;
            const digits = String(phone).replace(/\D/g, '');
            return digits.length >= 10 && digits.length <= 15;
        }).map(p => {
            const digits = String(p).replace(/\D/g, '');
            if (digits.length === 10 && /^[6-9]/.test(digits)) {
                return '+91' + digits;
            }
            return digits.startsWith('91') ? '+' + digits : digits;
        });
    }

    extractEmails(text) {
        const emails = new Set();
        for (const pattern of this.emailPatterns) {
            const matches = text.match(pattern) || [];
            matches.forEach(e => emails.add(e.toLowerCase().trim()));
        }
        return this.validateEmails([...emails]);
    }

    extractPhones(text) {
        const phones = new Set();
        for (const pattern of this.phonePatterns) {
            const matches = text.match(pattern) || [];
            matches.forEach(p => phones.add(p.replace(/\s/g, '')));
        }
        return this.validatePhones([...phones]);
    }

    /**
     * Process multiple images with rate limiting
     */
    async processImages(imagePaths, logCallback = console.log) {
        await this.init();

        const results = {
            extractedEmails: [],
            extractedPhones: [],
            scannedCount: 0,
            successCount: 0,
            failedCount: 0,
            allData: []
        };

        logCallback(`[GeminiOCR] Processing ${imagePaths.length} images with AI Vision...`);
        logCallback(`[GeminiOCR] Rate limit: ${this.rateLimit} requests / minute\n`);

        for (let i = 0; i < imagePaths.length; i++) {
            const imgPath = imagePaths[i];
            const progress = `[${i + 1}/${imagePaths.length}]`;

            try {
                const result = await this.processImage(imgPath);
                results.scannedCount++;

                if (result.success) {
                    results.successCount++;
                    results.extractedEmails.push(...result.emails);
                    results.extractedPhones.push(...result.phones);

                    results.allData.push({
                        image: path.basename(imgPath),
                        emails: result.emails,
                        phones: result.phones,
                        rawText: result.rawText
                    });

                    if (result.emails.length > 0 || result.phones.length > 0) {
                        logCallback(`${progress} ✅ ${path.basename(imgPath)}: ${result.emails.length} emails, ${result.phones.length} phones`);
                    } else {
                        logCallback(`${progress} ⚪ ${path.basename(imgPath)}: no contact info`);
                    }
                } else {
                    results.failedCount++;
                    logCallback(`${progress} ❌ ${path.basename(imgPath)}: Analysis failed`);
                }

            } catch (error) {
                results.failedCount++;
                logCallback(`${progress} ❌ ${path.basename(imgPath)}: ${error.message}`);
            }
        }

        // Deduplicate
        results.extractedEmails = [...new Set(results.extractedEmails)];
        results.extractedPhones = [...new Set(results.extractedPhones)];

        logCallback(`\n[GeminiOCR] ✅ Complete!`);
        logCallback(`  📸 Scanned: ${results.scannedCount}`);
        logCallback(`  ✅ Success: ${results.successCount}`);
        logCallback(`  ❌ Failed: ${results.failedCount}`);
        logCallback(`  📧 Emails: ${results.extractedEmails.length}`);
        logCallback(`  📞 Phones: ${results.extractedPhones.length}`);

        return results;
    }

    async close() {
        // No cleanup needed for Gemini
    }
}

module.exports = GeminiOCR;
