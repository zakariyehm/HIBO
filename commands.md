npx expo run:android
eas build -p android --profile preview --local
npx expo run:android --no-build-caches
npx expo run:android --no-build-cache

# Nadiifiyaha cache-ka oo dhan si icon-ka cusub uu u muujiyo:
adb uninstall com.abti33.ai
npx expo prebuild --clean
npx expo run:android --no-build-cache

# Si aad u aragto icon-ka cusub:
adb uninstall com.abti33.ai
rm -rf android/app/build android/.gradle android/build android/app/.cxx node_modules/.cache .expo
npx expo run:android --no-build-cache
# Ama restart phone-kaaga kadib build-ka



npx expo prebuild --clean --platform android
npx expo run:android --no-build-cache
npx expo run:android

# Development build with notifications
npx expo run:android