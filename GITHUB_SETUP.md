# GitHub Repository Setup for Tapped

## Quick Setup Guide

### Step 1: Create Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `tapped` (or your preferred name)
3. Description: "Networking protocol for high-bandwidth individuals"
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

### Step 2: Push Your Code

#### Option A: Using the Setup Script (Easiest)

**Windows:**
```bash
setup-github.bat
```

**Mac/Linux:**
```bash
chmod +x setup-github.sh
./setup-github.sh
```

#### Option B: Manual Setup

```bash
# Initialize git (if not already done)
git init
git branch -M main

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Tapped networking protocol app"

# Add your GitHub repository as remote
git remote add origin https://github.com/tanekim-sudo/tapped.git

# Push to GitHub
git push -u origin main
```

### Step 3: Verify on GitHub

1. Go to https://github.com/tanekim-sudo/tapped
2. Verify all files are uploaded
3. Check that `.env.local` is NOT in the repository (it should be in .gitignore)

### Step 4: Deploy to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `tanekim-sudo/tapped`
4. Click "Import"
5. Add environment variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Claude API key (get from https://console.anthropic.com/)
   - Environments: All (Production, Preview, Development)
6. Click "Deploy"

## Repository URL Format

Your repository URL will be:
```
https://github.com/tanekim-sudo/tapped.git
```

Or if you use SSH:
```
git@github.com:tanekim-sudo/tapped.git
```

## Troubleshooting

### "Repository not found"
- Make sure you've created the repository on GitHub first
- Check that the repository name matches exactly
- Verify you have access to the repository

### "Authentication failed"
- Use a Personal Access Token instead of password
- Generate one at: https://github.com/settings/tokens
- Use token as password when prompted

### "Remote origin already exists"
```bash
# Check current remote
git remote -v

# Update remote URL
git remote set-url origin https://github.com/tanekim-sudo/tapped.git
```

## Files Included

The following files will be pushed to GitHub:
- ✅ All source code (`App.tsx`, components, services, etc.)
- ✅ Configuration files (`package.json`, `vite.config.ts`, `tsconfig.json`)
- ✅ Documentation (`README.md`, `DEPLOY.md`, etc.)
- ✅ Build configuration (`vercel.json`)

The following files will NOT be pushed (in `.gitignore`):
- ❌ `node_modules/`
- ❌ `.env.local` (contains your API key - keep it secret!)
- ❌ `dist/` (build output)
- ❌ `.DS_Store` and other system files

## Next Steps After Pushing

1. ✅ Code is on GitHub
2. ✅ Deploy to Vercel (see Step 4 above)
3. ✅ Set up continuous deployment (automatic on Vercel)
4. ✅ Share your live app URL!

Your app will be live at: `https://tapped-xxx.vercel.app` (or your custom domain)
