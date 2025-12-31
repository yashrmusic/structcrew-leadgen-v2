#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs-extra');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => resolve(answer));
    });
}

async function setupMegaConfig() {
    console.log(chalk.cyan.bold('╔══════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║       MEGA CONFIGURATION SETUP       ║'));
    console.log(chalk.cyan.bold('╚══════════════════════════════════════╝\n'));
    
    const configPath = './mega-config.json';
    
    try {
        let email, password;
        
        if (await fs.pathExists(configPath)) {
            console.log(chalk.yellow('⚠️  Existing config file found.'));
            
            const overwrite = await question(chalk.cyan('Overwrite existing config? (y/N): '));
            
            if (overwrite.toLowerCase() !== 'y') {
                console.log(chalk.gray('\nKeeping existing configuration.\n'));
                const config = await fs.readJson(configPath);
                console.log(chalk.white(`Email: ${config.email}`));
                console.log(chalk.gray(`Password: ${'*'.repeat(10)}\n`));
                rl.close();
                return;
            }
            
            const existingConfig = await fs.readJson(configPath);
            email = existingConfig.email;
            password = existingConfig.password;
        }
        
        console.log(chalk.cyan('📧 MEGA Account Credentials\n'));
        
        const newEmail = await question(chalk.white(`Email ${email ? `[${email}]` : ''}: `));
        const finalEmail = newEmail || email;
        
        const newPassword = await question(chalk.white('Password: '));
        const finalPassword = newPassword || password;
        
        if (!finalEmail || !finalPassword) {
            console.error(chalk.red('\n❌ Email and password are required!\n'));
            rl.close();
            process.exit(1);
        }
        
        const config = {
            email: finalEmail,
            password: finalPassword
        };
        
        await fs.writeJson(configPath, config, { spaces: 2 });
        
        console.log(chalk.green('\n✅ Configuration saved!'));
        console.log(chalk.white(`Config file: ${path.resolve(configPath)}`));
        console.log(chalk.gray('\n⚠️  This file is in .gitignore and will not be uploaded to GitHub.\n'));
        
        rl.close();
        
    } catch (error) {
        console.error(chalk.red('\n❌ Error:'), error.message);
        rl.close();
        process.exit(1);
    }
}

setupMegaConfig();
