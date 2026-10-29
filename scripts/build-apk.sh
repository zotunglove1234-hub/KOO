#!/usr/bin/env bash
# Build a KOO APK on this machine's local Android toolchain (no EAS, no cloud).
#
#   bash scripts/build-apk.sh                  # release APK — runs standalone on the phone
#   VARIANT=debug bash scripts/build-apk.sh    # debug APK — needs `npx expo start` for JS
#   ABIS=arm64-v8a bash scripts/build-apk.sh   # trim architectures
#   FORCE_PREBUILD=1 bash scripts/build-apk.sh # regenerate android/ from app.json
#   CLEAN=1 bash scripts/build-apk.sh          # wipe android/app/build first (slow, ~10 min)
#
# Toolchain this project is wired for:
#   JDK 17            C:/Tools/jdk17.0.21_0
#   Android SDK       C:/Android  (platform-tools, platforms;android-37.0,
#                                  build-tools;37.0.0, cmake;3.22.1, ndk;27.1.12297006)
#   Gradle            C:/Tools/gradle-9.4.1 (matches android/gradle/wrapper)
#
# Two environment quirks the script repairs, see patch_android_project():
#   * CNG writes gradle-wrapper.properties with an https distributionUrl, but this
#     network refuses Java TLS to services.gradle.org — the wrapper points at the
#     local zip in C:/Tools/dl instead.
#   * React Native 0.88 ships prefab natives built for API 24 while the Expo library
#     plugins leave each module at AGP's default of 22, so configureCMakeDebug dies
#     with [CXX1214]. android/build.gradle pins every module to the app's minSdk.
# Also note: keep this project off OneDrive's on-demand placeholders, or Gradle fails
# with AccessDeniedException on cloud-only directories (dehydrate-safe: pin the build
# outputs "always keep on this device", or delete the placeholder dir and rebuild).
# Two OneDrive effects cause that error on this machine, both confirmed on 2026-10-29:
#   1. Build outputs get dehydrated to cloud placeholders between builds (ReparsePoint
#      on the .so files), and reading them mid-build makes OneDrive hydrate while
#      Defender scans, which the JVM reports as AccessDenied.
#   2. C:\Users\Lenovo\OneDrive carries an inherited Everyone:(CI)(DENY)(DC) ACE ("deny
#      delete children"), so a task that must REPLACE an existing generated file is
#      refused even though creating a new file in the same directory succeeds.
# Safe workarounds, in order of preference — none of them moves the project:
#   a. Pause OneDrive syncing for the duration of a build (tray icon -> Pause syncing).
#   b. Pin the trees Gradle rewrites, so they stop being dehydrated:
#        attrib +P -U "C:\Users\Lenovo\OneDrive\Desktop\MarketApp" /S /D
#      (this makes them real files again and costs local disk space).
#   c. Ask IT to add this folder plus the JDK/Android SDK/Gradle caches to the antivirus
#      exclusion list — real-time scanning of multi-MB .so copies is part of the delay.
#   d. Only if those are not enough: work from a non-synced copy, e.g. robocopy /MIR to
#      C:\Build\koo and build there, keeping OneDrive as the storage copy.
# This script already repairs the symptom for the two output trees it owns (buildConfig
# and library_jni), which is why a failing assemble usually succeeds on a plain re-run.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VARIANT="${VARIANT:-release}"
ABIS="${ABIS:-arm64-v8a,armeabi-v7a}"

export JAVA_HOME="${JAVA_HOME:-C:\\Tools\\jdk17.0.21_0}"
export ANDROID_HOME="${ANDROID_HOME:-C:\\Android}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export NODE_OPTIONS="${NODE_OPTIONS:---use-system-ca}"

GRADLE_CMD=("$ROOT"/android/gradlew)
if [[ -x /c/Tools/gradle-9.4.1/bin/gradle.bat ]]; then
  GRADLE_CMD=(/c/Tools/gradle-9.4.1/bin/gradle.bat)
fi

cd "$ROOT"

patch_android_project() {
  local wrapper="android/gradle/wrapper/gradle-wrapper.properties"
  if [[ -f /c/Tools/dl/gradle-9.4.1-bin.zip ]] && grep -q "services.gradle.org" "$wrapper"; then
    sed -i 's#^distributionUrl=.*#distributionUrl=file\\:/C:/Tools/dl/gradle-9.4.1-bin.zip#' "$wrapper"
  fi

  if ! grep -q "CXX1214" android/build.gradle; then
    cat >> android/build.gradle <<'GRADLE'

// Pin every module to the app minSdk: RN 0.88 prefab natives (hermestooling) are built
// for API 24, and [CXX1214] aborts configureCMakeDebug when a module stays at AGP's 22.
subprojects { sub ->
  ['com.android.library', 'com.android.application'].each { id ->
    sub.plugins.withId(id) {
      sub.android.defaultConfig.minSdkVersion = rootProject.ext.minSdkVersion
    }
  }
}
GRADLE
  fi

  # CMake 3.22.1 ships ninja 1.10.2, which aborts on the >260-character object paths
  # that RN's codegen produces. ninja 1.12.1 is long-path aware (needs the OS
  # LongPathsEnabled policy, which is already set on this machine).
  local ninja="$ANDROID_HOME/cmake/3.22.1/bin/ninja.exe"
  if [[ -f /c/Tools/dl/ninja/ninja.exe && -f "$ninja" ]] && [[ "$("$ninja" --version)" == 1.10.* ]]; then
    cp -f /c/Tools/dl/ninja/ninja.exe "$ninja"
  fi
}

if [[ "${FORCE_PREBUILD:-0}" == "1" || ! -d android ]]; then
  npx expo prebuild --platform android
fi

patch_android_project

# OneDrive protects its tree with an inherited `Everyone:(CI)(DENY)(DC)` ACE (source:
# C:\Users\Lenovo\OneDrive), so a task that has to *replace* an existing generated file
# aborts with java.nio.file.AccessDeniedException. This project lives under Desktop
# (OneDrive), and versionCode/versionName changes always force generate${VARIANT}BuildConfig
# to rewrite BuildConfig.java. Deleting the regenerable output first makes the task create
# it fresh instead of replacing it. Set CLEAN=1 to wipe the whole app build directory.
if [[ "${CLEAN:-0}" == "1" && -d android/app/build ]]; then
  rm -rf android/app/build
fi
rm -rf android/app/build/generated/source/buildConfig/debug \
       android/app/build/generated/source/buildConfig/release

# The same OneDrive trap hits native-module JNI copies: AGP's copy{Variant}JniLibsProjectOnly
# has to replace .so files that OneDrive dehydrated into cloud placeholders (attribute
# ReparsePoint) after the previous build, which aborts with AccessDeniedException. library_jni
# is pure copy output, so deleting it makes the task write fresh files instead of replacing
# placeholders — and it is the only thing that has to go; the .cxx CMake output stays, so no
# NDK rebuild is triggered.
find node_modules -maxdepth 6 -type d -path "*/android/build/intermediates/library_jni" \
  -exec rm -rf {} + 2>/dev/null || true

task="assemble$(tr '[:lower:]' '[:upper:]' <<< "${VARIANT:0:1}")${VARIANT:1}"
"${GRADLE_CMD[@]}" -p android "$task" --console=plain "-PreactNativeArchitectures=$ABIS"

apk="android/app/build/outputs/apk/$VARIANT/app-$VARIANT.apk"
ls -lh "$ROOT/$apk"
"$ANDROID_HOME/build-tools/37.0.0/aapt.exe" dump badging "$ROOT/$apk" | grep -E "^package|^application-label:|^sdkVersion|^targetSdkVersion|^native-code"
echo "APK ready: $apk"
