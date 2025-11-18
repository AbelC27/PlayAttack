import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useAuth } from '../hooks/useAuth';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const cardStyle = {
  style: {
    base: {
      color: '#f3f4f6',
      fontFamily: 'Arial, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      backgroundColor: '#1f2937',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

const PaymentForm = ({ plan, onPaymentComplete, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !user) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';

      // Create payment intent
      const response = await fetch(`${API_URL}/api/create-payment-intent/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: plan.id,
          user_email: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { client_secret } = await response.json();
      const cardElement = elements.getElement(CardElement);

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: user.email,
          },
        },
      });

      if (error) {
        setPaymentError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment and create subscription on backend
        const confirmResponse = await fetch(`${API_URL}/api/confirm-payment/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id,
            user_email: user.email,
            plan_id: plan.id,
            amount: plan.price,
            currency: plan.currency,
          }),
        });

        if (confirmResponse.ok) {
          setPaymentSuccess(true);
          setTimeout(() => {
            onPaymentComplete && onPaymentComplete(plan);
          }, 2000);
        } else {
          setPaymentError('Payment succeeded but failed to save subscription');
        }
      }
    } catch (err) {
      setPaymentError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!plan) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1f2937',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #374151',
        width: '90%',
        maxWidth: '500px'
      }}>
        {paymentSuccess ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ color: '#22c55e', marginBottom: '1rem' }}>Payment Successful!</h3>
            <p style={{ color: '#f3f4f6', marginBottom: '1rem' }}>
              You have successfully subscribed to the {plan.name} plan.
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
              Your subscription has been saved to the database.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePayment}>
            <h3 style={{ color: '#22c55e', marginBottom: '1.5rem', textAlign: 'center' }}>
              Complete Your Purchase
            </h3>
            
            <div style={{ 
              backgroundColor: '#111827', 
              padding: '1.5rem', 
              borderRadius: '6px',
              marginBottom: '1.5rem',
              border: '1px solid #374151'
            }}>
              <h4 style={{ color: '#f3f4f6', marginBottom: '0.5rem' }}>{plan.name} Plan</h4>
              <p style={{ color: '#22c55e', fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                €{plan.price} {plan.currency}
              </p>
              <div style={{ color: '#9ca3af', fontSize: '0.9rem', textAlign: 'left' }}>
                <strong>Features:</strong>
                {plan.features && plan.features.split('\n').map((feature, idx) => (
                  <div key={idx} style={{ marginTop: '0.25rem' }}>• {feature.trim()}</div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#f3f4f6', display: 'block', marginBottom: '0.5rem' }}>
                Card Information
              </label>
              <div style={{
                padding: '12px',
                border: '1px solid #374151',
                borderRadius: '6px',
                backgroundColor: '#1f2937'
              }}>
                <CardElement options={cardStyle} />
              </div>
            </div>

            {paymentError && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                padding: '1rem',
                borderRadius: '6px',
                marginBottom: '1rem'
              }}>
                {paymentError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                style={{
                  backgroundColor: '#6b7280',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || !stripe}
                style={{
                  backgroundColor: '#22c55e',
                  color: '#000',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '4px',
                  cursor: (isProcessing || !stripe) ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: (isProcessing || !stripe) ? 0.6 : 1
                }}
              >
                {isProcessing ? 'Processing...' : `Pay €${plan.price}`}
              </button>
            </div>

            <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '1rem', textAlign: 'center' }}>
              Powered by Stripe • Your payment is secure
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

const PaymentComponent = ({ plan, onPaymentComplete, onClose }) => {
  if (!plan) return null;

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm 
        plan={plan} 
        onPaymentComplete={onPaymentComplete} 
        onClose={onClose} 
      />
    </Elements>
  );
};

export default PaymentComponent;