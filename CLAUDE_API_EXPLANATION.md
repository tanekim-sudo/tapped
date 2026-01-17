# Why We Use a Claude Proxy (Security Explanation)

## The Problem: API Key Security

**NEVER put API keys in client-side code.** Here's why:

1. **Anyone can see it**: Client-side JavaScript is visible to anyone who opens the browser's developer tools
2. **Easy to steal**: Your API key can be extracted from the network tab or source code
3. **Cost risk**: Stolen keys can be used to make expensive API calls on your account
4. **No revocation**: Once exposed, you must rotate the key

## The Solution: Server-Side Proxy

The `/api/claude-proxy.ts` file runs **server-side only** on Vercel. This means:

- ✅ Your API key stays secure (never sent to the browser)
- ✅ All Claude API calls go through your server
- ✅ You can add rate limiting, logging, and security checks
- ✅ Keys are stored in Vercel environment variables (encrypted)

## How It Works

```
Browser (Client)          →  /api/claude-proxy (Server)  →  Claude API
   ↓                            ↓                              ↓
No API key here          API key stored here            Your API key
```

1. **Frontend** calls `/api/claude-proxy` (no key needed)
2. **Server** (`api/claude-proxy.ts`) reads `ANTHROPIC_API_KEY` from environment
3. **Server** makes the actual Claude API call with your key
4. **Server** returns the result to the frontend

## Setting Up Your API Key

### For Local Development:

1. Create a `.env` file in your project root:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

2. The proxy will automatically use it when running locally

### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Your Claude API key (starts with `sk-ant-...`)
   - **Environments**: Production, Preview, Development
4. Click **Save**
5. Redeploy your app

## Verifying It's Working

1. **Check the API endpoint exists**: Visit `https://your-app.vercel.app/api/claude-proxy` - should return "Method not allowed" (not 404)

2. **Check environment variable**: In Vercel dashboard → Settings → Environment Variables, verify `ANTHROPIC_API_KEY` is set

3. **Test in app**: 
   - Set qualification questions on a profile
   - Try to connect with someone
   - The application modal should appear
   - Submit an application
   - Check the Notes tab - you should see ranked applicants

4. **Check browser console**: Should NOT see any API key values

5. **Check Vercel logs**: Go to Vercel dashboard → Your deployment → Functions tab → View logs. You should see Claude API calls (without the key being logged)

## Troubleshooting

### "API key not configured" error:
- ✅ Check Vercel environment variables are set
- ✅ Make sure you redeployed after adding the variable
- ✅ Check the variable name is exactly `ANTHROPIC_API_KEY`

### "500 Internal Server Error":
- ✅ Check Vercel function logs for detailed error
- ✅ Verify your API key is valid (starts with `sk-ant-`)
- ✅ Check you have credits/quota in Anthropic console

### API calls work locally but not on Vercel:
- ✅ Environment variable might not be set in Vercel
- ✅ Need to redeploy after adding environment variable
- ✅ Check Vercel function logs for errors

## Why Not Use the Key Directly?

If we put the key in the frontend:
```javascript
// ❌ BAD - Anyone can see this!
const apiKey = "sk-ant-...";
```

Anyone could:
1. Open browser dev tools
2. Copy your API key
3. Use it to make unlimited API calls
4. Drain your account balance

The proxy prevents this by keeping the key server-side only.
