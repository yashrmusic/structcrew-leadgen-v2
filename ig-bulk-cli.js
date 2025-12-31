const InstagramOCR = require('./src/scraper/ig-ocr');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Bulk Instagram OCR CLI
 * Usage: node ig-bulk-cli.js [profileUrl] --limit [number]
 */
async function main() {
    const args = process.argv.slice(2);
    const profileUrl = args[0];
    const limitArg = args.indexOf('--limit');
    const limit = limitArg !== -1 ? parseInt(args[limitArg + 1]) : 50;

    if (!profileUrl) {
        console.log(chalk.red('Error: Profile URL is required.'));
        console.log(chalk.yellow('Usage: node ig-bulk-cli.js https://instagram.com/archi_jobs --limit 100'));
        process.exit(1);
    }

    console.log(chalk.cyan(`\n🚀 Starting Bulk OCR Discovery for: ${profileUrl}`));
    console.log(chalk.dim(`Mode: Full Scan (Limit: ${limit} posts)\n`));

    const igOcr = new InstagramOCR();

    try {
        const results = await igOcr.scanProfile(profileUrl, limit);

        if (results) {
            console.log(chalk.green('\n✅ Bulk Scan Complete!'));
            console.log(chalk.white(`----------------------------------`));
            console.log(chalk.cyan(`Total Images Scanned: `) + results.scannedImages);
            console.log(chalk.cyan(`Emails Extracted: `) + (results.extractedEmails.length || 0));
            console.log(chalk.cyan(`Phones Extracted: `) + (results.extractedPhones.length || 0));
            console.log(chalk.white(`----------------------------------`));

            if (results.extractedEmails.length > 0) {
                console.log(chalk.magenta('\nEmails Found:'));
                results.extractedEmails.forEach(e => console.log(`  - ${e}`));
            }

            if (results.extractedPhones.length > 0) {
                console.log(chalk.magenta('\nPhones Found:'));
                results.extractedPhones.forEach(p => console.log(`  - ${p}`));
            }

            // Save results to file
            const fileName = `ocr_leads_${profileUrl.split('/').filter(Boolean).pop()}.json`;
            const filePath = path.join(process.cwd(), fileName);
            await fs.writeJson(filePath, results, { spaces: 2 });

            console.log(chalk.green(`\n💾 Results saved to: ${fileName}`));
        } else {
            console.log(chalk.red('\n❌ Scan failed or returned no results.'));
        }

    } catch (e) {
        console.error(chalk.red('\n💥 Fatal Error:'), e.message);
    } finally {
        await igOcr.close();
        process.exit(0);
    }
}

main();
