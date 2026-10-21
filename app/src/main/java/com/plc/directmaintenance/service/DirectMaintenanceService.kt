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

class DirectMaintenanceService : Service() {

    companion object {
        private const val TAG = "DirectMaintenanceService"

        const val ACTION_START =
            "com.plc.directmaintenance.service.ACTION_START"

        const val ACTION_STOP =
            "com.plc.directmaintenance.service.ACTION_STOP"

        const val ACTION_REFRESH =
            "com.plc.directmaintenance.service.ACTION_REFRESH"

        private const val CHANNEL_ID =
            "plc_background_monitoring"

        private const val CHANNEL_NAME =
            "PLC Background Monitoring"

        private const val NOTIFICATION_ID = 2001

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
    }

    override fun onCreate() {
        super.onCreate()

        createNotificationChannel()

        Log.i(TAG, "Service created")
    }

    override fun onStartCommand(
        intent: Intent?,
        flags: Int,
        startId: Int
    ): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }

            ACTION_REFRESH -> {
                updateForegroundNotification(
                    "Monitoring service is running. PLC data is not connected."
                )
                return START_NOT_STICKY
            }

            ACTION_START, null -> {
                startForeground(
                    NOTIFICATION_ID,
                    buildNotification(
                        "Monitoring service started. PLC connection not verified."
                    )
                )

                // Add your verified PLC polling implementation here.
                // Do not assume the PLC is connected until the driver
                // establishes communication successfully.

                Log.i(TAG, "Service started")
            }

            else -> {
                Log.w(TAG, "Unknown service action: ${intent.action}")
            }
        }

        return START_NOT_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description =
                    "Status notification for PLC monitoring service"
            }

            val manager = getSystemService(
                Context.NOTIFICATION_SERVICE
            ) as NotificationManager

            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(
        message: String
    ): Notification {
        val activityIntent = Intent(
            this,
            MainActivity::class.java
        )

        val pendingIntent = PendingIntent.getActivity(
            this,
            2002,
            activityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(
            this,
            CHANNEL_ID
        )
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("PLC Direct Maintenance")
            .setContentText(message)
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(message)
            )
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateForegroundNotification(
        message: String
    ) {
        val manager = getSystemService(
            Context.NOTIFICATION_SERVICE
        ) as NotificationManager

        manager.notify(
            NOTIFICATION_ID,
            buildNotification(message)
        )
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        Log.i(TAG, "Service stopped")
        super.onDestroy()
    }
}
