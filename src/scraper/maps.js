const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

/**
 * Google Maps Scraper Engine
 */
class MapsScraper {
    constructor() {
        this.browser = null;
    }

    /**
     * Initialize the browser
     */
    async init() {
        this.browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    /**
     * Search for leads on Google Maps
     * @param {string} query - e.g. "Architects in Mumbai"
     * @param {number} limit - max leads to fetch
     * @param {function} logCallback - callback for real-time logging
     */
    async search(query, limit = 20, logCallback = () => { }) {
        if (!this.browser) await this.init();

        const page = await this.browser.newPage();
        // Set a larger viewport
        await page.setViewport({ width: 1280, height: 900 });

        const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

        console.log(`Searching for: ${query}...`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });

        const leads = [];

        try {
            // Wait for results to load
            const containerSelector = 'div[role="feed"]';
            logCallback(`Waiting for Maps results...`);
            await page.waitForSelector(containerSelector, { timeout: 15000 });

            // Scrolling mechanism
            logCallback(`Scrolling to load leads (Limit: ${limit})...`);
            await page.evaluate(async (selector, maxLeads) => {
                const scrollContainer = document.querySelector(selector);
                let lastHeight = scrollContainer.scrollHeight;
                let scrollAttempts = 0;

                while (scrollAttempts < 15) {
                    scrollContainer.scrollBy(0, 1000);
                    await new Promise(r => setTimeout(r, 2000));

                    const newHeight = scrollContainer.scrollHeight;
                    if (newHeight === lastHeight) break;

                    const currentCount = document.querySelectorAll('div.Nv2PK').length;
                    if (currentCount >= maxLeads) break;

                    lastHeight = newHeight;
                    scrollAttempts++;
                }
            }, containerSelector, limit);

            // Extract results
            const leadElements = await page.$$('div.Nv2PK');
            const totalToExtract = Math.min(leadElements.length, limit);
            logCallback(`Total results visible: ${leadElements.length}. Extracting ${totalToExtract}...`);

            for (let i = 0; i < totalToExtract; i++) {
                const lead = await page.evaluate(el => {
                    const name = el.querySelector('.fontHeadlineSmall')?.innerText ||
                        el.querySelector('a.hfpxzc')?.getAttribute('aria-label') || 'Unknown';
                    const rating = el.querySelector('span.MW4etd')?.innerText || 'N/A';
                    const reviews = el.querySelector('span.UY7F9')?.innerText?.replace(/[()]/g, '') || '0';
                    const phone = el.querySelector('span.Us7fWe')?.innerText || 'N/A';
                    const website = el.querySelector('a.lcr4fd')?.href || 'N/A';

                    const infoDivs = Array.from(el.querySelectorAll('.W4Efsd span'));
                    const infoTexts = infoDivs.map(span => span.innerText).filter(t => t && t.trim().length > 2);
                    const address = infoTexts.find(t => t.includes(',') || /\d+/.test(t)) || 'N/A';

                    return { name, rating, reviews, address, website, phone };
                }, leadElements[i]);

                logCallback(`[${i + 1}/${totalToExtract}] Extracted: ${lead.name}`);
                leads.push(lead);
            }

        } catch (e) {
            console.error('Scraping error:', e.message);
        } finally {
            await page.close();
        }

        return leads;
    }

    async close() {
        if (this.browser) await this.browser.close();
    }
}

module.exports = MapsScraper;
