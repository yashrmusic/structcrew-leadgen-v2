#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const InstagramDownloader = require('./src/scraper/ig-downloader');
const GoogleSheetsStorage = require('./src/server/google-sheets');
const fs = require('fs-extra');
const path = require('path');

const program = new Command();

program
    .name('ig-bulk')
    .description('Bulk Instagram Profile Downloader & OCR Scanner')
    .version('1.0.0');

program
    .command('download')
    .description('Download a single Instagram profile with up to 50k posts')
    .argument('<username>', 'Instagram username (without @)')
    .option('-p, --posts <number>', 'Total posts to download', '50000')
    .option('-b, --batch <number>', 'Batch size for downloads', '1000')
    .action(async (username, options) => {
        const downloader = new InstagramDownloader();
        const totalPosts = parseInt(options.posts);
        const batchSize = parseInt(options.batch);

        console.log(chalk.cyan.bold(`\n🚀 BULK INSTAGRAM DOWNLOADER`));
        console.log(chalk.white(`Profile: @${username}`));
        console.log(chalk.white(`Target Posts: ${totalPosts}`));
        console.log(chalk.white(`Batch Size: ${batchSize}\n`));

        const startTime = Date.now();

        try {
            const result = await downloader.downloadLargeProfile(
                username,
                totalPosts,
                batchSize,
                (msg) => console.log(chalk.dim(msg))
            );

            const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

            console.log(`\n${'='.repeat(60)}`);
            console.log(chalk.green.bold(`✅ DOWNLOAD COMPLETE!`));
            console.log(`Profile: @${username}`);
            console.log(chalk.cyan(`Total Images: ${result.imageCount}`));
            console.log(chalk.cyan(`Batches: ${result.batchesProcessed}`));
            console.log(chalk.cyan(`Duration: ${duration} minutes`));
            console.log(chalk.cyan(`Directory: ${result.profileDir}`));
            console.log(`${'='.repeat(60)}\n`);

            const historyPath = path.join(downloader.downloadDir, 'download_history.json');
            let history = [];
            if (await fs.pathExists(historyPath)) {
                history = await fs.readJson(historyPath);
            }
            history.push({
                username,
                date: new Date().toISOString(),
                imageCount: result.imageCount,
                batches: result.batchesProcessed
            });
            await fs.writeJson(historyPath, history, { spaces: 2 });

        } catch (e) {
            console.error(chalk.red(`\n❌ Download Failed: ${e.message}\n`));
            process.exit(1);
        }
    });

program
    .command('scan')
    .description('Download profile and run OCR on all images')
    .argument('<username>', 'Instagram username (without @)')
    .option('-p, --posts <number>', 'Total posts to download', '50000')
    .option('-b, --batch <number>', 'Download batch size', '1000')
    .option('-c, --concurrency <number>', 'OCR concurrency (1-5)', '3')
    .option('-o, --output <file>', 'Output JSON filename', `ocr_results_${Date.now()}.json`)
    .option('--csv', 'Also export to CSV')
    .option('-s, --sheet <id>', 'Google Sheet ID to save leads')
    .option('--creds <path>', 'Path to Google credentials JSON file', './google-credentials.json')
    .action(async (username, options) => {
        const downloader = new InstagramDownloader();
        const totalPosts = parseInt(options.posts);
        const batchSize = parseInt(options.batch);
        const ocrConcurrency = Math.min(5, Math.max(1, parseInt(options.concurrency)));

        console.log(chalk.cyan.bold(`\n🚀 BULK INSTAGRAM SCANNER`));
        console.log(chalk.white(`Profile: @${username}`));
        console.log(chalk.white(`Target Posts: ${totalPosts}`));
        console.log(chalk.white(`Download Batch: ${batchSize}`));
        console.log(chalk.white(`OCR Concurrency: ${ocrConcurrency}\n`));

        const startTime = Date.now();

        try {
            const result = await downloader.scanLargeProfile(
                username,
                totalPosts,
                batchSize,
                ocrConcurrency,
                (msg) => console.log(chalk.dim(msg))
            );

            const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

            console.log(`\n${'='.repeat(60)}`);
            console.log(chalk.green.bold(`✅ SCAN COMPLETE!`));
            console.log(`Profile: @${username}`);
            console.log(chalk.cyan(`Images Downloaded: ${result.totalImagesDownloaded}`));
            console.log(chalk.cyan(`Images Scanned: ${result.scannedCount}`));
            console.log(chalk.cyan(`Emails Found: ${result.extractedEmails.length}`));
            console.log(chalk.cyan(`Phones Found: ${result.extractedPhones.length}`));
            console.log(chalk.cyan(`Duration: ${duration} minutes`));
            console.log(`${'='.repeat(60)}\n`);

            if (result.extractedEmails.length > 0) {
                console.log(chalk.magenta.bold(`📧 EMAILS:`));
                result.extractedEmails.forEach(e => console.log(chalk.white(`   ${e}`)));
            }

            if (result.extractedPhones.length > 0) {
                console.log(chalk.magenta.bold(`📱 PHONES:`));
                result.extractedPhones.forEach(p => console.log(chalk.white(`   ${p}`)));
            }

            await downloader.exportResults(result, options.output);
            console.log(chalk.green(`\n💾 JSON saved: ${options.output}`));

            if (options.csv) {
                const csvFile = await downloader.exportCSV(result, options.output.replace('.json', '.csv'));
                console.log(chalk.green(`💾 CSV saved: ${csvFile}`));
            }

            if (options.sheet) {
                if (!await fs.pathExists(options.creds)) {
                    console.log(chalk.red(`\n❌ Google credentials file not found: ${options.creds}`));
                    console.log(chalk.yellow('Follow these steps to set up Google Sheets:\n'));
                    console.log(chalk.white('1. Create Google Cloud Project: https://console.cloud.google.com'));
                    console.log(chalk.white('2. Enable Google Sheets API'));
                    console.log(chalk.white('3. Create Service Account with Editor role'));
                    console.log(chalk.white('4. Download JSON credentials'));
                    console.log(chalk.white('5. Create a Google Sheet and copy its ID from URL'));
                    console.log(chalk.white('6. Share sheet with service account email as Editor\n'));
                    process.exit(1);
                }

                console.log(chalk.cyan.bold(`\n📊 SAVING TO GOOGLE SHEETS...`));
                const sheets = new GoogleSheetsStorage(options.sheet, options.creds);
                await sheets.connect();

                const leads = [];
                result.extractedEmails.forEach(email => {
                    const emailDomain = email.split('@')[1] || '';
                    const companyName = emailDomain.split('.')[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();
                    const state = '';

                    leads.push({
                        companyName: companyName.charAt(0).toUpperCase() + companyName.slice(1),
                        email: email.toLowerCase(),
                        phone: '',
                        state: state,
                        instagramHandle: `@${username}`,
                        source: 'Instagram OCR'
                    });
                });

                result.extractedPhones.forEach(phone => {
                    leads.push({
                        companyName: '',
                        email: '',
                        phone: phone,
                        state: '',
                        instagramHandle: `@${username}`,
                        source: 'Instagram OCR'
                    });
                });

                console.log(chalk.white(`Uploading ${leads.length} leads to Google Sheets...`));
                const batchResult = await sheets.batchAddLeads(leads);

                console.log(chalk.green(`\n✅ Google Sheets Sync Complete!`));
                console.log(chalk.cyan(`  Added: ${batchResult.added.length}`));
                console.log(chalk.yellow(`  Duplicates: ${batchResult.duplicates.length}`));
                console.log(chalk.red(`  Errors: ${batchResult.errors.length}`));

                if (batchResult.duplicates.length > 0) {
                    console.log(chalk.dim(`\nDuplicate entries skipped:`));
                    batchResult.duplicates.slice(0, 5).forEach(d => {
                        console.log(chalk.dim(`  - ${d.reason}`));
                    });
                    if (batchResult.duplicates.length > 5) {
                        console.log(chalk.dim(`  ... and ${batchResult.duplicates.length - 5} more`));
                    }
                }
            }

            console.log();

        } catch (e) {
            console.error(chalk.red(`\n❌ Scan Failed: ${e.message}\n`));
            process.exit(1);
        }
    });

program
    .command('batch')
    .description('Process multiple Instagram profiles')
    .argument('<file>', 'Text file with one username per line')
    .option('-p, --posts <number>', 'Total posts per profile', '50000')
    .option('-b, --batch <number>', 'Download batch size', '1000')
    .option('-c, --concurrency <number>', 'OCR concurrency', '3')
    .option('-o, --output <file>', 'Output JSON filename', `batch_results_${Date.now()}.json`)
    .action(async (file, options) => {
        const downloader = new InstagramDownloader();
        const totalPosts = parseInt(options.posts);
        const batchSize = parseInt(options.batch);
        const ocrConcurrency = parseInt(options.concurrency);

        try {
            const content = await fs.readFile(file, 'utf8');
            const usernames = content
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));

            if (usernames.length === 0) {
                console.log(chalk.red('❌ No valid usernames found in file.'));
                process.exit(1);
            }

            console.log(chalk.cyan.bold(`\n🚀 BATCH PROCESSING`));
            console.log(chalk.white(`Profiles to process: ${usernames.length}`));
            console.log(chalk.white(`Target posts per profile: ${totalPosts}\n`));

            const startTime = Date.now();

            const results = await downloader.batchScanProfiles(
                usernames,
                totalPosts,
                batchSize,
                ocrConcurrency,
                (msg) => console.log(chalk.dim(msg))
            );

            const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

            console.log(`\n${'='.repeat(60)}`);
            console.log(chalk.green.bold(`✅ BATCH COMPLETE!`));
            console.log(chalk.cyan(`Profiles Processed: ${results.length}`));
            console.log(chalk.cyan(`Total Images Downloaded: ${results.reduce((sum, r) => sum + (r.totalImagesDownloaded || 0), 0)}`));
            console.log(chalk.cyan(`Total Images Scanned: ${results.reduce((sum, r) => sum + (r.scannedCount || 0), 0)}`));
            console.log(chalk.cyan(`Total Emails: ${results.reduce((sum, r) => sum + (r.extractedEmails?.length || 0), 0)}`));
            console.log(chalk.cyan(`Total Phones: ${results.reduce((sum, r) => sum + (r.extractedPhones?.length || 0), 0)}`));
            console.log(chalk.cyan(`Duration: ${duration} minutes`));
            console.log(`${'='.repeat(60)}\n`);

            await downloader.exportResults(results, options.output);
            console.log(chalk.green(`💾 Results saved: ${options.output}\n`));

        } catch (e) {
            console.error(chalk.red(`\n❌ Batch Failed: ${e.message}\n`));
            process.exit(1);
        }
    });

program
    .command('ocr-only')
    .description('Run OCR on already downloaded profile')
    .argument('<username>', 'Instagram username (without @)')
    .option('-c, --concurrency <number>', 'OCR concurrency', '3')
    .action(async (username, options) => {
        const downloader = new InstagramDownloader();
        const ocrConcurrency = parseInt(options.concurrency);

        console.log(chalk.cyan.bold(`\n🔍 OCR ONLY MODE`));
        console.log(chalk.white(`Profile: @${username}\n`));

        const profileDir = path.join(downloader.downloadDir, username);
        const images = await downloader.getImageFiles(profileDir);

        if (images.length === 0) {
            console.log(chalk.red(`❌ No images found in ${profileDir}\n`));
            process.exit(1);
        }

        console.log(chalk.cyan(`Found ${images.length} images. Starting OCR...\n`));

        const startTime = Date.now();
        const result = await downloader.performParallelOCR(images, ocrConcurrency);
        const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

        console.log(`\n${'='.repeat(60)}`);
        console.log(chalk.green.bold(`✅ OCR COMPLETE!`));
        console.log(chalk.cyan(`Images Scanned: ${result.scannedCount}`));
        console.log(chalk.cyan(`Emails Found: ${result.extractedEmails.length}`));
        console.log(chalk.cyan(`Phones Found: ${result.extractedPhones.length}`));
        console.log(chalk.cyan(`Duration: ${duration} minutes`));
        console.log(`${'='.repeat(60)}\n`);

        if (result.extractedEmails.length > 0) {
            console.log(chalk.magenta.bold(`📧 EMAILS:`));
            result.extractedEmails.forEach(e => console.log(chalk.white(`   ${e}`)));
        }

        if (result.extractedPhones.length > 0) {
            console.log(chalk.magenta.bold(`📱 PHONES:`));
            result.extractedPhones.forEach(p => console.log(chalk.white(`   ${p}`)));
        }

        console.log();
    });

program
    .command('list')
    .description('List downloaded profiles')
    .action(async () => {
        const downloader = new InstagramDownloader();
        const historyPath = path.join(downloader.downloadDir, 'download_history.json');

        console.log(chalk.cyan.bold(`\n📂 DOWNLOADED PROFILES\n`));

        try {
            if (await fs.pathExists(historyPath)) {
                const history = await fs.readJson(historyPath);

                if (history.length === 0) {
                    console.log(chalk.dim('No profiles downloaded yet.\n'));
                    return;
                }

                console.log(chalk.cyan('Username') + ' '.repeat(20) + chalk.cyan('Images') + ' '.repeat(10) + chalk.cyan('Date'));
                console.log('-'.repeat(60));

                history.forEach(h => {
                    const date = new Date(h.date).toLocaleDateString();
                    console.log(`@${h.username.padEnd(20)}${h.imageCount.toString().padStart(8)}${date}`);
                });
                console.log();

            } else {
                console.log(chalk.dim('No profiles downloaded yet.\n'));
            }

            const profiles = await fs.readdir(downloader.downloadDir);
            const filtered = profiles.filter(p => !p.startsWith('.') && p !== '.sessions');

            console.log(chalk.cyan.bold(`Available in ${downloader.downloadDir}:`));

            for (const p of filtered) {
                try {
                    const profilePath = path.join(downloader.downloadDir, p);
                    const files = await fs.readdir(profilePath);
                    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
                    console.log(`  @${p} (${imageFiles.length} images)`);
                } catch (e) {}
            }

            console.log();

        } catch (e) {
            console.error(chalk.red(`Error: ${e.message}\n`));
        }
    });

program
    .command('sheets-stats')
    .description('View Google Sheets statistics')
    .requiredOption('-s, --sheet <id>', 'Google Sheet ID')
    .option('--creds <path>', 'Path to Google credentials JSON file', './google-credentials.json')
    .action(async (options) => {
        if (!await fs.pathExists(options.creds)) {
            console.log(chalk.red(`\n❌ Google credentials file not found: ${options.creds}\n`));
            process.exit(1);
        }

        const sheets = new GoogleSheetsStorage(options.sheet, options.creds);
        await sheets.connect();

        const stats = await sheets.getStats();

        console.log(`\n${'='.repeat(60)}`);
        console.log(chalk.cyan.bold(`📊 GOOGLE SHEETS STATISTICS`));
        console.log(`${'='.repeat(60)}\n`);

        console.log(chalk.cyan(`Total Leads:`) + ` ${stats.total}`);
        console.log(chalk.cyan(`Unique Emails:`) + ` ${stats.uniqueEmails}`);
        console.log(chalk.cyan(`Unique Phones:`) + ` ${stats.uniquePhones}\n`);

        console.log(chalk.cyan.bold(`By Source:`));
        for (const [source, count] of Object.entries(stats.bySource)) {
            console.log(`  ${source}: ${count}`);
        }

        console.log(`\n${chalk.cyan.bold(`By Status:`)}`);
        for (const [status, count] of Object.entries(stats.byStatus)) {
            console.log(`  ${status}: ${count}`);
        }

        console.log(`\n${chalk.cyan.bold(`By State:`)}`);
        for (const [state, count] of Object.entries(stats.byState)) {
            console.log(`  ${state}: ${count}`);
        }

        console.log();
    });

program
    .command('sheets-export')
    .description('Export OCR results to Google Sheets')
    .requiredOption('-i, --input <file>', 'Input JSON file with OCR results')
    .requiredOption('-s, --sheet <id>', 'Google Sheet ID')
    .option('--creds <path>', 'Path to Google credentials JSON file', './google-credentials.json')
    .action(async (options) => {
        if (!await fs.pathExists(options.creds)) {
            console.log(chalk.red(`\n❌ Google credentials file not found: ${options.creds}\n`));
            process.exit(1);
        }

        if (!await fs.pathExists(options.input)) {
            console.log(chalk.red(`\n❌ Input file not found: ${options.input}\n`));
            process.exit(1);
        }

        const ocrResults = await fs.readJson(options.input);
        const username = ocrResults.username || 'unknown';

        console.log(chalk.cyan.bold(`\n📊 EXPORTING TO GOOGLE SHEETS`));
        console.log(chalk.white(`Input: ${options.input}`));
        console.log(chalk.white(`Profile: @${username}\n`));

        const sheets = new GoogleSheetsStorage(options.sheet, options.creds);
        await sheets.connect();

        const leads = [];

        ocrResults.extractedEmails.forEach(email => {
            const emailDomain = email.split('@')[1] || '';
            const companyName = emailDomain.split('.')[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();

            leads.push({
                companyName: companyName.charAt(0).toUpperCase() + companyName.slice(1),
                email: email.toLowerCase(),
                phone: '',
                state: '',
                instagramHandle: `@${username}`,
                source: 'Instagram OCR'
            });
        });

        ocrResults.extractedPhones.forEach(phone => {
            leads.push({
                companyName: '',
                email: '',
                phone: phone,
                state: '',
                instagramHandle: `@${username}`,
                source: 'Instagram OCR'
            });
        });

        console.log(chalk.white(`Uploading ${leads.length} leads...`));
        const batchResult = await sheets.batchAddLeads(leads);

        console.log(`\n${'='.repeat(60)}`);
        console.log(chalk.green.bold(`✅ EXPORT COMPLETE!`));
        console.log(chalk.cyan(`  Added: ${batchResult.added.length}`));
        console.log(chalk.yellow(`  Duplicates: ${batchResult.duplicates.length}`));
        console.log(chalk.red(`  Errors: ${batchResult.errors.length}`));
        console.log(`${'='.repeat(60)}\n`);

        if (batchResult.duplicates.length > 0) {
            console.log(chalk.dim(`\nDuplicate entries skipped:`));
            batchResult.duplicates.slice(0, 5).forEach(d => {
                console.log(chalk.dim(`  - ${d.reason}`));
            });
            if (batchResult.duplicates.length > 5) {
                console.log(chalk.dim(`  ... and ${batchResult.duplicates.length - 5} more`));
            }
        }
        console.log();
    });

program.parse();