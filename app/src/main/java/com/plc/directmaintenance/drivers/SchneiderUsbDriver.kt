package com.plc.directmaintenance.drivers

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbManager
import android.os.Build

class SchneiderUsbDriver(private val context: Context) {
    companion object {
        const val ACTION_USB_PERMISSION = "com.plc.directmaintenance.USB_PERMISSION"
        const val SCHNEIDER_VENDOR_ID = 0x2122 // Schneider Electric SA
        const val FTDI_VENDOR_ID = 0x0403      // FTDI Chip (Modbus USB-RS485 converters)
        const val PROLIFIC_VENDOR_ID = 0x067B  // Prolific PL2303
    }

    private val usbManager: UsbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
    private var usbConnection: UsbDeviceConnection? = null
    private var selectedDevice: UsbDevice? = null

    fun findConnectedPlcDevice(): UsbDevice? {
        val deviceList = usbManager.deviceList
        for ((_, device) in deviceList) {
            if (device.vendorId == SCHNEIDER_VENDOR_ID ||
                device.vendorId == FTDI_VENDOR_ID ||
                device.vendorId == PROLIFIC_VENDOR_ID) {
                selectedDevice = device
                return device
            }
        }
        return null
    }

    fun requestPermission(device: UsbDevice, onGranted: () -> Unit) {
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val permissionIntent = PendingIntent.getBroadcast(
            context, 0, Intent(ACTION_USB_PERMISSION), flags
        )
        val filter = IntentFilter(ACTION_USB_PERMISSION)
        context.registerReceiver(object : BroadcastReceiver() {
            override fun onReceive(c: Context?, intent: Intent?) {
                if (intent?.action == ACTION_USB_PERMISSION) {
                    val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
                    if (granted) onGranted()
                    context.unregisterReceiver(this)
                }
            }
        }, filter)
        usbManager.requestPermission(device, permissionIntent)
    }
}