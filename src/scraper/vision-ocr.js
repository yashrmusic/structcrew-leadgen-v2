const { GoogleGenerativeAI } = require('@google/generative-ai');
const EnhancedOCR = require('./enhanced-ocr');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

/**
 * Unified Vision OCR Controller
 * Supports: Gemini, Groq (Llama-3-vision), and Enhanced Tesseract Fallback
 */
class VisionOCR {
    constructor(config = {}) {
        this.geminiKey = config.geminiKey || process.env.GEMINI_API_KEY;
        this.groqKey = config.groqKey || process.env.GROQ_API_KEY;
        this.openaiKey = config.openaiKey || process.env.OPENAI_API_KEY;
        this.glmKey = config.glmKey || process.env.GLM_API_KEY;
        this.openRouterKey = config.openRouterKey || process.env.OPENROUTER_API_KEY;
        this.huggingFaceKey = config.huggingFaceKey || process.env.HUGGINGFACE_API_KEY;

        console.log(`[VisionOCR] Constructor: GLM=${this.glmKey ? 'SET' : 'MISSING'}, HF=${this.huggingFaceKey ? 'SET' : 'MISSING'}`);

        this.genAI = this.geminiKey ? new GoogleGenerativeAI(this.geminiKey) : null;
        this.enhancedOcr = new EnhancedOCR();

        this.prompt = `Extract all emails and phone numbers from this image.
Format your response ONLY as a valid JSON object. Do not include markdown blocks or any other text.
{
  "emails": [],
  "phones": [],
  "raw_text": ""
}`;

        this.lastRequestTime = 0;
        this.rateLimit = 15; // requests per minute for Gemini free tier
    }

    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minInterval = (60 * 1000) / this.rateLimit;

        if (timeSinceLastRequest < minInterval) {
            const waitTime = minInterval - timeSinceLastRequest;
            await new Promise(r => setTimeout(r, waitTime));
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * Main entry point for OCR
     */
    async processImage(imagePath) {
        const imageName = path.basename(imagePath);

        // 1. Try OpenRouter (GLM-4V / Gemini-2.0 / Llama-3 Vision) - USER Priority
        if (this.openRouterKey) {
            try {
                console.log(`[VisionOCR] Attempting OpenRouter (GLM/Vision) for ${imageName}...`);
                return await this._processWithOpenRouter(imagePath);
            } catch (e) {
                console.log(`⚠️ OpenRouter failed: ${e.message}`);
                // Continue to next provider
            }
        }

        // 2. Try Hugging Face (GLM-4V)
        if (this.huggingFaceKey) {
            try {
                console.log(`[VisionOCR] Attempting Hugging Face (GLM) for ${imageName}...`);
                return await this._processWithHuggingFace(imagePath);
            } catch (e) {
                console.log(`⚠️ Hugging Face failed: ${e.message}`);
            }
        }

        // 3. Try GLM-4V (Routeway.ai)
        if (this.glmKey) {
            try {
                console.log(`[VisionOCR] Attempting GLM-4V (Routeway) for ${imageName}...`);
                return await this._processWithGLM(imagePath);
            } catch (e) {
                console.log(`⚠️ GLM failed: ${e.message}`);
            }
        }

        // 4. Try Native Gemini
        if (this.geminiKey) {
            try {
                console.log(`[VisionOCR] Attempting Native Gemini for ${imageName}...`);
                return await this._processWithGemini(imagePath);
            } catch (e) {
                console.log(`⚠️ Native Gemini failed: ${e.message}`);
            }
        }

        // 5. Try Groq
        if (this.groqKey) {
            try {
                console.log(`[VisionOCR] Attempting Groq (Vision) for ${imageName}...`);
                return await this._processWithGroq(imagePath);
            } catch (e) {
                console.log(`⚠️ Groq failed: ${e.message}`);
            }
        }

        // 5. Final Local Fallback: Enhanced Tesseract
        console.log(`📉 All AI models unavailable for ${imageName}. Falling back to Enhanced Tesseract...`);
        const tessResult = await this.enhancedOcr.processImage(imagePath);
        return {
            emails: tessResult.emails,
            phones: tessResult.phones,
            rawText: tessResult.text,
            success: true,
            method: 'tesseract'
        };
    }

    /**
     * Gemini Implementation
     */
    async _processWithGemini(imagePath) {
        await this.waitForRateLimit();
        const models = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
        let lastError = null;

        for (const modelName of models) {
            try {
                const model = this.genAI.getGenerativeModel({ model: modelName });
                const imgData = await fs.readFile(imagePath);

                const result = await model.generateContent([
                    this.prompt,
                    {
                        inlineData: {
                            data: imgData.toString('base64'),
                            mimeType: 'image/jpeg'
                        }
                    }
                ]);

                const response = await result.response;
                const text = response.text();
                return this._parseJsonResponse(text, 'gemini-' + modelName);
            } catch (e) {
                lastError = e;
                if (e.message.includes('429') || e.message.includes('404')) continue;
                throw e;
            }
        }
        throw lastError;
    }

    /**
     * Process multiple images
     */
    async processImages(imagePaths, logCallback = console.log) {
        const results = {
            extractedEmails: [],
            extractedPhones: [],
            scannedCount: 0,
            successCount: 0,
            failedCount: 0,
            allData: []
        };

        for (let i = 0; i < imagePaths.length; i++) {
            const imgPath = imagePaths[i];
            const progress = `[${i + 1}/${imagePaths.length}]`;

            try {
                const result = await this.processImage(imgPath);
                results.scannedCount++;

                if (result.success) {
                    results.successCount++;
                    results.extractedEmails.push(...result.emails);
                    results.extractedPhones.push(...result.phones);

                    results.allData.push({
                        image: path.basename(imgPath),
                        emails: result.emails,
                        phones: result.phones,
                        rawText: result.rawText,
                        method: result.method
                    });

                    if (result.emails.length > 0 || result.phones.length > 0) {
                        logCallback(`${progress} ✅ ${path.basename(imgPath)}: ${result.emails.length} emails, ${result.phones.length} phones (${result.method})`);
                    } else {
                        logCallback(`${progress} ⚪ ${path.basename(imgPath)}: no info (${result.method})`);
                    }
                } else {
                    results.failedCount++;
                    logCallback(`${progress} ❌ ${path.basename(imgPath)}: failed`);
                }
            } catch (e) {
                results.failedCount++;
                logCallback(`${progress} ❌ ${path.basename(imgPath)}: ${e.message}`);
            }
        }

        // Deduplicate
        results.extractedEmails = [...new Set(results.extractedEmails)];
        results.extractedPhones = [...new Set(results.extractedPhones)];

        return results;
    }

    /**
     * Groq (Llama-3.2-11b-vision) Implementation
     * Note: Groq requires image to be base64 in the payload
     */
    async _processWithGroq(imagePath) {
        const imgData = await fs.readFile(imagePath);
        const base64Image = imgData.toString('base64');

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: this.prompt },
                        {
                            type: 'image_url',
                            image_url: { url: `data:image/jpeg;base64,${base64Image}` }
                        }
                    ]
                }
            ],
            response_format: { type: 'json_object' }
        }, {
            headers: {
                'Authorization': `Bearer ${this.groqKey}`,
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.choices[0].message.content;
        return this._parseJsonResponse(content, 'groq-llama3');
    }

    /**
     * GLM-4V (Routeway.ai) Implementation
     */
    async _processWithGLM(imagePath) {
        const imgData = await fs.readFile(imagePath);
        const base64Image = imgData.toString('base64');
        const models = ['gemini-2.5-flash', 'nemotron-nano-12b-v2-vl', 'glm-4.6', 'glm-4.6:free'];
        let lastError = null;

        for (const modelName of models) {
            try {
                const response = await axios.post('https://api.routeway.ai/v1/chat/completions', {
                    model: modelName,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: this.prompt },
                                {
                                    type: 'image_url',
                                    image_url: { url: `data:image/jpeg;base64,${base64Image}` }
                                }
                            ]
                        }
                    ],
                    max_tokens: 1500,
                    temperature: 0.1
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.glmKey.trim()}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.error && response.data.error.code === 402) {
                    console.log(`📡 Routeway model ${modelName} insufficient balance, trying next...`);
                    continue;
                }

                const content = response.data.choices[0].message.content;
                return this._parseJsonResponse(content, 'glm-4v-' + modelName);
            } catch (e) {
                lastError = e;
                if (e.response && e.response.status === 402) {
                    console.log(`📡 Routeway model ${modelName} returns 402, trying next...`);
                    continue;
                }
                console.log(`⚠️ Routeway model ${modelName} failed: ${e.message}`);
                if (e.response && e.response.data) {
                    console.log('📡 GLM Error Data:', JSON.stringify(e.response.data, null, 2));
                }
            }
        }
        throw lastError;
    }

    /**
     * OpenRouter (GLM-4V) Implementation
     */
    async _processWithOpenRouter(imagePath) {
        const imgData = await fs.readFile(imagePath);
        const base64Image = imgData.toString('base64');

        // OpenRouter models for Vision (Verified 2025 IDs)
        const models = [
            'z-ai/glm-4.6v',
            'z-ai/glm-4.5v',
            'google/gemini-2.0-flash-exp:free',
            'meta-llama/llama-3.2-11b-vision-instruct',
            'openai/gpt-4o-mini'
        ];
        let lastError = null;

        for (const modelName of models) {
            try {
                const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                    model: modelName,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: this.prompt },
                                {
                                    type: 'image_url',
                                    image_url: { url: `data:image/jpeg;base64,${base64Image}` }
                                }
                            ]
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.1
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.openRouterKey.trim()}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://structcrew.online', // Required by OpenRouter
                        'X-Title': 'StructCrew LeadGen'
                    }
                });

                if (!response.data.choices || response.data.choices.length === 0) {
                    throw new Error('OpenRouter returned empty choices');
                }

                const content = response.data.choices[0].message.content;
                return this._parseJsonResponse(content, 'openrouter-' + modelName);
            } catch (e) {
                lastError = e;
                console.log(`⚠️ OpenRouter model ${modelName} failed: ${e.message}`);
                if (e.response && e.response.data) {
                    console.log('📡 OpenRouter Error Data:', JSON.stringify(e.response.data, null, 2));
                }
            }
        }
        throw lastError;
    }

    /**
     * Hugging Face (GLM-4V) Implementation
     */
    async _processWithHuggingFace(imagePath) {
        const imgData = await fs.readFile(imagePath);
        const models = ['OpenGVLab/InternVL2-8B', 'THUDM/glm-4v-9b', 'microsoft/phi-3-vision-128k-instruct'];
        let lastError = null;

        for (const modelName of models) {
            try {
                const response = await axios.post(`https://api-inference.huggingface.co/models/${modelName}`, imgData, {
                    headers: {
                        'Authorization': `Bearer ${this.huggingFaceKey.trim()}`,
                        'Content-Type': 'image/jpeg'
                    },
                    timeout: 30000 // 30s timeout for cold start
                });

                // Hugging Face inference API might return text or array of results
                const text = Array.isArray(response.data) ? response.data[0].generated_text : (response.data.generated_text || response.data);
                if (!text) throw new Error('Hugging Face returned empty response');

                return this._parseJsonResponse(text, 'huggingface-' + modelName);
            } catch (e) {
                lastError = e;
                if (e.message.includes('loading') || e.message.includes('503')) {
                    console.log(`📡 Hugging Face model ${modelName} is loading...`);
                    continue;
                }
                console.log(`⚠️ Hugging Face model ${modelName} failed: ${e.message}`);
            }
        }
        throw lastError;
    }

    _parseJsonResponse(text, method) {
        try {
            // Remove markdown code blocks if any
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleaned);
            return {
                emails: data.emails || [],
                phones: data.phones || [],
                rawText: data.raw_text || text,
                success: true,
                method: method
            };
        } catch (e) {
            // Fallback to regex extraction if JSON fails
            const emails = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi) || [];
            const phones = text.match(/(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g) || [];
            return {
                emails,
                phones,
                rawText: text,
                success: true,
                method: method + '-regex-fallback'
            };
        }
    }

    async close() {
        if (this.enhancedOcr) {
            await this.enhancedOcr.close();
        }
    }
}

module.exports = VisionOCR;
