package com.plc.directmaintenance.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log

import androidx.core.app.NotificationCompat

import com.plc.directmaintenance.MainActivity
import com.plc.directmaintenance.R
import com.plc.directmaintenance.drivers.SchneiderPlcManager
import com.plc.directmaintenance.notifications.NotificationHelper

class DirectMaintenanceService : Service() {

    companion object {
        private const val TAG = "DirectMaintenanceService"

        private const val SERVICE_CHANNEL_ID =
            "plc_background_monitoring"

        private const val SERVICE_CHANNEL_NAME =
            "PLC Background Monitoring"

        private const val SERVICE_NOTIFICATION_ID = 2001

        const val ACTION_START =
            "com.plc.directmaintenance.service.ACTION_START"

        const val ACTION_STOP =
            "com.plc.directmaintenance.service.ACTION_STOP"

        const val ACTION_REFRESH =
            "com.plc.directmaintenance.service.ACTION_REFRESH"

        fun start(context: Context) {
            val intent = Intent(
                context,
                DirectMaintenanceService::class.java
            ).apply {
                action = ACTION_START
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(
                context,
                DirectMaintenanceService::class.java
            ).apply {
                action = ACTION_STOP
            }

            context.startService(intent)
        }

        fun refresh(context: Context) {
            val intent = Intent(
                context,
                DirectMaintenanceService::class.java
            ).apply {
                action = ACTION_REFRESH
            }

            context.startService(intent)
        }
    }

    private lateinit var plcManager: SchneiderPlcManager

    override fun onCreate() {
        super.onCreate()

        createServiceNotificationChannel()
        NotificationHelper.createNotificationChannel(this)

        plcManager = SchneiderPlcManager(applicationContext)

        Log.i(TAG, "Maintenance service created")
    }

    override fun onStartCommand(
        intent: Intent?,
        flags: Int,
        startId: Int
    ): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopMonitoring()

                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf(startId)

                return START_NOT_STICKY
            }

            ACTION_REFRESH -> {
                updateServiceNotification(
                    getCurrentStatusMessage()
                )

                return START_NOT_STICKY
            }

            ACTION_START, null -> {
                // Publish the foreground notification immediately.
                startForeground(
                    SERVICE_NOTIFICATION_ID,
                    buildServiceNotification(
                        "Starting maintenance service. PLC connection is not verified."
                    )
                )

                startMonitoring()

                return START_NOT_STICKY
            }

            else -> {
                Log.w(TAG, "Unknown service action: ${intent.action}")
                stopSelf(startId)
                return START_NOT_STICKY
            }
        }
    }

    private fun startMonitoring() {
        Log.i(TAG, "Starting PLC monitoring workflow")

        /*
         * SchneiderPlcManager currently contains a connection
         * placeholder. Its connect() method deliberately returns
         * false until an actual PLC communication driver is added.
         */
        val connected = plcManager.connect()

        val message = if (connected) {
            "PLC connection established."
        } else {
            "PLC is not connected. Verify the PLC model, protocol, and network."
        }

        updateServiceNotification(message)

        Log.i(TAG, message)
    }

    private fun stopMonitoring() {
        if (::plcManager.isInitialized) {
            plcManager.disconnect()
        }

        Log.i(TAG, "PLC monitoring stopped")
    }

    private fun getCurrentStatusMessage(): String {
        if (!::plcManager.isInitialized) {
            return "Maintenance service is initializing."
        }

        val status = plcManager.getStatus()

        return "PLC status: ${status.connectionState}. ${status.message}"
    }

    private fun createServiceNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }

        val channel = NotificationChannel(
            SERVICE_CHANNEL_ID,
            SERVICE_CHANNEL_NAME,
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description =
                "Displays the current status of the maintenance service."
        }

        val manager = getSystemService(
            Context.NOTIFICATION_SERVICE
        ) as NotificationManager

        manager.createNotificationChannel(channel)
    }

    private fun buildServiceNotification(
        message: String
    ): Notification {
        val launchIntent = Intent(
            this,
            MainActivity::class.java
        ).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            SERVICE_NOTIFICATION_ID,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(
            this,
            SERVICE_CHANNEL_ID
        )
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("PLC Direct Maintenance")
            .setContentText(message)
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(message)
            )
            .setContentIntent(pendingIntent)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    private fun updateServiceNotification(message: String) {
        val manager = getSystemService(
            Context.NOTIFICATION_SERVICE
        ) as NotificationManager

        manager.notify(
            SERVICE_NOTIFICATION_ID,
            buildServiceNotification(message)
        )
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        stopMonitoring()

        Log.i(TAG, "Maintenance service destroyed")

        super.onDestroy()
    }
}
