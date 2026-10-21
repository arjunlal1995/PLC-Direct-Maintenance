package com.plc.directmaintenance.notifications

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast

class NotificationActionReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "NotificationAction"
        private const val EXTRA_NOTIFICATION_ID = "notification_id"
        private const val EXTRA_ALERT_ID = "alert_id"

        const val ACTION_ACKNOWLEDGE_ALERT =
            "com.plc.directmaintenance.ACTION_ACKNOWLEDGE_ALERT"

        const val ACTION_DISPATCH_TECH =
            "com.plc.directmaintenance.ACTION_DISPATCH_TECH"

        const val ACTION_SNOOZE_ALERT =
            "com.plc.directmaintenance.ACTION_SNOOZE_ALERT"

        private const val DEFAULT_NOTIFICATION_ID = 1001
        private const val SNOOZE_DURATION_MS = 10 * 60 * 1000L

        private const val PREFS_NAME = "plc_alert_preferences"
        private const val KEY_SNOOZED_UNTIL = "snoozed_until"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val notificationId = intent.getIntExtra(
            EXTRA_NOTIFICATION_ID,
            DEFAULT_NOTIFICATION_ID
        )

        val alertId = intent.getStringExtra(EXTRA_ALERT_ID) ?: "unknown"

        when (intent.action) {

            ACTION_ACKNOWLEDGE_ALERT -> {
                acknowledgeAlert(
                    context,
                    notificationManager,
                    notificationId,
                    alertId
                )
            }

            ACTION_DISPATCH_TECH -> {
                dispatchTechnician(context, notificationId, alertId)
            }

            ACTION_SNOOZE_ALERT -> {
                snoozeAlert(
                    context,
                    notificationManager,
                    notificationId,
                    alertId
                )
            }

            else -> {
                Log.w(TAG, "Unknown notification action: ${intent.action}")
            }
        }
    }

    private fun acknowledgeAlert(
        context: Context,
        notificationManager: NotificationManager,
        notificationId: Int,
        alertId: String
    ) {
        Log.i(TAG, "Alert acknowledged: $alertId")

        // Record the acknowledgement locally.
        saveAlertStatus(context, alertId, "ACKNOWLEDGED")

        // Remove the notification from the notification shade.
        notificationManager.cancel(notificationId)

        showMessage(context, "Alert acknowledged")
    }

    private fun dispatchTechnician(
        context: Context,
        notificationId: Int,
        alertId: String
    ) {
        Log.i(TAG, "Technician dispatch requested for alert: $alertId")

        // Record the request locally.
        saveAlertStatus(context, alertId, "DISPATCH_REQUESTED")

        // Dismiss the notification after recording the request.
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        notificationManager.cancel(notificationId)

        showMessage(
            context,
            "Dispatch request recorded locally"
        )

        /*
         * IMPORTANT:
         * This does not contact a technician or send a real dispatch.
         * Connect your approved dispatch API or application workflow here.
         */
    }

    private fun snoozeAlert(
        context: Context,
        notificationManager: NotificationManager,
        notificationId: Int,
        alertId: String
    ) {
        val snoozedUntil = System.currentTimeMillis() + SNOOZE_DURATION_MS

        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putLong("snoozed_until_$alertId", snoozedUntil)
            .putString("status_$alertId", "SNOOZED")
            .apply()

        Log.i(
            TAG,
            "Alert $alertId snoozed until $snoozedUntil"
        )

        notificationManager.cancel(notificationId)

        showMessage(context, "Alert snoozed for 10 minutes")

        /*
         * IMPORTANT:
         * This stores the snooze deadline, but does not automatically
         * recreate the notification after 10 minutes.
         *
         * Implement a scheduled notification using an appropriate
         * AlarmManager or WorkManager workflow if required.
         */
    }

    private fun saveAlertStatus(
        context: Context,
        alertId: String,
        status: String
    ) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString("status_$alertId", status)
            .putLong("updated_at_$alertId", System.currentTimeMillis())
            .apply()
    }

    private fun showMessage(
        context: Context,
        message: String
    ) {
        Toast.makeText(
            context.applicationContext,
            message,
            Toast.LENGTH_SHORT
        ).show()
    }
}
