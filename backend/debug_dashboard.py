#!/usr/bin/env python3
"""Test script to identify ObjectId serialization issues in dashboard"""

import sys
import os
sys.path.append('.')

from bson.objectid import ObjectId
from datetime import datetime
from utils.insights import generate_insights, predict_maintenance_needs, get_fuel_performance_summary
from utils.fuel_calculations import get_fuel_performance_trends, calculate_monthly_fuel_cost
from models import Vehicle, MaintenanceItem, ServiceRecord, FillUp

def test_object_id_serialization():
    """Test each component for ObjectId serialization issues"""
    vehicle_id = "68c3e0c227f1eb5ab8e28924"
    
    print("Testing ObjectId serialization in dashboard components...")
    
    # Test 1: Vehicle model
    print("\n1. Testing Vehicle model...")
    try:
        vehicle = Vehicle.get_vehicle_by_id(vehicle_id, "68c3db4227f1eb5ab8e28917")
        if vehicle:
            print(f"Vehicle raw data: {vehicle}")
            print(f"Vehicle _id type: {type(vehicle.get('_id'))}")
        else:
            print("Vehicle not found")
    except Exception as e:
        print(f"Vehicle model error: {e}")
    
    # Test 2: Maintenance items
    print("\n2. Testing Maintenance items...")
    try:
        maintenance_items = MaintenanceItem.get_maintenance_items_by_vehicle(vehicle_id)
        if maintenance_items:
            print(f"Maintenance items count: {len(maintenance_items)}")
            print(f"First item _id type: {type(maintenance_items[0].get('_id'))}")
        else:
            print("No maintenance items found")
    except Exception as e:
        print(f"Maintenance items error: {e}")
    
    # Test 3: Service records
    print("\n3. Testing Service records...")
    try:
        service_records = ServiceRecord.get_service_records_by_vehicle(vehicle_id)
        if service_records:
            print(f"Service records count: {len(service_records)}")
            print(f"First record _id type: {type(service_records[0].get('_id'))}")
        else:
            print("No service records found")
    except Exception as e:
        print(f"Service records error: {e}")
    
    # Test 4: FillUp data
    print("\n4. Testing FillUp data...")
    try:
        fillups = FillUp.get_fillups_by_vehicle(vehicle_id, limit=5)
        if fillups:
            print(f"Fillups count: {len(fillups)}")
            print(f"First fillup _id type: {type(fillups[0].get('_id'))}")
        else:
            print("No fillups found")
    except Exception as e:
        print(f"FillUp error: {e}")
    
    # Test 5: Fuel stats
    print("\n5. Testing fuel stats...")
    try:
        fuel_stats = FillUp.get_fuel_stats(vehicle_id)
        if fuel_stats:
            print(f"Fuel stats: {fuel_stats}")
            if fuel_stats.get('last_fillup_date'):
                print(f"Last fillup date type: {type(fuel_stats.get('last_fillup_date'))}")
        else:
            print("No fuel stats found")
    except Exception as e:
        print(f"Fuel stats error: {e}")
    
    # Test 6: Fuel calculations
    print("\n6. Testing fuel calculations...")
    try:
        trends = get_fuel_performance_trends(vehicle_id)
        if trends:
            print(f"Fuel trends: {trends}")
        else:
            print("No fuel trends found")
    except Exception as e:
        print(f"Fuel trends error: {e}")
    
    # Test 7: Monthly fuel cost
    print("\n7. Testing monthly fuel cost...")
    try:
        monthly_costs = calculate_monthly_fuel_cost(vehicle_id, months=1)
        if monthly_costs:
            print(f"Monthly costs: {monthly_costs}")
        else:
            print("No monthly costs found")
    except Exception as e:
        print(f"Monthly fuel cost error: {e}")
    
    # Test 8: Insights
    print("\n8. Testing insights...")
    try:
        insights = generate_insights(vehicle_id)
        print(f"Insights: {insights}")
    except Exception as e:
        print(f"Insights error: {e}")
    
    # Test 9: Predictions
    print("\n9. Testing predictions...")
    try:
        predictions = predict_maintenance_needs(vehicle_id)
        print(f"Predictions: {predictions}")
    except Exception as e:
        print(f"Predictions error: {e}")
    
    # Test 10: Fuel performance summary
    print("\n10. Testing fuel performance summary...")
    try:
        summary = get_fuel_performance_summary(vehicle_id)
        print(f"Summary: {summary}")
    except Exception as e:
        print(f"Fuel performance summary error: {e}")

if __name__ == "__main__":
    test_object_id_serialization()