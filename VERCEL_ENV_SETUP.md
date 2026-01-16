# Vercel Environment Variables Setup

## Required Environment Variables

You need to add these to Vercel:

### 1. Claude API Key (You already have this!)
- **Name**: `VITE_ANTHROPIC_API_KEY` (or keep `ANTHROPIC_API_KEY` - both work)
- **Value**: Your Claude API key
- **Status**: ✅ You already have this as `ANTHROPIC_API_KEY`

### 2. Supabase URL (NEW - Add this!)
- **Name**: `VITE_SUPABASE_URL`
- **Value**: Your Supabase project URL (looks like `https://xxxxx.supabase.co`)
- **Where to find**: Supabase Dashboard → Settings → API → Project URL

### 3. Supabase Anon Key (NEW - Add this!)
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anon/public key (long string starting with `eyJ...`)
- **Where to find**: Supabase Dashboard → Settings → API → anon public key

## How to Add to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - Click **"Add New"**
   - Enter the variable name
   - Enter the value
   - Select **Production, Preview, Development** (all three)
   - Click **Save**
4. After adding all variables, **Redeploy**:
   - Go to **Deployments**
   - Click the three dots (⋯) on the latest deployment
   - Click **"Redeploy"**

## Quick Checklist

- [ ] `VITE_ANTHROPIC_API_KEY` or `ANTHROPIC_API_KEY` (you have this ✅)
- [ ] `VITE_SUPABASE_URL` (add this)
- [ ] `VITE_SUPABASE_ANON_KEY` (add this)
- [ ] All variables enabled for Production, Preview, Development
- [ ] Redeployed after adding variables

## Verify It's Working

After redeploying:
1. Visit your Vercel URL
2. You should see a **green "Database Connected"** banner at the top
3. Sign up for an account
4. Check Supabase → Table Editor → `users` table
5. Your user should appear there!

## Troubleshooting

### Still seeing "Database Not Configured" banner
- Make sure variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check for typos in the values
- Make sure you redeployed after adding variables

### "Table doesn't exist" error
- Go to Supabase → SQL Editor
- Run the SQL from `supabase/schema.sql`
- Make sure it completed successfully

### Variables not working
- Vite requires variables to start with `VITE_` to be exposed to the client
- Make sure you selected all environments (Production, Preview, Development)
- Redeploy after adding variables
