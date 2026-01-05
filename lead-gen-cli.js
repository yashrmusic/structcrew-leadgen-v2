#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const LeadGenerationWorkflow = require('./lead-generation-workflow');

const program = new Command();

program
    .name('lead-gen')
    .description('Instagram Lead Generation with AWS S3, OCR & Google Sheets')
    .version('1.0.0');

program
    .command('run')
    .description('Run full lead generation workflow')
    .argument('<username>', 'Instagram username (without @)')
    .option('-p, --posts <number>', 'Target posts to download', '1000')
    .option('--no-s3', 'Skip AWS S3 upload')
    .option('-s, --sheet <id>', 'Google Sheet ID for saving leads')
    .option('--creds <path>', 'Google credentials JSON path', './google-credentials.json')
    .option('--no-csv', 'Skip CSV export')
    .action(async (username, options) => {
        const workflow = new LeadGenerationWorkflow();

        console.log(chalk.cyan.bold('\n🚀 LEAD GENERATION WORKFLOW\n'));
        console.log(chalk.white('Profile: @' + username));
        console.log(chalk.white('Target Posts: ' + options.posts));
        console.log(chalk.white('Upload to S3: ' + (options.s3 ? 'Yes' : 'No')));
        console.log(chalk.white('Save to Google Sheets: ' + (options.sheet ? 'Yes' : 'No')));
        console.log(chalk.white('Export CSV: ' + (options.csv ? 'Yes' : 'No') + '\n'));

        try {
            await workflow.run(username, {
                targetPosts: parseInt(options.posts),
                uploadS3: options.s3,
                sheetId: options.sheet,
                credsPath: options.creds,
                exportCSV: options.csv
            });
        } catch (error) {
            console.error(chalk.red('\n❌ Error: ' + error.message));
            process.exit(1);
        }
    });

program
    .command('s3-list')
    .description('List all images in S3 bucket')
    .action(async () => {
        const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
        const fs = require('fs-extra');

        let credsPath = './aws-config.json';
        if (await fs.pathExists(credsPath)) {
            const config = await fs.readJson(credsPath);
            process.env.AWS_ACCESS_KEY_ID = config.accessKeyId;
            process.env.AWS_SECRET_ACCESS_KEY = config.secretAccessKey;
        }

        const client = new S3Client({ region: 'us-east-1' });

        try {
            const command = new ListObjectsV2Command({
                Bucket: 'structcrew-images'
            });

            const response = await client.send(command);

            console.log(chalk.cyan.bold('\n📦 AWS S3 Bucket Contents\n'));
            console.log(chalk.white('Bucket: structcrew-images\n'));

            if (response.Contents && response.Contents.length > 0) {
                response.Contents.forEach(obj => {
                    console.log(chalk.white(`  ${obj.Key}`));
                });
                console.log(chalk.cyan(`\nTotal: ${response.Contents.length} objects\n`));
            } else {
                console.log(chalk.yellow('  No files found\n'));
            }

        } catch (error) {
            console.error(chalk.red('❌ Error: ' + error.message));
            process.exit(1);
        }
    });

program
    .command('send-emails')
    .description('Send emails to OCR-extracted leads')
    .argument('<csv-file>', 'CSV file with leads')
    .option('-s, --subject <text>', 'Email subject', 'Connect with StructCrew')
    .option('-t, --template <name>', 'Email template', 'structcrew-clean')
    .option('--provider <name>', 'Email provider (multi/mailgun/resend/brevo/gmail)', 'multi')
    .action(async (csvFile, options) => {
        console.log(chalk.cyan.bold('\n📧 SENDING EMAILS\n'));
        console.log(chalk.white('CSV: ' + csvFile));
        console.log(chalk.white('Subject: ' + options.subject));
        console.log(chalk.white('Template: ' + options.template));
        console.log(chalk.white('Provider: ' + options.provider + '\n'));

        const fs = require('fs-extra');
        const { execSync } = require('child_process');

        if (!await fs.pathExists(csvFile)) {
            console.error(chalk.red('❌ CSV file not found: ' + csvFile));
            process.exit(1);
        }

        try {
            const cmd = `node email-campaign.js send --provider ${options.provider} -s "${options.subject}" -t ${options.template} -e ${csvFile}`;
            execSync(cmd, { stdio: 'inherit', timeout: 600000 });

        } catch (error) {
            console.error(chalk.red('❌ Error: ' + error.message));
            process.exit(1);
        }
    });

program.parse(process.argv);
