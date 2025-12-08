---
description: Update version, changelog, and deploy to GitHub
---

1. **Update Version Number**:
   - Increment `VERSION` in `config.js`.
   - Update the version string in the footer of `index.html`.

2. **Update Changelog**:
   - Add a new section in `CHANGELOG.md` for the new version.
   - List all Added, Changed, or Fixed items.

3. **Deploy**:
   - Run the following command (replace VERSION and DESC):
```bash
git add . && git commit -m "v[VERSION] - [Brief Description]" && git push
```
