# GitHub Deployment Guide

## 🚀 Deploy to GitHub Pages

Follow these steps to deploy your Statement Consolidator app to GitHub Pages:

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Repository name: `statement-consolidator`
3. Description: `AI-powered financial statement consolidation tool`
4. Choose **Public** (required for free GitHub Pages)
5. **DO NOT** initialize with README (we already have one)
6. Click **"Create repository"**

### Step 2: Push Your Code

Run these commands in your terminal:

```bash
cd /Users/kuancheen/Documents/Github/statement-consolidator

# Add the remote repository (replace USERNAME with your GitHub username)
git remote add origin https://github.com/USERNAME/statement-consolidator.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Replace `USERNAME`** with your actual GitHub username!

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **"Settings"** tab
3. Click **"Pages"** in the left sidebar
4. Under **"Source"**:
   - Branch: Select **`main`**
   - Folder: Select **`/ (root)`**
5. Click **"Save"**

### Step 4: Wait for Deployment

- GitHub will build and deploy your site
- This takes 1-2 minutes
- You'll see a green checkmark when ready
- Your site will be available at:
  ```
  https://USERNAME.github.io/statement-consolidator/
  ```

### Step 5: Test Your Live App

1. Visit `https://USERNAME.github.io/statement-consolidator/`
2. You should see the Statement Consolidator app
3. Test with your API key
4. Everything should work exactly like the local version!

## 📝 Future Updates

When you make changes to the app:

```bash
# Stage your changes
git add .

# Commit with a message
git commit -m "Description of your changes"

# Push to GitHub
git push

# GitHub Pages will automatically redeploy (1-2 minutes)
```

## 🔧 Troubleshooting

### "Repository not found"
- Make sure you replaced `USERNAME` with your GitHub username
- Check that the repository exists on GitHub

### "Permission denied"
- You may need to authenticate with GitHub
- Use a Personal Access Token instead of password
- Or set up SSH keys

### "Page not found (404)"
- Wait a few minutes after enabling GitHub Pages
- Check that GitHub Pages is enabled in Settings → Pages
- Verify the branch is set to `main` and folder is `/ (root)`

### "App loads but doesn't work"
- This is a client-side app, so it should work fine
- Check browser console for errors (F12)
- Make sure you've entered your API key

## 🎯 What You'll Have

After deployment:
- ✅ Live web app accessible from anywhere
- ✅ Automatic HTTPS
- ✅ Free hosting on GitHub
- ✅ Automatic deployments on push
- ✅ Version control for all changes

## 📱 Share Your App

Once deployed, you can share the link with anyone:
```
https://USERNAME.github.io/statement-consolidator/
```

They can use it with their own:
- Google AI API key
- Google Sheets
- Bank statements

## 🔐 Security Notes

- API keys are stored in browser's localStorage
- No backend server = no server-side security risks
- Users' data never leaves their browser (except to Google APIs)
- Each user needs their own API key

## 📊 Monitor Usage

- GitHub Pages has bandwidth limits (100GB/month)
- Should be more than enough for this app
- Monitor at: Settings → Pages → Usage

---

**Ready to deploy?** Follow the steps above and your app will be live in minutes! 🚀
