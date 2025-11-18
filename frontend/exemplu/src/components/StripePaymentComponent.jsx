import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useAuth } from '../hooks/useAuth';

// Load Stripe with your publishable key - handle missing/invalid keys gracefully
const getStripePromise = () => {
  const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  return loadStripe(publishableKey);
};

const stripePromise = getStripePromise();

const cardStyle = {
  style: {
    base: {
      color: '#f3f4f6',
      fontFamily: 'Arial, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
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

const StripePaymentForm = ({ plan, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';

      // Step 1: Create payment intent
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

      const intentPayload = await response.json();

      if (!response.ok) {
        const backendMessage = intentPayload?.error || 'Failed to create payment intent';
        throw new Error(backendMessage);
      }

      const { client_secret, payment_intent_id, demo_mode } = intentPayload;

      // Step 2: Confirm payment with Stripe
      
      // Check if this is a mock payment intent (for demo purposes)
      const mockPaymentIntentId = payment_intent_id || client_secret?.replace('_secret', '');
      const demoPayment = demo_mode || (client_secret && client_secret.startsWith('pi_mock_'));

      if (demoPayment) {
        // Simulate successful payment for demo purposes
        if (!mockPaymentIntentId) {
          throw new Error('Demo payment response missing payment_intent_id');
        }
        
        // Step 3: Confirm payment on backend and save to database
        const confirmResponse = await fetch(`${API_URL}/api/confirm-payment/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_intent_id: mockPaymentIntentId,
            user_email: user.email,
            plan_id: plan.id,
            amount: plan.price,
            currency: plan.currency,
          }),
        });

        if (confirmResponse.ok) {
          const result = await confirmResponse.json();
          setPaymentSuccess(true);
          
          setTimeout(() => {
            onSuccess && onSuccess(plan);
          }, 2000);
        } else {
          const errorData = await confirmResponse.json();
          setPaymentError(`Mock payment failed to save: ${errorData.error}`);
        }
        return;
      }
      
      if (!client_secret) {
        throw new Error('Stripe did not return a client secret for this payment intent.');
      }

      const cardElement = elements.getElement(CardElement);

      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: user.email,
          },
        },
      });

      if (error) {
        console.error('Stripe payment error:', error);
        setPaymentError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        
        // Step 3: Confirm payment on backend and save to database
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
          const result = await confirmResponse.json();
          setPaymentSuccess(true);
          
          setTimeout(() => {
            onSuccess && onSuccess(plan);
          }, 2000);
        } else {
          const errorData = await confirmResponse.json();
          setPaymentError(`Payment succeeded but failed to save: ${errorData.error}`);
        }
      }
    } catch (err) {
      console.error('Payment process error:', err);
      setPaymentError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
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
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h3 style={{ color: '#22c55e', marginBottom: '1rem' }}>Payment Successful!</h3>
          <p style={{ color: '#f3f4f6', marginBottom: '1rem' }}>
            You have successfully subscribed to the {plan.name} plan.
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
            Your subscription has been saved to the database.
          </p>
        </div>
      </div>
    );
  }

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
        <form onSubmit={handleSubmit}>
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
            <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
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
              backgroundColor: '#111827'
            }}>
              <CardElement options={cardStyle} />
            </div>
          </div>

          <div style={{
            backgroundColor: '#e0f2fe',
            color: '#01579b',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            <strong>Test Mode:</strong> Use test card <strong>4242 4242 4242 4242</strong> with any future date and any CVC.
          </div>

          {paymentError && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '1rem',
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <strong>Error:</strong> {paymentError}
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
      </div>
    </div>
  );
};

// Mock Payment Form for when Stripe is not configured
const MockPaymentForm = ({ plan, onSuccess, onClose }) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleMockPayment = async () => {
    setIsProcessing(true);
    
    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      
      // Create mock payment intent
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

      if (response.ok) {
        const intentPayload = await response.json();
        const { client_secret, payment_intent_id, demo_mode } = intentPayload;
        const mockPaymentIntentId = payment_intent_id || client_secret?.replace('_secret', '');

        if (!demo_mode && !(client_secret && client_secret.startsWith('pi_mock_')) && !payment_intent_id?.startsWith('pi_mock_')) {
          throw new Error('Mock payment requested but backend returned a real Stripe intent.');
        }

        if (!mockPaymentIntentId) {
          throw new Error('Mock payment response missing payment_intent_id');
        }

        // Confirm mock payment
        const confirmResponse = await fetch(`${API_URL}/api/confirm-payment/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_intent_id: mockPaymentIntentId,
            user_email: user.email,
            plan_id: plan.id,
            amount: plan.price,
            currency: plan.currency,
          }),
        });

        if (confirmResponse.ok) {
          setPaymentSuccess(true);
          setTimeout(() => {
            onSuccess && onSuccess(plan);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Mock payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
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
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h3 style={{ color: '#22c55e', marginBottom: '1rem' }}>Payment Successful!</h3>
          <p style={{ color: '#f3f4f6', marginBottom: '1rem' }}>
            You have successfully subscribed to the {plan.name} plan.
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
            (Demo Mode - No real payment processed)
          </p>
        </div>
      </div>
    );
  }

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
        <h3 style={{ color: '#22c55e', marginBottom: '1.5rem', textAlign: 'center' }}>
          Demo Payment Mode
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
          <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
            <strong>Features:</strong>
            {plan.features && plan.features.split('\n').map((feature, idx) => (
              <div key={idx} style={{ marginTop: '0.25rem' }}>• {feature.trim()}</div>
            ))}
          </div>
        </div>

        <div style={{
          backgroundColor: '#fef3c7',
          color: '#92400e',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          <strong>Demo Mode:</strong> Stripe keys not configured.<br />
          This will simulate a successful payment without real processing.
        </div>

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
            type="button"
            onClick={handleMockPayment}
            disabled={isProcessing}
            style={{
              backgroundColor: '#22c55e',
              color: '#000',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '4px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: isProcessing ? 0.6 : 1
            }}
          >
            {isProcessing ? 'Processing...' : `Demo Pay €${plan.price}`}
          </button>
        </div>

        <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '1rem', textAlign: 'center' }}>
          Demo Mode • No real payment will be processed
        </p>
      </div>
    </div>
  );
};

const StripePaymentComponent = ({ plan, onSuccess, onClose }) => {
  if (!plan) return null;

  // If Stripe is not configured, use mock payment component
  if (!stripePromise) {
    return <MockPaymentForm plan={plan} onSuccess={onSuccess} onClose={onClose} />;
  }

  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm 
        plan={plan} 
        onSuccess={onSuccess} 
        onClose={onClose} 
      />
    </Elements>
  );
};

export default StripePaymentComponent;