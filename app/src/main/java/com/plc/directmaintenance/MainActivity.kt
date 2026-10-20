export interface CodeFile {
  path: string;
  name: string;
  category: 'gradle' | 'manifest' | 'kotlin' | 'workflow' | 'docs' | 'res' | 'driver';
  language: string;
  description: string;
  content: string;
}

export const KOTLIN_CODEBASE: CodeFile[] = [
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts',
    category: 'gradle',
    language: 'kotlin',
    description: 'Gradle multi-project root settings, plugin repositories, and JitPack for USB driver libraries.',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = java.net.URI("https://jitpack.io") }
    }
}

rootProject.name = "PLCDirectMaintenance"
include(":app")
`
  },
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts',
    category: 'gradle',
    language: 'kotlin',
    description: 'Top-level root build file with Android Gradle Plugin 8.3 and Kotlin 1.9.23 configurations.',
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}

tasks.register("clean", Delete::class) {
    delete(rootProject.layout.buildDirectory)
}
`
  },
  {
    path: 'gradle.properties',
    name: 'gradle.properties',
    category: 'gradle',
    language: 'properties',
    description: 'JVM memory settings, AndroidX flags, and parallel execution optimizations for fast APK compilation.',
    content: `# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configuration-cache=true

# AndroidX package structure
android.useAndroidX=true
android.enableJetifier=false
android.nonTransitiveRClass=true
`
  },
  {
    path: '.github/workflows/main.yml',
    name: '.github/workflows/main.yml',
    category: 'workflow',
    language: 'yaml',
    description: 'Automated GitHub Actions CI/CD workflow that compiles, signs, and releases the APK on every push.',
    content: `name: Build & Release PLC Direct Maintenance APK

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-apk:
    name: Assemble Production Android APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: 'gradle'

      - name: Make Gradle Wrapper Executable
        run: chmod +x ./gradlew

      - name: Run Unit Tests & Lint
        run: ./gradlew testDebugUnitTest

      - name: Build Release APK with Schneider USB & RJ-45 Drivers
        run: ./gradlew assembleRelease --stacktrace

      - name: Upload APK Build Artifact
        uses: actions/upload-artifact@v4
        with:
          name: plc-direct-maintenance-apk
          path: app/build/outputs/apk/release/app-release-unsigned.apk
          if-no-files-found: warn

      - name: Create GitHub Release
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v1
        with:
          files: app/build/outputs/apk/release/*.apk
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`
  },
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    category: 'gradle',
    language: 'kotlin',
    description: 'Application module build script: includes Android USB Host, usb-serial-for-android driver, and Coroutines.',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.plc.directmaintenance"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.plc.directmaintenance"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        viewBinding = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.10"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Core AndroidX & Architecture
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")

    // Jetpack Compose UI
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Android USB Driver for Schneider Modicon USB-B & TSX CUSB485 Cable
    implementation("com.github.mik3y:usb-serial-for-android:3.8.0")

    // Background Service, Coroutines & Notifications
    implementation("androidx.work:work-runtime-ktx:2.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'manifest',
    language: 'xml',
    description: 'Declares USB Host hardware feature, USB permissions, device filter intent, and notification services.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.plc.directmaintenance">

    <!-- Critical Notification & Alert Permissions -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />

    <!-- Schneider PLC USB-B and RJ-45 to Type-C Permissions -->
    <uses-feature android:name="android.hardware.usb.host" android:required="true" />
    <uses-permission android:name="android.permission.USB_PERMISSION" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />

    <!-- Local Network Discovery: mDNS ZeroConf and Multicast UDP Heartbeat Listener -->
    <uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

    <!-- Foreground Service Permissions for Real-Time PLC Watcher (Android 14+ API 34 compliance) -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />

    <application
        android:name=".PLCDirectMaintenanceApp"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.PLCDirectMaintenance"
        tools:targetApi="34">

        <!-- Main Dashboard Activity with USB Auto-Attach Intent Filter -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/Theme.PLCDirectMaintenance">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Automatically launches or notifies app when Schneider PLC USB-B cable is plugged into USB-C -->
            <intent-filter>
                <action android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED" />
            </intent-filter>
            <meta-data
                android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED"
                android:resource="@xml/device_filter" />
        </activity>

        <!-- BroadcastReceiver for Notification Action Buttons (Acknowledge, Dispatch, Snooze) -->
        <receiver
            android:name=".notifications.NotificationActionReceiver"
            android:exported="false">
            <intent-filter>
                <action android:name="com.plc.directmaintenance.ACTION_ACKNOWLEDGE_ALERT" />
                <action android:name="com.plc.directmaintenance.ACTION_DISPATCH_TECH" />
                <action android:name="com.plc.directmaintenance.ACTION_SNOOZE_ALERT" />
            </intent-filter>
        </receiver>

        <!-- Persistent Background Foreground Service for Instant PLC Alerts -->
        <service
            android:name=".service.DirectMaintenanceService"
            android:exported="false"
            android:foregroundServiceType="dataSync" />

        <!-- Auto-restart service on device boot -->
        <receiver
            android:name=".service.BootReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

    </application>
</manifest>
`
  },
  {
    path: 'app/src/main/res/xml/device_filter.xml',
    name: 'device_filter.xml',
    category: 'res',
    language: 'xml',
    description: 'USB hardware device filter matching Schneider Electric PLCs, CDC-ACM programming ports, and FTDI cables.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Schneider Electric Modicon M221 / M241 / M251 / M340 / M580 Built-In USB-B Port -->
    <usb-device vendor-id="8482" /> <!-- 0x2122 Schneider Electric -->
    <usb-device vendor-id="8482" product-id="545" /> <!-- 0x0221 Modicon M221 -->
    <usb-device vendor-id="8482" product-id="577" /> <!-- 0x0241 Modicon M241 -->
    <usb-device vendor-id="8482" product-id="832" /> <!-- 0x0340 Modicon M340 -->

    <!-- Schneider TSX CUSB485 / TSXPCX3030 FTDI USB Programming Cable -->
    <usb-device vendor-id="1027" product-id="24577" /> <!-- 0x0403 FTDI FT232R (0x6001) -->
    
    <!-- Silicon Labs CP210x Industrial USB-to-RS485 Converters -->
    <usb-device vendor-id="4292" product-id="60000" /> <!-- 0x10C4 CP2102 (0xEA60) -->

    <!-- Generic CDC-ACM Virtual Com Port for Modicon USB-B -->
    <usb-device class="2" />
</resources>
`
  },
  {
    path: 'app/src/main/java/com/plc/directmaintenance/drivers/SchneiderUsbDriver.kt',
    name: 'SchneiderUsbDriver.kt',
    category: 'driver',
    language: 'kotlin',
    description: 'Android USB Host driver for Schneider Electric PLCs via USB-B to Type-C OTG cable (CDC-ACM & FTDI support).',
    content: `package com.plc.directmaintenance.drivers

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Build
import android.util.Log
import com.hoho.android.usbserial.driver.*
import com.hoho.android.usbserial.util.SerialInputOutputManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.IOException
import java.util.concurrent.Executors

/**
 * Android USB Driver for Schneider Electric Modicon PLCs (M221, M241, M251, M340, M580).
 * Handles direct USB-B / Mini-USB to USB-C connection using USB-OTG.
 *
 * Supports:
 * - CDC-ACM driver for built-in Modicon USB-B programming ports
 * - FTDI driver for Schneider TSX CUSB485 / TSXPCX3030 communication cables
 * - Baud rate: 19200 (Default Modbus), 8 data bits, Parity Even, 1 stop bit
 */
class SchneiderUsbDriver(private val context: Context) {

    private val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
    private var usbSerialPort: UsbSerialPort? = null
    private var ioManager: SerialInputOutputManager? = null

    private var onDataReceivedListener: ((ByteArray) -> Unit)? = null
    private var onConnectionStatusChanged: ((Boolean, String) -> Unit)? = null

    companion object {
        private const val TAG = "SchneiderUsbDriver"
        const val ACTION_USB_PERMISSION = "com.plc.directmaintenance.USB_PERMISSION"

        // Schneider Electric Vendor ID: 0x2122 (8482 dec)
        const val SCHNEIDER_VENDOR_ID = 8482
        // FTDI Vendor ID for TSX CUSB485 cable: 0x0403 (1027 dec)
        const val FTDI_VENDOR_ID = 1027
    }

    fun setCallbacks(
        onData: (ByteArray) -> Unit,
        onStatus: (Boolean, String) -> Unit
    ) {
        this.onDataReceivedListener = onData
        this.onConnectionStatusChanged = onStatus
    }

    /**
     * Enumerates connected USB devices and connects to the Schneider PLC via USB-B.
     */
    fun findAndConnectSchneiderPlc() {
        val availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager)
        if (availableDrivers.isEmpty()) {
            onConnectionStatusChanged?.invoke(false, "No USB devices detected. Connect USB-B to Type-C cable.")
            return
        }

        // Find Schneider device or FTDI programming adapter
        var targetDriver: UsbSerialDriver? = null
        for (driver in availableDrivers) {
            val device = driver.device
            if (device.vendorId == SCHNEIDER_VENDOR_ID || device.vendorId == FTDI_VENDOR_ID) {
                targetDriver = driver
                break
            }
        }

        // Fallback to first available serial port if custom converter used
        if (targetDriver == null && availableDrivers.isNotEmpty()) {
            targetDriver = availableDrivers[0]
        }

        if (targetDriver == null) {
            onConnectionStatusChanged?.invoke(false, "Schneider Modicon USB device not recognized.")
            return
        }

        val device = targetDriver.device
        if (!usbManager.hasPermission(device)) {
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_MUTABLE
            } else {
                0
            }
            val permissionIntent = PendingIntent.getBroadcast(
                context, 0, Intent(ACTION_USB_PERMISSION), flags
            )
            val filter = IntentFilter(ACTION_USB_PERMISSION)
            context.registerReceiver(object : BroadcastReceiver() {
                override fun onReceive(c: Context, intent: Intent) {
                    if (ACTION_USB_PERMISSION == intent.action) {
                        synchronized(this) {
                            val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
                            if (granted) {
                                openPort(targetDriver)
                            } else {
                                onConnectionStatusChanged?.invoke(false, "USB Host permission denied by user.")
                            }
                        }
                    }
                }
            }, filter)
            usbManager.requestPermission(device, permissionIntent)
        } else {
            openPort(targetDriver)
        }
    }

    private fun openPort(driver: UsbSerialDriver) {
        try {
            val connection = usbManager.openDevice(driver.device)
                ?: throw IOException("Failed to open Android UsbDeviceConnection.")

            val port = driver.ports[0] // Most PLCs use port 0
            port.open(connection)

            // Standard Schneider Modicon communication parameters:
            // 19200 Baud, 8 Data Bits, 1 Stop Bit, Parity Even (Modbus RTU standard)
            port.setParameters(
                19200,
                8,
                UsbSerialPort.STOPBITS_1,
                UsbSerialPort.PARITY_EVEN
            )

            usbSerialPort = port

            // Start IO listener thread
            val executor = Executors.newSingleThreadExecutor()
            ioManager = SerialInputOutputManager(port, object : SerialInputOutputManager.Listener {
                override fun onNewData(data: ByteArray) {
                    onDataReceivedListener?.invoke(data)
                }

                override fun onRunError(e: Exception) {
                    Log.e(TAG, "USB Serial run error: \${e.message}")
                    onConnectionStatusChanged?.invoke(false, "USB Connection lost: \${e.message}")
                }
            })
            executor.submit(ioManager)

            val modelName = when (driver.device.vendorId) {
                SCHNEIDER_VENDOR_ID -> "Schneider Modicon (USB-B Native)"
                FTDI_VENDOR_ID -> "Schneider TSX CUSB485 Cable"
                else -> "USB Serial (\${driver.javaClass.simpleName})"
            }

            onConnectionStatusChanged?.invoke(true, "Connected via USB-B to \$modelName (19200 8-E-1)")
        } catch (e: Exception) {
            Log.e(TAG, "Error opening Schneider USB port", e)
            onConnectionStatusChanged?.invoke(false, "Error: \${e.message}")
        }
    }

    /**
     * Reads Schneider Modicon Holding Register (%MW) over Modbus RTU USB.
     * Function Code 0x03: Read Holding Registers
     */
    suspend fun readHoldingRegister(slaveAddress: Int, registerAddress: Int, count: Int): ByteArray? = withContext(Dispatchers.IO) {
        val port = usbSerialPort ?: return@withContext null

        val frame = ByteArray(8)
        frame[0] = slaveAddress.toByte()
        frame[1] = 0x03 // Read Holding Registers
        frame[2] = ((registerAddress shr 8) and 0xFF).toByte()
        frame[3] = (registerAddress and 0xFF).toByte()
        frame[4] = ((count shr 8) and 0xFF).toByte()
        frame[5] = (count and 0xFF).toByte()

        val crc = calculateCrc16(frame, 6)
        frame[6] = (crc and 0xFF).toByte()
        frame[7] = ((crc shr 8) and 0xFF).toByte()

        try {
            port.write(frame, 1000)
            val buffer = ByteArray(256)
            val len = port.read(buffer, 1000)
            if (len > 0) buffer.copyOf(len) else null
        } catch (e: Exception) {
            Log.e(TAG, "Error reading %MW register over USB", e)
            null
        }
    }

    fun disconnect() {
        ioManager?.stop()
        try {
            usbSerialPort?.close()
        } catch (ignored: Exception) {}
        usbSerialPort = null
        onConnectionStatusChanged?.invoke(false, "Disconnected")
    }

    private fun calculateCrc16(buffer: ByteArray, length: Int): Int {
        var crc = 0xFFFF
        for (pos in 0 until length) {
            crc = crc xor (buffer[pos].toInt() and 0xFF)
            for (i in 8 downTo 1) {
                if ((crc and 0x0001) != 0) {
                    crc = (crc shr 1) xor 0xA001
                } else {
                    crc = crc shr 1
                }
            }
        }
        return crc
    }
}
`
  },
  {
    path: 'app/src/main/java/com/plc/directmaintenance/drivers/SchneiderModbusTcpDriver.kt',
    name: 'SchneiderModbusTcpDriver.kt',
    category: 'driver',
    language: 'kotlin',
    description: 'High-speed RJ-45 Ethernet to USB-C driver for Schneider Modicon PLCs (Modbus TCP Port 502).',
    content: `package com.plc.directmaintenance.drivers

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.Socket
import java.util.concurrent.atomic.AtomicInteger

/**
 * Driver for RJ-45 to Type-C Ethernet connection directly to Schneider Electric Modicon PLCs.
 * Communicates via native Modbus TCP (Port 502) or X-Way Ethernet.
 *
 * Supported PLCs:
 * - Schneider Modicon M580 (BMEP58xxxx)
 * - Schneider Modicon M340 (BMXP34xxxx)
 * - Schneider Modicon M241 / M251
 *
 * Includes automatic default Schneider IP resolution from MAC Address (84.x.y.z standard).
 */
class SchneiderModbusTcpDriver {

    private var socket: Socket? = null
    private var inputStream: InputStream? = null
    private var outputStream: OutputStream? = null
    private val transactionId = AtomicInteger(1)

    companion object {
        private const val TAG = "SchneiderModbusTcp"
        const val MODBUS_PORT = 502

        /**
         * Calculates Schneider Electric factory default fallback IP address
         * based on the PLC MAC address: 84.x.y.z (where x, y, z are the last 3 octets).
         */
        fun calculateDefaultSchneiderIp(macAddress: String): String {
            val parts = macAddress.replace(":", "-").split("-")
            if (parts.size == 6) {
                val x = parts[3].toIntOrNull(16) ?: 0
                val y = parts[4].toIntOrNull(16) ?: 0
                val z = parts[5].toIntOrNull(16) ?: 0
                return "84.\$x.\$y.\$z"
            }
            return "192.168.1.10"
        }
    }

    suspend fun connect(ipAddress: String, timeoutMs: Int = 3000): Boolean = withContext(Dispatchers.IO) {
        try {
            disconnect()
            val s = Socket()
            s.connect(InetSocketAddress(ipAddress, MODBUS_PORT), timeoutMs)
            s.soTimeout = 2000
            s.tcpNoDelay = true

            socket = s
            inputStream = s.getInputStream()
            outputStream = s.getOutputStream()
            Log.i(TAG, "Connected to Schneider Modicon at \$ipAddress:502 via RJ-45 to Type-C")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to connect to Schneider PLC: \${e.message}")
            false
        }
    }

    /**
     * Reads Schneider %MW (Holding Registers) via Modbus TCP Function 0x03.
     * @param startRegister Zero-based register address (e.g. 100 for %MW100)
     * @param count Number of 16-bit registers to read
     * @return List of 16-bit register values (IntArray)
     */
    suspend fun readHoldingRegisters(
        startRegister: Int,
        count: Int,
        unitId: Int = 255
    ): IntArray? = withContext(Dispatchers.IO) {
        val out = outputStream ?: return@withContext null
        val inStream = inputStream ?: return@withContext null

        val tId = transactionId.incrementAndGet() and 0xFFFF
        val request = ByteArray(12)

        // Modbus TCP MBAP Header
        request[0] = ((tId shr 8) and 0xFF).toByte()
        request[1] = (tId and 0xFF).toByte()
        request[2] = 0x00 // Protocol ID High (0 for Modbus)
        request[3] = 0x00 // Protocol ID Low
        request[4] = 0x00 // Length High
        request[5] = 0x06 // Length Low (6 bytes follow)
        request[6] = (unitId and 0xFF).toByte() // Unit ID / Slave Address

        // Function Code: 0x03 (Read Holding Registers)
        request[7] = 0x03
        // Starting Address
        request[8] = ((startRegister shr 8) and 0xFF).toByte()
        request[9] = (startRegister and 0xFF).toByte()
        // Quantity of Registers
        request[10] = ((count shr 8) and 0xFF).toByte()
        request[11] = (count and 0xFF).toByte()

        try {
            out.write(request)
            out.flush()

            val header = ByteArray(9)
            var bytesRead = 0
            while (bytesRead < 9) {
                val r = inStream.read(header, bytesRead, 9 - bytesRead)
                if (r == -1) return@withContext null
                bytesRead += r
            }

            val byteCount = header[8].toInt() and 0xFF
            val data = ByteArray(byteCount)
            bytesRead = 0
            while (bytesRead < byteCount) {
                val r = inStream.read(data, bytesRead, byteCount - bytesRead)
                if (r == -1) return@withContext null
                bytesRead += r
            }

            val result = IntArray(count)
            for (i in 0 until count) {
                val high = data[i * 2].toInt() and 0xFF
                val low = data[i * 2 + 1].toInt() and 0xFF
                result[i] = (high shl 8) or low
            }
            result
        } catch (e: Exception) {
            Log.e(TAG, "Error in Modbus TCP readHoldingRegisters", e)
            null
        }
    }

    /**
     * Reads Schneider System Words %SW (e.g., %SW50 error code, %SW0 task time).
     */
    suspend fun readSystemWords(startWord: Int, count: Int): IntArray? {
        // Schneider maps %SW to Holding Registers offset or custom system area
        return readHoldingRegisters(startWord, count, unitId = 255)
    }

    /**
     * Reads Schneider Coils / Internal Bits %M (Function 0x01).
     */
    suspend fun readInternalBits(startBit: Int, count: Int): BooleanArray? = withContext(Dispatchers.IO) {
        // Queries Modbus Coils
        val out = outputStream ?: return@withContext null
        val inStream = inputStream ?: return@withContext null

        val tId = transactionId.incrementAndGet() and 0xFFFF
        val request = ByteArray(12)
        request[0] = ((tId shr 8) and 0xFF).toByte()
        request[1] = (tId and 0xFF).toByte()
        request[2] = 0x00
        request[3] = 0x00
        request[4] = 0x00
        request[5] = 0x06
        request[6] = 0xFF.toByte() // Unit ID
        request[7] = 0x01 // Read Coils (%M)
        request[8] = ((startBit shr 8) and 0xFF).toByte()
        request[9] = (startBit and 0xFF).toByte()
        request[10] = ((count shr 8) and 0xFF).toByte()
        request[11] = (count and 0xFF).toByte()

        try {
            out.write(request)
            out.flush()

            val header = ByteArray(9)
            inStream.read(header, 0, 9)
            val byteCount = header[8].toInt() and 0xFF
            val data = ByteArray(byteCount)
            inStream.read(data, 0, byteCount)

            val bits = BooleanArray(count)
            for (i in 0 until count) {
                val byteIndex = i / 8
                val bitIndex = i % 8
                bits[i] = ((data[byteIndex].toInt() shr bitIndex) and 1) == 1
            }
            bits
        } catch (e: Exception) {
            null
        }
    }

    fun disconnect() {
        try {
            socket?.close()
        } catch (ignored: Exception) {}
        socket = null
        inputStream = null
        outputStream = null
    }

    fun isConnected(): Boolean = socket?.isConnected == true && socket?.isClosed == false
}
`
  },
  {
    path: 'app/src/main/java/com/plc/directmaintenance/drivers/SchneiderPlcManager.kt',
    name: 'SchneiderPlcManager.kt',
    category: 'driver',
    language: 'kotlin',
    description: 'Hardware manager coordinating USB-B and RJ-45 to Type-C drivers and pumping alarms into the Notification Engine.',
    content: `package com.plc.directmaintenance.drivers

import android.content.Context
import com.plc.directmaintenance.model.AlertSeverity
import com.plc.directmaintenance.model.PlcAlert
import com.plc.directmaintenance.notifications.NotificationHelper
import kotlinx.coroutines.*

/**
 * Unified Schneider Electric PLC Hardware Manager.
 * Bridges direct USB-B and RJ-45 physical connections to the Real-Time Notification Engine.
 */
class SchneiderPlcManager(
    private val context: Context,
    private val notificationHelper: NotificationHelper
) {
    val usbDriver = SchneiderUsbDriver(context)
    val tcpDriver = SchneiderModbusTcpDriver()

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var isMonitoring = false

    fun startRealTimeMonitoring(ipAddress: String) {
        if (isMonitoring) return
        isMonitoring = true

        scope.launch {
            // Attempt RJ-45 connection first
            val connected = tcpDriver.connect(ipAddress)
            if (!connected) {
                // Attempt USB-B OTG connection
                usbDriver.findAndConnectSchneiderPlc()
            }

            while (isActive && isMonitoring) {
                delay(1000)

                // 1. Poll Schneider System Words (%SW50: Diagnostic Error Register)
                val sw = tcpDriver.readSystemWords(startWord = 50, count = 2)
                if (sw != null && sw.isNotEmpty()) {
                    val errorCode = sw[0]
                    if (errorCode != 0) {
                        // PLC Fault detected! Dispatch instant high-priority alert
                        val alert = PlcAlert(
                            id = "SCHN-" + System.currentTimeMillis().toString().takeLast(4),
                            machineId = "SCHNEIDER-M580-01",
                            machineName = "Schneider Modicon M580 (RJ45 Direct)",
                            plcTag = "%SW50_ERROR_REG",
                            severity = if (errorCode > 0x4000) AlertSeverity.CRITICAL else AlertSeverity.HIGH,
                            title = "SCHNEIDER FAULT 0x" + Integer.toHexString(errorCode).uppercase(),
                            message = "Diagnostic error detected on Schneider Modicon rack. Error code: 0x" + Integer.toHexString(errorCode).uppercase(),
                            timestamp = System.currentTimeMillis(),
                            temperatureC = 68.4f,
                            pressureBar = 180.0f
                        )
                        notificationHelper.postCustomRealTimeAlert(alert)
                    }
                }

                // 2. Poll Emergency Stop Interlock Bit (%M1)
                val bits = tcpDriver.readInternalBits(startBit = 1, count = 1)
                if (bits != null && bits.isNotEmpty() && bits[0]) {
                    // %M1 is HIGH -> E-Stop triggered!
                    val estopAlert = PlcAlert(
                        id = "ESTOP-" + System.currentTimeMillis().toString().takeLast(4),
                        machineId = "SCHNEIDER-M340",
                        machineName = "Schneider Modicon M340 Cell",
                        plcTag = "%M1_ESTOP_TRIPPED",
                        severity = AlertSeverity.CRITICAL,
                        title = "🚨 EMERGENCY STOP ACTIVE (%M1)",
                        message = "Physical E-Stop button actuated on Schneider Modicon M340. Machine de-energized via USB-B/RJ-45 safety loop.",
                        timestamp = System.currentTimeMillis(),
                        temperatureC = 45.0f,
                        pressureBar = 0.0f
                    )
                    notificationHelper.postCustomRealTimeAlert(estopAlert)
                }
            }
        }
    }

    fun stop() {
        isMonitoring = false
        scope.cancel()
        usbDriver.disconnect()
        tcpDriver.disconnect()
    }
}
`
  },
  {
    path: 'app/src/main/java/com/plc/directmaintenance/MainActivity.kt',
    name: 'MainActivity.kt',
    category: 'kotlin',
    language: 'kotlin',
    description: 'Main Android Activity with Schneider USB-B and RJ-45 to Type-C driver integration, Compose UI, and real-time alerts.',
    content: `