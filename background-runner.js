const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const QUEUE_FILE = 'discovery_queue.txt';
const LOG_FILE = 'discovery_log.txt';

function log(msg) {
    const time = new Date().toISOString();
    const entry = `[${time}] ${msg}\n`;
    console.log(msg);
    fs.appendFileSync(LOG_FILE, entry);
}

async function start() {
    if (!fs.existsSync(QUEUE_FILE)) {
        log(`No ${QUEUE_FILE} found. Creating empty one.`);
        fs.writeFileSync(QUEUE_FILE, "Architects in Mumbai\nBuilders in Delhi\n");
        return;
    }

    const queries = fs.readFileSync(QUEUE_FILE, 'utf-8')
        .split('\n')
        .map(q => q.trim())
        .filter(q => q && !q.startsWith('#'));

    if (queries.length === 0) {
        log('Queue is empty.');
        return;
    }

    log(`Starting background discovery for ${queries.length} queries...`);

    for (const query of queries) {
        try {
            log(`Processing: ${query}`);
            // Run Maps Search + Enrichment
            execSync(`node cli.js search "${query}" --limit 10`, { stdio: 'inherit' });

            // Run Instagram Discovery
            const keyword = query.split(' in ')[0] || query;
            const location = query.split(' in ')[1] || '';
            execSync(`node cli.js ig-search "${keyword}" --location "${location}" --number 10`, { stdio: 'inherit' });

            log(`Successfully completed: ${query}`);
        } catch (e) {
            log(`Error processing ${query}: ${e.message}`);
        }
    }

    log('All background jobs completed.');
}

start();
