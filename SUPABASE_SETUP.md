# Supabase Setup Guide for HIBO Dating App

This guide will help you set up Supabase for the HIBO dating app backend.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed
- HIBO app source code

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in your project details:
   - Project name: `hibo-dating-app`
   - Database password: (create a strong password)
   - Region: (choose closest to your users)
4. Click "Create new project"
5. Wait for the project to finish setting up (takes ~2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, click on the ⚙️ **Settings** icon (bottom left)
2. Click on **API** in the settings menu
3. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGci...`)

## Step 3: Configure Environment Variables

1. In your HIBO project root, create a `.env` file (if it doesn't exist)
2. Add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Replace the values with your actual credentials from Step 2

## Step 4: Set Up Database Schema

1. In your Supabase project dashboard, click on the **SQL Editor** icon (left sidebar)
2. Click "New Query"
3. Open the `supabase-schema.sql` file from your HIBO project
4. Copy all the SQL code from that file
5. Paste it into the Supabase SQL Editor
6. Click "Run" or press `Ctrl/Cmd + Enter`
7. You should see a success message: "Success. No rows returned"

This will create:
- The `profiles` table to store user data
- The `user-uploads` storage bucket for photos and documents
- Row Level Security (RLS) policies for data protection
- Indexes for better query performance

## Step 5: Configure Storage

The SQL script already creates the storage bucket, but let's verify:

1. Click on the **Storage** icon (left sidebar)
2. You should see a bucket named `user-uploads`
3. Click on it to verify it's set to "Public"
4. The policies should already be configured from the SQL script

## Step 6: Install Dependencies

In your HIBO project directory, run:

```bash
npm install
```

This will install:
- `@supabase/supabase-js` - Supabase client
- `@react-native-async-storage/async-storage` - For session storage
- `react-native-url-polyfill` - URL polyfill for React Native

## Step 7: Test the Integration

1. Start your development server:
   ```bash
   npm start
   ```

2. Open the app in your emulator/simulator or physical device

3. Navigate to the onboarding screen

4. Fill out all the required information

5. Create an account with email and password

6. Check your Supabase dashboard:
   - Go to **Authentication** → **Users** to see the new user
   - Go to **Table Editor** → `profiles` to see the profile data
   - Go to **Storage** → `user-uploads` to see uploaded photos

## Verification Checklist

✅ Supabase project created  
✅ Environment variables configured in `.env`  
✅ Database schema created (tables, storage, policies)  
✅ Dependencies installed  
✅ App can create user accounts  
✅ User data saves to database  
✅ Photos upload to storage  

## Common Issues & Solutions

### Issue: "Invalid API key" error
**Solution**: Double-check your `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` file

### Issue: "Network request failed"
**Solution**: Make sure your `EXPO_PUBLIC_SUPABASE_URL` is correct and includes `https://`

### Issue: "Row Level Security policy violation"
**Solution**: Make sure you ran the complete SQL schema including all RLS policies

### Issue: Photos not uploading
**Solution**: 
1. Check that the `user-uploads` bucket exists
2. Verify storage policies are correctly set
3. Make sure the bucket is set to "Public"

### Issue: "User not found after signup"
**Solution**: Check Supabase Authentication settings - make sure email confirmation is disabled for testing (or handle email confirmation in your app)

## Database Structure

### profiles table
Stores all user profile information including:
- Personal details (name, age, height, location)
- Preferences (looking for, interested in)
- Personality traits
- Marriage intentions
- Interests
- Photos (URLs)
- Documents (URLs)
- Bio

### user-uploads storage bucket
Stores all user-uploaded files:
- `photos/[userId]/` - Profile photos
- `documents/[userId]/` - Identity documents (passport, ID, driver license)

## Security Notes

- **Never commit your `.env` file to Git** (it's in `.gitignore`)
- Row Level Security (RLS) ensures users can only access their own data
- Storage policies ensure users can only upload/modify their own files
- Always use the anon key in your client app (never the service role key)

## Next Steps

After successful setup:

1. **Enable Email Confirmations** (Production):
   - Go to Authentication → Settings
   - Enable "Enable email confirmations"
   - Set up email templates

2. **Add Custom Domain** (Optional):
   - Go to Project Settings → Custom Domains
   - Add your domain for a branded experience

3. **Set up Database Backups**:
   - Go to Project Settings → Backups
   - Enable daily backups

4. **Monitor Usage**:
   - Check Database → Usage
   - Check Storage → Usage
   - Upgrade plan if needed

## Support

If you encounter any issues:
1. Check Supabase Logs: Dashboard → Logs
2. Check Supabase Docs: https://supabase.com/docs
3. Check the app console for error messages
4. Verify all environment variables are correct

---

**Congratulations!** 🎉 Your HIBO dating app is now connected to Supabase!

