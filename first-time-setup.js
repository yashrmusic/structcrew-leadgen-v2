#!/usr/bin/env node

const fs = require('fs-extra');
const chalk = require('chalk');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => resolve(answer));
    });
}

async function main() {
    console.log(chalk.cyan.bold('╔══════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║        FIRST TIME SETUP - CREDENTIALS CONFIGURATION       ║'));
    console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════╝'));
    
    console.log(chalk.yellow('\n⚠️  This will configure all credential files for you.'));
    console.log(chalk.yellow('⚠️  Press Enter to skip any section.\n'));
    
    const answers = {};
    
    // ==================== GMAIL CONFIG ====================
    console.log(chalk.cyan.bold('\n═════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan.bold('📧 GMAIL SMTP CONFIGURATION'));
    console.log(chalk.cyan.bold('═════════════════════════════════════════════════════════════\n'));
    
    const useGmail = await question(chalk.white('Configure Gmail SMTP? (y/N): '));
    
    if (useGmail.toLowerCase() === 'y') {
        const gmailAppPassword = await question(chalk.white('Gmail App Password: '));
        const gmail = await question(chalk.white('Gmail Email [structcrew@gmail.com]: '));
        
        answers.email = {
            smtpAccounts: [
                {
                    email: gmail || 'structcrew@gmail.com',
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    pass: gmailAppPassword,
                    name: 'gmail'
                }
            ],
            fromName: 'StructCrew',
            fromEmail: gmail || 'structcrew@gmail.com',
            dailyLimit: 500,
            batchDelay: 5000,
            retryAttempts: 3,
            retryDelay: 10000
        };
        
        console.log(chalk.green('✅ Gmail configured'));
    }
    
    // ==================== AWS S3 CONFIG ====================
    console.log(chalk.cyan.bold('\n═════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan.bold('☁️  AWS S3 CONFIGURATION'));
    console.log(chalk.cyan.bold('═════════════════════════════════════════════════════════════\n'));
    
    const useAWS = await question(chalk.white('Configure AWS S3? (y/N): '));
    
    if (useAWS.toLowerCase() === 'y') {
        const awsAccessKeyId = await question(chalk.white('AWS Access Key ID: '));
        const awsSecretAccessKey = await question(chalk.white('AWS Secret Access Key: '));
        const awsBucket = await question(chalk.white('S3 Bucket Name [structcrew-images]: '));
        const awsRegion = await question(chalk.white('S3 Region [us-east-1]: '));
        
        answers.aws = {
            accessKeyId: awsAccessKeyId,
            secretAccessKey: awsSecretAccessKey,
            bucket: awsBucket || 'structcrew-images',
            region: awsRegion || 'us-east-1'
        };
        
        console.log(chalk.green('✅ AWS S3 configured'));
    }
    
    // ==================== MEGA CONFIG ====================
    console.log(chalk.cyan.bold('\n═════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan.bold('📦 MEGA CLOUD CONFIGURATION'));
    console.log(chalk.cyan.bold('═════════════════════════════════════════════════════════════\n'));
    
    const useMega = await question(chalk.white('Configure MEGA? (y/N): '));
    
    if (useMega.toLowerCase() === 'y') {
        const megaEmail = await question(chalk.white('MEGA Email [iamyash95@gmail.com]: '));
        const megaPassword = await question(chalk.white('MEGA Password: '));
        
        answers.mega = {
            email: megaEmail || 'iamyash95@gmail.com',
            password: megaPassword
        };
        
        console.log(chalk.green('✅ MEGA configured'));
    }
    
    // ==================== TWILIO CONFIG ====================
    console.log(chalk.cyan.bold('\n═════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan.bold('📱 TWILIO WHATSAPP CONFIGURATION'));
    console.log(chalk.cyan.bold('═════════════════════════════════════════════════════════════\n'));
    
    const useTwilio = await question(chalk.white('Configure Twilio (for WhatsApp)? (y/N): '));
    
    if (useTwilio.toLowerCase() === 'y') {
        const twilioAccountSid = await question(chalk.white('Twilio Account SID: '));
        const twilioAuthToken = await question(chalk.white('Twilio Auth Token: '));
        const twilioFromNumber = await question(chalk.white('Twilio Phone Number: '));
        
        answers.twilio = {
            accountSid: twilioAccountSid,
            authToken: twilioAuthToken,
            fromNumber: twilioFromNumber
        };
        
        console.log(chalk.green('✅ Twilio configured'));
    }
    
    // ==================== RESEND CONFIG ====================
    console.log(chalk.cyan.bold('\n═════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan.bold('📬 RESEND EMAIL CONFIGURATION'));
    console.log(chalk.cyan.bold('═════════════════════════════════════════════════════════════\n'));
    
    const useResend = await question(chalk.white('Configure Resend? (y/N): '));
    
    if (useResend.toLowerCase() === 'y') {
        const resendApiKey = await question(chalk.white('Resend API Key: '));
        const resendFromEmail = await question(chalk.white('Resend From Email [mail@structcrew.online]: '));
        
        answers.resend = {
            apiKey: resendApiKey,
            fromEmail: resendFromEmail || 'mail@structcrew.online',
            dailyLimit: 100
        };
        
        console.log(chalk.green('✅ Resend configured'));
    }
    
    rl.close();
    
    // ==================== WRITE FILES ====================
    console.log(chalk.cyan.bold('\n═════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan.bold('💾 SAVING CONFIGURATION FILES'));
    console.log(chalk.cyan.bold('═════════════════════════════════════════════════════════════\n'));
    
    if (answers.email) {
        await fs.writeJson('email-config.json', answers.email, { spaces: 2 });
        console.log(chalk.green('✅ Created: email-config.json'));
    }
    
    if (answers.aws) {
        await fs.writeJson('aws-config.json', answers.aws, { spaces: 2 });
        console.log(chalk.green('✅ Created: aws-config.json'));
    }
    
    if (answers.mega) {
        await fs.writeJson('mega-config.json', answers.mega, { spaces: 2 });
        console.log(chalk.green('✅ Created: mega-config.json'));
    }
    
    if (answers.twilio) {
        await fs.writeJson('twilio-config.json', answers.twilio, { spaces: 2 });
        console.log(chalk.green('✅ Created: twilio-config.json'));
    }
    
    if (answers.resend) {
        const emailConfig = await fs.readJson('email-config.json').catch(() => answers.email || {});
        emailConfig.resend = answers.resend;
        await fs.writeJson('email-config.json', emailConfig, { spaces: 2 });
        console.log(chalk.green('✅ Updated: email-config.json (added Resend)'));
    }
    
    // ==================== SUMMARY ====================
    console.log(chalk.cyan.bold('\n═════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan.bold('✅ SETUP COMPLETE'));
    console.log(chalk.cyan.bold('═════════════════════════════════════════════════════════════\n'));
    
    console.log(chalk.white('📁 Files Created:'));
    if (answers.email) console.log(chalk.white('   - email-config.json (Gmail SMTP)'));
    if (answers.aws) console.log(chalk.white('   - aws-config.json (AWS S3)'));
    if (answers.mega) console.log(chalk.white('   - mega-config.json (MEGA)'));
    if (answers.twilio) console.log(chalk.white('   - twilio-config.json (Twilio)'));
    if (answers.resend) console.log(chalk.white('   - email-config.json (updated with Resend)'));
    
    console.log(chalk.yellow('\n⚠️  SECURITY NOTES:'));
    console.log(chalk.yellow('   - All credential files are in .gitignore'));
    console.log(chalk.yellow('   - They will NOT be committed to GitHub'));
    console.log(chalk.yellow('   - Keep these files secure and private'));
    console.log(chalk.yellow('   - Don\'t share with others\n'));
    
    console.log(chalk.cyan('🚀 NEXT STEPS:\n'));
    
    console.log(chalk.white('1. Test email sending:'));
    console.log(chalk.yellow('   node email-campaign.js send -s "Test" -t structcrew-clean -e YOUR_EMAIL --limit 1\n'));
    
    console.log(chalk.white('2. Test AWS S3:'));
    console.log(chalk.yellow('   node upload-to-s3.js --list-buckets\n'));
    
    console.log(chalk.white('3. Upload images to S3:'));
    console.log(chalk.yellow('   node upload-to-s3.js --upload-all\n'));
    
    console.log(chalk.white('4. Upload images to MEGA (web interface):'));
    console.log(chalk.yellow('   Go to https://mega.nz and upload folders\n'));
    
    console.log(chalk.cyan('📖 For more information, see:'));
    console.log(chalk.yellow('   - FIRST_TIME_SETUP.md (manual setup guide)\n'));
    console.log(chalk.yellow('   - AWS_S3_QUICKSTART.md (AWS S3 details)\n'));
    console.log(chalk.yellow('   - CLOUD_STORAGE_GUIDE.md (all cloud options)\n'));
    
    console.log(chalk.green.bold('\n✨ Setup complete! You\'re ready to go!\n'));
}

main().catch(error => {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
});
