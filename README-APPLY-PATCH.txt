PLC DIRECT MAINTENANCE — LOGO PATCH

IMPORTANT: This is an overlay patch for the Android source tree. Copy the contents into the matching paths in the root of your GitHub repository; do not upload the outer patch folder itself.

Files included:
1. android/app/src/main/java/com/plc/directmaintenance/MainActivity.kt
   Full MainActivity based on the Android/ Kotlin project from the provided ZIP, modified to display the logo in the top app bar. Existing screen logic is retained.
2. android/app/src/main/AndroidManifest.xml
   Launcher icon references changed to the logo drawable.
3. android/app/src/main/res/drawable/plc_direct_maintenance_logo.png
   Logo image used by Compose and as launcher icon.
4. android/app/src/main/res/mipmap-*/ic_launcher.png
   Size-specific launcher icon images.
5. .github/workflows/main.yml
   Root workflow changed to build the actual Kotlin Android project under android/ instead of the root app/ folder, whose MainActivity.kt in the supplied archive is TypeScript source, not Kotlin.

Apply from an Android phone:
1. Open the repository's main branch.
2. Add/replace each file at exactly the path shown inside this patch.
3. For the PNG files, use Add file > Upload files in GitHub; create the folders by navigating to the parent directory and uploading into the desired path. If GitHub mobile doesn't let you create nested folders, use github.dev (open repository, press . in a browser if supported) or upload the patch via GitHub's web UI.
4. Commit the changes to a new branch first.
5. Open Actions and run the workflow. The APK artifact should be under the workflow run's Artifacts section.

Notes:
- This patch was generated against the supplied PLC-Direct-Maintenance-main.zip, not fetched from your live GitHub branch. Compare with current branch before replacing files.
- This patch has not been compiled or tested against physical PLC hardware in this environment.
- The icon graphic contains stylized Schneider branding/model text; it is an illustrative app logo, not confirmation of exact connected PLC model or compatibility.
