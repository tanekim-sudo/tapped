# Deploying Tapped to Vercel

## Prerequisites
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- A Claude API key from Anthropic Console (https://console.anthropic.com/)

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to your project directory**:
   ```bash
   cd tapped
   ```

4. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   
   - Follow the prompts:
     - Set up and deploy? **Yes**
     - Which scope? (Select your account)
     - Link to existing project? **No** (for first deployment)
     - Project name? (Press Enter for default or enter custom name)
     - Directory? (Press Enter for `./`)
     - Override settings? **No**

5. **Add Environment Variable**:
   ```bash
   vercel env add ANTHROPIC_API_KEY
   ```
   - Select environment: **Production, Preview, Development** (or just Production)
   - Enter your Claude API key when prompted

6. **Redeploy with environment variable**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub (Recommended for Continuous Deployment)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import Project to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
   - **Install Command**: `npm install` (default)

4. **Add Environment Variable**:
   - In the project settings, go to **Settings → Environment Variables**
   - Add a new variable:
     - **Name**: `ANTHROPIC_API_KEY`
     - **Value**: Your Claude API key (get it from https://console.anthropic.com/)
     - **Environments**: Select Production, Preview, and Development
   - Click **Save**

5. **Deploy**:
   - Click **Deploy**
   - Vercel will automatically build and deploy your app
   - Your app will be live at `https://your-project-name.vercel.app`

### Option 3: Deploy via Vercel Dashboard

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Link your project**:
   ```bash
   vercel link
   ```
   - Follow prompts to link to existing project or create new one

3. **Add Environment Variable via Dashboard**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to **Settings → Environment Variables**
   - Add `ANTHROPIC_API_KEY` with your Claude API key value
   - Select all environments (Production, Preview, Development)

4. **Deploy**:
   ```bash
   vercel --prod
   ```

## Environment Variables

The app requires the following environment variable:

- **`ANTHROPIC_API_KEY`**: Your Anthropic Claude API key
  - Get it from: [Anthropic Console](https://console.anthropic.com/)
  - This is used for AI-powered intro message generation

**Important**: 
- For Vercel, you can use either `ANTHROPIC_API_KEY` or `VITE_ANTHROPIC_API_KEY`
- The app will check both automatically
- Make sure to add it in Vercel's Environment Variables settings

## Post-Deployment

1. **Verify Deployment**:
   - Visit your deployment URL
   - Check that the app loads correctly
   - Test the AI intro generation feature

2. **Custom Domain** (Optional):
   - Go to your project settings in Vercel
   - Navigate to **Domains**
   - Add your custom domain
   - Follow DNS configuration instructions

3. **Monitor Deployments**:
   - All deployments are logged in the Vercel dashboard
   - You can view build logs and deployment status
   - Set up deployment notifications if needed

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18+ by default)

### Environment Variables Not Working
- Make sure variable is named `ANTHROPIC_API_KEY` or `VITE_ANTHROPIC_API_KEY`
- Redeploy after adding environment variables
- Check that variable is enabled for the correct environment (Production/Preview/Development)

### API Errors
- Verify your Claude API key is valid
- Check API quota/limits in Anthropic Console
- Review browser console for specific error messages

## Continuous Deployment

Once connected to GitHub:
- Every push to `main` branch = Production deployment
- Every push to other branches = Preview deployment
- Pull requests = Preview deployment with unique URL

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
