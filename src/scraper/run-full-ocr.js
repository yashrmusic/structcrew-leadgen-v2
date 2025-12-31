require('dotenv').config();
const VisionOCR = require('./vision-ocr');
const fs = require('fs-extra');
const path = require('path');

async function runFullScan() {
    const projectRoot = path.resolve(__dirname, '../..');
    const downloadDir = path.join(projectRoot, 'ig_downloads/archi_jobs');
    const outputDir = path.join(projectRoot, 'outputs');
    const jsonOutput = path.join(outputDir, 'archi_leads_gemini.json');
    const csvOutput = path.join(outputDir, 'archi_leads_gemini.csv');

    if (!(await fs.pathExists(downloadDir))) {
        console.error(`Download directory not found: ${downloadDir}`);
        return;
    }

    // Load existing results to resume if possible
    let results = {
        extractedEmails: [],
        extractedPhones: [],
        scannedCount: 0,
        successCount: 0,
        failedCount: 0,
        allData: []
    };

    if (await fs.pathExists(jsonOutput)) {
        try {
            const existing = await fs.readJson(jsonOutput);
            if (existing && existing.allData) {
                results = existing;
                console.log(` Resuming from previous scan (${results.allData.length} images already processed)`);
            }
        } catch (e) {
            console.log('⚠️ Could not load existing JSON, starting fresh.');
        }
    }

    const files = await fs.readdir(downloadDir);
    const images = files
        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
        .map(f => path.join(downloadDir, f));

    const processedImages = new Set(results.allData.map(d => d.image));
    const imagesToProcess = images.filter(img => !processedImages.has(path.basename(img)));

    const ocr = new VisionOCR();

    console.log(`🚀 Starting scan of ${imagesToProcess.length} remaining images...`);
    console.log(`📁 Outputs: ${jsonOutput}, ${csvOutput}\n`);

    if (imagesToProcess.length > 0) {
        // Process individually to ensure real-time saving and progress
        const batchSize = 1;
        for (let i = 0; i < imagesToProcess.length; i += batchSize) {
            const batch = imagesToProcess.slice(i, i + batchSize);
            const batchResults = await ocr.processImages(batch, console.log);

            // Merge results
            results.extractedEmails = [...new Set([...results.extractedEmails, ...batchResults.extractedEmails])];
            results.extractedPhones = [...new Set([...results.extractedPhones, ...batchResults.extractedPhones])];
            results.scannedCount += batchResults.scannedCount;
            results.successCount += batchResults.successCount;
            results.failedCount += batchResults.failedCount;
            results.allData.push(...batchResults.allData);

            // Save JSON immediately
            await fs.writeJson(jsonOutput, results, { spaces: 2 });

            // Save CSV after each batch
            const rows = [];
            results.allData.forEach(item => {
                const emails = item.emails || [];
                const phones = item.phones || [];
                const maxLen = Math.max(emails.length, phones.length);
                for (let j = 0; j < maxLen; j++) {
                    rows.push({
                        email: emails[j] || '',
                        phone: phones[j] || '',
                        source: item.image
                    });
                }
            });
            const csvContent = 'Email,Phone,SourceImage\n' +
                rows.map(r => `"${r.email}","${r.phone}","${r.source}"`).join('\n');
            await fs.writeFile(csvOutput, csvContent);

            console.log(`󿱵 Progress: ${results.allData.length}/${images.length} images saved.`);
        }
    }

    console.log(`\n🎉 Scan Complete!`);
    console.log(`🎉 Total Unique Emails: ${results.extractedEmails.length}`);
    console.log(`🎉 Total Unique Phones: ${results.extractedPhones.length}`);
}

runFullScan().catch(console.error);
