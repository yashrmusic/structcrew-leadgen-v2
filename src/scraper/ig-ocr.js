const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const Tesseract = require('tesseract.js');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

puppeteer.use(StealthPlugin());

/**
 * Instagram OCR Engine
 * Downloads profile images and extracts lead info via Tesseract OCR
 */
class InstagramOCR {
    constructor() {
        this.browser = null;
        this.tempDir = path.join(process.cwd(), 'temp_ocr');
    }

    async init() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
        }
        await fs.ensureDir(this.tempDir);
    }

    /**
     * Scrape profile and perform OCR on images
     */
    async scanProfile(profileUrl, limit = 9) {
        if (!profileUrl || !profileUrl.includes('instagram.com/')) return null;
        await this.init();

        const page = await this.browser.newPage();
        await page.setViewport({ width: 1280, height: 1600 });

        console.log(`Scanning Profile: ${profileUrl}...`);

        const results = {
            bio: '',
            extractedEmails: [],
            extractedPhones: [],
            scannedImages: 0
        };

        try {
            await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            // 1. Extract Bio Text
            results.bio = await page.evaluate(() => {
                const bioEl = document.querySelector('header section div:nth-child(3) span') ||
                    document.querySelector('header section');
                return bioEl ? bioEl.innerText : '';
            });

            // 2. Scroll and Extract Post Image URLs
            console.log(`Scrolling to collect up to ${limit} posts...`);
            const imageUrls = await page.evaluate(async (max) => {
                const urls = new Set();
                let lastHeight = document.body.scrollHeight;

                while (urls.size < max) {
                    const images = Array.from(document.querySelectorAll('img[srcset]'));
                    images.forEach(img => {
                        if (img.alt && !img.alt.includes('profile')) {
                            urls.add(img.src);
                        }
                    });

                    if (urls.size >= max) break;

                    window.scrollBy(0, 1000);
                    await new Promise(r => setTimeout(r, 2000));

                    let newHeight = document.body.scrollHeight;
                    if (newHeight === lastHeight) break;
                    lastHeight = newHeight;
                }
                return Array.from(urls).slice(0, max);
            }, limit);

            console.log(`Found ${imageUrls.length} images to scan...`);
            results.scannedImages = imageUrls.length;

            // 3. Download and OCR
            for (let i = 0; i < imageUrls.length; i++) {
                const imgPath = path.join(this.tempDir, `post_${i}.jpg`);
                await this.downloadImage(imageUrls[i], imgPath);

                console.log(`OCR processing image ${i + 1}/${imageUrls.length}...`);
                const text = await this.performOCR(imgPath);

                // Extract leads via Regex
                const emails = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi) || [];
                const phones = text.match(/(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g) || [];

                results.extractedEmails.push(...emails);
                results.extractedPhones.push(...phones);

                await fs.remove(imgPath); // Cleanup
            }

            // Cleanup results
            results.extractedEmails = [...new Set(results.extractedEmails)];
            results.extractedPhones = [...new Set(results.extractedPhones.filter(p => p.length > 8))];

        } catch (e) {
            console.error('IG OCR Error:', e.message);
        } finally {
            await page.close();
        }

        return results;
    }

    async downloadImage(url, dest) {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(dest);
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }

    async performOCR(imagePath) {
        try {
            const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
            return text;
        } catch (e) {
            console.error('Tesseract Error:', e.message);
            return '';
        }
    }

    async close() {
        if (this.browser) await this.browser.close();
        await fs.remove(this.tempDir);
    }
}

module.exports = InstagramOCR;
