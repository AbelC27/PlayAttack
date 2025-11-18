from django.contrib import admin
from .models import User, Plan, Subscription, Payment, Cost, UserSession

admin.site.register(User)
admin.site.register(Plan)
admin.site.register(Subscription)
admin.site.register(Payment)
admin.site.register(Cost)
admin.site.register(UserSession)