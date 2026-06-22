# Prayer Times — Council of Mosque Sheffield

A community app for Sheffield: daily prayer times, a monthly timetable, live
announcements (events / deaths / madrassa), a mosque & business directory, and
prayer notifications. Prayer times work fully **offline**; announcements update
when online (via Firebase) and are cached for offline viewing.

Built with **Capacitor** (a web app wrapped as a native Android/iOS app).

---

## Project layout

```
www/                     # the app (plain HTML/CSS/JS — no build step)
  index.html             # app shell + bottom navigation
  css/  theme.css         #   light/dark colour variables
        app.css           #   components
  js/   app.js            #   bootstrap + router + nav
        data.js           #   loads prayer times, next-prayer logic
        prayers.js        #   Today view + countdown
        timetable.js      #   monthly data table
        announcements.js  #   events / deaths / madrassa
        directory.js      #   mosques (list→detail) + businesses
        settings.js       #   font size, dark mode, notification prefs
        notifications.js  #   on-device prayer reminders
        firebase.js       #   live content + offline cache
        firebase-config.js#   <-- paste your Firebase config here
        store.js          #   Preferences / localStorage wrapper
  data/                  # prayer-times.json + seed mosques/businesses/announcements
admin/                   # admin web console (deploy to Firebase Hosting)
  index.html  admin.js  config.js   <-- paste the SAME Firebase config here
firebase/                # firestore.rules + storage.rules
resources/               # icon.png + splash.png
```

The app runs on the bundled **seed data** until you set up Firebase, so it
works immediately.

---

## What you need installed (one-time, for Android)

1. **Node.js** LTS — https://nodejs.org
2. **JDK 17 or newer** (Capacitor 8 requires it)
3. **Android Studio** — run its setup wizard to install the Android SDK:
   https://developer.android.com/studio

*(iOS additionally needs a Mac with Xcode — see "iOS" below.)*

---

## Build the Android app

Open a terminal **inside this folder** and run, in order:

```bash
npm install
npx @capacitor/assets generate --android   # optional: app icon + splash
npx cap add android
npx cap sync
npx cap open android
```

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
The debug APK lands at `android/app/build/outputs/apk/debug/app-debug.apk` —
email it to yourself, open it on an Android phone, allow "install from unknown
sources", and it installs.

**When you change the app later:** edit files in `www/`, then `npx cap sync`
and rebuild.

### Preview in a browser while developing
```bash
npx http-server www -p 5599 -c-1
```
Open http://localhost:5599 (use a server, not the file directly, so the JS
modules load).

---

## Firebase setup (announcements, mosques, businesses)

1. Create a project at https://console.firebase.google.com.
2. Add a **Web app**; copy the config object.
3. Paste it into **both** `www/js/firebase-config.js` and `admin/config.js`.
4. Enable **Firestore Database**, **Storage**, and **Authentication →
   Email/Password**. Create an admin user under Authentication.
5. Publish the rules in `firebase/firestore.rules` and `firebase/storage.rules`
   (public read, signed-in write).
6. Create collections `announcements`, `mosques`, `businesses`. To start the
   mosque list, import `www/data/mosques.json` into the `mosques` collection,
   then edit each entry from the admin console.

**Posting content:** deploy `admin/` to Firebase Hosting (`firebase init hosting`
→ public dir `admin` → `firebase deploy`), open it, sign in, and post
announcements (text + image), edit mosques, or add businesses. The phone app
picks up changes on next open and caches them for offline.

---

## Prayer notifications

On-device reminders are scheduled from the prayer data (no internet needed).
Users control them in **Settings**: enable/disable per prayer, choose Jamāʿah
vs starting time, and set how many minutes before (0–60).

---

## Going to the stores

### Google Play (Android)
- Create a **Google Play Developer account** (one-time ~US $25).
- Android Studio: **Build → Generate Signed App Bundle** → **.aab**. Create a
  signing keystore when prompted and **back it up** — you need it for every
  update.
- Set target SDK to **36** (Android 16) in `android/variables.gradle`.
- Complete the store listing, content rating, and Data Safety form. The app now
  loads announcement content from Firebase and (if enabled) uses notifications —
  declare that accordingly.

### App Store (iOS) — requires a Mac
- `npm i @capacitor/ios && npx cap add ios && npx cap open ios`, build in Xcode.
- Create an **Apple Developer account** (~US $99/yr) and submit via App Store
  Connect. No Mac? A cloud-Mac CI service (Codemagic, GitHub Actions macOS) can
  build iOS for you.

---

## Notes

- `appId` (`com.cosheffield.prayertimes`) is permanent once published — change it
  in `capacitor.config.json` before `cap add` if you want something different.
- Prayer times for the whole year live in `www/data/prayer-times.json`
  (`{ month: [[date, sehriEnds, sunrise, zuhrStart, asrStart, ishaStart,
  fajrJamaat, zuhrJamaat, asrJamaat, maghrib, ishaJamaat], …] }`). Blank Jamāʿah
  cells carry forward automatically, like the printed board.
