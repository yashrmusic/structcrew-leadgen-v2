const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const Tesseract = require('tesseract.js');
const EnhancedOCR = require('./enhanced-ocr');
const VisionOCR = require('./vision-ocr');

class InstagramDownloader {
    constructor(useEnhancedOCR = true) {
        this.downloadDir = path.join(process.cwd(), 'ig_downloads');
        this.sessionDir = path.join(this.downloadDir, '.sessions');
        this.useEnhancedOCR = useEnhancedOCR;
        this.enhancedOCR = null;
    }

    async downloadProfile(username, limit = 50, logCallback = console.log) {
        await fs.ensureDir(this.downloadDir);

        username = username.replace('@', '').replace('https://www.instagram.com/', '').replace(/\//g, '');
        const profileDir = path.join(this.downloadDir, username);

        logCallback(`[Instaloader] Starting download for @${username}...`);

        try {
            const cmd = `instaloader --no-videos --no-video-thumbnails --no-captions --no-metadata-json --no-compress-json --dirname-pattern="${this.downloadDir}/{target}" --count=${limit} -- ${username}`;

            logCallback(`[Instaloader] Fetching up to ${limit} posts (this may take a while)...`);

            execSync(cmd, {
                stdio: 'pipe',
                timeout: 600000
            });

            logCallback(`[Instaloader] Download complete. Files saved to: ${profileDir}`);

            const files = await this.getImageFiles(profileDir);
            logCallback(`[Instaloader] Found ${files.length} images for OCR processing.`);

            return {
                success: true,
                profileDir,
                imageCount: files.length,
                images: files
            };

        } catch (e) {
            logCallback(`[Instaloader] Download finished (or rate limited). Checking files...`);

            const files = await this.getImageFiles(profileDir);
            if (files.length > 0) {
                logCallback(`[Instaloader] Found ${files.length} images despite error. Proceeding with OCR.`);
                return {
                    success: true,
                    profileDir,
                    imageCount: files.length,
                    images: files
                };
            }

            return { success: false, error: e.message };
        }
    }

    async downloadLargeProfile(username, totalPosts = 50000, batchSize = 1000, logCallback = console.log) {
        await fs.ensureDir(this.downloadDir);

        username = username.replace('@', '').replace('https://www.instagram.com/', '').replace(/\//g, '');
        const profileDir = path.join(this.downloadDir, username);

        logCallback(`[Instaloader] 🚀 LARGE PROFILE DOWNLOAD: @${username} (target: ${totalPosts} posts)`);

        let allImages = [];
        let downloaded = 0;
        let batchNum = 0;

        while (downloaded < totalPosts) {
            const remaining = totalPosts - downloaded;
            const currentBatchSize = Math.min(batchSize, remaining);
            batchNum++;

            logCallback(`[Instaloader] 📦 Batch ${batchNum}: Downloading ${currentBatchSize} posts (total: ${downloaded}/${totalPosts})`);

            try {
                const cmd = `instaloader --no-videos --no-video-thumbnails --no-captions --no-metadata-json --no-compress-json --dirname-pattern="${this.downloadDir}/{target}" --count=${currentBatchSize} --fast-update -- ${username}`;

                execSync(cmd, {
                    stdio: 'pipe',
                    timeout: 600000
                });

                const newFiles = await this.getImageFiles(profileDir);
                const newImages = newFiles.filter(f => !allImages.includes(f));
                downloaded += newImages.length;
                allImages = newFiles;

                logCallback(`[Instaloader] ✅ Batch ${batchNum} complete. Total images: ${allImages.length}`);

                if (newImages.length === 0) {
                    logCallback(`[Instaloader] No new images in batch ${batchNum}. End of profile reached.`);
                    break;
                }

                await this.sleep(5000);

            } catch (e) {
                logCallback(`[Instaloader] ⚠️  Batch ${batchNum} error: ${e.message}`);
                logCallback(`[Instaloader] Checking what was downloaded...`);

                const currentFiles = await this.getImageFiles(profileDir);
                if (currentFiles.length > allImages.length) {
                    const newImages = currentFiles.filter(f => !allImages.includes(f));
                    downloaded += newImages.length;
                    allImages = currentFiles;
                    logCallback(`[Instaloader] ✅ Partial success: ${newImages.length} new images`);
                }

                await this.sleep(15000);
            }
        }

        logCallback(`[Instaloader] 🎉 Large download complete! Total images: ${allImages.length}`);

        return {
            success: true,
            profileDir,
            imageCount: allImages.length,
            images: allImages,
            batchesProcessed: batchNum
        };
    }

    async downloadMultipleProfiles(usernames, totalPosts = 50000, batchSize = 1000, logCallback = console.log) {
        const results = [];

        for (let i = 0; i < usernames.length; i++) {
            const username = usernames[i];
            logCallback(`\n[Instaloader] 🔄 Processing profile ${i + 1}/${usernames.length}: @${username}`);

            const result = await this.downloadLargeProfile(username, totalPosts, batchSize, logCallback);
            result.username = username;
            results.push(result);

            if (i < usernames.length - 1) {
                logCallback(`[Instaloader] ⏸️  Pausing before next profile...`);
                await this.sleep(30000);
            }
        }

        return results;
    }

    async performParallelOCR(images, concurrency = 3, logCallback = console.log) {
        const results = {
            extractedEmails: [],
            extractedPhones: [],
            scannedCount: 0,
            errors: []
        };

        const processImage = async (imgPath, index) => {
            try {
                logCallback(`[OCR] [${index + 1}/${images.length}] ${path.basename(imgPath)}`);

                const { data: { text } } = await Tesseract.recognize(imgPath, 'eng', {
                    logger: m => { }
                });

                const emails = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi) || [];
                const phones = text.match(/(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g) || [];

                return { emails, phones, success: true };
            } catch (ocrErr) {
                logCallback(`[OCR] ❌ Error on ${path.basename(imgPath)}: ${ocrErr.message}`);
                return { emails: [], phones: [], success: false, error: ocrErr.message };
            }
        };

        const batches = [];
        for (let i = 0; i < images.length; i += concurrency) {
            batches.push(images.slice(i, i + concurrency));
        }

        logCallback(`[OCR] Processing ${images.length} images with concurrency ${concurrency}...`);

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            logCallback(`[OCR] Batch ${batchIndex + 1}/${batches.length} (${batch.length} images)`);

            const batchResults = await Promise.all(
                batch.map((img, idx) => processImage(img, batchIndex * concurrency + idx))
            );

            batchResults.forEach(result => {
                if (result.success) {
                    results.extractedEmails.push(...result.emails);
                    results.extractedPhones.push(...result.phones);
                    results.scannedCount++;
                } else {
                    results.errors.push(result.error);
                }
            });

            if (batchIndex < batches.length - 1) {
                await this.sleep(1000);
            }
        }

        results.extractedEmails = [...new Set(results.extractedEmails)];
        results.extractedPhones = [...new Set(results.extractedPhones.filter(p => p.length > 8))];

        logCallback(`[OCR] 🎯 Complete! Scanned: ${results.scannedCount}, Emails: ${results.extractedEmails.length}, Phones: ${results.extractedPhones.length}`);

        return results;
    }

    async scanLargeProfile(username, totalPosts = 50000, batchSize = 1000, ocrConcurrency = 3, logCallback = console.log) {
        logCallback(`\n🚀 STARTING LARGE PROFILE SCAN: @${username}`);
        logCallback(`📊 Target posts: ${totalPosts} | Batch size: ${batchSize} | OCR concurrency: ${ocrConcurrency}\n`);

        const downloadResult = await this.downloadLargeProfile(username, totalPosts, batchSize, logCallback);

        if (!downloadResult.success || downloadResult.imageCount === 0) {
            return {
                success: false,
                error: downloadResult.error || 'No images found'
            };
        }

        logCallback(`\n📸 Download complete. Starting OCR on ${downloadResult.imageCount} images...\n`);

        const ocrResults = await this.performParallelOCR(downloadResult.images, ocrConcurrency, logCallback);

        return {
            success: true,
            username,
            ...ocrResults,
            totalImagesDownloaded: downloadResult.imageCount,
            batchesProcessed: downloadResult.batchesProcessed
        };
    }

    async batchScanProfiles(usernames, totalPosts = 50000, batchSize = 1000, ocrConcurrency = 3, logCallback = console.log) {
        const results = [];

        for (let i = 0; i < usernames.length; i++) {
            const username = usernames[i];
            logCallback(`\n${'='.repeat(60)}`);
            logCallback(`🔄 PROFILE ${i + 1}/${usernames.length}: @${username}`);
            logCallback(`${'='.repeat(60)}\n`);

            const result = await this.scanLargeProfile(username, totalPosts, batchSize, ocrConcurrency, logCallback);
            results.push(result);
        }

        return results;
    }

    async exportResults(results, outputFile = 'ig_ocr_results.json') {
        const filePath = path.join(process.cwd(), outputFile);
        await fs.writeJson(filePath, results, { spaces: 2 });
        return filePath;
    }

    async exportCSV(results, outputFile = 'ig_ocr_results.csv') {
        const fs = require('fs');
        const filePath = path.join(process.cwd(), outputFile);

        let csv = 'Username,Email,Phone,Source,Date\n';

        const resultsArray = Array.isArray(results) ? results : [results];

        resultsArray.forEach(result => {
            const date = new Date().toISOString().split('T')[0];
            result.extractedEmails.forEach(email => {
                csv += `"${result.username}","${email}","","OCR","${date}"\n`;
            });
            result.extractedPhones.forEach(phone => {
                csv += `"${result.username}","","${phone}","OCR","${date}"\n`;
            });
        });

        await fs.writeFile(filePath, csv);
        return filePath;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get all image files from a directory
     */
    async getImageFiles(dir) {
        try {
            const allFiles = await fs.readdir(dir);
            return allFiles
                .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
                .map(f => path.join(dir, f));
        } catch (e) {
            return [];
        }
    }

    /**
     * Perform OCR on all downloaded images
     */
    async performBulkOCR(images, logCallback = console.log) {
        const results = {
            extractedEmails: [],
            extractedPhones: [],
            scannedCount: 0
        };

        for (let i = 0; i < images.length; i++) {
            const imgPath = images[i];
            logCallback(`[OCR] Processing ${i + 1}/${images.length}: ${path.basename(imgPath)}`);

            try {
                const { data: { text } } = await Tesseract.recognize(imgPath, 'eng');

                // Extract emails and phones
                const emails = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi) || [];
                const phones = text.match(/(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g) || [];

                results.extractedEmails.push(...emails);
                results.extractedPhones.push(...phones);
                results.scannedCount++;

            } catch (ocrErr) {
                logCallback(`[OCR] Error on ${path.basename(imgPath)}: ${ocrErr.message}`);
            }
        }

        // Deduplicate
        results.extractedEmails = [...new Set(results.extractedEmails)];
        results.extractedPhones = [...new Set(results.extractedPhones.filter(p => p.length > 8))];

        logCallback(`[OCR] Bulk scan complete. Found ${results.extractedEmails.length} emails, ${results.extractedPhones.length} phones.`);

        return results;
    }

    /**
     * Full workflow: Download + OCR
     */
    async scanProfile(username, limit = 50, logCallback = console.log) {
        const downloadResult = await this.downloadProfile(username, limit, logCallback);

        if (!downloadResult.success) {
            return { success: false, error: downloadResult.error };
        }

        if (downloadResult.imageCount === 0) {
            return {
                success: true,
                extractedEmails: [],
                extractedPhones: [],
                scannedImages: 0,
                message: 'No images found to scan.'
            };
        }

        let ocrResults;

        // NEW: If client wants to use Puter, we skip server OCR and return image list
        if (reqOptions.usePuter) {
            logCallback('[OCR] Deferring OCR to Puter.js (Client-side)...');
            return {
                success: true,
                deferToPuter: true,
                images: downloadResult.images.map(img => path.basename(img)),
                profileDir: username,
                scannedImages: 0
            };
        }

        // NEW: VisionOCR handles everything (Gemini, Groq, Tesseract Fallback)
        if (!this.visionOCR) {
            this.visionOCR = new VisionOCR();
        }

        logCallback(`[OCR] Starting unified Vision OCR for ${downloadResult.images.length} images...`);
        ocrResults = await this.visionOCR.processImages(downloadResult.images, logCallback);

        return {
            success: true,
            ...ocrResults,
            scannedImages: ocrResults.scannedCount
        };
    }

    /**
     * Cleanup downloaded files and OCR resources
     */
    async cleanup(username) {
        const profileDir = path.join(this.downloadDir, username);
        await fs.remove(profileDir);

        if (this.enhancedOCR) {
            await this.enhancedOCR.close();
            this.enhancedOCR = null;
        }
    }

    /**
     * Close all resources
     */
    async close() {
        if (this.enhancedOCR) {
            await this.enhancedOCR.close();
            this.enhancedOCR = null;
        }
    }
}

module.exports = InstagramDownloader;
