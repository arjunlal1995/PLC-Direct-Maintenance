# Build error fixes (2026-10-20)

This source package fixes the Kotlin syntax error in `app/src/main/java/com/plc/directmaintenance/ui/RoutineChecklistScreen.kt`: the malformed literal `\\n` between two import statements has been replaced with a real newline.

## Important: remove stale duplicate Kotlin files from the GitHub repository

The build log also proves that the current GitHub repository contains duplicate class definitions that are not present in this clean source tree. Before rebuilding, delete these stale files if they exist:

- `app/src/main/java/com/plc/directmaintenance/MaintenanceChecklist.kt`
- `app/src/main/java/com/plc/directmaintenance/PlcAlert.kt`
- `app/src/main/java/com/plc/directmaintenance/service/NotificationActionReceiver.kt`
- `app/src/main/java/com/plc/directmaintenance/service/NotificationHelper.kt`

Keep the canonical model files in `app/src/main/java/com/plc/directmaintenance/model/` and notification files in `app/src/main/java/com/plc/directmaintenance/notifications/`.

Do not merely upload/overlay this ZIP on top of the existing repository: GitHub will keep old files that are not overwritten. Replace the repository contents with this clean project, or explicitly delete the four stale files above and correct the malformed import in `RoutineChecklistScreen.kt`.

Then rerun `gradle testDebugUnitTest --no-daemon`. This package has not yet been validated by a successful Android build; further compile errors may remain.
