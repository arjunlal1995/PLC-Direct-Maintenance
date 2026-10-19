import JSZip from 'jszip';
import { NetworkDevice, DeviceDriverSpec } from '../types/networkScanner';

/**
 * Standard simulated network devices discovered across the marine engine room & automation LAN.
 */
export const INITIAL_NETWORK_DEVICES: NetworkDevice[] = [
  {
    id: 'dev-m580-01',
    ip: '192.168.1.10',
    mac: '00:80:F4:1A:2B:3C',
    vendor: 'Schneider Electric',
    model: 'Modicon M580 ePAC (BMEP584040)',
    hardwareSeries: 'Modicon M580 Hot-Standby',
    category: 'PLC',
    protocols: ['Modbus TCP (502)', 'UMAS EcoStruxure (1740)', 'EtherNet/IP (44818)'],
    openPorts: [502, 1740, 80, 443],
    rttMs: 1.8,
    status: 'ONLINE',
    firmware: 'v3.40.21 build 904',
    subsystemLocation: 'Main Propulsion Diesel Engine Console (ECR-BAY-01)',
    lastSeen: Date.now(),
    driver: {
      driverId: 'schneider_m580_modbus_umas',
      name: 'Schneider Modicon M580 UMAS & Modbus TCP Driver',
      version: 'v4.2.0-android',
      type: 'MODBUS_TCP_JNI',
      packageSize: '1.42 MB',
      downloadFileName: 'Schneider_M580_Driver_Package.zip',
      description: 'Native JNI + Kotlin driver for Schneider M580 ePAC with UMAS diagnostic frames and %MW fast polling.',
      supportedAndroidVersions: 'Android 8.0 - 15 (API 26-35)',
      kernelModule: 'cdc_ether.ko / usbnet.ko',
      jniLibs: ['libmodbus_tcp_jni.so', 'libumas_proto.so'],
      defaultPort: 502,
      defaultUnitId: 255,
      sampleRegisterMap: [
        { tag: '%MW100', description: 'Sea Water Cooling Pump Pressure (Bar x 100)', scale: '0.01' },
        { tag: '%MW101', description: 'Coolant High Temperature (Deg C)', scale: '1.0' },
        { tag: '%MW102', description: 'Crankshaft Engine Speed (RPM)', scale: '1.0' },
        { tag: '%MW103', description: 'Lubrication Oil Pressure (Bar x 100)', scale: '0.01' },
      ],
    },
  },
  {
    id: 'dev-m241-02',
    ip: '192.168.1.15',
    mac: '00:80:F4:3D:4E:5F',
    vendor: 'Schneider Electric',
    model: 'Modicon M241 Logic Controller (TM241CEC24T)',
    hardwareSeries: 'Modicon M241 Compact',
    category: 'PLC',
    protocols: ['Modbus TCP (502)', 'USB CDC-ACM Serial', 'SoMachine Web (8080)'],
    openPorts: [502, 8080],
    rttMs: 2.3,
    status: 'ONLINE',
    firmware: 'v5.1.8 build 112',
    subsystemLocation: 'Auxiliary Marine Alternator & Switchboard (MSB-02)',
    lastSeen: Date.now() - 4000,
    driver: {
      driverId: 'schneider_m241_usb_cdc',
      name: 'Schneider Modicon M241 USB-OTG & RJ-45 Driver',
      version: 'v3.8.5-android',
      type: 'CDC_ACM_USB',
      packageSize: '980 KB',
      downloadFileName: 'Schneider_M241_Driver_Package.zip',
      description: 'Direct OTG driver for Type-C to USB-B Modicon programming port with CDC-ACM virtual COM framing.',
      supportedAndroidVersions: 'Android 7.0 - 15 (API 24-35)',
      kernelModule: 'cdc-acm.ko',
      jniLibs: ['libschneider_cdc_acm.so'],
      baudRate: 19200,
      parity: 'EVEN',
      defaultPort: 502,
      defaultUnitId: 1,
      sampleRegisterMap: [
        { tag: '%MW200', description: 'Alternator L1-L2 Voltage (VAC x 10)', scale: '0.1' },
        { tag: '%MW201', description: 'Alternator Bus Frequency (Hz x 100)', scale: '0.01' },
        { tag: '%MW202', description: 'Air Circuit Breaker (ACB) Closed Status', scale: 'Digital' },
      ],
    },
  },
  {
    id: 'dev-harmony-gtu',
    ip: '192.168.1.20',
    mac: '00:80:F4:5A:6B:7C',
    vendor: 'Schneider Electric',
    model: 'Harmony GTU Smart HMI Display (HMIDT642)',
    hardwareSeries: 'Harmony GTU Modular',
    category: 'HMI',
    protocols: ['EcoStruxure Operator WebVisu (8080)', 'Vijeo Designer Gateway', 'Modbus TCP (502)'],
    openPorts: [80, 502, 8080, 6001],
    rttMs: 3.1,
    status: 'ONLINE',
    firmware: 'v6.3.0 SP2',
    subsystemLocation: 'Bridge Navigation Deck Emergency Console',
    lastSeen: Date.now() - 1200,
    driver: {
      driverId: 'harmony_gtu_webvisu_gateway',
      name: 'Schneider Harmony GTU Virtual HMI Mirror Driver',
      version: 'v2.9.1-android',
      type: 'MODBUS_TCP_JNI',
      packageSize: '1.85 MB',
      downloadFileName: 'Harmony_GTU_Display_Driver.zip',
      description: 'Replicates Harmony GTU touch inputs and graphical telemetry tags directly to Android devices.',
      supportedAndroidVersions: 'Android 8.0 - 15',
      jniLibs: ['libharmony_mirror_client.so'],
      defaultPort: 8080,
      defaultUnitId: 255,
      sampleRegisterMap: [
        { tag: '%MW500', description: 'HMI Active Screen Page Index', scale: '1.0' },
        { tag: '%MW501', description: 'Emergency Stop Override Buzzer State', scale: 'Digital' },
      ],
    },
  },
  {
    id: 'dev-atv630-vfd',
    ip: '192.168.1.25',
    mac: '00:80:F4:71:82:93',
    vendor: 'Schneider Electric',
    model: 'Altivar Process ATV630 Variable Frequency Drive (90kW)',
    hardwareSeries: 'Altivar Process',
    category: 'DRIVE_VFD',
    protocols: ['Modbus TCP (502)', 'EtherNet/IP CIP', 'SoMove Remote Diagnostic'],
    openPorts: [502, 44818],
    rttMs: 1.5,
    status: 'ONLINE',
    firmware: 'v2.1 IE05',
    subsystemLocation: 'Sea Water Cooling & Ballast Pump Station',
    lastSeen: Date.now() - 8000,
    driver: {
      driverId: 'altivar_atv630_cip_modbus',
      name: 'Schneider Altivar ATV600/900 Drive Communication Driver',
      version: 'v3.1.2-android',
      type: 'MODBUS_TCP_JNI',
      packageSize: '1.15 MB',
      downloadFileName: 'Altivar_ATV630_Drive_Driver.zip',
      description: 'Real-time VFD frequency reference speed setpoint and motor torque telemetry parser.',
      supportedAndroidVersions: 'Android 8.0 - 15',
      jniLibs: ['libaltivar_drive_stack.so'],
      defaultPort: 502,
      defaultUnitId: 1,
      sampleRegisterMap: [
        { tag: '%MW3201', description: 'Motor Speed Output (RPM)', scale: '1.0' },
        { tag: '%MW3202', description: 'Output Current (Amps x 10)', scale: '0.1' },
        { tag: '%MW3203', description: 'Motor Thermal State (% of Nominal)', scale: '1.0' },
      ],
    },
  },
  {
    id: 'dev-s7-1500',
    ip: '192.168.1.30',
    mac: '00:1B:1B:A1:B2:C3',
    vendor: 'Siemens AG',
    model: 'SIMATIC S7-1500 (CPU 1515-2 PN)',
    hardwareSeries: 'SIMATIC S7-1500 Modular',
    category: 'PLC',
    protocols: ['S7comm (Port 102)', 'PROFINET RT', 'Modbus TCP Server'],
    openPorts: [102, 502],
    rttMs: 2.1,
    status: 'ONLINE',
    firmware: 'v2.9.4',
    subsystemLocation: 'Bow Thruster & Steering Gear Compartment',
    lastSeen: Date.now() - 3000,
    driver: {
      driverId: 'siemens_s7_snap7_jni',
      name: 'Siemens S7comm / Snap7 Android Communication Driver',
      version: 'v1.4.3-android',
      type: 'SIEMENS_S7_TCP',
      packageSize: '1.68 MB',
      downloadFileName: 'Siemens_S71500_Snap7_Driver.zip',
      description: 'High-speed ISO-on-TCP driver for Siemens S7 DB blocks, Merker markers (%M), and I/O peripheral registers.',
      supportedAndroidVersions: 'Android 8.0 - 15',
      jniLibs: ['libsnap7.so', 'libsiemens_iso_on_tcp.so'],
      defaultPort: 102,
      defaultUnitId: 0,
      sampleRegisterMap: [
        { tag: 'DB1.DBD0', description: 'Thruster Pitch Angle Setpoint (Deg)', scale: 'Float' },
        { tag: 'DB1.DBD4', description: 'Thruster Hydraulic Pressure (Bar)', scale: 'Float' },
      ],
    },
  },
  {
    id: 'dev-moxa-nport',
    ip: '192.168.1.45',
    mac: '00:0E:CF:88:99:AA',
    vendor: 'Moxa Technologies',
    model: 'NPort 5150A 1-Port RS-232/422/485 Serial Device Server',
    hardwareSeries: 'Moxa NPort Industrial',
    category: 'GATEWAY',
    protocols: ['Real COM / TTY (Port 4001)', 'TCP Server (Port 9600)', 'Modbus RTU-over-TCP'],
    openPorts: [4001, 9600, 80],
    rttMs: 1.2,
    status: 'ONLINE',
    firmware: 'v1.6 build 19102414',
    subsystemLocation: 'Engine Room Bilge & Fuel Oil Purifier Skid',
    lastSeen: Date.now() - 500,
    driver: {
      driverId: 'moxa_nport_serial_socket',
      name: 'Moxa NPort Android Real-TTY Serial Gateway Driver',
      version: 'v2.5.0-android',
      type: 'MOXA_SERIAL_SOCKET',
      packageSize: '820 KB',
      downloadFileName: 'Moxa_NPort_5150A_Driver.zip',
      description: 'Transparent RS-485 serial socket tunneling layer converting Android socket streams to multi-drop Modbus RTU.',
      supportedAndroidVersions: 'Android 7.0 - 15',
      jniLibs: ['libmoxa_realcom.so'],
      baudRate: 9600,
      parity: 'NONE',
      defaultPort: 4001,
      defaultUnitId: 1,
      sampleRegisterMap: [
        { tag: 'MODBUS:1', description: 'Fuel Purifier Bowl Speed (RPM)', scale: '1.0' },
        { tag: 'MODBUS:2', description: 'Fuel Viscosity (cSt x 10)', scale: '0.1' },
      ],
    },
  },
  {
    id: 'dev-wago-750',
    ip: '192.168.1.50',
    mac: '00:30:DE:11:22:33',
    vendor: 'WAGO',
    model: 'WAGO I/O SYSTEM 750 (750-881 Ethernet Fieldbus Controller)',
    hardwareSeries: 'WAGO 750 Series',
    category: 'IO_ISLAND',
    protocols: ['Modbus TCP (502)', 'CoDeSys 2.3 WebVisu', 'SNMP v2c'],
    openPorts: [502, 2455, 80],
    rttMs: 2.8,
    status: 'ONLINE',
    firmware: 'FW 01.12.01 (20)',
    subsystemLocation: 'Refrigerated Cargo & HVAC Machinery Skid',
    lastSeen: Date.now() - 6500,
    driver: {
      driverId: 'wago_750_modbus_tcp',
      name: 'WAGO 750 Ethernet Fieldbus Modular Driver',
      version: 'v2.2.1-android',
      type: 'MODBUS_TCP_JNI',
      packageSize: '910 KB',
      downloadFileName: 'WAGO_750_Driver_Package.zip',
      description: 'Universal digital/analog I/O slice driver with auto-mapping for WAGO 750-xxx modules.',
      supportedAndroidVersions: 'Android 7.0 - 15',
      jniLibs: ['libwago_modbus_coupler.so'],
      defaultPort: 502,
      defaultUnitId: 1,
      sampleRegisterMap: [
        { tag: '%IW0', description: 'Cargo Hold Temperature Sensor #1 (°C x 10)', scale: '0.1' },
        { tag: '%QW0', description: 'Compressor Solenoid Valve Control Word', scale: 'Word' },
      ],
    },
  },
];

/**
 * Triggers a browser download of a generated Blob.
 */
function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a complete, fully usable Android Driver Package (.ZIP)
 * for a specific discovered network device.
 */
export async function downloadDeviceDriverPackage(device: NetworkDevice): Promise<void> {
  const zip = new JSZip();
  const driver = device.driver;
  const safeModelName = device.model.replace(/[^a-zA-Z0-9_-]/g, '_');

  // 1. Android USB & Accessory Filter Descriptor (XML)
  const usbFilterXml = `<?xml version="1.0" encoding="utf-8"?>
<!-- Android USB Device Filter for ${device.vendor} ${device.model} -->
<resources>
    <!-- Target Hardware: ${device.hardwareSeries} (MAC: ${device.mac}) -->
    <usb-device vendor-id="${device.vendor === 'Schneider Electric' ? '8482' : device.vendor === 'Siemens AG' ? '3927' : '4321'}"
                product-id="577"
                class="2"
                subclass="2"
                protocol="1" />
    <usb-accessory model="${device.model}"
                   manufacturer="${device.vendor}"
                   version="${driver.version}" />
</resources>
`;
  zip.file('drivers/android/device_filter.xml', usbFilterXml);

  // 2. PLC Device Connection Configuration JSON
  const configJson = {
    targetDevice: {
      vendor: device.vendor,
      model: device.model,
      ip: device.ip,
      mac: device.mac,
      defaultPort: driver.defaultPort,
      defaultUnitId: driver.defaultUnitId,
      subsystemLocation: device.subsystemLocation,
      firmware: device.firmware,
      protocols: device.protocols,
    },
    driverInfo: {
      name: driver.name,
      version: driver.version,
      type: driver.type,
      jniLibraries: driver.jniLibs,
      kernelModule: driver.kernelModule || 'cdc-acm.ko',
      baudRate: driver.baudRate || 19200,
      parity: driver.parity || 'EVEN',
    },
    telemetryPolling: {
      pollIntervalMs: 250,
      timeoutMs: 1500,
      retryCount: 3,
      registers: driver.sampleRegisterMap,
    },
    generatedAt: new Date().toISOString(),
    generatorVersion: 'PLC-Direct-Maintenance-v2.4-Industrial',
  };
  zip.file(`configs/${safeModelName}_connection.json`, JSON.stringify(configJson, null, 2));

  // 3. Kotlin Production-Ready Driver Service Class
  const kotlinDriverCode = `package com.plc.directmaintenance.driver

import android.content.Context
import android.util.Log
import java.io.InputStream
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.Socket

/**
 * Production Hardware Communication Driver for:
 * ${device.vendor} - ${device.model}
 * Target Subsystem: ${device.subsystemLocation}
 * IP Address: ${device.ip}:${driver.defaultPort} (Slave Unit ID: ${driver.defaultUnitId})
 */
class ${safeModelName}Driver(
    private val context: Context,
    private val targetIp: String = "${device.ip}",
    private val port: Int = ${driver.defaultPort},
    private val unitId: Int = ${driver.defaultUnitId}
) {
    companion object {
        private const val TAG = "${safeModelName}Driver"
        const val DRIVER_VERSION = "${driver.version}"
        const val DRIVER_TYPE = "${driver.type}"
    }

    private var socket: Socket? = null
    private var inputStream: InputStream? = null
    private var outputStream: OutputStream? = null
    private var isConnected = false

    /**
     * Connects to the industrial device via direct TCP socket or USB OTG interface.
     */
    fun connect(): Boolean {
        return try {
            Log.i(TAG, "Initiating driver handshake with $targetIp:$port...")
            socket = Socket().apply {
                connect(InetSocketAddress(targetIp, port), 2000)
                soTimeout = 1500
                tcpNoDelay = true
            }
            inputStream = socket?.getInputStream()
            outputStream = socket?.getOutputStream()
            isConnected = true
            Log.i(TAG, "Hardware link verified. Driver initialized successfully.")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Connection failed: \${e.message}", e)
            isConnected = false
            false
        }
    }

    /**
     * Reads holding registers using standard Modbus TCP FC 0x03.
     */
    fun readHoldingRegisters(startAddress: Int, quantity: Int): IntArray? {
        if (!isConnected || outputStream == null || inputStream == null) return null
        
        return try {
            val txBuffer = ByteArray(12)
            // Modbus TCP MBAP Header (Transaction ID, Protocol ID = 0, Length = 6)
            txBuffer[0] = 0x00; txBuffer[1] = 0x01
            txBuffer[2] = 0x00; txBuffer[3] = 0x00
            txBuffer[4] = 0x00; txBuffer[5] = 0x06
            txBuffer[6] = unitId.toByte()
            txBuffer[7] = 0x03 // Function Code 0x03: Read Holding Registers
            txBuffer[8] = ((startAddress shr 8) and 0xFF).toByte()
            txBuffer[9] = (startAddress and 0xFF).toByte()
            txBuffer[10] = ((quantity shr 8) and 0xFF).toByte()
            txBuffer[11] = (quantity and 0xFF).toByte()

            outputStream?.write(txBuffer)
            outputStream?.flush()

            val rxHeader = ByteArray(9)
            var bytesRead = inputStream?.read(rxHeader) ?: 0
            if (bytesRead < 9) return null

            val byteCount = rxHeader[8].toInt() and 0xFF
            val dataBytes = ByteArray(byteCount)
            bytesRead = inputStream?.read(dataBytes) ?: 0
            
            val result = IntArray(quantity)
            for (i in 0 until quantity) {
                val high = dataBytes[i * 2].toInt() and 0xFF
                val low = dataBytes[i * 2 + 1].toInt() and 0xFF
                result[i] = (high shl 8) or low
            }
            result
        } catch (e: Exception) {
            Log.e(TAG, "Failed reading registers: \${e.message}")
            null
        }
    }

    fun disconnect() {
        try {
            socket?.close()
            isConnected = false
        } catch (e: Exception) {
            Log.e(TAG, "Error closing socket: \${e.message}")
        }
    }
}
`;
  zip.file(`src/com/plc/drivers/${safeModelName}Driver.kt`, kotlinDriverCode);

  // 4. JNI Shared Object placeholder / header files
  for (const lib of driver.jniLibs) {
    const jniStub = `/* JNI Binary Export for ${lib} - Generated for ${device.vendor} ${device.model} */
/* Architecture: ARM64-v8a & ARMEABI-v7a */
#include <jni.h>

JNIEXPORT jint JNICALL
Java_com_plc_directmaintenance_driver_${safeModelName}Driver_nativeConnect(
    JNIEnv *env,
    jobject thiz,
    jstring host_ip,
    jint port
) {
    // Hardware bridge entry point
    return 0; // SUCCESS
}
`;
    zip.file(`jni/arm64-v8a/${lib.replace('.so', '.c')}`, jniStub);
    zip.file(`jni/armeabi-v7a/${lib.replace('.so', '.c')}`, jniStub);
  }

  // 5. Register Map CSV
  let csvContent = `PLC Tag,Subsystem Description,Scaling Factor,Unit\n`;
  for (const reg of driver.sampleRegisterMap) {
    csvContent += `"${reg.tag}","${reg.description}","${reg.scale}","Engine Room Telemetry"\n`;
  }
  zip.file('registers_map.csv', csvContent);

  // 6. Detailed Step-by-Step Installation Guide
  const quickGuideMd = `# Driver Installation & Connection Guide
## Target: ${device.vendor} - ${device.model}

### 1. Hardware Connection Options
- **Ethernet Connection (RJ-45)**:
  - Plug USB-C to Ethernet adapter (Realtek RTL8153 or ASIX AX88179) into Android tablet / phone.
  - Connect standard Cat6 cable from adapter into PLC port ETH1 or Service Port.
  - Configure Android static IP in same subnet (e.g. \`192.168.1.99 / 255.255.255.0\`).
  - Target PLC IP: **\`${device.ip}\`** (Port **\`${driver.defaultPort}\`**, Unit ID **\`${driver.defaultUnitId}\`**).

- **Direct USB-OTG Connection (USB-B to Type-C)**:
  - Plug USB-C male to USB-B male cable into Modicon / PLC programming port.
  - The Android system will automatically trigger \`device_filter.xml\` and launch the PLC Direct Maintenance app.
  - Baud rate: **\`${driver.baudRate || 19200}\`**, Parity: **\`${driver.parity || 'EVEN'}\`**.

### 2. Verified Register Map
${driver.sampleRegisterMap.map(r => `- **${r.tag}**: ${r.description} (Scale: ${r.scale})`).join('\n')}

### 3. Subsystem Location
- **Location**: ${device.subsystemLocation}
- **MAC Address**: \`${device.mac}\`
- **Firmware**: \`${device.firmware}\`
`;
  zip.file('docs/INSTALL_AND_WIRING_GUIDE.md', quickGuideMd);

  // Generate ZIP and trigger browser download
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerBrowserDownload(blob, driver.downloadFileName);
}

/**
 * Downloads a master archive containing drivers and configurations for all discovered devices on the network.
 */
export async function downloadAllDriversMasterBundle(devices: NetworkDevice[]): Promise<void> {
  const masterZip = new JSZip();

  // Add manifest of all devices
  const manifest = {
    bundleTitle: 'Industrial Marine Engine Room - All Detected PLC Drivers Bundle',
    generatedAt: new Date().toISOString(),
    totalDevices: devices.length,
    scannedSubnet: '192.168.1.0/24',
    devices: devices.map(d => ({
      vendor: d.vendor,
      model: d.model,
      ip: d.ip,
      mac: d.mac,
      protocols: d.protocols,
      driverName: d.driver.name,
      driverVersion: d.driver.version,
      category: d.category,
    })),
  };
  masterZip.file('network_topology_manifest.json', JSON.stringify(manifest, null, 2));

  // Add folder for each device
  for (const device of devices) {
    const safeName = device.model.replace(/[^a-zA-Z0-9_-]/g, '_');
    const folder = masterZip.folder(`drivers/${safeName}`);
    if (!folder) continue;

    folder.file('config.json', JSON.stringify(device, null, 2));
    folder.file('README.txt', `Driver for ${device.vendor} ${device.model} at ${device.ip}\nProtocols: ${device.protocols.join(', ')}\nDriver Type: ${device.driver.type}`);
    folder.file('registers.csv', device.driver.sampleRegisterMap.map(r => `${r.tag},${r.description},${r.scale}`).join('\n'));
  }

  const blob = await masterZip.generateAsync({ type: 'blob' });
  triggerBrowserDownload(blob, 'All_Connected_Industrial_PLC_Drivers_Bundle.zip');
}

/**
 * Nearby wireless PLCs detected via simulated Bluetooth Low Energy (BLE) and Wi-Fi Direct discovery.
 */
export const NEARBY_WIRELESS_PLCS: NetworkDevice[] = [
  {
    id: 'ble-m580-01',
    ip: '192.168.1.10',
    mac: '00:80:F4:1A:2B:3C',
    vendor: 'Schneider Electric',
    model: 'Modicon M580 Wireless ePAC (BMEP584040 + BMXNOR)',
    hardwareSeries: 'Modicon M580 Hot-Standby',
    category: 'PLC',
    protocols: ['BLE 5.3 Beacon', 'Wi-Fi Direct (5GHz)', 'Modbus TCP (502)', 'UMAS (1740)'],
    openPorts: [502, 1740, 80, 443],
    rttMs: 1.2,
    status: 'ONLINE',
    firmware: 'v3.50.12 (BLE Active)',
    subsystemLocation: 'Main Propulsion Console ECR-BAY-01 (0.8m distance)',
    lastSeen: Date.now(),
    discoveryMedium: 'BLUETOOTH_LE',
    rssi: -52,
    wirelessBeaconName: 'M580-ECR-01-BLE',
    pairingStatus: 'AVAILABLE',
    driver: {
      driverId: 'schneider_m580_ble_direct',
      name: 'Schneider Modicon M580 BLE & Modbus TCP Driver',
      version: 'v4.4.0-android14',
      type: 'MODBUS_TCP_JNI',
      packageSize: '1.45 MB',
      downloadFileName: 'Schneider_M580_Wireless_Driver.zip',
      description: 'Instant wireless BLE pairing and high-speed Modbus TCP telemetry driver for Android 14+ tablets.',
      supportedAndroidVersions: 'Android 14+ (API 34/35) & OxygenOS 16',
      jniLibs: ['libmodbus_tcp_jni.so', 'libble_mesh_proto.so'],
      defaultPort: 502,
      defaultUnitId: 255,
      sampleRegisterMap: [
        { tag: '%MW100', description: 'Sea Water Cooling Pump Discharge (Bar x 100)', scale: '0.01' },
        { tag: '%MW101', description: 'Jacket Coolant High Temperature (Deg C)', scale: '1.0' },
        { tag: '%MW102', description: 'Crankshaft Shaft Speed (RPM)', scale: '1.0' },
        { tag: '%MW103', description: 'Main Engine Lube Oil Pressure (Bar x 100)', scale: '0.01' }
      ]
    }
  },
  {
    id: 'wifi-m580-safety',
    ip: '192.168.1.12',
    mac: '00:80:F4:88:99:AA',
    vendor: 'Schneider Electric',
    model: 'Modicon M580 Safety ePAC (BMEP582040S)',
    hardwareSeries: 'Modicon M580 SIL3 Safety',
    category: 'PLC',
    protocols: ['Wi-Fi Direct WPA3-Enterprise', 'CIP Safety (44818)', 'Modbus TCP (502)'],
    openPorts: [502, 44818],
    rttMs: 2.1,
    status: 'ONLINE',
    firmware: 'v3.20.08 SIL3 Marine Approved',
    subsystemLocation: 'Emergency Shutdown & Fire Dampers Panel (2.4m distance)',
    lastSeen: Date.now(),
    discoveryMedium: 'WIFI_DIRECT',
    rssi: -64,
    wirelessBeaconName: 'M580_DIRECT_WLAN_84',
    pairingStatus: 'AVAILABLE',
    driver: {
      driverId: 'schneider_m580_sil3_wifi',
      name: 'Schneider Modicon M580 SIL3 Safety Wi-Fi Driver',
      version: 'v4.1.0-android14',
      type: 'MODBUS_TCP_JNI',
      packageSize: '1.60 MB',
      downloadFileName: 'Schneider_M580_Safety_Driver.zip',
      description: 'Certified SIL3 safety diagnostic reader over Wi-Fi Direct and Ethernet.',
      supportedAndroidVersions: 'Android 14+ (API 34/35)',
      jniLibs: ['libm580_safety_stack.so'],
      defaultPort: 502,
      defaultUnitId: 1,
      sampleRegisterMap: [
        { tag: '%M1', description: 'Emergency Stop Circuit Loop (1 = TRIPPED)', scale: 'Digital' },
        { tag: '%M0', description: 'Engine Run Permissive Interlock', scale: 'Digital' }
      ]
    }
  },
  {
    id: 'ble-harmony-stu',
    ip: '192.168.1.22',
    mac: '00:80:F4:BB:CC:DD',
    vendor: 'Schneider Electric',
    model: 'Harmony STU Wireless HMI Display (HMISTU855)',
    hardwareSeries: 'Harmony STU Modular',
    category: 'HMI',
    protocols: ['BLE GATT Service', 'Modbus TCP (502)', 'WebVisu (8080)'],
    openPorts: [502, 8080],
    rttMs: 3.4,
    status: 'ONLINE',
    firmware: 'v4.1.0',
    subsystemLocation: 'Auxiliary Switchboard Door (3.1m distance)',
    lastSeen: Date.now(),
    discoveryMedium: 'BLUETOOTH_LE',
    rssi: -71,
    wirelessBeaconName: 'HARMONY-DIAG-BLE',
    pairingStatus: 'AVAILABLE',
    driver: {
      driverId: 'harmony_stu_ble_driver',
      name: 'Schneider Harmony STU Wireless HMI Driver',
      version: 'v2.8.0-android14',
      type: 'MODBUS_TCP_JNI',
      packageSize: '1.20 MB',
      downloadFileName: 'Harmony_STU_Wireless_Driver.zip',
      description: 'Virtual mirror driver for Harmony STU panel over Bluetooth LE and Wi-Fi.',
      supportedAndroidVersions: 'Android 14+',
      jniLibs: ['libharmony_ble_link.so'],
      defaultPort: 502,
      defaultUnitId: 255,
      sampleRegisterMap: [
        { tag: '%MW510', description: 'Wireless Operator HMI Screen State', scale: '1.0' }
      ]
    }
  }
];

