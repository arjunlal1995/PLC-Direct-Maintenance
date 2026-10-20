# PLC Direct Maintenance — source package and real-hardware build guide

## What this package is
This ZIP is based on the Android Kotlin source package previously supplied by the user. It includes existing USB, Modbus TCP, discovery, manager, UI, notification and checklist source files. It is a development starting point, NOT a verified production tool. The code has not been proven against your actual PLC, wiring, USB adapter or firmware. Do not use it to write to a running machine until a qualified controls engineer has validated it.

## Equipment-specific note
Your photos show a Schneider Electric Harmony HMI and a Schneider module labelled M340. The photo alone does not establish the PLC program, IP address, register map, access rights or programming protocol. Schneider M340 program backup is not equivalent to generic Modbus TCP. Modbus exposes only configured data/registers; it does not automatically upload the ladder program or identify every sensor.

## Build on Windows 10/11
1. Install Android Studio: https://developer.android.com/studio
2. Install JDK 17 and Android SDK Platform 34 / Build Tools through SDK Manager.
3. Extract this ZIP to a short path such as `C:\PLC\PLCDirectMaintenance`.
4. Open the extracted project folder in Android Studio (the folder containing `settings.gradle.kts`).
5. Wait for Gradle sync. Do not change Gradle/Kotlin versions arbitrarily.
6. Select **Build > Make Project** and fix any Build Output errors.
7. Choose **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
8. Expected debug APK: `app\build\outputs\apk\debug\app-debug.apk`.
9. Install on a test phone. Android may ask permission to install APKs from your file manager.
10. For distribution, generate a signed release with your own keystore. Never commit signing keys/passwords to GitHub.

## Build using GitHub Actions
1. Create/open your repository.
2. Commit the *contents* of the extracted folder into repository root. Root must contain `settings.gradle.kts`, `build.gradle.kts`, `gradlew`, `gradle/`, `app/`, and `.github/workflows/main.yml`.
3. Ensure `gradlew` is executable (`chmod +x ./gradlew`).
4. Push to `main`/`master`, or use Actions > workflow > Run workflow.
5. Read the first failing task in the run log. Download the APK artifact only after a successful build.
6. Debug output normally is `app/build/outputs/apk/debug/app-debug.apk`. Ensure the workflow uploads the actual generated path.

## Physical connection setup
### USB-B to USB-C
- The phone must support USB host/OTG; use a data-capable cable/compatible interface, not a charge-only cable.
- Confirm exact PLC model, port, cable and protocol from the manufacturer documentation.
- Grant Android USB permission when prompted. Android USB permission is not the same as PLC engineering authorization.
- USB-B does not guarantee a serial or Modbus protocol; programming ports may use proprietary protocols.

### RJ45 Ethernet to USB-C
- Use a phone-compatible USB-C Ethernet adapter.
- Put phone/adapter and PLC on a compatible subnet using documented PLC IP settings. Do not guess an IP from a MAC address.
- TCP port 502 is relevant only when Modbus TCP is configured. A responding port does not prove device identity or authorize writes.
- Start with read-only access to a documented address in a test environment.

## Before real write operations
1. Obtain exact PLC model, firmware, protocol and approved interface.
2. Make and verify an official PLC program backup using the manufacturer's supported engineering software.
3. Obtain an authorized tag/register map: address, type, scaling, units and read/write permission.
4. Test against a lab PLC or test system first. Never write to guessed addresses on a live engine/plant.
5. Keep the app read-only until a qualified engineer approves a per-variable allowlist, range checks, interlocks, confirmation dialogs, audit logs and recovery plan.
6. Do not expose generic writes for safety, trip, start/stop, protection or interlock variables. Do not bypass passwords or safety controls.
7. Alarm acknowledge and alarm reset are different operations; implement only documented mechanisms.
8. A broken wire cannot be conclusively identified from a network scan. It requires supported module diagnostics, channel status or approved signal checks.

## Feature boundaries
- Discovery only sees devices reachable on the phone's current network using implemented methods. VLANs, firewalls and Android network configuration can prevent discovery.
- Baud-rate scanning applies to supported serial protocols, not Ethernet.
- Program upload, sensor-name discovery, arbitrary memory reads and value writes are different capabilities. Do not mark them supported until validated for the exact PLC.
- Never display demo/default values as real. Show connection state, timestamp and data quality.

## Recommended first target
Validate the photographed Schneider Modicon M340 first. Record exact CPU catalogue number/firmware, port/IP/subnet, programming interface part number, whether Modbus TCP is enabled, unit ID/register mapping, and the approved tag map. Implement and test drivers against those facts instead of guessing. This package is not certified for safety-critical or production control.
