package com.plc.directmaintenance.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build

import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

import com.plc.directmaintenance.MainActivity
import com.plc.directmaintenance.R

object NotificationHelper {

    const val CHANNEL_ID = "plc_maintenance_alerts"

    private const val CHANNEL_NAME = "PLC Maintenance Alerts"

    private const val CHANNEL_DESCRIPTION =
        "Maintenance alerts and PLC diagnostic notifications"

    const val ACTION_ACKNOWLEDGE_ALERT =
        "com.plc.directmaintenance.ACTION_ACKNOWLEDGE_ALERT"

    const val ACTION_DISPATCH_TECH =
        "com.plc.directmaintenance.ACTION_DISPATCH_TECH"

    const val ACTION_SNOOZE_ALERT =
        "com.plc.directmaintenance.ACTION_SNOOZE_ALERT"

    const val EXTRA_NOTIFICATION_ID = "notification_id"

    const val EXTRA_ALERT_ID = "alert_id"

    private const val REQUEST_OPEN_APP = 1000
    private const val REQUEST_ACKNOWLEDGE = 2000
    private const val REQUEST_DISPATCH = 3000
    private const val REQUEST_SNOOZE = 4000

    /**
     * Create the notification channel.
     * Required on Android 8.0 and later.
     */
    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }

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

    /**
     * Display a maintenance alert.
     */
    fun showAlert(
        context: Context,
        notificationId: Int,
        alertId: String,
        title: String,
        message: String
    ) {
        createNotificationChannel(context)

        // Android 13+ requires notification permission.
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val openAppIntent = Intent(
            context,
            MainActivity::class.java
        ).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val openAppPendingIntent = PendingIntent.getActivity(
            context,
            REQUEST_OPEN_APP + notificationId,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_IMMUTABLE
        )

        val acknowledgeIntent = createActionIntent(
            context = context,
            action = ACTION_ACKNOWLEDGE_ALERT,
            notificationId = notificationId,
            alertId = alertId
        )

        val dispatchIntent = createActionIntent(
            context = context,
            action = ACTION_DISPATCH_TECH,
            notificationId = notificationId,
            alertId = alertId
        )

        val snoozeIntent = createActionIntent(
            context = context,
            action = ACTION_SNOOZE_ALERT,
            notificationId = notificationId,
            alertId = alertId
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
            .setContentIntent(openAppPendingIntent)
            .setAutoCancel(false)
            .addAction(
                0,
                "Acknowledge",
                acknowledgeIntent
            )
            .addAction(
                0,
                "Dispatch",
                dispatchIntent
            )
            .addAction(
                0,
                "Snooze 10 min",
                snoozeIntent
            )
            .build()

        try {
            NotificationManagerCompat
                .from(context)
                .notify(notificationId, notification)
        } catch (exception: SecurityException) {
            // Permission may have been revoked.
            android.util.Log.w(
                "NotificationHelper",
                "Unable to post notification",
                exception
            )
        }
    }

    /**
     * Create an explicit PendingIntent for a notification action.
     */
    private fun createActionIntent(
        context: Context,
        action: String,
        notificationId: Int,
        alertId: String
    ): PendingIntent {
        val intent = Intent(
            context,
            NotificationActionReceiver::class.java
        ).apply {
            this.action = action
            putExtra(EXTRA_NOTIFICATION_ID, notificationId)
            putExtra(EXTRA_ALERT_ID, alertId)
        }

        val requestCode = when (action) {
            ACTION_ACKNOWLEDGE_ALERT ->
                REQUEST_ACKNOWLEDGE + notificationId

            ACTION_DISPATCH_TECH ->
                REQUEST_DISPATCH + notificationId

            ACTION_SNOOZE_ALERT ->
                REQUEST_SNOOZE + notificationId

            else -> notificationId
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
     * Cancel one notification.
     */
    fun cancelAlert(
        context: Context,
        notificationId: Int
    ) {
        NotificationManagerCompat
            .from(context)
            .cancel(notificationId)
    }

    /**
     * Cancel all notifications posted by this application.
     */
    fun cancelAllAlerts(context: Context) {
        NotificationManagerCompat
            .from(context)
            .cancelAll()
    }
}
