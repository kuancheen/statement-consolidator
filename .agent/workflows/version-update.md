---
description: STANDARD PROTOCOL (Run on EVERY change): Automate version bump, README/CHANGELOG update, copyright check, and git release.
---

# Version Update Workflow

This workflow automates the steps needed to release a new version of the Statement Consolidator app, including updating the version constant, verifying README/CHANGELOG consistency, and performing the git commit/tag/push.

## Steps

1. **Update version constant** in `config.js`.
2. **Update script version query parameters** in `index.html` and `config.js?v=...` inclusion to match the new version.
3. **Add changelog entry** at the top of `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.
4. **Synchronize README version badge** - ensure the badge matches `config.js`.
5. **Check/Update Copyright Year**
   - Verify current year metadata in `index.html` footer and comment header.
   - If `current_year > 2025`, update formats to `2025-[Current Year]`.
6. **Deploy to GitHub**
   // turbo
   ```bash
   git add .
   git commit -m "chore: bump version to v[VERSION] - [Brief Description]"
   git push
   ```
7. **Tag the release** (Optional for major/minor)
   // turbo
   ```bash
   git tag v[VERSION]
   git push origin v[VERSION]
   ```

> [!TIP]
> Use the `// turbo` annotation for assistant-led automation of terminal commands.
