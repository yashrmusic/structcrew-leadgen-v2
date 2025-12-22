const MapsScraper = require('./src/scraper/maps');
const Enricher = require('./src/scraper/enricher');

async function test() {
    const scraper = new MapsScraper();
    const enricher = new Enricher();

    try {
        console.log('--- Testing V3 Enrichment Engine ---');

        // Search for Architects
        const leads = await scraper.search('Architects in Mumbai', 3);

        console.log(`\nFound ${leads.length} leads. Starting enrichment...`);

        for (let lead of leads) {
            if (lead.website !== 'N/A') {
                const extraInfo = await enricher.enrich(lead.website);
                lead.details = extraInfo;
            }
        }

        console.log('\nEnriched Results:');
        console.log(JSON.stringify(leads, null, 2));

        if (leads.some(l => l.details)) {
            console.log('\n✅ Enrichment successful!');
        } else {
            console.log('\n⚠️ No enrichment data found. Check website access.');
        }

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        await scraper.close();
        await enricher.close();
    }
}

test();
