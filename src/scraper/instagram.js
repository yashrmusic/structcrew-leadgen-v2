const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

/**
 * Instagram Discovery Engine
 * Finds profiles via hashtags/keywords using Search Engine Proxy
 * (Avoids Instagram login wall)
 */
class InstagramScraper {
    constructor() {
        this.browser = null;
    }

    async init() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
    }

    /**
     * Search for architect/designer profiles via Google
     * e.g. site:instagram.com "architect" Mumbai
     */
    async discover(keyword, location = '', limit = 10) {
        await this.init();
        const page = await this.browser.newPage();

        const searchQuery = `site:instagram.com "${keyword}" ${location}`;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

        console.log(`Instagram Discovery: ${searchQuery}...`);

        const items = [];
        try {
            await page.goto(searchUrl, { waitUntil: 'networkidle2' });

            const results = await page.$$('.g');
            for (let i = 0; i < Math.min(results.length, limit); i++) {
                const data = await page.evaluate(el => {
                    const title = el.querySelector('h3')?.innerText || '';
                    const link = el.querySelector('a')?.href || '';
                    const snippet = el.querySelector('.VwiC3b')?.innerText || '';

                    // Extract handle from URL
                    const handle = link.split('instagram.com/')[1]?.split('/')[0] || '';

                    return {
                        name: title.split('(@')[0].split('•')[0].trim(),
                        handle,
                        instagram: link,
                        snippet,
                        source: 'Instagram'
                    };
                }, results[i]);

                if (data.handle && !data.handle.includes('p/') && !data.handle.includes('explore')) {
                    items.push(data);
                }
            }
        } catch (e) {
            console.error('Instagram Discovery Error:', e.message);
        } finally {
            await page.close();
        }

        return items;
    }

    async close() {
        if (this.browser) await this.browser.close();
    }
}

module.exports = InstagramScraper;
