import React, { useState, useEffect, memo } from 'react';
import { useAuth } from '../hooks/useAuth';

const UserSubscriptionStatus = memo(() => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserSubscription = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/api/user-subscription/?email=${user.email}`);
        
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription);
          setPaymentHistory(data.payment_history || []);
        } else {
          throw new Error('Failed to fetch subscription');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSubscription();
  }, [user]);

  if (!user) {
    return (
      <div style={{
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '1.5rem',
        textAlign: 'center'
      }}>
        <p style={{ color: '#9ca3af' }}>Please log in to view your subscription status</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '1.5rem',
        textAlign: 'center'
      }}>
        <p style={{ color: '#22c55e' }}>Loading subscription status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '1.5rem',
        textAlign: 'center'
      }}>
        <p style={{ color: '#ef4444' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#1f2937',
      border: '1px solid #374151',
      borderRadius: '12px',
      padding: '2rem'
    }}>
      <h3 style={{ 
        color: '#22c55e', 
        marginBottom: '2rem', 
        fontSize: '1.75rem',
        textAlign: 'center'
      }}>
        📊 Detailed Subscription Overview
      </h3>
      
      <div className="detailed-overview-grid" style={{
        gridTemplateColumns: subscription ? '1fr 1fr' : '1fr'
      }}>
        {subscription ? (
          <>
            {/* Left Column - Plan Details */}
            <div>
              <h4 style={{ 
                color: '#f3f4f6', 
                marginBottom: '1rem',
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                💼 Current Plan Details
              </h4>
              <div style={{
                backgroundColor: '#111827',
                padding: '1.5rem',
                borderRadius: '10px',
                border: '1px solid #374151'
              }}>
                <p style={{ color: '#22c55e', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                  {subscription.plan_name}
                </p>
                <p style={{ color: '#f3f4f6', margin: '0 0 0.5rem 0' }}>
                  €{subscription.plan_price} {subscription.plan_currency}/month
                </p>
                <p style={{ color: '#9ca3af', margin: '0' }}>
                  Status: <span style={{ color: subscription.status === 'active' ? '#22c55e' : '#ef4444' }}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                </p>
                {subscription.renewal_date && (
                  <p style={{ color: '#9ca3af', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                    Next billing: {new Date(subscription.renewal_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              {subscription.plan_features && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ 
                    color: '#f3f4f6', 
                    marginBottom: '1rem',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    ⚡ Plan Features
                  </h4>
                  <div style={{ 
                    color: '#9ca3af', 
                    fontSize: '0.95rem',
                    backgroundColor: '#111827',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #374151'
                  }}>
                    {subscription.plan_features.split('\n').map((feature, idx) => (
                      <div key={idx} style={{ 
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ color: '#22c55e', fontSize: '1.1rem' }}>✓</span> 
                        <span>{feature.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Payment History */}
            {paymentHistory.length > 0 && (
              <div>
                <h4 style={{ 
                  color: '#f3f4f6', 
                  marginBottom: '1rem',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  💳 Payment History
                </h4>
                <div style={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto',
                  backgroundColor: '#111827',
                  borderRadius: '10px',
                  border: '1px solid #374151',
                  padding: '1rem'
                }}>
                  {paymentHistory.map((payment, index) => (
                    <div key={payment.id} style={{
                      backgroundColor: index % 2 === 0 ? '#1f2937' : '#374151',
                      padding: '1rem',
                      borderRadius: '8px',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background-color 0.2s ease'
                    }}>
                      <div>
                        <p style={{ color: '#f3f4f6', margin: 0, fontSize: '0.9rem' }}>
                          {payment.plan_name}
                        </p>
                        <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.8rem' }}>
                          {new Date(payment.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: '#22c55e', margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>
                          €{payment.amount} {payment.currency}
                        </p>
                        <p style={{ 
                          color: payment.status === 'paid' ? '#22c55e' : '#ef4444', 
                          margin: 0, 
                          fontSize: '0.8rem' 
                        }}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1' }}>
            <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>
              No active subscription found
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              Choose a plan to get started with your gaming subscription
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default UserSubscriptionStatus;