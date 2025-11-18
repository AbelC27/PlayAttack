// frontend/exemplu/src/api/djangoApi.js
import { supabase } from "../supabaseClient";

const BASE_URL = process.env.REACT_APP_DJANGO_URL || "http://localhost:8000";

export async function createPayment(planId) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${BASE_URL}/api/payments/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ plan_id: planId })
  });

  if (!response.ok) {
    throw new Error(`Payment API error: ${response.status}`);
  }

  return response.json();
}