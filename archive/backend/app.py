from flask import Flask
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from datetime import datetime
from bson.objectid import ObjectId
import json
from flask_swagger_ui import get_swaggerui_blueprint

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enhanced CORS configuration
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",  # Frontend dev (old)
            "http://localhost:8080",  # Frontend prod (old)
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8080",
            "http://localhost:5173",  # Vite dev server default
            "http://localhost:5174",  # Vite dev server fallback
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# Swagger UI configuration  
SWAGGER_URL = '/api/docs'
API_URL = '/api/swagger.json'
swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "Car Maintenance Tracker API"
    }
)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

# Add basic HTML page for simpler documentation
@app.route('/api/docs-simple')
def simple_docs():
    """Simple HTML documentation page"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Car Maintenance Tracker API Documentation</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .endpoint { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            .method { display: inline-block; padding: 4px 8px; border-radius: 3px; color: white; font-weight: bold; }
            .post { background-color: #28a745; }
            .get { background-color: #007bff; }
            .put { background-color: #ffc107; color: black; }
            .auth { background-color: #6f42c1; }
        </style>
    </head>
    <body>
        <h1>Car Maintenance Tracker API Documentation</h1>
        <p><strong>Base URL:</strong> http://localhost:5005/api</p>
        
        <h2>Authentication Endpoints</h2>
        
        <div class="endpoint">
            <span class="method post">POST</span> /auth/register - Register new user
            <br><strong>Body:</strong> {"email": "user@example.com", "password": "SecurePass123!", "first_name": "John", "last_name": "Doe"}
            <br><strong>Response:</strong> 201 Created with user data and JWT tokens
        </div>
        
        <div class="endpoint">
            <span class="method post">POST</span> /auth/login - User login
            <br><strong>Body:</strong> {"email": "user@example.com", "password": "SecurePass123!"}
            <br><strong>Response:</strong> 200 OK with user data and JWT tokens
        </div>
        
        <div class="endpoint">
            <span class="method post">POST</span> /auth/refresh - Refresh JWT token
            <br><strong>Body:</strong> {"refresh_token": "your_refresh_token"}
            <br><strong>Response:</strong> 200 OK with new access token
        </div>
        
        <div class="endpoint">
            <span class="method post">POST</span> /auth/logout - User logout
            <br><strong>Headers:</strong> Authorization: Bearer your_access_token
            <br><strong>Response:</strong> 200 OK
        </div>
        
        <div class="endpoint">
            <span class="method get">GET</span> /auth/profile - Get user profile
            <br><strong>Headers:</strong> Authorization: Bearer your_access_token
            <br><strong>Response:</strong> 200 OK with user profile data
        </div>
        
        <div class="endpoint">
            <span class="method put">PUT</span> /auth/profile - Update user profile
            <br><strong>Headers:</strong> Authorization: Bearer your_access_token
            <br><strong>Body:</strong> {"first_name": "Updated", "last_name": "Name", "phone": "+1234567890"}
            <br><strong>Response:</strong> 200 OK with updated profile
        </div>
        
        <div class="endpoint">
            <span class="method post">POST</span> /auth/forgot-password - Request password reset
            <br><strong>Body:</strong> {"email": "user@example.com"}
            <br><strong>Response:</strong> 200 OK
        </div>
        
        <div class="endpoint">
            <span class="method post">POST</span> /auth/reset-password - Reset password
            <br><strong>Body:</strong> {"token": "reset_token", "new_password": "NewSecurePass123!"}
            <br><strong>Response:</strong> 200 OK
        </div>
        
        <h2>Other Endpoints</h2>
        <p>Other endpoints (vehicles, maintenance, services, etc.) require authentication and follow similar patterns.</p>
        
        <h2>Authentication</h2>
        <p>All protected endpoints require JWT token in Authorization header:</p>
        <code>Authorization: Bearer your_access_token</code>
        
        <h2>Testing</h2>
        <p>You can test endpoints using tools like Postman, curl, or the Swagger UI at <a href="/api/docs">/api/docs</a></p>
    </body>
    </html>
    """

@app.route('/api/swagger.json')
def swagger_json():
    return {
        "swagger": "2.0",
        "info": {
            "title": "Car Maintenance Tracker API",
            "description": "API for managing vehicle maintenance tracking and authentication",
            "version": "1.0.0"
        },
        "host": f"localhost:{os.getenv('PORT', 5005)}",
        "basePath": "/api",
        "schemes": ["http"],
        "consumes": ["application/json"],
        "produces": ["application/json"],
        "paths": {
            "/vehicles": {
                "get": {
                    "summary": "Get all vehicles",
                    "description": "Retrieve a list of all vehicles in the system",
                    "tags": ["Vehicles"],
                    "responses": {
                        "200": {
                            "description": "List of vehicles",
                            "schema": {
                                "type": "array",
                                "items": {
                                    "$ref": "#/definitions/Vehicle"
                                }
                            }
                        }
                    }
                },
                "post": {
                    "summary": "Add a new vehicle",
                    "description": "Create a new vehicle record",
                    "tags": ["Vehicles"],
                    "parameters": [
                        {
                            "name": "vehicle",
                            "in": "body",
                            "required": True,
                            "schema": {
                                "$ref": "#/definitions/VehicleInput"
                            }
                        }
                    ],
                    "responses": {
                        "201": {
                            "description": "Vehicle created successfully"
                        },
                        "400": {
                            "description": "Invalid input"
                        }
                    }
                }
            },
            "/vehicles/{vehicle_id}": {
                "put": {
                    "summary": "Update a vehicle",
                    "description": "Update an existing vehicle's information",
                    "tags": ["Vehicles"],
                    "parameters": [
                        {
                            "name": "vehicle_id",
                            "in": "path",
                            "required": True,
                            "type": "string"
                        },
                        {
                            "name": "vehicle",
                            "in": "body",
                            "required": True,
                            "schema": {
                                "$ref": "#/definitions/VehicleInput"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Vehicle updated successfully"
                        },
                        "404": {
                            "description": "Vehicle not found"
                        }
                    }
                },
                "delete": {
                    "summary": "Delete a vehicle",
                    "description": "Remove a vehicle from the system",
                    "tags": ["Vehicles"],
                    "parameters": [
                        {
                            "name": "vehicle_id",
                            "in": "path",
                            "required": True,
                            "type": "string"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Vehicle deleted successfully"
                        },
                        "404": {
                            "description": "Vehicle not found"
                        }
                    }
                }
            },
            "/maintenance/{vehicle_id}": {
                "get": {
                    "summary": "Get maintenance items for a vehicle",
                    "description": "Retrieve all maintenance items for a specific vehicle",
                    "tags": ["Maintenance"],
                    "parameters": [
                        {
                            "name": "vehicle_id",
                            "in": "path",
                            "required": True,
                            "type": "string"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of maintenance items",
                            "schema": {
                                "type": "array",
                                "items": {
                                    "$ref": "#/definitions/MaintenanceItem"
                                }
                            }
                        }
                    }
                }
            },
            "/services/{vehicle_id}": {
                "get": {
                    "summary": "Get service records for a vehicle",
                    "description": "Retrieve all service records for a specific vehicle",
                    "tags": ["Services"],
                    "parameters": [
                        {
                            "name": "vehicle_id",
                            "in": "path",
                            "required": True,
                            "type": "string"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of service records",
                            "schema": {
                                "type": "array",
                                "items": {
                                    "$ref": "#/definitions/ServiceRecord"
                                }
                            }
                        }
                    }
                }
            },
            "/dashboard/{vehicle_id}": {
                "get": {
                    "summary": "Get dashboard data for a vehicle",
                    "description": "Retrieve maintenance status dashboard for a specific vehicle",
                    "tags": ["Dashboard"],
                    "parameters": [
                        {
                            "name": "vehicle_id",
                            "in": "path",
                            "required": True,
                            "type": "string"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Dashboard data with maintenance status"
                        }
                    }
                }
            },
            "/fillups": {
                "post": {
                    "summary": "Add a new fill-up record",
                    "description": "Create a new fuel fill-up record with automatic fuel economy calculation",
                    "tags": ["Fuel Tracking"],
                    "parameters": [
                        {
                            "name": "fillup",
                            "in": "body",
                            "required": True,
                            "schema": {
                                "$ref": "#/definitions/FillUpInput"
                            }
                        }
                    ],
                    "responses": {
                        "201": {
                            "description": "Fill-up created successfully",
                            "schema": {
                                "$ref": "#/definitions/FillUp"
                            }
                        },
                        "400": {
                            "description": "Invalid input data"
                        }
                    }
                }
            },
            "/fillups/{vehicle_id}": {
                "get": {
                    "summary": "Get fill-ups for a vehicle",
                    "description": "Retrieve all fuel fill-up records for a specific vehicle with pagination",
                    "tags": ["Fuel Tracking"],
                    "parameters": [
                        {
                            "name": "vehicle_id",
                            "in": "path",
                            "required": True,
                            "type": "string"
                        },
                        {
                            "name": "page",
                            "in": "query",
                            "required": False,
                            "type": "integer",
                            "description": "Page number (default: 1)"
                        },
                        {
                            "name": "limit",
                            "in": "query",
                            "required": False,
                            "type": "integer",
                            "description": "Items per page (default: 50)"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of fill-ups with pagination info"
                        }
                    }
                }
            },
            "/fillups/{fillup_id}": {
                "put": {
                    "summary": "Update a fill-up record",
                    "description": "Update an existing fill-up record with automatic recalculation of dependent records",
                    "tags": ["Fuel Tracking"],
                    "parameters": [
                        {
                            "name": "fillup_id",
                            "in": "path",
                            "required": True,
                            "type": "string"
                        },
                        {
                            "name": "fillup",
                            "in": "body",
                            "required": True,
                            "schema": {
                                "$ref": "#/definitions/FillUpUpdate"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Fill-up updated successfully"
                        },
                        "404": {
                            "description": "Fill-up not found"
                        }
                    }
                },
                "delete": {
                    "summary": "Delete a fill-up record",
                    "description": "Remove a fill-up record with automatic recalculation of dependent records",
                    "tags": ["Fuel Tracking"],
                    "parameters": [
                        {
                            "name": "fillup_id",
                            "in": "path",
                            "required": True,
                            "type": "string"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Fill-up deleted successfully"
                        },
                        "404": {
                            "description": "Fill-up not found"
                        }
                    }
                }
            },
            "/fillups/stats/{vehicle_id}": {
                "get": {
                    "summary": "Get fuel statistics for a vehicle",
                    "description": "Retrieve comprehensive fuel statistics and performance metrics",
                    "tags": ["Fuel Tracking"],
                    "parameters": [
                        {
                            "name": "vehicle_id",
                            "in": "path",
                            "required": True,
                            "type": "string"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Fuel statistics",
                            "schema": {
                                "$ref": "#/definitions/FuelStats"
                            }
                        },
                        "404": {
                            "description": "No fuel data found"
                        }
                    }
                }
            },
            "/fillups/recent/{vehicle_id}": {
                "get": {
                    "summary": "Get recent fill-ups for dashboard",
                    "description": "Get recent fill-up records for dashboard display",
                    "tags": ["Fuel Tracking"],
                    "parameters": [
                        {
                            "name": "vehicle_id",
                            "in": "path",
                            "required": True,
                            "type": "string"
                        },
                        {
                            "name": "limit",
                            "in": "query",
                            "required": False,
                            "type": "integer",
                            "description": "Number of records to return (default: 5)"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "List of recent fill-ups"
                        }
                    }
                }
            },
            "/health": {
                "get": {
                    "summary": "Health check",
                    "description": "Check if the API and database are working",
                    "tags": ["System"],
                    "responses": {
                        "200": {
                            "description": "System is healthy"
                        },
                        "500": {
                            "description": "System is unhealthy"
                        }
                    }
                }
            },
            "/auth/register": {
                "post": {
                    "summary": "Register a new user",
                    "description": "Create a new user account with email and password",
                    "tags": ["Authentication"],
                    "parameters": [
                        {
                            "name": "user",
                            "in": "body",
                            "required": True,
                            "schema": {
                                "$ref": "#/definitions/UserRegistration"
                            }
                        }
                    ],
                    "responses": {
                        "201": {
                            "description": "User registered successfully",
                            "schema": {
                                "$ref": "#/definitions/AuthResponse"
                            }
                        },
                        "400": {
                            "description": "Invalid input data"
                        },
                        "409": {
                            "description": "Email already exists"
                        },
                        "429": {
                            "description": "Too many registration attempts"
                        }
                    }
                }
            },
            "/auth/login": {
                "post": {
                    "summary": "User login",
                    "description": "Authenticate user with email and password",
                    "tags": ["Authentication"],
                    "parameters": [
                        {
                            "name": "credentials",
                            "in": "body",
                            "required": True,
                            "schema": {
                                "$ref": "#/definitions/LoginCredentials"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Login successful",
                            "schema": {
                                "$ref": "#/definitions/AuthResponse"
                            }
                        },
                        "401": {
                            "description": "Invalid credentials"
                        },
                        "429": {
                            "description": "Too many login attempts"
                        }
                    }
                }
            },
            "/auth/refresh": {
                "post": {
                    "summary": "Refresh access token",
                    "description": "Refresh JWT access token using refresh token",
                    "tags": ["Authentication"],
                    "parameters": [
                        {
                            "name": "refresh_token",
                            "in": "body",
                            "required": True,
                            "schema": {
                                "type": "object",
                                "required": ["refresh_token"],
                                "properties": {
                                    "refresh_token": {
                                        "type": "string",
                                        "description": "Refresh token"
                                    }
                                }
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Token refreshed successfully",
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "access_token": {
                                        "type": "string",
                                        "description": "New access token"
                                    }
                                }
                            }
                        },
                        "401": {
                            "description": "Invalid refresh token"
                        },
                        "429": {
                            "description": "Too many refresh attempts"
                        }
                    }
                }
            },
            "/auth/logout": {
                "post": {
                    "summary": "User logout",
                    "description": "Logout user and invalidate refresh token",
                    "tags": ["Authentication"],
                    "parameters": [
                        {
                            "name": "Authorization",
                            "in": "header",
                            "required": True,
                            "type": "string",
                            "description": "Bearer token"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Logout successful"
                        },
                        "401": {
                            "description": "Invalid token"
                        }
                    }
                }
            },
            "/auth/profile": {
                "get": {
                    "summary": "Get user profile",
                    "description": "Get current user profile information",
                    "tags": ["Authentication"],
                    "parameters": [
                        {
                            "name": "Authorization",
                            "in": "header",
                            "required": True,
                            "type": "string",
                            "description": "Bearer token"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "User profile retrieved successfully",
                            "schema": {
                                "$ref": "#/definitions/UserProfile"
                            }
                        },
                        "401": {
                            "description": "Invalid token"
                        }
                    }
                },
                "put": {
                    "summary": "Update user profile",
                    "description": "Update current user profile information",
                    "tags": ["Authentication"],
                    "parameters": [
                        {
                            "name": "Authorization",
                            "in": "header",
                            "required": True,
                            "type": "string",
                            "description": "Bearer token"
                        },
                        {
                            "name": "profile",
                            "in": "body",
                            "required": True,
                            "schema": {
                                "$ref": "#/definitions/UserProfileUpdate"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Profile updated successfully",
                            "schema": {
                                "$ref": "#/definitions/UserProfile"
                            }
                        },
                        "400": {
                            "description": "Invalid input data"
                        },
                        "401": {
                            "description": "Invalid token"
                        }
                    }
                }
            },
            "/auth/forgot-password": {
                "post": {
                    "summary": "Request password reset",
                    "description": "Send password reset email to user",
                    "tags": ["Authentication"],
                    "parameters": [
                        {
                            "name": "email",
                            "in": "body",
                            "required": True,
                            "schema": {
                                "type": "object",
                                "required": ["email"],
                                "properties": {
                                    "email": {
                                        "type": "string",
                                        "format": "email",
                                        "description": "User email address"
                                    }
                                }
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Password reset email sent"
                        },
                        "400": {
                            "description": "Invalid email"
                        },
                        "404": {
                            "description": "Email not found"
                        },
                        "429": {
                            "description": "Too many reset attempts"
                        }
                    }
                }
            },
            "/auth/reset-password": {
                "post": {
                    "summary": "Reset password",
                    "description": "Reset user password using reset token",
                    "tags": ["Authentication"],
                    "parameters": [
                        {
                            "name": "reset_data",
                            "in": "body",
                            "required": True,
                            "schema": {
                                "$ref": "#/definitions/PasswordReset"
                            }
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Password reset successful"
                        },
                        "400": {
                            "description": "Invalid input data"
                        },
                        "401": {
                            "description": "Invalid or expired reset token"
                        }
                    }
                }
            }
        },
        "definitions": {
            "Vehicle": {
                "type": "object",
                "properties": {
                    "_id": {
                        "type": "string",
                        "description": "Vehicle ID"
                    },
                    "make": {
                        "type": "string",
                        "description": "Vehicle make"
                    },
                    "model": {
                        "type": "string",
                        "description": "Vehicle model"
                    },
                    "year": {
                        "type": "integer",
                        "description": "Vehicle year"
                    },
                    "current_mileage": {
                        "type": "integer",
                        "description": "Current vehicle mileage"
                    },
                    "created_at": {
                        "type": "string",
                        "format": "date-time",
                        "description": "Creation timestamp"
                    }
                }
            },
            "VehicleInput": {
                "type": "object",
                "required": ["make", "model", "year", "current_mileage"],
                "properties": {
                    "make": {
                        "type": "string",
                        "description": "Vehicle make"
                    },
                    "model": {
                        "type": "string",
                        "description": "Vehicle model"
                    },
                    "year": {
                        "type": "integer",
                        "description": "Vehicle year"
                    },
                    "current_mileage": {
                        "type": "integer",
                        "description": "Current vehicle mileage"
                    }
                }
            },
            "MaintenanceItem": {
                "type": "object",
                "properties": {
                    "_id": {
                        "type": "string",
                        "description": "Maintenance item ID"
                    },
                    "name": {
                        "type": "string",
                        "description": "Maintenance item name"
                    },
                    "category": {
                        "type": "string",
                        "description": "Maintenance category"
                    },
                    "interval_km": {
                        "type": "integer",
                        "description": "Maintenance interval in kilometers"
                    },
                    "description": {
                        "type": "string",
                        "description": "Maintenance description"
                    },
                    "vehicle_id": {
                        "type": "string",
                        "description": "Associated vehicle ID"
                    }
                }
            },
            "ServiceRecord": {
                "type": "object",
                "properties": {
                    "_id": {
                        "type": "string",
                        "description": "Service record ID"
                    },
                    "vehicle_id": {
                        "type": "string",
                        "description": "Vehicle ID"
                    },
                    "maintenance_item_id": {
                        "type": "string",
                        "description": "Maintenance item ID"
                    },
                    "date": {
                        "type": "string",
                        "format": "date",
                        "description": "Service date"
                    },
                    "mileage": {
                        "type": "integer",
                        "description": "Service mileage"
                    },
                    "cost": {
                        "type": "number",
                        "description": "Service cost"
                    },
                    "notes": {
                        "type": "string",
                        "description": "Service notes"
                    },
                    "created_at": {
                        "type": "string",
                        "format": "date-time",
                        "description": "Creation timestamp"
                    }
                }
            },
            "FillUp": {
                "type": "object",
                "properties": {
                    "_id": {
                        "type": "string",
                        "description": "Fill-up ID"
                    },
                    "vehicle_id": {
                        "type": "string",
                        "description": "Vehicle ID"
                    },
                    "date": {
                        "type": "string",
                        "format": "date",
                        "description": "Fill-up date"
                    },
                    "odometer_km": {
                        "type": "number",
                        "description": "Odometer reading in kilometers"
                    },
                    "liters": {
                        "type": "number",
                        "description": "Amount of fuel in liters"
                    },
                    "price_per_liter": {
                        "type": "number",
                        "description": "Price per liter in local currency"
                    },
                    "total_cost": {
                        "type": "number",
                        "description": "Total cost of the fill-up"
                    },
                    "full_tank": {
                        "type": "boolean",
                        "description": "Whether this was a full tank fill-up"
                    },
                    "fuel_economy_kmpl": {
                        "type": "number",
                        "description": "Calculated fuel economy in km/L (if full tank)"
                    },
                    "cost_per_km": {
                        "type": "number",
                        "description": "Calculated cost per kilometer (if full tank)"
                    },
                    "notes": {
                        "type": "string",
                        "description": "Optional notes about the fill-up"
                    },
                    "created_at": {
                        "type": "string",
                        "format": "date-time",
                        "description": "Creation timestamp"
                    }
                }
            },
            "FillUpInput": {
                "type": "object",
                "required": ["vehicle_id", "date", "odometer_km", "liters", "price_per_liter"],
                "properties": {
                    "vehicle_id": {
                        "type": "string",
                        "description": "Vehicle ID"
                    },
                    "date": {
                        "type": "string",
                        "format": "date",
                        "description": "Fill-up date (YYYY-MM-DD)"
                    },
                    "odometer_km": {
                        "type": "number",
                        "description": "Odometer reading in kilometers"
                    },
                    "liters": {
                        "type": "number",
                        "description": "Amount of fuel in liters"
                    },
                    "price_per_liter": {
                        "type": "number",
                        "description": "Price per liter in local currency"
                    },
                    "total_cost": {
                        "type": "number",
                        "description": "Total cost (calculated if not provided)"
                    },
                    "full_tank": {
                        "type": "boolean",
                        "description": "Whether this was a full tank fill-up (default: true)"
                    },
                    "notes": {
                        "type": "string",
                        "description": "Optional notes about the fill-up"
                    }
                }
            },
            "FillUpUpdate": {
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "format": "date",
                        "description": "Fill-up date (YYYY-MM-DD)"
                    },
                    "odometer_km": {
                        "type": "number",
                        "description": "Odometer reading in kilometers"
                    },
                    "liters": {
                        "type": "number",
                        "description": "Amount of fuel in liters"
                    },
                    "price_per_liter": {
                        "type": "number",
                        "description": "Price per liter in local currency"
                    },
                    "total_cost": {
                        "type": "number",
                        "description": "Total cost of the fill-up"
                    },
                    "full_tank": {
                        "type": "boolean",
                        "description": "Whether this was a full tank fill-up"
                    },
                    "notes": {
                        "type": "string",
                        "description": "Optional notes about the fill-up"
                    }
                }
            },
            "FuelStats": {
                "type": "object",
                "properties": {
                    "avg_fuel_economy": {
                        "type": "number",
                        "description": "Average fuel economy in km/L"
                    },
                    "best_fuel_economy": {
                        "type": "number",
                        "description": "Best fuel economy achieved"
                    },
                    "worst_fuel_economy": {
                        "type": "number",
                        "description": "Worst fuel economy recorded"
                    },
                    "avg_cost_per_km": {
                        "type": "number",
                        "description": "Average cost per kilometer"
                    },
                    "total_fuel_cost_ytd": {
                        "type": "number",
                        "description": "Total fuel cost year-to-date"
                    },
                    "total_fillups": {
                        "type": "integer",
                        "description": "Total number of fill-up records"
                    },
                    "last_fillup_date": {
                        "type": "string",
                        "format": "date",
                        "description": "Date of the most recent fill-up"
                    },
                    "monthly_fuel_cost": {
                        "type": "number",
                        "description": "Current month fuel cost"
                    }
                }
            },
            "UserRegistration": {
                "type": "object",
                "required": ["email", "password", "first_name", "last_name"],
                "properties": {
                    "email": {
                        "type": "string",
                        "format": "email",
                        "description": "User email address"
                    },
                    "password": {
                        "type": "string",
                        "description": "User password (minimum 8 characters, must contain uppercase, lowercase, number, and special character)"
                    },
                    "first_name": {
                        "type": "string",
                        "description": "User first name"
                    },
                    "last_name": {
                        "type": "string",
                        "description": "User last name"
                    },
                    "phone": {
                        "type": "string",
                        "description": "User phone number (optional)"
                    }
                }
            },
            "LoginCredentials": {
                "type": "object",
                "required": ["email", "password"],
                "properties": {
                    "email": {
                        "type": "string",
                        "format": "email",
                        "description": "User email address"
                    },
                    "password": {
                        "type": "string",
                        "description": "User password"
                    }
                }
            },
            "AuthResponse": {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "Response message"
                    },
                    "user": {
                        "$ref": "#/definitions/UserProfile"
                    },
                    "tokens": {
                        "type": "object",
                        "properties": {
                            "access_token": {
                                "type": "string",
                                "description": "JWT access token"
                            },
                            "refresh_token": {
                                "type": "string",
                                "description": "JWT refresh token"
                            }
                        }
                    }
                }
            },
            "UserProfile": {
                "type": "object",
                "properties": {
                    "_id": {
                        "type": "string",
                        "description": "User ID"
                    },
                    "email": {
                        "type": "string",
                        "format": "email",
                        "description": "User email address"
                    },
                    "first_name": {
                        "type": "string",
                        "description": "User first name"
                    },
                    "last_name": {
                        "type": "string",
                        "description": "User last name"
                    },
                    "phone": {
                        "type": "string",
                        "description": "User phone number"
                    },
                    "subscription_tier": {
                        "type": "string",
                        "enum": ["free", "personal", "family", "business"],
                        "description": "User subscription tier"
                    },
                    "is_verified": {
                        "type": "boolean",
                        "description": "Whether the user's email is verified"
                    },
                    "created_at": {
                        "type": "string",
                        "format": "date-time",
                        "description": "Account creation timestamp"
                    }
                }
            },
            "UserProfileUpdate": {
                "type": "object",
                "properties": {
                    "first_name": {
                        "type": "string",
                        "description": "User first name"
                    },
                    "last_name": {
                        "type": "string",
                        "description": "User last name"
                    },
                    "phone": {
                        "type": "string",
                        "description": "User phone number"
                    }
                }
            },
            "PasswordReset": {
                "type": "object",
                "required": ["token", "new_password"],
                "properties": {
                    "token": {
                        "type": "string",
                        "description": "Password reset token"
                    },
                    "new_password": {
                        "type": "string",
                        "description": "New password (minimum 8 characters, must contain uppercase, lowercase, number, and special character)"
                    }
                }
            }
        },
        "tags": [
            {
                "name": "Vehicles",
                "description": "Vehicle management endpoints"
            },
            {
                "name": "Maintenance",
                "description": "Maintenance item management endpoints"
            },
            {
                "name": "Services",
                "description": "Service record management endpoints"
            },
            {
                "name": "Dashboard",
                "description": "Dashboard data endpoints"
            },
            {
                "name": "System",
                "description": "System health and info endpoints"
            },
            {
                "name": "Fuel Tracking",
                "description": "Fuel fill-up tracking and analytics endpoints"
            },
            {
                "name": "Authentication",
                "description": "User authentication and account management endpoints"
            }
        ]
    }

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')
client = MongoClient(MONGODB_URI)

# Extract database name from URI or use default
from urllib.parse import urlparse
parsed_uri = urlparse(MONGODB_URI)
db_name = parsed_uri.path[1:] if parsed_uri.path else 'maintenance_tracker'
db = client[db_name]

# Custom JSON encoder for MongoDB ObjectId
class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

app.json_encoder = MongoJSONEncoder

# Security middleware
from security import add_security_headers, get_csp_headers

@app.after_request
def add_security_headers_middleware(response):
    """Add security headers to all responses"""
    response = add_security_headers(response)
    
    # Add CSP headers
    csp_headers = get_csp_headers()
    for header, value in csp_headers.items():
        response.headers[header] = value
    
    return response

# Import routes
from routes import vehicles, maintenance, services, dashboard
from routes import fillups, export, auth

# Register blueprints
app.register_blueprint(vehicles.bp, url_prefix='/api/vehicles')
app.register_blueprint(maintenance.bp, url_prefix='/api/maintenance')
app.register_blueprint(services.bp, url_prefix='/api/services')
app.register_blueprint(dashboard.bp, url_prefix='/api/dashboard')
app.register_blueprint(fillups.bp, url_prefix='/api/fillups')
app.register_blueprint(export.bp, url_prefix='/api/export')
app.register_blueprint(auth.bp, url_prefix='/api/auth')

@app.route('/health')
def health_check():
    try:
        # Test MongoDB connection
        db.command('ping')
        return {'status': 'healthy', 'database': 'connected'}, 200
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}, 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5005))
    app.run(debug=True, host='0.0.0.0', port=port)
