from functools import wraps
from flask import request, jsonify
import time
from collections import defaultdict
import threading

# Simple in-memory rate limiting
# In production, use Redis or similar for distributed rate limiting
class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
        self.lock = threading.Lock()
    
    def is_allowed(self, key, limit, window_seconds):
        """Check if request is allowed based on rate limit"""
        current_time = time.time()
        
        with self.lock:
            # Clean old requests
            self.requests[key] = [
                req_time for req_time in self.requests[key]
                if current_time - req_time < window_seconds
            ]
            
            # Check if limit exceeded
            if len(self.requests[key]) >= limit:
                return False
            
            # Add current request
            self.requests[key].append(current_time)
            return True

# Global rate limiter instance
rate_limiter = RateLimiter()

def rate_limit(limit=100, window_seconds=60, key_func=None):
    """Rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Get rate limit key
            if key_func:
                key = key_func()
            else:
                # Default key: IP address
                key = request.remote_addr
            
            # Check if request is allowed
            if not rate_limiter.is_allowed(key, limit, window_seconds):
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Too many requests. Limit: {limit} requests per {window_seconds} seconds.',
                    'retry_after': window_seconds
                }), 429
            
            return f(*args, **kwargs)
        return decorated
    return decorator

def ip_rate_limit(limit=100, window_seconds=60):
    """IP-based rate limiting"""
    return rate_limit(limit, window_seconds, lambda: request.remote_addr)

def user_rate_limit(limit=100, window_seconds=60):
    """User-based rate limiting (requires authentication)"""
    def key_func():
        from auth import get_current_user_id
        user_id = get_current_user_id()
        return f"user:{user_id}" if user_id else request.remote_addr
    
    return rate_limit(limit, window_seconds, key_func)

def auth_rate_limit(limit=5, window_seconds=60):
    """Rate limiting for authentication endpoints"""
    def key_func():
        # Use IP for authentication endpoints to prevent brute force
        return f"auth:{request.remote_addr}"
    
    return rate_limit(limit, window_seconds, key_func)

def login_rate_limit(limit=5, window_seconds=300):
    """Stricter rate limiting for login attempts"""
    def key_func():
        # Use email + IP for login attempts
        email = request.get_json().get('email', '') if request.is_json else ''
        return f"login:{email}:{request.remote_addr}"
    
    return rate_limit(limit, window_seconds, key_func)

def password_reset_rate_limit(limit=3, window_seconds=3600):
    """Rate limiting for password reset requests"""
    def key_func():
        email = request.get_json().get('email', '') if request.is_json else ''
        return f"reset:{email}:{request.remote_addr}"
    
    return rate_limit(limit, window_seconds, key_func)

# Specific rate limits for different endpoints
def register_rate_limit():
    """Rate limiting for registration"""
    return auth_rate_limit(limit=3, window_seconds=3600)  # 3 registrations per hour

def login_attempts_rate_limit():
    """Rate limiting for login attempts"""
    return login_rate_limit(limit=5, window_seconds=300)  # 5 attempts per 5 minutes