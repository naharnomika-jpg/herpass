# Herpass Android App

A native Android wrapper for the **Herpass Girls Hostel Outing Management System**.

The app loads the full Herpass web UI inside a hardware-accelerated WebView, giving
a native app experience with:
- 📱 Native launcher icon (pink shield on dark slate)
- ⏳ Branded loading splash screen
- 🔄 Swipe-to-refresh (pull down to reload)
- 🔗 External links open in the system browser
- ⬅️ Back button navigates WebView history before closing the app
- 📡 Clear error screen when the server can't be reached

---

## Prerequisites

| Tool | Version | Download |
|---|---|---|
| **Android Studio** | Hedgehog (2023.1.1) or later | [developer.android.com](https://developer.android.com/studio) |
| **Android SDK** | API 34 (Android 14) | via Android Studio SDK Manager |
| **JDK** | 17 | bundled with Android Studio |

---

## Step 1 — Start the Herpass Server

Before running the app, start the Python FastAPI backend on your PC:

```bash
# From the project root (the folder containing server.py)
pip install fastapi uvicorn
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

> The server must bind to `0.0.0.0` (not just `localhost`) so the Android
> emulator can reach it via `http://10.0.2.2:8000`.

---

## Step 2 — Open in Android Studio

1. Launch **Android Studio**
2. Choose **Open** → select the `android-app/` folder  
   *(not the whole `Herpass/` root — just `android-app/`)*
3. Android Studio will:
   - Detect the project
   - Download the Gradle wrapper JAR automatically
   - Sync dependencies

---

## Step 3 — Create `local.properties`

Android Studio usually creates this file automatically. If it doesn't, create
`android-app/local.properties` with the path to your Android SDK:

```properties
# Windows example:
sdk.dir=C\:\\Users\\YourName\\AppData\\Local\\Android\\Sdk

# macOS/Linux example:
# sdk.dir=/Users/yourname/Library/Android/sdk
```

---

## Step 4 — Run on the Emulator

1. In Android Studio, open **Device Manager** (right sidebar or Tools menu)
2. Create a **Pixel 6** virtual device — **API 34 (Android 14)** — if you don't have one
3. Press the **▶ Run** button (or `Shift+F10`)
4. The emulator will start and the Herpass app will launch automatically

---

## Testing on a Physical Android Device

1. Enable **Developer Options** on your phone (tap "Build Number" 7× in Settings → About)
2. Enable **USB Debugging**
3. Plug in via USB — Android Studio will detect it in Device Manager
4. **Change the server URL** in `MainActivity.java`:

```java
// Line ~41 in MainActivity.java
private static final String APP_URL  = "http://192.168.1.5:8000/";  // your PC's LAN IP
private static final String APP_HOST = "192.168.1.5";
```

Find your PC's LAN IP with:
- Windows: `ipconfig` → look for "IPv4 Address"
- macOS/Linux: `ifconfig` → look for `inet` under your Wi-Fi adapter

---

## Build an APK for Distribution

To generate an unsigned debug APK:

```bash
# Windows
cd android-app
gradlew.bat assembleDebug

# Mac/Linux
cd android-app
./gradlew assembleDebug
```

The APK will be at:
```
android-app/app/build/outputs/apk/debug/app-debug.apk
```

Transfer it to your phone and install. (You may need to enable "Install from unknown sources".)

---

## Project Structure

```
android-app/
├── gradlew / gradlew.bat           ← Gradle wrapper scripts
├── gradle/wrapper/
│   └── gradle-wrapper.properties   ← Points to Gradle 8.6
├── build.gradle                    ← Root build file (AGP 8.2.2)
├── settings.gradle                 ← Project name & module setup
└── app/
    ├── build.gradle                ← App dependencies & build config
    ├── proguard-rules.pro
    └── src/main/
        ├── AndroidManifest.xml
        ├── java/com/herpass/hostel/
        │   └── MainActivity.java   ← WebView host activity
        └── res/
            ├── drawable/           ← Vector icon assets
            ├── layout/
            │   └── activity_main.xml  ← Splash + WebView + Error layout
            ├── mipmap-anydpi/      ← Launcher icon (API 24–25 fallback)
            ├── mipmap-anydpi-v26/  ← Adaptive launcher icon (API 26+)
            ├── values/
            │   ├── colors.xml      ← Herpass brand palette
            │   └── styles.xml      ← Dark theme (dark status/nav bars)
            └── xml/
                └── network_security_config.xml  ← Allows HTTP to emulator
```

---

## Changing the Server URL

Edit `MainActivity.java` — lines near the top of the class:

```java
private static final String APP_URL  = "http://10.0.2.2:8000/";
private static final String APP_HOST = "10.0.2.2";
```

Also update `network_security_config.xml` if you change the host to allow
cleartext HTTP to that new IP.

---

## Detecting the Android App in the Web Frontend

The app appends `HerpassAndroid/1.0` to the WebView's User-Agent string.
Your JavaScript can detect this to hide the PWA install button, etc.:

```javascript
if (navigator.userAgent.includes('HerpassAndroid')) {
    document.getElementById('pwaInstallBtn')?.classList.add('hidden');
}
```
