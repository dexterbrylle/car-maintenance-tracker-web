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
            "http://localhost:3000",  # Frontend dev
            "http://localhost:8080",  # Frontend prod
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8080"
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

@app.route('/api/swagger.json')
def swagger_json():
    return {
        "swagger": "2.0",
        "info": {
            "title": "Car Maintenance Tracker API",
            "description": "API for managing vehicle maintenance tracking",
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
            }
        ]
    }

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/maintenance_tracker')
client = MongoClient(MONGODB_URI)
db = client.get_default_database()

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
