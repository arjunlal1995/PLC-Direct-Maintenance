# PLC Direct Maintenance - Android APK & Real-Time Alert Engine

Production Android Kotlin application designed for industrial maintenance technicians, plant automation engineers, and SCADA operators. Provides real-time notifications with heads-up overlay, custom vibration cadences, sticky siren alarms, and **native hardware drivers for Schneider Electric PLCs via USB-B and RJ-45 to Type-C**.

## Hardware Connectivity

### 1. Schneider USB-B to USB-C (OTG)
- Directly connects your Android device's USB-C port to the Schneider Modicon programming port (USB-B or Mini-USB).
- Driver uses `android.hardware.usb.UsbManager` and CDC-ACM / FTDI serial engine.
- Baud Rate: 19200, 8 Data Bits, Parity Even, 1 Stop Bit (Modbus RTU).
- Supports Schneider Vendor ID `0x2122` and FTDI `0x0403` (TSX CUSB485).

### 2. Schneider RJ-45 to USB-C (Ethernet Modbus TCP)
- Connects using a USB-C Ethernet adapter (Realtek RTL8153 / ASIX) directly to the Schneider Modicon Ethernet port (ETH 1 / ETH 2 / Service Port).
- Native Modbus TCP driver on Port 502.
- Automatic default fallback IP calculation based on Schneider MAC address standard (`84.x.y.z`).

---

## Building the APK

```bash
# 1. Clone repository
git clone https://github.com/your-org/plc-direct-maintenance.git
cd plc-direct-maintenance

# 2. Grant executable permissions to Gradle wrapper
chmod +x gradlew

# 3. Compile and build the Release APK
./gradlew assembleRelease

# The generated APK will be at:
# app/build/outputs/apk/release/app-release-unsigned.apk
```

### Install to Android Device via ADB:
```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```
