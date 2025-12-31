const Tesseract = require('tesseract.js');
const fs = require('fs');

const images = fs.readFileSync('/tmp/quick_batch.txt', 'utf8').split('\n').filter(Boolean);

async function quickDemo() {
  console.log('🚀 QUICK OCR DEMO - 20 images\n');

  let emails = new Set();
  let phones = new Set();
  let scanned = 0;

  for (let i = 0; i < images.length; i++) {
    process.stdout.write(`[${i + 1}/20] Scanning...\r`);

    try {
      const { data: { text } } = await Tesseract.recognize(images[i], 'eng');

      const foundEmails = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi) || [];
      const foundPhones = text.match(/(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g) || [];

      foundEmails.forEach(e => emails.add(e.toLowerCase()));
      foundPhones.forEach(p => phones.add(p));
      scanned++;
    } catch (e) {}
  }

  const results = {
    scannedCount: scanned,
    extractedEmails: Array.from(emails),
    extractedPhones: Array.from(phones)
  };

  process.stdout.write('                    \r');
  console.log('\n✅ OCR COMPLETE!\n');
  console.log('📧 Emails found:', results.extractedEmails.length);
  results.extractedEmails.forEach(e => console.log('   -', e));

  console.log('\n📱 Phones found:', results.extractedPhones.length);
  results.extractedPhones.forEach(p => console.log('   -', p));

  fs.writeFileSync('demo_ocr_results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Saved to: demo_ocr_results.json');
}

quickDemo().catch(console.error);