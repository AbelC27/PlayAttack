"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from .views import SignupView
from .views import UserDashboardView
from .views import LoginView
from . import views
from app.views import (
    Plans, Users, CreatePaymentIntent, ConfirmPayment, StripeConfig, 
    UserSubscription, UserPurchasesView, UserSubscriptionManagement, 
    RevenueAnalyticsView, HostingCostsView, HostingCostDetailView, 
    PlanAnalyticsView, GeneratePDFReportView, TestPDFView, TestConnectionView, 
    UserActivityAnalyticsView, UserActivityChartView, UserSessionTrackingView, 
    GamesView, ChangePlanView, ProfitPredictionView, ModelTrainingStatusView
)
from app.views import plans_piechart
from app.views import monthly_costs_linechart

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/signup/", SignupView.as_view(), name="signup"),
    path("api/dashboard/", UserDashboardView.as_view(), name="dashboard"),
    path("api/login/", LoginView.as_view(), name="login"),
    path('api/plans/', Plans.as_view(), name='plans-list'),
    path('api/users/', Users.as_view(), name='users-list'),
    path('api/create-payment-intent/', CreatePaymentIntent.as_view(), name='create-payment-intent'),
    path('api/confirm-payment/', ConfirmPayment.as_view(), name='confirm-payment'),
    path('api/stripe-config/', StripeConfig.as_view(), name='stripe-config'),
    path('api/user-subscription/', UserSubscription.as_view(), name='user-subscription'),
    path('piechart.png', plans_piechart.as_view(), name='plans_piechart'),
    path('api/users/<str:user_id>/payments/', UserPurchasesView.as_view(), name='user_purchases'),
    path('api/subscription-management/', UserSubscriptionManagement.as_view(), name='subscription_management'),
    # New analytics and cost management endpoints
    path('api/analytics/revenue/', RevenueAnalyticsView.as_view(), name='revenue_analytics'),
    path('api/analytics/plans/', PlanAnalyticsView.as_view(), name='plan_analytics'),
    path('api/hosting-costs/', HostingCostsView.as_view(), name='hosting_costs'),
    path('api/hosting-costs/<int:cost_id>/', HostingCostDetailView.as_view(), name='hosting_cost_detail'),
    # PDF Report generation
    path('api/generate-pdf-report/', GeneratePDFReportView.as_view(), name='generate_pdf_report'),
    path('api/test-pdf/', TestPDFView.as_view(), name='test_pdf'),
    path('api/test-connection/', TestConnectionView.as_view(), name='test_connection'),
    path("charts/monthly-costs/", monthly_costs_linechart.as_view(), name="monthly-costs-linechart"),
    # User activity tracking endpoints
    path('api/analytics/user-activity/', UserActivityAnalyticsView.as_view(), name='user_activity_analytics'),
    path('charts/user-activity/', UserActivityChartView.as_view(), name='user_activity_chart'),
    path('api/session-tracking/', UserSessionTrackingView.as_view(), name='session_tracking'),
    # Games endpoint
    path('api/games/', GamesView.as_view(), name='games'),
    # Change plan endpoint
    path('api/change-plan/', ChangePlanView.as_view(), name='change_plan'),
    # Machine Learning Profit Prediction endpoints
    path('api/ml/profit-prediction/', ProfitPredictionView.as_view(), name='profit_prediction'),
    path('api/ml/model-status/', ModelTrainingStatusView.as_view(), name='model_status'),

]
