# Hibo – Commands

## 1. Development (maarayn)

```bash
npx expo run:android
```

- Development build oo Android ku orod
- Notifications iyo features dhammaan waan ku shaqeynayaan

---

## 2. Build (dhismaha app-ka)

```bash
# EAS build (preview, local)
eas build -p android --profile preview --local
```

---

## 3. Cache / Nadiifinta (marka adoo la counter cache)

### Run ee cache la tirtiro

```bash
npx expo run:android --no-build-cache
# ama
npx expo run:android --no-build-caches
```

### Prebuild oo nadiif ah

```bash
npx expo prebuild --clean --platform android
npx expo run:android --no-build-cache
```

---

## 4. Troubleshooting (icon cusub / wax aan sax ahayn)

### Icon cusub ma muuqan

1. App-ka ka saar:
   ```bash
   adb uninstall com.abti33.ai
   ```

2. Cache oo dhan tirtir, kadib run:
   ```bash
   rm -rf android/app/build android/.gradle android/build android/app/.cxx node_modules/.cache .expo
   npx expo prebuild --clean
   npx expo run:android --no-build-cache
   ```

3. Haddii weli aan muuqan: phone-ka restart ka dib build samee.

---

## 5. Sida ugu sahlan ee run (daily)

```bash
npx expo run:android
```
