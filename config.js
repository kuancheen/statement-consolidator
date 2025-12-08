// Configuration for Statement Consolidator
// Version: 0.1.0 (Beta)
const CONFIG = {
    // App version
    VERSION: '0.3.0',
    VERSION_NAME: 'Beta (OAuth)',

    // Google Sheets API
    SHEETS_API_BASE: 'https://sheets.googleapis.com/v4/spreadsheets',

    // OAuth Scopes
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',

    // Local Storage Keys
    STORAGE_KEYS: {
        API_KEY: 'sc_api_key',
        CLIENT_ID: 'sc_client_id',
        LAST_SHEET_ID: 'sc_last_sheet_id'
    },
    // Gemini AI API
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',
    GEMINI_MODEL: 'gemini-2.0-flash',

    // Account sheet identifier
    ACCOUNT_SHEET_PREFIX: '@',

    // Sheet columns
    SHEET_COLUMNS: {
        DATE: 'Date',
        DESCRIPTION: 'Description',
        CREDIT: 'Credit',
        DEBIT: 'Debit'
    },

    // Deduplication settings
    DEDUP: {
        // Fields to use for duplicate detection
        MATCH_FIELDS: ['date', 'amount', 'description'],
        // Fuzzy match threshold (0-1, higher = more strict)
        FUZZY_THRESHOLD: 0.85
    },

    // Account type patterns for smart detection
    ACCOUNT_PATTERNS: {
        bank: ['bank', 'savings', 'checking', 'current account'],
        credit: ['credit card', 'visa', 'mastercard', 'amex'],
        ewallet: ['grab', 'touch n go', 'tng', 'boost', 'shopeepay', 'ewallet', 'e-wallet']
    },

    // File upload settings
    UPLOAD: {
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        ACCEPTED_TYPES: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    },

    // Local storage keys
    STORAGE_KEYS: {
        API_KEY: 'statement_consolidator_api_key', // Single key for both Gemini and Sheets
        LAST_SHEET_ID: 'statement_consolidator_last_sheet',
        ACCOUNT_MAPPINGS: 'statement_consolidator_accounts'
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
