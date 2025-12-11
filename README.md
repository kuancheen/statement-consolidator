# 💰 Statement Consolidator

![Version](https://img.shields.io/badge/version-0.3.53-blue.svg)
![Status](https://img.shields.io/badge/status-beta-orange)
[![Live Demo](https://img.shields.io/badge/demo-online-green.svg)](https://kuancheen.github.io/statement-consolidator/)
![License](https://img.shields.io/badge/license-MIT-green)

**[Live Demo](https://kuancheen.github.io/statement-consolidator/)**

A powerful web app to consolidate financial statements from multiple accounts (banks, credit cards, e-wallets) into Google Sheets with AI-powered transaction extraction and intelligent deduplication.

## ✨ Features

- 🤖 **AI-Powered OCR**: Automatically extract transactions from PDFs and screenshots (requires a Google AI / Gemini API key).
- 📊 **Google Sheets Integration**: Direct integration with your spreadsheets using OAuth (recommended).
- 🎯 **Smart Account Detection**: Automatically suggests which account a statement belongs to
- 🔄 **Deduplication**: Prevents duplicate entries when uploading overlapping statements
- 🎨 **Beautiful UI**: Modern, responsive design that works on all devices
- 🔒 **Privacy First**: All processing happens in your browser

## 🚀 Quick Start

### Credentials you need (two pieces)
1. Google AI / Gemini API Key — used only for OCR (extracting text from PDFs/images).
2. OAuth Client ID — used to sign in with Google and write to Google Sheets (recommended and secure).

### 1. Get Your Gemini API Key (for OCR)
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (you'll enter it in the app)

### 2. Create an OAuth Client ID (for Sheets)
1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an "OAuth Client ID" (Application type: Web application)
3. Add origins/redirects if needed for local testing (e.g., http://localhost:8080)
4. Copy the Client ID (you'll enter it in the app)

### 3. Prepare Your Google Sheet
- With OAuth sign-in enabled, you do NOT need to make the sheet publicly editable. Sign in with your Google account and grant the app permission to write to your sheets.
- (Fallback only) If you cannot use OAuth, the app historically supported a public-sheet import mode — in that case the sheet must be made editable by "Anyone with the link". This mode is not recommended because OAuth is more secure.

Suggested sheet layout:
- Create sheets for your accounts with `@` prefix:
  - Example: `@DBS Savings`, `@Maybank Credit`, `@GrabPay`
- Add headers in row 1: `Date`, `Description`, `Credit`, `Debit`

### 4. Use the App
1. Open `index.html` in your browser (or visit the GitHub Pages URL)
2. Enter your Gemini API key (stored locally in your browser) — used for OCR
3. Enter your OAuth Client ID and click "Sign in with Google" to authorize Sheets access
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
2. **OCR**: AI extracts text from the document (using your Gemini API key)
3. **Parse**: AI identifies transactions (date, description, amount)
4. **Match**: AI suggests which account sheet it belongs to
5. **Verify**: You confirm or change the account
6. **Deduplicate**: System checks for existing transactions
7. **Import**: New transactions are added to your sheet (via OAuth)

## 🛡️ Privacy & Security

- ✅ All processing happens in your browser
- ✅ API keys stored locally (Gemini key and OAuth client configuration are stored locally)
- ✅ OAuth is used to grant the app permission to write to your Google Sheets (no need to make sheets public)
- ✅ No app data is stored on external servers (unless you intentionally export)
- ✅ Open source - you can verify the code

## ⚠️ Important Notes

- OAuth sign-in (Client ID) is the recommended and supported way to allow the app to write to your Google Sheets.
- Large PDF files (>10MB) may take longer to process
- Keep the browser tab open while processing
- The Gemini API has a free tier limit (60 requests/minute)

## 🐛 Troubleshooting

### "Failed to connect to Google Sheet"
- Ensure you have signed in with Google (OAuth) and granted the app permission to access Sheets
- Verify the OAuth Client ID is correctly entered and that the Google Identity Services script has loaded
- If you're using a public-sheet fallback, ensure the sheet's share settings allow editing by "Anyone with the link"
- Check that you have internet connection

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

---
Copyright &copy; 2025 Kuan Cheen. Licensed under [MIT](LICENSE).
