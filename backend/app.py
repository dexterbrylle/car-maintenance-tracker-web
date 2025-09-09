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
CORS(app)

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

# Import routes
from routes import vehicles, maintenance, services, dashboard

# Register blueprints
app.register_blueprint(vehicles.bp, url_prefix='/api/vehicles')
app.register_blueprint(maintenance.bp, url_prefix='/api/maintenance')
app.register_blueprint(services.bp, url_prefix='/api/services')
app.register_blueprint(dashboard.bp, url_prefix='/api/dashboard')

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
