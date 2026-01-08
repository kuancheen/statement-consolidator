// OCR and AI-powered transaction extraction using Gemini AI
class OCRService {
    constructor() {
        this.apiKey = null;
        this.baseUrl = CONFIG.GEMINI_API_BASE;
        this.model = CONFIG.GEMINI_MODEL;
    }

    // Set API key
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem(CONFIG.STORAGE_KEYS.API_KEY, key);
    }

    // Get API key from storage
    getApiKey() {
        if (!this.apiKey) {
            this.apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
        }
        return this.apiKey;
    }

    // Convert file to base64
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Convert PDF to images (simplified - using first page)
    async pdfToImage(file) {
        // For PDFs, we'll send directly to Gemini which can handle PDFs
        return await this.fileToBase64(file);
    }

    // Extract transactions from file using Gemini AI
    async extractTransactions(file, dateFormat = 'DD/MM/YYYY') {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('Gemini API key not set');
        }

        try {
            // Convert file to base64
            const base64Data = await this.fileToBase64(file);
            const isImage = file.type.startsWith('image/');
            const mimeType = isImage ? file.type : 'application/pdf';

            // Prepare the prompt for Gemini - Optimized for Token Efficiency (CSV)
            const prompt = `You are a financial transaction extractor. Analyze this bank statement, credit card statement, or e-wallet transaction screenshot and extract ALL transactions.

CONTEXT:
- The document likely follows the **${dateFormat}** date format (based on user locale).

Output ONLY a raw CSV format with the following headers:
Date,Description,Credit,Debit

Guidelines:
1. Date: **ALWAYS** convert to **YYYY-MM-DD** (ISO 8601) format.
   - Example: If input is 01/02/2023 and format is DD/MM/YYYY -> 2023-02-01
   - Example: If input is 01/02/2023 and format is MM/DD/YYYY -> 2023-01-02
2. Description: Merchant name or details (no commas, replace with spaces)
3. Credit: Amount if money in, else empty
4. Debit: Amount if money out, else empty
5. Do NOT include currency symbols
6. One transaction per line

At the very top, before the CSV, output a metadata line in this format:
METADATA|AccountType|InstitutionName|AccountName

Example Output:
METADATA|bank|DBS|Savings 123
Date,Description,Credit,Debit
2023-10-01,Transfer from Savings,,50.00
2023-10-02,Salary,3000.00,

Extract ALL transactions. Return ONLY valid text.`;

            // Retry logic for API calls
            const makeRequest = async (retryCount = 0) => {
                try {
                    // Call Gemini API
                    const response = await fetch(
                        `${this.baseUrl}/${this.model}:generateContent?key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [
                                        { text: prompt },
                                        {
                                            inline_data: {
                                                mime_type: mimeType,
                                                data: base64Data
                                            }
                                        }
                                    ]
                                }],
                                generationConfig: {
                                    temperature: 0.1,
                                    maxOutputTokens: 8192,
                                }
                            })
                        }
                    );

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
                    }

                    const data = await response.json();

                    // Extract text
                    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!generatedText) throw new Error('No response from Gemini AI');

                    return generatedText;

                } catch (e) {
                    if (retryCount < 2) {
                        console.warn(`Retry ${retryCount + 1}/2: API Error or Truncation.`);
                        return await makeRequest(retryCount + 1);
                    }
                    throw e;
                }
            };

            const generatedText = await makeRequest();

            // PARSE CSV RESPONSE
            const lines = generatedText.split('\n').map(l => l.trim()).filter(l => l);
            let accountType = 'unknown';
            let institutionName = '';
            let accountName = 'Unknown Account';
            const transactions = [];

            let csvStarted = false;

            for (const line of lines) {
                if (line.startsWith('METADATA|')) {
                    const parts = line.split('|');
                    if (parts.length >= 4) {
                        accountType = parts[1].trim();
                        institutionName = parts[2].trim();
                        accountName = parts[3].trim();
                    }
                    continue;
                }

                // Skip header or empty lines
                if (line.toLowerCase().startsWith('date,description') || !line.includes(',')) {
                    continue;
                }

                // Simple CSV parse (handling comma in quotes if AI adds them, but we asked it not to)
                // We'll assume simple split by comma since we asked to remove commas in description
                const cols = line.split(',');
                if (cols.length >= 4) {
                    transactions.push({
                        date: cols[0].trim(),
                        description: cols[1].trim(),
                        credit: cols[2].trim(),
                        debit: cols[3].trim()
                    });
                }
            }

            return {
                accountType,
                institutionName,
                accountName,
                transactions
            };

        } catch (error) {
            console.error('OCR extraction error:', error);
            if (error.message.includes('leaked')) {
                throw new Error('Your API Key was disabled by Google because it was detected publicly. Please generate a NEW key at aistudio.google.com and update it in Step 1.');
            }
            throw error;
        }
    }

    // Suggest which account sheet this belongs to
    suggestAccountSheet(extractedData, availableSheets) {
        const { accountType, accountName } = extractedData;

        // Try exact match first (case insensitive)
        const exactMatch = availableSheets.find(sheet =>
            sheet.displayName.toLowerCase() === accountName.toLowerCase()
        );
        if (exactMatch) return exactMatch;

        // Try partial match
        const partialMatch = availableSheets.find(sheet =>
            sheet.displayName.toLowerCase().includes(accountName.toLowerCase()) ||
            accountName.toLowerCase().includes(sheet.displayName.toLowerCase())
        );
        if (partialMatch) return partialMatch;

        // Try matching by account type
        const typeMatch = availableSheets.find(sheet => {
            const sheetLower = sheet.displayName.toLowerCase();
            const patterns = CONFIG.ACCOUNT_PATTERNS[accountType] || [];
            return patterns.some(pattern => sheetLower.includes(pattern));
        });
        if (typeMatch) return typeMatch;

        // No match found
        return null;
    }
}
