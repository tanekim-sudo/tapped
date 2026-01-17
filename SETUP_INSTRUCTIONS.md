# Complete Setup Instructions for Tapped App

## 🚀 Getting Your App Fully Functional

Follow these steps in order to get all features working:

### Step 1: Run Database Migrations

**CRITICAL**: Your database is missing required columns and tables. You MUST run the schema migration.

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the **ENTIRE** contents of `supabase/schema.sql`
4. Click **Run** to execute all migrations

This will:
- ✅ Add `connected_user_id` column to `connections` table
- ✅ Add `profile_id` column to `connections` table  
- ✅ Create `messages` table for real-time chat
- ✅ Create `typing_indicators` table
- ✅ Add all necessary indexes and RLS policies

### Step 2: Enable Realtime for Chat

For real-time messaging to work:

1. In Supabase Dashboard, go to **Database** → **Replication**
2. Find the `messages` table
3. Toggle **Enable Realtime** to ON
4. Find the `typing_indicators` table  
5. Toggle **Enable Realtime** to ON

Alternatively, run this SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
```

### Step 3: Verify Environment Variables

Make sure your `.env` file (or Vite env vars) has:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4: Test the Features

After running migrations:

1. **Login/Register** - Should work without errors
2. **Create/Edit Profiles** - Should save to database
3. **Search & Connect** - Should create connections
4. **Messages Tab** - Should load without blank screen
5. **Real-time Chat** - Messages should appear instantly
6. **Voice/Video Calls** - Should initiate (requires browser permissions)

### Step 5: Fix Remaining Issues

If you still see errors:

#### Database Column Errors (400 errors)
- **Solution**: Run Step 1 (Database Migrations) - this fixes the `connected_user_id` errors

#### "onSendMessage is not defined" Error
- **Solution**: Clear browser cache and rebuild:
  ```bash
  npm run build
  ```
  Then hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

#### Messages Not Appearing
- **Check**: Did you run Step 1 and Step 2?
- **Check**: Are you connected to the correct Supabase project?
- **Check**: Browser console for specific errors

#### Calls Not Working
- **Check**: Browser permissions for microphone/camera
- **Note**: WebRTC requires HTTPS in production (works on localhost for dev)

### Step 6: Production Deployment

For production:

1. **Install Tailwind properly** (not via CDN):
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

2. **Set up proper environment variables** in your hosting platform

3. **Enable HTTPS** (required for WebRTC calls)

4. **Set up a signaling server** for WebRTC (currently using localStorage fallback)

## 📋 Feature Checklist

- [ ] Database migrations run successfully
- [ ] Realtime enabled for messages and typing_indicators
- [ ] Login/Register works
- [ ] Profiles can be created/edited
- [ ] Search and discovery works
- [ ] Connections can be made
- [ ] Messages tab loads without errors
- [ ] Real-time chat works (messages appear instantly)
- [ ] Typing indicators work
- [ ] Voice calls work (with permissions)
- [ ] Video calls work (with permissions)

## 🐛 Common Issues & Solutions

### "connected_user_id column not found"
**Fix**: Run Step 1 - Database Migrations

### "Messages table does not exist"  
**Fix**: Run Step 1 - Database Migrations

### "Realtime not working"
**Fix**: Run Step 2 - Enable Realtime

### Blank screen on Messages tab
**Fix**: 
1. Run database migrations
2. Check browser console for errors
3. Verify Supabase connection

### Calls not connecting
**Fix**: 
1. Grant browser permissions for mic/camera
2. Check browser console for WebRTC errors
3. Note: Full WebRTC requires a signaling server in production

## 🎯 Next Steps After Setup

Once everything is working:

1. **Test with two users** - Open app in two browsers to test real-time chat
2. **Test calls** - Try voice and video calls between two users
3. **Customize** - Adjust UI, add features, etc.
4. **Deploy** - Set up production environment

## 📞 Need Help?

If you're still having issues:
1. Check browser console for specific error messages
2. Verify all migrations ran successfully in Supabase
3. Check that Realtime is enabled
4. Make sure environment variables are set correctly
