# Deploy Tapped to Vercel

## Quick Deploy Steps

### 1. Make sure code is pushed to GitHub
```bash
git add -A
git commit -m "Ready for Vercel deployment"
git push
```

### 2. Deploy to Vercel

**Option A: Via Vercel Dashboard (Easiest)**

1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Select your GitHub repository: `tanekim-sudo/tapped`
4. Click **"Import"**
5. Configure:
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
6. Click **"Deploy"**

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts, then deploy to production:
vercel --prod
```

### 3. Add Environment Variables

**IMPORTANT:** After first deployment, add environment variables:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

```
VITE_SUPABASE_URL = your_supabase_url
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
VITE_ANTHROPIC_API_KEY = your_claude_api_key
```

4. Select **Production, Preview, Development** for each
5. Click **Save**
6. **Redeploy** (Deployments → Latest → Redeploy)

### 4. Your App is Live!

Your app will be at: `https://your-project-name.vercel.app`

## Troubleshooting

### Blank Screen After Deploy

1. Check browser console (F12) for errors
2. Verify environment variables are set
3. Check Vercel build logs for errors
4. Make sure `vercel.json` exists with correct config

### Build Fails

- Check that all dependencies are in `package.json`
- Verify `npm run build` works locally
- Check Vercel build logs for specific errors

### Environment Variables Not Working

- Make sure variable names start with `VITE_`
- Redeploy after adding variables
- Check that variables are enabled for the right environments

## Next Steps

After deployment:
1. Set up Supabase database (see `QUICK_DATABASE_SETUP.md`)
2. Add Supabase environment variables to Vercel
3. Test the app at your Vercel URL
4. Share the URL with users!
