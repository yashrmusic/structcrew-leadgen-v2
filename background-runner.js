const { runQueue } = require('./src/server/scheduler');

async function start() {
    console.log('--- StructCrew Background Discovery Engine ---');
    console.log('Started at:', new Date().toLocaleString());

    try {
        await runQueue();
        console.log('Successfully completed all queue items.');
    } catch (e) {
        console.error('Background Run Failed:', e.message);
    } finally {
        console.log('Exiting...');
        process.exit(0);
    }
}

start();
