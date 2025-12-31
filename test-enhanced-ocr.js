/**
 * Test the Enhanced OCR Engine
 * Run: node test-enhanced-ocr.js [path-to-image-or-folder]
 */

const EnhancedOCR = require('./src/scraper/enhanced-ocr');
const fs = require('fs-extra');
const path = require('path');

async function main() {
    const target = process.argv[2] || './ig_downloads';

    console.log('\n🔍 Enhanced OCR Test\n');
    console.log(`Target: ${target}\n`);

    const ocr = new EnhancedOCR();

    try {
        let images = [];

        const stat = await fs.stat(target);
        if (stat.isDirectory()) {
            // Get all images from directory
            const entries = await fs.readdir(target, { withFileTypes: true });

            for (const entry of entries) {
                const entryPath = path.join(target, entry.name);
                if (entry.isDirectory()) {
                    // Scan subdirectory
                    const subFiles = await fs.readdir(entryPath);
                    const subImages = subFiles
                        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
                        .map(f => path.join(entryPath, f));
                    images.push(...subImages);
                } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
                    images.push(entryPath);
                }
            }
        } else if (/\.(jpg|jpeg|png|webp)$/i.test(target)) {
            images = [target];
        }

        if (images.length === 0) {
            console.log('No images found to process.');
            await ocr.close();
            return;
        }

        console.log(`Found ${images.length} images to process\n`);

        // Limit to first 20 for testing
        const testImages = images.slice(0, 20);
        console.log(`Testing with first ${testImages.length} images...\n`);

        const results = await ocr.processImages(testImages, console.log);

        console.log('\n--- RESULTS ---');
        console.log(`Scanned: ${results.scannedCount} images`);
        console.log(`Emails: ${results.extractedEmails.length}`);
        results.extractedEmails.forEach(e => console.log(`  📧 ${e}`));
        console.log(`Phones: ${results.extractedPhones.length}`);
        results.extractedPhones.forEach(p => console.log(`  📞 ${p}`));

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await ocr.close();
    }
}

main();
