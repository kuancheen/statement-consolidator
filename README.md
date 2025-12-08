# 💰 Statement Consolidator

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Status](https://img.shields.io/badge/status-beta-orange)
![License](https://img.shields.io/badge/license-MIT-green)

A powerful web app to consolidate financial statements from multiple accounts (banks, credit cards, e-wallets) into Google Sheets with AI-powered transaction extraction and intelligent deduplication.

## ✨ Features

- 🤖 **AI-Powered OCR**: Automatically extract transactions from PDFs and screenshots
- 📊 **Google Sheets Integration**: Direct integration with your spreadsheets
- 🎯 **Smart Account Detection**: Automatically suggests which account a statement belongs to
- 🔄 **Deduplication**: Prevents duplicate entries when uploading overlapping statements
- 🎨 **Beautiful UI**: Modern, responsive design that works on all devices
- 🔒 **Privacy First**: All processing happens in your browser

## 🚀 Quick Start

### 1. Get Your API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (you'll enter it in the app)

### 2. Prepare Your Google Sheet

1. Create a new Google Sheet or use an existing one
2. Make it publicly editable:
   - Click "Share" → "Anyone with the link"
   - Change to "Editor" access
3. Create sheets for your accounts with `@` prefix:
   - Example: `@DBS Savings`, `@Maybank Credit`, `@GrabPay`
4. Add headers in row 1: `Date`, `Description`, `Credit`, `Debit`

### 3. Use the App

1. Open `index.html` in your browser (or visit the GitHub Pages URL)
2. Enter your Gemini API key (stored locally in your browser)
3. Enter your Google Sheet URL
4. Upload a statement (PDF or screenshot)
5. Verify the suggested account
6. Review extracted transactions
7. Click "Import to Sheet"

## 📋 Google Sheet Setup

Your Google Sheet should have account sheets with the `@` prefix:

```
Spreadsheet: "My Finances"
├── @DBS Savings
├── @OCBC Current
├── @Citibank Credit
├── @GrabPay
├── @Touch n Go
└── Summary (optional, without @)
```

Each account sheet should have these columns in row 1:
- **Date**: Transaction date
- **Description**: Transaction details
- **Credit**: Money in
- **Debit**: Money out

## 🎯 Supported Statement Formats

The AI can extract transactions from:
- ✅ Bank statement PDFs
- ✅ Credit card statement PDFs
- ✅ E-wallet app screenshots
- ✅ Transaction history screenshots
- ✅ Scanned documents

## 🔧 How It Works

1. **Upload**: You upload a statement file
2. **OCR**: AI extracts text from the document
3. **Parse**: AI identifies transactions (date, description, amount)
4. **Match**: AI suggests which account sheet it belongs to
5. **Verify**: You confirm or change the account
6. **Deduplicate**: System checks for existing transactions
7. **Import**: New transactions are added to your sheet

## 🛡️ Privacy & Security

- ✅ All processing happens in your browser
- ✅ API keys stored locally (never sent anywhere except to Google)
- ✅ No data stored on external servers
- ✅ Open source - you can verify the code

## ⚠️ Important Notes

- Your Google Sheet must be publicly editable for the app to work
- Large PDF files (>10MB) may take longer to process
- Keep the browser tab open while processing
- The Gemini API has a free tier limit (60 requests/minute)

## 🐛 Troubleshooting

### "Failed to connect to Google Sheet"
- Check that your sheet URL is correct
- Ensure the sheet is set to "Anyone with link can edit"
- Verify you have internet connection

### "OCR failed"
- Check that your Gemini API key is valid
- Ensure the file is a clear, readable image or PDF
- Try with a smaller file size

### "No transactions found"
- The statement format might be unusual
- Try uploading a clearer image
- Check that the document actually contains transactions

## 📝 License

MIT License - feel free to use and modify!

## 🤝 Contributing

Found a bug or want to add a feature? Feel free to open an issue or submit a pull request!
