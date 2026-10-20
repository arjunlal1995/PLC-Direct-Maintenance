package com.plc.directmaintenance.drivers

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.io.OutputStream
import java.net.InetSocketAddress
import java.net.Socket

class SchneiderTm241Driver(
    private val ipAddress: String = "192.168.1.10",
    private val port: Int = 502,
    private val slaveId: Byte = 1
) {
    private var socket: Socket? = null
    private var inputStream: InputStream? = null
    private var outputStream: OutputStream? = null

    suspend fun connect(): Boolean = withContext(Dispatchers.IO) {
        try {
            socket = Socket().apply {
                connect(InetSocketAddress(ipAddress, port), 3000)
                soTimeout = 3000
                tcpNoDelay = true
            }
            inputStream = socket?.getInputStream()
            outputStream = socket?.getOutputStream()
            true
        } catch (e: Exception) {
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
    }
}
