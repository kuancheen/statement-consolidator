// Configuration for Statement Consolidator
// Version: 0.1.0 (Beta)
const CONFIG = {
    // App version
    VERSION: '0.3.3',
    VERSION_NAME: 'Beta (OAuth)',

    // Google Sheets API
    SHEETS_API_BASE: 'https://sheets.googleapis.com/v4/spreadsheets',

    // OAuth Scopes
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',

    // Local Storage Keys
    STORAGE_KEYS: {
        API_KEY: 'statement_consolidator_api_key',
        CLIENT_ID: 'sc_client_id',
        LAST_SHEET_ID: 'statement_consolidator_last_sheet',
        ACCOUNT_MAPPINGS: 'statement_consolidator_accounts'
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// Re-add missing keys if anything went wrong with replace (safety check)
// Actually, I'll rely on the replace tool.
