#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

class ImageCompressor {
    constructor() {
        this.compressedPath = './compressed-images';
        this.stats = {
            totalSize: 0,
            compressedSize: 0,
            filesProcessed: 0
        };
    }

    async compressImage(inputPath, quality = 80) {
        const outputPath = path.join(this.compressedPath, path.basename(inputPath));
        
        try {
            const inputStats = await fs.stat(inputPath);
            this.stats.totalSize += inputStats.size;
            
            await sharp(inputPath)
                .jpeg({ quality: quality })
                .toFile(outputPath);
            
            const outputStats = await fs.stat(outputPath);
            this.stats.compressedSize += outputStats.size;
            this.stats.filesProcessed++;
            
            const savedBytes = inputStats.size - outputStats.size;
            const savedPercent = ((savedBytes / inputStats.size) * 100).toFixed(1);
            
            return {
                inputSize: inputStats.size,
                outputSize: outputStats.size,
                savedBytes,
                savedPercent,
                outputPath
            };
        } catch (error) {
            console.error(chalk.red(`Error compressing ${path.basename(inputPath)}:`), error.message);
            return null;
        }
    }

    async compressFolder(folderPath, quality = 80) {
        console.log(chalk.cyan.bold('\n📦 IMAGE COMPRESSION'));
        console.log(chalk.white('='.repeat(60)));
        
        await fs.ensureDir(this.compressedPath);
        
        const files = await fs.readdir(folderPath);
        const imageFiles = files.filter(f => 
            f.match(/\.(jpg|jpeg|png|gif|webp)$/i)
        );
        
        console.log(chalk.cyan(`Found ${imageFiles.length} images to compress\n`));
        
        const startTime = Date.now();
        
        for (const file of imageFiles) {
            const filePath = path.join(folderPath, file);
            const progress = Math.round((this.stats.filesProcessed / imageFiles.length) * 100);
            
            process.stdout.write(`\r${chalk.cyan(`[${progress}%]`)} ${chalk.white(file.substring(0, 40))}`);
            
            await this.compressImage(filePath, quality);
        }
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const savedPercent = ((this.stats.totalSize - this.stats.compressedSize) / this.stats.totalSize * 100).toFixed(1);
        
        console.log(`\n\n${chalk.cyan('='.repeat(60))}`);
        console.log(chalk.cyan.bold('📊 COMPRESSION SUMMARY'));
        console.log(chalk.cyan('='.repeat(60)));
        console.log(chalk.green(`✅ Files processed: ${this.stats.filesProcessed}`));
        console.log(chalk.white(`📦 Original size: ${(this.stats.totalSize / (1024 * 1024)).toFixed(2)} MB`));
        console.log(chalk.white(`📦 Compressed size: ${(this.stats.compressedSize / (1024 * 1024)).toFixed(2)} MB`));
        console.log(chalk.green(`💾 Saved: ${((this.stats.totalSize - this.stats.compressedSize) / (1024 * 1024)).toFixed(2)} MB (${savedPercent}%)`));
        console.log(chalk.white(`⏱️  Duration: ${duration}s`));
        console.log(chalk.white(`📁 Output folder: ${path.resolve(this.compressedPath)}\n`));
        
        return this.stats;
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help') {
        console.log(chalk.cyan.bold('╔══════════════════════════════════════╗'));
        console.log(chalk.cyan.bold('║     IMAGE COMPRESSION TOOL             ║'));
        console.log(chalk.cyan.bold('╚══════════════════════════════════════╝\n'));
        
        console.log(chalk.white('Usage:'));
        console.log(chalk.yellow('  node compress-images.js <folder-path> [quality]\n'));
        
        console.log(chalk.white('Examples:'));
        console.log(chalk.yellow('  node compress-images.js ./archi_jobs'));
        console.log(chalk.yellow('  node compress-images.js ./archi_jobs 80\n'));
        
        console.log(chalk.white('Quality (1-100):'));
        console.log(chalk.gray('  80 = Recommended (good balance)'));
        console.log(chalk.gray('  60 = High compression (smaller files)'));
        console.log(chalk.gray('  90 = Low compression (better quality)\n'));
        
        console.log(chalk.cyan('📁 Available folders:\n'));
        
        const folders = ['archi_jobs', 'ig_downloads', 'ig_downloads_test'];
        folders.forEach(folder => {
            const exists = fs.existsSync(folder);
            const status = exists ? chalk.green('✅') : chalk.gray('⏸️');
            console.log(`${status} ./${folder}`);
        });
        
        console.log();
        return;
    }
    
    const folderPath = args[0];
    const quality = parseInt(args[1]) || 80;
    
    if (!fs.existsSync(folderPath)) {
        console.error(chalk.red(`\n❌ Folder not found: ${folderPath}\n`));
        return;
    }
    
    if (quality < 1 || quality > 100) {
        console.error(chalk.red('\n❌ Quality must be between 1 and 100\n'));
        return;
    }
    
    const compressor = new ImageCompressor();
    await compressor.compressFolder(folderPath, quality);
}

main().catch(error => {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
});
