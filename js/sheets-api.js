// Google Sheets API Integration
class SheetsAPI {
    constructor() {
        this.sheetId = null;
        this.baseUrl = CONFIG.SHEETS_API_BASE;
        this.apiKey = null;
    }

    // Set API key
    setApiKey(key) {
        this.apiKey = key;
        CONFIG.SHEETS_API_KEY = key;
    }

    // Get API key
    getApiKey() {
        if (!this.apiKey) {
            this.apiKey = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY);
        }
        return this.apiKey;
    }

    // Extract sheet ID from Google Sheets URL
    extractSheetId(url) {
        const patterns = [
            /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
            /^([a-zA-Z0-9-_]+)$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        throw new Error('Invalid Google Sheets URL or ID');
    }

    // Connect to a Google Sheet
    async connect(sheetUrl) {
        try {
            this.sheetId = this.extractSheetId(sheetUrl);

            const apiKey = this.getApiKey();
            if (!apiKey) {
                throw new Error('API key not set. Please enter your Google AI API key first.');
            }

            // Test connection by fetching sheet metadata
            const response = await fetch(
                `${this.baseUrl}/${this.sheetId}?fields=sheets.properties&key=${apiKey}`,
                { method: 'GET' }
            );

            if (!response.ok) {
                throw new Error(`Failed to connect: ${response.statusText}`);
            }

            const data = await response.json();

            // Save to local storage
            localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_SHEET_ID, this.sheetId);

            return data.sheets || [];
        } catch (error) {
            console.error('Connection error:', error);
            throw new Error('Failed to connect to Google Sheet. Make sure it\'s publicly editable.');
        }
    }

    // Get all sheets with @ prefix
    async getAccountSheets() {
        if (!this.sheetId) {
            throw new Error('Not connected to a sheet');
        }

        const apiKey = this.getApiKey();
        const response = await fetch(
            `${this.baseUrl}/${this.sheetId}?fields=sheets.properties&key=${apiKey}`,
            { method: 'GET' }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch sheets');
        }

        const data = await response.json();
        const allSheets = data.sheets || [];

        // Filter sheets with @ prefix
        return allSheets
            .map(sheet => sheet.properties)
            .filter(props => props.title.startsWith(CONFIG.ACCOUNT_SHEET_PREFIX))
            .map(props => ({
                id: props.sheetId,
                title: props.title,
                displayName: props.title.substring(1) // Remove @ prefix for display
            }));
    }

    // Read existing transactions from a sheet
    async readTransactions(sheetName) {
        if (!this.sheetId) {
            throw new Error('Not connected to a sheet');
        }

        const apiKey = this.getApiKey();
        const range = `${sheetName}!A:D`; // Date, Description, Credit, Debit
        const response = await fetch(
            `${this.baseUrl}/${this.sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`,
            { method: 'GET' }
        );

        if (!response.ok) {
            throw new Error('Failed to read transactions');
        }

        const data = await response.json();
        const rows = data.values || [];

        if (rows.length === 0) return [];

        // Skip header row
        const transactions = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length >= 2) { // At least date and description
                transactions.push({
                    date: row[0] || '',
                    description: row[1] || '',
                    credit: row[2] || '',
                    debit: row[3] || ''
                });
            }
        }

        return transactions;
    }

    // Append new transactions to a sheet
    async appendTransactions(sheetName, transactions) {
        if (!this.sheetId) {
            throw new Error('Not connected to a sheet');
        }

        // Convert transactions to rows
        const rows = transactions.map(t => [
            t.date,
            t.description,
            t.credit || '',
            t.debit || ''
        ]);

        const apiKey = this.getApiKey();
        const range = `${sheetName}!A:D`;
        const response = await fetch(
            `${this.baseUrl}/${this.sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: rows
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to append transactions: ${error}`);
        }

        return await response.json();
    }

    // Create a new account sheet
    async createAccountSheet(accountName) {
        if (!this.sheetId) {
            throw new Error('Not connected to a sheet');
        }

        const apiKey = this.getApiKey();
        const sheetTitle = `${CONFIG.ACCOUNT_SHEET_PREFIX}${accountName}`;

        // Create the sheet
        const response = await fetch(
            `${this.baseUrl}/${this.sheetId}:batchUpdate?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetTitle
                            }
                        }
                    }]
                })
            }
        );

        if (!response.ok) {
            throw new Error('Failed to create sheet');
        }

        // Add headers
        const headers = [
            CONFIG.SHEET_COLUMNS.DATE,
            CONFIG.SHEET_COLUMNS.DESCRIPTION,
            CONFIG.SHEET_COLUMNS.CREDIT,
            CONFIG.SHEET_COLUMNS.DEBIT
        ];

        await fetch(
            `${this.baseUrl}/${this.sheetId}/values/${encodeURIComponent(sheetTitle)}!A1:D1?valueInputOption=USER_ENTERED&key=${apiKey}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: [headers]
                })
            }
        );

        return sheetTitle;
    }
}
