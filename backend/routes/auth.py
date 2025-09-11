from flask import Blueprint, request, jsonify
from models import User, RefreshToken
from auth import (
    create_access_token, create_refresh_token, 
    verify_jwt_token, get_current_user, get_current_user_id
)
from rate_limiter import (
    register_rate_limit, login_attempts_rate_limit, 
    password_reset_rate_limit, user_rate_limit
)
import re
from datetime import datetime, timedelta

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
@register_rate_limit()
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create user
        user_id = User.create_user(data)
        
        # Get user data (without sensitive fields)
        user = User.get_user_by_id(user_id)
        
        # Create tokens
        access_token = create_access_token(user_id)
        refresh_token = RefreshToken.create_refresh_token(user_id)
        
        # TODO: Send verification email
        # In a real implementation, you would send an email with the verification link
        verification_link = f"{request.host_url}verify-email?token={user['verification_token']}&user_id={user_id}"
        
        return jsonify({
            'message': 'User registered successfully. Please check your email for verification.',
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'first_name': user['first_name'],
                'last_name': user['last_name'],
                'subscription_tier': user['subscription_tier'],
                'is_verified': user['is_verified'],
                'preferences': user['preferences']
            },
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer'
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Registration failed'}), 500

@bp.route('/login', methods=['POST'])
@login_attempts_rate_limit()
def login():
    """User login"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Authenticate user
        user = User.authenticate_user(data['email'], data['password'])
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create tokens
        access_token = create_access_token(str(user['_id']))
        refresh_token = RefreshToken.create_refresh_token(str(user['_id']))
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'first_name': user['first_name'],
                'last_name': user['last_name'],
                'subscription_tier': user['subscription_tier'],
                'is_verified': user['is_verified'],
                'preferences': user['preferences']
            },
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer'
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Login failed'}), 500

@bp.route('/refresh', methods=['POST'])
def refresh():
    """Refresh access token"""
    try:
        data = request.get_json()
        refresh_token = data.get('refresh_token')
        
        if not refresh_token:
            return jsonify({'error': 'Refresh token is required'}), 400
        
        # Refresh access token
        new_access_token, error = refresh_access_token(refresh_token)
        
        if error:
            return jsonify(error), 401
        
        return jsonify({
            'access_token': new_access_token,
            'token_type': 'Bearer'
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Token refresh failed'}), 500

@bp.route('/logout', methods=['POST'])
@user_rate_limit(limit=10, window_seconds=60)
def logout():
    """User logout"""
    try:
        data = request.get_json()
        refresh_token = data.get('refresh_token')
        
        if refresh_token:
            # Revoke refresh token
            RefreshToken.revoke_refresh_token(refresh_token)
        
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Logout failed'}), 500

@bp.route('/logout-all', methods=['POST'])
@user_rate_limit(limit=5, window_seconds=60)
def logout_all():
    """Logout from all devices"""
    try:
        # Get current user
        user_id = get_current_user_id()
        
        if user_id:
            # Revoke all refresh tokens for user
            RefreshToken.revoke_all_user_tokens(user_id)
        
        return jsonify({'message': 'Logged out from all devices'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Logout failed'}), 500

@bp.route('/forgot-password', methods=['POST'])
@password_reset_rate_limit()
def forgot_password():
    """Request password reset"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Find user by email
        user = User.get_user_by_email(email)
        
        if user:
            # Generate password reset token
            reset_token = User.set_password_reset_token(str(user['_id']))
            
            if reset_token:
                # TODO: Send password reset email
                # In a real implementation, you would send an email with the reset link
                reset_link = f"{request.host_url}reset-password?token={reset_token}&user_id={str(user['_id'])}"
                
                return jsonify({
                    'message': 'Password reset email sent if account exists',
                    'reset_link': reset_link  # Remove this in production
                }), 200
        else:
            # Don't reveal whether the email exists
            return jsonify({
                'message': 'Password reset email sent if account exists'
            }), 200
        
    except Exception as e:
        return jsonify({'error': 'Password reset request failed'}), 500

@bp.route('/reset-password', methods=['POST'])
@password_reset_rate_limit()
def reset_password():
    """Reset password"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'token', 'new_password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        user_id = data['user_id']
        token = data['token']
        new_password = data['new_password']
        
        # Verify token by checking user
        user = User.get_user_by_id(user_id)
        if not user or user.get('password_reset_token') != token:
            return jsonify({'error': 'Invalid or expired reset token'}), 400
        
        # Check token expiration
        if user.get('password_reset_expires') and user['password_reset_expires'] < datetime.utcnow():
            return jsonify({'error': 'Reset token has expired'}), 400
        
        # Reset password
        success = User.reset_password(user_id, new_password)
        
        if success:
            return jsonify({'message': 'Password reset successful'}), 200
        else:
            return jsonify({'error': 'Password reset failed'}), 500
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Password reset failed'}), 500

@bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify email address"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'token']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        user_id = data['user_id']
        token = data['token']
        
        # Verify email
        success = User.verify_email(user_id, token)
        
        if success:
            return jsonify({'message': 'Email verified successfully'}), 200
        else:
            return jsonify({'error': 'Invalid verification token'}), 400
        
    except Exception as e:
        return jsonify({'error': 'Email verification failed'}), 500

@bp.route('/resend-verification', methods=['POST'])
@user_rate_limit(limit=2, window_seconds=3600)
def resend_verification():
    """Resend verification email"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Find user by email
        user = User.get_user_by_email(email)
        
        if user and not user.get('is_verified', False):
            # Generate new verification token
            # In a real implementation, you would update the user's verification token
            
            # TODO: Send verification email
            verification_link = f"{request.host_url}verify-email?token={user['verification_token']}&user_id={str(user['_id'])}"
            
            return jsonify({
                'message': 'Verification email resent',
                'verification_link': verification_link  # Remove this in production
            }), 200
        else:
            return jsonify({'message': 'If your email exists and is not verified, you will receive a verification email'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to resend verification email'}), 500

@bp.route('/profile', methods=['GET'])
@user_rate_limit(limit=30, window_seconds=60)
def get_profile():
    """Get user profile"""
    try:
        # Get current user
        user = get_current_user()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'first_name': user['first_name'],
                'last_name': user['last_name'],
                'subscription_tier': user['subscription_tier'],
                'subscription_expires': user['subscription_expires'],
                'is_verified': user['is_verified'],
                'is_active': user['is_active'],
                'preferences': user['preferences'],
                'created_at': user['created_at'],
                'last_login': user['last_login']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get profile'}), 500

@bp.route('/profile', methods=['PUT'])
@user_rate_limit(limit=10, window_seconds=60)
def update_profile():
    """Update user profile"""
    try:
        # Get current user
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update user profile
        success = User.update_user(user_id, data)
        
        if success:
            # Get updated user data
            user = User.get_user_by_id(user_id)
            
            return jsonify({
                'message': 'Profile updated successfully',
                'user': {
                    'id': str(user['_id']),
                    'email': user['email'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'subscription_tier': user['subscription_tier'],
                    'is_verified': user['is_verified'],
                    'preferences': user['preferences']
                }
            }), 200
        else:
            return jsonify({'error': 'No changes made'}), 400
        
    except Exception as e:
        return jsonify({'error': 'Failed to update profile'}), 500

@bp.route('/change-password', methods=['POST'])
@user_rate_limit(limit=5, window_seconds=300)
def change_password():
    """Change user password"""
    try:
        # Get current user
        user_id = get_current_user_id()
        
        if not user_id:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        required_fields = ['current_password', 'new_password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Verify current password
        user = User.get_user_by_id(user_id)
        from werkzeug.security import check_password_hash
        
        if not check_password_hash(user['password_hash'], data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Change password
        success = User.reset_password(user_id, data['new_password'])
        
        if success:
            return jsonify({'message': 'Password changed successfully'}), 200
        else:
            return jsonify({'error': 'Failed to change password'}), 500
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to change password'}), 500

@bp.route('/subscription', methods=['GET'])
@user_rate_limit(limit=30, window_seconds=60)
def get_subscription():
    """Get user subscription information"""
    try:
        # Get current user
        user = get_current_user()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get subscription limits
        limits = User.check_subscription_limits(user)
        
        # Count current usage
        from models import Vehicle, ServiceRecord, FillUp
        
        user_vehicles = Vehicle.get_all_vehicles(str(user['_id']))
        total_vehicles = len(user_vehicles)
        
        total_records = 0
        for vehicle in user_vehicles:
            service_records = ServiceRecord.get_service_records_by_vehicle(str(vehicle['_id']))
            fillup_records = FillUp.get_fillups_by_vehicle(str(vehicle['_id']))
            total_records += len(service_records) + len(fillup_records)
        
        return jsonify({
            'subscription': {
                'tier': user['subscription_tier'],
                'expires': user['subscription_expires'],
                'limits': limits,
                'usage': {
                    'vehicles': total_vehicles,
                    'records': total_records
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get subscription info'}), 500

@bp.route('/check-auth', methods=['GET'])
@user_rate_limit(limit=60, window_seconds=60)
def check_auth():
    """Check if user is authenticated"""
    try:
        user = get_current_user()
        
        if user:
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': str(user['_id']),
                    'email': user['email'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'subscription_tier': user['subscription_tier'],
                    'is_verified': user['is_verified']
                }
            }), 200
        else:
            return jsonify({'authenticated': False}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to check authentication'}), 500