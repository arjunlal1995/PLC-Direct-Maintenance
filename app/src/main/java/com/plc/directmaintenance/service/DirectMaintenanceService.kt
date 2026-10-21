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
import com.plc.directmaintenance.notifications.NotificationHelper

class DirectMaintenanceService : Service() {

    companion object {
        private const val TAG = "DirectMaintenanceService"

        private const val CHANNEL_ID =
            "plc_background_monitoring"

        private const val CHANNEL_NAME =
            "PLC Background Monitoring"

        private const val NOTIFICATION_ID = 2001

        const val ACTION_START =
            "com.plc.directmaintenance.service.ACTION_START"

        const val ACTION_STOP =
            "com.plc.directmaintenance.service.ACTION_STOP"

        const val ACTION_REFRESH =
            "com.plc.directmaintenance.service.ACTION_REFRESH"

        /**
         * Start the foreground service.
         *
         * Call this from a user action while the app is visible,
         * subject to Android foreground-service restrictions.
         */
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

        /**
         * Request that the service stop.
         */
        fun stop(context: Context) {
            val intent = Intent(
                context,
                DirectMaintenanceService::class.java
            ).apply {
                action = ACTION_STOP
            }

            context.startService(intent)
        }

        /**
         * Request a foreground notification refresh.
         */
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

    override fun onCreate() {
        super.onCreate()

        createServiceNotificationChannel()

        // Create the maintenance alert channel as well.
        NotificationHelper.createNotificationChannel(this)

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
                    "Background service is running. PLC connection has not been verified."
                )
                return START_NOT_STICKY
            }

            ACTION_START, null -> {
                // A foreground service must promptly publish
                // its notification after it is started.
                startForeground(
                    NOTIFICATION_ID,
                    buildServiceNotification(
                        "Service running. PLC monitoring is not yet verified."
                    )
                )

                Log.i(TAG, "Foreground service started")

                /*
                 * TODO: Start the actual PLC communication worker here.
                 *
                 * Establish communication with the confirmed PLC model
                 * and protocol, check connection status, and validate
                 * the received values before reporting equipment status.
                 *
                 * This service alone does not read PLC registers,
                 * monitor inputs/outputs, or trigger real PLC alarms.
                 */
            }

            else -> {
                Log.w(
                    TAG,
                    "Unknown service action: ${intent.action}"
                )
            }
        }

        return START_NOT_STICKY
    }

    private fun createServiceNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }

        val channel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description =
                "Shows the current status of the background service."
        }

        val manager = getSystemService(
            Context.NOTIFICATION_SERVICE
        ) as NotificationManager

        manager.createNotificationChannel(channel)
    }

    private fun buildServiceNotification(
        message: String
    ): Notification {
        val activityIntent = Intent(
            this,
            MainActivity::class.java
        ).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            NOTIFICATION_ID,
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
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
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
            buildServiceNotification(message)
        )
    }

    override fun onBind(intent: Intent?): IBinder? {
        // This service is not designed for binding.
        return null
    }

    override fun onDestroy() {
        Log.i(TAG, "Foreground service destroyed")
        super.onDestroy()
    }
}
