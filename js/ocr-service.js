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
    async extractTransactions(file) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('Gemini API key not set');
        }

        try {
            // Convert file to base64
            const base64Data = await this.fileToBase64(file);
            const mimeType = file.type;

            // Prepare the prompt for Gemini
            const prompt = `You are a financial transaction extractor. Analyze this bank statement, credit card statement, or e-wallet transaction screenshot and extract ALL transactions.

For each transaction, extract:
1. Date (in YYYY-MM-DD format if possible, or the original format)
2. Description (merchant name or transaction details)
3. Amount (just the number, no currency symbols)
4. Type (whether it's a credit/deposit or debit/withdrawal)

Also identify:
- Account type (bank/credit card/e-wallet)
- Account name or identifier if visible

Return the data in this EXACT JSON format:
{
  "accountType": "bank|credit|ewallet",
  "institutionName": "Bank/Issuer Name (e.g. DBS, Grab, Citi)",
  "accountName": "Account identifier (e.g. Savings 123, GrabPay)",
  "transactions": [
    {
      "date": "YYYY-MM-DD or original format",
      "description": "transaction description",
      "credit": "amount if money in, empty string otherwise",
      "debit": "amount if money out, empty string otherwise"
    }
  ]
}

IMPORTANT:
- Extract ALL transactions visible in the document
- For credit cards: purchases are debits, payments are credits
- For banks: deposits are credits, withdrawals are debits
- For e-wallets: top-ups are credits, payments are debits
- Return ONLY valid JSON, no additional text
- If no transactions found, return empty transactions array`;

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

            // Extract the generated text
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!generatedText) {
                throw new Error('No response from Gemini AI');
            }

            // Parse JSON from the response
            const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Could not extract JSON from AI response');
            }

            const result = JSON.parse(jsonMatch[0]);

            return {
                accountType: result.accountType || 'unknown',
                institutionName: result.institutionName || '',
                accountName: result.accountName || 'Unknown Account',
                transactions: result.transactions || []
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
