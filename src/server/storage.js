const fs = require('fs');
const path = require('path');

/**
 * Local Lead & Queue Storage
 * Persists leads and automation queue to JSON files.
 */
class Storage {
    constructor() {
        this.leadsPath = path.join(process.cwd(), 'leads_db.json');
        this.queuePath = path.join(process.cwd(), 'queue_db.json');
        this.init();
    }

    init() {
        if (!fs.existsSync(this.leadsPath)) {
            fs.writeFileSync(this.leadsPath, JSON.stringify([], null, 2));
        }
        if (!fs.existsSync(this.queuePath)) {
            // Default queue items
            const defaultQueue = [
                { id: 1, query: 'Architects in Mumbai', status: 'pending', lastRun: null },
                { id: 2, query: 'Interior Designers in Delhi', status: 'pending', lastRun: null }
            ];
            fs.writeFileSync(this.queuePath, JSON.stringify(defaultQueue, null, 2));
        }
    }

    /**
     * Leads Operations
     */
    save(newLeads) {
        const existing = this.getAll();
        const merged = [...existing];

        newLeads.forEach(lead => {
            const index = merged.findIndex(l => l.name === lead.name);
            if (index !== -1) {
                // Update existing lead, preserving status if it already exists
                merged[index] = { 
                    status: 'New', 
                    ...merged[index], 
                    ...lead 
                };
            } else {
                // Add new lead with default status
                merged.push({
                    ...lead,
                    status: 'New',
                    discoveredAt: new Date().toISOString()
                });
            }
        });

        fs.writeFileSync(this.leadsPath, JSON.stringify(merged, null, 2));
        return merged.length;
    }

    updateLeadStatus(name, status) {
        const leads = this.getAll();
        const index = leads.findIndex(l => l.name === name);
        if (index !== -1) {
            leads[index].status = status;
            fs.writeFileSync(this.leadsPath, JSON.stringify(leads, null, 2));
            return true;
        }
        return false;
    }

    getAll() {
        try {
            return JSON.parse(fs.readFileSync(this.leadsPath, 'utf8'));
        } catch (e) {
            return [];
        }
    }

    /**
     * Queue Operations
     */
    getQueue() {
        try {
            return JSON.parse(fs.readFileSync(this.queuePath, 'utf8'));
        } catch (e) {
            return [];
        }
    }

    addToQueue(query) {
        const queue = this.getQueue();
        const newItem = {
            id: Date.now(),
            query,
            status: 'pending',
            lastRun: null,
            addedAt: new Date().toISOString()
        };
        queue.push(newItem);
        fs.writeFileSync(this.queuePath, JSON.stringify(queue, null, 2));
        return newItem;
    }

    removeFromQueue(id) {
        const queue = this.getQueue();
        const filtered = queue.filter(item => item.id !== parseInt(id));
        fs.writeFileSync(this.queuePath, JSON.stringify(filtered, null, 2));
        return true;
    }

    updateQueueStatus(id, status, lastRun = null) {
        const queue = this.getQueue();
        const index = queue.findIndex(item => item.id === parseInt(id));
        if (index !== -1) {
            queue[index].status = status;
            if (lastRun) queue[index].lastRun = lastRun;
            fs.writeFileSync(this.queuePath, JSON.stringify(queue, null, 2));
            return true;
        }
        return false;
    }

    /**
     * Stats
     */
    getStats() {
        const leads = this.getAll();
        return {
            totalLeads: leads.length,
            newLeads: leads.filter(l => l.status === 'New').length,
            contactedLeads: leads.filter(l => l.status === 'Contacted').length,
            interestedLeads: leads.filter(l => l.status === 'Interested').length,
            queueCount: this.getQueue().length
        };
    }
}

module.exports = Storage;
