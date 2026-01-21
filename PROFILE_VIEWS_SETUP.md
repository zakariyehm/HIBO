# 👁️ Profile Views Feature Setup Guide (Tinder-style)

## Overview

This feature ensures that once a user views another user's profile, that profile will no longer appear in their feed - just like Tinder! This prevents users from seeing the same profiles repeatedly.

## 📋 Step 1: Run SQL Schema

1. Go to your **Supabase Dashboard**
2. Click on **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the entire contents of `supabase-profile-views-schema.sql`
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. Wait for success message: "Success. No rows returned"

## ✅ What This Creates:

- **`profile_views` table** - Tracks which profiles each user has viewed
- **RLS Policies** - Security policies for profile_views table
- **Indexes** - For better query performance
- **Constraint** - Prevents users from viewing their own profile

## 🎯 How It Works:

### When a Profile is Viewed:

1. **Opening a Profile:**
   - When User A opens User B's profile (from menu or card)
   - The view is automatically recorded in the database
   - User B will no longer appear in User A's feed

2. **Liking a User:**
   - When User A likes User B
   - The view is automatically recorded
   - User B disappears from the feed immediately

3. **Passing a User:**
   - When User A passes User B
   - The view is automatically recorded
   - User B disappears from the feed immediately

### What Happens After Viewing:

- ✅ Viewed profile is immediately removed from your feed
- ✅ Viewed profile will not appear in future feed loads
- ✅ Feed automatically refreshes when you return to the home screen
- ✅ Works just like Tinder - once viewed, never shown again

## 🔍 Verify Setup:

After running the SQL, verify in Supabase:
1. Go to **Table Editor**
2. You should see **`profile_views`** table with columns:
   - `id` (UUID)
   - `viewer_id` (UUID) - User who viewed
   - `viewed_id` (UUID) - User who was viewed
   - `created_at` (Timestamp)

## 🐛 Common Errors:

### Error 1: "Could not find the table 'public.profile_views' in the schema cache"
**Solution:** The `profile_views` table hasn't been created yet. Run `supabase-profile-views-schema.sql` first!

### Error 2: "new row violates row-level security policy"
**Solution:** The RLS policies haven't been created. Make sure you ran the complete SQL script including the RLS policies.

## 📝 Technical Details:

### Database Functions Added:
- `recordProfileView(userId)` - Records that a profile was viewed
- `getViewedProfiles()` - Gets list of viewed profile IDs

### Updated Functions:
- `getAllUserProfiles()` - Now filters out viewed profiles (in addition to blocked users)

### UI Behavior:
- Feed automatically refreshes when returning to home screen
- Viewed profiles disappear immediately after viewing
- Works seamlessly with like/pass actions

## 🎨 User Experience:

1. **User sees profile in feed** → Clicks to view
2. **Profile opens** → View is recorded automatically
3. **User goes back** → Feed refreshes, viewed profile is gone
4. **User likes/passes** → View is recorded, profile disappears immediately

## ✅ Testing:

1. View a user's profile from the feed
2. Go back to the feed
3. Verify the viewed profile is no longer visible
4. Like or pass a user
5. Verify they disappear immediately
6. Refresh the app - they should still be gone

---

**Need Help?** Check `supabase-profile-views-schema.sql` for the complete SQL script.

