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
    // UPDATED SCHEMA (v0.4.0): A=Key, B=Date, C=Desc, D=Credit, E=Debit, F=Status (Hidden/Unused), G=Batch ID
    // STRATEGY: Two-Step Append. Append B:G (Data), then write A (Key) explicitly.
    // This avoids issues where hidden Column A causes 'append' to shift data to B.
    async appendTransactions(sheetName, transactions, sheetIdForSetup = null, batchId = null) {
        if (!this.sheetId) throw new Error('Not connected to a sheet');
        if (!this.accessToken) throw new Error('Auth required');

        // Check & Setup Sheet First
        try {
            if (sheetIdForSetup) {
                await this.ensureSheetSetup(sheetIdForSetup, sheetName);
            }
        } catch (e) {
            console.warn('Auto-setup failed, continuing append:', e);
        }

        // Prepare Data
        const keysToUpdate = [];
        const rowsToAppend = transactions.map(t => {
            // Generate Unique Key
            const cleanDate = (t.date || '').trim();
            const cleanDesc = (t.description || '').trim();
            const cleanCredit = (t.credit || '').trim();
            const cleanDebit = (t.debit || '').trim();
            const uniqueKey = `${cleanDate}|${cleanDesc}|${cleanCredit}|${cleanDebit}`;

            keysToUpdate.push([uniqueKey]); // For Column A

            // Data for Columns B-F
            return [
                t.date,     // B: Date
                t.description, // C: Desc
                t.credit || '', // D: Credit
                t.debit || '',  // E: Debit
                'New',          // F: Status (Still kept for schema alignment, but hidden in UI)
                batchId || ''   // G: Batch ID
            ];
        });

        // Step 1: Append Data to B:G
        const range = `${sheetName}!B:G`;
        const appendRes = await fetch(
            `${this.baseUrl}/${this.sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({ values: rowsToAppend })
            }
        );

        if (!appendRes.ok) {
            const error = await appendRes.text();
            throw new Error(`Failed to append transactions: ${error}`);
        }

        const appendData = await appendRes.json();
        const updatedRange = appendData.updates.updatedRange; // e.g., "Sheet1!B2:F4"

        // Step 2: Write Keys to Column A
        // Parse the range to get start row
        // updatedRange format: SheetName!StartColStartRow:EndColEndRow
        const match = updatedRange.match(/!([A-Z]+)(\d+):([A-Z]+)(\d+)/);
        if (match) {
            const startRow = parseInt(match[2]);
            const endRow = parseInt(match[4]);

            // Safety check
            if ((endRow - startRow + 1) === keysToUpdate.length) {
                const keyRange = `${sheetName}!A${startRow}:A${endRow}`;
                await fetch(
                    `${this.baseUrl}/${this.sheetId}/values/${encodeURIComponent(keyRange)}?valueInputOption=USER_ENTERED`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.accessToken}`
                        },
                        body: JSON.stringify({ values: keysToUpdate })
                    }
                );
            } else {
                console.warn('Row count mismatch in append vs key update', updatedRange, keysToUpdate.length);
            }
        }

        return appendData;
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
        // Step 1: Fetch Sheet Metadata (Headers + Properties)
        let sheetMeta;
        let headersValues = [];

        try {
            const metaRes = await fetch(
                `${this.baseUrl}/${this.sheetId}?fields=sheets(properties,conditionalFormats,basicFilter)`,
                { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
            );
            const metaData = await metaRes.json();
            const sheetObj = metaData.sheets.find(s => s.properties.sheetId === sheetId);
            sheetMeta = sheetObj || {};

            // Get Headers
            const valRes = await fetch(
                `${this.baseUrl}/${this.sheetId}/values/${encodeURIComponent(sheetTitle)}!A1:F1`,
                { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
            );
            const valData = await valRes.json();
            headersValues = (valData.values && valData.values[0]) ? valData.values[0] : [];

        } catch (e) {
            console.warn('Setup fetch failed', e);
            return;
        }

        const requests = [];

        // 1. Headers & Formatting
        if (headersValues[0] !== 'Unique Key') {
            const headers = [
                'Unique Key', 'Date', 'Description', 'Credit', 'Debit', 'Status', 'Batch ID'
            ];
            await fetch(
                `${this.baseUrl}/${this.sheetId}/values/${encodeURIComponent(sheetTitle)}!A1:G1?valueInputOption=USER_ENTERED`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.accessToken}` },
                    body: JSON.stringify({ values: [headers] })
                }
            );
        }

        // 2. Bold Header
        requests.push({
            repeatCell: {
                range: { sheetId: sheetId, startRowIndex: 0, endRowIndex: 1 },
                cell: { userEnteredFormat: { textFormat: { bold: true } } },
                fields: "userEnteredFormat.textFormat.bold"
            }
        });

        // 3. Freeze Row 1
        requests.push({
            updateSheetProperties: {
                properties: {
                    sheetId: sheetId,
                    gridProperties: { frozenRowCount: 1 }
                },
                fields: 'gridProperties.frozenRowCount'
            }
        });

        // 4. Hide Col A
        requests.push({
            updateDimensionProperties: {
                range: { sheetId: sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
                properties: { hiddenByUser: true },
                fields: 'hiddenByUser'
            }
        });

        // 5. Data Validation (Status)
        requests.push({
            setDataValidation: {
                range: { sheetId: sheetId, startRowIndex: 1, startColumnIndex: 5, endColumnIndex: 6 },
                rule: {
                    condition: { type: 'ONE_OF_LIST', values: [{ userEnteredValue: 'New' }, { userEnteredValue: 'Duplicate' }, { userEnteredValue: 'To be deleted' }] },
                    showCustomUi: true,
                    strict: true
                }
            }
        });

        // 6. Basic Filter (Enable on A1:F)
        // Only set if not already set or incorrect range? 
        // We'll just set it to ensure it's on.
        requests.push({
            setBasicFilter: {
                filter: {
                    range: { sheetId: sheetId, startRowIndex: 0, startColumnIndex: 0, endColumnIndex: 7 }
                }
            }
        });

        // 7. Cleanup: Delete Extra Columns (G -> Z)
        // Check gridProperties
        const gridProps = sheetMeta.properties?.gridProperties || {};
        const colCount = gridProps.columnCount || 26;
        if (colCount > 6) {
            requests.push({
                deleteDimension: {
                    range: {
                        sheetId: sheetId,
                        dimension: 'COLUMNS',
                        startIndex: 7,
                        endIndex: colCount
                    }
                }
            });
        }

        // 8. Cleanup: Trim Empty Rows at Bottom
        // We need to know where the last data is. 
        // We can't do this safely in minimal API calls without knowing exact data range.
        // User request "remove empty rows". 
        // Safer approach: We will NOT delete rows blindly unless we are sure.
        // Skipping row deletion for safety in this iteration to prevent data loss if API behaves unexpectedly.
        // Users often have data scattered. We can revisit if 'gridProperties.rowCount' is very high.

        // 9. Conditional Formatting (Idempotent - Fixed Formula)
        // Range: A2:F (Start index 1)
        // Formula: =COUNTIF($A:$A, $A2)>1
        const correctFormula = '=COUNTIF($A:$A, $A2)>1';

        // Remove OLD/Wrong rules first?
        // Finding rules that match our old pattern and deleting them is complex via batchUpdate (need exact index).
        // Instead, we will clear ALL conditional formats on the sheet and re-apply ours? 
        // No, that destroys user customizations.
        // We will just ADD ours if missing. User manually cleans up old ones if needed.
        // Improve: Check for *any* duplicate rule we created previously.

        const existingRules = sheetMeta.conditionalFormats || [];
        const hasCorrectRule = existingRules.some(rule =>
            rule.booleanRule &&
            rule.booleanRule.condition.values &&
            rule.booleanRule.condition.values[0].userEnteredValue === correctFormula
        );

        if (!hasCorrectRule) {
            requests.push({
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{ sheetId: sheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 7 }], // A2:G
                        booleanRule: {
                            condition: {
                                type: 'CUSTOM_FORMULA',
                                values: [{ userEnteredValue: correctFormula }]
                            },
                            format: {
                                backgroundColor: { red: 0.98, green: 0.91, blue: 0.9 },
                                textFormat: { foregroundColor: { red: 0.77, green: 0.13, blue: 0.12 } }
                            }
                        }
                    },
                    index: 0
                }
            });
        }

        if (requests.length > 0) {
            await fetch(
                `${this.baseUrl}/${this.sheetId}:batchUpdate`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.accessToken}` },
                    body: JSON.stringify({ requests })
                }
            );
        }
    }
}
