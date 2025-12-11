# Changelog

All notable changes to the Statement Consolidator project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [0.3.52] - 2025-12-11
### Fixed
- **Cache Busting:** Added version query parameters (e.g., `?v=0.3.52`) to all script tags in `index.html`. This forces the browser to load the latest JavaScript files instead of serving stale cached versions that may lack recent persistence fixes.

## [0.3.51] - 2025-12-11
### Fixed
- **Persistence:** Switched Client ID and Sheet URL saving to use the `input` event. This ensures changes are saved to local storage immediately as you type, rather than waiting for focus loss (`change` event), preventing data loss on reload.

## [0.3.50] - 2025-12-11
### Fixed
- **Initialization:** Overhauled app initialization (`init`) to be asynchronous and fail-safe. This ensures `displayVersion` runs immediately (fixing the "Loading..." bug) and that credential loading race conditions are resolved.

## [0.3.49] - 2025-12-11
### Changed
- **UI:** Renamed "Connect to Sheet" button to "Connect to Google" for clarity. The button text updates to "Connect/Refresh Sheet" upon successful authentication.

## [0.3.48] - 2025-12-11
### Fixed
- **UI:** Fixed outdated hardcoded version number in the footer. The version display is now fully dynamic and synced with `config.js`.

## [0.3.47] - 2025-12-11
### Fixed
- **Persistence:** Fixed credential saving issue. Client ID now auto-saves on input change, and Google Sheet URL automatically saves upon successful connection.

## [0.3.46] - 2025-12-11
### Refactored
- **Status Messaging:** Eliminated the global `showStatus()` helper in favor of `showFieldStatus()`, ensuring all messages appear contextually near the relevant action (e.g., below buttons or in section headers).
- **Code Cleanup:** Removed deprecated `showStatus` and `showFieldError` methods and the duplicate/incorrect `showFieldStatus` definition.
- **Consistency:** Standardized all error and status messages to use the consistent inline styling (Green/Red/Amber boxes).

## [0.3.45] - 2025-12-11

### Fixed
- **Styling:** Fixed "No ready files" error message to correctly display as a red box (white text issue fixed).

## [0.3.44] - 2025-12-11

### Fixed
- **Dismissible Status:** "Credentials saved" message now correctly has a dismiss (X) button.
- **Import Logic:** Fixed a critical bug where "Import All" was blocked even with valid files (No ready files error).
- **Consolidated UX:** Standardized inline messages for import warnings to use the Error (Red) style for visibility.

## [0.3.43] - 2025-12-11

### Added
- Version bump to v0.3.43 with UI polish and button lock fixes.

## [0.3.42] - 2025-12-11

### Fixed
- **Dismissible Status:** Fixed the "Credentials loaded from storage" message to correctly include the dismiss (X) button, consistent with all other status messages in the application.
## [0.3.41] - 2025-12-11

### Improved
- **Granular Progress Updates:** The app now displays detailed progress during processing and importing (e.g., "Processing 2 of 5 files..."), giving you better visibility into large queues.
- **Enhanced Button States:** Added strong visual cues (opacity, grayscale) to disabled buttons, ensuring it's immediately obvious when the application is busy and interactions are locked.
## [0.3.40] - 2025-12-11

### Changed
- **Advanced Sheet Automation ("Self-Healing"):** The app now enforces a stricter, cleaner layout for all connected sheets. It automatically:
    - **Freezes Row 1** (Headers).
    - **Enables Filters** on the header row.
    - **Hides Column A** (Unique Key) even more reliably.
    - **Deletes Extra Columns** (G onwards) to keep the sheet compact.
    - **Fixes Conditional Formatting:** Updated the duplicate detection formula to correctly respect the header row (`=COUNTIF($A:$A, $A2)>1`), ensuring accurate highlighting.
## [0.3.39] - 2025-12-11

### Fixed
- **Status Message Styling:** Fixed a bug where the status message text was incorrectly applied as a CSS class, causing transparent/white boxes. Status messages now correctly display as:
    - **Processing:** Amber/Yellow
    - **Success:** Green
- **Button Locking:** Reinforced the button disable logic to ensure "Process Queue" and "Import All" buttons strictly remain disabled during operations.
## [0.3.38] - 2025-12-11

### Changed
- **Visual Polish:** Updated inline error/status messages to match the main application's consistent styling (Green/Red/Orange boxes with full borders).
- **Robust Button Locking:** Implemented a global processing state that strictly locks the "Process Queue" and "Import All" buttons during operations, preventing any possibility of accidental double-clicking even if the UI updates.
## [0.3.37] - 2025-12-11

### Changed
- **Persistent UI Feedback:** Status messages for queue processing and importing are now persistent (green/red boxes) and must be dismissed by the user, ensuring you never miss a result.
- **Strict Button Disabling:** The "Import All Verified" button is now disabled during the import process to prevent duplicate clicks.
- **Smart Account Selection:** If you try to create a "New" account that already exists, the app now intelligently selects the existing account instead of creating a duplicate.
## [0.3.36] - 2025-12-11

### Fixed
- **Robust Column Mapping:** Implemented a new two-step import process to guarantee that hidden columns (Unique Key) are populated correctly. This resolves the issue where data could shift to Column B if Column A was hidden or empty.
## [0.3.35] - 2025-12-11

### Fixed
- **Conditional Formatting:** logic updated to check for existing rules before adding new ones, preventing duplicate rules from stacking up.
- **Auto-Setup:** Improved resilience of sheet configuration (Headers, Hidden Columns) to ensure consistency without redundancy.
## [0.3.34] - 2025-12-11

### Changed
- **UI UX Improvements:**
    - **Inline Process Status:** The status for "Process Queue" now appears directly below the button for better visibility.
    - **Prevent Double-Click:** The "Process Queue" button is now disabled while processing to prevent duplicate operations.
    - **Smart Account Creation:** When creating a new account from a file's dropdown, the new account is now automatically selected for that file immediately.
## [0.3.33] - 2025-12-11

### Changed
- **Import Status Indicators:** Added real-time visual feedback during batch imports.
    - Files now show **"Importing..."** (Yellow) while keeping the connection open.
    - Successfully uploaded files change to **"Imported ✓"** (Green).
- **Hidden Column Reliability:** Reinforced verification of hidden columns during batch imports to ensure data integrity.
## [0.3.32] - 2025-12-10

### Changed
- **Sheet Automation:** The app now programmatically configures your Google Sheet columns and rules.
    - **Hidden Unique Key:** The Unique Key has been moved to **Column A** and acts as a hidden unique identifier.
    - **Auto-Formatting:** The app automatically applies **Conditional Formatting** to highlight duplicates in red.
    - **Dropdowns:** The "Status" column (F) now automatically gets a dropdown menu (New, Duplicate, To be deleted).
- **Self-Healing:** Every time you upload, the app checks if these rules exist on the target sheet and adds them if missing, ensuring new sheets are always set up correctly.
## [0.3.31] - 2025-12-10

### Added
- **Unique Key Column:** Added a 6th column ("Unique Key") to the Google Sheets export. This column contains a generated composite key (`Date|Desc|Amount`) for each transaction, enabling high-performance deduplication using native Sheet formulas (e.g., Conditional Formatting) without relying on slow Apps Script iteration.
- **Preview Logic Fix:** Removed legacy references to the deduplication engine in the preview module which prevented file previews.
## [0.3.30] - 2025-12-10

### Changed
- **Architecture:** Permanently removed client-side deduplication logic (`deduplication.js`) to streamline the app.
- **Data Schema:** Updated the Google Sheets export schema to include a new 5th column ("Status") for all transactions. Every new upload now defaults to `New` status, paving the way for server-side duplicate management.
## [0.3.29] - 2025-12-10

### Changed
- **Workflow:** Removed client-side deduplication. All extracted transactions are now uploaded to Google Sheets regardless of whether they already exist, pushing the responsibility of duplicate management to the Sheet itself (e.g., via unique constraints or manual cleanup).
- **UI:** Simplified the preview statistics to remove "New" vs "Duplicate" counts, now showing just the "Total Extracted".
## [0.3.28] - 2025-12-09

### Fixed
- **UI:** Implemented strict DOM placement for validation messages. The code now explicitly locates the `.input-wrapper` and inserts messages *immediately after* it using `wrapper.after()`. This guarantees the message appears below the row of controls, resolving the persistent layout issue. Also added aggressive cleanup to remove any duplicate messages before adding a new one.
## [0.3.27] - 2025-12-09

### Fixed
- **UI:** Force-aligned validation messages (like "API Key saved") to always appear at the very bottom of the form group. This solves the layout glitch where messages would squeeze in between the input field and the eye icon button.
## [0.3.26] - 2025-12-09

### Fixed
- **OCR:** Switched the AI output format from JSON to **CSV**. This dramatically reduces the number of tokens generated (no repeated keys, brackets, or quotes), effectively quadrupling the capacity for transactions in a single pass and eliminating the "Unexpected end of JSON" error for large files.
- **UI:** Redesigned the API Key input field layout. The "Eye" visibility toggle is now a distinct button placed *next to* the input field (instead of inside it). This ensures it never overlaps with text or gets displaced by validation messages.
## [0.3.25] - 2025-12-09

### Fixed
- **OCR:** Implemented "Advanced Salvage Mode" with a smart bracket balancing algorithm. When JSON is truncated, it now calculates exactly which quotes, brackets, or braces are missing and appends them to form valid JSON, ensuring maximum data recovery for large files.
- **UI:** Fixed the "pushed down" eye icon issue by modifying the validation message logic. Messages are now inserted *after* the input wrapper (instead of inside it), preventing layout shifts that displaced the absolute-positioned icon.
## [0.3.24] - 2025-12-09

### Fixed
- **OCR:** Enhanced long-file stability by strictly checking for a closing brace `}` to detect truncation. If the file is still cut off after retries (max token limit), the app now attempts to "salvage" the data by automatically appending closing brackets (e.g., `]}`), saving the transactions that were successfully extracted instead of failing completely.
## [0.3.23] - 2025-12-09

### Fixed
- **UI:** Reverted the `flex` layout on the API key input wrapper to `block` (default). This fixes the layout issue where validation messages were appearing on the same line as the input field. The eye icon remains correctly positioned.
- **Debug:** Added console logging of the raw AI response when "Unexpected end of JSON" errors occur, allowing users to inspect the truncated output in the browser console.
## [0.3.22] - 2025-12-09

### Fixed
- **OCR:** Implemented automatic 2x retry logic when the AI response is truncated (causing "Unexpected end of JSON"), improving stability for large/complex statements.
- **UI:** Fixed the "Eye" icon alignment in the API key field so it stays inside the input box and doesn't get pushed out by status messages.
## [0.3.21] - 2025-12-09

### Fixed
- **OCR:** Implemented an "Iterative Repair" strategy for JSON parsing. If the AI output has syntax errors (like missing commas or broken brackets), the app now uses the error coordinates to surgically insert missing characters and retry parsing up to 20 times. This solves persistent extraction errors on large files.
## [0.3.20] - 2025-12-09

### Fixed
- **OCR:** Improved JSON sanitization to handle missing commas between array objects (fixing `} {` syntax errors) and strip comments, making imports much more robust against AI formatting glitches.
## [0.3.19] - 2025-12-09

### Fixed
- **OCR:** Added sanitization to remove trailing commas from AI-generated JSON before parsing, resolving the "Expected ',' or ']' after array element" error.
- **UI:** Styled the "Remove File" (trash icon) button to be transparent, blending correctly with the list item background.
## [0.3.18] - 2025-12-09

### Changed
- **UI:** Made the transaction table header sticky (fixed) so it remains visible while scrolling through long lists of transactions.
## [0.3.17] - 2025-12-09

### Fixed
- **UI:** Forced center alignment for "Detected Account", "Stats", and "Transaction Table" in the file preview using strict CSS overrides to ensure they consistently stack as a unified 80% width column.
## [0.3.16] - 2025-12-09

### Changed
- **UI:** Refactored the "Detected Account" metadata into a structured 3-column layout (Institution | Account Name | Type) for better readability, removing the generic label.
## [0.3.15] - 2025-12-09

### Changed
- **UI:** Aligned the "Detected Account" metadata and statistics rows to match the table's compact width (80% centered), creating a consistent visual column for the preview.
## [0.3.14] - 2025-12-09

### Fixed
- **Error Handling:** Added a friendly error message when the API key is reported as "leaked/revoked", guiding the user to generate a new one immediately.
## [0.3.13] - 2025-12-09

### Changed
- **UI:** Relocated "Credentials loaded" and status messages to the area immediately below the "Save" button in Step 1, removing them from the header for better context.
## [0.3.12] - 2025-12-09

### Changed
- **UI:** Reduced table row height (by ~50%) and width (by 20%) for a more compact preview.
- **Workflow:** File preview is now available even without selecting an account (mandatory checks moved to Import).
- **OCR:** Enhanced extraction to identify "Institution Name" (Bank/Issuer) separately from content.
## [0.3.11] - 2025-12-09

### Changed
- **UI:** Fixed stubborn visual gaps in the file list by resetting inherited margins on file info elements.
- **Feature:** Added display of DETECTED Account Name and Type (from AI) in the file preview section.
## [0.3.10] - 2025-12-09

### Fixed
- **Auth:** Added just-in-time initialization for the "Sign In" button. It now works immediately even if the initial page load hadn't finished initializing the Google library.
## [0.3.9] - 2025-12-09

### Changed
- **UI:** Moved credential status inline with the header.
- **UI:** Removed gaps between file list items for a cleaner look.
- **UI:** Removed "Waiting..." text from pending files.
- **Feature:** Added "Create New Account" option directly in the file account dropdown.
## [0.3.8] - 2025-12-09

### Fixed
- **Persistence:** Fixed a race condition where the Client ID would not appear in the input field if the Google Identity Services script hadn't finished loading.
## [0.3.7] - 2025-12-09

### Changed
- **UI:** Changed "No account sheets found" notification from warning to error (red) for better visibility.
- **UI:** Simplified the error message to be more direct.
## [0.3.6] - 2025-12-09

### Fixed
- **Configuration:** Restored missing configuration settings that were accidentally removed.
- **Persistence:** Refactored credential loading logic to ensure reliable Client ID restoration on app launch.
## [0.3.5] - 2025-12-09

### Changed
- **UI:** Enforced a strictly gapless table layout for the file list.
- **UI:** Updated status colors: Pending (Red), Processing (Amber), Done (Green).
## [0.3.4] - 2025-12-09

### Fixed
- **Credentials:** Fixed an issue where the OAuth Client ID was not being saved/loaded correctly on page reload.
- **UI:** Masked the Client ID input field for security and added a show/hide toggle.
## [0.3.3] - 2025-12-09

### Changed
- **UI:** Transformed the file list into a unified table-like view with minimal spacing between items, maximizing screen real estate.
## [0.3.2] - 2025-12-09

### Changed
- **UI:** Reduced vertical spacing in file list for a tighter, cleaner layout.
- **UI:** Removed excessive padding around file items.
## [0.3.1] - 2025-12-09

### Changed
- **UI:** Revamped file list to be more compact. Account selection and status are now inline with the file details.
- **UI:** Step 2 account list now displays horizontally for better space usage.
- **UI:** Renamed "Statement Organizer" to "List of uploaded statements".
- **UX:** Added expand/collapse arrow to file items for clearer affordance.
- **Support:** Updated instructions to explicitly mention ZIP support.
## [0.3.0] - 2025-12-09

### Added
- **OAuth2 Integration:** Implemented secure "Sign in with Google" for Google Sheets access. This replaces the insecure API Key method.
- **Client ID Configuration:** Added setup fields for users to input their own OAuth Client ID.
- **Write Permissions:** App can now write directly to regular Google Sheets (no longer requires "Public Edit" link).

### Changed
- **Config:** Updated version to v0.3.0 Beta (OAuth).
- **UI:** Replaced "API Key Verification" with a Credentials Initialization step.
## [0.2.4] - 2025-12-09

### Added
- **Accordion Preview:** Files in the Organizer now expand to show their preview table inline, replacing the Step 4 section.
- **Mac Filtering:** Automated filtering of `__MACOSX` folders and hidden system files in ZIP uploads.

### Changed
- **UI:** Removed the standalone "Preview & Import" section in favor of the inline accordion view.
## [0.2.3] - 2025-12-09

### Fixed
- **Preview Reliability:** Decoupled preview logic from global UI state to ensure "Preview" always works for the selected file.
- **Inline Errors:** Preview errors (like missing account selection) now appear inline within the file card instead of a global popup.
## [0.2.2] - 2025-12-09

### Fixed
- **Preview Button:** Fixed an issue where clicking "Preview" didn't load the transaction table correctly due to dropdown state mismatch.
- **UX:** Added smooth scrolling to the preview section when a file is selected.
## [0.2.1] - 2025-12-09

### Added
- **API Key Visibility Toggle:** Added a "Show/Hide" eye icon next to the API key input field.
## [0.2.0] - 2025-12-09

### Added
- **Multi-File Upload:** You can now drag & drop multiple PDFs/images or a ZIP file.
- **Statement Organizer:** A new view (Step 3a) lists all your uploaded files, their status, and suggested accounts.
- **Batch Processing:** Extract data from all files in one go and verify them individually or in bulk.
- **Zip Support:** Automatically unzips files in the browser for processing.

### Improved
- **Organizer View:** "Process Queue", "Preview", and "Clear" actions for better workflow management.
## [0.1.5] - 2025-12-09

### Security
- Removed sensitive documentation and deployment scripts from repository

### Added
- Display list of found "account sheets" in Step 2 after connection

## [0.1.4] - 2025-12-09

### Improved
- Step-aware inline status messages (Step 2 & 3)
- API key verification success message is clearer
- Better error handling for Gemini API quota exhaustion (429) errors with helpful links
- File upload feedback is now inline instead of global status

### Fixed
- Fixed an issue where API key verification success message was overwritten
- Improved internal code structure for file processing

## [0.1.3] - 2025-12-09

### Added
- CSV download as fallback when direct Google Sheets import fails
- Automatic detection of OAuth authentication errors
- Instructions popup after CSV download
- Filename includes account name and date

### Fixed
- Google Sheets API write operations now handled gracefully
- App automatically downloads CSV when API key authentication fails
- Users can now import data via CSV upload to Google Sheets

### Changed
- Import button now tries direct import first, falls back to CSV download
- Better error handling for authentication issues

## [0.1.2] - 2025-12-08

### Added
- Close button (×) on inline error and status messages for manual dismissal
- Better API key restriction detection with specific error messages

### Changed
- Error and status messages no longer auto-dismiss
- Users can now manually close messages by clicking the × button
- Improved error message layout with flexbox

### Fixed
- API key restriction errors now show helpful guidance
- Better detection of blocked API services

## [0.1.1] - 2025-12-08

### Added
- API key verification feature with "Test & Verify API Key" button
- Detailed error messages for API key issues (quota exceeded, API not enabled, etc.)
- Inline error messages for form fields instead of top-level notifications
- Automatic version display in footer

### Fixed
- Google Sheets API now requires API key parameter for all requests
- Updated Gemini model from `gemini-1.5-flash` to `gemini-2.0-flash` (current available version)
- Unified API key storage for both Gemini and Google Sheets APIs
- Improved error handling with specific guidance for common issues

### Changed
- API key label updated from "Gemini API Key" to "Google AI API Key" for clarity
- Error messages now appear inline below relevant fields with visual feedback
- Success messages auto-dismiss after 3-5 seconds


## [0.1.0] - 2025-12-08

### Added
- Initial beta release of Statement Consolidator
- AI-powered OCR using Gemini 1.5 Flash for transaction extraction
- Google Sheets integration with publicly editable sheets
- Account sheet detection using @ prefix identifier
- Intelligent deduplication based on date, amount, and description
- Fuzzy matching with Levenshtein distance algorithm (85% threshold)
- Smart account matching with user confirmation
- Drag & drop file upload for PDFs and images (max 10MB)
- Modern glassmorphic UI with dark theme
- Responsive design for mobile and desktop
- Transaction preview before import
- Support for bank accounts, credit cards, and e-wallets
- Create new account sheets on-the-fly
- Local storage for API key and last used sheet
- Privacy-first design - all processing in browser
- Comprehensive error handling and user feedback
- Loading states and animations

### Technical Details
- Standalone HTML/CSS/JavaScript web app
- No backend required
- Modular architecture with separate components:
  - Google Sheets API integration
  - OCR service with Gemini AI
  - Deduplication engine
  - Main application controller
- Configuration file for easy customization
- Complete documentation and README

### Known Limitations
- Requires Gemini API key (free tier available)
- Google Sheet must be publicly editable
- Large files (>10MB) not supported
- Single file processing only (no batch upload)
- No OAuth authentication (planned for future)

## [Unreleased]

### Planned Features
- OAuth authentication for Google Sheets
- Batch file upload
- Statement templates for common banks
- Export to CSV/Excel
- Multi-currency support
- Analytics dashboard
- Receipt scanning support
