import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';

// Lazy load payment components
const SimplePaymentTest = lazy(() => import('./SimplePaymentTest'));
const StripePaymentComponent = lazy(() => import('./StripePaymentComponent'));

const SubscriptionList = ({ 
  selectedPlan, 
  handlePlanSelection, 
  onPaymentSuccess,
  onPaymentError,
  user,
  hasActiveSubscription,
  currentSubscription 
}) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [paymentMode, setPaymentMode] = useState(null); // 'stripe' or 'simulate'

  // Memoize sorted plans to avoid re-sorting on every render
  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => a.price - b.price);
  }, [plans]);

  const handlePlanPurchase = (plan) => {
    if (plan.price === 0) {
      // Free plan - handle directly
      if (handlePlanSelection) {
        handlePlanSelection(plan);
      }
    } else {
      // Paid plan - show payment mode selection
      setSelectedPlanForPayment(plan);
      setShowPayment(true);
      // Default to Stripe payment for better experience
      setPaymentMode('stripe');
    }
  };

  const handlePaymentComplete = (plan, paymentData) => {
    setShowPayment(false);
    setSelectedPlanForPayment(null);
    setPaymentMode(null);
    
    if (handlePlanSelection) {
      handlePlanSelection(plan);
    }
    
    if (onPaymentSuccess) {
      onPaymentSuccess(plan, paymentData);
    }
  };

  const handlePaymentClose = () => {
    setShowPayment(false);
    setSelectedPlanForPayment(null);
    setPaymentMode(null);
  };

  // Enhanced button rendering with subscription management
  const renderPlanButton = (plan) => {
    // Check if user is already on this plan
    if (currentSubscription && currentSubscription.plan_name === plan.name) {
      return (
        <button
          style={{
            background: '#374151',
            color: '#9ca3af',
            border: '2px solid #22c55e',
            borderRadius: 8,
            padding: '12px 32px',
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'not-allowed',
            width: '100%'
          }}
          disabled
        >
          ✓ Current Plan
        </button>
      );
    }

    // Check if user has active subscription and is trying to change plan
    if (currentSubscription && hasActiveSubscription) {
      const currentPrice = parseFloat(currentSubscription.plan_price || 0);
      const newPrice = parseFloat(plan.price || 0);
      
      // Allow downgrades - will trigger warning in parent component
      if (currentPrice > 0 && newPrice < currentPrice) {
        return (
          <button
            onClick={() => {
              if (handlePlanSelection) {
                handlePlanSelection(plan);
              }
            }}
            style={{
              background: 'linear-gradient(45deg, #f59e0b, #d97706)',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              padding: '12px 32px',
              fontWeight: 'bold',
              fontSize: 16,
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'none';
              e.target.style.boxShadow = 'none';
            }}
          >
            ⬇️ Change to {plan.name}
          </button>
        );
      }

      // Show upgrade option
      if (newPrice > currentPrice) {
        return (
          <button
            onClick={() => handlePlanPurchase(plan)}
            style={{
              background: 'linear-gradient(45deg, #22c55e, #16a34a)',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              padding: '12px 32px',
              fontWeight: 'bold',
              fontSize: 16,
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'none';
              e.target.style.boxShadow = 'none';
            }}
          >
            🚀 Upgrade to {plan.name}
          </button>
        );
      }
    }

    // Default button for users without active subscription or free plan
    return (
      <button
        onClick={() => {
          if (!user && !handlePlanSelection) {
            navigate('/login');
          } else {
            handlePlanPurchase(plan);
          }
        }}
        style={{
          background: plan.price === 0 ? '#22c55e' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          padding: '12px 32px',
          fontWeight: 'bold',
          fontSize: 16,
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          if (plan.price === 0) {
            e.target.style.backgroundColor = '#16a34a';
          } else {
            e.target.style.backgroundColor = '#2563eb';
          }
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          if (plan.price === 0) {
            e.target.style.backgroundColor = '#22c55e';
          } else {
            e.target.style.backgroundColor = '#3b82f6';
          }
          e.target.style.transform = 'none';
          e.target.style.boxShadow = 'none';
        }}
      >
        {plan.price === 0 ? 'Get Started Free' : `Choose ${plan.name}`}
      </button>
    );
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        
        const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        try {
          const response = await fetch(`${API_URL}/api/plans/`, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          setPlans(data || []);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          if (fetchError.name === 'AbortError') {
            throw new Error('Request timeout - please check your connection');
          }
          throw fetchError;
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching plans from backend:', err);
        
        // Set empty plans array on error so UI doesn't hang
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: '#22c55e', fontSize: 18 }}>Loading plans...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: '#ff4444', fontSize: 18 }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', color: '#ffffff', padding: '2rem 0' }}>
      {/* Plans Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <section style={{ width: '100%', maxWidth: 1200 }}>
          <h2 style={{ color: '#ffffff', fontSize: 28, textAlign: 'center', marginBottom: 8 }}>
            Choose Your Gaming Plan
          </h2>
          <p style={{ color: '#808080', textAlign: 'center', marginBottom: 32 }}>
            Get unlimited access to our game library with flexible subscription options designed for every type of gamer
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: 24,
            marginBottom: '3rem'
          }}>
            {sortedPlans.map((plan) => (
              <div 
                key={plan.id} 
                style={{ 
                  background: selectedPlan?.id === plan.id ? '#1a2e1a' : '#1a1a1a',
                  border: selectedPlan?.id === plan.id ? '2px solid #22c55e' : '1px solid #333',
                  borderRadius: 16, 
                  padding: 32, 
                  color: '#fff', 
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  transform: selectedPlan?.id === plan.id ? 'translateY(-4px)' : 'none'
                }}
              >
                {/* Plan Badge for Premium */}
                {plan.name === 'Premium' && (
                  <div style={{
                    position: 'absolute',
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#22c55e',
                    color: '#000',
                    padding: '4px 16px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    MOST POPULAR
                  </div>
                )}
                
                <h3 style={{ 
                  color: plan.name === 'Free' ? '#808080' : '#22c55e', 
                  fontSize: 24, 
                  margin: '0 0 16px 0',
                  fontWeight: 'bold'
                }}>
                  {plan.name}
                </h3>
                
                <div style={{ marginBottom: 24, textAlign: 'center' }}>
                  <span style={{ 
                    fontSize: 36, 
                    fontWeight: 'bold',
                    color: '#ffffff'
                  }}>
                    {plan.price === 0 ? 'Free' : `€${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span style={{ color: '#808080', fontSize: 14 }}>/month</span>
                  )}
                </div>
                
                <ul style={{ 
                  color: '#ffffff', 
                  textAlign: 'left', 
                  marginBottom: 24, 
                  paddingLeft: 0,
                  listStyle: 'none',
                  width: '100%'
                }}>
                  {(plan.features ? plan.features.split(/,|\n/) : []).map((feature, i) => (
                    <li key={i} style={{ 
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</span>
                      <span>{feature.trim()}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 'auto', width: '100%' }}>
                  {renderPlanButton(plan)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Payment Modal */}
      {showPayment && selectedPlanForPayment && (
        <Suspense fallback={
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
            <div style={{ color: '#22c55e', fontSize: '1.2rem' }}>Loading payment...</div>
          </div>
        }>
          <div>
            {paymentMode === 'stripe' && (
              <StripePaymentComponent
                plan={selectedPlanForPayment}
                onSuccess={handlePaymentComplete}
                onClose={handlePaymentClose}
              />
            )}
            {paymentMode === 'simulate' && (
              <SimplePaymentTest
                plan={selectedPlanForPayment}
                onSuccess={handlePaymentComplete}
                onClose={handlePaymentClose}
              />
            )}
            {!paymentMode && (
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
                maxWidth: '400px',
                textAlign: 'center'
              }}>
                <h3 style={{ color: '#22c55e', marginBottom: '1.5rem' }}>
                  Choose Payment Method
                </h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ color: '#f3f4f6', marginBottom: '0.5rem' }}>
                    {selectedPlanForPayment.name} Plan - €{selectedPlanForPayment.price}
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button
                    onClick={() => setPaymentMode('stripe')}
                    style={{
                      backgroundColor: '#22c55e',
                      color: '#000',
                      border: 'none',
                      padding: '1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                  >
                    💳 Real Stripe Payment (with test cards)
                  </button>
                  
                  <button
                    onClick={() => setPaymentMode('simulate')}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      padding: '1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                  >
                    ⚡ Quick Simulation (no card needed)
                  </button>
                  
                  <button
                    onClick={handlePaymentClose}
                    style={{
                      backgroundColor: '#6b7280',
                      color: '#fff',
                      border: 'none',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>

                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#9ca3af', textAlign: 'left' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong style={{ color: '#22c55e' }}>Stripe Test Cards:</strong>
                    <div>• Success: 4242 4242 4242 4242</div>
                    <div>• Decline: 4000 0000 0000 0002</div>
                    <div>• Requires Auth: 4000 0027 6000 3184</div>
                    <div>• Use any future date & any CVC</div>
                  </div>
                  <div>
                    <strong style={{ color: '#3b82f6' }}>Simulation:</strong> Instant database save
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </Suspense>
      )}
    </div>
  );
}

export default SubscriptionList;