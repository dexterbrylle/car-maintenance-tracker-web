# Official Mazda CX-5 2016 Schedule 2 (Severe Driving Conditions)
# Suitable for Philippines due to: traffic congestion, dusty conditions,
# hot/humid climate, extended idling, rough roads

MAZDA_CX5_2016_PHILIPPINES_SCHEDULE = [
    # ENGINE
    {
        "name": "Engine Oil & Filter",
        "category": "Engine",
        "interval_km": 8000,
        "description": "Replace engine oil and filter (severe driving conditions)",
        "action": "Replace"
    },
    {
        "name": "Drive Belts",
        "category": "Engine",
        "interval_km": 56000,
        "description": "Inspect drive belts for wear and tension",
        "action": "Inspect"
    },

    # COOLING SYSTEM
    {
        "name": "Engine Coolant",
        "category": "Cooling System",
        "interval_km": 192000,  # First replacement at 192,000km
        "description": "Replace coolant (first: 192,000km or 10 years, then every 96,000km or 5 years). Use FL-22 coolant only.",
        "action": "Replace"
    },
    {
        "name": "Engine Coolant Level",
        "category": "Cooling System",
        "interval_km": 8000,
        "description": "Inspect engine coolant level",
        "action": "Inspect"
    },

    # FUEL SYSTEM
    {
        "name": "Air Filter",
        "category": "Fuel System",
        "interval_km": 40000,  # Replace at 40,000km per owner's manual
        "description": "Replace air filter",
        "action": "Replace"
    },
    {
        "name": "Fuel Lines and Hoses",
        "category": "Fuel System",
        "interval_km": 40000,
        "description": "Inspect fuel lines and hoses for leaks or damage",
        "action": "Inspect"
    },
    {
        "name": "Emission Hoses and Tubes",
        "category": "Fuel System",
        "interval_km": 48000,
        "description": "Inspect hoses and tubes for emission system",
        "action": "Inspect"
    },

    # IGNITION SYSTEM
    {
        "name": "Spark Plugs",
        "category": "Ignition System",
        "interval_km": 120000,
        "description": "Replace spark plugs",
        "action": "Replace"
    },

    # ELECTRICAL SYSTEM
    {
        "name": "Function of All Lights",
        "category": "Electrical System",
        "interval_km": 8000,
        "description": "Inspect operation of all lights (headlights, taillights, turn signals, etc.)",
        "action": "Inspect"
    },

    # CHASSIS and BODY
    {
        "name": "Brake Lines, Hoses and Connections",
        "category": "Chassis and Body",
        "interval_km": 32000,
        "description": "Inspect brake lines, hoses and connections for leaks or damage",
        "action": "Inspect"
    },
    {
        "name": "Brake and Clutch Fluid Level",
        "category": "Chassis and Body",
        "interval_km": 8000,
        "description": "Inspect brake and clutch fluid level",
        "action": "Inspect"
    },
    {
        "name": "Disc Brakes",
        "category": "Chassis and Body",
        "interval_km": 16000,
        "description": "Inspect disc brakes for wear and damage",
        "action": "Inspect"
    },
    {
        "name": "Tire Rotation",
        "category": "Chassis and Body",
        "interval_km": 8000,
        "description": "Rotate tires for even wear. Initialize TPMS after rotation.",
        "action": "Service"
    },
    {
        "name": "Tire Inflation Pressure and Tire Wear",
        "category": "Chassis and Body",
        "interval_km": 8000,
        "description": "Check tire pressure and inspect for wear patterns",
        "action": "Inspect"
    },
    {
        "name": "Steering Operation and Linkages",
        "category": "Chassis and Body",
        "interval_km": 32000,
        "description": "Inspect steering operation and linkages",
        "action": "Inspect"
    },
    {
        "name": "Front and Rear Suspension, Ball Joints and Wheel Bearing",
        "category": "Chassis and Body",
        "interval_km": 32000,
        "description": "Inspect suspension components, ball joints and wheel bearing axial play",
        "action": "Inspect"
    },
    {
        "name": "Driveshaft Dust Boots",
        "category": "Chassis and Body",
        "interval_km": 32000,
        "description": "Inspect driveshaft dust boots for damage",
        "action": "Inspect"
    },
    {
        "name": "Bolts and Nuts on Chassis and Body",
        "category": "Chassis and Body",
        "interval_km": 32000,
        "description": "Tighten bolts and nuts on chassis and body",
        "action": "Tighten"
    },
    {
        "name": "Exhaust System and Heat Shields",
        "category": "Chassis and Body",
        "interval_km": 72000,
        "description": "Inspect exhaust system and heat shields (every 72,000km or 5 years)",
        "action": "Inspect"
    },
    {
        "name": "All Locks and Hinges",
        "category": "Chassis and Body",
        "interval_km": 8000,
        "description": "Lubricate all locks and hinges",
        "action": "Lubricate"
    },
    {
        "name": "Washer Fluid Level",
        "category": "Chassis and Body",
        "interval_km": 8000,
        "description": "Check and top up washer fluid level",
        "action": "Inspect"
    },

    # AIR CONDITIONER SYSTEM
    {
        "name": "Cabin Air Filter",
        "category": "Air Conditioner System",
        "interval_km": 40000,
        "description": "Replace cabin air filter (every 40,000km or 2 years)",
        "action": "Replace"
    },
    {
        "name": "Rear Differential Oil",
        "category": "Chassis and Body",
        "interval_km": 48000,
        "description": "Replace rear differential oil (if operated under severe conditions: towing, dusty/wet conditions, extended idling, short trips <16km)",
        "action": "Replace"
    },
    {
        "name": "Transfer Oil",
        "category": "Chassis and Body",
        "interval_km": 48000,
        "description": "Replace transfer oil if submerged in water",
        "action": "Replace"
    }
]

# For severe driving conditions (Philippines), also consider these additional items:
SEVERE_CONDITIONS_NOTES = {
    "rear_differential_oil": "If operated under severe conditions (towing, dusty/wet conditions, extended idling, short trips <16km), replace rear differential oil every 48,000km",
    "transfer_oil": "If submerged in water, replace immediately",
    "tpms_note": "TPMS initialization required after tire rotation if equipped"
}