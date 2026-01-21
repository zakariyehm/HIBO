# 🚀 Like & Pass Feature Setup Guide

## ⚠️ IMPORTANT: Database Setup Required

The Like & Pass buttons won't work until you create the database tables in Supabase.

## 📋 Step 1: Run SQL Schema

1. Go to your **Supabase Dashboard**
2. Click on **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the entire contents of `supabase-likes-schema.sql`
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. Wait for success message: "Success. No rows returned"

## ✅ What This Creates:

- **`likes` table** - Stores like/pass actions
- **`matches` table** - Stores mutual likes (matches)
- **RLS Policies** - Security for likes and matches
- **Automatic Match Detection** - Creates matches when both users like each other

## 🎯 After Setup:

Once the tables are created, the Like & Pass buttons will work automatically:
- ✅ Click "Like" → Saves like, checks for matches
- ✅ Click "Pass" → Saves pass, removes from list
- ✅ Match Detection → Shows notification if mutual like

## 🔍 Verify Setup:

After running the SQL, verify in Supabase:
1. Go to **Table Editor**
2. You should see **`likes`** table
3. You should see **`matches`** table

## 🐛 Common Errors:

### Error 1: "Could not find the table 'public.likes' in the schema cache"
**Solution:** The `likes` table hasn't been created yet. Run `supabase-likes-schema.sql` first!

### Error 2: "new row violates row-level security policy for table 'matches'"
**Solution:** The RLS policy for match creation is missing. Run `supabase-fix-matches-rls.sql` to fix this!

---

**Need Help?** Check `supabase-likes-schema.sql` for the complete SQL script.

