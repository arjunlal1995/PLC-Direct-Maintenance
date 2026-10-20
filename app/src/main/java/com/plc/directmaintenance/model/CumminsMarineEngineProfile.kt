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
    const val OVERSPEED_TRIP_RPM = 1980.0 // 10-12% of nominal rated

    val SENSORS = listOf(
        CumminsSensorSpec(
            srNo = 1,
            description = "Engine Speed (Magnetic Pickup MPU)",
            cumminsPartNo = "4912304",
            mountingLocation = "Flywheel Housing",
            signalType = "Frequency (MPU / F-I Converter)",
            rangeMin = 0.0,
            rangeMax = 2000.0,
            unit = "RPM",
            alarmSetpoint = null,
            tripSetpoint = 1980.0,
            modbusAddress = 30001,
            remark = "142 teeth flywheel, overspeed trip at 1980 RPM"
        ),
        CumminsSensorSpec(
            srNo = 2,
            description = "Lub Oil Temperature Transmitter",
            cumminsPartNo = "4963242",
            mountingLocation = "Lub Oil Pan",
            signalType = "4-20 mA",
            rangeMin = 0.0,
            rangeMax = 150.0,
            unit = "°C",
            alarmSetpoint = 121.0,
            tripSetpoint = 125.0,
            modbusAddress = 30002,
            remark = "Alarm & Trip values settable"
        ),
        CumminsSensorSpec(
            srNo = 3,
            description = "Lub Oil Pressure Transmitter",
            cumminsPartNo = "5543059",
            mountingLocation = "Main Oil Gallery",
            signalType = "4-20 mA",
            rangeMin = 0.0,
            rangeMax = 16.0,
            unit = "bar",
            alarmSetpoint = 1.2,
            tripSetpoint = 0.8,
            modbusAddress = 30003,
            remark = "Coupled with Low Lub Oil Pressure Trip Switch 4962856"
        ),
        CumminsSensorSpec(
            srNo = 4,
            description = "Turning Gear Engaged Safety Switch",
            cumminsPartNo = "4368842",
            mountingLocation = "Flywheel Housing",
            signalType = "Digital Input (DI NO/NC)",
            rangeMin = 0.0,
            rangeMax = 1.0,
            unit = "State",
            alarmSetpoint = 1.0,
            tripSetpoint = 1.0,
            modbusAddress = 10001,
            remark = "OPEN CONTACT INTERLOCK: Engine start prohibited when turning gear engaged"
        ),
        CumminsSensorSpec(
            srNo = 5,
            description = "Sea Water Pressure Transmitter",
            cumminsPartNo = "5543058",
            mountingLocation = "Sea Water System",
            signalType = "4-20 mA",
            rangeMin = 0.0,
            rangeMax = 6.0,
            unit = "bar",
            alarmSetpoint = 0.8,
            tripSetpoint = null,
            modbusAddress = 30004,
            remark = "Alarm on low pressure < 0.8 bar"
        ),
        CumminsSensorSpec(
            srNo = 6,
            description = "Fuel Pressure Transmitter",
            cumminsPartNo = "5543059",
            mountingLocation = "Fuel System",
            signalType = "4-20 mA",
            rangeMin = 0.0,
            rangeMax = 16.0,
            unit = "bar",
            alarmSetpoint = 2.0,
            tripSetpoint = null,
            modbusAddress = 30005,
            remark = "Monitoring pressure to fuel pump"
        ),
        CumminsSensorSpec(
            srNo = 7,
            description = "Cooling Water Temperature Transmitter",
            cumminsPartNo = "4963242",
            mountingLocation = "Engine Cooling Jacket",
            signalType = "4-20 mA",
            rangeMin = 0.0,
            rangeMax = 150.0,
            unit = "°C",
            alarmSetpoint = 92.0,
            tripSetpoint = 97.0,
            modbusAddress = 30006,
            remark = "Coupled with Very High Water Temp Trip Switch 4962857"
        ),
        CumminsSensorSpec(
            srNo = 8,
            description = "Exhaust Temp Left Bank",
            cumminsPartNo = "4911878",
            mountingLocation = "Exhaust Elbow (Left)",
            signalType = "CR-AL K-Type Thermocouple",
            rangeMin = 0.0,
            rangeMax = 800.0,
            unit = "°C",
            alarmSetpoint = 550.0,
            tripSetpoint = null,
            modbusAddress = 30007,
            remark = "Alarm value settable, threshold 550 °C"
        ),
        CumminsSensorSpec(
            srNo = 9,
            description = "Exhaust Temp Right Bank",
            cumminsPartNo = "4911878",
            mountingLocation = "Exhaust Elbow (Right)",
            signalType = "CR-AL K-Type Thermocouple",
            rangeMin = 0.0,
            rangeMax = 800.0,
            unit = "°C",
            alarmSetpoint = 550.0,
            tripSetpoint = null,
            modbusAddress = 30008,
            remark = "Alarm value settable, threshold 550 °C"
        ),
        CumminsSensorSpec(
            srNo = 10,
            description = "Low Coolant Level Switch",
            cumminsPartNo = "4383931",
            mountingLocation = "Fresh Water Expansion Tank",
            signalType = "Active High Digital Input",
            rangeMin = 0.0,
            rangeMax = 1.0,
            unit = "State",
            alarmSetpoint = 1.0,
            tripSetpoint = null,
            modbusAddress = 10002,
            remark = "Expansion tank low water level alarm"
        )
    )

    val SAFETY_INTERLOCKS = listOf(
        CumminsSafetyInterlock(
            id = 1,
            name = "Turning Gear Disengagement Interlock",
            condition = "TURNING GEAR ENGAGED",
            preventsEngineStart = true,
            activeState = false,
            digitalInputTag = "%I0.2.0",
            connectorPin = "J14 / Pin N"
        ),
        CumminsSafetyInterlock(
            id = 2,
            name = "Local / Remote Control Isolation",
            condition = "REMOTELY WHEN ENGINE IS UNDER LOCAL CONTROL",
            preventsEngineStart = true,
            activeState = false,
            digitalInputTag = "%I0.2.1",
            connectorPin = "X9 / Pin 1-2"
        ),
        CumminsSafetyInterlock(
            id = 3,
            name = "Safety Device Trip Memory Reset",
            condition = "SAFETY DEVICE OPERATED (MUST RESET BEFORE RESTART)",
            preventsEngineStart = true,
            activeState = false,
            digitalInputTag = "%M20_SAFETY_LATCH",
            connectorPin = "Internal Coil"
        ),
        CumminsSafetyInterlock(
            id = 4,
            name = "Expansion Tank Fresh Water Level",
            condition = "LOW FRESH WATER LEVEL IN EXPANSION TANK",
            preventsEngineStart = true,
            activeState = false,
            digitalInputTag = "%I0.2.2",
            connectorPin = "J14 / Pin M"
        ),
        CumminsSafetyInterlock(
            id = 5,
            name = "Safety Shutdown Active Latch",
            condition = "ANY SAFETY SHUTDOWN ACTIVATED AND RESET NOT DONE",
            preventsEngineStart = true,
            activeState = false,
            digitalInputTag = "%M21_SHUTDOWN_LATCH",
            connectorPin = "Internal Coil"
        ),
        CumminsSafetyInterlock(
            id = 6,
            name = "Emergency Stop Circuit Continuity",
            condition = "EMERGENCY STOP IS PRESSED (LOCAL OR REMOTE)",
            preventsEngineStart = true,
            activeState = false,
            digitalInputTag = "%I0.2.3 (NC Loop)",
            connectorPin = "X9 / Pin 3-4 & Panel PB"
        ),
        CumminsSafetyInterlock(
            id = 7,
            name = "Marine Gearbox Neutral Interlock",
            condition = "CLUTCH NOT IN NEUTRAL POSITION",
            preventsEngineStart = true,
            activeState = false,
            digitalInputTag = "%I0.2.4",
            connectorPin = "J7 / Pin D"
        )
    )
}
