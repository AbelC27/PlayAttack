# backend/app/authentication.py

import requests
from jose import jwt   
from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from django.conf import settings
from app.models import User  # modelul tău custom cu UUID id/email

class SupabaseJWTAuthentication(BaseAuthentication):
    """
    Authenticate user using Supabase JWT.
    """

    def authenticate(self, request):
        # 1. Extragem headerul Authorization
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None  # niciun token → anon user

        token = auth_header.split(" ")[1]

        # 2. Descarcăm JWKS keys de la Supabase (o dată la primii pași)
        jwks_url = f"{settings.SUPABASE_URL}/auth/v1/keys"
        try:
            jwks = requests.get(jwks_url).json()

            # 3. Validăm și decodăm JWT-ul
            decoded = jwt.decode(token, jwks, options={"verify_aud": False})
        except Exception as e:
            raise exceptions.AuthenticationFailed(f"Invalid Supabase token: {str(e)}")

        # 4. Extragem date din token
        user_id = decoded.get("sub")    # UUID-ul userului
        email = decoded.get("email")

        if not user_id:
            raise exceptions.AuthenticationFailed("No user ID in token")

        # 5. Sincronizăm/întoarcem userul în DB Django
        user, _ = User.objects.get_or_create(
            id=user_id,
            defaults={"email": email or "", "username": email or ""}
        )

        return (user, None)