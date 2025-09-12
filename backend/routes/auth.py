from flask import Blueprint, request, jsonify
from models import User, RefreshToken, db
from auth import (
    create_access_token, create_refresh_token,
    verify_jwt_token, get_current_user, get_current_user_id,
    refresh_access_token, serialize_user
)
from rate_limiter import (
    register_rate_limit, login_attempts_rate_limit,
    password_reset_rate_limit, user_rate_limit, refresh_token_rate_limit
)
from bson.objectid import ObjectId
import re
from datetime import datetime, timedelta

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
@register_rate_limit()
def register():
    """Register a new user"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'message': 'Invalid request format. Please send JSON data.',
                'error_code': 'INVALID_REQUEST',
                'details': {}
            }), 400

        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        missing_fields = [field for field in required_fields if not data.get(field)]

        if missing_fields:
            return jsonify({
                'message': f'Please provide: {', '.join(missing_fields)}',
                'error_code': 'VALIDATION_ERROR',
                'details': {field: 'Field is required' for field in missing_fields}
            }), 400

        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            return jsonify({
                'message': 'Please enter a valid email address',
                'error_code': 'VALIDATION_ERROR',
                'details': {
                    'email': ['Must be a valid email address']
                }
            }), 400

        # Create user
        user_id = User.create_user(data)

        # Get full user data for verification token
        full_user = db.users.find_one({'_id': ObjectId(user_id)})
        
        # Get user data (without sensitive fields) 
        user = User.get_user_by_id(user_id)

        # Create tokens
        access_token = create_access_token(user_id)
        refresh_token = RefreshToken.create_refresh_token(user_id)

        # TODO: Send verification email
        # In a real implementation, you would send an email with the verification link
        verification_link = f"{request.host_url}verify-email?token={full_user['verification_token']}&user_id={user_id}"

        # Serialize user data for JSON response
        serialized_user = serialize_user(user)

        return jsonify({
            'message': 'User registered successfully. Please check your email for verification.',
            'user': serialized_user,
            'tokens': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'expires_in': 3600,  # 1 hour in seconds
                'token_type': 'Bearer'
            }
        }), 201

    except ValueError as e:
        return jsonify({
            'message': str(e),
            'error_code': 'VALIDATION_ERROR',
            'details': {}
        }), 400
    except Exception as e:
        return jsonify({
            'message': 'Unable to create your account. Please try again later.',
            'error_code': 'REGISTRATION_FAILED',
            'details': {}
        }), 500

@bp.route('/login', methods=['POST'])
@login_attempts_rate_limit()
def login():
    """User login"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'message': 'Invalid request format. Please send JSON data.',
                'error_code': 'INVALID_REQUEST',
                'details': {}
            }), 400

        # Validate required fields
        missing_fields = []
        if not data.get('email'):
            missing_fields.append('email')
        if not data.get('password'):
            missing_fields.append('password')

        if missing_fields:
            return jsonify({
                'message': f'Please provide: {', '.join(missing_fields)}',
                'error_code': 'VALIDATION_ERROR',
                'details': {field: 'Field is required' for field in missing_fields}
            }), 400

        # Authenticate user
        user = User.authenticate_user(data['email'], data['password'])

        if not user:
            return jsonify({
                'message': 'Invalid email or password. Please try again.',
                'error_code': 'INVALID_CREDENTIALS',
                'details': {}
            }), 401

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
            'tokens': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'expires_in': 3600,  # 1 hour in seconds
                'token_type': 'Bearer'
            }
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Unable to process your login. Please try again later.',
            'error_code': 'LOGIN_FAILED',
            'details': {}
        }), 500

@bp.route('/refresh', methods=['POST'])
@bp.route('/refresh-token', methods=['POST'])  # Alias for frontend compatibility
@refresh_token_rate_limit()
def refresh():
    """Refresh access token"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'message': 'Invalid request format. Please send JSON data.',
                'error_code': 'INVALID_REQUEST',
                'details': {}
            }), 400

        refresh_token = data.get('refresh_token')

        if not refresh_token:
            return jsonify({
                'message': 'Refresh token is required',
                'error_code': 'VALIDATION_ERROR',
                'details': {
                    'refresh_token': ['Field is required']
                }
            }), 400

        # Refresh access token
        new_access_token, error = refresh_access_token(refresh_token)

        if error:
            return jsonify({
                'message': error.get('message', 'Unable to refresh your session. Please log in again.'),
                'error_code': error.get('code', 'TOKEN_REFRESH_FAILED'),
                'details': {}
            }), 401

        return jsonify({
            'access_token': new_access_token,
            'expires_in': 3600,  # 1 hour in seconds
            'token_type': 'Bearer'
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Unable to refresh your session. Please log in again.',
            'error_code': 'TOKEN_REFRESH_FAILED',
            'details': {}
        }), 500

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
        return jsonify({
            'message': 'Logout failed',
            'error_code': 'LOGOUT_FAILED',
            'details': {}
        }), 500

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
        return jsonify({
            'message': 'Logout from all devices failed',
            'error_code': 'LOGOUT_FAILED',
            'details': {}
        }), 500

@bp.route('/forgot-password', methods=['POST'])
@password_reset_rate_limit()
def forgot_password():
    """Request password reset"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'message': 'Invalid request format. Please send JSON data.',
                'error_code': 'INVALID_REQUEST',
                'details': {}
            }), 400

        email = data.get('email')

        if not email:
            return jsonify({
                'message': 'Email is required',
                'error_code': 'VALIDATION_ERROR',
                'details': {
                    'email': ['Field is required']
                }
            }), 400

        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return jsonify({
                'message': 'Please enter a valid email address',
                'error_code': 'VALIDATION_ERROR',
                'details': {
                    'email': ['Must be a valid email address']
                }
            }), 400

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
        return jsonify({
            'message': 'Unable to process your password reset request. Please try again later.',
            'error_code': 'PASSWORD_RESET_REQUEST_FAILED',
            'details': {}
        }), 500

@bp.route('/reset-password', methods=['POST'])
@password_reset_rate_limit()
def reset_password():
    """Reset password"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'message': 'Invalid request format. Please send JSON data.',
                'error_code': 'INVALID_REQUEST',
                'details': {}
            }), 400

        required_fields = ['user_id', 'token', 'new_password']
        missing_fields = [field for field in required_fields if not data.get(field)]

        if missing_fields:
            return jsonify({
                'message': f'Please provide: {', '.join(missing_fields)}',
                'error_code': 'VALIDATION_ERROR',
                'details': {field: 'Field is required' for field in missing_fields}
            }), 400

        user_id = data['user_id']
        token = data['token']
        new_password = data['new_password']

        # Verify token by checking user
        user = User.get_user_by_id(user_id)
        if not user or user.get('password_reset_token') != token:
            return jsonify({
                'message': 'Invalid or expired reset token',
                'error_code': 'INVALID_RESET_TOKEN',
                'details': {}
            }), 400

        # Check token expiration
        if user.get('password_reset_expires') and user['password_reset_expires'] < datetime.utcnow():
            return jsonify({
                'message': 'Reset token has expired',
                'error_code': 'RESET_TOKEN_EXPIRED',
                'details': {}
            }), 400

        # Reset password
        success = User.reset_password(user_id, new_password)

        if success:
            return jsonify({'message': 'Password reset successful'}), 200
        else:
            return jsonify({
                'message': 'Unable to reset your password. Please try again later.',
                'error_code': 'PASSWORD_RESET_FAILED',
                'details': {}
            }), 500

    except ValueError as e:
        return jsonify({
            'message': str(e),
            'error_code': 'VALIDATION_ERROR',
            'details': {}
        }), 400
    except Exception as e:
        return jsonify({
            'message': 'Unable to reset your password. Please try again later.',
            'error_code': 'PASSWORD_RESET_FAILED',
            'details': {}
        }), 500

@bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify email address"""
    try:
        data = request.get_json()

        required_fields = ['user_id', 'token']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required', 'error_code': 'VALIDATION_ERROR'}), 400

        user_id = data['user_id']
        token = data['token']

        # Verify email
        success = User.verify_email(user_id, token)

        if success:
            return jsonify({'message': 'Email verified successfully'}), 200
        else:
            return jsonify({'message': 'Invalid verification token', 'error_code': 'INVALID_VERIFICATION_TOKEN'}), 400

    except Exception as e:
        return jsonify({'message': 'Email verification failed', 'error_code': 'EMAIL_VERIFICATION_FAILED'}), 500

@bp.route('/resend-verification', methods=['POST'])
@user_rate_limit(limit=2, window_seconds=3600)
def resend_verification():
    """Resend verification email"""
    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({'message': 'Email is required', 'error_code': 'VALIDATION_ERROR'}), 400

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
        return jsonify({'message': 'Failed to resend verification email', 'error_code': 'EMAIL_RESEND_FAILED'}), 500

@bp.route('/profile', methods=['GET'])
@user_rate_limit(limit=30, window_seconds=60)
def get_profile():
    """Get user profile"""
    try:
        # Get current user
        user = get_current_user()

        if not user:
            return jsonify({
                'message': 'User not found',
                'error_code': 'USER_NOT_FOUND',
                'details': {}
            }), 404

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
        return jsonify({
            'message': 'Unable to fetch your profile. Please try again later.',
            'error_code': 'PROFILE_FETCH_FAILED',
            'details': {}
        }), 500

@bp.route('/profile', methods=['PUT'])
@user_rate_limit(limit=10, window_seconds=60)
def update_profile():
    """Update user profile"""
    try:
        # Get current user
        user_id = get_current_user_id()

        if not user_id:
            return jsonify({
                'message': 'User not found',
                'error_code': 'USER_NOT_FOUND',
                'details': {}
            }), 404

        data = request.get_json()

        if not data:
            return jsonify({
                'message': 'Invalid request format. Please send JSON data.',
                'error_code': 'INVALID_REQUEST',
                'details': {}
            }), 400

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
            return jsonify({
                'message': 'No changes were made to your profile',
                'error_code': 'NO_CHANGES_MADE',
                'details': {}
            }), 400

    except Exception as e:
        return jsonify({
            'message': 'Unable to update your profile. Please try again later.',
            'error_code': 'PROFILE_UPDATE_FAILED',
            'details': {}
        }), 500

@bp.route('/change-password', methods=['POST'])
@user_rate_limit(limit=5, window_seconds=300)
def change_password():
    """Change user password"""
    try:
        # Get current user
        user_id = get_current_user_id()

        if not user_id:
            return jsonify({'message': 'User not found', 'error_code': 'USER_NOT_FOUND'}), 404

        data = request.get_json()

        required_fields = ['current_password', 'new_password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required', 'error_code': 'VALIDATION_ERROR'}), 400

        # Verify current password
        user = User.get_user_by_id(user_id)
        from werkzeug.security import check_password_hash

        if not check_password_hash(user['password_hash'], data['current_password']):
            return jsonify({'message': 'Current password is incorrect', 'error_code': 'INVALID_PASSWORD'}), 400

        # Change password
        success = User.reset_password(user_id, data['new_password'])

        if success:
            return jsonify({'message': 'Password changed successfully'}), 200
        else:
            return jsonify({'message': 'Unable to change password', 'error_code': 'PASSWORD_CHANGE_FAILED'}), 500

    except ValueError as e:
        return jsonify({'message': str(e), 'error_code': 'VALIDATION_ERROR'}), 400
    except Exception as e:
        return jsonify({'message': 'Unable to change password', 'error_code': 'PASSWORD_CHANGE_FAILED'}), 500

@bp.route('/subscription', methods=['GET'])
@user_rate_limit(limit=30, window_seconds=60)
def get_subscription():
    """Get user subscription information"""
    try:
        # Get current user
        user = get_current_user()

        if not user:
            return jsonify({'message': 'User not found', 'error_code': 'USER_NOT_FOUND'}), 404

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

        # Handle subscription expiration date serialization
        expires = user['subscription_expires']
        if expires and hasattr(expires, 'isoformat'):
            expires = expires.isoformat()
        
        return jsonify({
            'subscription': {
                'tier': user['subscription_tier'],
                'expires': expires,
                'limits': limits,
                'usage': {
                    'vehicles': total_vehicles,
                    'records': total_records
                }
            }
        }), 200

    except Exception as e:
        return jsonify({'message': 'Unable to get subscription info', 'error_code': 'SUBSCRIPTION_FETCH_FAILED'}), 500

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
        return jsonify({'message': 'Unable to check authentication', 'error_code': 'AUTH_CHECK_FAILED'}), 500
