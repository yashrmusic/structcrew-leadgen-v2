class BusinessTypeDetector {
    constructor() {
        this.architectureKeywords = [
            'architect', 'architecture', 'architectural',
            'structural', 'structuralengineer', 'civil',
            'building', 'construction', 'blueprint',
            'drafting', 'designbuild'
        ];

        this.interiorDesignKeywords = [
            'interior', 'interiordesign', 'interiors',
            'decor', 'decoration', 'homedecor',
            'spacedesign', 'furnishing', 'styling',
            'aesthetic', 'aesthetics', 'homestyling',
            'roomdesign', 'spaceplanning', 'interiordesigner'
        ];

        this.studioKeywords = [
            'studio', 'studios', 'designstudio',
            'designfirm', 'designagency',
            'creative', 'creatives'
        ];

        this.landscapeKeywords = [
            'landscape', 'landscaping', 'outdoor',
            'garden', 'gardening', 'greenscape',
            'exteriordesign', 'outdoor'
        ];

        this.urbanDesignKeywords = [
            'urban', 'urbancraft', 'urbanscape',
            'cityplanning', 'townplanning',
            'masterplan', 'urbanist'
        ];
    }

    detectFromEmail(email) {
        const domain = email.split('@')[1]?.toLowerCase() || '';
        const localPart = email.split('@')[0]?.toLowerCase() || '';

        const textToAnalyze = `${domain} ${localPart}`;
        return this.analyzeText(textToAnalyze);
    }

    detectFromHandle(handle) {
        const cleanedHandle = handle.replace('@', '').toLowerCase();
        return this.analyzeText(cleanedHandle);
    }

    detectFromBio(bio) {
        return this.analyzeText(bio.toLowerCase());
    }

    analyzeText(text) {
        let scores = {
            'Architecture Studio': 0,
            'Interior Design Studio': 0,
            'Landscape Design': 0,
            'Urban Design': 0,
            'Design Studio': 0,
            'Other': 0
        };

        const words = text.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/);

        for (const word of words) {
            const normalizedWord = word.toLowerCase();

            for (const keyword of this.architectureKeywords) {
                if (normalizedWord.includes(keyword)) {
                    scores['Architecture Studio'] += 3;
                }
            }

            for (const keyword of this.interiorDesignKeywords) {
                if (normalizedWord.includes(keyword)) {
                    scores['Interior Design Studio'] += 3;
                }
            }

            for (const keyword of this.landscapeKeywords) {
                if (normalizedWord.includes(keyword)) {
                    scores['Landscape Design'] += 3;
                }
            }

            for (const keyword of this.urbanDesignKeywords) {
                if (normalizedWord.includes(keyword)) {
                    scores['Urban Design'] += 3;
                }
            }

            for (const keyword of this.studioKeywords) {
                if (normalizedWord.includes(keyword)) {
                    scores['Design Studio'] += 1;
                    if (scores['Architecture Studio'] > 0) scores['Architecture Studio'] += 1;
                    if (scores['Interior Design Studio'] > 0) scores['Interior Design Studio'] += 1;
                }
            }
        }

        let maxScore = 0;
        let detectedType = 'Other';

        for (const [type, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                detectedType = type;
            }
        }

        return detectedType;
    }

    detectBusinessType(leadData) {
        const { email, instagramHandle, bio } = leadData;

        let typeFromEmail = 'Other';
        let typeFromHandle = 'Other';
        let typeFromBio = 'Other';

        if (email) {
            typeFromEmail = this.detectFromEmail(email);
        }

        if (instagramHandle) {
            typeFromHandle = this.detectFromHandle(instagramHandle);
        }

        if (bio) {
            typeFromBio = this.detectFromBio(bio);
        }

        if (typeFromEmail !== 'Other') {
            return typeFromEmail;
        }

        if (typeFromHandle !== 'Other') {
            return typeFromHandle;
        }

        if (typeFromBio !== 'Other') {
            return typeFromBio;
        }

        return 'Other';
    }
}

module.exports = BusinessTypeDetector;