# backend/app/apps.py (exemplu)
from django.apps import AppConfig

class AppConfig(AppConfig): # Vechea era CoreConfig
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app' # Vechea era 'core'