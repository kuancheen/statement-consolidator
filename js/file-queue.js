class FileQueueManager {
    constructor() {
        this.files = []; // Array of { id, file, status, data, accountSheet }
        this.counter = 0;
    }

    // Add files to queue (handles ZIP extraction)
    async addFiles(fileList) {
        const newFiles = [];

        for (const file of fileList) {
            if (file.name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
                const extracted = await this.extractZip(file);
                extracted.forEach(f => {
                    const fileObj = this.createFileObject(f);
                    this.files.push(fileObj);
                    newFiles.push(fileObj);
                });
            } else if (CONFIG.UPLOAD.ACCEPTED_TYPES.includes(file.type)) {
                const fileObj = this.createFileObject(file);
                this.files.push(fileObj);
                newFiles.push(fileObj);
            }
        }

        return newFiles;
    }

    // Extract ZIP file
    async extractZip(zipFile) {
        const extractedFiles = [];
        try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(zipFile);

            for (const filename of Object.keys(contents.files)) {
                const zipEntry = contents.files[filename];
                if (!zipEntry.dir) {
                    // Check extension
                    const ext = filename.split('.').pop().toLowerCase();
                    let type = '';
                    if (['pdf'].includes(ext)) type = 'application/pdf';
                    else if (['jpg', 'jpeg'].includes(ext)) type = 'image/jpeg';
                    else if (['png'].includes(ext)) type = 'image/png';
                    else if (['webp'].includes(ext)) type = 'image/webp';

                    if (type && CONFIG.UPLOAD.ACCEPTED_TYPES.includes(type)) {
                        const blob = await zipEntry.async('blob');
                        const file = new File([blob], filename, { type: type });
                        extractedFiles.push(file);
                    }
                }
            }
        } catch (error) {
            console.error('Error unzipping file:', error);
            throw new Error('Failed to extract ZIP file: ' + error.message);
        }
        return extractedFiles;
    }

    // Create standardized file object
    createFileObject(file) {
        this.counter++;
        return {
            id: `file_${Date.now()}_${this.counter}`,
            file: file,
            name: file.name,
            size: file.size,
            status: 'pending', // pending, processing, done, error
            error: null,
            data: null, // extracted transactions
            accountSheet: null // assigned account sheet
        };
    }

    // Get all files
    getFiles() {
        return this.files;
    }

    // Get pending files
    getPendingFiles() {
        return this.files.filter(f => f.status === 'pending');
    }

    // Get file by ID
    getFile(id) {
        return this.files.find(f => f.id === id);
    }

    // Remove file
    removeFile(id) {
        this.files = this.files.filter(f => f.id !== id);
    }

    // Clear all
    clear() {
        this.files = [];
        this.counter = 0;
    }

    // Update file status
    updateStatus(id, status, error = null) {
        const file = this.getFile(id);
        if (file) {
            file.status = status;
            file.error = error;
        }
    }

    // Set extracted data
    setExtractedData(id, data) {
        const file = this.getFile(id);
        if (file) {
            file.data = data;
            file.status = 'done';
        }
    }

    // Set assigned account
    setAccount(id, accountSheet) {
        const file = this.getFile(id);
        if (file) {
            file.accountSheet = accountSheet;
        }
    }
}
