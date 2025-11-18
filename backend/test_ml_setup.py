"""
Simple test script to verify ML profit prediction setup
Run: python test_ml_setup.py
"""

import os
import sys

def test_imports():
    """Test if all required packages are installed"""
    print("Testing imports...")
    try:
        import pandas as pd
        print("✅ pandas installed")
    except ImportError:
        print("❌ pandas not installed. Run: pip install pandas")
        return False
    
    try:
        import numpy as np
        print("✅ numpy installed")
    except ImportError:
        print("❌ numpy not installed. Run: pip install numpy")
        return False
    
    try:
        import sklearn
        print("✅ scikit-learn installed")
    except ImportError:
        print("❌ scikit-learn not installed. Run: pip install scikit-learn")
        return False
    
    try:
        import joblib
        print("✅ joblib installed")
    except ImportError:
        print("❌ joblib not installed. Run: pip install joblib")
        return False
    
    return True

def test_django_setup():
    """Test if Django is properly configured"""
    print("\nTesting Django setup...")
    try:
        import django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
        django.setup()
        print("✅ Django configured")
        return True
    except Exception as e:
        print(f"❌ Django setup failed: {str(e)}")
        return False

def test_models():
    """Test if models can be imported"""
    print("\nTesting models...")
    try:
        from app.models import Payment, Subscription, Cost, Plan, UserSession
        print("✅ Models imported successfully")
        
        # Check if tables exist
        Payment.objects.count()
        print("✅ Database tables accessible")
        return True
    except Exception as e:
        print(f"❌ Model test failed: {str(e)}")
        return False

def test_command_exists():
    """Test if management command exists"""
    print("\nTesting management command...")
    command_path = os.path.join('app', 'management', 'commands', 'train_profit_model.py')
    if os.path.exists(command_path):
        print(f"✅ Command file exists: {command_path}")
        return True
    else:
        print(f"❌ Command file not found: {command_path}")
        return False

def test_views():
    """Test if views are defined"""
    print("\nTesting views...")
    try:
        from app.views import ProfitPredictionView, ModelTrainingStatusView
        print("✅ ML views imported successfully")
        return True
    except ImportError as e:
        print(f"❌ View import failed: {str(e)}")
        return False

def main():
    print("="*60)
    print("ML Profit Prediction Setup Test")
    print("="*60 + "\n")
    
    tests = [
        ("Import Test", test_imports),
        ("Django Setup", test_django_setup),
        ("Models Test", test_models),
        ("Command Test", test_command_exists),
        ("Views Test", test_views)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} crashed: {str(e)}")
            results.append((test_name, False))
        print()
    
    print("="*60)
    print("Test Summary")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! You're ready to train the model.")
        print("\nNext steps:")
        print("1. Run: python manage.py train_profit_model")
        print("2. Start your server: python manage.py runserver")
        print("3. Access predictions at: http://localhost:8000/api/ml/profit-prediction/")
    else:
        print("\n⚠️ Some tests failed. Please fix the issues above before training.")
    
    print("="*60)

if __name__ == '__main__':
    main()
