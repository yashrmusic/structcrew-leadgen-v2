const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function saveOCRResults() {
    const profile = 'archi_jobs';
    const results = {
        emails: [],
        phones: [],
        metadata: {
            profile,
            timestamp: new Date().toISOString(),
            totalImages: 0
        }
    };

    const profileDir = path.join(__dirname, 'ig_downloads', profile);
    
    if (!await fs.pathExists(profileDir)) {
        console.error(`Profile directory not found: ${profileDir}`);
        process.exit(1);
    }

    const files = await fs.readdir(profileDir);
    const imageFiles = files.filter(f => f.endsWith('.jpg'));
    
    results.metadata.totalImages = imageFiles.length;
    console.log(`Found ${imageFiles.length} images to process`);

    const OCR = require('tesseract.js');
    const worker = await OCR.createWorker('eng');
    
    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const filePath = path.join(profileDir, file);
        
        try {
            await worker.load(filePath);
            const { data: { text } } = await worker.recognize(filePath);
            
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
            const phoneRegex = /(\+?[\d\s\-\(\)]{10,15})/g;
            
            const emails = text.match(emailRegex) || [];
            const phones = text.match(phoneRegex) || [];
            
            emails.forEach(email => {
                if (!results.emails.includes(email.trim())) {
                    results.emails.push(email.trim());
                }
            });
            
            phones.forEach(phone => {
                const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
                if (cleanPhone.length >= 10 && !results.phones.includes(cleanPhone)) {
                    results.phones.push(cleanPhone);
                }
            });
            
            if ((i + 1) % 50 === 0) {
                console.log(`Processed ${i + 1}/${imageFiles.length} images`);
            }
            
        } catch (error) {
            console.error(`Error processing ${file}:`, error.message);
        }
    }
    
    await worker.terminate();

    const timestamp = Date.now();
    const jsonFile = `ocr_results_${profile}_${timestamp}.json`;
    const emailFile = `emails_${profile}_${timestamp}.txt`;
    const phoneFile = `phones_${profile}_${timestamp}.txt`;
    
    await fs.writeJson(jsonFile, results, { spaces: 2 });
    await fs.writeFile(emailFile, results.emails.join('\n'));
    await fs.writeFile(phoneFile, results.phones.join('\n'));
    
    console.log('\n✅ Results saved:');
    console.log(`  JSON: ${jsonFile}`);
    console.log(`  Emails: ${emailFile} (${results.emails.length} emails)`);
    console.log(`  Phones: ${phoneFile} (${results.phones.length} phones)`);
    
    console.log('\n📊 Summary:');
    console.log(`  Total images: ${results.metadata.totalImages}`);
    console.log(`  Unique emails: ${results.emails.length}`);
    console.log(`  Unique phones: ${results.phones.length}`);
}

saveOCRResults().catch(console.error);
