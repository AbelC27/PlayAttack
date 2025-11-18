from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Sum
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from datetime import timedelta
import os
from supabase import create_client
from .models import Plan, Subscription, Payment, Cost, UserSession

User = get_user_model()


class SupabaseConnectionTest(TestCase):
    """Test 1: Verify Supabase database connection and configuration"""
    
    def test_supabase_connection(self):
        """Test that we can connect to Supabase and access the database"""
        from django.conf import settings
        
        # Check that Supabase credentials are configured
        self.assertIsNotNone(settings.SUPABASE_URL, "SUPABASE_URL is not configured")
        self.assertIsNotNone(settings.SUPABASE_KEY, "SUPABASE_KEY is not configured")
        
        # Try to create a Supabase client
        try:
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            
            # Test a simple query - try to fetch plans
            response = supabase.table("app_plan").select("*").limit(1).execute()
            
            # If we get here without exception, connection is successful
            self.assertIsNotNone(response, "Supabase query returned None")
            print(f"✅ Supabase connection successful! Found {len(response.data)} plans")
            
        except Exception as e:
            self.fail(f"Failed to connect to Supabase: {str(e)}")


class UserModelTest(TestCase):
    """Test 2: User model creation and validation"""
    
    def test_user_creation(self):
        """Test creating a user with email and role"""
        user = User.objects.create_user(
            email="testuser@example.com",
            password="testpassword123",
            role="user"
        )
        
        self.assertEqual(user.email, "testuser@example.com")
        self.assertEqual(user.role, "user")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        print(f"✅ User created successfully: {user.email}")
    
    def test_admin_user_creation(self):
        """Test creating an admin user"""
        admin = User.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123"
        )
        
        self.assertEqual(admin.role, "admin")
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        print(f"✅ Admin user created successfully: {admin.email}")


class PlanAPITest(APITestCase):
    """Test 3: Plans API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.client = Client()
        self.plan = Plan.objects.create(
            name="Test Pro Plan",
            price=Decimal("19.99"),
            currency="EUR",
            features="Feature 1, Feature 2, Feature 3"
        )
    
    def test_get_plans(self):
        """Test fetching all plans"""
        response = self.client.get('/api/plans/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.json(), list)
        self.assertGreater(len(response.json()), 0)
        
        # Check plan structure
        plan_data = response.json()[0]
        self.assertIn('id', plan_data)
        self.assertIn('name', plan_data)
        self.assertIn('price', plan_data)
        self.assertIn('currency', plan_data)
        
        print(f"✅ Plans API test passed. Found {len(response.json())} plans")


class PaymentProcessingTest(APITestCase):
    """Test 4: Payment and subscription creation"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email="paymenttest@example.com",
            password="testpass123"
        )
        self.plan = Plan.objects.create(
            name="Premium Plan",
            price=Decimal("29.99"),
            currency="EUR"
        )
    
    def test_payment_creation(self):
        """Test creating a payment record"""
        payment = Payment.objects.create(
            user=self.user,
            plan=self.plan,
            amount=self.plan.price,
            currency=self.plan.currency,
            status='paid',
            transaction_id='test_txn_123456'
        )
        
        self.assertEqual(payment.user, self.user)
        self.assertEqual(payment.plan, self.plan)
        self.assertEqual(payment.status, 'paid')
        self.assertEqual(float(payment.amount), float(self.plan.price))
        
        print(f"✅ Payment created: {payment.amount} {payment.currency}")
    
    def test_subscription_creation(self):
        """Test creating a subscription after payment"""
        subscription = Subscription.objects.create(
            user=self.user,
            plan=self.plan,
            status='active',
            renewal_date=timezone.now() + timedelta(days=30)
        )
        
        self.assertEqual(subscription.user, self.user)
        self.assertEqual(subscription.plan, self.plan)
        self.assertEqual(subscription.status, 'active')
        self.assertIsNotNone(subscription.renewal_date)
        
        print(f"✅ Subscription created: {subscription.plan.name} for {subscription.user.email}")


class UserSessionTrackingTest(TestCase):
    """Test 5: User session tracking and analytics"""
    
    def setUp(self):
        """Set up test user"""
        self.user = User.objects.create_user(
            email="sessiontest@example.com",
            password="testpass123"
        )
    
    def test_session_creation_and_duration(self):
        """Test creating a session and calculating duration"""
        login_time = timezone.now()
        
        # Create session
        session = UserSession.objects.create(
            user=self.user,
            login_time=login_time,
            ip_address='127.0.0.1'
        )
        
        self.assertIsNotNone(session.id)
        self.assertEqual(session.user, self.user)
        self.assertIsNone(session.logout_time)
        
        # Simulate logout after 45 minutes
        logout_time = login_time + timedelta(minutes=45)
        session.logout_time = logout_time
        duration = session.calculate_duration()
        
        self.assertEqual(duration, 45)
        self.assertEqual(session.duration_minutes, 45)
        
        print(f"✅ Session tracking test passed. Duration: {duration} minutes")
    
    def test_multiple_sessions_for_user(self):
        """Test that a user can have multiple sessions"""
        # Create 3 sessions
        for i in range(3):
            UserSession.objects.create(
                user=self.user,
                login_time=timezone.now() - timedelta(days=i),
                logout_time=timezone.now() - timedelta(days=i) + timedelta(hours=2),
                duration_minutes=120
            )
        
        sessions = UserSession.objects.filter(user=self.user)
        self.assertEqual(sessions.count(), 3)
        
        total_minutes = sessions.aggregate(total=Sum('duration_minutes'))['total']
        self.assertEqual(total_minutes, 360)  # 3 sessions × 120 minutes
        
        print(f"✅ Multiple sessions test passed. Total time: {total_minutes} minutes")
