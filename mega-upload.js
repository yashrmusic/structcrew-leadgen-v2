#!/usr/bin/env node

const chalk = require('chalk');
const MegaUploader = require('./src/mega-uploader');
const path = require('path');

async function main() {
    const args = process.argv.slice(2);
    
    console.log(chalk.cyan.bold('╔══════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║     MEGA CLOUD STORAGE UPLOADER        ║'));
    console.log(chalk.cyan.bold('╚══════════════════════════════════════╝'));
    
    const uploader = new MegaUploader();
    
    try {
        await uploader.connect();
        
        if (args.length === 0) {
            console.log(chalk.cyan('\n📖 USAGE:\n'));
            console.log(chalk.white('  Upload single folder:'));
            console.log(chalk.yellow('    node mega-upload.js <folder-path> [folder-name]\n'));
            
            console.log(chalk.white('  Upload multiple folders:'));
            console.log(chalk.yellow('    node mega-upload.js --bulk\n'));
            
            console.log(chalk.white('  Upload existing folders:'));
            console.log(chalk.yellow('    node mega-upload.js --upload-archi'));
            console.log(chalk.yellow('    node mega-upload.js --upload-all\n'));
            
            console.log(chalk.white('  Check storage:'));
            console.log(chalk.yellow('    node mega-upload.js --storage\n'));
            
            console.log(chalk.cyan('📁 Available folders:\n'));
            
            const folders = [
                { path: './archi_jobs', name: 'Architect Jobs' },
                { path: './ig_downloads/archi_jobs', name: 'IG Downloads - Architect Jobs' },
                { path: './ig_downloads_test/archi_jobs', name: 'IG Test - Architect Jobs' }
            ];
            
            folders.forEach(folder => {
                const exists = require('fs-extra').pathExistsSync(folder.path);
                const status = exists ? chalk.green('✅') : chalk.gray('⏸️');
                console.log(`${status} ${folder.path}`);
            });
            
            console.log();
            return;
        }
        
        if (args[0] === '--storage') {
            await uploader.getStorageInfo();
            return;
        }
        
        if (args[0] === '--upload-archi') {
            const result = await uploader.uploadFolder('./archi_jobs', 'Architect Jobs');
            await uploader.saveUploadHistory();
            return;
        }
        
        if (args[0] === '--upload-all') {
            const folders = [
                { path: './archi_jobs', name: 'Architect Jobs' },
                { path: './ig_downloads/archi_jobs', name: 'IG Downloads - Architect Jobs' },
                { path: './ig_downloads_test/archi_jobs', name: 'IG Test - Architect Jobs' }
            ];
            
            await uploader.uploadMultipleFolders(folders);
            await uploader.saveUploadHistory();
            return;
        }
        
        if (args[0] === '--bulk') {
            console.log(chalk.cyan('\n📁 Found folders to upload:'));
            
            const folders = [
                { path: './archi_jobs', name: 'Architect Jobs' },
                { path: './ig_downloads/archi_jobs', name: 'IG Downloads - Architect Jobs' },
                { path: './ig_downloads_test/archi_jobs', name: 'IG Test - Architect Jobs' }
            ];
            
            console.log();
            folders.forEach((folder, i) => {
                console.log(chalk.white(`   ${i + 1}. ${folder.name}`));
            });
            
            console.log(chalk.yellow('\nPress Enter to continue or Ctrl+C to cancel...'));
            await new Promise(resolve => process.stdin.once('data', resolve));
            
            await uploader.uploadMultipleFolders(folders);
            await uploader.saveUploadHistory();
            return;
        }
        
        const folderPath = args[0];
        const folderName = args[1] || path.basename(folderPath);
        
        if (!require('fs-extra').pathExistsSync(folderPath)) {
            console.error(chalk.red(`\n❌ Folder not found: ${folderPath}\n`));
            return;
        }
        
        const result = await uploader.uploadFolder(folderPath, folderName);
        await uploader.saveUploadHistory();
        
    } catch (error) {
        console.error(chalk.red('\n❌ Error:'), error.message);
        console.error(chalk.gray(error.stack));
        process.exit(1);
    }
}

main();
