#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const GoogleSheetsStorage = require('./src/server/google-sheets');
const EnhancedOCR = require('./src/scraper/enhanced-ocr');
const chalk = require('chalk');

class LeadGenerationWorkflow {
    async initS3() {
        let awsConfig = {
            region: 'us-east-1'
        };

        if (await fs.pathExists('./aws-config.json')) {
            const config = await fs.readJson('./aws-config.json');
            awsConfig.credentials = {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey
            };
        } else {
            awsConfig.credentials = {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            };
        }

        this.s3Client = new S3Client(awsConfig);
    }

    constructor() {
        this.downloadDir = path.join(process.cwd(), 'ig_downloads');
        this.s3Client = null;
        this.bucketName = 'structcrew-images';
        this.ocr = new EnhancedOCR();
    }

    async downloadInstagramPosts(username, targetPosts = 1000) {
        console.log(chalk.cyan.bold(`\n📸 STEP 1: Downloading Instagram Posts`));
        console.log(chalk.white(`Profile: @${username}`));
        console.log(chalk.white(`Target: ${targetPosts} posts\n`));

        const profileDir = path.join(this.downloadDir, username);
        await fs.ensureDir(profileDir);

        try {
            const cmd = `python -m instaloader --no-videos --no-video-thumbnails --no-captions --no-metadata-json --no-compress-json --dirname-pattern="${this.downloadDir}/{target}" --count=${targetPosts} -- ${username}`;

            execSync(cmd, { stdio: 'inherit', timeout: 600000 });

            const files = await this.getImageFiles(profileDir);
            console.log(chalk.green(`\n✅ Downloaded ${files.length} images\n`));

            return { profileDir, images: files, count: files.length };

        } catch (error) {
            const files = await this.getImageFiles(profileDir);
            if (files.length > 0) {
                console.log(chalk.yellow(`\n⚠️  Partial download: ${files.length} images\n`));
                return { profileDir, images: files, count: files.length };
            }
            throw error;
        }
    }

    async uploadToS3(profileDir, username) {
        console.log(chalk.cyan.bold(`\n☁️  STEP 2: Uploading Images to AWS S3`));

        const images = await this.getImageFiles(profileDir);
        let uploaded = 0;
        let failed = 0;

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const filename = path.basename(image);
            const key = `${username}/${filename}`;

            try {
                const fileContent = await fs.readFile(image);

                const command = new PutObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                    Body: fileContent,
                    ContentType: 'image/jpeg'
                });

                await this.s3Client.send(command);
                uploaded++;

                if ((i + 1) % 10 === 0) {
                    console.log(chalk.dim(`  Uploaded ${uploaded}/${images.length} images...`));
                }

            } catch (error) {
                console.log(chalk.red(`  ❌ Failed to upload ${filename}: ${error.message}`));
                failed++;
            }
        }

        console.log(chalk.green(`\n✅ Uploaded ${uploaded} images to S3`));
        if (failed > 0) {
            console.log(chalk.red(`❌ Failed: ${failed} images`));
        }
        console.log(chalk.white(`Bucket: s3://${this.bucketName}/${username}/\n`));

        return { uploaded, failed, total: images.length };
    }

    async runOCR(profileDir, images) {
        console.log(chalk.cyan.bold(`\n🔍 STEP 3: Running OCR on Images`));

        const results = [];
        let processed = 0;

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const filename = path.basename(image);

            try {
                console.log(chalk.dim(`  OCR ${i + 1}/${images.length}: ${filename}...`));

                const ocrResult = await this.ocr.processImage(image);

                results.push({
                    image: filename,
                    s3Url: `s3://${this.bucketName}/${path.basename(path.dirname(image))}/${filename}`,
                    ...ocrResult
                });

                processed++;

                if ((i + 1) % 5 === 0) {
                    console.log(chalk.green(`  Processed ${processed}/${images.length} images`));
                }

            } catch (error) {
                console.log(chalk.red(`  ❌ OCR failed for ${filename}`));
            }
        }

        console.log(chalk.green(`\n✅ OCR complete: ${processed} images processed\n`));
        return results;
    }

    async saveToGoogleSheets(ocrResults, username, sheetId, credsPath) {
        console.log(chalk.cyan.bold(`\n📊 STEP 4: Saving to Google Sheets`));

        if (!await fs.pathExists(credsPath)) {
            console.log(chalk.red(`\n❌ Google credentials not found: ${credsPath}`));
            console.log(chalk.yellow(`Create credentials from: https://console.cloud.google.com/apis/credentials\n`));
            return false;
        }

        try {
            const sheets = new GoogleSheetsStorage(sheetId, credsPath);
            await sheets.connect();

            let added = 0;
            let skipped = 0;

            for (const result of ocrResults) {
                if (!result.email && !result.phone) {
                    skipped++;
                    continue;
                }

                const lead = {
                    companyName: result.company || 'Unknown',
                    email: result.email || '',
                    phone: result.phone || '',
                    city: result.city || '',
                    instagramHandle: `@${username}`,
                    businessType: result.businessType || 'Architecture',
                    source: 'Instagram OCR',
                    dateAdded: new Date().toISOString().split('T')[0],
                    status: 'New'
                };

                const existing = await sheets.findDuplicate(lead);
                if (!existing) {
                    await sheets.addLead(lead);
                    added++;
                } else {
                    skipped++;
                }
            }

            console.log(chalk.green(`\n✅ Saved ${added} new leads to Google Sheets`));
            console.log(chalk.yellow(`⏭️  Skipped ${skipped} duplicates/empty leads`));
            console.log(chalk.white(`Sheet URL: https://docs.google.com/spreadsheets/d/${sheetId}\n`));

            return true;

        } catch (error) {
            console.log(chalk.red(`\n❌ Google Sheets error: ${error.message}\n`));
            return false;
        }
    }

    async exportToCSV(ocrResults, username) {
        console.log(chalk.cyan.bold(`\n💾 STEP 5: Exporting to CSV`));

        const csvFile = path.join(process.cwd(), `${username}_leads_${Date.now()}.csv`);
        
        const headers = 'Company Name,Email,Phone,City,Instagram Handle,Business Type,Source,Date Added,Status,S3 URL';
        const rows = ocrResults.map(r => 
            `"${r.company || ''}","${r.email || ''}","${r.phone || ''}","${r.city || ''}","@${username}","${r.businessType || 'Architecture'}","Instagram OCR","${new Date().toISOString().split('T')[0]}","New","${r.s3Url || ''}"`
        ).join('\n');

        await fs.writeFile(csvFile, [headers, rows].join('\n'));
        console.log(chalk.green(`✅ Exported to: ${csvFile}\n`));

        return csvFile;
    }

    async getImageFiles(dir) {
        const files = await fs.readdir(dir);
        return files
            .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
            .map(f => path.join(dir, f));
    }

    async run(username, options = {}) {
        const {
            targetPosts = 1000,
            uploadS3 = true,
            sheetId = null,
            credsPath = './google-credentials.json',
            exportCSV = true
        } = options;

        console.log(chalk.cyan.bold('='.repeat(60)));
        console.log(chalk.cyan.bold('🚀 LEAD GENERATION WORKFLOW'));
        console.log(chalk.cyan.bold('='.repeat(60)));

        if (uploadS3) {
            await this.initS3();
        }

        const startTime = Date.now();

        try {
            const downloadResult = await this.downloadInstagramPosts(username, targetPosts);

            if (uploadS3) {
                await this.uploadToS3(downloadResult.profileDir, username);
            }

            const ocrResults = await this.runOCR(downloadResult.profileDir, downloadResult.images);

            if (exportCSV) {
                await this.exportToCSV(ocrResults, username);
            }

            if (sheetId) {
                await this.saveToGoogleSheets(ocrResults, username, sheetId, credsPath);
            }

            const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

            console.log(chalk.cyan.bold('\n' + '='.repeat(60)));
            console.log(chalk.green.bold('✅ WORKFLOW COMPLETE!'));
            console.log(chalk.cyan.bold('='.repeat(60)));
            console.log(chalk.white(`Profile: @${username}`));
            console.log(chalk.white(`Images Processed: ${ocrResults.length}`));
            console.log(chalk.white(`Duration: ${duration} minutes\n`));

        } catch (error) {
            console.error(chalk.red(`\n❌ Workflow failed: ${error.message}\n`));
            throw error;
        }
    }
}

module.exports = LeadGenerationWorkflow;
