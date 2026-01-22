# 🚀 HIBO Database Setup - Guide Cusub

## Marka Database Cusub La Sameeyo

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign in ama Sign up
3. Click "New Project"
4. Fill in:
   - Project name: `hibo-dating-app`
   - Database password: (create strong password - save this!)
   - Region: (choose closest to you)
5. Click "Create new project"
6. Wait 2-3 minutes for setup

### Step 2: Get Your Credentials
1. In Supabase Dashboard, click ⚙️ **Settings** (bottom left)
2. Click **API**
3. Copy these:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGci...`)

### Step 3: Setup Environment Variables
1. In your HIBO project root, create `.env` file
2. Add:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```
3. Replace with your actual credentials from Step 2

### Step 4: Run Complete Schema (MOST IMPORTANT!)
1. In Supabase Dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open file: `supabase-complete-schema.sql`
4. **Copy ALL content** (Ctrl+A, Ctrl+C)
5. Paste into Supabase SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. Wait for success: ✅ "Success. No rows returned"

### Step 5: Verify Setup
1. Go to **Table Editor** (left sidebar)
2. You should see these tables:
   - ✅ `profiles`
   - ✅ `likes`
   - ✅ `matches`
   - ✅ `messages`
   - ✅ `posts`
   - ✅ `blocks`
   - ✅ `profile_views`

### Step 6: Test Your App
1. Stop your app (Ctrl+C in terminal)
2. Restart:
```bash
npx expo start --clear
```
3. Test:
   - Sign up new user
   - Complete onboarding
   - Should work! ✅

---

## ✅ What Gets Created:

- **7 Tables**: profiles, likes, matches, messages, posts, blocks, profile_views
- **Storage Bucket**: user-uploads (for photos & documents)
- **RLS Policies**: Security for all tables
- **Indexes**: Fast queries
- **Triggers**: Auto-match detection, auto-update timestamps
- **Realtime**: Live messaging

---

## 🎯 That's It!

Hada database-kaagu waa ready! Just use `supabase-complete-schema.sql` - that's all you need for a new database.

---

## 📝 Notes:

- **Fix files** (`supabase-fix-*.sql`) - Only use if you have errors in existing database
- **Complete schema** - Use ONLY for NEW databases
- **Don't run complete schema twice** - It will error if tables already exist

---

## 🆘 If You Get Errors:

1. Make sure you copied ALL the SQL (check for truncation)
2. Make sure you're in SQL Editor (not Table Editor)
3. Check if tables already exist (if yes, you already ran it)
4. Try running sections one by one if full file fails

---

**Need Help?** Check the SQL file comments - they explain everything!

