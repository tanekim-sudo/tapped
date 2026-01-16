# Database Setup Checker

Use this to verify your database is set up correctly.

## Quick Check

1. Open your browser's Developer Console (F12)
2. Look for one of these messages:

### ✅ If you see: "Database Connected"
- Your database is working!
- Users are being stored in Supabase
- You have a real social network

### ⚠️ If you see: "Supabase credentials not found"
- You need to set up environment variables
- See `QUICK_DATABASE_SETUP.md` Step 4

### ❌ If you see errors:
- Check that SQL schema was run
- Verify your Supabase project is active
- Check environment variable names are correct

## Manual Verification

1. **Check Environment Variables:**
   - Local: Check `.env.local` file exists
   - Vercel: Check Settings → Environment Variables

2. **Check Database Tables:**
   - Go to Supabase dashboard
   - Click "Table Editor"
   - You should see: `users`, `profiles`, `connections`

3. **Test User Creation:**
   - Sign up in your app
   - Check Supabase → Table Editor → `users`
   - Your user should appear there

4. **Test User Discovery:**
   - Create 2 accounts
   - Both should appear in search/discovery
   - If not, database isn't connected

## Common Issues

### Issue: "Table doesn't exist"
**Fix:** Run the SQL schema in Supabase SQL Editor

### Issue: "Permission denied"
**Fix:** Check RLS policies in Supabase → Authentication → Policies

### Issue: Users created but not visible
**Fix:** Check that `getDiscoveryUsers` is using database, not localStorage
