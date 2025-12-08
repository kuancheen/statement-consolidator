#!/bin/bash
# Deploy Statement Consolidator to GitHub
# Run this script after creating the repository on GitHub

echo "🚀 Deploying Statement Consolidator to GitHub..."
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Please run this script from the statement-consolidator directory"
    exit 1
fi

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ Error: GitHub username is required"
    exit 1
fi

echo ""
echo "📝 Repository URL: https://github.com/$GITHUB_USERNAME/statement-consolidator"
echo ""

# Add remote
echo "🔗 Adding remote repository..."
git remote add origin "https://github.com/$GITHUB_USERNAME/statement-consolidator.git" 2>/dev/null || {
    echo "⚠️  Remote already exists, updating..."
    git remote set-url origin "https://github.com/$GITHUB_USERNAME/statement-consolidator.git"
}

# Rename branch to main
echo "🌿 Setting branch to main..."
git branch -M main

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully deployed to GitHub!"
    echo ""
    echo "📍 Your repository: https://github.com/$GITHUB_USERNAME/statement-consolidator"
    echo ""
    echo "🌐 Next steps:"
    echo "1. Go to: https://github.com/$GITHUB_USERNAME/statement-consolidator/settings/pages"
    echo "2. Under 'Source', select branch: main"
    echo "3. Select folder: / (root)"
    echo "4. Click 'Save'"
    echo ""
    echo "🎉 Your app will be live at:"
    echo "   https://$GITHUB_USERNAME.github.io/statement-consolidator/"
    echo ""
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "1. Repository exists on GitHub"
    echo "2. You're logged in to GitHub"
    echo "3. You have permission to push"
    echo ""
    echo "You may need to authenticate. Try:"
    echo "  git push -u origin main"
fi
