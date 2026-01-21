# 🚫 User Blocking Feature Setup Guide

## Overview

This feature allows users to block other users. When User A blocks User B:
- User A will no longer see User B in their feed (home screen)
- User A will no longer see User B in their matches
- User B will be immediately removed from User A's view

## 📋 Step 1: Run SQL Schema

1. Go to your **Supabase Dashboard**
2. Click on **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the entire contents of `supabase-blocks-schema.sql`
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. Wait for success message: "Success. No rows returned"

## ✅ What This Creates:

- **`blocks` table** - Stores user blocking relationships
- **RLS Policies** - Security policies for blocks table
- **Indexes** - For better query performance
- **Constraint** - Prevents users from blocking themselves

## 🎯 How It Works:

### Blocking a User:

1. **From Profile View:**
   - Navigate to any user's profile
   - Click the block icon (🚫) in the top right corner
   - Confirm the block action
   - User will be blocked and removed from your feed

2. **From Post Card:**
   - Click the three dots menu (⋯) on any user's post card
   - Select "Block"
   - Confirm the block action
   - User will be blocked and removed from your feed

### What Happens After Blocking:

- ✅ Blocked user is immediately removed from your feed
- ✅ Blocked user is removed from your matches list
- ✅ Blocked user will not appear in future feed loads
- ✅ You can still unblock users later (if needed)

## 🔍 Verify Setup:

After running the SQL, verify in Supabase:
1. Go to **Table Editor**
2. You should see **`blocks`** table with columns:
   - `id` (UUID)
   - `blocker_id` (UUID) - User who blocked
   - `blocked_id` (UUID) - User who was blocked
   - `created_at` (Timestamp)

## 🐛 Common Errors:

### Error 1: "Could not find the table 'public.blocks' in the schema cache"
**Solution:** The `blocks` table hasn't been created yet. Run `supabase-blocks-schema.sql` first!

### Error 2: "new row violates row-level security policy"
**Solution:** The RLS policies haven't been created. Make sure you ran the complete SQL script including the RLS policies.

## 📝 Technical Details:

### Database Functions Added:
- `blockUser(userId)` - Blocks a user
- `unblockUser(userId)` - Unblocks a user  
- `getBlockedUsers()` - Gets list of blocked user IDs
- `isUserBlocked(userId)` - Checks if a user is blocked

### Updated Functions:
- `getAllUserProfiles()` - Now filters out blocked users
- `getUserMatches()` - Now filters out blocked users

## 🎨 UI Changes:

1. **View Profile Screen:**
   - Added block button (🚫) in header (top right)
   - Shows confirmation dialog before blocking

2. **Post Card Component:**
   - Block option in the three-dots menu
   - Shows confirmation dialog before blocking

## ✅ Testing:

1. Block a user from their profile
2. Verify they disappear from your feed
3. Verify they disappear from your matches (if matched)
4. Refresh the app - they should still be blocked

---

**Need Help?** Check `supabase-blocks-schema.sql` for the complete SQL script.

