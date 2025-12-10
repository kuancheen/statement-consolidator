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
    // UPDATED SCHEMA: A=Key, B=Date, C=Desc, D=Credit, E=Debit, F=Status
    async readTransactions(sheetName) {
        if (!this.sheetId) throw new Error('Not connected to a sheet');
        if (!this.accessToken) throw new Error('Auth required');

        // We read B:E effectively for the app's internal logic, 
        // but let's read everything just in case.
        const range = `${sheetName}!A:F`;
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
            // Row indices: 0=Key, 1=Date, 2=Desc, 3=Credit, 4=Debit, 5=Status
            if (row.length >= 3) { // Ensure at least Date/Desc exist
                transactions.push({
                    date: row[1] || '',
                    description: row[2] || '',
                    credit: row[3] || '',
                    debit: row[4] || ''
                });
            }
        }

        return transactions;
    }

    // Append new transactions to a sheet
    // UPDATED SCHEMA: A=Key, B=Date, C=Desc, D=Credit, E=Debit, F=Status
    async appendTransactions(sheetName, transactions, sheetIdForSetup = null) {
        if (!this.sheetId) throw new Error('Not connected to a sheet');
        if (!this.accessToken) throw new Error('Auth required');

        // Check & Setup Sheet First (Auto-healing)
        // We need the numeric sheetId, not just the name. 
        // app.js should ideally pass the full sheet object.
        // If not passed, we might skip or do a lookup.
        try {
            if (sheetIdForSetup) {
                await this.ensureSheetSetup(sheetIdForSetup, sheetName);
            }
        } catch (e) {
            console.warn('Auto-setup failed, continuing append:', e);
        }

        const rows = transactions.map(t => {
            // Generate Unique Key: Date|Desc|Credit|Debit
            const cleanDate = (t.date || '').trim();
            const cleanDesc = (t.description || '').trim();
            const cleanCredit = (t.credit || '').trim();
            const cleanDebit = (t.debit || '').trim();

            const uniqueKey = `${cleanDate}|${cleanDesc}|${cleanCredit}|${cleanDebit}`;

            return [
                uniqueKey,  // A: Unique Key (Hidden)
                t.date,     // B: Date
                t.description, // C: Desc
                t.credit || '', // D: Credit
                t.debit || '',  // E: Debit
                'New'       // F: Status
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

        // 1. Create the sheet
        const createRes = await fetch(
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

        if (!createRes.ok) throw new Error('Failed to create sheet');
        const createData = await createRes.json();
        const newSheetId = createData.replies[0].addSheet.properties.sheetId;

        // 2. Run Setup (Headers + Formatting + Validation + Hide Column)
        await this.ensureSheetSetup(newSheetId, sheetTitle);

        return sheetTitle;
    }

    // Ensure Sheet Setup (Headers, Formatting, Validation)
    async ensureSheetSetup(sheetId, sheetTitle) {
        // Step 1: Check if headers exist (Optimization: Read A1)
        // Actually, let's just write headers if missing. simpler to just always check or skip.
        // For efficiency, we assume if we are creating, we write.
        // But for appending, we might check. Let's do a quick read of A1:F1.

        const checkParams = {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        };

        let headersMissing = false;
        try {
            // We check F1 (Status) to see if it Matches our schema
            const headerRes = await fetch(
                `${this.baseUrl}/${this.sheetId}/values/${encodeURIComponent(sheetTitle)}!A1:F1`,
                checkParams
            );
            const headerData = await headerRes.json();

            // If empty or A1 is not 'Unique Key' (Checking new schema)
            if (!headerData.values || !headerData.values[0] || headerData.values[0][0] !== 'Unique Key') {
                headersMissing = true;
            }
        } catch (e) {
            headersMissing = true;
        }

        const requests = [];

        // 1. Add Headers if missing
        if (headersMissing) {
            // Write Headers via value update (not batchUpdate)
            const headers = [
                'Unique Key', // A
                CONFIG.SHEET_COLUMNS.DATE, // B
                CONFIG.SHEET_COLUMNS.DESCRIPTION, // C
                CONFIG.SHEET_COLUMNS.CREDIT, // D
                CONFIG.SHEET_COLUMNS.DEBIT, // E
                'Status' // F
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

            // Bold Headers
            requests.push({
                repeatCell: {
                    range: { sheetId: sheetId, startRowIndex: 0, endRowIndex: 1 },
                    cell: { userEnteredFormat: { textFormat: { bold: true } } },
                    fields: "userEnteredFormat.textFormat.bold"
                }
            });
        }

        // 2. Hide Column A (Unique Key)
        requests.push({
            updateDimensionProperties: {
                range: { sheetId: sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
                properties: { hiddenByUser: true },
                fields: 'hiddenByUser'
            }
        });

        // 3. Data Validation for Column F (Status) - Dropdown
        requests.push({
            setDataValidation: {
                range: { sheetId: sheetId, startRowIndex: 1, startColumnIndex: 5, endColumnIndex: 6 }, // F2:F
                rule: {
                    condition: {
                        type: 'ONE_OF_LIST',
                        values: [
                            { userEnteredValue: 'New' },
                            { userEnteredValue: 'Duplicate' },
                            { userEnteredValue: 'To be deleted' }
                        ]
                    },
                    showCustomUi: true,
                    strict: true
                }
            }
        });

        // 4. Conditional Formatting for Duplicates (Check Column A)
        // Rule: =COUNTIF($A:$A, $A1)>1  applied to A:F
        // Note: Apps Script/API rules can be tricky. We want to clear old ones to avoid dupes?
        // BatchUpdate appends rules by default.
        // We will add a rule that highlights the whole row if A is duplicate.
        // Formula: =COUNTIF($A:$A, $A1)>1

        requests.push({
            addConditionalFormatRule: {
                rule: {
                    ranges: [{ sheetId: sheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 6 }], // A2:F
                    booleanRule: {
                        condition: {
                            type: 'CUSTOM_FORMULA',
                            values: [{ userEnteredValue: '=COUNTIF($A:$A, $A1)>1' }]
                        },
                        format: {
                            backgroundColor: { red: 0.98, green: 0.91, blue: 0.9 }, // #FCE8E6 (Light Red)
                            textFormat: { foregroundColor: { red: 0.77, green: 0.13, blue: 0.12 } } // #C5221F (Dark Red)
                        }
                    }
                },
                index: 0
            }
        });

        // Execute Batch Update
        if (requests.length > 0) {
            await fetch(
                `${this.baseUrl}/${this.sheetId}:batchUpdate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.accessToken}`
                    },
                    body: JSON.stringify({ requests })
                }
            );
        }
    }
}
