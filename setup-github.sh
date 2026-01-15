#!/bin/bash

# Setup script for pushing Tapped to GitHub
# Usage: ./setup-github.sh

echo "🚀 Setting up Tapped for GitHub deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git branch -M main
else
    echo "✅ Git repository already initialized"
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "⚠️  No changes to commit"
else
    echo "💾 Creating initial commit..."
    git commit -m "Initial commit: Tapped networking protocol app"
fi

# Check if remote exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ Remote 'origin' already exists"
    echo "Current remote URL: $(git remote get-url origin)"
    read -p "Do you want to update the remote URL? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter new GitHub repository URL: " repo_url
        git remote set-url origin "$repo_url"
    fi
else
    echo "🔗 Adding GitHub remote..."
    read -p "Enter your GitHub repository URL (e.g., https://github.com/tanekim-sudo/tapped.git): " repo_url
    
    if [ -z "$repo_url" ]; then
        echo "⚠️  No URL provided. You can add it later with:"
        echo "   git remote add origin https://github.com/tanekim-sudo/tapped.git"
    else
        git remote add origin "$repo_url"
        echo "✅ Remote added: $repo_url"
    fi
fi

echo ""
echo "📤 Ready to push! Run these commands:"
echo ""
echo "   # If repository doesn't exist on GitHub yet, create it first at:"
echo "   # https://github.com/new"
echo ""
echo "   git push -u origin main"
echo ""
echo "✨ After pushing, deploy to Vercel:"
echo "   1. Go to https://vercel.com/new"
echo "   2. Import your GitHub repository"
echo "   3. Add GEMINI_API_KEY environment variable"
echo "   4. Deploy!"
echo ""
