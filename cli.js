#!/usr/bin/env node

const { Command } = require('commander');
const { Listr } = require('listr2');
const chalk = require('chalk');
const Table = require('cli-table3');
const MapsScraper = require('./src/scraper/maps');
const Enricher = require('./src/scraper/enricher');
const Storage = require('./src/server/storage');
const InstagramScraper = require('./src/scraper/instagram');

const program = new Command();
const storage = new Storage();

program
    .name('discovery')
    .description('StructCrew Lead Discovery CLI')
    .version('3.0.0');

program
    .command('search')
    .description('Search and enrich leads from Google Maps')
    .argument('<query>', 'Search query (e.g., "Architects in Mumbai")')
    .option('-l, --limit <number>', 'Maximum leads to fetch', 10)
    .option('-e, --enrich', 'Enrich leads with social/email data', true)
    .action(async (query, options) => {
        console.log(chalk.blue.bold('\n🚀 StructCrew Discovery Engine V3\n'));

        const scraper = new MapsScraper();
        const enricher = new Enricher();
        let leads = [];

        const tasks = new Listr([
            {
                title: `Searching Google Maps for "${query}"`,
                task: async (ctx, task) => {
                    leads = await scraper.search(query, parseInt(options.limit));
                    task.title = `Found ${leads.length} potential leads on Maps`;
                }
            },
            {
                title: 'Enriching leads with Instagram & Email data',
                enabled: () => options.enrich === true,
                task: async (ctx, task) => {
                    const enrichTasks = leads.map((lead, index) => ({
                        title: `Enriching [${index + 1}/${leads.length}] ${lead.name}`,
                        task: async () => {
                            if (lead.website !== 'N/A') {
                                lead.details = await enricher.enrich(lead.website);
                            }
                        }
                    }));
                    return task.newListr(enrichTasks, { concurrent: 2 });
                }
            }
        ]);

        try {
            await tasks.run();

            // Display Results
            const table = new Table({
                head: [
                    chalk.cyan('Name'),
                    chalk.cyan('Email'),
                    chalk.cyan('Instagram'),
                    chalk.cyan('Rating')
                ],
                colWidths: [30, 25, 30, 10]
            });

            leads.forEach(l => {
                table.push([
                    l.name,
                    l.details?.emails[0] || chalk.dim('N/A'),
                    l.details?.instagram ? chalk.magenta(l.details.instagram.split('/').pop()) : chalk.dim('N/A'),
                    l.rating
                ]);
            });

            console.log('\n' + table.toString());

            const totalSaved = storage.save(leads);
            console.log(chalk.green.bold(`\n✅ Discovery Complete! ${leads.length} leads processed.`));
            console.log(chalk.dim(`📊 Dashboard DB now contains ${totalSaved} unique leads.\n`));

        } catch (e) {
            console.error(chalk.red('\nDiscovery Failed:'), e.message);
            console.error(e.stack);
        } finally {
            await scraper.close();
            await enricher.close();
            process.exit(0);
        }
    });

program
    .command('ig-search')
    .description('Discover architectural leads directly on Instagram')
    .argument('<keyword>', 'Industry keyword or hashtag (e.g., "architect")')
    .option('-l, --location <string>', 'Location (e.g., "Mumbai")', '')
    .option('-n, --number <number>', 'Number of profiles to find', 10)
    .action(async (keyword, options) => {
        console.log(chalk.magenta.bold('\n📸 StructCrew Instagram Discovery Engine V3\n'));

        const igScraper = new InstagramScraper();
        let profiles = [];

        const tasks = new Listr([
            {
                title: `Searching Instagram for "${keyword}"${options.location ? ` in ${options.location}` : ''}`,
                task: async (ctx, task) => {
                    profiles = await igScraper.discover(keyword, options.location, parseInt(options.number));
                    task.title = `Found ${profiles.length} profiles from Instagram`;
                }
            }
        ]);

        try {
            await tasks.run();

            const table = new Table({
                head: [
                    chalk.cyan('Name'),
                    chalk.cyan('Handle'),
                    chalk.cyan('Instagram URL')
                ],
                colWidths: [30, 20, 45]
            });

            profiles.forEach(p => {
                table.push([p.name, p.handle, p.instagram]);
            });

            console.log('\n' + table.toString());

            const totalSaved = storage.save(profiles);
            console.log(chalk.green.bold(`\n✅ IG Discovery Complete! ${profiles.length} profiles processed.`));
            console.log(chalk.dim(`📊 Dashboard DB now contains ${totalSaved} unique leads.\n`));

        } catch (e) {
            console.error(chalk.red('\nInstagram Discovery Failed:'), e.message);
        } finally {
            await igScraper.close();
            process.exit(0);
        }
    });

program.parse();
