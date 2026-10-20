import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { KOTLIN_CODEBASE } from '../src/data/codebaseFiles';

async function main() {
  const rootDir = process.cwd();
  const androidDir = path.join(rootDir, 'android');
  const publicDir = path.join(rootDir, 'public');

  if (!fs.existsSync(androidDir)) {
    fs.mkdirSync(androidDir, { recursive: true });
  }
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const zip = new JSZip();

  console.log(`Exporting ${KOTLIN_CODEBASE.length} files to /android directory...`);

  for (const file of KOTLIN_CODEBASE) {
    const filePath = path.join(androidDir, file.path);
    const parentDir = path.dirname(filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(filePath, file.content, 'utf8');
    zip.file(file.path, file.content);
  }

  // Also add gradle wrapper scripts & proguard rules
  const gradlewSh = `#!/usr/bin/env sh
exec gradle "$@"
`;
  const gradlewBat = `@rem Gradle wrapper script
gradle %*
`;
  const gradleWrapperProps = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.5-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;
  const proguardRules = `# Proguard rules for PLC Direct Maintenance (Android 14+ / API 34)
-keep class com.plc.directmaintenance.notifications.** { *; }
-keep class com.plc.directmaintenance.service.** { *; }
-keep class com.plc.directmaintenance.model.** { *; }
-keep class com.plc.directmaintenance.driver.** { *; }
-keep class com.plc.directmaintenance.drivers.** { *; }
-keep class com.plc.directmaintenance.discovery.** { *; }
-keep class com.hoho.android.usbserial.driver.** { *; }
`;

  // Write gradle wrapper scripts to /android
  fs.writeFileSync(path.join(androidDir, 'gradlew'), gradlewSh, { mode: 0o755 });
  fs.writeFileSync(path.join(androidDir, 'gradlew.bat'), gradlewBat);
  
  const wrapperDir = path.join(androidDir, 'gradle', 'wrapper');
  fs.mkdirSync(wrapperDir, { recursive: true });
  fs.writeFileSync(path.join(wrapperDir, 'gradle-wrapper.properties'), gradleWrapperProps);

  const appDir = path.join(androidDir, 'app');
  fs.mkdirSync(appDir, { recursive: true });
  fs.writeFileSync(path.join(appDir, 'proguard-rules.pro'), proguardRules);

  zip.file('gradlew', gradlewSh, { unixPermissions: '755' });
  zip.file('gradlew.bat', gradlewBat);
  zip.file('gradle/wrapper/gradle-wrapper.properties', gradleWrapperProps);
  zip.file('app/proguard-rules.pro', proguardRules);

  console.log('Generating /public/PLCDirectMaintenance-Android-Source.zip...');
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(path.join(publicDir, 'PLCDirectMaintenance-Android-Source.zip'), zipBuffer);

  console.log('Successfully generated physical android/ folder and public ZIP file!');
}

main().catch(console.error);
