const express = require('express');
const cors = require('cors');
const MapsScraper = require('../scraper/maps');
const Storage = require('./storage');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const storage = new Storage();
const scraper = new MapsScraper();

app.use(cors());
app.use(express.json());
app.use(express.static('dashboard'));

/**
 * Get all stored leads
 */
app.get('/api/leads', (req, res) => {
    try {
        const leads = storage.getAll();
        res.json({ success: true, count: leads.length, data: leads });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * Lead Discovery Endpoint
 */
app.get('/api/search', async (req, res) => {
    const { q, limit } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

    try {
        const results = await scraper.search(q, parseInt(limit) || 20);
        // We don't save to storage automatically here to avoid clutter 
        // unless explicitly requested by the UI (future feature)
        res.json({ success: true, count: results.length, data: results });
    } catch (e) {
        console.error('API Error:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`StructCrew LeadGen API running on http://localhost:${PORT}`);
});
