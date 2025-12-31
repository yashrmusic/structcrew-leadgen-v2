const { API } = require('megajs');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class MegaUploader {
    constructor(configPath = './mega-config.json') {
        this.configPath = configPath;
        this.mega = null;
        this.uploadedFiles = [];
        this.uploadErrors = [];
    }

    async loadConfig() {
        try {
            if (!await fs.pathExists(this.configPath)) {
                throw new Error('MEGA config file not found');
            }
            const config = await fs.readJson(this.configPath);
            
            if (!config.email || !config.password) {
                throw new Error('MEGA email and password required');
            }
            
            if (config.email === 'YOUR_MEGA_EMAIL') {
                throw new Error('Please update mega-config.json with your credentials');
            }
            
            return config;
        } catch (error) {
            console.error(chalk.red('Error loading MEGA config:'), error.message);
            throw error;
        }
    }

    async connect() {
        try {
            const config = await this.loadConfig();
            
            console.log(chalk.cyan('\n🔐 Connecting to MEGA...'));
            
            this.mega = new API({
                keepalive: true
            });
            
            await this.mega.login({ email: config.email, password: config.password });
            
            console.log(chalk.green('✅ Connected to MEGA!'));
            console.log(chalk.white(`   Account: ${config.email}\n`));
            
            return true;
        } catch (error) {
            console.error(chalk.red('Failed to connect to MEGA:'), error.message);
            throw error;
        }
    }

    async getStorageInfo() {
        if (!this.mega) await this.connect();
        
        const storage = this.mega.storage;
        const usedGB = (storage.used / (1024 ** 3)).toFixed(2);
        const totalGB = (storage.total / (1024 ** 3)).toFixed(2);
        const availableGB = (storage.available / (1024 ** 3)).toFixed(2);
        const usedPercent = ((storage.used / storage.total) * 100).toFixed(1);
        
        console.log(chalk.cyan('💾 MEGA Storage Info:'));
        console.log(chalk.white(`   Used: ${usedGB} GB (${usedPercent}%)`));
        console.log(chalk.white(`   Available: ${availableGB} GB`));
        console.log(chalk.white(`   Total: ${totalGB} GB\n`));
        
        return { usedGB, totalGB, availableGB, usedPercent };
    }

    async uploadFile(filePath, folderName = 'StructCrew Images') {
        if (!this.mega) await this.connect();
        
        try {
            const fileName = path.basename(filePath);
            const fileContent = await fs.readFile(filePath);
            
            console.log(chalk.cyan(`📤 Uploading: ${fileName}`));
            
            const uploadPromise = new Promise((resolve, reject) => {
                const upload = this.mega.upload({
                    name: fileName,
                    size: fileContent.length,
                });
                
                upload.complete.on('end', (file) => {
                    console.log(chalk.green(`   ✅ Uploaded: ${fileName}`));
                    this.uploadedFiles.push({
                        name: fileName,
                        size: fileContent.length,
                        url: file.link
                    });
                    resolve(file);
                });
                
                upload.complete.on('error', (err) => {
                    console.error(chalk.red(`   ❌ Failed: ${fileName}`), err.message);
                    this.uploadErrors.push({
                        name: fileName,
                        error: err.message
                    });
                    reject(err);
                });
                
                upload.end(fileContent);
            });
            
            return await uploadPromise;
        } catch (error) {
            console.error(chalk.red(`Upload failed for ${path.basename(filePath)}:`), error.message);
            throw error;
        }
    }

    async uploadFolder(folderPath, folderName = 'StructCrew Images') {
        if (!this.mega) await this.connect();
        
        console.log(chalk.cyan(`\n📁 Uploading folder: ${folderPath}`));
        console.log(chalk.white('='.repeat(60)));
        
        const startTime = Date.now();
        let uploadedCount = 0;
        let failedCount = 0;
        let totalSize = 0;
        
        try {
            const files = await fs.readdir(folderPath);
            const imageFiles = files.filter(f => 
                f.match(/\.(jpg|jpeg|png|gif|webp)$/i)
            );
            
            console.log(chalk.cyan(`Found ${imageFiles.length} images\n`));
            
            for (const file of imageFiles) {
                const filePath = path.join(folderPath, file);
                try {
                    await this.uploadFile(filePath, folderName);
                    uploadedCount++;
                    
                    const stats = await fs.stat(filePath);
                    totalSize += stats.size;
                    
                    const progress = Math.round((uploadedCount / imageFiles.length) * 100);
                    const avgSpeed = (totalSize / (Date.now() - startTime) * 1000 / 1024).toFixed(2);
                    console.log(chalk.gray(`   Progress: ${progress}% (${uploadedCount}/${imageFiles.length}) - ${avgSpeed} KB/s\n`));
                    
                } catch (error) {
                    failedCount++;
                }
            }
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
            
            console.log(chalk.cyan('='.repeat(60)));
            console.log(chalk.cyan.bold('📊 UPLOAD SUMMARY'));
            console.log(chalk.cyan('='.repeat(60)));
            console.log(chalk.green(`✅ Uploaded: ${uploadedCount} files`));
            console.log(chalk.red(`❌ Failed: ${failedCount} files`));
            console.log(chalk.white(`📦 Total size: ${totalMB} MB`));
            console.log(chalk.white(`⏱️  Duration: ${duration}s`));
            console.log(chalk.white(`📈 Average speed: ${(totalMB / duration).toFixed(2)} MB/s\n`));
            
            await this.getStorageInfo();
            
            return {
                uploaded: uploadedCount,
                failed: failedCount,
                totalSize: totalSize,
                duration: duration
            };
            
        } catch (error) {
            console.error(chalk.red('Folder upload failed:'), error.message);
            throw error;
        }
    }

    async uploadMultipleFolders(folders) {
        console.log(chalk.cyan.bold('\n🚀 MEGA BULK UPLOAD'));
        console.log(chalk.white('='.repeat(60)));
        
        await this.connect();
        const storageInfo = await this.getStorageInfo();
        
        if (parseFloat(storageInfo.availableGB) < 1) {
            console.error(chalk.red('\n⚠️  WARNING: Low storage space!'));
            console.log(chalk.yellow('   Please free up space or upgrade your MEGA account.\n'));
            return;
        }
        
        let totalUploaded = 0;
        let totalFailed = 0;
        let totalSize = 0;
        
        for (const folder of folders) {
            try {
                const result = await this.uploadFolder(folder.path, folder.name);
                totalUploaded += result.uploaded;
                totalFailed += result.failed;
                totalSize += result.totalSize;
            } catch (error) {
                console.error(chalk.red(`Failed to upload ${folder.name}:`), error.message);
            }
        }
        
        console.log(chalk.cyan.bold('\n📊 TOTAL SUMMARY'));
        console.log(chalk.cyan('='.repeat(60)));
        console.log(chalk.green(`✅ Total uploaded: ${totalUploaded} files`));
        console.log(chalk.red(`❌ Total failed: ${totalFailed} files`));
        console.log(chalk.white(`📦 Total size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB\n`));
    }

    saveUploadHistory(filename = 'mega-upload-history.json') {
        return fs.writeJson(filename, {
            timestamp: new Date().toISOString(),
            uploadedFiles: this.uploadedFiles,
            uploadErrors: this.uploadErrors,
            summary: {
                totalUploaded: this.uploadedFiles.length,
                totalFailed: this.uploadErrors.length,
                totalSize: this.uploadedFiles.reduce((sum, f) => sum + f.size, 0)
            }
        }, { spaces: 2 });
    }
}

module.exports = MegaUploader;
