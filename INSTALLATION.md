# HIBO Dating App - Installation & Setup Guide

Complete guide to set up and run the HIBO dating app with Supabase backend.

## 📋 Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Expo CLI** - Will be installed with project dependencies
- **Android Studio** (for Android development) or **Xcode** (for iOS development)
- A **Supabase account** (free) - [Sign up](https://supabase.com)

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd /Users/kya/hibo
npm install
```

This will install all required packages including:
- React Native and Expo
- Supabase client
- AsyncStorage
- All UI and navigation libraries

### Step 2: Set Up Supabase Backend

Follow the detailed **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** guide to:

1. Create a Supabase project
2. Get your API credentials
3. Set up the database schema
4. Configure storage buckets

**Quick Supabase Setup:**

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key from Settings → API
3. Create a `.env` file in the project root (copy from `.env.example`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Run the SQL from `supabase-schema.sql` in your Supabase SQL Editor

### Step 3: Run the App

#### For Development with Expo Go:

```bash
npm start
```

Then:
- Press `a` for Android
- Press `i` for iOS
- Scan the QR code with Expo Go app on your phone

#### For Android (Development Build):

```bash
npm run android
```

#### For iOS (Development Build):

```bash
npm run ios
```

## 📱 Features Implemented

### ✅ Authentication
- Email/Password sign up
- Email/Password login
- Secure session management with AsyncStorage
- Supabase Auth integration

### ✅ Onboarding Flow
- 20+ step onboarding process
- Personal information collection:
  - Name, age, height, location
  - Phone number
  - Profession and education
  - Nationality
  - Personal preferences
  - Personality traits
  - Marriage intentions
  - Interests (minimum 3 required)
  - 3 profile photos
  - Identity verification (Passport/Driver License/National ID)
  - Bio

### ✅ Data Storage
- User profiles stored in Supabase PostgreSQL
- Photos and documents uploaded to Supabase Storage
- Row Level Security (RLS) for data protection
- Real-time validation and error handling

### ✅ UI/UX
- Beautiful, modern interface
- Smooth animations and transitions
- Toast notifications for feedback
- Loading states
- Form validation
- Progress indicators
- Responsive design

## 🗄️ Project Structure

```
hibo/
├── app/                        # App screens
│   ├── (tabs)/                # Main tab navigation
│   │   ├── index.tsx          # Home/Browse
│   │   ├── likes.tsx          # Likes screen
│   │   ├── match.tsx          # Matches screen
│   │   ├── messages.tsx       # Messages screen
│   │   └── profile.tsx        # User profile
│   ├── welcome.tsx            # Welcome/splash screen
│   ├── login.tsx              # Login screen
│   ├── onboarding.tsx         # Onboarding flow
│   └── _layout.tsx            # App layout
├── components/                # Reusable components
│   ├── Toast.tsx              # Toast notifications
│   ├── header.tsx             # App header
│   └── ui/                    # UI components
├── constants/                 # Constants and themes
│   └── theme.ts               # Color theme
├── lib/                       # Libraries and utilities
│   └── supabase.ts            # Supabase client & functions
├── assets/                    # Images and assets
├── .env                       # Environment variables (create this)
├── .env.example               # Environment variables template
├── supabase-schema.sql        # Database schema
├── package.json               # Dependencies
└── README.md                  # Project overview
```

## 🔧 Configuration Files

### .env (Create this file)
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Important:** Never commit `.env` to version control!

## 🧪 Testing the App

### Test User Flow:

1. **Launch App** → Welcome screen with "Get Started" button
2. **Get Started** → Onboarding flow begins
3. **Complete Onboarding** → Fill all 20+ steps
4. **Create Account** → Enter email & password
5. **Success** → Redirected to home screen
6. **Login** → Use email/password to sign in

### Test Data Example:

```
Email: test@example.com
Password: Test1234
First Name: John
Last Name: Doe
Age: 25
Height: 175 cm
Location: New York
... (continue with other fields)
```

## 🐛 Common Issues & Solutions

### Issue: "EXPO_PUBLIC_SUPABASE_URL is not defined"
**Solution:** 
- Make sure `.env` file exists in project root
- Restart Metro bundler: Stop server and run `npm start` again
- Use `EXPO_PUBLIC_` prefix for all environment variables

### Issue: "Network request failed" during signup
**Solution:**
- Check your Supabase URL is correct in `.env`
- Verify you have internet connection
- Check Supabase project is active (not paused)

### Issue: "Row Level Security policy violation"
**Solution:**
- Make sure you ran the complete SQL schema in Supabase
- Verify RLS policies are created correctly
- Check the user is authenticated before accessing data

### Issue: Photos not uploading
**Solution:**
- Verify storage bucket `user-uploads` exists
- Check storage policies are configured
- Ensure bucket is set to "Public"
- Grant camera/photo permissions on device

### Issue: App crashes on Android
**Solution:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

## 📦 Key Dependencies

```json
{
  "@supabase/supabase-js": "^2.47.10",
  "@react-native-async-storage/async-storage": "^2.1.0",
  "expo": "~54.0.31",
  "expo-image-picker": "~17.0.10",
  "react-native": "0.81.5"
}
```

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use Row Level Security** - All tables have RLS enabled
3. **Validate user input** - All forms have validation
4. **Secure file uploads** - Users can only upload to their own folders
5. **Use HTTPS** - All Supabase connections are secure

## 📊 Database Schema

### profiles table
Stores all user profile data:
- Personal information (name, age, height, etc.)
- Preferences and personality
- Photos and documents (URLs)
- Timestamps (created_at, updated_at)

### Storage buckets
- `user-uploads` - For photos and documents
  - `photos/[userId]/` - Profile photos
  - `documents/[userId]/` - ID documents

## 🔄 Development Workflow

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Lint code
npm run lint
```

## 📱 Build for Production

### Android APK:
```bash
eas build --platform android
```

### iOS IPA:
```bash
eas build --platform ios
```

## 🆘 Support & Resources

- **Expo Docs:** https://docs.expo.dev
- **Supabase Docs:** https://supabase.com/docs
- **React Native Docs:** https://reactnative.dev/docs/getting-started

## ✅ Verification Checklist

Before deploying to production:

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database schema created
- [ ] Storage buckets configured
- [ ] Dependencies installed
- [ ] App runs successfully
- [ ] User can sign up
- [ ] User can log in
- [ ] Photos upload correctly
- [ ] Profile data saves to database
- [ ] RLS policies working
- [ ] Error handling tested

---

**Need Help?** Check the logs:
- Metro Bundler console
- React Native Debugger
- Supabase Dashboard → Logs
- Browser Developer Console (for web)

**Congratulations!** 🎉 You're all set up and ready to develop!

