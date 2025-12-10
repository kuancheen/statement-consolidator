// Google Sheets API Integration (OAuth2)
class SheetsAPI {
    constructor() {
        this.sheetId = null;
        this.baseUrl = CONFIG.SHEETS_API_BASE;
        this.tokenClient = null;
        this.accessToken = null;
        this.apiKey = null; // Still used for OCR if needed, but separate
    }

    // Set API Key (for legacy or hybrid use if needed, mainly for OCR now)
    setApiKey(key) {
        this.apiKey = key;
    }

    // Initialize Token Client
    initTokenClient(clientId) {
        if (!clientId) return;

        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: CONFIG.SCOPES,
            callback: (tokenResponse) => {
                if (tokenResponse.error) {
                    throw tokenResponse;
                }
                this.accessToken = tokenResponse.access_token;
                // Dispatch event or callback to update UI
                document.dispatchEvent(new CustomEvent('auth-success'));
            },
        });
    }

    // Request Access Token
    requestAccessToken() {
        if (!this.tokenClient) {
            throw new Error('OAuth Client not initialized. Please save Client ID first.');
        }
        // Skip if valid? No, let's just request, GIS handles expiration mostly or we can check expiry.
        // Simplest is to request if missing.
        this.tokenClient.requestAccessToken();
    }

    // Check if authorized
    isAuthorized() {
        return !!this.accessToken;
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

    // Connect to a Google Sheet (Read Metadata)
    async connect(sheetUrl) {
        try {
            this.sheetId = this.extractSheetId(sheetUrl);

            // Ensure we have access token
            if (!this.accessToken) {
                throw new Error('Authentication required. Please sign in with Google.');
            }

            // Fetch sheet metadata
            const response = await fetch(
                `${this.baseUrl}/${this.sheetId}?fields=sheets.properties`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Token might be expired
                    throw new Error('Auth Error');
                }
                throw new Error(`Failed to connect: ${response.statusText}`);
            }

            const data = await response.json();

            // Save to local storage
            localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_SHEET_ID, this.sheetId);

            return data.sheets || [];
        } catch (error) {
            console.error('Connection error:', error);
            if (error.message === 'Auth Error') {
                // Trigger re-auth flow?
                throw new Error('Access expired or denied. Please Sign In again.');
            }
            throw new Error('Failed to connect to Google Sheet. Ensure you have access.');
        }
    }

    // Get all sheets with @ prefix
    async getAccountSheets() {
        if (!this.sheetId) throw new Error('Not connected to a sheet');
        if (!this.accessToken) throw new Error('Auth required');

        const response = await fetch(
            `${this.baseUrl}/${this.sheetId}?fields=sheets.properties`,
            {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            }
        );

        if (!response.ok) throw new Error('Failed to fetch sheets');

        const data = await response.json();
        const allSheets = data.sheets || [];

        // Filter sheets with @ prefix
        return allSheets
            .map(sheet => sheet.properties)
            .filter(props => props.title.startsWith(CONFIG.ACCOUNT_SHEET_PREFIX))
            .map(props => ({
                id: props.sheetId,
                title: props.title,
                displayName: props.title.substring(1)
            }));
    }

    // Read existing transactions from a sheet
    async readTransactions(sheetName) {
        if (!this.sheetId) throw new Error('Not connected to a sheet');
        if (!this.accessToken) throw new Error('Auth required');

        const range = `${sheetName}!A:D`;
        const response = await fetch(
            `${this.baseUrl}/${this.sheetId}/values/${encodeURIComponent(range)}`,
            {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            }
        );

        if (!response.ok) throw new Error('Failed to read transactions');

        const data = await response.json();
        const rows = data.values || [];

        if (rows.length === 0) return [];

        // Skip header row
        const transactions = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length >= 2) {
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
        if (!this.sheetId) throw new Error('Not connected to a sheet');
        if (!this.accessToken) throw new Error('Auth required');

        const rows = transactions.map(t => {
            // Generate Unique Key: Date|Desc|Credit|Debit
            // Normalize inputs to ensure consistency
            const cleanDate = (t.date || '').trim();
            const cleanDesc = (t.description || '').trim();
            const cleanCredit = (t.credit || '').trim();
            const cleanDebit = (t.debit || '').trim();

            const uniqueKey = `${cleanDate}|${cleanDesc}|${cleanCredit}|${cleanDebit}`;

            return [
                t.date,
                t.description,
                t.credit || '',
                t.debit || '',
                'New',      // Column E: Status
                uniqueKey   // Column F: Unique ID (Hidden Helper)
            ];
        });

        const range = `${sheetName}!A:F`;
        const response = await fetch(
            `${this.baseUrl}/${this.sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({ values: rows })
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
        if (!this.sheetId) throw new Error('Not connected to a sheet');
        if (!this.accessToken) throw new Error('Auth required');

        const sheetTitle = `${CONFIG.ACCOUNT_SHEET_PREFIX}${accountName}`;

        // Create the sheet
        const response = await fetch(
            `${this.baseUrl}/${this.sheetId}:batchUpdate`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({
                    requests: [{
                        addSheet: { properties: { title: sheetTitle } }
                    }]
                })
            }
        );

        if (!response.ok) throw new Error('Failed to create sheet');

        // Add headers
        const headers = [
            CONFIG.SHEET_COLUMNS.DATE,
            CONFIG.SHEET_COLUMNS.DESCRIPTION,
            CONFIG.SHEET_COLUMNS.CREDIT,
            CONFIG.SHEET_COLUMNS.DEBIT,
            'Status',
            'Unique Key'
        ];

        await fetch(
            `${this.baseUrl}/${this.sheetId}/values/${encodeURIComponent(sheetTitle)}!A1:F1?valueInputOption=USER_ENTERED`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({ values: [headers] })
            }
        );

        return sheetTitle;
    }
}
