const Tesseract = require('tesseract.js');
const fs = require('fs-extra');
const path = require('path');
const { createWorker } = Tesseract;

async function improveOCR() {
    const profile = 'archi_jobs';
    const profileDir = path.join(__dirname, 'ig_downloads', profile);
    
    const files = await fs.readdir(profileDir);
    const imageFiles = files.filter(f => f.endsWith('.jpg'));
    
    console.log(`📸 Processing ${imageFiles.length} images with enhanced OCR...`);
    
    const worker = await createWorker('eng', 1, {
        logger: m => {
            if (m.status === 'recognizing text') {
                process.stdout.write(`\rProgress: ${(m.progress * 100).toFixed(1)}%`);
            }
        }
    });
    
    await worker.setParameters({
        tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@.+-_',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: '1'
    });
    
    const allEmails = new Set();
    const allPhones = new Set();
    let processedCount = 0;
    
    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const filePath = path.join(profileDir, file);
        
        try {
            const { data: { text } } = await worker.recognize(filePath);
            
            const emailPatterns = [
                /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
                /[a-zA-Z0-9._%+-]+@gmail\.com/gi,
                /[a-zA-Z0-9._%+-]+@yahoo\.[a-z]{2,}/gi,
                /[a-zA-Z0-9._%+-]+@hotmail\.[a-z]{2,}/gi,
                /hr@|career@|contact@|info@|jobs@|recruit@|mail@|studio@|design@|architect@/gi
            ];
            
            const phonePatterns = [
                /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/g,
                /[\+]?[0-9]{10,15}/g
            ];
            
            for (const pattern of emailPatterns) {
                const matches = text.match(pattern) || [];
                matches.forEach(email => {
                    email = email.trim().toLowerCase();
                    if (email.includes('@') && email.includes('.') && email.length > 6) {
                        allEmails.add(email);
                    }
                });
            }
            
            for (const pattern of phonePatterns) {
                const matches = text.match(pattern) || [];
                matches.forEach(phone => {
                    phone = phone.replace(/[^\d+]/g, '');
                    if (phone.length >= 10 && phone.length <= 15) {
                        allPhones.add(phone);
                    }
                });
            }
            
            processedCount++;
            if (processedCount % 10 === 0) {
                console.log(`\n✅ ${processedCount}/${imageFiles.length} images - Found ${allEmails.size} emails, ${allPhones.size} phones`);
            }
            
        } catch (error) {
            console.error(`\n❌ Error processing ${file}:`, error.message);
        }
    }
    
    await worker.terminate();
    
    const results = {
        profile,
        timestamp: new Date().toISOString(),
        totalImages: imageFiles.length,
        emails: Array.from(allEmails).filter(e => e.includes('@')),
        phones: Array.from(allPhones).filter(p => p.length >= 10),
        statistics: {
            uniqueEmails: allEmails.size,
            uniquePhones: allPhones.size,
            extractionRate: ((allEmails.size / imageFiles.length) * 100).toFixed(2) + '%'
        }
    };
    
    const timestamp = Date.now();
    await fs.writeJson(`enhanced_ocr_${timestamp}.json`, results, { spaces: 2 });
    await fs.writeFile(`enhanced_emails_${timestamp}.txt`, results.emails.join('\n'));
    await fs.writeFile(`enhanced_phones_${timestamp}.txt`, results.phones.join('\n'));
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ENHANCED OCR COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📸 Images: ${imageFiles.length}`);
    console.log(`📧 Emails: ${results.emails.length} (was 116)`);
    console.log(`📱 Phones: ${results.phones.length} (was 64)`);
    console.log(`📊 Extraction Rate: ${results.statistics.extractionRate}`);
    console.log('='.repeat(60));
    
    console.log('\n📝 Saved files:');
    console.log(`  enhanced_ocr_${timestamp}.json`);
    console.log(`  enhanced_emails_${timestamp}.txt`);
    console.log(`  enhanced_phones_${timestamp}.txt`);
}

improveOCR().catch(console.error);
