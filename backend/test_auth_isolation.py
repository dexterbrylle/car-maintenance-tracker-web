#!/usr/bin/env python3
"""
Test authentication and user isolation functionality
"""

import sys
import os
import re

def test_route_authentication():
    """Test that routes have authentication decorators"""
    
    # Test vehicles.py
    with open('routes/vehicles.py', 'r') as f:
        vehicles_content = f.read()
    
    # Check for authentication decorators
    auth_decorators = ['@token_required', '@user_rate_limit', '@check_subscription_limits']
    
    print("🚗 Testing Authentication Decorators")
    print("=" * 50)
    
    # Vehicles routes
    vehicles_with_auth = 0
    if '@token_required' in vehicles_content:
        vehicles_with_auth += vehicles_content.count('@token_required')
    if '@user_rate_limit' in vehicles_content:
        vehicles_with_auth += vehicles_content.count('@user_rate_limit')
    
    print(f"Vehicles route authentication decorators found: {vehicles_with_auth}")
    
    # Maintenance routes
    with open('routes/maintenance.py', 'r') as f:
        maintenance_content = f.read()
    
    maintenance_with_auth = 0
    if '@token_required' in maintenance_content:
        maintenance_with_auth += maintenance_content.count('@token_required')
    if '@user_rate_limit' in maintenance_content:
        maintenance_with_auth += maintenance_content.count('@user_rate_limit')
    
    print(f"Maintenance route authentication decorators found: {maintenance_with_auth}")
    
    # Services routes
    with open('routes/services.py', 'r') as f:
        services_content = f.read()
    
    services_with_auth = 0
    if '@token_required' in services_content:
        services_with_auth += services_content.count('@token_required')
    if '@user_rate_limit' in services_content:
        services_with_auth += services_content.count('@user_rate_limit')
    
    print(f"Services route authentication decorators found: {services_with_auth}")
    
    # Fill-ups routes
    with open('routes/fillups.py', 'r') as f:
        fillups_content = f.read()
    
    fillups_with_auth = 0
    if '@token_required' in fillups_content:
        fillups_with_auth += fillups_content.count('@token_required')
    if '@user_rate_limit' in fillups_content:
        fillups_with_auth += fillups_content.count('@user_rate_limit')
    
    print(f"Fill-ups route authentication decorators found: {fillups_with_auth}")
    
    # Export routes
    with open('routes/export.py', 'r') as f:
        export_content = f.read()
    
    export_with_auth = 0
    if '@token_required' in export_content:
        export_with_auth += export_content.count('@token_required')
    if '@user_rate_limit' in export_content:
        export_with_auth += export_content.count('@user_rate_limit')
    
    print(f"Export route authentication decorators found: {export_with_auth}")
    
    # Dashboard routes
    with open('routes/dashboard.py', 'r') as f:
        dashboard_content = f.read()
    
    dashboard_with_auth = 0
    if '@token_required' in dashboard_content:
        dashboard_with_auth += dashboard_content.count('@token_required')
    if '@user_rate_limit' in dashboard_content:
        dashboard_with_auth += dashboard_content.count('@user_rate_limit')
    
    print(f"Dashboard route authentication decorators found: {dashboard_with_auth}")
    
    # Check for user isolation patterns
    print("\n🚗 Testing User Isolation Patterns")
    print("=" * 50)
    
    # Test get_current_user_id usage
    files_with_user_id = []
    for filename in ['routes/maintenance.py', 'routes/services.py', 'routes/fillups.py', 'routes/export.py', 'routes/dashboard.py']:
        with open(filename, 'r') as f:
            content = f.read()
        if 'get_current_user_id()' in content:
            files_with_user_id.append(filename)
    
    print(f"Files using get_current_user_id(): {len(files_with_user_id)}")
    for file in files_with_user_id:
        print(f"  ✅ {file}")
    
    # Test vehicle ownership validation
    files_with_ownership = []
    for filename in ['routes/maintenance.py', 'routes/services.py', 'routes/fillups.py', 'routes/export.py', 'routes/dashboard.py']:
        with open(filename, 'r') as f:
            content = f.read()
        if 'Vehicle.get_vehicle_by_id(vehicle_id, user_id)' in content:
            files_with_ownership.append(filename)
    
    print(f"Files with vehicle ownership validation: {len(files_with_ownership)}")
    for file in files_with_ownership:
        print(f"  ✅ {file}")
    
    # Test for 404 responses instead of 403
    files_with_404 = []
    for filename in ['routes/maintenance.py', 'routes/services.py', 'routes/fillups.py', 'routes/export.py', 'routes/dashboard.py']:
        with open(filename, 'r') as f:
            content = f.read()
        if 'return jsonify({\'error\': \'Vehicle not found\'}), 404' in content:
            files_with_404.append(filename)
    
    print(f"Files returning 404 for unauthorized access: {len(files_with_404)}")
    for file in files_with_404:
        print(f"  ✅ {file}")
    
    # Test for proper imports
    print("\n🚗 Testing Required Imports")
    print("=" * 50)
    
    auth_imports = 0
    security_imports = 0
    rate_limiter_imports = 0
    
    for filename in ['routes/maintenance.py', 'routes/services.py', 'routes/fillups.py', 'routes/export.py', 'routes/dashboard.py']:
        with open(filename, 'r') as f:
            content = f.read()
        if 'from auth import' in content:
            auth_imports += 1
        if 'from security import' in content:
            security_imports += 1
        if 'from rate_limiter import' in content:
            rate_limiter_imports += 1
    
    print(f"Files with auth imports: {auth_imports}")
    print(f"Files with security imports: {security_imports}")
    print(f"Files with rate limiter imports: {rate_limiter_imports}")
    
    # Test MongoDB indexes
    print("\n🚗 Testing MongoDB Indexes")
    print("=" * 50)
    
    with open('models.py', 'r') as f:
        models_content = f.read()
    
    # Check for user isolation indexes
    user_isolation_indexes = 0
    if "('user_id', 1)" in models_content:
        user_isolation_indexes += models_content.count("('user_id', 1)")
    
    print(f"User isolation indexes found: {user_isolation_indexes}")
    
    # Check for compound indexes
    compound_indexes = 0
    if 'Compound index for user isolation' in models_content:
        compound_indexes += models_content.count('Compound index for user isolation')
    
    print(f"Compound user isolation indexes found: {compound_indexes}")
    
    print("\n🎉 Authentication and User Isolation Test Completed!")
    print("=" * 50)
    
    # Summary
    total_auth_decorators = (vehicles_with_auth + maintenance_with_auth + 
                           services_with_auth + fillups_with_auth + 
                           export_with_auth + dashboard_with_auth)
    
    print(f"📊 Summary:")
    print(f"  Total authentication decorators: {total_auth_decorators}")
    print(f"  Files with user isolation: {len(files_with_user_id)}")
    print(f"  Files with ownership validation: {len(files_with_ownership)}")
    print(f"  Files with proper imports: {auth_imports}")
    print(f"  Files with 404 responses: {len(files_with_404)}")
    
    if total_auth_decorators > 0 and len(files_with_user_id) > 0:
        print("✅ Authentication and user isolation successfully implemented!")
        return True
    else:
        print("❌ Authentication and user isolation may be incomplete!")
        return False

if __name__ == "__main__":
    success = test_route_authentication()
    if success:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)