const cron = require('node-cron');
const MapsScraper = require('../scraper/maps');
const Enricher = require('../scraper/enricher');
const Storage = require('./storage');
const InstagramScraper = require('../scraper/instagram');
const JobScraper = require('../scraper/jobs');

const storage = new Storage();

/**
 * Core Discovery Processor
 * Processes a single query and saves results
 */
async function processQuery(queryItem) {
    const { id, query } = queryItem;
    console.log(`[Scheduler] Processing: ${query}`);

    const scraper = new MapsScraper();
    const enricher = new Enricher();
    const igScraper = new InstagramScraper();
    const jobScraper = new JobScraper();

    try {
        storage.updateQueueStatus(id, 'running');

        // 1. Google Maps Search
        const leads = await scraper.search(query, 10);

        // 2. Enrichment
        for (let lead of leads) {
            if (lead.website !== 'N/A') {
                lead.details = await enricher.enrich(lead.website);
            }
        }

        // 3. Instagram Discovery (Mental check: use keyword + location)
        const parts = query.split(' in ');
        const keyword = parts[0] || query;
        const location = parts[1] || '';
        const igProfiles = await igScraper.discover(keyword, location, 5);

        // Merge IG results into lead list
        const allResults = [...leads, ...igProfiles];

        // 4. Job Board Discovery (Naukri, LinkedIn)
        const jobLeads = await jobScraper.discoverAll(query, 3);
        const finalResults = [...allResults, ...jobLeads];

        // 5. Save
        storage.save(finalResults);

        storage.updateQueueStatus(id, 'pending', new Date().toISOString());
        console.log(`[Scheduler] Completed: ${query}`);

    } catch (e) {
        console.error(`[Scheduler] Error processing ${query}:`, e.message);
        storage.updateQueueStatus(id, 'failed');
    } finally {
        await scraper.close();
        await enricher.close();
        await igScraper.close();
        await jobScraper.close();
    }
}

/**
 * Run all pending items in the queue
 */
async function runQueue() {
    const queue = storage.getQueue();
    const pending = queue.filter(item => item.status !== 'running');

    for (const item of pending) {
        await processQuery(item);
    }
}

/**
 * Schedule tasks
 * Runs every day at midnight (00:00)
 */
cron.schedule('0 0 * * *', () => {
    console.log('[Scheduler] Starting midnight discovery run...');
    runQueue();
});

module.exports = { runQueue, processQuery };
