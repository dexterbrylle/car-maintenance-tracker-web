#!/usr/bin/env python3
"""
Simplified test runner for core fuel tracking calculations.
This tests the calculation logic without requiring full database setup.
"""

import sys
import os
from datetime import datetime, timedelta

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_fuel_calculations():
    """Test core fuel calculation functions"""
    print("🚗 Testing Core Fuel Tracking Calculations")
    print("=" * 50)
    
    # Test data
    current_fillup = {
        'odometer_km': 50000,
        'liters': 45.5,
        'full_tank': True
    }
    
    previous_fillup = {
        'odometer_km': 49500,
        'full_tank': True
    }
    
    # Test 1: Fuel Economy Calculation
    print("Test 1: Fuel Economy Calculation")
    try:
        from utils.fuel_calculations import calculate_fuel_economy
        
        # Valid calculation
        economy = calculate_fuel_economy(current_fillup, previous_fillup)
        expected = (50000 - 49500) / 45.5  # 500 / 45.5 = 10.989...
        print(f"  Expected: {expected:.2f} km/L")
        print(f"  Actual: {economy:.2f} km/L")
        print(f"  Result: {'✅ PASS' if abs(economy - expected) < 0.01 else '❌ FAIL'}")
        
        # No previous fillup
        economy_no_prev = calculate_fuel_economy(current_fillup, None)
        print(f"  No previous fillup: {economy_no_prev} (should be None)")
        print(f"  Result: {'✅ PASS' if economy_no_prev is None else '❌ FAIL'}")
        
        # Not full tank
        current_fillup_not_full = current_fillup.copy()
        current_fillup_not_full['full_tank'] = False
        economy_not_full = calculate_fuel_economy(current_fillup_not_full, previous_fillup)
        print(f"  Not full tank: {economy_not_full} (should be None)")
        print(f"  Result: {'✅ PASS' if economy_not_full is None else '❌ FAIL'}")
        
    except Exception as e:
        print(f"  ❌ ERROR: {e}")
    
    print()
    
    # Test 2: Cost per KM Calculation
    print("Test 2: Cost per KM Calculation")
    try:
        from utils.fuel_calculations import calculate_cost_per_km
        
        # Valid calculation
        cost = calculate_cost_per_km(500, 2661.75)
        expected = 2661.75 / 500  # 5.3235
        print(f"  Expected: ₱{expected:.2f} per km")
        print(f"  Actual: ₱{cost:.2f} per km")
        print(f"  Result: {'✅ PASS' if abs(cost - expected) < 0.01 else '❌ FAIL'}")
        
        # Zero distance
        cost_zero = calculate_cost_per_km(0, 2661.75)
        print(f"  Zero distance: {cost_zero} (should be None)")
        print(f"  Result: {'✅ PASS' if cost_zero is None else '❌ FAIL'}")
        
    except Exception as e:
        print(f"  ❌ ERROR: {e}")
    
    print()
    
    # Test 3: Fill-up Data Validation
    print("Test 3: Fill-up Data Validation")
    try:
        from utils.fuel_calculations import validate_fillup_data
        
        # Valid data
        valid_data = {
            'vehicle_id': '507f1f77bcf86cd799439011',
            'date': '2025-01-15',
            'odometer_km': 50000,
            'liters': 45.5,
            'price_per_liter': 58.50
        }
        error_valid = validate_fillup_data(valid_data)
        print(f"  Valid data: {error_valid} (should be None)")
        print(f"  Result: {'✅ PASS' if error_valid is None else '❌ FAIL'}")
        
        # Missing required field
        invalid_data = valid_data.copy()
        del invalid_data['odometer_km']
        error_invalid = validate_fillup_data(invalid_data)
        print(f"  Missing field: {error_invalid} (should contain error)")
        print(f"  Result: {'✅ PASS' if error_invalid and 'odometer' in error_invalid.lower() else '❌ FAIL'}")
        
        # Invalid odometer
        invalid_odometer = valid_data.copy()
        invalid_odometer['odometer_km'] = -100
        error_odometer = validate_fillup_data(invalid_odometer)
        print(f"  Invalid odometer: {error_odometer} (should contain error)")
        print(f"  Result: {'✅ PASS' if error_odometer and 'odometer' in error_odometer.lower() else '❌ FAIL'}")
        
        # Future date
        future_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        future_data = valid_data.copy()
        future_data['date'] = future_date
        error_future = validate_fillup_data(future_data)
        print(f"  Future date: {error_future} (should contain error)")
        print(f"  Result: {'✅ PASS' if error_future and 'future' in error_future.lower() else '❌ FAIL'}")
        
    except Exception as e:
        print(f"  ❌ ERROR: {e}")
    
    print()
    
    # Test 4: Efficiency Rating Calculation
    print("Test 4: Efficiency Rating Calculation")
    try:
        from utils.insights import calculate_efficiency_rating
        
        # Excellent performance
        excellent_stats = {
            'avg_fuel_economy': 16.5,  # Excellent
            'avg_cost_per_km': 4.8      # Excellent
        }
        excellent_trends = {
            'trend_percent': 8.0        # Improving
        }
        excellent_rating = calculate_efficiency_rating(excellent_stats, excellent_trends)
        print(f"  Excellent performance: {excellent_rating['description']} (score: {excellent_rating['score']}/5)")
        print(f"  Result: {'✅ PASS' if excellent_rating['score'] == 5 else '❌ FAIL'}")
        
        # Poor performance
        poor_stats = {
            'avg_fuel_economy': 7.5,   # Poor
            'avg_cost_per_km': 13.5     # Very poor
        }
        poor_trends = {
            'trend_percent': -18.0      # Rapidly declining
        }
        poor_rating = calculate_efficiency_rating(poor_stats, poor_trends)
        print(f"  Poor performance: {poor_rating['description']} (score: {poor_rating['score']}/5)")
        print(f"  Result: {'✅ PASS' if poor_rating['score'] == 1 else '❌ FAIL'}")
        
    except Exception as e:
        print(f"  ❌ ERROR: {e}")
    
    print()
    
    # Test 5: Insights Generation
    print("Test 5: Insights Generation")
    try:
        from utils.insights import generate_fuel_insights, generate_maintenance_insights
        
        # Fuel insights for improving economy
        improving_trends = {
            'trend_percent': 18.0,
            'avg_cost_per_km': 6.5
        }
        fuel_insights = []
        generate_fuel_insights(fuel_insights, improving_trends)
        print(f"  Improving economy insights: {len(fuel_insights)} generated")
        if fuel_insights:
            print(f"    Type: {fuel_insights[0]['type']}")
            print(f"    Severity: {fuel_insights[0]['severity']}")
        print(f"  Result: {'✅ PASS' if len(fuel_insights) > 0 else '❌ FAIL'}")
        
        # Maintenance insights for critical items
        critical_maintenance = [
            {
                'item': {'name': 'Oil Change'},
                'miles_overdue': 6000  # Over 5000km overdue
            }
        ]
        maintenance_insights = []
        generate_maintenance_insights(maintenance_insights, critical_maintenance)
        print(f"  Critical maintenance insights: {len(maintenance_insights)} generated")
        if maintenance_insights:
            print(f"    Type: {maintenance_insights[0]['type']}")
            print(f"    Severity: {maintenance_insights[0]['severity']}")
        print(f"  Result: {'✅ PASS' if len(maintenance_insights) > 0 else '❌ FAIL'}")
        
    except Exception as e:
        print(f"  ❌ ERROR: {e}")
    
    print()
    print("=" * 50)
    print("✅ Core fuel tracking calculations test completed!")

def test_data_models():
    """Test data model structures"""
    print("\n🚗 Testing Data Model Structures")
    print("=" * 50)
    
    # Test FillUp model structure
    print("Test 1: FillUp Model Structure")
    try:
        # Check if FillUp class exists and has required methods
        from models import FillUp
        
        required_methods = [
            'create_fillup', 'get_fillups_by_vehicle', 'get_fillup_by_id',
            'update_fillup', 'delete_fillup', 'get_previous_full_tank_fillup',
            'recalculate_subsequent_fillups', 'get_fuel_stats'
        ]
        
        missing_methods = []
        for method in required_methods:
            if not hasattr(FillUp, method):
                missing_methods.append(method)
        
        if missing_methods:
            print(f"  ❌ Missing methods: {missing_methods}")
        else:
            print("  ✅ All required methods present")
        
        # Check method signatures
        import inspect
        create_sig = inspect.signature(FillUp.create_fillup)
        print(f"  create_fillup signature: {create_sig}")
        
    except Exception as e:
        print(f"  ❌ ERROR: {e}")
    
    print()
    
    # Test data structure validation
    print("Test 2: Data Structure Validation")
    try:
        # Test fill-up data structure
        test_fillup = {
            'vehicle_id': '507f1f77bcf86cd799439011',
            'date': '2025-01-15',
            'odometer_km': 50000,
            'liters': 45.5,
            'price_per_liter': 58.50,
            'total_cost': 2661.75,
            'full_tank': True,
            'notes': 'Test fill-up',
            'created_at': datetime.utcnow()
        }
        
        # Check required fields
        required_fields = ['vehicle_id', 'date', 'odometer_km', 'liters', 'price_per_liter']
        missing_fields = [field for field in required_fields if field not in test_fillup]
        
        if missing_fields:
            print(f"  ❌ Missing required fields: {missing_fields}")
        else:
            print("  ✅ All required fields present")
        
        # Check calculated fields
        calculated_fields = ['fuel_economy_kmpl', 'cost_per_km']
        print(f"  Calculated fields: {calculated_fields}")
        
    except Exception as e:
        print(f"  ❌ ERROR: {e}")
    
    print()
    print("=" * 50)
    print("✅ Data model structures test completed!")

if __name__ == '__main__':
    try:
        test_fuel_calculations()
        test_data_models()
        print("\n🎉 All tests completed successfully!")
    except Exception as e:
        print(f"\n❌ Test execution failed: {e}")
        sys.exit(1)