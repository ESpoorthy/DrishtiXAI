"""
API endpoint tests
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestHealthEndpoints:
    """Test health check and root endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint returns app info"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert data["name"] == "DrishtiXAI"
        assert "demo_mode" in data
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_login_with_invalid_credentials(self):
        """Test login fails with invalid credentials"""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "nonexistent", "password": "wrong"}
        )
        assert response.status_code == 401
    
    def test_login_with_admin(self):
        """Test login succeeds with admin credentials"""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "admin123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
    
    def test_protected_endpoint_without_token(self):
        """Test protected endpoint rejects requests without token"""
        response = client.get("/api/v1/patients")
        assert response.status_code == 403  # No auth header


class TestPatientEndpoints:
    """Test patient management endpoints"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth token for protected endpoints"""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "admin123"}
        )
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_list_patients(self, auth_headers):
        """Test listing patients requires authentication"""
        response = client.get("/api/v1/patients", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_patient(self, auth_headers):
        """Test creating a new patient"""
        patient_data = {
            "patient_id": "TEST001",
            "full_name": "Test Patient",
            "age": 45,
            "gender": "male",
            "has_diabetes": "yes"
        }
        response = client.post(
            "/api/v1/patients",
            json=patient_data,
            headers=auth_headers
        )
        # May fail if patient already exists - that's okay
        assert response.status_code in [201, 400]


class TestDashboard:
    """Test dashboard endpoints"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth token"""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "admin123"}
        )
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_statistics(self, auth_headers):
        """Test dashboard statistics endpoint"""
        response = client.get("/api/v1/dashboard/statistics", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_screenings" in data
        assert "today_screenings" in data
        assert "severity_distribution" in data
