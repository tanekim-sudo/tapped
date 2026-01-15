<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ljMyFcwaTqUy_y5ttfqEdDdRgBRkvwE0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key:
   ```bash
   # Create .env.local file
   echo "GEMINI_API_KEY=your-api-key-here" > .env.local
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions, or [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for a quick start.

**Quick version:**
1. Push code to GitHub
2. Import to Vercel at https://vercel.com/new
3. Add `GEMINI_API_KEY` environment variable
4. Deploy!

Your app will be live at `https://your-project.vercel.app`
