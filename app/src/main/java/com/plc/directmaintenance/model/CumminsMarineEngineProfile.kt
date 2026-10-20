package com.plc.directmaintenance.model

/**
 * Cummins Marine Engine & DG Local Control Panel Specification
 * Based on Cummins Drawings 6453449 & A067B091 (Accurate Industrial Controls / Baljeeth Bajrang).
 * Monitored by Schneider Modicon TM241 & Harmony HMI GTO3510.
 */
data class CumminsSensorSpec(
    val id: String,
    val name: String,
    val cumminsPartNo: String,
    val location: String,
    val signalType: String,
    val rangeMin: Double,
    val rangeMax: Double,
    val unit: String,
    val normalOperating: String,
    val alarmSetpoint: Double?,
    val tripSetpoint: Double?,
    val modbusRegister: Int, // %MW address on TM241
    val plcChannel: String
)

data class SafetyInterlock(
    val conditionNumber: Int,
    val title: String,
    val ruleDescription: String,
    val schematicTag: String,
    val terminalOrPin: String,
    val modbusBitAddress: String
)

object CumminsEngineCatalog {
    val ENGINE_SENSORS = listOf(
        CumminsSensorSpec(
            id = "RPM_01",
            name = "Engine Speed (MPU)",
            cumminsPartNo = "4912304",
            location = "Flywheel Housing (142 Teeth Ring Gear)",
            signalType = "Magnetic Pickup Frequency via Astronic F/I Converter",
            rangeMin = 0.0,
            rangeMax = 2200.0,
            unit = "RPM",
            normalOperating = "1400 - 1500 RPM (DG 50 Hz)",
            alarmSetpoint = null,
            tripSetpoint = 1980.0,
            modbusRegister = 30001,
            plcChannel = "Astronic F/I Conv -> TM3AI8G Ch 0 (4-20mA)"
        ),
        CumminsSensorSpec(
            id = "OIL_TEMP",
            name = "Lub Oil Temperature",
            cumminsPartNo = "4963242",
            location = "Lub Oil Sump / Pan",
            signalType = "4-20 mA Transmitter",
            rangeMin = 0.0,
            rangeMax = 150.0,
            unit = "°C",
            normalOperating = "80 - 105 °C",
            alarmSetpoint = 121.0,
            tripSetpoint = 125.0,
            modbusRegister = 30002,
            plcChannel = "TM3AI8G Ch 1 (%IW0.1.1)"
        ),
        CumminsSensorSpec(
            id = "OIL_PRESS",
            name = "Lub Oil Pressure",
            cumminsPartNo = "5543059 (TX) / 4962856 (Switch)",
            location = "Main Engine Oil Gallery",
            signalType = "4-20 mA (4962856 Trip Switch NC contact)",
            rangeMin = 0.0,
            rangeMax = 16.0,
            unit = "bar",
            normalOperating = "3.5 - 5.5 bar",
            alarmSetpoint = 1.2,
            tripSetpoint = 0.8,
            modbusRegister = 30003,
            plcChannel = "TM3AI8G Ch 2 (%IW0.1.2) + TM3DI8G (%I0.2.0)"
        ),
        CumminsSensorSpec(
            id = "TURNING_GEAR",
            name = "Turning Gear Position Switch",
            cumminsPartNo = "4368842",
            location = "Flywheel Casing Turning Gear Lever",
            signalType = "Digital Input (Normally Open - Closes on Disengage)",
            rangeMin = 0.0,
            rangeMax = 1.0,
            unit = "BOOL",
            normalOperating = "Disengaged (Safe)",
            alarmSetpoint = null,
            tripSetpoint = 1.0, // Engaged inhibits start
            modbusRegister = 10001,
            plcChannel = "TM3DI8G Ch 0 (%I0.2.0, J14 Pin N)"
        ),
        CumminsSensorSpec(
            id = "SEA_WATER_PRESS",
            name = "Sea Water Pressure",
            cumminsPartNo = "5543058",
            location = "Raw Sea Water Cooling Pump Discharge",
            signalType = "4-20 mA",
            rangeMin = 0.0,
            rangeMax = 6.0,
            unit = "bar",
            normalOperating = "1.5 - 3.0 bar",
            alarmSetpoint = 0.8,
            tripSetpoint = 0.5,
            modbusRegister = 30004,
            plcChannel = "TM3AI8G Ch 3 (%IW0.1.3)"
        ),
        CumminsSensorSpec(
            id = "COOLANT_TEMP",
            name = "Cooling Water Temp (Jacket Water)",
            cumminsPartNo = "4963242 (TX) / 4962857 (Switch)",
            location = "Engine Jacket Water Manifold",
            signalType = "4-20 mA Transmitter + High Temp Switch",
            rangeMin = 0.0,
            rangeMax = 150.0,
            unit = "°C",
            normalOperating = "78 - 88 °C",
            alarmSetpoint = 92.0,
            tripSetpoint = 97.0,
            modbusRegister = 30006,
            plcChannel = "TM3AI8G Ch 5 (%IW0.1.5)"
        ),
        CumminsSensorSpec(
            id = "EXHAUST_TEMP_L",
            name = "Exhaust Temp - Left Bank",
            cumminsPartNo = "4911878",
            location = "Exhaust Elbow - Left Turbo Inlet",
            signalType = "CR-AL K-Thermocouple",
            rangeMin = 0.0,
            rangeMax = 800.0,
            unit = "°C",
            normalOperating = "380 - 480 °C",
            alarmSetpoint = 550.0,
            tripSetpoint = 600.0,
            modbusRegister = 30007,
            plcChannel = "TM3TI4G Ch 0 (%IW0.3.0)"
        ),
        CumminsSensorSpec(
            id = "EXHAUST_TEMP_R",
            name = "Exhaust Temp - Right Bank",
            cumminsPartNo = "4911878",
            location = "Exhaust Elbow - Right Turbo Inlet",
            signalType = "CR-AL K-Thermocouple",
            rangeMin = 0.0,
            rangeMax = 800.0,
            unit = "°C",
            normalOperating = "380 - 480 °C",
            alarmSetpoint = 550.0,
            tripSetpoint = 600.0,
            modbusRegister = 30008,
            plcChannel = "TM3TI4G Ch 1 (%IW0.3.1)"
        ),
        CumminsSensorSpec(
            id = "COOLANT_LEVEL",
            name = "Expansion Tank Fresh Water Level",
            cumminsPartNo = "4383931",
            location = "Expansion Tank Top Port",
            signalType = "Digital Level Switch (Low Float contact)",
            rangeMin = 0.0,
            rangeMax = 1.0,
            unit = "BOOL",
            normalOperating = "Level OK (Contact Closed)",
            alarmSetpoint = 0.0,
            tripSetpoint = 0.0,
            modbusRegister = 10002,
            plcChannel = "TM3DI8G Ch 2 (%I0.2.2, J14 Pin M)"
        )
    )

    val SAFETY_INTERLOCKS = listOf(
        SafetyInterlock(
            conditionNumber = 1,
            title = "Turning Gear Interlock",
            ruleDescription = "Engine start sequence is locked out whenever turning gear is engaged.",
            schematicTag = "TG-SW (4368842)",
            terminalOrPin = "J14 Connector Pin N",
            modbusBitAddress = "%M10"
        ),
        SafetyInterlock(
            conditionNumber = 2,
            title = "Local Control Remote Lockout",
            ruleDescription = "Remote start command disabled when panel 3-position switch is in LOCAL position.",
            schematicTag = "LOC/REM-SS",
            terminalOrPin = "Terminal X9 Pins 1-2",
            modbusBitAddress = "%M11"
        ),
        SafetyInterlock(
            conditionNumber = 3,
            title = "Safety Device Operated Memory",
            ruleDescription = "If any shutdown switch has activated, start circuit remains open until alarm acknowledged.",
            schematicTag = "SAFETY-LATCH",
            terminalOrPin = "Internal Relay K1 / K3",
            modbusBitAddress = "%M20"
        ),
        SafetyInterlock(
            conditionNumber = 4,
            title = "Expansion Tank Low Water",
            ruleDescription = "Low fresh water level inhibits starting and raises visual lamp on panel.",
            schematicTag = "LL-SW (4383931)",
            terminalOrPin = "J14 Connector Pin M",
            modbusBitAddress = "%M12"
        ),
        SafetyInterlock(
            conditionNumber = 5,
            title = "Shutdown Reset Required",
            ruleDescription = "Emergency shutdown requires electrical reset before starter motor solenoid can energize.",
            schematicTag = "RESET-PB",
            terminalOrPin = "Panel Pushbutton PB2 (X9:7)",
            modbusBitAddress = "%M21"
        ),
        SafetyInterlock(
            conditionNumber = 6,
            title = "Emergency Stop Loop",
            ruleDescription = "Dual channel emergency stop loop (Bridge & Engine Room) opens fuel solenoid valve 24V supply.",
            schematicTag = "E-STOP",
            terminalOrPin = "Terminal X9 Pins 3-4 (NC series)",
            modbusBitAddress = "%M0.0"
        ),
        SafetyInterlock(
            conditionNumber = 7,
            title = "Clutch Neutral Safety",
            ruleDescription = "Marine gearbox clutch must be in neutral before engine start is authorized.",
            schematicTag = "CLUTCH-NEUT",
            terminalOrPin = "J7 Connector Pin D",
            modbusBitAddress = "%M13"
        )
    )
}