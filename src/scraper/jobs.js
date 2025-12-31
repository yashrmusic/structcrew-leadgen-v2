const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

/**
 * Job Discovery Engine
 * Targets LinkedIn and Naukri via Google Search Proxy
 */
class JobScraper {
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
     * Search for hiring companies via Google
     * e.g. site:naukri.com "remote HR" hiring
     */
    async searchHiring(keyword, platform = 'linkedin.com/jobs', limit = 10) {
        await this.init();
        const page = await this.browser.newPage();

        // Specific search query to find recent job listings
        const searchQuery = `site:${platform} "${keyword}" hiring`;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbs=qdr:w`; // tbs=qdr:w filters by past week

        console.log(`Job Discovery (${platform}): ${searchQuery}...`);

        const jobs = [];
        try {
            await page.goto(searchUrl, { waitUntil: 'networkidle2' });

            const results = await page.$$('.g');
            for (let i = 0; i < Math.min(results.length, limit); i++) {
                const data = await page.evaluate((el, platformName) => {
                    const title = el.querySelector('h3')?.innerText || '';
                    const link = el.querySelector('a')?.href || '';
                    const snippet = el.querySelector('.VwiC3b')?.innerText || '';

                    // Try to extract company name from title "HR Manager - Remote at [Company]..."
                    let company = 'Unknown';
                    if (title.includes(' at ')) company = title.split(' at ')[1].split('|')[0].split('-')[0].trim();
                    else if (title.includes(' | ')) company = title.split('|')[1].trim();

                    return {
                        name: company !== 'Unknown' ? `${company} (Hiring)` : title,
                        title,
                        website: link,
                        address: 'Remote / Job Board',
                        status: 'New',
                        details: {
                            platform: platformName,
                            snippet,
                            discoveredAt: new Date().toISOString(),
                            source: 'JobBoard'
                        }
                    };
                }, results[i], platform.split('.')[0]);

                if (data.website) {
                    jobs.push(data);
                }
            }
        } catch (e) {
            console.error(`Job Discovery Error ${platform}:`, e.message);
        } finally {
            await page.close();
        }

        return jobs;
    }

    async discoverAll(keyword, limit = 5) {
        const linkedinJobs = await this.searchHiring(keyword, 'linkedin.com/jobs', limit);
        const naukriJobs = await this.searchHiring(keyword, 'naukri.com', limit);
        return [...linkedinJobs, ...naukriJobs];
    }

    async close() {
        if (this.browser) await this.browser.close();
    }
}

module.exports = JobScraper;
