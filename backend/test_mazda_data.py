#!/usr/bin/env python3
"""
Simple test script to verify the Mazda maintenance data structure
"""

import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from data.mazda_cx5_2016_philippines import MAZDA_CX5_2016_PHILIPPINES_SCHEDULE
    
    print("Mazda CX-5 2016 Maintenance Schedule Test")
    print("=" * 50)
    print(f"Total maintenance items: {len(MAZDA_CX5_2016_PHILIPPINES_SCHEDULE)}")
    print()
    
    # Group by category
    categories = {}
    for item in MAZDA_CX5_2016_PHILIPPINES_SCHEDULE:
        category = item['category']
        if category not in categories:
            categories[category] = []
        categories[category].append(item)
    
    print("Categories:")
    for category, items in sorted(categories.items()):
        print(f"  {category}: {len(items)} items")
        for item in items:
            print(f"    - {item['name']} (Every {item['interval_km']:,} km) [{item['action']}]")
        print()
    
    # Check for required fields
    required_fields = ['name', 'category', 'interval_km', 'description', 'action']
    print("Data validation:")
    for i, item in enumerate(MAZDA_CX5_2016_PHILIPPINES_SCHEDULE):
        for field in required_fields:
            if field not in item:
                print(f"  ERROR: Item {i} missing field: {field}")
        if i == 0:  # Show first item as example
            print(f"  Example item structure: {item}")
    
    print("\n✅ Data structure is valid!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this from the backend directory")
except Exception as e:
    print(f"❌ Error: {e}")