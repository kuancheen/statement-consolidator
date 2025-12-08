// Main application controller
class StatementConsolidatorApp {
    constructor() {
        this.sheetsAPI = new SheetsAPI();
        this.ocrService = new OCRService();
        this.dedupEngine = new DeduplicationEngine();

        this.currentFile = null;
        this.extractedData = null;
        this.selectedSheet = null;
        this.accountSheets = [];

        this.init();
    }

    // Initialize the app
    init() {
        this.setupEventListeners();
        this.loadSavedApiKey();
        this.loadLastSheet();
        this.displayVersion();
    }

    // Setup event listeners
    setupEventListeners() {
        // API Key
        document.getElementById('apiKeyInput').addEventListener('change', (e) => {
            this.saveApiKey(e.target.value);
        });

        // Verify API Key button
        document.getElementById('verifyApiKeyBtn').addEventListener('click', () => {
            this.verifyApiKey();
        });

        // Sheet connection
        document.getElementById('connectSheetBtn').addEventListener('click', () => {
            this.connectToSheet();
        });

        // File upload
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) this.handleFileUpload(file);
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFileUpload(file);
        });

        // Account selection
        document.getElementById('confirmAccountBtn').addEventListener('click', () => {
            this.confirmAccount();
        });

        document.getElementById('createNewAccountBtn').addEventListener('click', () => {
            this.showCreateAccountDialog();
        });

        // Import transactions
        document.getElementById('importBtn').addEventListener('click', () => {
            this.importTransactions();
        });

        // Cancel buttons
        document.getElementById('cancelAccountBtn').addEventListener('click', () => {
            this.hideAccountSelector();
        });
    }

    // Load saved API key
    loadSavedApiKey() {
        const savedKey = this.ocrService.getApiKey();
        if (savedKey) {
            document.getElementById('apiKeyInput').value = savedKey;
            this.showStatus('API key loaded from storage', 'success');
        }
    }

    // Save API key
    saveApiKey(key, showMessage = true) {
        if (!key || key.trim() === '') {
            this.showFieldError('apiKeyInput', 'Please enter an API key');
            return;
        }

        this.ocrService.setApiKey(key);
        this.sheetsAPI.setApiKey(key);

        if (showMessage) {
            this.showFieldStatus('apiKeyInput', 'API key saved locally ✓', 'success');
        }
    }

    // Verify API key
    async verifyApiKey() {
        const key = document.getElementById('apiKeyInput').value.trim();

        if (!key) {
            this.showFieldError('apiKeyInput', 'Please enter an API key first');
            return;
        }

        const verifyBtn = document.getElementById('verifyApiKeyBtn');
        const originalText = verifyBtn.textContent;
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Testing...';

        try {
            // Test Gemini AI API
            const geminiResponse = await fetch(
                `${CONFIG.GEMINI_API_BASE}/${CONFIG.GEMINI_MODEL}:generateContent?key=${key}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'Test' }] }]
                    })
                }
            );

            const geminiData = await geminiResponse.json();

            if (!geminiResponse.ok) {
                if (geminiData.error?.code === 429) {
                    throw new Error('Gemini API error: Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.');
                }
                throw new Error(geminiData.error?.message || 'Gemini API test failed');
            }

            // Test Google Sheets API
            const sheetsResponse = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms?fields=sheets.properties&key=${key}`,
                { method: 'GET' }
            );

            const sheetsData = await sheetsResponse.json();

            if (!sheetsResponse.ok) {
                if (sheetsData.error?.code === 403 && sheetsData.error?.message?.includes('has not been used')) {
                    throw new Error(
                        'Google Sheets API is not enabled. Enable it at: ' +
                        'https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=' +
                        sheetsData.error.details?.[0]?.metadata?.consumer?.replace('projects/', '')
                    );
                }
                throw new Error(sheetsData.error?.message || 'Google Sheets API test failed');
            }

            // Both tests passed
            this.showFieldStatus('apiKeyInput', '✓ API key verified!', 'success');
            // Check if we have a key already saved to avoid redundant saves if unchanged, or just save
            this.saveApiKey(key, false);

        } catch (error) {
            this.showFieldError('apiKeyInput', error.message);
        } finally {
            verifyBtn.disabled = false;
            verifyBtn.textContent = originalText;
        }
    }

    // Load last used sheet
    async loadLastSheet() {
        const lastSheetId = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_SHEET_ID);
        if (lastSheetId) {
            document.getElementById('sheetUrlInput').value = lastSheetId;
        }
    }

    // Display app version
    displayVersion() {
        const versionEl = document.getElementById('appVersion');
        if (versionEl) {
            versionEl.textContent = `v${CONFIG.VERSION} ${CONFIG.VERSION_NAME}`;
        }
    }

    // Connect to Google Sheet
    async connectToSheet() {
        const sheetUrl = document.getElementById('sheetUrlInput').value.trim();

        if (!sheetUrl) {
            this.showFieldError('sheetUrlInput', 'Please enter a Google Sheet URL');
            return;
        }

        try {
            this.showFieldStatus('sheetUrlInput', 'Connecting to sheet...', 'info');

            await this.sheetsAPI.connect(sheetUrl);
            this.accountSheets = await this.sheetsAPI.getAccountSheets();

            if (this.accountSheets.length === 0) {
                this.showFieldStatus('sheetUrlInput', 'No account sheets found. Create sheets with @ prefix (e.g., @DBS Savings)', 'warning');
            } else {
                this.showFieldStatus('sheetUrlInput', `Connected! Found ${this.accountSheets.length} account sheet(s)`, 'success');
                document.getElementById('uploadSection').classList.remove('hidden');
            }

            this.updateAccountSheetsList();

        } catch (error) {
            this.showFieldError('sheetUrlInput', error.message);
        }
    }

    // Update account sheets list in selector
    updateAccountSheetsList() {
        const select = document.getElementById('accountSheetSelect');
        select.innerHTML = '<option value="">Select an account...</option>';

        this.accountSheets.forEach(sheet => {
            const option = document.createElement('option');
            option.value = sheet.title;
            option.textContent = sheet.displayName;
            select.appendChild(option);
        });
    }

    // Handle file upload
    async handleFileUpload(file) {
        // Validate file
        if (!CONFIG.UPLOAD.ACCEPTED_TYPES.includes(file.type)) {
            this.showFieldError('dropZone', 'Invalid file type. Please upload PDF or image files.');
            return;
        }

        if (file.size > CONFIG.UPLOAD.MAX_FILE_SIZE) {
            this.showFieldError('dropZone', 'File too large. Maximum size is 10MB.');
            return;
        }

        if (!this.ocrService.getApiKey()) {
            this.showFieldError('dropZone', 'Please enter your Gemini API key first');
            return;
        }

        this.currentFile = file;

        // Show file info
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('fileInfo').classList.remove('hidden');

        // Process the file
        await this.processFile(file);
    }

    // Process uploaded file
    async processFile(file) {
        try {
            this.showFieldStatus('dropZone', 'Extracting transactions with AI...', 'info');
            document.getElementById('processingIndicator').classList.remove('hidden');

            // Extract transactions using OCR
            this.extractedData = await this.ocrService.extractTransactions(file);

            document.getElementById('processingIndicator').classList.add('hidden');

            if (!this.extractedData.transactions || this.extractedData.transactions.length === 0) {
                this.showFieldStatus('dropZone', 'No transactions found in the document', 'warning');
                return;
            }

            this.showFieldStatus('dropZone', `Extracted ${this.extractedData.transactions.length} transaction(s)`, 'success');

            // Suggest account sheet
            const suggestedSheet = this.ocrService.suggestAccountSheet(
                this.extractedData,
                this.accountSheets
            );

            this.showAccountSelector(suggestedSheet);

        } catch (error) {
            document.getElementById('processingIndicator').classList.add('hidden');
            let errorMessage = error.message;

            if (errorMessage.includes('429') || errorMessage.includes('Resource exhausted')) {
                errorMessage = 'Gemini API error: Resource exhausted. Please try again later. Please refer to https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429 for more details.';
            }

            this.showFieldError('dropZone', errorMessage);
            console.error(error);
        }
    }

    // Show account selector
    showAccountSelector(suggestedSheet) {
        const selector = document.getElementById('accountSelector');
        const select = document.getElementById('accountSheetSelect');
        const suggestion = document.getElementById('suggestedAccount');

        if (suggestedSheet) {
            select.value = suggestedSheet.title;
            suggestion.textContent = `Suggested: ${suggestedSheet.displayName}`;
            suggestion.classList.remove('hidden');
        } else {
            suggestion.classList.add('hidden');
        }

        selector.classList.remove('hidden');
    }

    // Hide account selector
    hideAccountSelector() {
        document.getElementById('accountSelector').classList.add('hidden');
    }

    // Confirm account selection
    async confirmAccount() {
        const select = document.getElementById('accountSheetSelect');
        const selectedValue = select.value;

        if (!selectedValue) {
            this.showStatus('Please select an account', 'error');
            return;
        }

        this.selectedSheet = this.accountSheets.find(s => s.title === selectedValue);
        this.hideAccountSelector();

        // Load existing transactions for deduplication
        await this.loadExistingTransactions();

        // Show preview
        this.showTransactionPreview();
    }

    // Show create account dialog
    async showCreateAccountDialog() {
        const accountName = prompt('Enter new account name (without @ prefix):');

        if (!accountName) return;

        try {
            this.showStatus('Creating new account sheet...', 'info');

            const sheetTitle = await this.sheetsAPI.createAccountSheet(accountName);

            // Refresh account sheets list
            this.accountSheets = await this.sheetsAPI.getAccountSheets();
            this.updateAccountSheetsList();

            // Select the new sheet
            document.getElementById('accountSheetSelect').value = sheetTitle;

            this.showStatus(`Created account sheet: ${accountName}`, 'success');

        } catch (error) {
            this.showStatus(`Error creating sheet: ${error.message}`, 'error');
        }
    }

    // Load existing transactions for deduplication
    async loadExistingTransactions() {
        try {
            this.showStatus('Loading existing transactions...', 'info');

            const existing = await this.sheetsAPI.readTransactions(this.selectedSheet.title);
            this.dedupEngine.setExistingTransactions(existing);

            this.showStatus(`Loaded ${existing.length} existing transaction(s)`, 'success');

        } catch (error) {
            this.showStatus(`Warning: Could not load existing transactions: ${error.message}`, 'warning');
        }
    }

    // Show transaction preview
    showTransactionPreview() {
        const previewSection = document.getElementById('previewSection');
        const tbody = document.getElementById('transactionsTableBody');
        const stats = document.getElementById('previewStats');

        // Filter duplicates
        const filtered = this.dedupEngine.filterDuplicates(this.extractedData.transactions);

        // Update stats
        stats.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Total:</span>
        <span class="stat-value">${this.extractedData.transactions.length}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">New:</span>
        <span class="stat-value success">${filtered.unique.length}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Duplicates:</span>
        <span class="stat-value warning">${filtered.duplicates.length}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Account:</span>
        <span class="stat-value">${this.selectedSheet.displayName}</span>
      </div>
    `;

        // Clear table
        tbody.innerHTML = '';

        // Add unique transactions
        filtered.unique.forEach(transaction => {
            const row = this.createTransactionRow(transaction, false);
            tbody.appendChild(row);
        });

        // Add duplicate transactions (grayed out)
        filtered.duplicates.forEach(({ transaction }) => {
            const row = this.createTransactionRow(transaction, true);
            tbody.appendChild(row);
        });

        previewSection.classList.remove('hidden');
    }

    // Create transaction table row
    createTransactionRow(transaction, isDuplicate) {
        const row = document.createElement('tr');
        if (isDuplicate) {
            row.classList.add('duplicate');
        }

        row.innerHTML = `
      <td>${transaction.date}</td>
      <td>${transaction.description}</td>
      <td class="amount credit">${transaction.credit || '-'}</td>
      <td class="amount debit">${transaction.debit || '-'}</td>
      <td>${isDuplicate ? '<span class="badge duplicate">Duplicate</span>' : '<span class="badge new">New</span>'}</td>
    `;

        return row;
    }

    // Import transactions to Google Sheets
    async importTransactions() {
        try {
            const filtered = this.dedupEngine.filterDuplicates(this.extractedData.transactions);

            if (filtered.unique.length === 0) {
                this.showStatus('No new transactions to import', 'warning');
                return;
            }

            this.showStatus(`Importing ${filtered.unique.length} transaction(s)...`, 'info');

            try {
                await this.sheetsAPI.appendTransactions(this.selectedSheet.title, filtered.unique);
                this.showStatus(`Successfully imported ${filtered.unique.length} transaction(s)!`, 'success');

                // Reset for next upload
                setTimeout(() => {
                    this.resetUpload();
                }, 2000);
            } catch (error) {
                // If write fails due to OAuth requirement, offer CSV download
                if (error.message.includes('OAuth') || error.message.includes('UNAUTHENTICATED') || error.message.includes('API keys are not supported')) {
                    this.showStatus('Direct import requires OAuth. Downloading as CSV instead...', 'warning');
                    this.downloadAsCSV(filtered.unique);
                } else {
                    throw error;
                }
            }

        } catch (error) {
            this.showStatus(`Import failed: ${error.message}`, 'error');
            console.error(error);
        }
    }

    // Download transactions as CSV
    downloadAsCSV(transactions) {
        // Create CSV content
        const headers = ['Date', 'Description', 'Credit', 'Debit'];
        const csvRows = [headers.join(',')];

        transactions.forEach(t => {
            const row = [
                t.date,
                `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
                t.credit || '',
                t.debit || ''
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const filename = `${this.selectedSheet.displayName}_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showStatus(`Downloaded ${transactions.length} transactions as ${filename}. You can now import this CSV to your Google Sheet.`, 'success');

        // Show instructions
        setTimeout(() => {
            alert(
                `CSV Downloaded!\n\n` +
                `File: ${filename}\n\n` +
                `To import to Google Sheets:\n` +
                `1. Open your Google Sheet: ${this.selectedSheet.title}\n` +
                `2. Click File → Import\n` +
                `3. Upload the CSV file\n` +
                `4. Choose "Append to current sheet"\n` +
                `5. Click "Import data"`
            );
        }, 500);
    }

    // Reset upload state
    resetUpload() {
        this.currentFile = null;
        this.extractedData = null;
        this.selectedSheet = null;

        document.getElementById('fileInput').value = '';
        document.getElementById('fileInfo').classList.add('hidden');
        document.getElementById('accountSelector').classList.add('hidden');
        document.getElementById('previewSection').classList.add('hidden');

        this.showStatus('Ready for next upload', 'info');
    }

    // Show status message
    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;
        statusEl.classList.remove('hidden');

        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                statusEl.classList.add('hidden');
            }, 5000);
        }
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // Show field-specific error
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorId = `${fieldId}Error`;

        // Remove existing error
        const existingError = document.getElementById(errorId);
        if (existingError) {
            existingError.remove();
        }

        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.id = errorId;
        errorDiv.className = 'field-error';

        // Create message text
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        errorDiv.appendChild(messageSpan);

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'field-message-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => {
            errorDiv.remove();
            field.classList.remove('error');
        };
        errorDiv.appendChild(closeBtn);

        // Insert after field
        field.parentNode.insertBefore(errorDiv, field.nextSibling);

        // Add error styling to field
        field.classList.add('error');
    }

    // Show field-specific success message
    showFieldStatus(fieldId, message, type = 'success') {
        const field = document.getElementById(fieldId);
        const statusId = `${fieldId}Status`;

        // Remove existing status
        const existingStatus = document.getElementById(statusId);
        if (existingStatus) {
            existingStatus.remove();
        }

        // Create status message
        const statusDiv = document.createElement('div');
        statusDiv.id = statusId;
        statusDiv.className = `field-status ${type}`;

        // Create message text
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        statusDiv.appendChild(messageSpan);

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'field-message-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => {
            statusDiv.remove();
        };
        statusDiv.appendChild(closeBtn);

        // Insert after field
        field.parentNode.insertBefore(statusDiv, field.nextSibling);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new StatementConsolidatorApp();
});
