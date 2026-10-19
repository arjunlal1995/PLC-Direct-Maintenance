import { MaintenanceChecklist, PlcAlert } from '../types';

export function generateChecklistForAlert(alert: PlcAlert, technicianName: string = 'Alex Mercer (Lead Tech)'): MaintenanceChecklist {
  const isSeaWater = alert.title.toLowerCase().includes('sea water') || alert.plcTag.includes('100');
  const isEstop = alert.title.toLowerCase().includes('em-stop') || alert.title.toLowerCase().includes('e-stop') || alert.plcTag.includes('ESTOP') || alert.plcTag.includes('%M1');
  const isBearing = alert.title.toLowerCase().includes('bearing') || alert.title.toLowerCase().includes('spindle') || alert.plcTag.includes('102');
  const isHydraulic = alert.title.toLowerCase().includes('hydraulic') || alert.title.toLowerCase().includes('filter');

  if (isSeaWater) {
    return {
      id: `CHK-${alert.id}-${Date.now().toString().slice(-4)}`,
      alertId: alert.id,
      alertTitle: alert.title,
      machineId: alert.machineId,
      machineName: alert.machineName,
      plcTag: alert.plcTag,
      procedureCode: 'SOP-COOL-04',
      title: 'Raw Sea Water Cooling Circuit Inspection & Strainer Flush',
      category: 'CORRECTIVE',
      priority: 'HIGH',
      createdAt: Date.now(),
      assignedTechnician: technicianName,
      status: 'OPEN',
      partsUsed: [
        { partNumber: 'SCH-FLT-882', name: 'Neoprene Impeller Replacement Kit', quantity: 1 },
        { partNumber: 'O-RING-V90', name: 'Viton Housing O-Ring 90mm', quantity: 2 }
      ],
      items: [
        {
          id: 'step-1',
          title: 'Isolate Raw Water Seacock & Lock Out Pump Drive',
          description: 'Close inlet sea chest valve V-01 and verify zero suction head before opening strainer housing.',
          isCompleted: false,
          criticalStep: true,
          ppeRequired: ['Safety Glasses', 'Nitrile Gloves', 'Non-Slip Steel Toe Boots'],
          toolsRequired: ['Valve Wheel Key', 'LOTO Padlock #42'],
          estimatedMinutes: 5
        },
        {
          id: 'step-2',
          title: 'Extract & Inspect Raw Water Strainer Basket',
          description: 'Remove bronze clamp bolts. Clear marine growth, seaweed, and debris from 1.5mm stainless basket.',
          isCompleted: false,
          criticalStep: false,
          toolsRequired: ['17mm Socket Wrench', 'Brass Wire Brush'],
          estimatedMinutes: 10
        },
        {
          id: 'step-3',
          title: 'Inspect Flexible Impeller Vanes for Fatigue or Missing Fins',
          description: 'Rotate shaft manually 360°. Inspect all 12 neoprene vanes for radial root cracking or detachment.',
          isCompleted: false,
          criticalStep: true,
          toolsRequired: ['Impeller Puller Tool', 'Inspection Flashlight'],
          estimatedMinutes: 15
        },
        {
          id: 'step-4',
          title: 'Verify 4-20mA Pressure Sensor PT-100 Connection on Modicon %MW100',
          description: 'Connect Fluke meter in series to terminal block TB4. Verify 4.0mA at 0 Bar and 9.4mA at 0.85 Bar setpoint.',
          isCompleted: false,
          criticalStep: false,
          toolsRequired: ['Fluke 87V Multimeter', 'Terminal Screwdriver 2.5mm'],
          estimatedMinutes: 10
        },
        {
          id: 'step-5',
          title: 'Re-Prime Pump Housing & Vent Trapped Air',
          description: 'Crack top vent petcock. Slowly open suction seacock until steady air-free stream emerges. Tighten petcock.',
          isCompleted: false,
          criticalStep: false,
          toolsRequired: ['Bleeder Key'],
          estimatedMinutes: 5
        },
        {
          id: 'step-6',
          title: 'Restart Pump & Validate Pressure Stabilization (> 0.85 Bar)',
          description: 'Energize drive. Confirm reading on Schneider Harmony HMI rises above 0.80 Bar threshold and warning banner clears.',
          isCompleted: false,
          criticalStep: true,
          toolsRequired: ['HMI Display / Android App'],
          estimatedMinutes: 5
        }
      ]
    };
  }

  if (isEstop) {
    return {
      id: `CHK-${alert.id}-${Date.now().toString().slice(-4)}`,
      alertId: alert.id,
      alertTitle: alert.title,
      machineId: alert.machineId,
      machineName: alert.machineName,
      plcTag: alert.plcTag,
      procedureCode: 'SOP-SAFE-01',
      title: 'Safety Interlock E-Stop Chain Verification & Reset Procedure',
      category: 'SAFETY_INTERLOCK',
      priority: 'CRITICAL',
      createdAt: Date.now(),
      assignedTechnician: technicianName,
      status: 'OPEN',
      items: [
        {
          id: 'step-1',
          title: 'Verify Physical Floor Safety Perimeter',
          description: 'Confirm all operators, personnel, and tooling are completely clear of the machine danger envelope.',
          isCompleted: false,
          criticalStep: true,
          ppeRequired: ['Hi-Vis Vest', 'Hard Hat', 'Safety Glasses'],
          estimatedMinutes: 5
        },
        {
          id: 'step-2',
          title: 'Inspect Actuated E-Stop Pushbutton & Mechanism',
          description: 'Locate tripped mushroom head (Bridge / Station #1). Check for mechanical obstruction or switch contact damage.',
          isCompleted: false,
          criticalStep: true,
          toolsRequired: ['Cabinet Key'],
          estimatedMinutes: 5
        },
        {
          id: 'step-3',
          title: 'Measure Dual-Channel Safety Relay Voltage (Channels S11-S12 / S21-S22)',
          description: 'Verify 24V DC auxiliary safety circuit integrity across dual contact pairs. Ensure zero ground fault resistance.',
          isCompleted: false,
          criticalStep: true,
          toolsRequired: ['Fluke 87V Multimeter'],
          estimatedMinutes: 8
        },
        {
          id: 'step-4',
          title: 'Twist to Reset Mushroom Head & Verify Aux Contact Continuity',
          description: 'Twist button clockwise until latch releases. Confirm safety relay LEDs K1 and K2 illuminate solidly.',
          isCompleted: false,
          criticalStep: false,
          estimatedMinutes: 2
        },
        {
          id: 'step-5',
          title: 'Perform Controlled Blue Master Reset on Schneider PLC (%M0)',
          description: 'Depress blue illuminated RESET button for 3 seconds to pulse PLC input tag %M0_SYS_RUN and re-arm master contactor.',
          isCompleted: false,
          criticalStep: true,
          estimatedMinutes: 3
        }
      ]
    };
  }

  if (isBearing) {
    return {
      id: `CHK-${alert.id}-${Date.now().toString().slice(-4)}`,
      alertId: alert.id,
      alertTitle: alert.title,
      machineId: alert.machineId,
      machineName: alert.machineName,
      plcTag: alert.plcTag,
      procedureCode: 'SOP-BRG-12',
      title: 'High-Speed Spindle Bearing Thermal Inspection & Lubrication PM',
      category: 'PREVENTATIVE',
      priority: 'HIGH',
      createdAt: Date.now(),
      assignedTechnician: technicianName,
      status: 'OPEN',
      partsUsed: [
        { partNumber: 'KLUBER-ISOFLEX-NBU15', name: 'Kluber High-Speed Spindle Grease Cartridge', quantity: 1 }
      ],
      items: [
        {
          id: 'step-1',
          title: 'Log Final Temperature & Vibration RMS Spectrum',
          description: 'Record current temperature from PT100 sensor and verify vibration baseline on Omron/Schneider register %MW102.',
          isCompleted: false,
          criticalStep: false,
          toolsRequired: ['Thermal Infrared Camera FLIR E5', 'Vibration Pen'],
          estimatedMinutes: 5
        },
        {
          id: 'step-2',
          title: 'Lock Out Spindle Drive & Allow Cool-Down Below 45°C',
          description: 'Apply LOTO to main 400V inverter drive disconnect switch. Wait for bearing housing to cool down safely.',
          isCompleted: false,
          criticalStep: true,
          ppeRequired: ['Thermal Insulated Gloves'],
          toolsRequired: ['Padlock LOTO'],
          estimatedMinutes: 20
        },
        {
          id: 'step-3',
          title: 'Inspect Chiller Fluid Flow Rate & Spindle Jacket Delta-T',
          description: 'Verify closed-loop water glycol chiller is running at 18°C setpoint with minimum 8.5 L/min flow rate.',
          isCompleted: false,
          criticalStep: false,
          toolsRequired: ['Flow Meter Sight Glass'],
          estimatedMinutes: 8
        },
        {
          id: 'step-4',
          title: 'Precision Micro-Grease Dosing (1.2 cm³ Kluber NBU15)',
          description: 'Connect calibrated metered grease gun to front bearing grease nipple. Inject precisely 1.2 cm³ grease.',
          isCompleted: false,
          criticalStep: true,
          toolsRequired: ['Calibrated Spindle Grease Dispenser'],
          estimatedMinutes: 10
        },
        {
          id: 'step-5',
          title: 'Execute Bearing Re-Conditioning Run-In Cycle (500 -> 3000 -> 12000 RPM)',
          description: 'Run spindle step ramp: 10 mins @ 500 RPM, 10 mins @ 3000 RPM, 10 mins @ 12000 RPM. Verify temp stays < 65°C.',
          isCompleted: false,
          criticalStep: true,
          toolsRequired: ['CNC Control Panel'],
          estimatedMinutes: 30
        }
      ]
    };
  }

  // Default Generic PLC Routine Checklist
  return {
    id: `CHK-${alert.id}-${Date.now().toString().slice(-4)}`,
    alertId: alert.id,
    alertTitle: alert.title,
    machineId: alert.machineId,
    machineName: alert.machineName,
    plcTag: alert.plcTag,
    procedureCode: 'SOP-GEN-01',
    title: `Diagnostic Routine Maintenance for ${alert.title}`,
    category: 'CORRECTIVE',
    priority: alert.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
    createdAt: Date.now(),
    assignedTechnician: technicianName,
    status: 'OPEN',
    items: [
      {
        id: 'step-1',
        title: 'Safety Lock-Out & Visual Inspection',
        description: 'Ensure area is safe. Inspect physical actuators, cabling, and sensor connectors for loose wires or physical damage.',
        isCompleted: false,
        criticalStep: true,
        ppeRequired: ['Safety Glasses', 'Steel Toe Boots'],
        estimatedMinutes: 5
      },
      {
        id: 'step-2',
        title: 'Verify PLC Diagnostic Code on %SW50 / %MW Registers',
        description: `Check live telemetry register for tag ${alert.plcTag} via Android USB-B OTG or RJ-45 connection.`,
        isCompleted: false,
        criticalStep: false,
        toolsRequired: ['PLC Direct Maintenance Android App'],
        estimatedMinutes: 5
      },
      {
        id: 'step-3',
        title: 'Perform Component Remediation & Cleaning',
        description: 'Clean optical sensor heads, inspect hydraulic filters, and check terminal screw torques.',
        isCompleted: false,
        criticalStep: false,
        toolsRequired: ['Insulated Screwdriver Set', 'Contact Cleaner'],
        estimatedMinutes: 15
      },
      {
        id: 'step-4',
        title: 'Operational Test & Alarm Clear Verification',
        description: 'Energize subsystem and verify that the PLC fault register clears to 0x0000 on the live dashboard.',
        isCompleted: false,
        criticalStep: true,
        estimatedMinutes: 10
      }
    ]
  };
}
