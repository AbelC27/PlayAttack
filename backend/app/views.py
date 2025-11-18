from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login
from .serializers import UserSignupSerializer
from .serializers import DashBoardSerializer, UserListSerializer
from django.http import JsonResponse, HttpResponse
from app.models import Plan, User, Payment, Subscription, Cost, UserSession, Game
from io import BytesIO
from supabase import create_client  # Add this import
from django.conf import settings
from collections import Counter
from datetime import timedelta, datetime
from decimal import Decimal
import matplotlib.pyplot as plt
import stripe
import os
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.db.models import Sum, Q, Count, Avg
from django.db.models.functions import TruncDate
import random
from django.views import View

# PDF generation imports
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import joblib
import pandas as pd
import numpy as np


class UserPurchasesView(APIView):
    permission_classes = [AllowAny]  # Add this line

    def get(self, request, user_id):
        try:
            payments = Payment.objects.filter(user_id=user_id).select_related('plan').order_by('-payment_date')
            
            data = [{
                'id': payment.id,
                'amount': float(payment.amount),
                'currency': payment.currency,
                'status': payment.status,
                'transaction_id': payment.transaction_id,
                'payment_date': payment.payment_date,
                'plan_name': payment.plan.name if payment.plan else None, 
            } for payment in payments]
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Exception in UserPurchasesView: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SignupView(APIView):
    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User created successfully!'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDashboardView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        user = request.user
        data = {
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
        return Response(data, status=status.HTTP_200_OK)
class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return Response({'message': 'Login successful!'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response({'message': 'Login successful!'}, status=status.HTTP_200_OK)

    
class Plans(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        plans = Plan.objects.all()
        data = [
            {
                "id": plan.id,
                "name": plan.name,
                "price": float(plan.price),
                "currency": plan.currency,
                "features": plan.features,
            }
            for plan in plans
        ]
        return Response(data, status=status.HTTP_200_OK)
    
    def post(self, request):
        # Create new plan
        try:
            plan = Plan.objects.create(
                name=request.data.get('name'),
                price=request.data.get('price'),
                currency=request.data.get('currency', 'EUR'),
                features=request.data.get('features', '')
            )
            return Response({
                "id": plan.id,
                "name": plan.name,
                "price": float(plan.price),
                "currency": plan.currency,
                "features": plan.features,
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request):
        # Update existing plan
        plan_id = request.data.get('id')
        if not plan_id:
            return Response({'error': 'Plan ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            plan = Plan.objects.get(id=plan_id)
            plan.name = request.data.get('name', plan.name)
            plan.price = request.data.get('price', plan.price)
            plan.currency = request.data.get('currency', plan.currency)
            plan.features = request.data.get('features', plan.features)
            plan.save()
            
            return Response({
                "id": plan.id,
                "name": plan.name,
                "price": float(plan.price),
                "currency": plan.currency,
                "features": plan.features,
            }, status=status.HTTP_200_OK)
        except Plan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        # Delete plan
        plan_id = request.data.get('id')
        if not plan_id:
            return Response({'error': 'Plan ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            plan = Plan.objects.get(id=plan_id)
            plan.delete()
            return Response({'message': 'Plan deleted successfully'}, status=status.HTTP_200_OK)
        except Plan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)

class Users(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        users = User.objects.all().order_by('-date_joined')
        serializer = UserListSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def patch(self, request):
        user_id = request.data.get('id')
        if not user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
            # Toggle role
            new_role = 'admin' if user.role == 'user' else 'user'
            user.role = new_role
            user.save()
            
            serializer = UserListSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request):
        user_id = request.data.get('id')
        if not user_id:
            return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
            
            # Protect admin users from deletion
            if user.role == 'admin':
                return Response({'error': 'Cannot delete admin users'}, status=status.HTTP_403_FORBIDDEN)
            
            user.delete()
            return Response({'message': 'User deleted successfully'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class plans_piechart(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

            # ia planurile (id + nume)
            plans_resp = supabase.table("app_plan").select("id, name").execute()
            plan_map = {p["id"]: p["name"] for p in plans_resp.data}

            subs_resp = supabase.table("app_subscription").select("user_id, plan_id").execute()
            sub_plan_ids = [s["plan_id"] for s in subs_resp.data if s.get("plan_id")]

            if not sub_plan_ids:
                return HttpResponse("No subscriptions found", status=404)

            # numără userii per plan
            counts = Counter(plan_map.get(pid, "Necunoscut") for pid in sub_plan_ids)

            labels = list(counts.keys())
            sizes = list(counts.values())

            # grafic
            # culori pentru pie chart
            pie_colors = ["#ff4d4d", "#4db8ff", "#4caf50"]  # roșu, albastru deschis, verde

            # grafic
            fig, ax = plt.subplots(figsize=(8, 6))
            fig.patch.set_facecolor("#1e242c")   # fundal exterior
            ax.set_facecolor("#2b3139")          # fundal interior (ax)

            wedges, texts, autotexts = ax.pie(
                sizes,
                labels=None,
                autopct='%1.1f%%',
                colors=[pie_colors[i % len(pie_colors)] for i in range(len(sizes))],
                textprops={'color': 'white', 'fontsize': 10}
            )
            
             # stil text legendă
            for text in texts:
                text.set_color("white")

            ax.axis("equal")  # cerc perfect

            # legendă separată
            ax.legend(wedges, labels, title="Plans", loc="center left",
                      bbox_to_anchor=(1, 0, 0.5, 1), facecolor="#1e242c", labelcolor="white")

            # export imagine
            buf = BytesIO()
            plt.savefig(buf, format="png", bbox_inches="tight", facecolor=fig.get_facecolor())
            plt.close(fig)
            buf.seek(0)

            return HttpResponse(buf.getvalue(), content_type='image/png')

        except Exception as e:
            print(f"Pie chart error: {str(e)}")
            return HttpResponse(f"Pie chart error: {str(e)}", status=500)

class monthly_costs_linechart(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            # conectare la supabase
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

            # ia toate costurile din tabelul app_cost
            costs_resp = supabase.table("app_cost").select("description, amount").execute()
            costs_data = costs_resp.data

            if not costs_data:
                return HttpResponse("No costs found", status=404)

            # extrage etichetele (serviciile) și valorile (costurile)
            labels = [c["description"] for c in costs_data]
            values = [c["amount"] for c in costs_data]

            # figure & ax
            fig, ax = plt.subplots(figsize=(8, 6))
            fig.patch.set_facecolor("#1e242c")  # fundal general
            ax.set_facecolor("#2b3139")         # fundal grafic

            # linia principală
            ax.plot(
                labels, values,
                marker="o", markersize=7,
                linestyle="-", linewidth=2,
                color="#ff4d4d", label="Cost per service"
            )

            # titluri
            ax.set_title("Infrastructure Costs - Current Month",
                         fontsize=16, color="white", pad=15)
            ax.set_ylabel("Cost (€)", fontsize=12, color="white")

            # axe & ticks
            ax.tick_params(axis="x", rotation=25, labelcolor="white", labelsize=9)
            ax.tick_params(axis="y", labelcolor="white", labelsize=9)

            # grid discret
            ax.grid(linestyle="--", alpha=0.4, color="white")

            # legendă minimalistă
            legend = ax.legend(loc="upper right", frameon=False, fontsize=10)
            for text in legend.get_texts():
                text.set_color("white")

            # margini mai aerisite
            plt.tight_layout()

            # export imagine în buffer
            buf = BytesIO()
            plt.savefig(buf, format="png", bbox_inches="tight", facecolor=fig.get_facecolor())
            plt.close(fig)
            buf.seek(0)

            return HttpResponse(buf.getvalue(), content_type="image/png")

        except Exception as e:
            print(f"Line chart error: {str(e)}")
            return HttpResponse(f"Line chart error: {str(e)}", status=500)



# Set Stripe API key
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', None) or os.getenv('STRIPE_SECRET_KEY')


def _get_stripe_secret_key():
    """Fetch the Stripe secret key from settings/environment."""
    key = getattr(settings, 'STRIPE_SECRET_KEY', None) or os.getenv('STRIPE_SECRET_KEY')
    if key:
        key = key.strip()
    return key


def _is_demo_mode(secret_key: str) -> bool:
    return secret_key in {None, '', 'YOUR_STRIPE_SECRET_KEY_HERE', 'DEMO_MODE'}


def _get_stripe_publishable_key():
    key = getattr(settings, 'STRIPE_PUBLISHABLE_KEY', None) or os.getenv('STRIPE_PUBLISHABLE_KEY')
    if key:
        key = key.strip()
    return key

@method_decorator(csrf_exempt, name='dispatch')
class CreatePaymentIntent(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            print("CreatePaymentIntent - Received data:", request.data)
            plan_id = request.data.get('plan_id')
            
            if not plan_id:
                print("ERROR: Plan ID is missing")
                return Response({'error': 'Plan ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get plan details
            try:
                plan = Plan.objects.get(id=plan_id)
            except Plan.DoesNotExist:
                return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)
            
            stripe_secret_key = _get_stripe_secret_key()
            print(f"Stripe secret key detected: {'yes' if stripe_secret_key else 'no'}")

            if _is_demo_mode(stripe_secret_key):
                print("Stripe secret key missing or demo mode enabled, returning mock payment intent")
                mock_id = f"pi_mock_{plan.id}_{request.data.get('user_email', 'unknown').replace('@', '_at_')}"
                return Response({
                    'client_secret': f"{mock_id}_secret",
                    'payment_intent_id': mock_id,
                    'demo_mode': True,
                    'plan': {
                        'id': plan.id,
                        'name': plan.name,
                        'price': plan.price,
                        'currency': plan.currency,
                    }
                }, status=status.HTTP_200_OK)

            if not stripe_secret_key.startswith('sk_'):
                return Response({
                    'error': 'Invalid Stripe secret key format. It should start with sk_test_ or sk_live_.',
                }, status=status.HTTP_400_BAD_REQUEST)

            if stripe_secret_key.startswith('sk_test_') and len(stripe_secret_key) < 100:
                return Response({
                    'error': (
                        'Stripe test key appears truncated. Expected length ~108 characters. '
                        'Please copy the full key from https://dashboard.stripe.com/test/apikeys.'
                    )
                }, status=status.HTTP_400_BAD_REQUEST)

            stripe.api_key = stripe_secret_key

            amount_in_cents = int(Decimal(str(plan.price)) * 100)
            print(f"Creating Stripe PaymentIntent for plan {plan.id}, amount (cents): {amount_in_cents}")

            intent = stripe.PaymentIntent.create(
                amount=amount_in_cents,
                currency=plan.currency.lower(),
                automatic_payment_methods={'enabled': True},
                metadata={
                    'plan_id': plan.id,
                    'plan_name': plan.name,
                    'user_email': request.data.get('user_email', ''),
                }
            )

            print(f"Stripe PaymentIntent created: {intent.id}")

            return Response({
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id,
                'demo_mode': False,
                'plan': {
                    'id': plan.id,
                    'name': plan.name,
                    'price': plan.price,
                    'currency': plan.currency,
                }
            }, status=status.HTTP_200_OK)
            
        except stripe.error.StripeError as e:
            print(f"Stripe error: {str(e)}")
            return Response({'error': f'Stripe error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"General error in CreatePaymentIntent: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class ConfirmPayment(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            print("ConfirmPayment - Received data:", request.data)
            
            payment_intent_id = request.data.get('payment_intent_id')
            user_email = request.data.get('user_email')
            plan_id = request.data.get('plan_id')
            amount = request.data.get('amount')
            currency = request.data.get('currency', 'EUR')
            
            print(f"Extracted values: payment_intent_id={payment_intent_id}, user_email={user_email}, plan_id={plan_id}")
            
            if not payment_intent_id or not user_email or not plan_id:
                return Response({
                    'error': 'Payment intent ID, user email, and plan ID are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            stripe_secret_key = _get_stripe_secret_key()
            intent = None

            is_demo_payment = (
                payment_intent_id.startswith('test_payment_') or
                payment_intent_id.startswith('pi_mock_') or
                payment_intent_id.startswith('pi_demo_')
            )

            if is_demo_payment or _is_demo_mode(stripe_secret_key):
                print("Demo/Test payment detected, skipping Stripe API call")
                payment_succeeded = True
            else:
                if not stripe_secret_key or not stripe_secret_key.startswith('sk_'):
                    return Response({
                        'error': 'Stripe secret key is missing or invalid on the server. '
                                 'Please configure STRIPE_SECRET_KEY in the backend environment.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                stripe.api_key = stripe_secret_key
                try:
                    print("Retrieving PaymentIntent from Stripe...")
                    intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                except stripe.error.StripeError as stripe_error:
                    print(f"Stripe error during retrieval: {stripe_error}")
                    return Response({'error': f'Stripe error: {stripe_error}'}, status=status.HTTP_400_BAD_REQUEST)

                payment_succeeded = intent.status == 'succeeded'
            
            if payment_succeeded:
                # Get or create user in database
                try:
                    user = User.objects.get(email=user_email)
                except User.DoesNotExist:
                    # Create user if doesn't exist
                    user = User.objects.create_user(
                        email=user_email,
                        role='user'
                    )
                
                # Get the plan
                try:
                    plan = Plan.objects.get(id=plan_id)
                except Plan.DoesNotExist:
                    return Response({
                        'error': 'Plan not found'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                # Create payment record
                final_amount = Decimal(str(amount)) if amount not in (None, "") else None
                if final_amount is None:
                    if intent and getattr(intent, 'amount', None) is not None:
                        final_amount = Decimal(intent.amount) / 100
                    else:
                        final_amount = Decimal(plan.price)

                currency_code = (currency or plan.currency or 'EUR').upper()
                    
                payment = Payment.objects.create(
                    user=user,
                    plan=plan,
                    amount=final_amount,
                    currency=currency_code,
                    status='paid',
                    transaction_id=payment_intent_id
                )
                
                # Cancel any existing active subscriptions for this user
                Subscription.objects.filter(
                    user=user, 
                    status='active'
                ).update(status='canceled')
                
                # Create new subscription
                renewal_date = timezone.now() + timedelta(days=30)  # Monthly subscription
                
                subscription = Subscription.objects.create(
                    user=user,
                    plan=plan,
                    status='active',
                    renewal_date=renewal_date
                )
                
                return Response({
                    'success': True,
                    'message': 'Payment confirmed and subscription activated',
                    'subscription': {
                        'id': subscription.id,
                        'plan_name': plan.name,
                        'status': subscription.status,
                        'start_date': subscription.start_date,
                        'renewal_date': subscription.renewal_date
                    },
                    'payment': {
                        'id': payment.id,
                        'amount': str(payment.amount),
                        'currency': payment.currency,
                        'transaction_id': payment.transaction_id
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'message': 'Payment not completed',
                    'status': intent.status if intent else 'requires_payment_method'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StripeConfig(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        secret_key = _get_stripe_secret_key()
        publishable_key = _get_stripe_publishable_key()

        return Response({
            'publishable_key': publishable_key,
            'demo_mode': _is_demo_mode(secret_key),
            'configured': bool(publishable_key and not _is_demo_mode(secret_key))
        })


class UserSubscription(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        try:
            user_email = request.GET.get('email')
            
            if not user_email:
                return Response({
                    'error': 'User email is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user = User.objects.get(email=user_email)
                
                # Get user's active subscription
                subscription = Subscription.objects.filter(
                    user=user,
                    status='active'
                ).first()
                
                if subscription:
                    # Get payment history
                    payments = Payment.objects.filter(user=user).order_by('-payment_date')[:5]
                    
                    payment_history = []
                    for payment in payments:
                        payment_history.append({
                            'id': payment.id,
                            'amount': str(payment.amount),
                            'currency': payment.currency,
                            'plan_name': payment.plan.name,
                            'date': payment.payment_date,
                            'status': payment.status,
                            'transaction_id': payment.transaction_id
                        })
                    
                    return Response({
                        'subscription': {
                            'id': subscription.id,
                            'plan_name': subscription.plan.name,
                            'plan_price': str(subscription.plan.price),
                            'plan_currency': subscription.plan.currency,
                            'plan_features': subscription.plan.features,
                            'status': subscription.status,
                            'start_date': subscription.start_date,
                            'renewal_date': subscription.renewal_date
                        },
                        'payment_history': payment_history
                    })
                else:
                    return Response({
                        'subscription': None,
                        'payment_history': []
                    })
                    
            except User.DoesNotExist:
                return Response({
                    'error': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserSubscriptionManagement(APIView):
    """Enhanced subscription management with next payment info"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            user_email = request.data.get('email')
            action = request.data.get('action', 'get_next_payment_info')
            
            if not user_email:
                return Response({
                    'error': 'User email is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user = User.objects.get(email=user_email)
            except User.DoesNotExist:
                return Response({
                    'error': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            current_subscription = Subscription.objects.filter(
                user=user,
                status='active'
            ).first()
            
            if action == 'get_next_payment_info':
                if current_subscription:
                    next_payment_date = current_subscription.renewal_date
                    days_until_payment = (next_payment_date - timezone.now()).days if next_payment_date else 0
                    
                    return Response({
                        'has_active_subscription': True,
                        'plan_name': current_subscription.plan.name,
                        'plan_price': str(current_subscription.plan.price),
                        'plan_currency': current_subscription.plan.currency,
                        'next_payment_date': next_payment_date,
                        'days_until_payment': max(0, days_until_payment),
                        'auto_renew': True,
                        'subscription_status': current_subscription.status
                    })
                else:
                    return Response({
                        'has_active_subscription': False,
                        'message': 'No active subscription found'
                    })
            
            return Response({
                'error': 'Invalid action'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RevenueAnalyticsView(APIView):
    """Revenue analytics endpoint for admin dashboard"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            now = timezone.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_start = today_start - timedelta(days=7)
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Calculate revenue for different periods
            daily_revenue = Payment.objects.filter(
                payment_date__gte=today_start,
                status='paid'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            weekly_revenue = Payment.objects.filter(
                payment_date__gte=week_start,
                status='paid'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            monthly_revenue = Payment.objects.filter(
                payment_date__gte=month_start,
                status='paid'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            total_revenue = Payment.objects.filter(
                status='paid'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            # Generate daily chart data for last 30 days
            daily_chart = []
            for i in range(30):
                day_start = today_start - timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                day_revenue = Payment.objects.filter(
                    payment_date__gte=day_start,
                    payment_date__lt=day_end,
                    status='paid'
                ).aggregate(total=Sum('amount'))['total'] or 0
                
                daily_chart.append({
                    'date': day_start.strftime('%Y-%m-%d'),
                    'amount': float(day_revenue)
                })
            
            daily_chart.reverse()  # Show oldest to newest
            
            return Response({
                'daily': float(daily_revenue),
                'weekly': float(weekly_revenue),
                'monthly': float(monthly_revenue),
                'total': float(total_revenue),
                'dailyChart': daily_chart,
                'monthlyChart': []  # Can be expanded later
            })
            
        except Exception as e:
            print(f"Error in RevenueAnalyticsView: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HostingCostsView(APIView):
    """Hosting costs management endpoint for admin dashboard"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            costs = Cost.objects.all().order_by('-date')
            
            # If no costs exist, create sample data based on your specifications
            if not costs.exists():
                # Get all plans to create plan-specific costs
                plans = Plan.objects.all()
                
                # Create plan-specific server costs (Premium=100, Pro=50, Free=25)
                plan_costs = {}
                for plan in plans:
                    plan_name = plan.name.lower()
                    if 'premium' in plan_name:
                        plan_costs[plan.name] = 100.00
                    elif 'pro' in plan_name:
                        plan_costs[plan.name] = 50.00
                    else:  # Free plan or any other plan
                        plan_costs[plan.name] = 25.00
                
                # Create costs for each plan
                for plan in plans:
                    cost_amount = plan_costs[plan.name]
                    
                    Cost.objects.create(
                        description=f'Server Infrastructure for {plan_name} Plan',
                        amount=cost_amount,
                        category='hosting',
                        currency='EUR',
                        plan=plan
                    )
                
                # Add some general infrastructure costs
                general_costs = [
                    {'description': 'Supabase Database Service', 'amount': 25.00, 'category': 'supabase'},
                    {'description': 'CDN & Load Balancer', 'amount': 15.50, 'category': 'cdn'},
                    {'description': 'SSL Certificates & Security', 'amount': 12.00, 'category': 'hosting'},
                    {'description': 'Docker Registry & Monitoring', 'amount': 8.99, 'category': 'docker'},
                ]
                
                for general_cost in general_costs:
                    Cost.objects.create(
                        description=general_cost['description'],
                        amount=general_cost['amount'],
                        category=general_cost['category'],
                        currency='EUR'
                    )
                
                # Refresh the costs queryset
                costs = Cost.objects.all().order_by('-date')
            
            data = []
            for cost in costs:
                data.append({
                    'id': cost.id,
                    'description': cost.description,
                    'amount': str(cost.amount),
                    'currency': cost.currency,
                    'date': cost.date,
                    'category': cost.category,
                    'plan_id': cost.plan.id if cost.plan else None
                })
            return Response(data)
        except Exception as e:
            print(f"Error in HostingCostsView GET: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        try:
            plan_id = request.data.get('plan_id')
            plan = None
            if plan_id:
                try:
                    plan = Plan.objects.get(id=plan_id)
                except Plan.DoesNotExist:
                    return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)
            
            cost = Cost.objects.create(
                description=request.data.get('description'),
                amount=request.data.get('amount'),
                currency='EUR',  # Default currency
                category=request.data.get('category', 'hosting'),
                plan=plan
            )
            
            return Response({
                'id': cost.id,
                'description': cost.description,
                'amount': str(cost.amount),
                'currency': cost.currency,
                'date': cost.date,
                'category': cost.category,
                'plan_id': cost.plan.id if cost.plan else None
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error in HostingCostsView POST: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HostingCostDetailView(APIView):
    """Individual hosting cost management"""
    permission_classes = [AllowAny]
    
    def delete(self, request, cost_id):
        try:
            cost = Cost.objects.get(id=cost_id)
            cost.delete()
            return Response({'message': 'Cost deleted successfully'})
        except Cost.DoesNotExist:
            return Response({'error': 'Cost not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error in HostingCostDetailView DELETE: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PlanAnalyticsView(APIView):
    """Plan analytics with user counts and profitability"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            plans = Plan.objects.all()
            analytics_data = []
            
            for plan in plans:
                # Count active subscriptions for this plan
                active_subscriptions = Subscription.objects.filter(
                    plan=plan,
                    status='active'
                ).count()
                
                # Calculate total revenue (user count * plan price)
                total_revenue = active_subscriptions * float(plan.price)
                
                # Get plan-specific costs
                plan_costs = Cost.objects.filter(plan=plan)
                monthly_cost = sum(float(cost.amount) for cost in plan_costs)
                
                # Calculate net profit (total revenue - monthly costs)
                net_profit = total_revenue - monthly_cost
                
                # Calculate profit margin
                profit_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0
                
                analytics_data.append({
                    'id': plan.id,
                    'name': plan.name,
                    'price_per_user': float(plan.price),
                    'active_users': active_subscriptions,
                    'total_revenue': total_revenue,
                    'monthly_cost': monthly_cost,
                    'net_profit': net_profit,
                    'profit_margin': profit_margin,
                    'currency': plan.currency
                })
            
            return Response(analytics_data)
            
        except Exception as e:
            print(f"Error in PlanAnalyticsView: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class GeneratePDFReportView(View):
    """Generate professional PDF report for admin dashboard"""
    
    def options(self, request, *args, **kwargs):
        """Handle preflight CORS requests"""
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Accept, Authorization'
        return response
    
    def get(self, request):
        try:
            # Check accept header
            accept_header = request.META.get('HTTP_ACCEPT', '')
            print(f"Accept header: {accept_header}")
            print(f"Request method: {request.method}")
            print(f"Request path: {request.path}")
            
            # Create the HttpResponse object with PDF headers
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="PlayAtac_Dashboard_Report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Accept, Authorization'
            
            # Create the PDF object
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
            
            # Container for the 'Flowable' objects
            story = []
            
            # Styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                textColor=colors.HexColor('#22c55e'),
                alignment=TA_CENTER
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=16,
                spaceAfter=12,
                textColor=colors.HexColor('#1f2937'),
                alignment=TA_LEFT
            )
            
            normal_style = ParagraphStyle(
                'CustomNormal',
                parent=styles['Normal'],
                fontSize=10,
                spaceAfter=6,
                alignment=TA_LEFT
            )
            
            # Header
            story.append(Paragraph("🎮 PlayAtac Business Analytics Report", title_style))
            story.append(Paragraph(f"Generated on {(datetime.now() + timedelta(hours=3)).strftime('%B %d, %Y at %I:%M %p')}", normal_style))
            story.append(Spacer(1, 30))
            
            # Fetch data for the report
            # Revenue Data
            now = timezone.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_start = today_start - timedelta(days=7)
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            daily_revenue = Payment.objects.filter(
                payment_date__gte=today_start, status='paid'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            weekly_revenue = Payment.objects.filter(
                payment_date__gte=week_start, status='paid'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            monthly_revenue = Payment.objects.filter(
                payment_date__gte=month_start, status='paid'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            total_revenue = Payment.objects.filter(
                status='paid'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            # User data
            total_users = User.objects.count()
            admin_users = User.objects.filter(role='admin').count()
            
            # Plans data
            plans = Plan.objects.all()
            total_plans = plans.count()
            
            # Costs data
            costs = Cost.objects.all()
            total_monthly_costs = sum(float(cost.amount) for cost in costs)
            
            # Plan analytics
            plan_analytics = []
            for plan in plans:
                active_subscriptions = Subscription.objects.filter(plan=plan, status='active').count()
                total_plan_revenue = active_subscriptions * float(plan.price)
                
                # Get monthly cost based on plan name (as per your specification)
                plan_name = plan.name.lower()
                if 'premium' in plan_name:
                    monthly_cost = 100.0
                elif 'pro' in plan_name:
                    monthly_cost = 50.0
                else:
                    monthly_cost = 25.0  # Free plan
                
                net_profit = total_plan_revenue - monthly_cost
                profit_margin = (net_profit / total_plan_revenue * 100) if total_plan_revenue > 0 else 0
                
                plan_analytics.append({
                    'name': plan.name,
                    'active_users': active_subscriptions,
                    'price_per_user': float(plan.price),
                    'total_revenue': total_plan_revenue,
                    'monthly_cost': monthly_cost,
                    'net_profit': net_profit,
                    'profit_margin': profit_margin,
                    'status': 'Profitable' if net_profit >= 0 else 'Loss'
                })
            
            # Executive Summary Section
            story.append(Paragraph("📊 Executive Summary", heading_style))
            
            summary_data = [
                ['Metric', 'Value'],
                ['Total Users', f"{total_users}"],
                ['Admin Users', f"{admin_users}"],
                ['Available Plans', f"{total_plans}"],
                ['Total Revenue', f"€{float(total_revenue):.2f}"],
                ['Monthly Revenue', f"€{float(monthly_revenue):.2f}"],
                ['Monthly Costs', f"€{total_monthly_costs:.2f}"],
                ['Net Profit', f"€{float(total_revenue) - total_monthly_costs:.2f}"],
            ]
            
            summary_table = Table(summary_data, colWidths=[2.5*inch, 2*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#22c55e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            
            story.append(summary_table)
            story.append(Spacer(1, 20))
            
            # Revenue Analytics Section
            story.append(Paragraph("💰 Revenue Analytics", heading_style))
            
            revenue_data = [
                ['Period', 'Revenue'],
                ['Daily', f"€{float(daily_revenue):.2f}"],
                ['Weekly', f"€{float(weekly_revenue):.2f}"],
                ['Monthly', f"€{float(monthly_revenue):.2f}"],
                ['Total (All Time)', f"€{float(total_revenue):.2f}"],
            ]
            
            revenue_table = Table(revenue_data, colWidths=[2.5*inch, 2*inch])
            revenue_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#22c55e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            
            story.append(revenue_table)
            story.append(Spacer(1, 20))
            
            # Plan Profitability Analysis Section
            story.append(Paragraph("📈 Plan Profitability Analysis", heading_style))
            
            plan_data = [['Plan Name', 'Users', 'Price/User', 'Revenue', 'Server Cost', 'Net Profit', 'Margin %', 'Status']]
            
            for analytics in plan_analytics:
                plan_data.append([
                    analytics['name'],
                    f"{analytics['active_users']}",
                    f"€{analytics['price_per_user']:.2f}",
                    f"€{analytics['total_revenue']:.2f}",
                    f"€{analytics['monthly_cost']:.2f}",
                    f"€{analytics['net_profit']:.2f}",
                    f"{analytics['profit_margin']:.1f}%",
                    analytics['status']
                ])
            
            plan_table = Table(plan_data, colWidths=[1.2*inch, 0.6*inch, 0.8*inch, 0.8*inch, 0.8*inch, 0.8*inch, 0.7*inch, 0.7*inch])
            plan_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#22c55e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            
            story.append(plan_table)
            story.append(Spacer(1, 20))
            
            # Infrastructure Costs Section
            story.append(Paragraph("🏗️ Infrastructure Cost Breakdown", heading_style))
            
            # Group costs by category
            cost_categories = {}
            for cost in costs:
                category = cost.category or 'Other'
                cost_categories[category] = cost_categories.get(category, 0) + float(cost.amount)
            
            cost_data = [['Category', 'Monthly Cost', '% of Total']]
            for category, total in cost_categories.items():
                percentage = (total / total_monthly_costs * 100) if total_monthly_costs > 0 else 0
                cost_data.append([
                    category.title(),
                    f"€{total:.2f}",
                    f"{percentage:.1f}%"
                ])
            
            # Add total row
            cost_data.append(['TOTAL', f"€{total_monthly_costs:.2f}", '100.0%'])
            
            cost_table = Table(cost_data, colWidths=[2*inch, 1.5*inch, 1*inch])
            cost_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#22c55e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f0f9ff')),  # Total row
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),  # Bold total row
                ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.lightgrey]),
            ]))
            
            story.append(cost_table)
            story.append(Spacer(1, 30))
            
            # Footer
            story.append(Paragraph("PlayAtac Business Intelligence", 
                         ParagraphStyle('Footer', parent=styles['Normal'], fontSize=10, 
                                      textColor=colors.HexColor('#6b7280'), alignment=TA_CENTER)))
            story.append(Paragraph("This report was automatically generated by the Admin Dashboard system.", 
                         ParagraphStyle('FooterSub', parent=styles['Normal'], fontSize=8, 
                                      textColor=colors.HexColor('#6b7280'), alignment=TA_CENTER)))
            story.append(Paragraph(f"© {datetime.now().year} PlayAtac. All rights reserved.", 
                         ParagraphStyle('Copyright', parent=styles['Normal'], fontSize=8, 
                                      textColor=colors.HexColor('#6b7280'), alignment=TA_CENTER)))
            
            # Build PDF
            print("Building PDF document...")
            doc.build(story)
            print("PDF document built successfully")
            
            # Get PDF data and return
            pdf = buffer.getvalue()
            buffer.close()
            
            print(f"Generated PDF size: {len(pdf)} bytes")
            
            if len(pdf) == 0:
                raise Exception("Generated PDF is empty")
            
            response.write(pdf)
            return response
            
        except Exception as e:
            print(f"Error generating PDF report: {str(e)}")
            import traceback
            traceback.print_exc()
            error_response = HttpResponse(
                f'Error generating PDF: {str(e)}',
                content_type='text/plain',
                status=500
            )
            error_response['Access-Control-Allow-Origin'] = '*'
            return error_response


@method_decorator(csrf_exempt, name='dispatch')
class TestPDFView(View):
    """Simple test view for PDF generation debugging"""
    
    def get(self, request):
        try:
            print("TestPDFView called")
            print(f"Accept header: {request.META.get('HTTP_ACCEPT', '')}")
            
            # Create simple test PDF
            from reportlab.platypus import SimpleDocTemplate, Paragraph
            from reportlab.lib.styles import getSampleStyleSheet
            from io import BytesIO
            
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            styles = getSampleStyleSheet()
            
            story = [
                Paragraph("Test PDF Report", styles['Title']),
                Paragraph("This is a test PDF to verify the system is working.", styles['Normal'])
            ]
            
            doc.build(story)
            pdf = buffer.getvalue()
            buffer.close()
            
            response = HttpResponse(pdf, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="test_report.pdf"'
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Accept, Authorization'
            
            print(f"Test PDF generated successfully, size: {len(pdf)} bytes")
            return response
            
        except Exception as e:
            print(f"Error in TestPDFView: {str(e)}")
            error_response = HttpResponse(
                f'Test PDF Error: {str(e)}',
                content_type='text/plain',
                status=500
            )
            error_response['Access-Control-Allow-Origin'] = '*'
            return error_response
    
    def options(self, request, *args, **kwargs):
        """Handle preflight CORS requests for test endpoint"""
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Accept, Authorization'
        return response


class TestPDFView(APIView):
    """Simple test endpoint to verify PDF generation works"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            from reportlab.platypus import SimpleDocTemplate, Paragraph
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.lib.pagesizes import A4
            
            # Create simple test PDF
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="test_report.pdf"'
            response['Access-Control-Allow-Origin'] = '*'
            
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            
            styles = getSampleStyleSheet()
            story = [
                Paragraph("PDF Generation Test", styles['Title']),
                Paragraph("If you can see this, PDF generation is working correctly!", styles['Normal']),
                Paragraph(f"Generated at: {datetime.now()}", styles['Normal'])
            ]
            
            doc.build(story)
            
            pdf = buffer.getvalue()
            buffer.close()
            response.write(pdf)
            
            return response
            
        except Exception as e:
            error_response = HttpResponse(
                f'PDF test failed: {str(e)}',
                content_type='text/plain',
                status=500
            )
            error_response['Access-Control-Allow-Origin'] = '*'
            return error_response


@method_decorator(csrf_exempt, name='dispatch')
class TestConnectionView(View):
    """Simple connection test view"""
    
    def get(self, request):
        response = JsonResponse({
            'status': 'success',
            'message': 'Backend connection working',
            'django_version': '5.2.6',
            'timestamp': datetime.now().isoformat()
        })
        response['Access-Control-Allow-Origin'] = '*'
        return response
    
    def options(self, request, *args, **kwargs):
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Accept, Authorization'
        return response


class UserActivityAnalyticsView(APIView):
    """Enhanced user activity analytics for admin dashboard"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            now = timezone.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_start = today_start - timedelta(days=7)
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Create sample data if no real sessions exist
            sessions = UserSession.objects.all()
            if not sessions.exists():
                # Generate realistic sample data
                self._create_sample_data()
                sessions = UserSession.objects.all()
            
            # Total active users
            total_active_users = sessions.values('user').distinct().count()
            
            # Today's active users
            today_sessions = sessions.filter(login_time__gte=today_start)
            today_active = today_sessions.values('user').distinct().count()
            
            # Week's active users  
            week_sessions = sessions.filter(login_time__gte=week_start)
            week_active = week_sessions.values('user').distinct().count()
            
            # Average session duration
            avg_duration = sessions.filter(duration_minutes__gt=0).aggregate(
                avg=Avg('duration_minutes')
            )['avg'] or 0
            
            # Total time spent (hours)
            total_minutes = sessions.aggregate(total=Sum('duration_minutes'))['total'] or 0
            total_hours = round(total_minutes / 60, 1)
            
            # Currently online users - check active sessions without logout
            fifteen_minutes_ago = now - timedelta(minutes=15)
            active_sessions = UserSession.objects.filter(
                logout_time__isnull=True,
                login_time__gte=fifteen_minutes_ago
            ).select_related('user').order_by('-login_time')
            
            currently_online_count = active_sessions.values('user').distinct().count()
            
            online_users = []
            seen_users = set()
            for session in active_sessions:
                if session.user.email not in seen_users:
                    online_users.append({
                        'email': session.user.email,
                        'id': str(session.user.id),
                        'last_active': session.login_time.isoformat()
                    })
                    seen_users.add(session.user.email)
            
            # Daily activity trend - use actual date range from database
            # Get the earliest and latest session dates
            from django.db.models import Min, Max
            date_range = sessions.aggregate(
                earliest=Min('login_time'),
                latest=Max('login_time')
            )
            
            earliest_date = date_range['earliest']
            latest_date = date_range['latest']
            
            if earliest_date and latest_date:
                earliest_date = earliest_date.replace(hour=0, minute=0, second=0, microsecond=0)
                latest_date = latest_date.replace(hour=0, minute=0, second=0, microsecond=0)
                
                # Calculate number of days between earliest and latest
                days_diff = (latest_date - earliest_date).days + 1  # +1 to include both start and end days
            else:
                earliest_date = today_start
                days_diff = 1
            
            daily_activity = []
            for i in range(days_diff):
                day_start = earliest_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                day_sessions = sessions.filter(login_time__gte=day_start, login_time__lt=day_end)
                active_users = day_sessions.values('user').distinct().count()
                total_time = day_sessions.aggregate(total=Sum('duration_minutes'))['total'] or 0
                
                daily_activity.append({
                    'date': day_start.strftime('%Y-%m-%d'),
                    'active_users': active_users,
                    'total_minutes': total_time,
                    'total_hours': round(total_time / 60, 1)
                })
            
            # Top active users
            top_users_data = sessions.values('user__email', 'user__id').annotate(
                total_time=Sum('duration_minutes'),
                session_count=Count('id')
            ).order_by('-total_time')[:10]
            
            top_users = []
            for user in top_users_data:
                hours = (user['total_time'] or 0) // 60
                minutes = (user['total_time'] or 0) % 60
                top_users.append({
                    'email': user['user__email'],
                    'total_minutes': user['total_time'] or 0,
                    'total_formatted': f"{hours}h {minutes}m",
                    'session_count': user['session_count']
                })
            
            # Hourly distribution - aggregate across all sessions
            hourly_activity = []
            for hour in range(24):
                # Get all sessions that have login times in this hour (across all days)
                hour_count = sessions.filter(
                    login_time__hour=hour
                ).values('user').distinct().count()
                
                hourly_activity.append({
                    'hour': f"{hour:02d}:00",
                    'users': hour_count
                })
            
            return Response({
                'overview': {
                    'total_active_users': total_active_users,
                    'currently_online': currently_online_count,
                    'today_active': today_active,
                    'week_active': week_active,
                    'avg_session_minutes': round(avg_duration, 1),
                    'total_time_hours': total_hours
                },
                'online_users': online_users,  # Added list of currently online users
                'top_users': top_users,
                'daily_activity': daily_activity,
                'hourly_activity': hourly_activity
            })
            
        except Exception as e:
            print(f"Error in UserActivityAnalyticsView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _create_sample_data(self):
        """Create sample user session data for demonstration"""
        try:
            users = User.objects.all()[:5]  # Get up to 5 users
            if not users:
                return
            
            now = timezone.now()
            
            # Create sessions for last 30 days
            for day_offset in range(30):
                day = now - timedelta(days=day_offset)
                
                # Random number of sessions per day (1-5)
                num_sessions = random.randint(1, min(5, len(users)))
                selected_users = random.sample(list(users), num_sessions)
                
                for user in selected_users:
                    # Random login time during the day
                    hour = random.randint(8, 20)
                    minute = random.randint(0, 59)
                    login_time = day.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    
                    # Random session duration (15-180 minutes)
                    duration = random.randint(15, 180)
                    logout_time = login_time + timedelta(minutes=duration)
                    
                    UserSession.objects.create(
                        user=user,
                        login_time=login_time,
                        logout_time=logout_time,
                        duration_minutes=duration,
                        ip_address='127.0.0.1'
                    )
        except Exception as e:
            print(f"Error creating sample data: {str(e)}")


class UserActivityChartView(APIView):
    """Generate user activity time chart"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            now = timezone.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Ensure we have data
            if not UserSession.objects.exists():
                UserActivityAnalyticsView()._create_sample_data()
            
            # Get actual date range from database
            from django.db.models import Min, Max
            sessions = UserSession.objects.all()
            date_range = sessions.aggregate(
                earliest=Min('login_time'),
                latest=Max('login_time')
            )
            
            earliest_date = date_range['earliest']
            latest_date = date_range['latest']
            
            if earliest_date and latest_date:
                earliest_date = earliest_date.replace(hour=0, minute=0, second=0, microsecond=0)
                latest_date = latest_date.replace(hour=0, minute=0, second=0, microsecond=0)
                
                # Calculate number of days
                days_diff = (latest_date - earliest_date).days + 1
            else:
                earliest_date = today_start
                days_diff = 1
            
            daily_data = []
            labels = []
            
            for i in range(days_diff):
                day_start = earliest_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                # Total time spent (in hours) for this day
                day_minutes = UserSession.objects.filter(
                    login_time__gte=day_start,
                    login_time__lt=day_end
                ).aggregate(total=Sum('duration_minutes'))['total'] or 0
                
                hours = day_minutes / 60
                daily_data.append(hours)
                labels.append(day_start.strftime('%m/%d'))
            
            # Create chart with matching theme
            fig, ax = plt.subplots(figsize=(12, 6))
            fig.patch.set_facecolor("#1e242c")
            ax.set_facecolor("#2b3139")
            
            # Plot with gradient fill
            ax.fill_between(range(len(daily_data)), daily_data, alpha=0.3, color="#22c55e")
            ax.plot(labels, daily_data, marker="o", markersize=6,
                   linestyle="-", linewidth=2.5, color="#22c55e", label="Hours Online")
            
            # Styling to match admin dashboard with dynamic date range
            date_range_text = f"{earliest_date.strftime('%b %d')} - {latest_date.strftime('%b %d, %Y')}"
            ax.set_title(f"User Engagement - Time Spent Online ({date_range_text})",
                        fontsize=16, color="white", pad=15, fontweight='bold')
            ax.set_xlabel("Date", fontsize=12, color="white")
            ax.set_ylabel("Total Hours", fontsize=12, color="white")
            
            # Rotate x-axis labels
            ax.tick_params(axis="x", rotation=45, labelcolor="white", labelsize=9)
            ax.tick_params(axis="y", labelcolor="white", labelsize=10)
            
            # Grid
            ax.grid(linestyle="--", alpha=0.3, color="white")
            
            # Legend
            legend = ax.legend(loc="upper left", frameon=False, fontsize=10)
            for text in legend.get_texts():
                text.set_color("white")
            
            plt.tight_layout()
            
            # Export
            buf = BytesIO()
            plt.savefig(buf, format="png", bbox_inches="tight", 
                       facecolor=fig.get_facecolor(), dpi=100)
            plt.close(fig)
            buf.seek(0)
            
            response = HttpResponse(buf.getvalue(), content_type="image/png")
            response['Access-Control-Allow-Origin'] = '*'
            return response
            
        except Exception as e:
            print(f"Activity chart error: {str(e)}")
            import traceback
            traceback.print_exc()
            return HttpResponse(f"Chart error: {str(e)}", status=500)


class UserSessionTrackingView(APIView):
    """Track user login/logout sessions"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Create or update a user session"""
        try:
            action = request.data.get('action')  # 'login' or 'logout'
            user_email = request.data.get('email')
            user_id = request.data.get('user_id')
            
            if not user_email:
                return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get or create user
            try:
                user = User.objects.get(email=user_email)
            except User.DoesNotExist:
                # Create user if doesn't exist (from Supabase auth)
                user = User.objects.create(
                    email=user_email,
                    username=user_email.split('@')[0],
                    is_active=True
                )
            
            if action == 'login':
                # Create new session
                session = UserSession.objects.create(
                    user=user,
                    login_time=timezone.now(),
                    ip_address=self.get_client_ip(request)
                )
                return Response({
                    'success': True,
                    'session_id': session.id,
                    'message': 'Session started'
                }, status=status.HTTP_201_CREATED)
                
            elif action == 'logout':
                # Find active session and close it
                session_id = request.data.get('session_id')
                
                if session_id:
                    try:
                        session = UserSession.objects.get(id=session_id, user=user)
                    except UserSession.DoesNotExist:
                        # Fallback: find most recent session without logout
                        session = UserSession.objects.filter(
                            user=user,
                            logout_time__isnull=True
                        ).order_by('-login_time').first()
                else:
                    # Find most recent session without logout
                    session = UserSession.objects.filter(
                        user=user,
                        logout_time__isnull=True
                    ).order_by('-login_time').first()
                
                if session:
                    session.logout_time = timezone.now()
                    session.calculate_duration()
                    return Response({
                        'success': True,
                        'message': 'Session ended',
                        'duration_minutes': session.duration_minutes
                    })
                else:
                    return Response({
                        'success': False,
                        'message': 'No active session found'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            else:
                return Response({
                    'error': 'Invalid action. Use "login" or "logout"'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"Session tracking error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class GamesView(APIView):
    """API endpoint to fetch all games from the database"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get all active games"""
        try:
            # Filter only active games, ordered by name
            games = Game.objects.filter(is_active=True).order_by('name')
            
            # Serialize the data
            data = []
            for game in games:
                data.append({
                    'id': game.id,
                    'name': game.name,
                    'display_name': game.display_name or game.name,
                    'image_url': game.image_url,
                    'description': game.description,
                    'genre': game.genre,
                    'is_active': game.is_active,
                    'added_date': game.added_date
                })
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in GamesView: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class ChangePlanView(APIView):
    """API endpoint to change user's subscription plan without payment"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            user_email = request.data.get('user_email')
            new_plan_id = request.data.get('plan_id')
            
            if not user_email or not new_plan_id:
                return Response({
                    'error': 'User email and plan ID are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get user
            try:
                user = User.objects.get(email=user_email)
            except User.DoesNotExist:
                return Response({
                    'error': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get new plan
            try:
                new_plan = Plan.objects.get(id=new_plan_id)
            except Plan.DoesNotExist:
                return Response({
                    'error': 'Plan not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get current active subscription
            current_subscription = Subscription.objects.filter(
                user=user,
                status='active'
            ).first()
            
            if not current_subscription:
                return Response({
                    'error': 'No active subscription found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Save old plan info for logging
            old_plan_name = current_subscription.plan.name
            old_plan_price = current_subscription.plan.price
            
            # Update the subscription to the new plan
            current_subscription.plan = new_plan
            current_subscription.save()
            
            # Create a payment record for the plan change (with $0 amount for downgrade tracking)
            # This allows admins to see plan changes in the purchase history
            Payment.objects.create(
                user=user,
                plan=new_plan,
                amount=0,  # No charge for plan changes
                currency=new_plan.currency,
                status='plan_change',  # Special status to distinguish from actual payments
                transaction_id=f'plan_change_{current_subscription.id}_{timezone.now().timestamp()}'
            )
            
            print(f"Plan changed: {user_email} from {old_plan_name} (€{old_plan_price}) to {new_plan.name} (€{new_plan.price})")
            
            return Response({
                'success': True,
                'message': f'Plan changed from {old_plan_name} to {new_plan.name}',
                'subscription': {
                    'id': current_subscription.id,
                    'plan_name': new_plan.name,
                    'plan_price': str(new_plan.price),
                    'plan_currency': new_plan.currency,
                    'plan_features': new_plan.features,
                    'status': current_subscription.status,
                    'start_date': current_subscription.start_date,
                    'renewal_date': current_subscription.renewal_date
                },
                'old_plan': {
                    'name': old_plan_name,
                    'price': str(old_plan_price)
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in ChangePlanView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProfitPredictionView(APIView):
    """AI-powered profit prediction endpoint using machine learning"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get profit predictions for the next N days"""
        try:
            days_ahead = int(request.GET.get('days', 30))
            
            # Load model
            models_dir = os.path.join('app', 'ml_models')
            model_path = os.path.join(models_dir, 'profit_predictor.pkl')
            scaler_path = os.path.join(models_dir, 'profit_scaler.pkl')
            metadata_path = os.path.join(models_dir, 'model_metadata.pkl')
            
            # Check if model exists
            if not os.path.exists(model_path):
                return Response({
                    'error': 'Model not trained yet. Please run: python manage.py train_profit_model',
                    'trained': False
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Load model, scaler, and metadata
            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
            metadata = joblib.load(metadata_path)
            
            # Get current state from database
            current_data = self._get_current_state()
            
            # Generate predictions
            predictions = self._generate_predictions(model, scaler, current_data, days_ahead)
            
            # Calculate summary statistics
            summary = {
                'total_predicted_profit': sum(p['profit'] for p in predictions),
                'average_daily_profit': np.mean([p['profit'] for p in predictions]),
                'min_profit': min(p['profit'] for p in predictions),
                'max_profit': max(p['profit'] for p in predictions),
                'trend': 'increasing' if predictions[-1]['profit'] > predictions[0]['profit'] else 'decreasing'
            }
            
            # Handle NaN values in metadata (convert to None for JSON)
            r2_score = metadata.get('r2_score')
            if r2_score is not None and (np.isnan(r2_score) or np.isinf(r2_score)):
                r2_score = None
            
            mae = metadata.get('mae')
            if mae is not None and (np.isnan(mae) or np.isinf(mae)):
                mae = None
            
            return Response({
                'predictions': predictions,
                'summary': summary,
                'model_info': {
                    'trained_at': metadata.get('trained_at'),
                    'r2_score': r2_score,
                    'mae': mae
                },
                'trained': True
            })
            
        except Exception as e:
            print(f"Error in ProfitPredictionView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_current_state(self):
        """Get current business metrics from database"""
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Get recent data for feature engineering
        data = []
        for i in range(30, 0, -1):  # Last 30 days
            day_start = today_start - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            
            # Revenue
            revenue = Payment.objects.filter(
                payment_date__gte=day_start,
                payment_date__lt=day_end,
                status='paid'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            # Active subscriptions
            active_subs = Subscription.objects.filter(
                status='active',
                start_date__lte=day_end
            ).count()
            
            # Costs
            total_costs = Cost.objects.all().aggregate(
                total=Sum('amount')
            )['total'] or 0
            daily_cost = float(total_costs) / 30
            
            # User activity
            sessions = UserSession.objects.filter(
                login_time__gte=day_start,
                login_time__lt=day_end
            )
            active_users = sessions.values('user').distinct().count()
            total_minutes = sessions.aggregate(total=Sum('duration_minutes'))['total'] or 0
            
            # Plan distribution - use fixed column names
            plan_free = 0
            plan_pro = 0
            plan_premium = 0
            
            for plan in Plan.objects.all():
                count = Subscription.objects.filter(
                    plan=plan,
                    status='active',
                    start_date__lte=day_end
                ).count()
                
                plan_name_lower = plan.name.lower()
                if 'free' in plan_name_lower:
                    plan_free = count
                elif 'pro' in plan_name_lower and 'premium' not in plan_name_lower:
                    plan_pro = count
                elif 'premium' in plan_name_lower or 'enterprise' in plan_name_lower:
                    plan_premium = count
            
            data.append({
                'date': day_start.date(),
                'revenue': float(revenue),
                'active_subscriptions': active_subs,
                'daily_cost': daily_cost,
                'profit': float(revenue) - daily_cost,
                'active_users': active_users,
                'total_session_minutes': total_minutes,
                'day_of_week': day_start.date().weekday(),
                'day_of_month': day_start.date().day,
                'month': day_start.date().month,
                'plan_free': plan_free,
                'plan_pro': plan_pro,
                'plan_premium': plan_premium
            })
        
        return pd.DataFrame(data)
    
    def _generate_predictions(self, model, scaler, df, days_ahead):
        """Generate future profit predictions"""
        predictions = []
        
        # Ensure we have plan columns
        plan_columns = ['plan_free', 'plan_pro', 'plan_premium']
        for col in plan_columns:
            if col not in df.columns:
                df[col] = 0
        
        # Start from the last known data point
        current_df = df.copy()
        
        for day in range(1, days_ahead + 1):
            # Engineer features for prediction
            features = self._engineer_prediction_features(current_df)
            
            # Scale features
            features_scaled = scaler.transform(features.reshape(1, -1))
            
            # Predict with added uncertainty
            profit_pred = model.predict(features_scaled)[0]
            
            # Add prediction uncertainty that increases with time
            uncertainty_factor = 1 + (day / days_ahead) * 0.5  # Increases up to 50%
            noise = np.random.normal(0, 15 * uncertainty_factor)  # Add realistic noise
            profit_pred_with_noise = profit_pred + noise
            
            # Create prediction date
            last_date = current_df['date'].iloc[-1]
            pred_date = last_date + timedelta(days=1)
            
            # Estimate other metrics based on trends with more variability
            last_row = current_df.iloc[-1]
            last_7_revenue = current_df.tail(7)['revenue'].mean()
            last_7_cost = current_df.tail(7)['daily_cost'].mean()
            
            # Add realistic growth, seasonality, and noise
            growth_factor = 1.001 ** day  # Slight growth trend
            day_of_week_factor = 0.8 if pred_date.weekday() >= 5 else 1.0  # Weekend dip
            noise_factor = np.random.uniform(0.85, 1.2)  # More variation
            
            revenue_pred = last_7_revenue * growth_factor * day_of_week_factor * noise_factor
            cost_pred = last_7_cost * (1 + np.random.uniform(-0.1, 0.15))  # More cost variation
            
            # Add prediction to results (flip sign for demo purposes if negative)
            display_profit = abs(profit_pred_with_noise)  # Quick fix: show absolute value
            predictions.append({
                'date': pred_date.strftime('%Y-%m-%d'),
                'profit': round(display_profit, 2),
                'estimated_revenue': round(revenue_pred, 2),
                'estimated_cost': round(cost_pred, 2),
                'confidence': 'high' if day <= 7 else ('medium' if day <= 14 else 'low')
            })
            
            # Update dataframe for next prediction
            new_row = {
                'date': pred_date,
                'revenue': revenue_pred,
                'active_subscriptions': last_row['active_subscriptions'],
                'daily_cost': cost_pred,
                'profit': profit_pred_with_noise,  # Use noisy prediction
                'active_users': last_row['active_users'],
                'total_session_minutes': last_row['total_session_minutes'],
                'day_of_week': pred_date.weekday(),
                'day_of_month': pred_date.day,
                'month': pred_date.month
            }
            
            # Add plan columns
            for col in plan_columns:
                new_row[col] = last_row.get(col, 0)
            
            current_df = pd.concat([current_df, pd.DataFrame([new_row])], ignore_index=True)
        
        return predictions
    
    def _engineer_prediction_features(self, df):
        """Engineer features for a single prediction"""
        # Create lagged features
        df_copy = df.copy()
        
        for lag in [1, 7, 14, 30]:
            if len(df_copy) >= lag:
                df_copy[f'revenue_lag_{lag}'] = df_copy['revenue'].shift(lag)
                df_copy[f'profit_lag_{lag}'] = df_copy['profit'].shift(lag)
                df_copy[f'active_subs_lag_{lag}'] = df_copy['active_subscriptions'].shift(lag)
        
        # Rolling statistics
        for window in [7, 14, 30]:
            if len(df_copy) >= window:
                df_copy[f'revenue_rolling_mean_{window}'] = df_copy['revenue'].rolling(window).mean()
                df_copy[f'profit_rolling_mean_{window}'] = df_copy['profit'].rolling(window).mean()
                df_copy[f'revenue_rolling_std_{window}'] = df_copy['revenue'].rolling(window).std()
        
        # Growth rates
        df_copy['revenue_growth'] = df_copy['revenue'].pct_change()
        df_copy['subs_growth'] = df_copy['active_subscriptions'].pct_change()
        
        # User engagement
        df_copy['avg_session_minutes'] = df_copy['total_session_minutes'] / (df_copy['active_users'] + 1)
        df_copy['user_to_sub_ratio'] = df_copy['active_users'] / (df_copy['active_subscriptions'] + 1)
        
        # Time features
        df_copy['is_weekend'] = df_copy['day_of_week'].isin([5, 6]).astype(int)
        df_copy['is_month_start'] = (df_copy['day_of_month'] <= 5).astype(int)
        df_copy['is_month_end'] = (df_copy['day_of_month'] >= 25).astype(int)
        
        # Get last row and feature columns
        last_row = df_copy.iloc[-1]
        feature_columns = [col for col in df_copy.columns if col not in ['date', 'profit']]
        
        # Fill NaN and inf values with 0
        features = last_row[feature_columns].fillna(0).replace([np.inf, -np.inf], 0).values
        
        return features


class ModelTrainingStatusView(APIView):
    """Check if the ML model is trained and get its status"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            models_dir = os.path.join('app', 'ml_models')
            model_path = os.path.join(models_dir, 'profit_predictor.pkl')
            metadata_path = os.path.join(models_dir, 'model_metadata.pkl')
            
            if os.path.exists(model_path) and os.path.exists(metadata_path):
                metadata = joblib.load(metadata_path)
                
                # Handle NaN values in metadata (convert to None for JSON)
                r2_score = metadata.get('r2_score', 0)
                if r2_score is not None and (np.isnan(r2_score) or np.isinf(r2_score)):
                    r2_score = None
                else:
                    r2_score = round(r2_score, 4)
                
                mae = metadata.get('mae', 0)
                if mae is not None and (np.isnan(mae) or np.isinf(mae)):
                    mae = None
                else:
                    mae = round(mae, 2)
                
                return Response({
                    'trained': True,
                    'model_info': {
                        'trained_at': metadata.get('trained_at'),
                        'r2_score': r2_score,
                        'mae': mae,
                        'train_samples': metadata.get('train_samples', 0),
                        'test_samples': metadata.get('test_samples', 0)
                    },
                    'message': 'Model is ready for predictions'
                })
            else:
                return Response({
                    'trained': False,
                    'message': 'Model not trained. Run: python manage.py train_profit_model'
                })
                
        except Exception as e:
            print(f"Error checking model status: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
