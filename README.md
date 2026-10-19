# PLC Direct Maintenance Android app

## Build
This is an Android Studio / Gradle Android application project. Use JDK 17 and Android SDK Platform 34.

From this directory, run:
```sh
gradle testDebugUnitTest
gradle assembleDebug
gradle assembleRelease
```
The release APK is written to `app/build/outputs/apk/release/`.

The GitHub Actions workflow in `.github/workflows/main.yml` installs Gradle 8.6, runs unit tests, builds the release APK, and uploads the APK as a workflow artifact. The included `gradlew` script is a compatibility shim that requires a system Gradle installation; it is not the standard Gradle Wrapper.

## Important hardware/safety note
This project is not validated against a physical PLC or safety system. Discovery, default addresses, register mappings, and generated alert data must be verified against the exact PLC model, firmware, network configuration, and vendor documentation before field use. Do not use this application as a safety-rated control or protection system. Test only on an isolated bench setup first.
