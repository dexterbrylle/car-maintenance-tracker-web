# Mazda Maintenance Data Sync

This directory contains scripts and data for synchronizing the official Mazda CX-5 2016 maintenance schedule with the database.

## Files

- `mazda_cx5_2016_philippines.py` - Official maintenance schedule data
- `sync_mazda_data.py` - Sync script for updating database
- `README.md` - This documentation

## Usage

### Basic Sync (Dry Run)
```bash
cd backend
python sync_mazda_data.py --dry-run
```

### Live Sync
```bash
cd backend
python sync_mazda_data.py
```

### Force Update Existing Items
```bash
cd backend
python sync_mazda_data.py --force
```

### Update Specific Vehicle
```bash
cd backend
python sync_mazda_data.py --vehicle-id <vehicle_id>
```

## Features

### What the script does:
1. **Identifies eligible vehicles**: Mazda CX-5 2014-2017 models
2. **Compares with current data**: Checks existing maintenance items
3. **Adds missing items**: Adds any missing official maintenance items
4. **Updates existing items**: Updates intervals, descriptions, and actions if `--force` is used
5. **Provides detailed reporting**: Shows exactly what was changed

### Safety features:
- **Dry run mode**: Preview changes without modifying database
- **Selective updates**: Only updates when necessary
- **Validation**: Ensures data integrity
- **Detailed logging**: Shows all changes made

## Schedule Data

The official schedule includes 22 maintenance items across these categories:

- **Engine** (2 items): Oil & filter, drive belts
- **Cooling System** (2 items): Coolant, coolant level
- **Fuel System** (3 items): Air filter, fuel lines, emission hoses
- **Ignition System** (1 item): Spark plugs
- **Electrical System** (1 item): Lights inspection
- **Chassis and Body** (12 items): Brakes, tires, suspension, etc.
- **Air Conditioner System** (1 item): Cabin air filter

### Schedule Highlights:
- **Severe driving conditions**: Optimized for Philippines climate
- **Comprehensive coverage**: All major vehicle systems
- **Official intervals**: Based on Mazda Schedule 2
- **Action types**: Replace, Inspect, Lubricate, Tighten, Service

## Examples

### Example 1: Initial Setup
```bash
# First, check what would be done
python sync_mazda_data.py --dry-run

# Then apply the changes
python sync_mazda_data.py
```

### Example 2: Updating Schedule
If the official schedule changes:
```bash
# Force update all items with new data
python sync_mazda_data.py --force
```

### Example 3: Single Vehicle
```bash
# Update only one vehicle
python sync_mazda_data.py --vehicle-id 507f1f77bcf86cd799439011
```

## Schedule Details

### Key Maintenance Items:
- **Engine Oil & Filter**: Every 8,000 km (Replace)
- **Air Filter**: Every 24,000 km severe conditions (Replace)
- **Tire Rotation**: Every 8,000 km (Service)
- **Cabin Air Filter**: Every 40,000 km (Replace)
- **Spark Plugs**: Every 120,000 km (Replace)
- **Engine Coolant**: First at 192,000 km (Replace)

### Philippines-Specific:
- Optimized for severe driving conditions
- Accounts for hot/humid climate
- Considers traffic congestion and dusty conditions
- Includes extended idling scenarios

## Troubleshooting

### Common Issues:

1. **Import Error**: Make sure you're in the backend directory
   ```bash
   cd backend
   python sync_mazda_data.py
   ```

2. **Database Connection**: Ensure MongoDB is running
   ```bash
   docker-compose up -d mongodb
   ```

3. **Permission Error**: Make sure script is executable
   ```bash
   chmod +x sync_mazda_data.py
   ```

### Getting Help:
```bash
python sync_mazda_data.py --help
```

## Integration with App

The sync script works alongside the automatic vehicle creation system:

1. **New vehicles**: Automatically get maintenance items when created
2. **Existing vehicles**: Use sync script to add missing items
3. **Schedule updates**: Use sync script with `--force` to update intervals

## Data Structure

Each maintenance item includes:
- `name`: Item name (e.g., "Engine Oil & Filter")
- `category`: System category (e.g., "Engine")
- `interval_km`: Maintenance interval in kilometers
- `description`: Detailed description of the service
- `action`: Service type (Replace, Inspect, Lubricate, Tighten, Service)

## Version History

- **v1.0**: Initial implementation with 22 maintenance items
- **v1.1**: Added action types and improved descriptions
- **v1.2**: Added Philippines-specific severe conditions notes