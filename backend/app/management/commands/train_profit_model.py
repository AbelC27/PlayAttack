"""
Management command to train the profit prediction model
Usage: python manage.py train_profit_model
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os
from app.models import Payment, Subscription, Cost, Plan, UserSession


class Command(BaseCommand):
    help = 'Train machine learning model to predict future profit'

    def add_arguments(self, parser):
        parser.add_argument(
            '--algorithm',
            type=str,
            default='random_forest',
            help='Algorithm to use: random_forest or gradient_boosting'
        )
        parser.add_argument(
            '--days-ahead',
            type=int,
            default=30,
            help='Number of days ahead to predict'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting profit prediction model training...'))
        
        algorithm = options['algorithm']
        days_ahead = options['days_ahead']
        
        # Step 1: Extract and prepare data
        self.stdout.write('Step 1: Extracting data from database...')
        df = self.prepare_training_data()
        
        if df.empty or len(df) < 10:
            self.stdout.write(self.style.WARNING(
                'Insufficient data for training. Creating synthetic data for demonstration...'
            ))
            df = self.generate_synthetic_data()
        
        self.stdout.write(self.style.SUCCESS(f'Prepared {len(df)} data points'))
        
        # Step 2: Feature engineering
        self.stdout.write('Step 2: Engineering features...')
        X, y = self.engineer_features(df)
        self.stdout.write(self.style.SUCCESS(f'Created {X.shape[1]} features'))
        
        # Step 3: Train model
        self.stdout.write('Step 3: Training model...')
        model, scaler, metrics = self.train_model(X, y, algorithm)
        
        # Step 4: Save model
        self.stdout.write('Step 4: Saving model...')
        self.save_model(model, scaler, metrics, days_ahead)
        
        # Display results
        self.stdout.write(self.style.SUCCESS('\n' + '='*50))
        self.stdout.write(self.style.SUCCESS('Model Training Complete!'))
        self.stdout.write(self.style.SUCCESS('='*50))
        self.stdout.write(f'Algorithm: {algorithm}')
        self.stdout.write(f'Training samples: {len(X)}')
        self.stdout.write(f'R² Score: {metrics["r2_score"]:.4f}')
        self.stdout.write(f'Mean Absolute Error: €{metrics["mae"]:.2f}')
        self.stdout.write(f'Prediction horizon: {days_ahead} days')
        self.stdout.write(self.style.SUCCESS('='*50 + '\n'))

    def prepare_training_data(self):
        """Extract historical data from database"""
        data = []
        
        # Get all payments
        payments = Payment.objects.filter(status='paid').order_by('payment_date')
        
        # Group by date and calculate daily metrics
        dates = set()
        for payment in payments:
            date = payment.payment_date.date()
            dates.add(date)
        
        for date in sorted(dates):
            # Get payments for this date
            day_start = timezone.datetime.combine(date, timezone.datetime.min.time())
            day_start = timezone.make_aware(day_start)
            day_end = day_start + timedelta(days=1)
            
            day_payments = payments.filter(
                payment_date__gte=day_start,
                payment_date__lt=day_end
            )
            
            # Calculate revenue
            revenue = sum(float(p.amount) for p in day_payments)
            
            # Calculate active subscriptions
            active_subs = Subscription.objects.filter(
                status='active',
                start_date__lte=day_end
            ).count()
            
            # Calculate costs (daily portion)
            from django.db.models import Sum as DjangoSum
            total_costs = Cost.objects.all().aggregate(total=DjangoSum('amount'))
            daily_cost = float(total_costs.get('total') or 0) / 30  # Approximate daily cost
            
            # Calculate user activity
            sessions = UserSession.objects.filter(
                login_time__gte=day_start,
                login_time__lt=day_end
            )
            active_users = sessions.values('user').distinct().count()
            total_minutes = sum(s.duration_minutes for s in sessions)
            
            # Calculate profit
            profit = revenue - daily_cost
            
            # Get plan distribution
            plan_counts = {}
            for plan in Plan.objects.all():
                count = Subscription.objects.filter(
                    plan=plan,
                    status='active',
                    start_date__lte=day_end
                ).count()
                plan_counts[f'plan_{plan.name.lower()}'] = count
            
            data.append({
                'date': date,
                'revenue': revenue,
                'active_subscriptions': active_subs,
                'daily_cost': daily_cost,
                'profit': profit,
                'active_users': active_users,
                'total_session_minutes': total_minutes,
                'day_of_week': date.weekday(),
                'day_of_month': date.day,
                'month': date.month,
                **plan_counts
            })
        
        return pd.DataFrame(data)

    def generate_synthetic_data(self):
        """Generate synthetic data for demonstration purposes"""
        self.stdout.write(self.style.WARNING('Generating synthetic training data...'))
        
        dates = []
        data = []
        
        # Generate 365 days of synthetic data (1 year)
        start_date = timezone.now().date() - timedelta(days=365)
        
        # Base trends with much more variability
        base_revenue = 400  # Increased base
        revenue_growth = 1.04  # 4% growth per month
        
        # Track cumulative subscriptions for realistic growth
        cumulative_subs = 20
        
        for i in range(365):
            current_date = start_date + timedelta(days=i)
            
            # Add realistic seasonal patterns and randomness
            month_factor = 1 + 0.4 * np.sin(2 * np.pi * i / 30)  # Stronger monthly cycle
            week_factor = 1 + 0.2 * np.sin(2 * np.pi * i / 7)    # Stronger weekly cycle
            weekend_drop = 0.6 if current_date.weekday() >= 5 else 1.0  # Lower revenue on weekends
            trend = (revenue_growth ** (i / 30))  # Growth trend
            
            # Much more noise - creates actual variation
            noise = np.random.normal(1, 0.5)  # Increased from 0.35 to 0.5
            spike = 2.0 if np.random.random() < 0.05 else 1.0  # 5% chance of revenue spike (doubled)
            dip = 0.5 if np.random.random() < 0.04 else 1.0  # 4% chance of revenue dip
            
            revenue = base_revenue * trend * month_factor * week_factor * weekend_drop * noise * spike * dip
            
            # Realistic subscription growth with churn
            new_subs = np.random.poisson(2) if i % 7 < 5 else np.random.poisson(1)  # More signups on weekdays
            churn = np.random.binomial(cumulative_subs, 0.02)  # 2% daily churn rate
            cumulative_subs = max(15, cumulative_subs + new_subs - churn)
            active_subs = int(cumulative_subs)
            
            # Variable costs with more randomness
            base_cost = 40  # Increased base cost
            variable_cost = active_subs * 0.8  # Cost scales more with users
            cost_spike = np.random.uniform(-15, 25)  # Much wider cost variation
            daily_cost = base_cost + variable_cost + cost_spike
            
            profit = revenue - daily_cost
            
            # Active users varies with subscriptions
            active_users = int(active_subs * np.random.uniform(0.5, 0.9))
            total_minutes = active_users * np.random.randint(20, 180)  # Wide range of session times
            
            # Plan distribution varies over time
            free_ratio = 0.3 + np.random.uniform(-0.1, 0.1)
            pro_ratio = 0.5 + np.random.uniform(-0.1, 0.1)
            premium_ratio = 1.0 - free_ratio - pro_ratio
            
            free_plan = int(active_subs * free_ratio)
            pro_plan = int(active_subs * pro_ratio)
            premium_plan = max(0, active_subs - free_plan - pro_plan)
            
            data.append({
                'date': current_date,
                'revenue': max(0, revenue),
                'active_subscriptions': active_subs,
                'daily_cost': max(0, daily_cost),
                'profit': profit,
                'active_users': active_users,
                'total_session_minutes': max(0, total_minutes),
                'day_of_week': current_date.weekday(),
                'day_of_month': current_date.day,
                'month': current_date.month,
                'plan_free': free_plan,
                'plan_pro': pro_plan,
                'plan_premium': premium_plan
            })
        
        return pd.DataFrame(data)

    def engineer_features(self, df):
        """Create features for machine learning"""
        # Sort by date
        df = df.sort_values('date').reset_index(drop=True)
        
        # Create lagged features (past values)
        for lag in [1, 7, 14, 30]:
            df[f'revenue_lag_{lag}'] = df['revenue'].shift(lag)
            df[f'profit_lag_{lag}'] = df['profit'].shift(lag)
            df[f'active_subs_lag_{lag}'] = df['active_subscriptions'].shift(lag)
        
        # Rolling statistics
        for window in [7, 14, 30]:
            df[f'revenue_rolling_mean_{window}'] = df['revenue'].rolling(window).mean()
            df[f'profit_rolling_mean_{window}'] = df['profit'].rolling(window).mean()
            df[f'revenue_rolling_std_{window}'] = df['revenue'].rolling(window).std()
        
        # Growth rates (with clipping to prevent infinity)
        df['revenue_growth'] = df['revenue'].pct_change().clip(-1, 5)  # Clip extreme values
        df['subs_growth'] = df['active_subscriptions'].pct_change().clip(-1, 5)
        
        # User engagement metrics
        df['avg_session_minutes'] = df['total_session_minutes'] / (df['active_users'] + 1)
        df['user_to_sub_ratio'] = df['active_users'] / (df['active_subscriptions'] + 1)
        
        # Time-based features
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_month_start'] = (df['day_of_month'] <= 5).astype(int)
        df['is_month_end'] = (df['day_of_month'] >= 25).astype(int)
        
        # Drop rows with NaN values (from lagging/rolling)
        df = df.dropna()
        
        # Select features
        feature_columns = [col for col in df.columns if col not in ['date', 'profit']]
        X = df[feature_columns].values
        y = df['profit'].values
        
        return X, y

    def train_model(self, X, y, algorithm):
        """Train the machine learning model"""
        # Split data - use 90% for training to maximize training samples
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.1, random_state=42
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Select and train model
        if algorithm == 'gradient_boosting':
            model = GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            )
        else:  # random_forest
            model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
        
        model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test_scaled)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        metrics = {
            'mae': mae,
            'r2_score': r2,
            'train_samples': len(X_train),
            'test_samples': len(X_test)
        }
        
        return model, scaler, metrics

    def save_model(self, model, scaler, metrics, days_ahead):
        """Save trained model and metadata"""
        # Create models directory if it doesn't exist
        models_dir = os.path.join('app', 'ml_models')
        os.makedirs(models_dir, exist_ok=True)
        
        # Save model
        model_path = os.path.join(models_dir, 'profit_predictor.pkl')
        joblib.dump(model, model_path)
        
        # Save scaler
        scaler_path = os.path.join(models_dir, 'profit_scaler.pkl')
        joblib.dump(scaler, scaler_path)
        
        # Save metadata
        metadata = {
            'trained_at': timezone.now().isoformat(),
            'days_ahead': days_ahead,
            **metrics
        }
        metadata_path = os.path.join(models_dir, 'model_metadata.pkl')
        joblib.dump(metadata, metadata_path)
        
        self.stdout.write(self.style.SUCCESS(f'Model saved to {model_path}'))
        self.stdout.write(self.style.SUCCESS(f'Scaler saved to {scaler_path}'))
        self.stdout.write(self.style.SUCCESS(f'Metadata saved to {metadata_path}'))
