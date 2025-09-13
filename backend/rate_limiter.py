from functools import wraps
from flask import request, jsonify
import time
from collections import defaultdict
import threading
import os
from datetime import datetime, timedelta

# Try to import Redis for distributed rate limiting
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

# Simple in-memory rate limiting
# In production, use Redis or similar for distributed rate limiting
class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
        self.lock = threading.Lock()
        self.redis_client = None
        
        # Initialize Redis if available
        if REDIS_AVAILABLE and os.getenv('REDIS_URL'):
            try:
                self.redis_client = redis.from_url(os.getenv('REDIS_URL'))
                # Test connection
                self.redis_client.ping()
                print("Redis connected for rate limiting")
            except Exception as e:
                print(f"Redis connection failed: {e}")
                self.redis_client = None
    
    def is_allowed(self, key, limit, window_seconds):
        """Check if request is allowed based on rate limit"""
        current_time = time.time()
        
        # Use Redis if available
        if self.redis_client:
            return self._is_allowed_redis(key, limit, window_seconds)
        
        # Fallback to in-memory rate limiting
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
    
    def _is_allowed_redis(self, key, limit, window_seconds):
        """Check rate limit using Redis"""
        redis_key = f"rate_limit:{key}"
        current_time = time.time()
        
        try:
            # Use Redis pipeline for atomic operations
            pipe = self.redis_client.pipeline()
            
            # Remove expired requests
            pipe.zremrangebyscore(redis_key, 0, current_time - window_seconds)
            
            # Get current count
            pipe.zcard(redis_key)
            
            # Add current request
            pipe.zadd(redis_key, {str(current_time): current_time})
            
            # Set expiration
            pipe.expire(redis_key, window_seconds)
            
            results = pipe.execute()
            current_count = results[1]
            
            return current_count < limit
        except Exception as e:
            print(f"Redis rate limit error: {e}")
            # Fallback to allowing the request
            return True

# Global rate limiter instance
rate_limiter = RateLimiter()

def rate_limit(limit=100, window_seconds=60, key_func=None, error_code="RATE_LIMIT_EXCEEDED"):
    """Rate limiting decorator with enhanced error responses"""
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
                    'error': {
                        'code': error_code,
                        'message': f'Rate limit exceeded. Limit: {limit} requests per {window_seconds} seconds.',
                        'details': {
                            'limit': limit,
                            'window_seconds': window_seconds,
                            'retry_after': window_seconds
                        }
                    },
                    'timestamp': datetime.utcnow().isoformat() + 'Z'
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
    
    return rate_limit(limit, window_seconds, key_func, "AUTH_RATE_LIMIT_EXCEEDED")

def login_rate_limit(limit=5, window_seconds=300):
    """Stricter rate limiting for login attempts"""
    def key_func():
        # Use email + IP for login attempts
        email = request.get_json().get('email', '') if request.is_json else ''
        return f"login:{email}:{request.remote_addr}"
    
    return rate_limit(limit, window_seconds, key_func, "LOGIN_RATE_LIMIT_EXCEEDED")

def password_reset_rate_limit(limit=3, window_seconds=3600):
    """Rate limiting for password reset requests"""
    def key_func():
        email = request.get_json().get('email', '') if request.is_json else ''
        return f"reset:{email}:{request.remote_addr}"
    
    return rate_limit(limit, window_seconds, key_func, "PASSWORD_RESET_RATE_LIMIT_EXCEEDED")

def token_refresh_rate_limit(limit=10, window_seconds=60):
    """Rate limiting for token refresh requests"""
    def key_func():
        # Use IP for token refresh to prevent abuse
        return f"refresh:{request.remote_addr}"
    
    return rate_limit(limit, window_seconds, key_func, "TOKEN_REFRESH_RATE_LIMIT_EXCEEDED")

# Specific rate limits for different endpoints
def register_rate_limit():
    """Rate limiting for registration"""
    return auth_rate_limit(limit=3, window_seconds=3600)  # 3 registrations per hour

def login_attempts_rate_limit():
    """Rate limiting for login attempts"""
    return login_rate_limit(limit=5, window_seconds=900)  # 5 attempts per 15 minutes

def refresh_token_rate_limit():
    """Rate limiting for token refresh"""
    return token_refresh_rate_limit(limit=10, window_seconds=60)  # 10 per minute

def burst_rate_limit(limit=20, window_seconds=10):
    """Burst rate limiting for rapid consecutive requests (like batch operations)"""
    def key_func():
        from auth import get_current_user_id
        user_id = get_current_user_id()
        return f"burst:{user_id}" if user_id else request.remote_addr
    
    return rate_limit(limit, window_seconds, key_func, "BURST_RATE_LIMIT_EXCEEDED")

def service_operations_rate_limit():
    """Rate limiting for service operations (create, update, delete)"""
    return burst_rate_limit(limit=30, window_seconds=15)  # 30 operations per 15 seconds