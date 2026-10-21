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

object AlertNotificationHelper {

    private const val CHANNEL_ID = "plc_maintenance_alerts"
    private const val CHANNEL_NAME = "PLC Maintenance Alerts"

    fun showAlert(
        context: Context,
        notificationId: Int,
        alertId: String,
        title: String,
        message: String
    ) {
        createNotificationChannel(context)

        // Check notification permission on Android 13 and later.
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
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
        }

        val openAppPendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_IMMUTABLE
        )

        // Acknowledge action.
        val acknowledgeIntent = Intent(
            context,
            NotificationActionReceiver::class.java
        ).apply {
            action = NotificationActionReceiver.ACTION_ACKNOWLEDGE_ALERT
            putExtra("notification_id", notificationId)
            putExtra("alert_id", alertId)
        }

        val acknowledgePendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId + 10000,
            acknowledgeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_IMMUTABLE
        )

        // Dispatch technician action.
        val dispatchIntent = Intent(
            context,
            NotificationActionReceiver::class.java
        ).apply {
            action = NotificationActionReceiver.ACTION_DISPATCH_TECH
            putExtra("notification_id", notificationId)
            putExtra("alert_id", alertId)
        }

        val dispatchPendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId + 20000,
            dispatchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_IMMUTABLE
        )

        // Snooze action.
        val snoozeIntent = Intent(
            context,
            NotificationActionReceiver::class.java
        ).apply {
            action = NotificationActionReceiver.ACTION_SNOOZE_ALERT
            putExtra("notification_id", notificationId)
            putExtra("alert_id", alertId)
        }

        val snoozePendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId + 30000,
            snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(
            context,
            CHANNEL_ID
        )
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(
                NotificationCompat.BigTextStyle().bigText(message)
            )
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(false)
            .setContentIntent(openAppPendingIntent)
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

        NotificationManagerCompat.from(context).notify(
            notificationId,
            notification
        )
    }

    private fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description =
                    "Important PLC maintenance and fault notifications"
            }

            val manager = context.getSystemService(
                Context.NOTIFICATION_SERVICE
            ) as NotificationManager

            manager.createNotificationChannel(channel)
        }
    }
}
