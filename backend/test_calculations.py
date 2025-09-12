#!/usr/bin/env python3
"""
Standalone test for fuel tracking calculation logic.
Tests the core mathematical calculations without any dependencies.
"""

def test_fuel_economy_calculation():
    """Test fuel economy calculation logic"""
    print("🚗 Testing Fuel Economy Calculation Logic")
    print("=" * 50)
    
    def calculate_fuel_economy(current_odometer, previous_odometer, liters, full_tank):
        """Pure fuel economy calculation"""
        if not full_tank or liters <= 0:
            return None
        
        distance = current_odometer - previous_odometer
        if distance <= 0:
            return None
        
        return round(distance / liters, 2)
    
    # Test cases
    test_cases = [
        {
            'name': 'Normal calculation',
            'current': 50000,
            'previous': 49500,
            'liters': 45.5,
            'full_tank': True,
            'expected': 10.99
        },
        {
            'name': 'Not full tank',
            'current': 50000,
            'previous': 49500,
            'liters': 45.5,
            'full_tank': False,
            'expected': None
        },
        {
            'name': 'Zero liters',
            'current': 50000,
            'previous': 49500,
            'liters': 0,
            'full_tank': True,
            'expected': None
        },
        {
            'name': 'Negative distance',
            'current': 49500,
            'previous': 50000,
            'liters': 45.5,
            'full_tank': True,
            'expected': None
        },
        {
            'name': 'Zero distance',
            'current': 50000,
            'previous': 50000,
            'liters': 45.5,
            'full_tank': True,
            'expected': None
        }
    ]
    
    passed = 0
    total = len(test_cases)
    
    for case in test_cases:
        result = calculate_fuel_economy(
            case['current'], case['previous'], case['liters'], case['full_tank']
        )
        
        if result == case['expected']:
            print(f"  ✅ {case['name']}: {result}")
            passed += 1
        else:
            print(f"  ❌ {case['name']}: Expected {case['expected']}, got {result}")
    
    print(f"\nResult: {passed}/{total} tests passed")
    return passed == total

def test_cost_per_km_calculation():
    """Test cost per kilometer calculation logic"""
    print("\n🚗 Testing Cost per KM Calculation Logic")
    print("=" * 50)
    
    def calculate_cost_per_km(distance, total_cost):
        """Pure cost per km calculation"""
        if distance <= 0:
            return None
        
        return round(total_cost / distance, 2)
    
    # Test cases
    test_cases = [
        {
            'name': 'Normal calculation',
            'distance': 500,
            'total_cost': 2661.75,
            'expected': 5.32
        },
        {
            'name': 'Zero distance',
            'distance': 0,
            'total_cost': 2661.75,
            'expected': None
        },
        {
            'name': 'Negative distance',
            'distance': -100,
            'total_cost': 2661.75,
            'expected': None
        },
        {
            'name': 'Zero cost',
            'distance': 500,
            'total_cost': 0,
            'expected': 0.0
        }
    ]
    
    passed = 0
    total = len(test_cases)
    
    for case in test_cases:
        result = calculate_cost_per_km(case['distance'], case['total_cost'])
        
        if result == case['expected']:
            print(f"  ✅ {case['name']}: {result}")
            passed += 1
        else:
            print(f"  ❌ {case['name']}: Expected {case['expected']}, got {result}")
    
    print(f"\nResult: {passed}/{total} tests passed")
    return passed == total

def test_validation_logic():
    """Test data validation logic"""
    print("\n🚗 Testing Data Validation Logic")
    print("=" * 50)
    
    def validate_fillup_data(data):
        """Pure validation logic"""
        errors = []
        
        # Check required fields
        required_fields = ['vehicle_id', 'date', 'odometer_km', 'liters', 'price_per_liter']
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == '':
                errors.append(f'{field} is required')
        
        # Validate odometer
        if 'odometer_km' in data:
            try:
                odometer = float(data['odometer_km'])
                if odometer <= 0:
                    errors.append('Odometer must be greater than 0')
            except (ValueError, TypeError):
                errors.append('Odometer must be a valid number')
        
        # Validate liters
        if 'liters' in data:
            try:
                liters = float(data['liters'])
                if liters <= 0:
                    errors.append('Liters must be greater than 0')
                if liters > 1000:
                    errors.append('Liters must be less than 1000')
            except (ValueError, TypeError):
                errors.append('Liters must be a valid number')
        
        # Validate price per liter
        if 'price_per_liter' in data:
            try:
                price = float(data['price_per_liter'])
                if price <= 0:
                    errors.append('Price per liter must be greater than 0')
                if price > 1000:
                    errors.append('Price per liter must be less than 1000')
            except (ValueError, TypeError):
                errors.append('Price per liter must be a valid number')
        
        return errors[0] if errors else None
    
    # Test cases
    test_cases = [
        {
            'name': 'Valid data',
            'data': {
                'vehicle_id': '507f1f77bcf86cd799439011',
                'date': '2025-01-15',
                'odometer_km': 50000,
                'liters': 45.5,
                'price_per_liter': 58.50
            },
            'expected': None
        },
        {
            'name': 'Missing odometer',
            'data': {
                'vehicle_id': '507f1f77bcf86cd799439011',
                'date': '2025-01-15',
                'liters': 45.5,
                'price_per_liter': 58.50
            },
            'expected': 'odometer_km is required'
        },
        {
            'name': 'Invalid odometer',
            'data': {
                'vehicle_id': '507f1f77bcf86cd799439011',
                'date': '2025-01-15',
                'odometer_km': -100,
                'liters': 45.5,
                'price_per_liter': 58.50
            },
            'expected': 'Odometer must be greater than 0'
        },
        {
            'name': 'Invalid liters',
            'data': {
                'vehicle_id': '507f1f77bcf86cd799439011',
                'date': '2025-01-15',
                'odometer_km': 50000,
                'liters': -10,
                'price_per_liter': 58.50
            },
            'expected': 'Liters must be greater than 0'
        },
        {
            'name': 'Excessive liters',
            'data': {
                'vehicle_id': '507f1f77bcf86cd799439011',
                'date': '2025-01-15',
                'odometer_km': 50000,
                'liters': 1500,
                'price_per_liter': 58.50
            },
            'expected': 'Liters must be less than 1000'
        }
    ]
    
    passed = 0
    total = len(test_cases)
    
    for case in test_cases:
        result = validate_fillup_data(case['data'])
        
        if result == case['expected']:
            print(f"  ✅ {case['name']}: {result}")
            passed += 1
        else:
            print(f"  ❌ {case['name']}: Expected '{case['expected']}', got '{result}'")
    
    print(f"\nResult: {passed}/{total} tests passed")
    return passed == total

def test_efficiency_rating_logic():
    """Test efficiency rating calculation logic"""
    print("\n🚗 Testing Efficiency Rating Logic")
    print("=" * 50)
    
    def calculate_efficiency_rating(avg_fuel_economy, avg_cost_per_km, trend_percent):
        """Pure efficiency rating calculation"""
        rating = 0
        factors = 0
        
        # Rate based on average fuel economy
        if avg_fuel_economy:
            if avg_fuel_economy >= 15:
                rating += 5
            elif avg_fuel_economy >= 12:
                rating += 4
            elif avg_fuel_economy >= 10:
                rating += 3
            elif avg_fuel_economy >= 8:
                rating += 2
            else:
                rating += 1
            factors += 1
        
        # Rate based on cost per km
        if avg_cost_per_km:
            if avg_cost_per_km <= 5:
                rating += 5
            elif avg_cost_per_km <= 7:
                rating += 4
            elif avg_cost_per_km <= 10:
                rating += 3
            elif avg_cost_per_km <= 12:
                rating += 2
            else:
                rating += 1
            factors += 1
        
        # Rate based on trend
        if trend_percent is not None:
            if trend_percent > 5:
                rating += 5
            elif trend_percent > -5:
                rating += 4
            elif trend_percent > -10:
                rating += 3
            elif trend_percent > -15:
                rating += 2
            else:
                rating += 1
            factors += 1
        
        # Calculate overall rating
        if factors > 0:
            overall_rating = round(rating / factors)
        else:
            overall_rating = 3
        
        return overall_rating
    
    # Test cases
    test_cases = [
        {
            'name': 'Excellent performance',
            'avg_fuel_economy': 16.5,
            'avg_cost_per_km': 4.8,
            'trend_percent': 8.0,
            'expected': 5
        },
        {
            'name': 'Good performance',
            'avg_fuel_economy': 13.0,
            'avg_cost_per_km': 6.5,
            'trend_percent': 2.0,
            'expected': 4
        },
        {
            'name': 'Average performance',
            'avg_fuel_economy': 11.0,
            'avg_cost_per_km': 9.0,
            'trend_percent': 0.0,
            'expected': 3
        },
        {
            'name': 'Poor performance',
            'avg_fuel_economy': 8.5,
            'avg_cost_per_km': 11.5,
            'trend_percent': -8.0,
            'expected': 2
        },
        {
            'name': 'Very poor performance',
            'avg_fuel_economy': 6.0,
            'avg_cost_per_km': 14.0,
            'trend_percent': -20.0,
            'expected': 1
        }
    ]
    
    passed = 0
    total = len(test_cases)
    
    for case in test_cases:
        result = calculate_efficiency_rating(
            case['avg_fuel_economy'], case['avg_cost_per_km'], case['trend_percent']
        )
        
        if result == case['expected']:
            print(f"  ✅ {case['name']}: {result}/5")
            passed += 1
        else:
            print(f"  ❌ {case['name']}: Expected {case['expected']}, got {result}")
    
    print(f"\nResult: {passed}/{total} tests passed")
    return passed == total

def test_fuel_stats_calculation():
    """Test fuel statistics calculation logic"""
    print("\n🚗 Testing Fuel Statistics Calculation Logic")
    print("=" * 50)
    
    def calculate_fuel_stats(fillups):
        """Pure fuel statistics calculation"""
        if not fillups:
            return None
        
        economies = [f['fuel_economy_kmpl'] for f in fillups if f.get('fuel_economy_kmpl')]
        costs_per_km = [f['cost_per_km'] for f in fillups if f.get('cost_per_km')]
        
        stats = {
            'avg_fuel_economy': round(sum(economies) / len(economies), 2) if economies else None,
            'best_fuel_economy': max(economies) if economies else None,
            'worst_fuel_economy': min(economies) if economies else None,
            'avg_cost_per_km': round(sum(costs_per_km) / len(costs_per_km), 2) if costs_per_km else None,
            'total_fillups': len(fillups)
        }
        
        return stats
    
    # Test cases
    test_cases = [
        {
            'name': 'Multiple fill-ups with full data',
            'fillups': [
                {'fuel_economy_kmpl': 10.5, 'cost_per_km': 5.5},
                {'fuel_economy_kmpl': 11.2, 'cost_per_km': 5.2},
                {'fuel_economy_kmpl': 9.8, 'cost_per_km': 5.8},
                {'fuel_economy_kmpl': 10.9, 'cost_per_km': 5.3}
            ],
            'expected': {
                'avg_fuel_economy': 10.6,
                'best_fuel_economy': 11.2,
                'worst_fuel_economy': 9.8,
                'avg_cost_per_km': 5.45,
                'total_fillups': 4
            }
        },
        {
            'name': 'Empty fill-ups list',
            'fillups': [],
            'expected': None
        },
        {
            'name': 'Fill-ups without calculated fields',
            'fillups': [
                {'odometer_km': 50000, 'liters': 45.5},
                {'odometer_km': 50500, 'liters': 44.0}
            ],
            'expected': {
                'avg_fuel_economy': None,
                'best_fuel_economy': None,
                'worst_fuel_economy': None,
                'avg_cost_per_km': None,
                'total_fillups': 2
            }
        }
    ]
    
    passed = 0
    total = len(test_cases)
    
    for case in test_cases:
        result = calculate_fuel_stats(case['fillups'])
        
        if result == case['expected']:
            print(f"  ✅ {case['name']}: {result}")
            passed += 1
        else:
            print(f"  ❌ {case['name']}: Expected {case['expected']}, got {result}")
    
    print(f"\nResult: {passed}/{total} tests passed")
    return passed == total

def main():
    """Run all tests"""
    print("🚗 Car Maintenance Tracker - Fuel Tracking Calculation Tests")
    print("=" * 60)
    
    tests = [
        test_fuel_economy_calculation,
        test_cost_per_km_calculation,
        test_validation_logic,
        test_efficiency_rating_logic,
        test_fuel_stats_calculation
    ]
    
    passed_tests = 0
    total_tests = len(tests)
    
    for test in tests:
        if test():
            passed_tests += 1
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"Tests passed: {passed_tests}/{total_tests}")
    
    if passed_tests == total_tests:
        print("🎉 All calculation logic tests passed!")
        return 0
    else:
        print(f"❌ {total_tests - passed_tests} test(s) failed!")
        return 1

if __name__ == '__main__':
    exit(main())