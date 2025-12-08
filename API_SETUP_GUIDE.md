# API Setup Guide

## 🔑 Step-by-Step: Getting Your Google AI API Key

### Step 1: Create/Access Google Cloud Project

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**

### Step 2: Enable Required APIs

Your API key needs access to **TWO** services:

#### A. Gemini AI API (for OCR)
✅ This is automatically enabled when you create the key in AI Studio

#### B. Google Sheets API (for reading/writing sheets)
❌ This needs to be manually enabled!

**To Enable Google Sheets API:**

1. Click on this link (replace with your project number):
   ```
   https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=787314492551
   ```
   
   Or follow these steps:
   
2. Go to [Google Cloud Console](https://console.cloud.google.com/)
3. Select your project (the one associated with your API key)
4. Click **"APIs & Services"** → **"Library"**
5. Search for **"Google Sheets API"**
6. Click on it and press **"Enable"**
7. Wait 1-2 minutes for the API to activate

### Step 3: Test Your API Key

Once both APIs are enabled, your key will work for:
- ✅ Gemini AI (OCR and transaction extraction)
- ✅ Google Sheets (reading and writing data)

## 🔍 Your Current Status

**Your API Key:** `AIzaSyB_AjZhMW2kAZ7Syv4OEv1mbubkyu_Dy-I`

**Test Results:**
- ✅ Gemini AI API: **Working** (after model update)
- ❌ Google Sheets API: **NOT ENABLED**

**Action Required:**
Enable Google Sheets API by visiting:
https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=787314492551

## 📊 Prepare Your Google Sheet

While waiting for the API to activate:

1. Open your Google Sheet:
   https://docs.google.com/spreadsheets/d/16hJGVVb0I7sYz_6ypnCld43zMv1d7SLSSIVRQaoDtNU/

2. Click **"Share"** button (top right)

3. Under "General access", select:
   - **"Anyone with the link"**
   - Change role to **"Editor"**
   
4. Click **"Done"**

5. Create account sheets with `@` prefix:
   - Example: `@DBS Savings`
   - Example: `@Citibank Credit`
   - Example: `@GrabPay`

6. Add headers in row 1 of each account sheet:
   ```
   Date | Description | Credit | Debit
   ```

## ✅ Verification Checklist

Before using the app:

- [ ] Google Sheets API is enabled in Cloud Console
- [ ] Waited 1-2 minutes after enabling
- [ ] Google Sheet is set to "Anyone with link can edit"
- [ ] Created at least one sheet with `@` prefix
- [ ] Added headers (Date, Description, Credit, Debit)
- [ ] Entered API key in the app

## 🚀 Ready to Use!

Once all steps are complete:

1. Open the Statement Consolidator app
2. Enter your API key: `AIzaSyB_AjZhMW2kAZ7Syv4OEv1mbubkyu_Dy-I`
3. Enter your sheet URL: `https://docs.google.com/spreadsheets/d/16hJGVVb0I7sYz_6ypnCld43zMv1d7SLSSIVRQaoDtNU/`
4. Click "Connect to Sheet"
5. Upload your first statement!

## 🔧 Troubleshooting

### "Google Sheets API has not been used"
- Enable the API in Cloud Console (see Step 2B above)
- Wait 1-2 minutes after enabling
- Try again

### "Permission denied" or "Failed to connect"
- Make sure sheet is set to "Anyone with link can edit"
- Check that you're using the correct sheet URL
- Verify API key is entered correctly

### "No account sheets found"
- Create sheets with `@` prefix (e.g., `@Bank Account`)
- Refresh the connection

## 📝 Notes

- The API key is free (60 requests/minute limit)
- Your data stays in your browser and Google Sheets only
- No external servers involved
- API key is stored locally in your browser
