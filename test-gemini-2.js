require('dotenv').config();
const GeminiOCR = require('./src/scraper/gemini-ocr');
const fs = require('fs-extra');
const path = require('path');

async function test() {
    const dir = './ig_downloads/archi_jobs';
    const ocr = new GeminiOCR();

    try {
        const files = await fs.readdir(dir);
        const images = files
            .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f) && !f.includes('profile_pic'))
            .map(f => path.join(dir, f))
            .slice(0, 20);

        console.log(`Testing Gemini 2.5 Flash OCR on ${images.length} images...`);
        const results = await ocr.processImages(images, console.log);

        console.log('\n=== FINAL RESULTS ===');
        console.log('Scanned Count:', results.scannedCount);
        console.log('Unique Emails:', results.extractedEmails.length);
        console.log('Unique Phones:', results.extractedPhones.length);
        console.log('Extracted Emails:');
        results.extractedEmails.forEach(e => console.log(`  - ${e}`));
        console.log('Extracted Phones:');
        results.extractedPhones.forEach(p => console.log(`  - ${p}`));
    } catch (e) {
        console.error('Error in test:', e);
    }
}

test();
