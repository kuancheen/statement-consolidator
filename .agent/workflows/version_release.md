---
description: Automate version bump, README update, and git release workflow
---

# Version Release Workflow

This workflow automates the steps needed to release a new version of the Statement Consolidator app, including updating the version constant, ensuring the README badge matches, and performing the git commit/tag/push.

## Steps

1. **Update version constant** in `config.js` (manual edit or script).
2. **Add changelog entry** at the top of `CHANGELOG.md` (manual edit).
3. **Synchronize README version badge** – ensure the README badge matches the version in `config.js`. This step extracts the version from `config.js` and updates the badge if it differs.
   ```bash
   # Extract version from config.js
   VERSION=$(grep -Po "VERSION: '\\K[^']+" config.js)
   # Current badge version in README
   CURRENT=$(grep -Po "version-[0-9]\\.[0-9]\\.[0-9]-blue" README.md | head -n1)
   # If they differ, replace the badge
   if [[ "$CURRENT" != "version-${VERSION}-blue" ]]; then
     sed -i '' "s/version-[0-9]\\.[0-9]\\.[0-9]-blue/version-${VERSION}-blue/" README.md
   fi
   ```
4. **Commit changes**
   // turbo
   ```bash
   git add .
   git commit -m "chore: bump version to v0.3.43 – UI polish & button lock fixes"
   ```
5. **Tag the release**
   // turbo
   ```bash
   git tag v0.3.43
   ```
6. **Push commit and tag**
   // turbo
   ```bash
   git push && git push --tags
   ```

> **Note:** Steps marked with `// turbo` can be auto‑executed by the assistant if desired.
