#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class SimpleCompressor {
    constructor() {
        this.compressedPath = './compressed-images';
        this.stats = {
            totalSize: 0,
            compressedSize: 0,
            filesProcessed: 0
        };
    }

    async compressImage(inputPath) {
        const outputPath = path.join(this.compressedPath, path.basename(inputPath));
        
        try {
            const inputStats = await fs.stat(inputPath);
            this.stats.totalSize += inputStats.size;
            
            const inputBuffer = await fs.readFile(inputPath);
            await fs.writeFile(outputPath, inputBuffer);
            
            this.stats.compressedSize += inputStats.size;
            this.stats.filesProcessed++;
            
            return {
                inputSize: inputStats.size,
                outputSize: inputStats.size,
                savedBytes: 0,
                savedPercent: 0,
                outputPath
            };
        } catch (error) {
            console.error(chalk.red(`Error processing ${path.basename(inputPath)}:`), error.message);
            return null;
        }
    }

    async compressFolder(folderPath) {
        console.log(chalk.cyan.bold('\n📁 IMAGE ORGANIZER'));
        console.log(chalk.white('='.repeat(60)));
        
        await fs.ensureDir(this.compressedPath);
        
        const files = await fs.readdir(folderPath);
        const imageFiles = files.filter(f => 
            f.match(/\.(jpg|jpeg|png|gif|webp)$/i)
        );
        
        console.log(chalk.cyan(`Found ${imageFiles.length} images to process\n`));
        
        const startTime = Date.now();
        
        for (const file of imageFiles) {
            const filePath = path.join(folderPath, file);
            const progress = Math.round((this.stats.filesProcessed / imageFiles.length) * 100);
            
            process.stdout.write(`\r${chalk.cyan(`[${progress}%]`)} ${chalk.white(file.substring(0, 40))}`);
            
            await this.compressImage(filePath);
        }
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const totalMB = (this.stats.totalSize / (1024 * 1024)).toFixed(2);
        
        console.log(`\n\n${chalk.cyan('='.repeat(60))}`);
        console.log(chalk.cyan.bold('📊 ORGANIZATION SUMMARY'));
        console.log(chalk.cyan('='.repeat(60)));
        console.log(chalk.green(`✅ Files processed: ${this.stats.filesProcessed}`));
        console.log(chalk.white(`📦 Total size: ${totalMB} MB`));
        console.log(chalk.white(`📁 Output folder: ${path.resolve(this.compressedPath)}`));
        console.log(chalk.white(`⏱️  Duration: ${duration}s`));
        console.log(chalk.yellow(`\n💡 Ready to upload to MEGA or cloud storage!\n`));
        
        return this.stats;
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help') {
        console.log(chalk.cyan.bold('╔══════════════════════════════════════╗'));
        console.log(chalk.cyan.bold('║     IMAGE ORGANIZER TOOL              ║'));
        console.log(chalk.cyan.bold('╚══════════════════════════════════════╝\n'));
        
        console.log(chalk.white('Usage:'));
        console.log(chalk.yellow('  node organize-images.js <folder-path>\n'));
        
        console.log(chalk.white('Description:'));
        console.log(chalk.gray('  Organizes images into a single folder for easy upload to MEGA\n'));
        
        console.log(chalk.cyan('📁 Available folders:\n'));
        
        const folders = ['archi_jobs', 'ig_downloads', 'ig_downloads_test'];
        folders.forEach(folder => {
            const exists = fs.existsSync(folder);
            const status = exists ? chalk.green('✅') : chalk.gray('⏸️');
            const size = exists ? `(${require('fs-extra').statSync(folder).size / (1024 * 1024).toFixed(1)} MB)` : '';
            console.log(`${status} ./${folder} ${size}`);
        });
        
        console.log();
        return;
    }
    
    const folderPath = args[0];
    
    if (!fs.existsSync(folderPath)) {
        console.error(chalk.red(`\n❌ Folder not found: ${folderPath}\n`));
        return;
    }
    
    const organizer = new SimpleCompressor();
    await organizer.compressFolder(folderPath);
}

main().catch(error => {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
});
