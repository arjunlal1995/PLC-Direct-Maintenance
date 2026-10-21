package com.plc.directmaintenance

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.plc.directmaintenance.notifications.AlertNotificationHelper

class MainActivity : ComponentActivity() {

    private val notificationPermissionLauncher =
        registerForActivityResult(
            ActivityResultContracts.RequestPermission()
        ) { granted ->
            if (granted) {
                showTestNotification()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        AlertNotificationHelper.createNotificationChannel(this)

        setContent {
            MaterialTheme(
                colorScheme = lightColorScheme()
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MaintenanceDashboard(
                        onTestNotification = {
                            requestPermissionAndShowNotification()
                        },
                        onOpenSettings = {
                            openAppSettings()
                        }
                    )
                }
            }
        }
    }

    private fun requestPermissionAndShowNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED

            if (!granted) {
                notificationPermissionLauncher.launch(
                    Manifest.permission.POST_NOTIFICATIONS
                )
                return
            }
        }

        showTestNotification()
    }

    private fun showTestNotification() {
        AlertNotificationHelper.showAlert(
            context = this,
            notificationId = 1001,
            alertId = "PLC-TEST-001",
            title = "PLC Maintenance Test",
            message = "Test alert. Check PLC diagnostics before taking action."
        )
    }

    private fun openAppSettings() {
        val intent = Intent(
            Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.fromParts("package", packageName, null)
        )
        startActivity(intent)
    }
}

@Composable
private fun MaintenanceDashboard(
    onTestNotification: () -> Unit,
    onOpenSettings: () -> Unit
) {
    var notificationStatus by remember {
        mutableStateOf("Ready")
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "PLC DIRECT",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )

        Text(
            text = "MAINTENANCE",
            fontSize = 20.sp,
            fontWeight = FontWeight.SemiBold
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Connect • Monitor • Diagnose • Maintain",
            fontSize = 13.sp
        )

        Spacer(modifier = Modifier.height(24.dp))

        StatusCard(
            title = "PLC Connection",
            value = "Not connected",
            description = "Connect to a supported PLC to retrieve live data."
        )

        Spacer(modifier = Modifier.height(12.dp))

        StatusCard(
            title = "System Status",
            value = "Monitoring inactive",
            description = "Live PLC diagnostics are not currently being collected."
        )

        Spacer(modifier = Modifier.height(12.dp))

        StatusCard(
            title = "Notifications",
            value = notificationStatus,
            description = "Use the button below to test Android notifications."
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                notificationStatus = "Test requested"
                onTestNotification()
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Test Maintenance Notification")
        }

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedButton(
            onClick = onOpenSettings,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Open App Settings")
        }

        Spacer(modifier = Modifier.height(24.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            border = BorderStroke(
                width = 1.dp,
                color = MaterialTheme.colorScheme.outlineVariant
            ),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Maintenance Safety",
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "This dashboard is a demonstration. It does not " +
                        "read PLC inputs, verify alarm conditions, or control " +
                        "machinery. Verify faults using the approved PLC/HMI " +
                        "and site procedures."
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "PLC Direct Maintenance",
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun StatusCard(
    title: String,
    value: String,
    description: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 2.dp
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = title,
                fontWeight = FontWeight.Bold,
                fontSize = 17.sp
            )

            Text(
                text = value,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.SemiBold
            )

            Text(
                text = description,
                fontSize = 13.sp
            )
        }
    }
}
