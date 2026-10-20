package com.plc.directmaintenance

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.plc.directmaintenance.drivers.SchneiderPlcManager
import com.plc.directmaintenance.model.AlertSeverity
import com.plc.directmaintenance.model.PlcAlert
import com.plc.directmaintenance.notifications.NotificationHelper
import com.plc.directmaintenance.service.DirectMaintenanceService

class MainActivity : ComponentActivity() {

    private lateinit var notificationHelper: NotificationHelper
    private lateinit var schneiderManager: SchneiderPlcManager

    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted: Boolean ->
            if (isGranted) {
                // High-importance notification channels active
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        notificationHelper = NotificationHelper(this)
        notificationHelper.createNotificationChannels()

        schneiderManager = SchneiderPlcManager(this, notificationHelper)

        checkAndRequestPermissions()
        startDirectMaintenanceService()

        // Automatically listen to Schneider USB-B or RJ-45 to Type-C connection
        schneiderManager.startRealTimeMonitoring("192.168.1.10")

        setContent {
            DirectMaintenanceTheme {
                MainScreen(
                    onTriggerTestAlert = { severity, title, msg, tag ->
                        val alert = PlcAlert(
                            id = "ALT-" + System.currentTimeMillis().toString().takeLast(4),
                            machineId = "LINE-01-PR01",
                            machineName = "Schneider Modicon M580 (USB-B/RJ-45)",
                            plcTag = tag,
                            severity = severity,
                            title = title,
                            message = msg,
                            timestamp = System.currentTimeMillis(),
                            temperatureC = 88.5f,
                            pressureBar = 240.0f
                        )
                        notificationHelper.postCustomRealTimeAlert(alert)
                    }
                )
            }
        }
    }

    private fun checkAndRequestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                requestNotificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun startDirectMaintenanceService() {
        val serviceIntent = Intent(this, DirectMaintenanceService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        schneiderManager.stop()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onTriggerTestAlert: (AlertSeverity, String, String, String) -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) }
    var isPumpRunning by remember { mutableStateOf(true) }
    var tankLevel by remember { mutableStateOf(74.2f) }
    var motorRpm by remember { mutableStateOf(1450) }
    var setpoint by remember { mutableStateOf(75f) }
    var isEmergencyStopActive by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "PLC DIRECT MAINTENANCE",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            fontFamily = FontFamily.Monospace,
                            color = Color.White
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(7.dp)
                                    .clip(CircleShape)
                                    .background(if (isEmergencyStopActive) Color(0xFFEF4444) else Color(0xFF10B981))
                            )
                            Spacer(modifier = Modifier.width(5.dp))
                            Text(
                                text = if (isEmergencyStopActive) "● E-STOP TRIPPED (%M1)" else "● Schneider M580 ePAC — Online (192.168.1.10)",
                                color = if (isEmergencyStopActive) Color(0xFFF87171) else Color(0xFF10B981),
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0F172A),
                    titleContentColor = Color.White
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = Color(0xFF0F172A),
                contentColor = Color(0xFF94A3B8)
            ) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Speed, contentDescription = "HMI") },
                    label = { Text("HMI", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFF59E0B),
                        selectedTextColor = Color(0xFFF59E0B),
                        indicatorColor = Color(0xFF1E293B)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = {
                        BadgedBox(
                            badge = {
                                Badge(containerColor = Color(0xFFDC2626)) {
                                    Text(if (isEmergencyStopActive) "2" else "1", fontSize = 9.sp)
                                }
                            }
                        ) {
                            Icon(Icons.Default.Warning, contentDescription = "Alarms")
                        }
                    },
                    label = { Text("Alarms", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFF59E0B),
                        selectedTextColor = Color(0xFFF59E0B),
                        indicatorColor = Color(0xFF1E293B)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Search, contentDescription = "Scanner") },
                    label = { Text("Scanner", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFF59E0B),
                        selectedTextColor = Color(0xFFF59E0B),
                        indicatorColor = Color(0xFF1E293B)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Drivers") },
                    label = { Text("Drivers", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFF59E0B),
                        selectedTextColor = Color(0xFFF59E0B),
                        indicatorColor = Color(0xFF1E293B)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 4,
                    onClick = { selectedTab = 4 },
                    icon = { Icon(Icons.Default.Build, contentDescription = "Wiring") },
                    label = { Text("Wiring", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFF59E0B),
                        selectedTextColor = Color(0xFFF59E0B),
                        indicatorColor = Color(0xFF1E293B)
                    )
                )
            }
        },
        containerColor = Color(0xFF020617)
    ) { padding ->
        Box(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            when (selectedTab) {
                0 -> HmiScreenTab(
                    isPumpRunning = isPumpRunning,
                    tankLevel = tankLevel,
                    motorRpm = motorRpm,
                    setpoint = setpoint,
                    isEmergencyStopActive = isEmergencyStopActive,
                    onTogglePump = {
                        if (!isEmergencyStopActive) {
                            isPumpRunning = !isPumpRunning
                            motorRpm = if (isPumpRunning) 1450 else 0
                        }
                    },
                    onEmergencyStop = {
                        isEmergencyStopActive = !isEmergencyStopActive
                        if (isEmergencyStopActive) {
                            isPumpRunning = false
                            motorRpm = 0
                            onTriggerTestAlert(
                                AlertSeverity.CRITICAL,
                                "SCHNEIDER %M1 E-STOP TRIPPED",
                                "Emergency Stop button pushed on Modicon M580 rack via USB-B safety bus.",
                                "%M1_ESTOP_ACTIVE"
                            )
                        }
                    },
                    onSetpointChange = { setpoint = it }
                )
                1 -> AlarmsScreenTab(
                    isEmergencyStopActive = isEmergencyStopActive,
                    onTriggerTestAlert = onTriggerTestAlert
                )
                2 -> NetworkScannerScreenTab()
                3 -> DriversScreenTab(
                    onTriggerTestAlert = onTriggerTestAlert
                )
                4 -> WiringScreenTab()
            }
        }
    }
}

@Composable
fun HmiScreenTab(
    isPumpRunning: Boolean,
    tankLevel: Float,
    motorRpm: Int,
    setpoint: Float,
    isEmergencyStopActive: Boolean,
    onTogglePump: () -> Unit,
    onEmergencyStop: () -> Unit,
    onSetpointChange: (Float) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Connection Header Card
        item {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = "MODICON M580 ePAC",
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF38BDF8),
                            fontSize = 13.sp,
                            fontFamily = FontFamily.Monospace
                        )
                        Text(
                            text = "BMEP584040 • Modbus TCP :502 & USB-B",
                            color = Color(0xFF94A3B8),
                            fontSize = 10.sp
                        )
                    }
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = Color(0xFF064E3B)
                    ) {
                        Text(
                            text = "POLLING 250ms",
                            color = Color(0xFF34D399),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
        }

        // Process Tank T-204 Gauge
        item {
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "PROCESS TANK T-204",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 13.sp,
                            fontFamily = FontFamily.Monospace
                        )
                        Text(
                            text = "%.1f%% (1,484 / 2,000 L)".format(tankLevel),
                            color = Color(0xFF38BDF8),
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(20.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(Color(0xFF0F172A))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(fraction = (tankLevel / 100f).coerceIn(0f, 1f))
                                .fillMaxHeight()
                                .background(Color(0xFF0284C7))
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("LOW: 15%", color = Color(0xFF64748B), fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                        Text("SP: %.0f%%".format(setpoint), color = Color(0xFFF59E0B), fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                        Text("HIGH: 90%", color = Color(0xFF64748B), fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                    }
                }
            }
        }

        // Feed Pump P-101 VFD Card
        item {
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "FEED PUMP P-101 (ATV630)",
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                fontSize = 13.sp,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = "Altivar Process VFD • Modbus Address #25",
                                color = Color(0xFF94A3B8),
                                fontSize = 10.sp
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = if (isPumpRunning) Color(0xFF064E3B) else Color(0xFF7F1D1D)
                        ) {
                            Text(
                                text = if (isPumpRunning) "RUNNING" else "STOPPED",
                                color = if (isPumpRunning) Color(0xFF34D399) else Color(0xFFF87171),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        MetricCard(
                            label = "SPEED",
                            value = "$motorRpm RPM",
                            subtext = "48.3 Hz",
                            modifier = Modifier.weight(1f)
                        )
                        MetricCard(
                            label = "CURRENT",
                            value = if (isPumpRunning) "24.8 A" else "0.0 A",
                            subtext = "400V 3-Ph",
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        MetricCard(
                            label = "PRESSURE",
                            value = "4.2 Bar",
                            subtext = "Target: 4.5",
                            modifier = Modifier.weight(1f)
                        )
                        MetricCard(
                            label = "BEARING TEMP",
                            value = "62.4 °C",
                            subtext = "Trip: 85°C",
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }

        // Live Modbus Register Table (%MW, %SW, %M)
        item {
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "SCHNEIDER MODBUS REGISTER MAP",
                        color = Color(0xFF38BDF8),
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    RegisterRow("%MW100", "Holding: Tank Level (0.1%)", "742 (74.2%)", Color(0xFF38BDF8))
                    RegisterRow("%MW101", "Holding: Motor RPM", "$motorRpm", Color(0xFF38BDF8))
                    RegisterRow("%MW102", "Holding: Bearing Temp (0.1°C)", "624 (62.4°C)", Color(0xFF38BDF8))
                    RegisterRow("%MW103", "Holding: Discharge Pressure", "42 (4.2 Bar)", Color(0xFF38BDF8))
                    RegisterRow("%SW50", "System: Diagnostic Word", "0x0000 (OK)", Color(0xFF10B981))
                    RegisterRow("%M1", "Coil: Safety E-Stop Circuit", if (isEmergencyStopActive) "1 (TRIPPED)" else "0 (NORMAL)", if (isEmergencyStopActive) Color(0xFFEF4444) else Color(0xFF10B981))
                    RegisterRow("%M2", "Coil: Feed Pump P-101 Command", if (isPumpRunning) "1 (RUN)" else "0 (STOP)", Color(0xFFF59E0B))
                    RegisterRow("%M3", "Coil: Auto Sequencer Active", "1 (AUTO)", Color(0xFF10B981))
                }
            }
        }

        // Quick Control Actions
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onTogglePump,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isPumpRunning) Color(0xFF475569) else Color(0xFF059669)
                    ),
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(
                        text = if (isPumpRunning) "⏹ STOP PUMP" else "▶ START PUMP",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }

                Button(
                    onClick = onEmergencyStop,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isEmergencyStopActive) Color(0xFF059669) else Color(0xFFDC2626)
                    ),
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(
                        text = if (isEmergencyStopActive) "RESET E-STOP" else "🚨 E-STOP (%M1)",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }
    }
}

@Composable
fun MetricCard(label: String, value: String, subtext: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(10.dp),
        color = Color(0xFF0F172A)
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Text(label, color = Color(0xFF64748B), fontSize = 9.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(2.dp))
            Text(value, color = Color.White, fontSize = 14.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(2.dp))
            Text(subtext, color = Color(0xFF94A3B8), fontSize = 9.sp)
        }
    }
}

@Composable
fun RegisterRow(tag: String, desc: String, value: String, valueColor: Color) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(tag, color = Color.White, fontSize = 11.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
            Text(desc, color = Color(0xFF64748B), fontSize = 9.sp)
        }
        Text(value, color = valueColor, fontSize = 11.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun AlarmsScreenTab(
    isEmergencyStopActive: Boolean,
    onTriggerTestAlert: (AlertSeverity, String, String, String) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFF7F1D1D),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("CRITICAL", color = Color(0xFFFCA5A5), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text(if (isEmergencyStopActive) "1 ACTIVE" else "0 ACTIVE", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFF78350F),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("HIGH FAULTS", color = Color(0xFFFDE68A), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text("1 ACTIVE", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFF064E3B),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("RESOLVED", color = Color(0xFF6EE7B7), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text("4 TOTAL", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        if (isEmergencyStopActive) {
            item {
                AlarmCard(
                    severity = "CRITICAL",
                    title = "SCHNEIDER %M1 E-STOP TRIPPED",
                    desc = "Emergency Stop button pushed on Modicon M580 rack via USB-B safety bus.",
                    tag = "%M1_ESTOP_ACTIVE",
                    time = "Just now",
                    color = Color(0xFFEF4444)
                )
            }
        }

        item {
            AlarmCard(
                severity = "HIGH",
                title = "SCHNEIDER %SW50 FAULT 0x4210",
                desc = "Modicon system word %SW50 reported internal I/O bus communication error.",
                tag = "%SW50_DIAG_ERR",
                time = "3m ago",
                color = Color(0xFFF59E0B)
            )
        }

        item {
            AlarmCard(
                severity = "INFO",
                title = "USB-B CDC-ACM LINK NEGOTIATED",
                desc = "19200 baud, 8/E/1 established on /dev/bus/usb/001/002.",
                tag = "PORT_CDC_ACM",
                time = "12m ago",
                color = Color(0xFF38BDF8)
            )
        }

        item {
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = "TEST NOTIFICATION DISPATCHERS",
                color = Color(0xFF94A3B8),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = {
                        onTriggerTestAlert(
                            AlertSeverity.CRITICAL,
                            "SCHNEIDER %M1 E-STOP TRIPPED",
                            "Emergency Stop button pushed on Modicon M580 rack via USB-B safety bus.",
                            "%M1_ESTOP_ACTIVE"
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("🚨 Fire E-Stop", fontSize = 11.sp)
                }

                Button(
                    onClick = {
                        onTriggerTestAlert(
                            AlertSeverity.HIGH,
                            "SCHNEIDER %SW50 FAULT 0x4210",
                            "Modicon system word %SW50 reported internal I/O bus communication error.",
                            "%SW50_DIAG_ERR"
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B)),
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("⚠️ Fire %SW50", fontSize = 11.sp)
                }
            }
        }
    }
}

@Composable
fun AlarmCard(severity: String, title: String, desc: String, tag: String, time: String, color: Color) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = color.copy(alpha = 0.2f)
                ) {
                    Text(
                        text = severity,
                        color = color,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
                Text(time, color = Color(0xFF64748B), fontSize = 10.sp)
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(desc, color = Color(0xFF94A3B8), fontSize = 11.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(tag, color = Color(0xFF38BDF8), fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Button(
                        onClick = { },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155)),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text("Ack", fontSize = 10.sp)
                    }
                    Button(
                        onClick = { },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD97706)),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text("Dispatch", fontSize = 10.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun NetworkScannerScreenTab() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "SCHNEIDER SUBNET & mDNS DISCOVERY",
                        color = Color(0xFF38BDF8),
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Subnet: 192.168.1.0/24 • Ports: 502 (Modbus) & 1740 (UMAS)",
                        color = Color(0xFF94A3B8),
                        fontSize = 10.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7)),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Scan Subnet", fontSize = 11.sp)
                        }
                        Button(
                            onClick = { },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155)),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Listen mDNS", fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        item {
            Text("DISCOVERED SCHNEIDER PLC HARDWARE", color = Color(0xFF94A3B8), fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
        }

        item {
            DiscoveredDeviceCard(
                model = "Schneider Modicon M580 (BMEP584040)",
                ip = "192.168.1.10",
                ports = "502 (Modbus TCP) / 1740 (UMAS)",
                mac = "00:80:F4:A1:22:90",
                ping = "4 ms",
                isConnected = true
            )
        }

        item {
            DiscoveredDeviceCard(
                model = "Schneider Modicon M340 (BMXP342020)",
                ip = "192.168.1.12",
                ports = "502 (Modbus TCP)",
                mac = "00:80:F4:B8:11:04",
                ping = "9 ms",
                isConnected = false
            )
        }

        item {
            DiscoveredDeviceCard(
                model = "Schneider Altivar Process ATV630 VFD",
                ip = "192.168.1.25",
                ports = "502 (Modbus TCP)",
                mac = "00:80:F4:C3:77:4A",
                ping = "6 ms",
                isConnected = false
            )
        }

        item {
            DiscoveredDeviceCard(
                model = "Harmony Magelis HMIGTO HMI Panel",
                ip = "192.168.1.15",
                ports = "80 (HTTP) / 502 (Modbus)",
                mac = "00:80:F4:D5:19:80",
                ping = "12 ms",
                isConnected = false
            )
        }
    }
}

@Composable
fun DiscoveredDeviceCard(model: String, ip: String, ports: String, mac: String, ping: String, isConnected: Boolean) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(model, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(2.dp))
                Text("IP: $ip • MAC: $mac", color = Color(0xFF38BDF8), fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                Text("Ports: $ports • Ping: $ping", color = Color(0xFF64748B), fontSize = 10.sp)
            }
            Surface(
                shape = RoundedCornerShape(6.dp),
                color = if (isConnected) Color(0xFF064E3B) else Color(0xFF1E293B)
            ) {
                Text(
                    text = if (isConnected) "CONNECTED" else "CONNECT",
                    color = if (isConnected) Color(0xFF34D399) else Color(0xFF94A3B8),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}

@Composable
fun DriversScreenTab(
    onTriggerTestAlert: (AlertSeverity, String, String, String) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "SCHNEIDER ELECTRIC HARDWARE INTERFACE",
                        color = Color(0xFF38BDF8),
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "• USB-B Port: CDC-ACM / FTDI 19200 8-E-1 Ready\n• RJ-45 to Type-C: Modbus TCP (Port 502) Active\n• Registers: %MW (Holding), %SW (System), %M (Coils)",
                        color = Color(0xFFCBD5E1),
                        fontSize = 11.sp,
                        lineHeight = 16.sp
                    )
                }
            }
        }

        item {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "ANDROID 14 OTG HOST DRIVER ENGINE",
                        color = Color(0xFFF59E0B),
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "• OTG Role: Dual-Role Data (DRD) forced to Host (DFP)\n• UsbManager: android.hardware.usb.action.USB_DEVICE_ATTACHED\n• Vendor IDs: 0x0483 (STMicroelectronics), 0x0403 (FTDI), 0x1A86 (CH340)\n• Foreground Service: DirectMaintenanceService running (Notification Channel Active)",
                        color = Color(0xFF94A3B8),
                        fontSize = 10.sp,
                        lineHeight = 15.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = {
                        onTriggerTestAlert(
                            AlertSeverity.CRITICAL,
                            "SCHNEIDER %M1 E-STOP TRIPPED",
                            "Emergency Stop button pushed on Modicon M580 rack via USB-B safety bus.",
                            "%M1_ESTOP_ACTIVE"
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("🚨 %M1 E-Stop", fontSize = 11.sp)
                }

                Button(
                    onClick = {
                        onTriggerTestAlert(
                            AlertSeverity.HIGH,
                            "SCHNEIDER %SW50 FAULT 0x4210",
                            "Modicon system word %SW50 reported internal I/O bus communication error.",
                            "%SW50_DIAG_ERR"
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B)),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("⚠️ %SW50 Fault", fontSize = 11.sp)
                }
            }
        }
    }
}

@Composable
fun WiringScreenTab() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "SCHNEIDER USB-B CONSOLE PINOUT",
                        color = Color(0xFF38BDF8),
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Pin 1: VBUS (+5V DC Red) - Power sensing\nPin 2: D- (White) - Differential Data Negative\nPin 3: D+ (Green) - Differential Data Positive\nPin 4: GND (Black) - Ground reference\nShield: Braided drain connected to chassis ground", color = Color(0xFFCBD5E1), fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                }
            }
        }

        item {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "RJ-45 INDUSTRIAL ETHERNET (T-568B)",
                        color = Color(0xFF10B981),
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Pin 1: TX+ (White/Orange)\nPin 2: TX- (Orange)\nPin 3: RX+ (White/Green)\nPin 4: Unused (Blue)\nPin 5: Unused (White/Blue)\nPin 6: RX- (Green)\nPin 7: Unused (White/Brown)\nPin 8: Unused (Brown)", color = Color(0xFFCBD5E1), fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                }
            }
        }
    }
}

@Composable
fun DirectMaintenanceTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFFF59E0B),
            background = Color(0xFF020617),
            surface = Color(0xFF0F172A)
        ),
        content = content
    )
}
