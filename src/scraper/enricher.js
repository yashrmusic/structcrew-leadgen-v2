const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

/**
 * Lead Enrichment Engine
 * Visits websites to extract contact info and social handles
 */
class Enricher {
    constructor() {
        this.browser = null;
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    /**
     * Enrich a lead by visiting its website
     * @param {string} url - The website URL to crawl
     */
    async enrich(url) {
        if (!url || url === 'N/A') return null;
        if (!this.browser) await this.init();

        const page = await this.browser.newPage();
        // Set short timeout and block heavy assets to speed up
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        const info = {
            emails: [],
            instagram: null,
            linkedin: null,
            facebook: null
        };

        try {
            console.log(`Enriching: ${url}...`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

            const content = await page.content();

            // 1. Extract Emails via Regex
            const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
            const foundEmails = content.match(emailRegex) || [];
            // Basic filtering to remove duplicates and common false positives
            info.emails = [...new Set(foundEmails)].filter(e =>
                !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.webp')
            );

            // 2. Extract Social Handles via Links
            const socialLinks = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a[href]'));
                return links.map(a => a.href);
            });

            socialLinks.forEach(link => {
                if (link.includes('instagram.com/') && !info.instagram) {
                    info.instagram = link;
                }
                if (link.includes('linkedin.com/') && !info.linkedin) {
                    info.linkedin = link;
                }
                if (link.includes('facebook.com/') && !info.facebook) {
                    info.facebook = link;
                }
            });

        } catch (e) {
            console.error(`Failed to enrich ${url}:`, e.message);
        } finally {
            await page.close();
        }

        return info;
    }

    async close() {
        if (this.browser) await this.browser.close();
    }
}

module.exports = Enricher;
