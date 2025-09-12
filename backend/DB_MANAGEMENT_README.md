# Database Management Scripts

This directory contains Python scripts for managing the Car Maintenance Tracker database. These scripts provide utilities for seeding, clearing, and populating the database with test data.

## Scripts Overview

### 1. `db_management.py` - Main Management Script
A comprehensive script with multiple commands for database management.

**Commands:**
- `python db_management.py seed` - Seed database with test data
- `python db_management.py populate` - Populate with service records  
- `python db_management.py clear` - Clear all data but keep collections
- `python db_management.py stats` - Show database statistics

**Examples:**
```bash
# Show database statistics
python db_management.py stats

# Seed database with test data
python db_management.py seed

# Populate with service records
python db_management.py populate

# Clear all data
python db_management.py clear
```

### 2. `seed_database.py` - Seed Database
Creates a complete test dataset including:
- Test user: `test1@gmail.com` / `pass123!`
- 5 sample vehicles (Toyota Vios, Mazda CX-5, Honda Civic, Ford Ranger, Nissan Navara)
- Sample fill-up records for fuel tracking
- Proper multi-tenant architecture with user_id fields

**Usage:**
```bash
python seed_database.py
```

### 3. `populate_service_records.py` - Populate Service Records
Populates the database with service records for all existing vehicles:
- Automatically creates maintenance items based on vehicle type
- Mazda CX-5 2014-2017: Uses official Philippines maintenance schedule
- Other vehicles: Uses generic schedule with lower intervals
- Creates realistic service records based on vehicle mileage
- Updates vehicle mileage to reflect service history

**Usage:**
```bash
python populate_service_records.py
```

### 4. `clear_database.py` - Clear Database
Deletes all documents from collections while preserving the collection structure:
- Clears: users, vehicles, maintenance_items, service_records, fillups, refresh_tokens
- Keeps all collections intact
- Useful for testing and development

**Usage:**
```bash
python clear_database.py
```

## Features

### Multi-Tenant Architecture Support
- All scripts properly handle user isolation
- Documents include `user_id` fields for proper data segregation
- Respects the application's security model

### Vehicle-Specific Maintenance Schedules
- **Mazda CX-5 2014-2017**: Uses official Philippines severe conditions schedule
- **Other vehicles**: Generic schedule with appropriate intervals
- Automatic detection of vehicle make/model/year

### Realistic Test Data
- Service records with appropriate costs and dates
- Fill-up records with fuel economy calculations
- Randomized data within realistic ranges
- Proper odometer progression

### Error Handling
- Comprehensive error handling and logging
- Graceful database connection management
- Clear success/failure feedback

## Requirements

- Python 3.8+
- MongoDB connection (configured via `MONGODB_URI` environment variable)
- Required Python packages: `pymongo`, `python-dotenv`, `bcrypt`

## Environment Variables

The scripts require the same environment variables as the main application:

```bash
MONGODB_URI=mongodb://username:password@host:port/database?authSource=admin
```

## Test Account

After running the seed script, you can use these credentials for testing:

- **Email**: `test1@gmail.com`
- **Password**: `pass123!`
- **Subscription**: Premium tier
- **Vehicles**: 5 sample vehicles with different makes and models

## Usage Examples

### Development Workflow

1. **Start with a clean database:**
   ```bash
   python clear_database.py
   ```

2. **Seed with test data:**
   ```bash
   python seed_database.py
   ```

3. **Populate service records:**
   ```bash
   python populate_service_records.py
   ```

4. **Check database status:**
   ```bash
   python db_management.py stats
   ```

### Testing Different Scenarios

1. **Test with only user and vehicles:**
   ```bash
   python clear_database.py
   python seed_database.py
   ```

2. **Test with full service history:**
   ```bash
   python clear_database.py
   python seed_database.py
   python populate_service_records.py
   ```

3. **Clear and restart:**
   ```bash
   python clear_database.py
   ```

## Database Schema

The scripts work with the following collections:

- **users**: User accounts with authentication data
- **vehicles**: Vehicle information with user ownership
- **maintenance_items**: Maintenance schedule items per vehicle
- **service_records**: Completed service history
- **fillups**: Fuel tracking records with economy calculations
- **refresh_tokens**: JWT refresh tokens for authentication

## Security Notes

- Test user password is properly hashed using bcrypt
- All scripts respect user isolation (multi-tenant architecture)
- No sensitive data is logged or exposed
- Database connections are properly closed after execution

## Integration with Main Application

These scripts use the same:
- Database connection configuration
- Data models and schema
- Authentication system (password hashing)
- Multi-tenant architecture patterns

This ensures consistency between test data and production data structures.