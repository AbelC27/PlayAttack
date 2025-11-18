import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const SimplePaymentTest = ({ plan, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const handleTestPayment = async () => {
    if (!user || !plan) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';

      // Test payment simulation without Stripe Elements
      const response = await fetch(`${API_URL}/api/confirm-payment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_intent_id: `test_payment_${Date.now()}`,
          user_email: user.email,
          plan_id: plan.id,
          amount: plan.price,
          currency: plan.currency,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess && onSuccess(plan);
      } else {
        const errorData = await response.json();
        setPaymentError(errorData.error || 'Payment failed');
      }
    } catch (err) {
      setPaymentError(`Network error: ${err.message}`);
      console.error('Payment error:', err);
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
        <h3 style={{ color: '#22c55e', marginBottom: '1.5rem', textAlign: 'center' }}>
          Payment Test Mode
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
          fontSize: '0.9rem'
        }}>
          <strong>Test Mode:</strong> This simulates a payment and saves the subscription to your database without using Stripe Elements (to avoid AdBlocker issues).
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
            type="button"
            onClick={handleTestPayment}
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
            {isProcessing ? 'Processing...' : `Simulate Payment €${plan.price}`}
          </button>
        </div>

        <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '1rem', textAlign: 'center' }}>
          Database Test Mode • No real payment processing
        </p>
      </div>
    </div>
  );
};

export default SimplePaymentTest;