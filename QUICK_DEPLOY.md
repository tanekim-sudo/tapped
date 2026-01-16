# Quick Deploy to Vercel

## Fastest Method (GitHub + Vercel)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Ready for deployment"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Add environment variable: `ANTHROPIC_API_KEY` = your Claude API key
   - Click Deploy

3. **Done!** Your app is live 🚀

## Alternative: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variable
vercel env add ANTHROPIC_API_KEY

# Deploy to production
vercel --prod
```

## Get Your Claude API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy it and add to Vercel environment variables

That's it! See DEPLOY.md for detailed instructions.
