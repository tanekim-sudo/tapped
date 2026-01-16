# Quick Database Setup - Make Tapped a Real Social Network

Right now your app uses localStorage (browser-only storage), so users can't see each other. Follow these steps to set up a real database:

## ⚡ Quick Setup (5 minutes)

### Step 1: Create Supabase Account & Project

1. Go to **https://supabase.com**
2. Click **"Start your project"** (free tier is fine)
3. Sign up with GitHub (easiest) or email
4. Click **"New Project"**
5. Fill in:
   - **Name**: `tapped` 
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
6. Click **"Create new project"**
7. Wait 2-3 minutes for setup

### Step 2: Get Your Keys

1. In your Supabase dashboard, click **Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 3: Create Database Tables

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase/schema.sql` in your project
4. Copy **ALL** the contents
5. Paste into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see: ✅ "Success. No rows returned"

### Step 4: Add Environment Variables

#### For Local Development:

Create a file named `.env.local` in your project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ANTHROPIC_API_KEY=your-claude-key-here
```

**Important**: Replace the values with your actual keys from Step 2!

#### For Vercel (Production):

1. Go to **vercel.com** → Your project → **Settings** → **Environment Variables**
2. Add these three variables:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key  
   - `VITE_ANTHROPIC_API_KEY` = your Claude API key
3. Select **Production, Preview, Development** for each
4. Click **Save**
5. **Redeploy** your app (Vercel → Deployments → Redeploy)

### Step 5: Test It!

1. **Restart your dev server** (stop and run `npm run dev` again)
2. Open the app in your browser
3. Sign up for a new account
4. Go to your Supabase dashboard → **Table Editor** → **users**
5. You should see your new user! 🎉

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] SQL schema run successfully  
- [ ] `.env.local` file created with correct values
- [ ] Dev server restarted
- [ ] Can see users in Supabase Table Editor
- [ ] Multiple users can see each other in the app

## 🐛 Troubleshooting

### "Supabase credentials not found" in console
- Check `.env.local` file exists and has correct variable names
- Restart dev server after creating `.env.local`
- Make sure no typos in variable names

### Users not appearing in database
- Check browser console for errors
- Verify SQL schema was run successfully
- Check Supabase dashboard → Table Editor to see if tables exist

### Can't see other users in app
- Make sure both users are in the database (check Supabase Table Editor)
- Verify environment variables are set correctly
- Check browser network tab for API errors

## 🎯 What This Enables

Once set up, your app becomes a **real social network**:
- ✅ All users stored in shared database
- ✅ Users can discover each other
- ✅ Data persists across devices
- ✅ AI-powered search works across all users
- ✅ Real-time updates possible

## Need Help?

Check the detailed guide: `DATABASE_SETUP.md`
