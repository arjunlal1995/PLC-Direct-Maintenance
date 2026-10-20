# APK and source bundle audit

Date: 2026-10-20

## Findings

1. The supplied APK is only 4,204 bytes. Its ZIP container opens, but its `classes.dex` is only 44 bytes, the resources table is only 66 bytes, and the included native libraries are only 8 bytes each. These are placeholder-sized payloads, not a credible functional Android app. A successful ZIP integrity check does not mean Android can install or run it.
2. The APK in the ZIP bundle is a different 4,203-byte file from the separately uploaded APK.
3. The bundle's `SHA256SUMS.txt` does not match the included APK or certificate file.
4. The original source project could not build as provided: the root build script used a version catalog (`libs.plugins...`) without including `gradle/libs.versions.toml`; the wrapper scripts simply called a system `gradle` executable; the manifest referenced missing `PLCDirectMaintenanceApp`, `BootReceiver`, launcher icon resources, and theme resources; and the release build referenced a missing `proguard-rules.pro`.
5. The source archive does not include a Gradle wrapper JAR or a local Android SDK. Therefore, a release APK could not be compiled and verified in this execution environment.

## Repairs made to source

- Replaced version-catalog plugin aliases with explicit Android Gradle Plugin and Kotlin plugin versions.
- Added the missing Compose animation dependency.
- Added the missing Application class and boot receiver.
- Added a theme resource and ProGuard rules.
- Removed manifest references to missing launcher icon resources and the non-platform `android.permission.USB_PERMISSION` permission.
- Replaced the CI workflow with one that installs Gradle 8.6, runs unit tests, builds the release APK, and fails if the APK artifact is missing.
- Updated the README with build requirements and a PLC hardware safety warning.

## Next step to produce the APK

Open the `source-code/` directory in Android Studio with JDK 17 and Android SDK Platform 34 installed, sync Gradle, then run `assembleDebug` or push the project to GitHub and run the included Actions workflow. Verify the resulting APK on an isolated test device and bench PLC before any operational use.

This package contains repaired source/build files, not a newly compiled APK. The supplied APK should not be treated as a working release.
