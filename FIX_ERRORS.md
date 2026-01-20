# Fix Supabase Integration Errors

You're experiencing several errors. Here's how to fix them:

## 🔧 **Fixes Applied:**

### 1. ✅ AsyncStorage Fixed
- Updated `lib/supabase.ts` with Expo-compatible storage adapter
- Added `react-native-url-polyfill/auto` import

### 2. 🔄 RLS Policies Need Update
- Created `supabase-fix-rls.sql` with fixed policies
- **ACTION REQUIRED:** Run this SQL in Supabase SQL Editor

## 📝 **Steps to Fix:**

### Step 1: Update RLS Policies in Supabase

1. Go to your Supabase project
2. Click **SQL Editor** (left sidebar)
3. Click "New Query"
4. Open `supabase-fix-rls.sql` file
5. Copy all the SQL code
6. Paste into SQL Editor
7. Click "Run" or press Ctrl/Cmd + Enter
8. You should see: "Success. No rows returned"

### Step 2: Stop and Restart Metro Bundler

```bash
# Press Ctrl+C to stop current server
# Then run with cache reset:
npx expo start --clear
```

### Step 3: Uninstall and Reinstall App

**On Android:**
1. Uninstall Expo Go or your development app
2. Reinstall from Play Store
3. Scan QR code again

**On iOS Simulator:**
```bash
# Reset simulator
xcrun simctl erase all
# Then restart
npx expo start
```

## 🔍 **What Each Error Meant:**

### Error 1: AsyncStorage is null
**Cause:** Native module not properly linked in Expo Go  
**Fix:** ✅ Updated storage adapter in supabase.ts

### Error 2: Network request failed (uploads)
**Cause:** Either:
- CORS issues
- Network connectivity
- Wrong Supabase URL
**Fix:** Will work after cache clear and RLS fix

### Error 3: Row violates row-level security policy
**Cause:** RLS policy too restrictive for INSERT  
**Fix:** ✅ Created supabase-fix-rls.sql with better policies

### Error 4: Missing default export
**Cause:** Metro cache issue  
**Fix:** `--clear` flag will resolve this

## ✅ **Verification Steps:**

After applying fixes:

1. **Check Supabase Policies:**
   - Go to Table Editor → profiles → Policies tab
   - You should see:
     - "Enable insert for authenticated users"
     - "Enable select for users based on user_id"
     - "Enable update for users based on user_id"

2. **Test Authentication:**
   ```bash
   npx expo start --clear
   ```

3. **Test Full Flow:**
   - Complete onboarding
   - Create account
   - Check if profile is created in Supabase

## 🆘 **If Still Not Working:**

### Check Environment Variables:

```bash
# Verify your .env file has correct values:
cat .env
```

Should show:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Verify Supabase URL:

1. Go to Supabase → Settings → API
2. Compare URL and anon key with your `.env` file
3. Make sure they match EXACTLY

### Check Supabase Project Status:

1. Go to Supabase dashboard
2. Make sure project is not paused
3. Check "Database" → "Tables" → profiles exists

## 🎯 **Expected Result:**

After all fixes:
- ✅ No AsyncStorage errors
- ✅ No RLS policy errors
- ✅ Photos upload successfully
- ✅ Profile saves to database
- ✅ User can log in

## 📊 **Commands Summary:**

```bash
# 1. Stop current server
# Press Ctrl+C

# 2. Clear cache and restart
npx expo start --clear

# 3. If still issues, try:
rm -rf node_modules/.cache
npx expo start --clear

# 4. Nuclear option (if nothing else works):
rm -rf node_modules
npm install
npx expo start --clear
```

---

**Next:** Run the SQL fix, clear cache, and test again!

