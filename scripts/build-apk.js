/* ============================================================
   Build a debug APK in one step:  npm run apk
   - syncs web assets + plugins into the android project
   - makes sure android/local.properties points at the SDK
   - picks a Gradle-compatible JDK (Android Studio's bundled JDK,
     because a very new system Java can be unsupported by Gradle)
   - runs the Gradle debug build and prints the APK path
   ============================================================ */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const root = path.resolve(__dirname, "..");
const androidDir = path.join(root, "android");
const isWin = process.platform === "win32";

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: isWin, ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

// 1) sync web assets + native plugins
console.log("• Syncing web assets into android…");
run("npx", ["cap", "sync", "android"], { cwd: root });

if (!fs.existsSync(androidDir)) {
  console.error("No android/ project found. Run:  npx cap add android");
  process.exit(1);
}

// 2) ensure local.properties has sdk.dir
const lp = path.join(androidDir, "local.properties");
if (!fs.existsSync(lp)) {
  const sdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME ||
    path.join(process.env.LOCALAPPDATA || os.homedir(), "Android", "Sdk");
  if (fs.existsSync(sdk)) {
    fs.writeFileSync(lp, "sdk.dir=" + sdk.replace(/\\/g, "/") + "\n");
    console.log("• Wrote android/local.properties → " + sdk);
  } else {
    console.warn("! Android SDK not found automatically; relying on ANDROID_HOME.");
  }
}

// 3) pick a Gradle-friendly JDK (Android Studio bundles JDK 21)
const env = { ...process.env };
const jdkCandidates = [
  process.env.JAVA_HOME_FOR_APK,
  "C:/Program Files/Android/Android Studio/jbr",
  "/Applications/Android Studio.app/Contents/jbr/Contents/Home",
  path.join(os.homedir(), "Android", "Android Studio", "jbr"),
].filter(Boolean);
const jbr = jdkCandidates.find(p =>
  fs.existsSync(path.join(p, "bin", isWin ? "java.exe" : "java")));
if (jbr) { env.JAVA_HOME = jbr; console.log("• Using JDK: " + jbr); }
else { console.log("• Using existing JAVA_HOME (ensure it is JDK 17–21)."); }

// 4) build
console.log("• Building debug APK (first run downloads Gradle deps)…");
const gradlew = path.join(androidDir, isWin ? "gradlew.bat" : "gradlew");
// quote the path so spaces in the project folder don't break the shell
run(`"${gradlew}"`, ["assembleDebug"], { cwd: androidDir, env });

// 5) report
const apk = path.join(androidDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
if (fs.existsSync(apk)) {
  console.log("\n✓ APK ready:\n  " + apk + "\n");
} else {
  console.error("Build finished but APK not found at the expected path.");
  process.exit(1);
}
