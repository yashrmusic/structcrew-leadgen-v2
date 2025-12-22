const fs = require('fs');
const path = require('path');

/**
 * Local Lead Storage
 * Persists leads to a JSON file to prevent data loss 
 * and enable background resume.
 */
class Storage {
    constructor(filename = 'leads_db.json') {
        this.filePath = path.join(process.cwd(), filename);
        this.init();
    }

    init() {
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
        }
    }

    /**
     * Save a list of leads, merging with existing ones by name
     */
    save(newLeads) {
        const existing = JSON.parse(fs.readFileSync(this.filePath));

        // Merge strategy: update or add
        const merged = [...existing];

        newLeads.forEach(lead => {
            const index = merged.findIndex(l => l.name === lead.name);
            if (index !== -1) {
                merged[index] = { ...merged[index], ...lead };
            } else {
                merged.push(lead);
            }
        });

        fs.writeFileSync(this.filePath, JSON.stringify(merged, null, 2));
        return merged.length;
    }

    getAll() {
        return JSON.parse(fs.readFileSync(this.filePath));
    }
}

module.exports = Storage;
