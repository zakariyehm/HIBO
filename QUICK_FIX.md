# 🚀 Quick Fix - 3 Steps

Waxaan sameeyey fixes. **Samee 3 steps:**

## Step 1: Run SQL Fix (2 minutes)

1. Go to **Supabase** → **SQL Editor**
2. Open file: `supabase-fix-rls.sql`
3. Copy all SQL code
4. Paste and **Run** in Supabase
5. Should see: ✅ "Success"

## Step 2: Stop & Restart (1 minute)

```bash
# Terminal-ka stop (Ctrl+C)
# Then run:
npx expo start --clear
```

## Step 3: Test (2 minutes)

1. Scan QR code
2. Open app
3. Complete onboarding
4. Create account
5. ✅ Should work!

---

## ✅ What Was Fixed:

1. **AsyncStorage** → Updated lib/supabase.ts
2. **RLS Policies** → Need to run supabase-fix-rls.sql
3. **Network Issues** → Will work after restart

---

## 🔍 Quick Check:

After Step 1, check Supabase:
- **Table Editor** → **profiles** → **Policies** tab
- Should see 3 new policies

---

**That's it!** Just 3 steps: SQL → Restart → Test

