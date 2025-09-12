import unittest
import sys
import os
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import FillUp, Vehicle
from utils.fuel_calculations import (
    validate_fillup_data, 
    calculate_fuel_economy, 
    calculate_cost_per_km,
    calculate_monthly_fuel_cost,
    get_fuel_performance_trends,
    get_fuel_efficiency_insights,
    update_vehicle_fuel_stats
)
from utils.insights import (
    generate_insights,
    generate_fuel_maintenance_insights,
    generate_fuel_insights,
    generate_maintenance_insights,
    get_fuel_performance_summary,
    calculate_efficiency_rating,
    predict_maintenance_needs
)

class TestFillUpModel(unittest.TestCase):
    """Test cases for FillUp model functionality"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.test_vehicle_id = "507f1f77bcf86cd799439011"
        self.test_fillup_data = {
            'vehicle_id': self.test_vehicle_id,
            'date': '2025-01-15',
            'odometer_km': 50000,
            'liters': 45.5,
            'price_per_liter': 58.50,
            'total_cost': 2661.75,
            'full_tank': True,
            'notes': 'Test fill-up'
        }
        
    @patch('models.db')
    def test_create_fillup_basic(self, mock_db):
        """Test basic fill-up creation"""
        # Mock the database insertion
        mock_result = Mock()
        mock_result.inserted_id = "507f1f77bcf86cd799439012"
        mock_db.fill_ups.insert_one.return_value = mock_result
        
        # Mock the get_fillup_by_id method to return the created fillup
        with patch.object(FillUp, 'get_fillup_by_id') as mock_get:
            mock_get.return_value = {
                '_id': mock_result.inserted_id,
                **self.test_fillup_data,
                'created_at': datetime.utcnow()
            }
            
            fillup_id = FillUp.create_fillup(self.test_fillup_data)
            
            self.assertEqual(fillup_id, str(mock_result.inserted_id))
            mock_db.fill_ups.insert_one.assert_called_once()
    
    @patch('models.db')
    def test_create_fillup_with_fuel_economy(self, mock_db):
        """Test fill-up creation with fuel economy calculation"""
        # Mock the database insertion
        mock_result = Mock()
        mock_result.inserted_id = "507f1f77bcf86cd799439012"
        mock_db.fill_ups.insert_one.return_value = mock_result
        
        # Mock previous fillup for fuel economy calculation
        previous_fillup = {
            '_id': "507f1f77bcf86cd799439011",
            'vehicle_id': self.test_vehicle_id,
            'odometer_km': 49500,
            'full_tank': True
        }
        
        with patch.object(FillUp, 'get_previous_full_tank_fillup') as mock_prev:
            mock_prev.return_value = previous_fillup
            
            with patch.object(FillUp, 'get_fillup_by_id') as mock_get:
                expected_fillup = {
                    '_id': mock_result.inserted_id,
                    **self.test_fillup_data,
                    'fuel_economy_kmpl': 10.99,  # (50000-49500)/45.5
                    'cost_per_km': 4.85,  # 2661.75/500
                    'created_at': datetime.utcnow()
                }
                mock_get.return_value = expected_fillup
                
                fillup_id = FillUp.create_fillup(self.test_fillup_data)
                
                self.assertEqual(fillup_id, str(mock_result.inserted_id))
                # Verify that fuel economy was calculated
                call_args = mock_db.fill_ups.insert_one.call_args[0][0]
                self.assertIn('fuel_economy_kmpl', call_args)
                self.assertIn('cost_per_km', call_args)
    
    @patch('models.db')
    def test_get_fillups_by_vehicle(self, mock_db):
        """Test retrieving fill-ups for a vehicle"""
        # Mock database response
        mock_fillups = [
            {'_id': '507f1f77bcf86cd799439012', 'vehicle_id': self.test_vehicle_id, 'odometer_km': 50000},
            {'_id': '507f1f77bcf86cd799439013', 'vehicle_id': self.test_vehicle_id, 'odometer_km': 49500}
        ]
        mock_cursor = Mock()
        mock_cursor.sort.return_value = mock_cursor
        mock_cursor.limit.return_value = mock_cursor
        mock_cursor.skip.return_value = mock_fillups
        mock_db.fill_ups.find.return_value = mock_cursor
        
        fillups = FillUp.get_fillups_by_vehicle(self.test_vehicle_id, limit=10, offset=5)
        
        self.assertEqual(len(fillups), 2)
        mock_db.fill_ups.find.assert_called_once_with({'vehicle_id': self.test_vehicle_id})
        mock_cursor.limit.assert_called_once_with(10)
        mock_cursor.skip.assert_called_once_with(5)
    
    @patch('models.db')
    def test_update_fillup_recalculates_economy(self, mock_db):
        """Test that updating a fill-up recalculates fuel economy"""
        # Mock the existing fillup
        existing_fillup = {
            '_id': '507f1f77bcf86cd799439012',
            'vehicle_id': self.test_vehicle_id,
            'odometer_km': 50000,
            'liters': 45.5,
            'full_tank': True
        }
        
        # Mock previous fillup
        previous_fillup = {
            '_id': '507f1f77bcf86cd799439011',
            'vehicle_id': self.test_vehicle_id,
            'odometer_km': 49500,
            'full_tank': True
        }
        
        with patch.object(FillUp, 'get_fillup_by_id') as mock_get:
            mock_get.return_value = existing_fillup
            
            with patch.object(FillUp, 'get_previous_full_tank_fillup') as mock_prev:
                mock_prev.return_value = previous_fillup
                
                # Mock the update result
                mock_result = Mock()
                mock_result.modified_count = 1
                mock_db.fill_ups.update_one.return_value = mock_result
                
                with patch.object(FillUp, 'recalculate_subsequent_fillups') as mock_recalc:
                    update_data = {'odometer_km': 50100, 'liters': 46.0}
                    success = FillUp.update_fillup('507f1f77bcf86cd799439012', update_data)
                    
                    self.assertTrue(success)
                    # Verify recalculation was triggered
                    mock_recalc.assert_called_once_with(self.test_vehicle_id, 50000)

class TestFuelCalculations(unittest.TestCase):
    """Test cases for fuel calculation utilities"""
    
    def test_validate_fillup_data_valid(self):
        """Test validation of valid fill-up data"""
        data = {
            'vehicle_id': '507f1f77bcf86cd799439011',
            'date': '2025-01-15',
            'odometer_km': 50000,
            'liters': 45.5,
            'price_per_liter': 58.50
        }
        
        error = validate_fillup_data(data)
        self.assertIsNone(error)
    
    def test_validate_fillup_data_missing_required(self):
        """Test validation with missing required fields"""
        data = {'vehicle_id': '507f1f77bcf86cd799439011'}
        
        error = validate_fillup_data(data)
        self.assertIsNotNone(error)
        self.assertIn('required', error.lower())
    
    def test_validate_fillup_data_invalid_odometer(self):
        """Test validation with invalid odometer reading"""
        data = {
            'vehicle_id': '507f1f77bcf86cd799439011',
            'date': '2025-01-15',
            'odometer_km': -100,
            'liters': 45.5,
            'price_per_liter': 58.50
        }
        
        error = validate_fillup_data(data)
        self.assertIsNotNone(error)
        self.assertIn('odometer', error.lower())
    
    def test_validate_fillup_data_future_date(self):
        """Test validation with future date"""
        future_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        data = {
            'vehicle_id': '507f1f77bcf86cd799439011',
            'date': future_date,
            'odometer_km': 50000,
            'liters': 45.5,
            'price_per_liter': 58.50
        }
        
        error = validate_fillup_data(data)
        self.assertIsNotNone(error)
        self.assertIn('future', error.lower())
    
    def test_calculate_fuel_economy_valid(self):
        """Test fuel economy calculation with valid data"""
        current_fillup = {
            'odometer_km': 50000,
            'liters': 45.5,
            'full_tank': True
        }
        previous_fillup = {
            'odometer_km': 49500,
            'full_tank': True
        }
        
        economy = calculate_fuel_economy(current_fillup, previous_fillup)
        self.assertEqual(economy, 10.99)  # (50000-49500)/45.5
    
    def test_calculate_fuel_economy_no_previous(self):
        """Test fuel economy calculation without previous fill-up"""
        current_fillup = {
            'odometer_km': 50000,
            'liters': 45.5,
            'full_tank': True
        }
        
        economy = calculate_fuel_economy(current_fillup, None)
        self.assertIsNone(economy)
    
    def test_calculate_fuel_economy_not_full_tank(self):
        """Test fuel economy calculation when not full tank"""
        current_fillup = {
            'odometer_km': 50000,
            'liters': 45.5,
            'full_tank': False
        }
        previous_fillup = {
            'odometer_km': 49500,
            'full_tank': True
        }
        
        economy = calculate_fuel_economy(current_fillup, previous_fillup)
        self.assertIsNone(economy)
    
    def test_calculate_cost_per_km_valid(self):
        """Test cost per kilometer calculation"""
        cost = calculate_cost_per_km(500, 2661.75)
        self.assertEqual(cost, 5.32)  # 2661.75/500
    
    def test_calculate_cost_per_km_zero_distance(self):
        """Test cost per kilometer calculation with zero distance"""
        cost = calculate_cost_per_km(0, 2661.75)
        self.assertIsNone(cost)
    
    @patch.object(FillUp, 'get_fillups_by_vehicle')
    def test_get_fuel_performance_trends_valid(self, mock_get_fillups):
        """Test fuel performance trends calculation"""
        # Mock fill-up data
        mock_fillups = [
            {
                'date': datetime.now() - timedelta(days=10),
                'odometer_km': 50000,
                'liters': 45.5,
                'total_cost': 2661.75,
                'fuel_economy_kmpl': 10.99,
                'cost_per_km': 5.32,
                'full_tank': True
            },
            {
                'date': datetime.now() - timedelta(days=20),
                'odometer_km': 49500,
                'liters': 44.0,
                'total_cost': 2596.00,
                'fuel_economy_kmpl': 11.36,
                'cost_per_km': 5.25,
                'full_tank': True
            }
        ]
        mock_get_fillups.return_value = mock_fillups
        
        trends = get_fuel_performance_trends('507f1f77bcf86cd799439011', days=30)
        
        self.assertIsNotNone(trends)
        self.assertIn('avg_economy', trends)
        self.assertIn('trend_percent', trends)
        self.assertEqual(trends['total_fillups'], 2)
    
    @patch.object(FillUp, 'get_fillups_by_vehicle')
    def test_get_fuel_performance_trends_no_data(self, mock_get_fillups):
        """Test fuel performance trends with no data"""
        mock_get_fillups.return_value = []
        
        trends = get_fuel_performance_trends('507f1f77bcf86cd799439011')
        
        self.assertIsNone(trends)

class TestInsights(unittest.TestCase):
    """Test cases for insights generation"""
    
    @patch('utils.insights.MongoClient')
    def test_generate_fuel_maintenance_insights_declining_economy(self, mock_client):
        """Test fuel-maintenance correlation insights for declining economy"""
        # Mock database client
        mock_db = Mock()
        mock_client.return_value.get_default_database.return_value = mock_db
        
        fuel_trends = {
            'trend_percent': -12.5,  # 12.5% decline
            'avg_cost_per_km': 9.5
        }
        
        due_maintenance = [
            {
                'item': {
                    '_id': '507f1f77bcf86cd799439011',
                    'name': 'Air Filter Replacement',
                    'category': 'Air System'
                },
                'miles_overdue': 1000
            }
        ]
        
        insights = []
        generate_fuel_maintenance_insights(insights, fuel_trends, due_maintenance)
        
        self.assertTrue(len(insights) > 0)
        insight = insights[0]
        self.assertEqual(insight['type'], 'fuel_maintenance_correlation')
        self.assertEqual(insight['severity'], 'warning')
        self.assertIn('declining', insight['message'].lower())
    
    def test_generate_fuel_insights_improvement(self):
        """Test standalone fuel insights for improving economy"""
        fuel_trends = {
            'trend_percent': 18.0,  # 18% improvement
            'avg_cost_per_km': 6.5
        }
        
        insights = []
        generate_fuel_insights(insights, fuel_trends)
        
        self.assertTrue(len(insights) > 0)
        insight = insights[0]
        self.assertEqual(insight['type'], 'fuel_economy_improvement')
        self.assertEqual(insight['severity'], 'success')
    
    def test_generate_maintenance_insights_critical_overdue(self):
        """Test maintenance insights for critical overdue items"""
        due_maintenance = [
            {
                'item': {'name': 'Oil Change'},
                'miles_overdue': 6000  # Over 5000km overdue
            }
        ]
        
        insights = []
        generate_maintenance_insights(insights, due_maintenance)
        
        self.assertTrue(len(insights) > 0)
        insight = insights[0]
        self.assertEqual(insight['type'], 'critical_maintenance_overdue')
        self.assertEqual(insight['severity'], 'error')
    
    def test_calculate_efficiency_rating_excellent(self):
        """Test efficiency rating calculation for excellent performance"""
        stats = {
            'avg_fuel_economy': 16.5,  # Excellent
            'avg_cost_per_km': 4.8      # Excellent
        }
        trends = {
            'trend_percent': 8.0        # Improving
        }
        
        rating = calculate_efficiency_rating(stats, trends)
        
        self.assertEqual(rating['score'], 5)
        self.assertEqual(rating['description'], 'Excellent')
    
    def test_calculate_efficiency_rating_poor(self):
        """Test efficiency rating calculation for poor performance"""
        stats = {
            'avg_fuel_economy': 7.5,   # Poor
            'avg_cost_per_km': 13.5     # Very poor
        }
        trends = {
            'trend_percent': -18.0      # Rapidly declining
        }
        
        rating = calculate_efficiency_rating(stats, trends)
        
        self.assertEqual(rating['score'], 1)
        self.assertEqual(rating['description'], 'Very Poor')
    
    @patch('utils.insights.get_fuel_performance_trends')
    def test_predict_maintenance_needs_declining_economy(self, mock_trends):
        """Test maintenance needs prediction based on declining economy"""
        mock_trends.return_value = {
            'trend_percent': -12.0,
            'avg_cost_per_km': 11.5
        }
        
        predictions = predict_maintenance_needs('507f1f77bcf86cd799439011')
        
        self.assertTrue(len(predictions) > 0)
        prediction = predictions[0]
        self.assertEqual(prediction['type'], 'fuel_system_check')
        self.assertGreater(prediction['confidence'], 0.5)

class TestFuelTrackingIntegration(unittest.TestCase):
    """Integration tests for fuel tracking functionality"""
    
    @patch('utils.fuel_calculations.MongoClient')
    @patch.object(FillUp, 'get_fillups_by_vehicle')
    def test_update_vehicle_fuel_stats_integration(self, mock_get_fillups, mock_client):
        """Test integration of vehicle fuel stats update"""
        # Mock fill-up data
        mock_fillups = [
            {
                'date': datetime.now(),
                'total_cost': 2661.75,
                'fuel_economy_kmpl': 10.99,
                'cost_per_km': 5.32
            }
        ]
        mock_get_fillups.return_value = mock_fillups
        
        # Mock database
        mock_db = Mock()
        mock_client.return_value.get_default_database.return_value = mock_db
        
        update_vehicle_fuel_stats('507f1f77bcf86cd799439011')
        
        # Verify database update was called
        mock_db.vehicles.update_one.assert_called_once()
        call_args = mock_db.vehicles.update_one.call_args[0][1]
        self.assertIn('fuel_stats', call_args['$set'])
    
    @patch('utils.insights.MongoClient')
    @patch('utils.insights.get_fuel_performance_trends')
    @patch.object(FillUp, 'get_fuel_stats')
    def test_get_fuel_performance_summary_integration(self, mock_stats, mock_trends, mock_client):
        """Test integration of fuel performance summary"""
        # Mock stats data
        mock_stats.return_value = {
            'avg_fuel_economy': 12.5,
            'avg_cost_per_km': 7.8,
            'total_fillups': 10
        }
        
        # Mock trends data
        mock_trends.return_value = {
            'trend_percent': 5.0,
            'avg_economy': 12.5
        }
        
        summary = get_fuel_performance_summary('507f1f77bcf86cd799439011')
        
        self.assertIsNotNone(summary)
        self.assertIn('current_stats', summary)
        self.assertIn('performance_trends', summary)
        self.assertIn('efficiency_rating', summary)

if __name__ == '__main__':
    # Run all tests
    unittest.main(verbosity=2)