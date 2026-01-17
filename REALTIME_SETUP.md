# How to Enable Realtime in Supabase

## Step-by-Step Instructions

### Method 1: Using Supabase Dashboard (Easiest)

1. **Go to your Supabase Dashboard**
   - Visit https://app.supabase.com
   - Select your project

2. **Navigate to Database → Replication**
   - In the left sidebar, click **Database**
   - Then click **Replication**

3. **Enable Realtime for Tables**
   - Find the `messages` table in the list
   - Toggle the switch to **ON** (it should turn green/blue)
   - Find the `typing_indicators` table
   - Toggle the switch to **ON** for this table too

4. **Verify**
   - Both tables should show as enabled
   - You should see a checkmark or green indicator

### Method 2: Using SQL Editor (Alternative)

If the dashboard method doesn't work, use SQL:

1. **Go to SQL Editor**
   - In Supabase Dashboard, click **SQL Editor** in the left sidebar

2. **Run this SQL:**
   ```sql
   -- Enable Realtime for messages table
   ALTER PUBLICATION supabase_realtime ADD TABLE messages;
   
   -- Enable Realtime for typing_indicators table
   ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
   ```

3. **Click Run** to execute

### Method 3: Check if Realtime is Already Enabled

Run this query to check:
```sql
SELECT 
  schemaname, 
  tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

You should see `messages` and `typing_indicators` in the results if they're enabled.

## What Realtime Does

Once enabled:
- ✅ Messages appear instantly when sent (no page refresh needed)
- ✅ Typing indicators work in real-time
- ✅ Multiple users can chat simultaneously
- ✅ Changes sync across all connected clients

## Troubleshooting

### Realtime Not Working?

1. **Check if tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('messages', 'typing_indicators');
   ```

2. **Check if Realtime is enabled:**
   - Go to Database → Replication
   - Verify both tables show as enabled

3. **Check browser console:**
   - Open browser DevTools (F12)
   - Look for WebSocket connection errors
   - Should see successful connection to Supabase Realtime

4. **Verify environment variables:**
   - Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
   - These are required for Realtime to work

### Still Not Working?

- Make sure you've run the database migrations (schema.sql)
- Check that your Supabase project has Realtime enabled (some plans require it)
- Verify your Supabase project is active and not paused

## Testing Realtime

1. Open your app in **two different browser windows** (or incognito + normal)
2. Log in as two different users
3. Send a message from one window
4. It should appear **instantly** in the other window without refreshing

That's it! Once Realtime is enabled, your chat will work in real-time.
