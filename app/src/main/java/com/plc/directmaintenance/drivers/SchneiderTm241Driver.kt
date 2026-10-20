package com.plc.directmaintenance.drivers

import com.plc.directmaintenance.model.CumminsEngineCatalog
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.Socket

/**
 * Driver for Schneider Electric Modicon TM241CEC24U & TM3 Expansion Modules.
 * Communicates over Port 502 (Modbus TCP) via OTG Ethernet / Wi-Fi.
 */
class SchneiderTm241Driver(
    private val plcIpAddress: String = "192.168.1.10",
    private val port: Int = 502,
    private val timeoutMs: Int = 3000
) {
    data class EngineReadout(
        val rpm: Double,
        val oilPressureBar: Double,
        val oilTempC: Double,
        val seaWaterPressBar: Double,
        val coolantTempC: Double,
        val exhaustTempLeftC: Double,
        val exhaustTempRightC: Double,
        val isTurningGearEngaged: Boolean,
        val isLowCoolantLevel: Boolean,
        val isEmergencyStopTriggered: Boolean,
        val isOverspeedTrip: Boolean,
        val isLowOilTrip: Boolean
    )

    suspend fun readTelemetry(): Result<EngineReadout> = withContext(Dispatchers.IO) {
        var socket: Socket? = null
        try {
            socket = Socket()
            socket.connect(InetSocketAddress(plcIpAddress, port), timeoutMs)
            socket.soTimeout = timeoutMs

            val outStream = socket.getOutputStream()
            val inStream = socket.getInputStream()

            // Modbus TCP Function 03: Read Holding Registers %MW0 to %MW7 (8 words)
            // MBAP Header (Transaction 0x0001, Protocol 0x0000, Length 0x0006, Unit 0x01)
            val request = byteArrayOf(
                0x00, 0x01, // Transaction ID
                0x00, 0x00, // Protocol ID (Modbus)
                0x00, 0x06, // Length (6 bytes follow)
                0x01,       // Unit ID (PLC slave address)
                0x03,       // Function 03 (Read Holding Registers)
                0x00, 0x00, // Starting Address (%MW0)
                0x00, 0x08  // Quantity of registers (8 registers)
            )

            outStream.write(request)
            outStream.flush()

            val response = ByteArray(64)
            val bytesRead = inStream.read(response)
            if (bytesRead < 9) {
                return@withContext Result.failure(Exception("Incomplete Modbus response received from TM241"))
            }

            // Parse registers %MW0 - %MW7
            val byteCount = response[8].toInt() and 0xFF
            if (byteCount < 16) {
                return@withContext Result.failure(Exception("Expected 16 data bytes, received $byteCount"))
            }

            fun readRegister(index: Int): Int {
                val offset = 9 + (index * 2)
                val high = response[offset].toInt() and 0xFF
                val low = response[offset + 1].toInt() and 0xFF
                return (high shl 8) or low
            }

            val rawRpm = readRegister(0)
            val rawOilTemp = readRegister(1)
            val rawOilPress = readRegister(2)
            val rawSeaWater = readRegister(3)
            val rawFuelPress = readRegister(4)
            val rawCoolantTemp = readRegister(5)
            val rawExhaustL = readRegister(6)
            val rawExhaustR = readRegister(7)

            // Scaling: 4-20mA TM3AI8G resolution = 0 to 10000 (0.01 bar / 0.1 °C resolution)
            val rpm = rawRpm.toDouble()
            val oilPress = rawOilPress / 100.0
            val oilTemp = rawOilTemp / 10.0
            val seaWaterPress = rawSeaWater / 100.0
            val coolantTemp = rawCoolantTemp / 10.0
            val exhaustL = rawExhaustL.toDouble()
            val exhaustR = rawExhaustR.toDouble()

            val readout = EngineReadout(
                rpm = rpm,
                oilPressureBar = oilPress,
                oilTempC = oilTemp,
                seaWaterPressBar = seaWaterPress,
                coolantTempC = coolantTemp,
                exhaustTempLeftC = exhaustL,
                exhaustTempRightC = exhaustR,
                isTurningGearEngaged = false,
                isLowCoolantLevel = false,
                isEmergencyStopTriggered = false,
                isOverspeedTrip = rpm >= 1980.0,
                isLowOilTrip = oilPress <= 0.8 && rpm > 600.0
            )

            Result.success(readout)
        } catch (e: Exception) {
            Result.failure(e)
        } finally {
            try { socket?.close() } catch (_: Exception) {}
        }
    }
}