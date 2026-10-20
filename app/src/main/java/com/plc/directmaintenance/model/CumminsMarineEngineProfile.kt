package com.plc.directmaintenance.model

/**
 * Exact Marine Engine and DG Local Control Panel specification
 * as per Cummins Drawing A067B091 (YD 305/307 DG Local Panel)
 * and Drawing 6453449 (Bajrang Main Engine Instrumentation List).
 */
data class CumminsSensorSpec(
    val srNo: Int,
    val description: String,
    val cumminsPartNo: String,
    val mountingLocation: String,
    val signalType: String,
    val rangeMin: Double,
    val rangeMax: Double,
    val unit: String,
    val alarmSetpoint: Double?,
    val tripSetpoint: Double?,
    val modbusAddress: Int,
    val remark: String
)

data class CumminsSafetyInterlock(
    val id: Int,
    val name: String,
    val condition: String,
    val preventsEngineStart: Boolean,
    val activeState: Boolean,
    val digitalInputTag: String,
    val connectorPin: String
)

object CumminsMarineEngineProfile {
    const val VESSEL_ID = "YD_305_307_DG_LOCAL_PANEL"
    const val DRAWING_NO_DG = "A067B091"
    const val DRAWING_NO_MAIN_ENGINE = "6453449"
    const val CUMMINS_JUNCTION_BOX_PART = "5580514"
    const val LOCAL_CONTROL_PANEL_PART = "4348239"
    const val FLYWHEEL_TEETH_COUNT = 142
    const val RATED_RPM = 1800.0
    const val OVERSPEED_TRIP_RPM = 1980.0

    val SENSORS = listOf(
        CumminsSensorSpec(1, "Engine Speed (MPU)", "4912304", "Flywheel Housing", "Frequency (MPU / F-I Converter)", 0.0, 2000.0, "RPM", null, 1980.0, 30001, "142 teeth flywheel, overspeed trip 1980 RPM"),
        CumminsSensorSpec(2, "Lub Oil Temperature Transmitter", "4963242", "Lub Oil Pan", "4-20 mA", 0.0, 150.0, "°C", 121.0, 125.0, 30002, "Alarm 121 °C, Trip 125 °C"),
        CumminsSensorSpec(3, "Lub Oil Pressure Transmitter", "5543059", "Main Oil Gallery", "4-20 mA", 0.0, 16.0, "bar", 1.2, 0.8, 30003, "Alarm 1.2 bar, Trip 0.8 bar (Switch 4962856)"),
        CumminsSensorSpec(4, "Turning Gear Engaged Safety Switch", "4368842", "Flywheel Housing", "Digital Input (DI NO/NC)", 0.0, 1.0, "State", 1.0, 1.0, 10001, "OPEN CONTACT: Engine start prohibited when turning gear engaged"),
        CumminsSensorSpec(5, "Sea Water Pressure Transmitter", "5543058", "Sea Water System", "4-20 mA", 0.0, 6.0, "bar", 0.8, null, 30004, "Alarm on low pressure < 0.8 bar"),
        CumminsSensorSpec(6, "Fuel Pressure Transmitter", "5543059", "Fuel System", "4-20 mA", 0.0, 16.0, "bar", 2.0, null, 30005, "Monitoring fuel header pressure"),
        CumminsSensorSpec(7, "Cooling Water Temperature Transmitter", "4963242", "Engine Cooling Jacket", "4-20 mA", 0.0, 150.0, "°C", 92.0, 97.0, 30006, "Alarm 92 °C, Trip 97 °C (Switch 4962857)"),
        CumminsSensorSpec(8, "Exhaust Temp Left Bank", "4911878", "Exhaust Elbow (Left)", "CR-AL K-Type Thermocouple", 0.0, 800.0, "°C", 550.0, null, 30007, "Alarm threshold 550 °C"),
        CumminsSensorSpec(9, "Exhaust Temp Right Bank", "4911878", "Exhaust Elbow (Right)", "CR-AL K-Type Thermocouple", 0.0, 800.0, "°C", 550.0, null, 30008, "Alarm threshold 550 °C"),
        CumminsSensorSpec(10, "Low Coolant Level Switch", "4383931", "Fresh Water Expansion Tank", "Active High Digital Input", 0.0, 1.0, "State", 1.0, null, 10002, "Expansion tank low water level alarm")
    )

    val SAFETY_INTERLOCKS = listOf(
        CumminsSafetyInterlock(1, "Turning Gear Disengagement Interlock", "TURNING GEAR ENGAGED", true, false, "%I0.2.0", "J14 / Pin N"),
        CumminsSafetyInterlock(2, "Local / Remote Control Isolation", "REMOTELY WHEN ENGINE IS UNDER LOCAL CONTROL", true, false, "%I0.2.1", "X9 / Pin 1-2"),
        CumminsSafetyInterlock(3, "Safety Device Trip Memory Reset", "SAFETY DEVICE OPERATED (MUST RESET BEFORE RESTART)", true, false, "%M20_SAFETY_LATCH", "Internal Coil"),
        CumminsSafetyInterlock(4, "Expansion Tank Fresh Water Level", "LOW FRESH WATER LEVEL IN EXPANSION TANK", true, false, "%I0.2.2", "J14 / Pin M"),
        CumminsSafetyInterlock(5, "Safety Shutdown Active Latch", "ANY SAFETY SHUTDOWN ACTIVATED AND RESET NOT DONE", true, false, "%M21_SHUTDOWN_LATCH", "Internal Coil"),
        CumminsSafetyInterlock(6, "Emergency Stop Circuit Continuity", "EMERGENCY STOP IS PRESSED (LOCAL OR REMOTE)", true, false, "%I0.2.3 (NC Loop)", "X9 / Pin 3-4"),
        CumminsSafetyInterlock(7, "Marine Gearbox Neutral Interlock", "CLUTCH NOT IN NEUTRAL POSITION", true, false, "%I0.2.4", "J7 / Pin D")
    )
}
