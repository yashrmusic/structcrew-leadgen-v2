const fs = require('fs-extra');
const path = require('path');
const Tesseract = require('tesseract.js');

/**
 * Enhanced OCR Engine with improved extraction patterns
 * Works with Node.js 18.16+ (no sharp dependency)
 */
class EnhancedOCR {
    constructor() {
        this.tempDir = path.join(process.cwd(), 'temp_ocr_enhanced');
        this.scheduler = null;
        this.workerCount = 4;

        // Improved email patterns - catches more formats
        this.emailPatterns = [
            // Standard emails
            /([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
            // Emails with spaces around @
            /([a-zA-Z0-9._+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,})/gi,
            // Emails with (at) or [at]
            /([a-zA-Z0-9._+-]+\s*[\(\[]?\s*at\s*[\)\]]?\s*[a-zA-Z0-9.-]+\s*[\(\[]?\s*dot\s*[\)\]]?\s*[a-zA-Z]{2,})/gi,
            // OCR common misreads
            /([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[cC][o0][mM])/gi,
            // Gmail variations
            /([a-zA-Z0-9._+-]+@gma[i1l][l1]\.com)/gi,
        ];

        // Improved phone patterns - catches Indian and international formats
        this.phonePatterns = [
            // Indian mobile: +91, 91, 0 prefix
            /(?:\+?91[\s.-]?)?[6-9]\d{4}[\s.-]?\d{5}/g,
            // Indian with spaces/dashes in different places
            /(?:\+?91[\s.-]?)?\d{5}[\s.-]?\d{5}/g,
            /(?:\+?91[\s.-]?)?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/g,
            // US format
            /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
            // Generic international
            /\+?\d{1,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}[\s.-]?\d{2,4}/g,
            // 10 digits together (Indian mobile)
            /\b[6-9]\d{9}\b/g,
            // With country code
            /\+91\s?\d{10}/g,
        ];

        // Common OCR character replacements
        this.ocrFixes = {
            'O': '0', 'o': '0',
            'l': '1', 'I': '1', '|': '1',
            'S': '5', 's': '5',
            'B': '8',
            'g': '9', 'q': '9',
        };
    }

    async init() {
        await fs.ensureDir(this.tempDir);

        if (!this.scheduler) {
            this.scheduler = Tesseract.createScheduler();

            console.log(`[EnhancedOCR] Initializing ${this.workerCount} OCR workers...`);

            for (let i = 0; i < this.workerCount; i++) {
                const worker = await Tesseract.createWorker('eng', 1, {
                    logger: () => { } // Suppress verbose logging
                });

                // Configure Tesseract for better accuracy
                await worker.setParameters({
                    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@._+-()[]{}:;,/ ',
                    tessedit_pageseg_mode: '3', // Fully automatic page segmentation
                });

                this.scheduler.addWorker(worker);
            }

            console.log(`✅ OCR Engine initialized with ${this.workerCount} workers`);
        }
    }

    /**
     * Normalize text and fix common OCR errors
     */
    normalizeText(text) {
        let normalized = text
            // Unicode normalization
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')

            // Fix at/dot obfuscation
            .replace(/\[at\]/gi, '@')
            .replace(/\(at\)/gi, '@')
            .replace(/\{at\}/gi, '@')
            .replace(/ at /gi, '@')
            .replace(/\[dot\]/gi, '.')
            .replace(/\(dot\)/gi, '.')
            .replace(/ dot /gi, '.')

            // Fix common OCR email domain errors
            .replace(/gmail\.c0m/gi, 'gmail.com')
            .replace(/gmai1\.com/gi, 'gmail.com')
            .replace(/grnail\.com/gi, 'gmail.com')
            .replace(/gmall\.com/gi, 'gmail.com')
            .replace(/hotmai1\.com/gi, 'hotmail.com')
            .replace(/yah00\.com/gi, 'yahoo.com')
            .replace(/0utlook\.com/gi, 'outlook.com')

            // Clean up whitespace
            .replace(/\s+/g, ' ');

        return normalized;
    }

    /**
     * Fix OCR errors in phone number context
     */
    fixPhoneOCRErrors(text) {
        // In phone number context, replace letter-like characters with digits
        return text
            .replace(/[oO]/g, '0')
            .replace(/[lI|]/g, '1')
            .replace(/[sS]/g, '5')
            .replace(/[gq]/g, '9');
    }

    /**
     * Extract emails from text using multiple patterns
     */
    extractEmails(text) {
        const emails = new Set();
        const normalized = this.normalizeText(text);

        for (const pattern of this.emailPatterns) {
            const matches = normalized.match(pattern) || [];
            matches.forEach(email => {
                // Clean up the email
                let cleaned = email
                    .replace(/\s/g, '')
                    .replace(/@+/g, '@')
                    .replace(/\.+/g, '.')
                    .toLowerCase()
                    .trim();

                // Remove leading/trailing dots
                cleaned = cleaned.replace(/^\.+|\.+$/g, '');

                // Validate basic structure
                if (cleaned.includes('@') && cleaned.includes('.') && cleaned.length > 5) {
                    const [localPart, domain] = cleaned.split('@');

                    // Validate local part
                    if (localPart && localPart.length >= 1 && domain) {
                        const parts = domain.split('.');
                        const tld = parts[parts.length - 1];

                        // Check for valid TLD
                        if (tld && tld.length >= 2 && tld.length <= 10 && /^[a-z]+$/.test(tld)) {
                            // Skip common false positives
                            if (!cleaned.includes('example.com') &&
                                !cleaned.includes('domain.com') &&
                                !cleaned.startsWith('sample@') &&
                                !cleaned.startsWith('email@') &&
                                !cleaned.startsWith('your') &&
                                !cleaned.includes('test@')) {
                                emails.add(cleaned);
                            }
                        }
                    }
                }
            });
        }

        return [...emails];
    }

    /**
     * Extract phone numbers using multiple patterns
     */
    extractPhones(text) {
        const phones = new Set();

        // Apply OCR fixes for phone context
        const normalized = this.fixPhoneOCRErrors(text);

        for (const pattern of this.phonePatterns) {
            const matches = normalized.match(pattern) || [];
            matches.forEach(phone => {
                // Clean up - keep only digits and +
                let cleaned = phone.replace(/[^\d+]/g, '');

                // Remove leading zeros (except for +91 format)
                if (cleaned.startsWith('0') && !cleaned.startsWith('0091')) {
                    cleaned = cleaned.substring(1);
                }

                // Validate length (Indian: 10-12, International: 10-15)
                if (cleaned.length >= 10 && cleaned.length <= 15) {
                    // For Indian numbers, extract the 10-digit core
                    let core = cleaned.replace(/^\+?0?91/, '');

                    if (core.length === 10 && /^[6-9]/.test(core)) {
                        // Valid Indian mobile
                        phones.add('+91' + core);
                    } else if (cleaned.length >= 10 && /\d{10,}/.test(cleaned)) {
                        // Other valid phones
                        phones.add(cleaned);
                    }
                }
            });
        }

        // Filter out obvious non-phone numbers
        const filtered = [...phones].filter(p => {
            const digits = p.replace(/\D/g, '');
            // Avoid sequential numbers like 1234567890
            if (/^12345678/.test(digits) || /^0{5,}/.test(digits) || /^9{5,}/.test(digits)) {
                return false;
            }
            return true;
        });

        return filtered;
    }

    /**
     * Perform OCR with multiple passes for better accuracy
     */
    async performOCR(imagePath) {
        await this.init();

        try {
            // Primary OCR pass
            const result = await this.scheduler.addJob('recognize', imagePath);
            return result.data.text;
        } catch (e) {
            console.error(`OCR error on ${path.basename(imagePath)}: ${e.message}`);
            return '';
        }
    }

    /**
     * Process single image with enhanced OCR
     */
    async processImage(imagePath, logCallback = () => { }) {
        const text = await this.performOCR(imagePath);

        const emails = this.extractEmails(text);
        const phones = this.extractPhones(text);

        return { text, emails, phones };
    }

    /**
     * Process multiple images in parallel
     */
    async processImages(imagePaths, logCallback = console.log) {
        await this.init();

        const results = {
            extractedEmails: [],
            extractedPhones: [],
            scannedCount: 0,
            textSamples: []
        };

        logCallback(`[EnhancedOCR] Processing ${imagePaths.length} images...`);

        // Process in batches matching worker count
        const batchSize = this.workerCount;
        const totalBatches = Math.ceil(imagePaths.length / batchSize);

        for (let i = 0; i < imagePaths.length; i += batchSize) {
            const batch = imagePaths.slice(i, Math.min(i + batchSize, imagePaths.length));
            const batchNum = Math.floor(i / batchSize) + 1;

            logCallback(`[EnhancedOCR] Batch ${batchNum}/${totalBatches} (${batch.length} images)`);

            const batchResults = await Promise.all(
                batch.map(async (imgPath) => {
                    try {
                        const result = await this.processImage(imgPath, logCallback);
                        if (result.emails.length > 0 || result.phones.length > 0) {
                            logCallback(`  ✅ ${path.basename(imgPath)}: ${result.emails.length} emails, ${result.phones.length} phones`);
                        }
                        return result;
                    } catch (e) {
                        logCallback(`  ❌ ${path.basename(imgPath)}: ${e.message}`);
                        return { emails: [], phones: [], text: '' };
                    }
                })
            );

            batchResults.forEach(r => {
                results.extractedEmails.push(...r.emails);
                results.extractedPhones.push(...r.phones);
                results.scannedCount++;
                if (r.text.length > 50) {
                    results.textSamples.push(r.text.substring(0, 200));
                }
            });
        }

        // Deduplicate
        results.extractedEmails = [...new Set(results.extractedEmails)];
        results.extractedPhones = [...new Set(results.extractedPhones)];

        logCallback(`\n[EnhancedOCR] ✅ Complete!`);
        logCallback(`  📧 Emails found: ${results.extractedEmails.length}`);
        logCallback(`  📞 Phones found: ${results.extractedPhones.length}`);

        return results;
    }

    /**
     * Cleanup resources
     */
    async close() {
        if (this.scheduler) {
            await this.scheduler.terminate();
            this.scheduler = null;
        }
        await fs.remove(this.tempDir).catch(() => { });
    }
}

module.exports = EnhancedOCR;
