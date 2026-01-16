# Database Setup Guide

This guide will help you set up Supabase as the live database for Tapped.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: tapped (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait 2-3 minutes for the project to be created

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 3: Run the Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

## Step 4: Configure Environment Variables

### For Local Development

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_ANTHROPIC_API_KEY=your_claude_api_key_here
```

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - `VITE_ANTHROPIC_API_KEY` = your Claude API key (if not already set)
4. Redeploy your application

## Step 5: Test the Connection

1. Start your local dev server: `npm run dev`
2. Sign up for a new account
3. Check your Supabase dashboard → **Table Editor** → **users** table
4. You should see your new user!

## How It Works

- **Without Supabase**: The app falls back to localStorage (works offline, but data is local only)
- **With Supabase**: All data is stored in the cloud database, making it a real social network

## Database Tables

- **users**: User accounts and stats
- **profiles**: Multiple profiles per user (Professional, Builder, etc.)
- **connections**: Network connections between users

## Security

The schema includes Row Level Security (RLS) policies that:
- Allow anyone to read user data (for discovery)
- Allow users to manage their own data
- You can customize these policies in Supabase dashboard → **Authentication** → **Policies**

## Troubleshooting

### "Supabase credentials not found"
- Make sure your `.env.local` file has the correct variable names
- Restart your dev server after adding env variables
- For Vercel, make sure env variables are set in project settings

### "Failed to create user"
- Check that the schema was run successfully
- Verify your Supabase project is active
- Check browser console for detailed error messages

### Data not syncing
- Check Supabase dashboard → **Table Editor** to see if data is being written
- Verify RLS policies allow the operations you're trying to perform
- Check browser network tab for API errors

## Next Steps

Once the database is set up:
- All users will be stored in Supabase
- Search will use Claude AI for intelligent matching
- Recommendations will be personalized
- Data persists across devices and sessions
