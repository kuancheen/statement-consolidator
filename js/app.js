// Main application controller
class StatementConsolidatorApp {
    constructor() {
        this.sheetsAPI = new SheetsAPI();
        this.ocrService = new OCRService();

        this.fileQueue = new FileQueueManager();

        this.currentFile = null;
        this.extractedData = null;
        this.extractedData = null;
        this.selectedSheet = null;
        this.accountSheets = [];

        this.isProcessing = false; // Flag to lock UI during heavy ops

        this.init();
    }

    // Initialize the app
    init() {
        this.setupEventListeners();
        this.loadSavedCredentials();
        this.loadLastSheet();
        this.displayVersion();
        this.updateAuthUI();
    }

    // Setup event listeners
    setupEventListeners() {
        // API Key
        document.getElementById('apiKeyInput').addEventListener('change', (e) => {
            this.saveApiKey(e.target.value);
        });

        // API Key Visibility Toggle
        document.getElementById('toggleApiKeyBtn').addEventListener('click', () => {
            const input = document.getElementById('apiKeyInput');
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
        });

        // Client ID Visibility Toggle
        document.getElementById('toggleClientIdBtn').addEventListener('click', () => {
            const input = document.getElementById('clientIdInput');
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
        });

        // Client ID Auto-Save
        document.getElementById('clientIdInput').addEventListener('change', (e) => {
            const val = e.target.value.trim();
            if (val) {
                localStorage.setItem(CONFIG.STORAGE_KEYS.CLIENT_ID, val);
                // Optional: Provide subtle feedback? Or just keep it silent like standard forms.
                // Let's match the API Key's explicit feedback style
                this.showFieldStatus('clientIdInput', 'Client ID saved locally ✓', 'success');
            }
        });

        // Credentials Save
        document.getElementById('saveCredentialsBtn').addEventListener('click', () => {
            this.saveCredentials();
        });

        // Sign In Button (Dynamic) logic handled in render/update, 
        // but we need a listener for the button we expect to exist.
        // Or we inject it.

        document.getElementById('connectSheetBtn').addEventListener('click', () => {
            // JIT Initialization if deferred
            if (!this.sheetsAPI.tokenClient) {
                const clientId = document.getElementById('clientIdInput').value.trim();
                if (clientId) {
                    try {
                        this.sheetsAPI.initTokenClient(clientId);
                    } catch (e) {
                        this.showFieldStatus('clientIdInput', 'Initialization failed: ' + e.message, 'error');
                        return;
                    }
                }
            }

            if (!this.sheetsAPI.isAuthorized()) {
                try {
                    this.sheetsAPI.requestAccessToken();
                } catch (e) {
                    this.showFieldStatus('connectSheetBtn', e.message, 'error');
                }
            } else {
                this.connectToSheet();
            }
        });

        // Listen for auth success
        document.addEventListener('auth-success', () => {
            this.showFieldStatus('connectSheetBtn', 'Signed in with Google!', 'success');
            // If we were trying to connect, retry?
            const sheetUrl = document.getElementById('sheetUrlInput').value.trim();
            if (sheetUrl) this.connectToSheet();
            this.updateAuthUI();
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
            const files = Array.from(e.dataTransfer.files); // Convert to array
            if (files.length > 0) this.handleFileUpload(files);
        });

        // Multi-file input change
        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                await this.handleFileUpload(Array.from(e.target.files));
                fileInput.value = ''; // Reset
            }
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

    // Load saved credentials (API Key & Client ID)
    loadSavedCredentials() {
        // 1. API Key
        const savedKey = this.ocrService.getApiKey();
        if (savedKey) {
            document.getElementById('apiKeyInput').value = savedKey;
            this.sheetsAPI.setApiKey(savedKey); // Ensure it's set here too
            // Show success in specific area
            this.showFieldStatus('saveCredentialsBtn', 'Credentials saved & initialized!', 'success');

            // Hide global status if it was shown
            document.getElementById('statusMessage').classList.add('hidden');

            // Try to init immediately
            this.updateAuthUI();
        }

        // 2. Client ID
        const clientId = localStorage.getItem(CONFIG.STORAGE_KEYS.CLIENT_ID);
        if (clientId) {
            document.getElementById('clientIdInput').value = clientId;

            // Show inline status via standard helper (adds dismiss button)
            if (savedKey) {
                // Target the button so the status appears below it
                this.showFieldStatus('saveCredentialsBtn', 'Credentials loaded from storage ✓', 'success');
            }

            try {
                this.sheetsAPI.initTokenClient(clientId);
                console.log('Client ID loaded & GSI initialized');
            } catch (e) {
                console.error('Failed to init token client from storage', e);
            }
        }
    }

    // Save API key
    saveApiKey(key, showMessage = true) {
        if (!key || key.trim() === '') {
            this.showFieldStatus('apiKeyInput', 'Please enter an API key', 'error');
            return;
        }

        this.ocrService.setApiKey(key);
        this.sheetsAPI.setApiKey(key);

        if (showMessage) {
            this.showFieldStatus('apiKeyInput', 'API key saved locally ✓', 'success');
        }
    }

    // Save Credentials (API Key & Client ID)
    saveCredentials() {
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        const clientId = document.getElementById('clientIdInput').value.trim();

        if (!apiKey) {
            this.showFieldStatus('apiKeyInput', 'Please enter API Key', 'error');
            return;
        }
        if (!clientId) {
            this.showFieldStatus('clientIdInput', 'Please enter Client ID', 'error');
            return;
        }

        // Save API Key
        this.saveApiKey(apiKey, false);

        // Save Client ID
        localStorage.setItem(CONFIG.STORAGE_KEYS.CLIENT_ID, clientId);

        // Init Token Client
        try {
            this.sheetsAPI.initTokenClient(clientId);
            this.showFieldStatus('saveCredentialsBtn', 'Credentials saved & initialized!', 'success');

            // Auto-trigger auth if needed? No, let user choose when to sign in.

        } catch (e) {
            this.showFieldStatus('saveCredentialsBtn', 'Error initializing OAuth: ' + e.message, 'error');
        }
    }

    // Update Auth UI state
    updateAuthUI() {
        const btn = document.getElementById('connectSheetBtn');
        if (this.sheetsAPI.isAuthorized()) {
            btn.textContent = 'Connect/Refresh Sheet';
            btn.classList.add('btn-primary');
            btn.classList.remove('btn-google');
        } else {
            btn.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"></path>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"></path>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"></path>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.159 6.656 3.58 9 3.58z" fill="#EA4335"></path>
              </svg>
              Sign in with Google to Connect
            `;
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-google');
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
            this.showFieldStatus('sheetUrlInput', 'Please enter a Google Sheet URL', 'error');
            return;
        }

        try {
            this.showFieldStatus('sheetUrlInput', 'Connecting to sheet...', 'info');

            await this.sheetsAPI.connect(sheetUrl);
            this.accountSheets = await this.sheetsAPI.getAccountSheets();

            // Save successful connection URL
            localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_SHEET_ID, sheetUrl);

            if (this.accountSheets.length === 0) {
                this.showFieldStatus('sheetUrlInput', 'No account sheets found. Ensure sheets start with @ (e.g., @DBS).', 'error');
                document.getElementById('accountSheetsList').classList.add('hidden');
            } else {
                this.showFieldStatus('sheetUrlInput', `Connected! Found ${this.accountSheets.length} account sheet(s)`, 'success');
                document.getElementById('uploadSection').classList.remove('hidden');
                this.displayAccountSheetsList();
            }

            this.updateAccountSheetsList();

        } catch (error) {
            this.showFieldStatus('sheetUrlInput', error.message, 'error');
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

    // Display account sheets list in Step 2
    displayAccountSheetsList() {
        const container = document.getElementById('accountSheetsList');
        container.innerHTML = '';

        if (this.accountSheets.length > 0) {
            this.accountSheets.forEach(sheet => {
                const item = document.createElement('div');
                item.className = 'account-item-display';
                item.textContent = sheet.displayName;
                container.appendChild(item);
            });
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }

    // Handle file upload (supports multiple)
    async handleFileUpload(files) {
        // Handle single file from drop event helper logic if array passed
        const fileList = Array.isArray(files) ? files : [files];

        if (!this.ocrService.getApiKey()) {
            this.showFieldStatus('dropZone', 'Please enter your Gemini API key first', 'error');
            return;
        }

        // Add to queue
        const newFiles = await this.fileQueue.addFiles(fileList);

        if (newFiles.length > 0) {
            document.getElementById('organizerSection').classList.remove('hidden');
            this.renderFileQueue();
            this.showFieldStatus('dropZone', `Added ${newFiles.length} file(s) to queue`, 'success');
        }
    }

    // Render file queue
    renderFileQueue() {
        const listEl = document.getElementById('fileList');
        const countEl = document.getElementById('queueStats');
        listEl.innerHTML = '';

        const files = this.fileQueue.getFiles();
        countEl.textContent = `${files.length} files`;

        files.forEach(fileObj => {
            const item = document.createElement('div');
            item.className = `file-item ${fileObj.status}`;
            item.id = `item-${fileObj.id}`;

            // Determine icon
            let icon = '📄';
            if (fileObj.file.type.includes('image')) icon = '🖼️';

            // Account options logic
            let accountSelectHtml = '';
            // Only show select if processed or if we want to allow pre-selection (skip for now to keep simple)

            if (fileObj.status === 'done' || fileObj.accountSheet) {
                const options = this.accountSheets.map(s =>
                    `<option value="${s.title}" ${fileObj.accountSheet?.title === s.title ? 'selected' : ''}>${s.displayName}</option>`
                ).join('');

                accountSelectHtml = `
                    <select class="file-account-select" onchange="app.updateFileAccount('${fileObj.id}', this.value)">
                        <option value="">Select Account...</option>
                        ${options}
                        <option value="_NEW_">+ Create New Account</option>
                    </select>
                 `;
            } else if (fileObj.status === 'pending') {
                accountSelectHtml = ``; // Removed "Waiting..." text
            }

            item.innerHTML = `
                <div class="file-item-header" onclick="app.previewFile('${fileObj.id}')">
                    <div class="file-info">
                        <span class="file-icon">${icon}</span>
                        <div style="min-width: 0;">
                            <div class="file-name">${fileObj.name}</div>
                            <div class="file-meta">${this.formatFileSize(fileObj.size)}</div>
                        </div>
                    </div>
                    
                    <div class="file-header-actions" onclick="event.stopPropagation()">
                         ${accountSelectHtml}
                         <span class="file-status status-${fileObj.status}">${fileObj.status}</span>
                         <button class="icon-btn" onclick="app.removeFile('${fileObj.id}')" title="Remove">🗑️</button>
                         <span class="expand-icon" onclick="app.previewFile('${fileObj.id}')">▼</span>
                    </div>
                </div>
                ${fileObj.error ? `<div class="field-error" style="margin-top:8px">${fileObj.error}</div>` : ''}
                <!-- Inline Preview Container -->
                <div class="file-preview-container" onclick="event.stopPropagation()"></div>
            `;
            listEl.appendChild(item);
        });

        // Update Process Button state
        const pendingCount = this.fileQueue.getPendingFiles().length;
        const btn = document.getElementById('processAllBtn');

        // Strict Lock: If processing, disable regardless of state
        if (this.isProcessing) {
            btn.disabled = true;
            // Keep text same or add spinner, but disabled state is key
        } else {
            btn.disabled = false;
        }

        if (pendingCount === 0 && files.length > 0) {
            btn.textContent = 'Import All Verified';
            btn.classList.add('btn-success');
            btn.classList.remove('btn-primary');
            // Remove previous listeners to be safe (though assignment overrides onclick)
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!this.isProcessing) this.importAllFiles();
            };
        } else {
            btn.textContent = `Process Queue (${pendingCount})`;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-primary');
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!this.isProcessing) this.processQueue();
            };
        }
    }

    // Process file queue
    async processQueue() {
        if (this.isProcessing) return; // Guard

        const pending = this.fileQueue.getPendingFiles();
        if (pending.length === 0) return;

        const btn = document.getElementById('processAllBtn');
        if (btn) btn.disabled = true;

        this.isProcessing = true;
        this.renderFileQueue(); // Triggers disable

        // Use inline status (Initial)
        this.showFieldStatus('processAllBtn', `Processing 1 of ${pending.length} files...`, 'processing');

        for (let i = 0; i < pending.length; i++) {
            const fileObj = pending[i];

            // Update Global Status continuously
            this.showFieldStatus('processAllBtn', `Processing ${i + 1} of ${pending.length} files...`, 'processing');

            try {
                this.fileQueue.updateStatus(fileObj.id, 'processing');
                this.renderFileQueue(); // Update UI

                // Extract
                const extracted = await this.ocrService.extractTransactions(fileObj.file);

                // Suggest account
                const suggestedSheet = this.ocrService.suggestAccountSheet(extracted, this.accountSheets);

                // Update file object
                this.fileQueue.setExtractedData(fileObj.id, extracted);
                this.fileQueue.setAccount(fileObj.id, suggestedSheet);

            } catch (error) {
                console.error(error);
                let msg = error.message;
                if (msg.includes('429')) msg = 'Quota Exceeded (429)';
                this.fileQueue.updateStatus(fileObj.id, 'error', msg);
            }
            this.renderFileQueue(); // Update UI each step
        }

        // Processing complete
        this.isProcessing = false;
        if (btn) btn.disabled = false;
        this.renderFileQueue(); // Re-enable

        // Remove processing message or show done (Persistent)
        this.showFieldStatus('processAllBtn', 'Queue processing complete', 'success');

        // No timeout - stays until user closes
    }

    // Remove file from queue
    removeFile(id) {
        this.fileQueue.removeFile(id);
        this.renderFileQueue();
    }

    // Update assigned account manually
    async updateFileAccount(id, sheetTitle) {
        if (sheetTitle === '_NEW_') {
            const accountName = prompt('Enter new account name (without @):');
            if (accountName) {
                // Check if already exists (case-insensitive check might be nicer but strict for now)
                const existing = this.accountSheets.find(s => s.displayName.toLowerCase() === accountName.toLowerCase());
                if (existing) {
                    alert(`Account '${existing.displayName}' already exists. Selected it.`);
                    this.fileQueue.setAccount(id, existing);
                    this.renderFileQueue();
                    return;
                }

                try {
                    this.showFieldStatus('fileListHeader', 'Creating account sheet...', 'info');
                    const newTitle = await this.sheetsAPI.createAccountSheet(accountName);

                    // Refresh global list
                    this.accountSheets = await this.sheetsAPI.getAccountSheets();
                    this.updateAccountSheetsList(); // Updates main selector if visible

                    // Assign to THIS file
                    const newSheet = this.accountSheets.find(s => s.title === newTitle);
                    this.fileQueue.setAccount(id, newSheet);

                    this.showFieldStatus('fileListHeader', `Created ${accountName}!`, 'success');
                } catch (e) {
                    this.showFieldStatus('fileListHeader', `Error creating sheet: ${e.message}`, 'error');
                }
            }
            // Always re-render to reflect new list and selection
            this.renderFileQueue();
            return;
        }

        const sheet = this.accountSheets.find(s => s.title === sheetTitle);
        this.fileQueue.setAccount(id, sheet);
        // Note: No need to explicitly re-render here as the select element's value matches,
        // but if we wanted to be safe we could. However, standard 'change' event works fine.
    }

    // Preview single file (Accordion style)
    async previewFile(id) {
        const fileObj = this.fileQueue.getFile(id);
        if (!fileObj || !fileObj.data) return;

        const item = document.getElementById(`item-${id}`);
        const previewContainer = item.querySelector('.file-preview-container');

        // Toggle
        const isActive = item.classList.contains('active');
        document.querySelectorAll('.file-item').forEach(el => {
            el.classList.remove('active');
            el.querySelector('.file-preview-container').innerHTML = '';
        });

        if (isActive) return;

        // Open
        item.classList.add('active');

        this.selectedSheet = fileObj.accountSheet;
        this.extractedData = fileObj.data;

        // Render Loading
        previewContainer.innerHTML = '<div class="processing-indicator" style="margin:0"><div class="spinner"></div><span>Preparing preview...</span></div>';

        // Deduplication Logic Removed (User requested "Upload All" strategy)
        // We now just show all transactions as "New" locally.
        const filtered = { unique: fileObj.data.transactions, duplicates: [] };

        // if (this.selectedSheet) { ... } // Logic removed

        // Generate Rows
        const rows = filtered.unique.map(t => this.createTransactionRowHTML(t, false))
            .concat(filtered.duplicates.map(d => this.createTransactionRowHTML(d.transaction, true)))
            .join('');

        // Account Display Name
        const accountDisplay = this.selectedSheet ? this.selectedSheet.displayName : '<span style="color:var(--text-muted); font-style:italic">No Account Selected (Preview Only)</span>';
        const institutionDisplay = fileObj.data.institutionName ? ` | ${fileObj.data.institutionName}` : '';

        const html = `
            <div class="ocr-meta compact-width" style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-sm); font-size: 0.9rem; border: 1px solid var(--glass-border);">
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1rem; text-align:center;">
                    <div>
                         <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px">Institution</div>
                         <div style="font-weight:600">${fileObj.data.institutionName || '-'}</div>
                    </div>
                    <div>
                         <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px">Account Name</div>
                         <div style="font-weight:600">${fileObj.data.accountName || 'Unknown'}</div>
                    </div>
                    <div>
                         <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px">Type</div>
                         <div><span class="badge" style="background:var(--primary-dark); color:white">${fileObj.data.accountType || 'Unknown'}</span></div>
                    </div>
                </div>
            </div>
            
            <div class="preview-stats compact-width" style="margin-bottom: 1rem; margin-top: 1rem;">
                <div class="stat-item"><span class="stat-label">New</span><span class="stat-value success">${filtered.unique.length}</span></div>
                <div class="stat-item"><span class="stat-label">Duplicates</span><span class="stat-value warning">${filtered.duplicates.length}</span></div>
                <div class="stat-item"><span class="stat-label">Account</span><span class="stat-value" style="font-size:1rem">${accountDisplay}</span></div>
            </div>

             <div class="table-container compact-width" style="max-height: 400px; overflow-y: auto;">
                <table>
                    <thead><tr><th>Date</th><th>Description</th><th>Credit</th><th>Debit</th><th>Status</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
             <div class="text-center mt-2">
                ${this.selectedSheet ?
                `<button class="btn btn-success" onclick="app.importTransactions()">Import This File (Global)</button>` :
                `<button class="btn btn-secondary" disabled title="Select an account to enable import">Select Account to Import</button>`
            }
             </div>
        `;

        previewContainer.innerHTML = html;
    }

    // Helper for generating row HTML (since createTransactionRow returns DOM)
    createTransactionRowHTML(transaction, isDuplicate) {
        return `
            <tr class="${isDuplicate ? 'duplicate' : ''}">
              <td>${transaction.date}</td>
              <td>${transaction.description}</td>
              <td class="amount credit">${transaction.credit || '-'}</td>
              <td class="amount debit">${transaction.debit || '-'}</td>
              <td>${isDuplicate ? '<span class="badge duplicate">Duplicate</span>' : '<span class="badge new">New</span>'}</td>
            </tr>
        `;
    }


    // Show error inline in file item
    showFileError(id, message) {
        const item = document.getElementById(`item-${id}`);
        if (!item) return;

        // Check if error already exists
        let errorEl = item.querySelector('.file-inline-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'field-error file-inline-error';
            errorEl.style.marginTop = '8px';

            // Allow close
            errorEl.innerHTML = `<span>${message}</span><button class="field-message-close" onclick="this.parentElement.remove()">×</button>`;

            // Insert before actions
            const actions = item.querySelector('.file-actions');
            if (actions) {
                item.insertBefore(errorEl, actions);
            } else {
                item.appendChild(errorEl);
            }
        } else {
            errorEl.querySelector('span').textContent = message;
        }
    }

    // Import All Files
    async importAllFiles() {
        if (this.isProcessing) return;

        const readyFiles = this.fileQueue.getFiles().filter(f => f.status === 'done' && f.accountSheet);
        if (readyFiles.length === 0) {
            // Show inline warning instead of global status
            this.showFieldStatus('processAllBtn', 'No ready files to import', 'error');
            return;
        }

        const btn = document.getElementById('processAllBtn');
        if (btn) btn.disabled = true; // Immediate visual lock

        this.isProcessing = true;
        this.renderFileQueue(); // Logic lock

        // Use inline status (Initial)
        this.showFieldStatus('processAllBtn', `Importing 1 of ${readyFiles.length} files...`, 'processing');

        let successCount = 0;

        for (let i = 0; i < readyFiles.length; i++) {
            const fileObj = readyFiles[i];

            // Update Global Status
            this.showFieldStatus('processAllBtn', `Importing ${i + 1} of ${readyFiles.length} files...`, 'processing');

            try {
                // UPDATE UI: Importing...
                this.updateFileStatusUI(fileObj.id, 'importing', 'Importing...');

                const transactionsToUpload = fileObj.data.transactions;

                if (transactionsToUpload.length > 0) {
                    await this.sheetsAPI.appendTransactions(fileObj.accountSheet.title, transactionsToUpload, fileObj.accountSheet.id);
                    successCount++;

                    // UPDATE UI: Imported
                    this.updateFileStatusUI(fileObj.id, 'imported', 'Imported ✓');
                    // Optional: Update internal status so it sticks if re-rendered
                    fileObj.status = 'imported';
                } else {
                    this.updateFileStatusUI(fileObj.id, 'done', 'Empty?');
                }
            } catch (e) {
                console.error('Import failed for ' + fileObj.name, e);
                this.updateFileStatusUI(fileObj.id, 'error', 'Failed');
                this.showFileError(fileObj.id, e.message);
            }
        }

        this.isProcessing = false;

        if (btn) btn.disabled = false; // Re-enable (will be overridden by render if pending=0, handled there)
        this.renderFileQueue(); // Sync UI state

        // Final Status (Correct Order: fieldId, message, type)
        this.showFieldStatus('processAllBtn', `Batch import complete. Imported ${successCount} files.`, 'success');
    }

    // Helper to update just the status element of a file card
    updateFileStatusUI(id, statusClass, statusText) {
        const item = document.getElementById(`item-${id}`);
        if (!item) return;

        const statusEl = item.querySelector('.file-status');
        if (statusEl) {
            // Remove old status classes
            statusEl.classList.remove('status-done', 'status-processing', 'status-error', 'status-pending', 'status-importing', 'status-imported');
            // Add new
            statusEl.classList.add(`status-${statusClass}`);
            statusEl.textContent = statusText;
        }
    }

    // Legacy method helper for single file Preview flow
    async processFile(file) {
        // Redundant now, kept if needed or logic moved to processQueue
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
    async confirmAccount(sheet = null) {
        if (sheet) {
            this.selectedSheet = sheet;
        } else {
            const select = document.getElementById('accountSheetSelect');
            const selectedValue = select.value;

            if (!selectedValue) {
                this.showFieldStatus('accountSheetSelect', 'Please select an account', 'error');
                return;
            }
            this.selectedSheet = this.accountSheets.find(s => s.title === selectedValue);
        }

        // No need to hide if we didn't show it (e.g. from Preview flow)
        // But harmless to ensure it's hidden if we are moving to Step 4
        this.hideAccountSelector();

        // Load existing transactions for deduplication
        // Note: Even though we bypass dedup for upload, we might still want to load them 
        // if we ever want to re-enable it. But for now, we can skip or keep it silent.
        // await this.loadExistingTransactions(); 

        // Show preview
        this.showTransactionPreview();
    }

    // Show create account dialog
    async showCreateAccountDialog() {
        const accountName = prompt('Enter new account name (without @ prefix):');

        if (!accountName) return;

        try {
            this.showFieldStatus('fileListHeader', 'Creating new account sheet...', 'info');

            const sheetTitle = await this.sheetsAPI.createAccountSheet(accountName);

            // Refresh account sheets list
            this.accountSheets = await this.sheetsAPI.getAccountSheets();
            this.updateAccountSheetsList();

            // Select the new sheet
            document.getElementById('accountSheetSelect').value = sheetTitle;

            this.showFieldStatus('fileListHeader', `Created account sheet: ${accountName}`, 'success');

        } catch (error) {
            this.showFieldStatus('fileListHeader', `Error creating sheet: ${error.message}`, 'error');
        }
    }

    // Load existing transactions for deduplication
    async loadExistingTransactions() {
        // Disabled for "Upload All" workflow to save API calls
        return;
        /*
        try {
            this.showStatus('Loading existing transactions...', 'info');
    
            const existing = await this.sheetsAPI.readTransactions(this.selectedSheet.title);
            this.dedupEngine.setExistingTransactions(existing);
    
            this.showStatus(`Loaded ${existing.length} existing transaction(s)`, 'success');
    
        } catch (error) {
            this.showStatus(`Warning: Could not load existing transactions: ${error.message}`, 'warning');
        }
        */
    }

    // Show transaction preview
    showTransactionPreview() {
        const previewSection = document.getElementById('previewSection');
        const tbody = document.getElementById('transactionsTableBody');
        const stats = document.getElementById('previewStats');

        // BYPASS DEDUPLICATION: All transactions are treated as new
        const allTransactions = this.extractedData.transactions;

        // Update stats - Simplified
        stats.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Total Extracted:</span>
        <span class="stat-value">${allTransactions.length}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Account:</span>
        <span class="stat-value" style="font-size: 1rem">${this.selectedSheet.displayName}</span>
      </div>
    `;

        // Clear table
        tbody.innerHTML = '';

        // Add all transactions as normal rows
        allTransactions.forEach(transaction => {
            const row = this.createTransactionRow(transaction, false); // isDuplicate = false
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
                this.showFieldStatus('importBtn', 'No new transactions to import', 'warning');
                return;
            }

            this.showFieldStatus('importBtn', `Importing ${filtered.unique.length} transaction(s)...`, 'info');

            try {
                await this.sheetsAPI.appendTransactions(this.selectedSheet.title, filtered.unique);
                this.showFieldStatus('importBtn', `Successfully imported ${filtered.unique.length} transaction(s)!`, 'success');

                // Reset for next upload
                setTimeout(() => {
                    this.resetUpload();
                }, 2000);
            } catch (error) {
                // If write fails due to OAuth requirement, offer CSV download
                if (error.message.includes('OAuth') || error.message.includes('UNAUTHENTICATED') || error.message.includes('API keys are not supported')) {
                    this.showFieldStatus('importBtn', 'Direct import requires OAuth. Downloading as CSV instead...', 'warning');
                    this.downloadAsCSV(filtered.unique);
                } else {
                    throw error;
                }
            }

        } catch (error) {
            this.showFieldStatus('importBtn', `Import failed: ${error.message}`, 'error');
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

        this.showFieldStatus('step3Header', `Downloaded ${transactions.length} transactions as ${filename}. You can now import this CSV to your Google Sheet.`, 'success');

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

        if (this.fileQueue.getFiles().length === 0) {
            document.getElementById('organizerSection').classList.add('hidden');
            this.showFieldStatus('step3Header', 'Ready for next upload', 'info');
        } else {
            this.showFieldStatus('step3Header', 'Ready for next file', 'info');
        }
    }


    // Format file size
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
