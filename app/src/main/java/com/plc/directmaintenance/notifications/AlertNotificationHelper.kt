package com.plc.directmaintenance.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log

import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

import com.plc.directmaintenance.MainActivity
import com.plc.directmaintenance.R

object AlertNotificationHelper {

    private const val TAG = "AlertNotificationHelper"

    const val CHANNEL_ID = "plc_maintenance_alerts"
    const val CHANNEL_NAME = "PLC Maintenance Alerts"
    const val CHANNEL_DESCRIPTION =
        "Notifications for PLC faults and maintenance alerts"

    /**
     * Creates the notification channel.
     *
     * Call this when the application starts and before
     * displaying notifications.
     */
    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = CHANNEL_DESCRIPTION
                enableVibration(true)
            }

            val manager = context.getSystemService(
                Context.NOTIFICATION_SERVICE
            ) as NotificationManager

            manager.createNotificationChannel(channel)
        }
    }

    /**
     * Displays a PLC maintenance alert with action buttons.
     *
     * notificationId: Unique integer for the notification.
     * alertId: Unique identifier for the PLC alert.
     * title: Notification title.
     * message: Notification message.
     */
    fun showAlert(
        context: Context,
        notificationId: Int,
        alertId: String,
        title: String,
        message: String
    ) {
        // Android 13+ requires notification permission at runtime.
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            Log.w(
                TAG,
                "Notification permission not granted; alert not displayed."
            )
            return
        }

        createNotificationChannel(context)

        val contentIntent = Intent(
            context,
            MainActivity::class.java
        ).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(
                NotificationActionReceiver.EXTRA_ALERT_ID,
                alertId
            )
        }

        val contentPendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            contentIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_IMMUTABLE
        )

        val acknowledgePendingIntent = createActionPendingIntent(
            context = context,
            action = NotificationActionReceiver.ACTION_ACKNOWLEDGE_ALERT,
            notificationId = notificationId,
            alertId = alertId,
            requestCode = notificationId * 10 + 1
        )

        val dispatchPendingIntent = createActionPendingIntent(
            context = context,
            action = NotificationActionReceiver.ACTION_DISPATCH_TECH,
            notificationId = notificationId,
            alertId = alertId,
            requestCode = notificationId * 10 + 2
        )

        val snoozePendingIntent = createActionPendingIntent(
            context = context,
            action = NotificationActionReceiver.ACTION_SNOOZE_ALERT,
            notificationId = notificationId,
            alertId = alertId,
            requestCode = notificationId * 10 + 3
        )

        val notification = NotificationCompat.Builder(
            context,
            CHANNEL_ID
        )
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(message)
            )
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setContentIntent(contentPendingIntent)
            .setAutoCancel(true)
            .addAction(
                0,
                "Acknowledge",
                acknowledgePendingIntent
            )
            .addAction(
                0,
                "Dispatch Technician",
                dispatchPendingIntent
            )
            .addAction(
                0,
                "Snooze 10 min",
                snoozePendingIntent
            )
            .build()

        try {
            NotificationManagerCompat.from(context).notify(
                notificationId,
                notification
            )
        } catch (exception: SecurityException) {
            Log.e(
                TAG,
                "Unable to display notification",
                exception
            )
        }
    }

    /**
     * Creates a PendingIntent for a NotificationActionReceiver action.
     */
    private fun createActionPendingIntent(
        context: Context,
        action: String,
        notificationId: Int,
        alertId: String,
        requestCode: Int
    ): PendingIntent {
        val intent = Intent(
            context,
            NotificationActionReceiver::class.java
        ).apply {
            this.action = action

            putExtra(
                NotificationActionReceiver.EXTRA_NOTIFICATION_ID,
                notificationId
            )

            putExtra(
                NotificationActionReceiver.EXTRA_ALERT_ID,
                alertId
            )
        }

        return PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_IMMUTABLE
        )
    }

    /**
     * Cancels a displayed notification.
     */
    fun cancelAlert(
        context: Context,
        notificationId: Int
    ) {
        NotificationManagerCompat.from(context).cancel(
            notificationId
        )
    }

    /**
     * Cancels all notifications displayed by this application.
     */
    fun cancelAllAlerts(context: Context) {
        NotificationManagerCompat.from(context).cancelAll()
    }
}
