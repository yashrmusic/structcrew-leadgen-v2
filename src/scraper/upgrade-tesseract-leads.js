const path = require('path');
const fs = require('fs-extra');
const projectRoot = path.resolve(__dirname, '../..');
require('dotenv').config({ path: path.join(projectRoot, '.env') });

// Require modules using project-relative paths
const VisionOCR = require(path.join(projectRoot, 'src/scraper/vision-ocr'));

console.log('🔑 GLM Key Loaded:', process.env.GLM_API_KEY ? 'YES (Starts with ' + process.env.GLM_API_KEY.substring(0, 8) + ')' : 'NO');
console.log('🔑 Groq Key Loaded:', process.env.GROQ_API_KEY ? 'YES' : 'NO');

async function upgradeLeads() {
    console.log('🚀 Starting Supercharged Lead Upgrade (GLM-4V)...');

    const dbPath = path.join(projectRoot, 'outputs', 'archi_leads_gemini.json');
    const csvPath = path.join(projectRoot, 'outputs', 'archi_leads_gemini.csv');
    const imagesDir = path.join(projectRoot, 'ig_downloads', 'archi_jobs');

    if (!await fs.exists(dbPath)) {
        console.error('❌ Database not found at:', dbPath);
        return;
    }

    const data = await fs.readJson(dbPath);
    const leads = data.allData || [];
    const subSet = leads.filter(l => l.method === 'tesseract');

    console.log(`📊 Found ${subSet.length} leads that used Tesseract.`);
    console.log(`⚡ Upgrading using GLM-4V...`);

    const vision = new VisionOCR();
    let upgradedCount = 0;
    let newEmailsFound = 0;
    let newPhonesFound = 0;

    for (let i = 0; i < subSet.length; i++) {
        const lead = subSet[i];
        const progress = `[${i + 1}/${subSet.length}]`;
        const imgPath = path.join(imagesDir, lead.image);

        if (!await fs.exists(imgPath)) {
            console.log(`${progress} ⚠️ Image missing: ${lead.image}`);
            continue;
        }

        try {
            // Force GLM processed
            const result = await vision.processImage(imgPath);

            if (result.success && result.method.includes('glm')) {
                const oldEmails = lead.emails.length;
                const oldPhones = lead.phones.length;

                // Merge and deduplicate
                lead.emails = [...new Set([...lead.emails, ...result.emails])];
                lead.phones = [...new Set([...lead.phones, ...result.phones])];
                lead.method = result.method; // Mark as upgraded
                lead.rawText = result.rawText;

                newEmailsFound += (lead.emails.length - oldEmails);
                newPhonesFound += (lead.phones.length - oldPhones);
                upgradedCount++;

                console.log(`${progress} ✅ Upgraded ${lead.image} (${result.method})`);
            } else {
                console.log(`${progress} ⚪ No improvement for ${lead.image} (${result.method})`);
            }
        } catch (e) {
            console.log(`${progress} ❌ Error: ${e.message}`);
        }

        // Periodic save to prevent data loss
        if (i % 10 === 0) {
            await fs.writeJson(dbPath, leads, { spaces: 2 });
        }
    }

    // Final save
    await fs.writeJson(dbPath, leads, { spaces: 2 });

    // Generate fresh CSV
    const csvHeader = 'Image,Emails,Phones,Method\n';
    const csvRows = leads.map(l => {
        return `${l.image},"${l.emails.join(', ')}","${l.phones.join(', ')}",${l.method}`;
    }).join('\n');
    await fs.writeFile(csvPath, csvHeader + csvRows);

    console.log('\n✨ Upgrade Complete! ✨');
    console.log(`📊 Images Improved: ${upgradedCount}`);
    console.log(`📧 New Emails Found: ${newEmailsFound}`);
    console.log(`📞 New Phones Found: ${newPhonesFound}`);
}

upgradeLeads();
