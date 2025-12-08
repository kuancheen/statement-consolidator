# Changelog

All notable changes to the Statement Consolidator project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
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
