const express = require('express');
const cors = require('cors');
const MapsScraper = require('../scraper/maps');
const Storage = require('./storage');
const InstagramOCR = require('../scraper/ig-ocr');
const InstagramDownloader = require('../scraper/ig-downloader');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const storage = new Storage();
const scraper = new MapsScraper();
const igOcr = new InstagramOCR();
const igDownloader = new InstagramDownloader();
const EventEmitter = require('events');
const logEvents = new EventEmitter();

const emitLog = (msg) => {
    logEvents.emit('log', { time: new Date().toLocaleTimeString(), message: msg });
};

app.use(cors());
app.use(express.json());
app.use(express.static('dashboard'));
app.use('/ig_downloads', express.static('ig_downloads'));

/**
 * Stats Overview
 */
app.get('/api/stats', (req, res) => {
    try {
        res.json({ success: true, data: storage.getStats() });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

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
 * Update lead status
 */
app.post('/api/leads/update', (req, res) => {
    const { name, status } = req.body;
    if (!name || !status) return res.status(400).json({ error: 'Missing name or status' });

    try {
        const success = storage.updateLeadStatus(name, status);
        res.json({ success });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * Queue Management
 */
app.get('/api/queue', (req, res) => {
    res.json({ success: true, data: storage.getQueue() });
});

app.post('/api/queue', (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });
    const item = storage.addToQueue(query);
    res.json({ success: true, data: item });
});

app.delete('/api/queue/:id', (req, res) => {
    const success = storage.removeFromQueue(req.params.id);
    res.json({ success });
});

/**
 * Real-time Logs (SSE)
 */
app.get('/api/logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const onLog = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    logEvents.on('log', onLog);

    req.on('close', () => {
        logEvents.removeListener('log', onLog);
    });
});

/**
 * Lead Discovery Endpoint (Direct Search)
 */
app.get('/api/search', async (req, res) => {
    const { q, limit } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

    emitLog(`Initializing discovery for: "${q}" (Limit: ${limit})`);
    try {
        emitLog(`Launching browser engine...`);
        const results = await scraper.search(q, parseInt(limit) || 20, (msg) => emitLog(msg));
        emitLog(`Extraction complete. Found ${results.length} leads.`);
        res.json({ success: true, count: results.length, data: results });
    } catch (e) {
        emitLog(`CRITICAL ERROR: ${e.message}`);
        console.error('API Error:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * Instagram OCR Scan
 */
app.post('/api/instagram/scan', async (req, res) => {
    const { url, limit } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    emitLog(`Starting deeply-focused OCR scan for: ${url} (Limit: ${limit || 9} posts)`);
    try {
        const results = await igOcr.scanProfile(url, parseInt(limit) || 9);
        emitLog(`Deep scan finished for ${url}. Found ${results.extractedEmails.length} emails and ${results.extractedPhones.length} phones.`);
        res.json({ success: true, data: results });
    } catch (e) {
        emitLog(`OCR Error: ${e.message}`);
        res.status(500).json({ success: false, error: e.message });
    }
});

/**
 * Bulk Instagram Download + OCR (using instaloader)
 */
app.post('/api/instagram/bulk', async (req, res) => {
    const { username, limit } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    // Clean username
    const cleanUsername = username.replace('@', '').replace('https://www.instagram.com/', '').replace(/\//g, '');

    emitLog(`[BULK] Starting instaloader download for @${cleanUsername} (Limit: ${limit || 50} posts)`);
    try {
        const results = await igDownloader.scanProfile(cleanUsername, parseInt(limit) || 50, (msg) => emitLog(msg));

        if (results.success) {
            emitLog(`[BULK] Finished! Emails: ${results.extractedEmails.length}, Phones: ${results.extractedPhones.length}`);
            res.json({ success: true, data: results });
        } else {
            emitLog(`[BULK] Failed: ${results.error}`);
            res.status(500).json({ success: false, error: results.error });
        }
    } catch (e) {
        emitLog(`[BULK] Error: ${e.message}`);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`StructCrew LeadGen API running on http://localhost:${PORT}`);
});
