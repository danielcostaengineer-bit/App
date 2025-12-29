import requests
import sys
import json
import base64
from datetime import datetime
from PIL import Image
import io

class BodyArchitectAPITester:
    def __init__(self, base_url="https://smartfit-coach-11.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if files:
            # Remove Content-Type for file uploads
            headers.pop('Content-Type', None)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def create_test_image(self):
        """Create a test image with real visual features"""
        # Create a simple test image with visual features
        img = Image.new('RGB', (400, 400), color='white')
        
        # Add some visual features (simple shapes)
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        
        # Draw some shapes to create visual features
        draw.rectangle([50, 50, 150, 150], fill='red', outline='black')
        draw.ellipse([200, 200, 350, 350], fill='blue', outline='black')
        draw.line([0, 0, 400, 400], fill='green', width=5)
        
        # Convert to base64
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG", quality=85)
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return img_base64, buffered.getvalue()

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        test_data = {
            "email": test_email,
            "password": "TestPass123!",
            "name": "Test User"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Registered user: {test_email}")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        # First register a user
        test_email = f"login_test_{datetime.now().strftime('%H%M%S')}@example.com"
        register_data = {
            "email": test_email,
            "password": "TestPass123!",
            "name": "Login Test User"
        }
        
        # Register first
        success, _ = self.run_test(
            "Pre-Login Registration",
            "POST",
            "auth/register",
            200,
            data=register_data
        )
        
        if not success:
            return False
        
        # Now test login
        login_data = {
            "email": test_email,
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            # Update token for subsequent tests
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Logged in user: {test_email}")
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.token:
            self.log_test("Get Current User", False, "No token available")
            return False
        
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        return success and 'email' in response

    def test_photo_upload_analysis(self):
        """Test photo upload and AI analysis"""
        if not self.token:
            self.log_test("Photo Upload Analysis", False, "No token available")
            return False
        
        # Create test image
        img_base64, img_bytes = self.create_test_image()
        
        # Prepare file upload
        files = {
            'file': ('test_image.jpg', io.BytesIO(img_bytes), 'image/jpeg')
        }
        
        success, response = self.run_test(
            "Photo Upload Analysis",
            "POST",
            "analysis/upload",
            200,
            files=files
        )
        
        if success and 'id' in response:
            self.analysis_id = response['id']
            print(f"   Analysis ID: {self.analysis_id}")
            return True
        return False

    def test_get_analysis_history(self):
        """Test getting analysis history"""
        if not self.token:
            self.log_test("Get Analysis History", False, "No token available")
            return False
        
        success, response = self.run_test(
            "Get Analysis History",
            "GET",
            "analysis/history",
            200
        )
        
        return success and isinstance(response, list)

    def test_get_specific_analysis(self):
        """Test getting specific analysis"""
        if not self.token or not hasattr(self, 'analysis_id'):
            self.log_test("Get Specific Analysis", False, "No token or analysis ID available")
            return False
        
        success, response = self.run_test(
            "Get Specific Analysis",
            "GET",
            f"analysis/{self.analysis_id}",
            200
        )
        
        return success and 'muscle_groups' in response

    def test_get_progress_stats(self):
        """Test getting progress statistics"""
        if not self.token:
            self.log_test("Get Progress Stats", False, "No token available")
            return False
        
        success, response = self.run_test(
            "Get Progress Stats",
            "GET",
            "progress/stats",
            200
        )
        
        expected_fields = ['total_analyses', 'current_streak', 'improvement_percentage', 'muscle_development']
        return success and all(field in response for field in expected_fields)

    def test_invalid_auth(self):
        """Test invalid authentication"""
        # Save current token
        original_token = self.token
        self.token = "invalid_token"
        
        success, response = self.run_test(
            "Invalid Auth Test",
            "GET",
            "auth/me",
            401
        )
        
        # Restore original token
        self.token = original_token
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting BodyArchitect AI Backend API Tests")
        print(f"   Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_user_registration,
            self.test_user_login,
            self.test_get_current_user,
            self.test_photo_upload_analysis,
            self.test_get_analysis_history,
            self.test_get_specific_analysis,
            self.test_get_progress_stats,
            self.test_invalid_auth
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ {test.__name__} - EXCEPTION: {str(e)}")
                self.tests_run += 1
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check details above.")
            return 1

def main():
    tester = BodyArchitectAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())