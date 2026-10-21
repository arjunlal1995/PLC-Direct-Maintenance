package com.plc.directmaintenance.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast

class NotificationActionReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "NotificationActionReceiver"

        const val ACTION_ACKNOWLEDGE_ALERT =
            "com.plc.directmaintenance.ACTION_ACKNOWLEDGE_ALERT"

        const val ACTION_DISPATCH_TECH =
            "com.plc.directmaintenance.ACTION_DISPATCH_TECH"

        const val ACTION_SNOOZE_ALERT =
            "com.plc.directmaintenance.ACTION_SNOOZE_ALERT"

        const val EXTRA_NOTIFICATION_ID = "notification_id"
        const val EXTRA_ALERT_ID = "alert_id"

        private const val PREFS_NAME = "plc_alert_preferences"
        private const val KEY_STATUS_PREFIX = "status_"
        private const val KEY_UPDATED_PREFIX = "updated_"
        private const val KEY_SNOOZED_PREFIX = "snoozed_until_"

        private const val SNOOZE_DURATION_MS = 10 * 60 * 1000L
    }

    override fun onReceive(context: Context, intent: Intent) {
        val notificationId = intent.getIntExtra(
            EXTRA_NOTIFICATION_ID,
            1001
        )

        val alertId = intent.getStringExtra(EXTRA_ALERT_ID)
            ?: "unknown"

        when (intent.action) {

            ACTION_ACKNOWLEDGE_ALERT -> {
                acknowledgeAlert(
                    context,
                    notificationId,
                    alertId
                )
            }

            ACTION_DISPATCH_TECH -> {
                dispatchTechnician(
                    context,
                    alertId
                )
            }

            ACTION_SNOOZE_ALERT -> {
                snoozeAlert(
                    context,
                    notificationId,
                    alertId
                )
            }

            else -> {
                Log.w(
                    TAG,
                    "Unknown notification action: ${intent.action}"
                )
            }
        }
    }

    /**
     * Marks an alert as acknowledged locally.
     */
    private fun acknowledgeAlert(
        context: Context,
        notificationId: Int,
        alertId: String
    ) {
        saveAlertStatus(
            context = context,
            alertId = alertId,
            status = "ACKNOWLEDGED"
        )

        // Remove the alert notification.
        android.app.NotificationManager::class.java.let {
            val manager = context.getSystemService(
                Context.NOTIFICATION_SERVICE
            ) as android.app.NotificationManager

            manager.cancel(notificationId)
        }

        Log.i(TAG, "Alert acknowledged: $alertId")

        showToast(context, "Alert acknowledged: $alertId")
    }

    /**
     * Records a local technician-dispatch request.
     *
     * This does not actually contact or dispatch a technician.
     * Connect this method to your authorized dispatch service
     * when that service is available.
     */
    private fun dispatchTechnician(
        context: Context,
        alertId: String
    ) {
        saveAlertStatus(
            context = context,
            alertId = alertId,
            status = "DISPATCH_REQUESTED"
        )

        Log.i(
            TAG,
            "Technician dispatch requested for alert: $alertId"
        )

        showToast(
            context,
            "Dispatch request recorded for $alertId"
        )
    }

    /**
     * Snoozes the alert for 10 minutes.
     *
     * This records the snooze time and cancels the current
     * notification. It does not automatically repost it.
     */
    private fun snoozeAlert(
        context: Context,
        notificationId: Int,
        alertId: String
    ) {
        val snoozedUntil =
            System.currentTimeMillis() + SNOOZE_DURATION_MS

        val preferences = context.getSharedPreferences(
            PREFS_NAME,
            Context.MODE_PRIVATE
        )

        preferences.edit()
            .putString(
                KEY_STATUS_PREFIX + alertId,
                "SNOOZED"
            )
            .putLong(
                KEY_SNOOZED_PREFIX + alertId,
                snoozedUntil
            )
            .putLong(
                KEY_UPDATED_PREFIX + alertId,
                System.currentTimeMillis()
            )
            .apply()

        val manager = context.getSystemService(
            Context.NOTIFICATION_SERVICE
        ) as android.app.NotificationManager

        manager.cancel(notificationId)

        Log.i(
            TAG,
            "Alert snoozed until $snoozedUntil: $alertId"
        )

        showToast(
            context,
            "Alert snoozed for 10 minutes"
        )
    }

    /**
     * Saves the current alert status and update timestamp.
     */
    private fun saveAlertStatus(
        context: Context,
        alertId: String,
        status: String
    ) {
        val preferences = context.getSharedPreferences(
            PREFS_NAME,
            Context.MODE_PRIVATE
        )

        preferences.edit()
            .putString(
                KEY_STATUS_PREFIX + alertId,
                status
            )
            .putLong(
                KEY_UPDATED_PREFIX + alertId,
                System.currentTimeMillis()
            )
            .apply()
    }

    private fun showToast(
        context: Context,
        message: String
    ) {
        Toast.makeText(
            context,
            message,
            Toast.LENGTH_SHORT
        ).show()
    }
}
