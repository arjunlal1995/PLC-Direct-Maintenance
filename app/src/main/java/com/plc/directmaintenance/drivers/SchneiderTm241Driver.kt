package com.plc.directmaintenance.drivers

import android.util.Log
import com.plc.directmaintenance.model.CumminsMarineEngineProfile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.Socket

/**
 * Native Modbus TCP driver specialized for the Schneider Modicon TM241CEC24U
 * and TM3 expansion modules (TM3DI8G, TM3DQ8TG, TM3AI8G, TM3TI4G)
 * installed in the Marine Local Control Panel (Drawing A067B091 / YD 305/307).
 */
class SchneiderTm241Driver(
    private val ipAddress: String = "192.168.1.10",
    private val port: Int = 502,
    private val slaveId: Byte = 1
) {
    companion object {
        private const val TAG = "SchneiderTm241Driver"
        const val TIMEOUT_MS = 3000
    }

    private var socket: Socket? = null
    private var inputStream: InputStream? = null
    private var outputStream: OutputStream? = null
    private var transactionId = 0

    suspend fun connect(): Boolean = withContext(Dispatchers.IO) {
        try {
            disconnect()
            socket = Socket().apply {
                connect(InetSocketAddress(ipAddress, port), TIMEOUT_MS)
                soTimeout = TIMEOUT_MS
                tcpNoDelay = true
            }
            inputStream = socket?.getInputStream()
            outputStream = socket?.getOutputStream()
            Log.i(TAG, "Connected to Schneider TM241 PLC at $ipAddress:$port")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to connect to Schneider TM241: ${e.message}")
            disconnect()
            false
        }
    }

    fun isConnected(): Boolean = socket?.isConnected == true && socket?.isClosed == false

    fun disconnect() {
        try {
            inputStream?.close()
            outputStream?.close()
            socket?.close()
        } catch (_: Exception) {}
        socket = null
        inputStream = null
        outputStream = null
    }

    /**
     * Reads Analog Input holding registers (FC03 / FC04)
     * Address mapping:
     * 30001: Engine Speed RPM (Astronic F/I converter)
     * 30002: Lub Oil Temp (0-150 °C, 4-20mA via TM3AI8G)
     * 30003: Lub Oil Pressure (0-16 bar via TM3AI8G)
     * 30004: Sea Water Pressure (0-6 bar via TM3AI8G)
     * 30005: Fuel Pressure (0-16 bar via TM3AI8G)
     * 30006: Coolant Temp (0-150 °C via TM3AI8G)
     * 30007: Exhaust Temp LB (0-800 °C via TM3TI4G thermocouple)
     * 30008: Exhaust Temp RB (0-800 °C via TM3TI4G thermocouple)
     */
    suspend fun readTelemetryRegisters(startRegister: Int = 0, count: Int = 10): IntArray? = withContext(Dispatchers.IO) {
        if (!isConnected()) return@withContext null

        try {
            transactionId = (transactionId + 1) and 0xFFFF
            val out = outputStream ?: return@withContext null
            val input = inputStream ?: return@withContext null

            // Modbus TCP ADU: [TransId (2)] [ProtoId 0 (2)] [Length (2)] [UnitId (1)] [FC (1)] [Start (2)] [Count (2)]
            val request = byteArrayOf(
                (transactionId shr 8).toByte(),
                (transactionId and 0xFF).toByte(),
                0x00, 0x00, // Protocol ID: Modbus (0)
                0x00, 0x06, // Length remaining (6 bytes)
                slaveId,
                0x03,       // Function Code: Read Holding Registers
                (startRegister shr 8).toByte(),
                (startRegister and 0xFF).toByte(),
                (count shr 8).toByte(),
                (count and 0xFF).toByte()
            )

            out.write(request)
            out.flush()

            val header = ByteArray(7)
            var bytesRead = 0
            while (bytesRead < 7) {
                val r = input.read(header, bytesRead, 7 - bytesRead)
                if (r < 0) return@withContext null
                bytesRead += r
            }

            val respLength = ((header[4].toInt() and 0xFF) shl 8) or (header[5].toInt() and 0xFF)
            val pdu = ByteArray(respLength - 1)
            bytesRead = 0
            while (bytesRead < pdu.size) {
                val r = input.read(pdu, bytesRead, pdu.size - bytesRead)
                if (r < 0) return@withContext null
                bytesRead += r
            }

            val fc = pdu[0].toInt() and 0xFF
            if (fc != 0x03) {
                Log.w(TAG, "Modbus exception or unexpected FC: $fc")
                return@withContext null
            }

            val byteCount = pdu[1].toInt() and 0xFF
            val resultCount = byteCount / 2
            val values = IntArray(resultCount)
            for (i in 0 until resultCount) {
                val high = pdu[2 + i * 2].toInt() and 0xFF
                val low = pdu[3 + i * 2].toInt() and 0xFF
                values[i] = (high shl 8) or low
            }
            values
        } catch (e: Exception) {
            Log.e(TAG, "Read registers failed: ${e.message}")
            disconnect()
            null
        }
    }

    /**
     * Forces digital coil (FC05) for actions like:
     * %M1: Emergency Stop Reset
     * %M10: Acknowledge Horn / Siren
     * %M18: Pre-lube Oil Pump Manual Start
     */
    suspend fun writeCoil(coilAddress: Int, state: Boolean): Boolean = withContext(Dispatchers.IO) {
        if (!isConnected()) return@withContext false

        try {
            transactionId = (transactionId + 1) and 0xFFFF
            val out = outputStream ?: return@withContext false
            val input = inputStream ?: return@withContext false

            val coilValue = if (state) 0xFF00 else 0x0000
            val request = byteArrayOf(
                (transactionId shr 8).toByte(),
                (transactionId and 0xFF).toByte(),
                0x00, 0x00,
                0x00, 0x06,
                slaveId,
                0x05, // Write Single Coil
                (coilAddress shr 8).toByte(),
                (coilAddress and 0xFF).toByte(),
                (coilValue shr 8).toByte(),
                (coilValue and 0xFF).toByte()
            )

            out.write(request)
            out.flush()

            val response = ByteArray(12)
            var bytesRead = 0
            while (bytesRead < 12) {
                val r = input.read(response, bytesRead, 12 - bytesRead)
                if (r < 0) return@withContext false
                bytesRead += r
            }

            response[7].toInt() == 0x05
        } catch (e: Exception) {
            Log.e(TAG, "Write coil failed: ${e.message}")
            false
        }
    }
}
