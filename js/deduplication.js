// Deduplication logic for transactions
class DeduplicationEngine {
    constructor() {
        this.existingTransactions = [];
    }

    // Set existing transactions from the sheet
    setExistingTransactions(transactions) {
        this.existingTransactions = transactions;
    }

    // Generate a hash for a transaction
    generateHash(transaction) {
        const date = this.normalizeDate(transaction.date);
        const amount = this.normalizeAmount(transaction.credit || transaction.debit);
        const description = this.normalizeDescription(transaction.description);

        return `${date}|${amount}|${description}`;
    }

    // Normalize date to YYYY-MM-DD format
    normalizeDate(dateStr) {
        if (!dateStr) return '';

        // Try to parse various date formats
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // If parsing fails, return as-is
        return dateStr.trim();
    }

    // Normalize amount (remove currency symbols, commas, etc.)
    normalizeAmount(amountStr) {
        if (!amountStr) return '0';

        // Remove currency symbols, commas, spaces
        const cleaned = String(amountStr)
            .replace(/[^0-9.-]/g, '')
            .trim();

        // Parse as float and round to 2 decimals
        const amount = parseFloat(cleaned) || 0;
        return amount.toFixed(2);
    }

    // Normalize description (lowercase, remove extra spaces)
    normalizeDescription(description) {
        if (!description) return '';

        return String(description)
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Calculate similarity between two strings (Levenshtein distance based)
    calculateSimilarity(str1, str2) {
        const s1 = str1.toLowerCase();
        const s2 = str2.toLowerCase();

        if (s1 === s2) return 1.0;

        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;

        if (longer.length === 0) return 1.0;

        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    // Levenshtein distance algorithm
    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    // Check if a transaction is a duplicate
    isDuplicate(transaction) {
        const hash = this.generateHash(transaction);

        for (const existing of this.existingTransactions) {
            const existingHash = this.generateHash(existing);

            // Exact match
            if (hash === existingHash) {
                return { isDuplicate: true, match: existing, similarity: 1.0 };
            }

            // Fuzzy match
            const dateSame = this.normalizeDate(transaction.date) === this.normalizeDate(existing.date);
            const amountSame = this.normalizeAmount(transaction.credit || transaction.debit) ===
                this.normalizeAmount(existing.credit || existing.debit);

            if (dateSame && amountSame) {
                const descSimilarity = this.calculateSimilarity(
                    transaction.description,
                    existing.description
                );

                if (descSimilarity >= CONFIG.DEDUP.FUZZY_THRESHOLD) {
                    return { isDuplicate: true, match: existing, similarity: descSimilarity };
                }
            }
        }

        return { isDuplicate: false, match: null, similarity: 0 };
    }

    // Filter out duplicates from a list of transactions
    filterDuplicates(transactions) {
        const results = {
            unique: [],
            duplicates: []
        };

        for (const transaction of transactions) {
            const check = this.isDuplicate(transaction);

            if (check.isDuplicate) {
                results.duplicates.push({
                    transaction,
                    matchedWith: check.match,
                    similarity: check.similarity
                });
            } else {
                results.unique.push(transaction);
            }
        }

        return results;
    }

    // Get statistics
    getStats(transactions) {
        const filtered = this.filterDuplicates(transactions);

        return {
            total: transactions.length,
            unique: filtered.unique.length,
            duplicates: filtered.duplicates.length,
            duplicateRate: transactions.length > 0
                ? (filtered.duplicates.length / transactions.length * 100).toFixed(1)
                : 0
        };
    }
}
