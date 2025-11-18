from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from app.serializers import UserSignupSerializer
from app.serializers import DashBoardSerializer
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from app.models import Plan
from django.http import HttpResponse
from io import BytesIO
import matplotlib.pyplot as plt
from collections import Counter
from supabase import create_client
from django.conf import settings
from rest_framework.permissions import AllowAny

class UserPurchasesView(APIView):
    permission_classes = [AllowAny]  # Add this line
    
    def get(self, request, user_id):
        try:
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            response = supabase.table("app_payment").select("*").eq("user_id", user_id).execute()
            
            if response.error:
                print(f"Supabase error: {response.error}")  # Add logging
                return Response(
                    {"error": "Error fetching purchases"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
            print(f"Purchases fetched: {response.data}")  # Add logging
            return Response(response.data, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Exception in UserPurchasesView: {str(e)}")  # Add logging
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
        email = request.data.get('email')
        password = request.data.get('password')

        user = authenticate(request, email=email, password=password)
        if user is not None:
            login(request, user)
            return Response({'message': 'Login successful!'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response({'message': 'Login successful!'}, status=status.HTTP_200_OK)
    
class Plans(APIView):
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
            fig, ax = plt.subplots(figsize=(4,4),dpi=100)
            plt.savefig(buf, format='png', bbox_inches='tight', facecolor=fig.get_facecolor())

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
            fig, ax = plt.subplots(figsize=(9, 5))
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

