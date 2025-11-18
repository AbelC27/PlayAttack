import React, { useState, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';
import SubscriptionList from '../components/SubscriptionList';
import UserSubscriptionStatus from '../components/UserSubscriptionStatus';
import SmartAlerts from '../components/SmartAlerts';
import QuickActions from '../components/QuickActions';
import PlanChangeWarning from '../components/PlanChangeWarning';
import { GameCardSkeleton, SubscriptionCardSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../hooks/useAuth';

// Lazy load heavy components for better initial load performance
const PlanComparison = lazy(() => import('../components/PlanComparison'));
const EnhancedGameSearch = lazy(() => import('../components/EnhancedGameSearch'));
const ChatWidget = lazy(() => import('../components/ChatWidget'));

export default function UserDashboard() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [startIdx, setStartIdx] = useState(0);
  const visibleCount = 4;
  const [notifications, setNotifications] = useState([]);
  const [userSubscription, setUserSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);

  const [gamesData, setGamesData] = useState([]); // State for games from database
  const [filteredGames, setFilteredGames] = useState([]);
  const [showGameSearch, setShowGameSearch] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(true); // Separate loading state for games
  
  // Plan change warning state
  const [showPlanChangeWarning, setShowPlanChangeWarning] = useState(false);
  const [pendingPlanChange, setPendingPlanChange] = useState(null);
  
  // Defer loading of heavy components for better initial render
  const [shouldLoadHeavyComponents, setShouldLoadHeavyComponents] = useState(false);

  // Reusable function to fetch user subscription data
  const fetchUserSubscription = useCallback(async (showLoadingState = true) => {
    if (!user?.email) {
      if (showLoadingState) setLoading(false);
      return;
    }

    try {
      if (showLoadingState) setLoading(true);
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/user-subscription/?email=${user.email}`);
      
      if (response.ok) {
        const data = await response.json();
        setUserSubscription(data.subscription);
        return data.subscription;
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      throw err;
    } finally {
      if (showLoadingState) setLoading(false);
    }
  }, [user?.email]);

  // Fetch games from the database
  const fetchGames = useCallback(async () => {
    try {
      setGamesLoading(true);
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/games/`);
      
      if (response.ok) {
        const data = await response.json();
        setGamesData(data);
        setFilteredGames(data);
      } else {
        console.error('Failed to fetch games:', response.statusText);
        // Keep empty arrays if fetch fails
        setGamesData([]);
        setFilteredGames([]);
      }
    } catch (err) {
      console.error('Error fetching games:', err);
      // Keep empty arrays if fetch fails
      setGamesData([]);
      setFilteredGames([]);
    } finally {
      setGamesLoading(false);
    }
  }, []);

  // Fetch user subscription data on component mount
  useEffect(() => {
    fetchUserSubscription();
  }, [fetchUserSubscription]);

  // Fetch games on component mount
  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Defer loading of heavy components after initial render
  useEffect(() => {
    // Load heavy components after a short delay to prioritize initial render
    const timer = setTimeout(() => {
      setShouldLoadHeavyComponents(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Enhanced notification system
  const addNotification = useCallback((type, message, title) => {
    const id = Date.now() + Math.random();
    const notification = { id, type, message, title };
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const showSuccess = useCallback((message, title = 'Success') => addNotification('success', message, title), [addNotification]);
  const showError = useCallback((message, title = 'Error') => addNotification('error', message, title), [addNotification]);
  const showWarning = useCallback((message, title = 'Warning') => addNotification('warning', message, title), [addNotification]);
  const showInfo = useCallback((message, title = 'Info') => addNotification('info', message, title), [addNotification]);

  const canPurchasePlan = useCallback((newPlan) => {
    if (!userSubscription) return { canPurchase: true };
    
    const currentPrice = parseFloat(userSubscription.plan_price || 0);
    const newPrice = parseFloat(newPlan.price || 0);
    
    // Allow all plan changes - we'll show a warning for downgrades
    return { canPurchase: true, isDowngrade: newPrice < currentPrice };
  }, [userSubscription]);

  // Memoize visible games to prevent recalculation on every render
  const visibleGames = useMemo(() => {
    return filteredGames.slice(startIdx, startIdx + visibleCount);
  }, [filteredGames, startIdx, visibleCount]);

  const handlePlanSelection = useCallback((plan) => {
    if (!user) {
      showError('Please sign in to select a plan');
      return;
    }

    // Check if user can purchase this plan
    const purchaseCheck = canPurchasePlan(plan);
    if (!purchaseCheck.canPurchase) {
      showWarning(purchaseCheck.reason, 'Cannot Change Plan');
      return;
    }
    
    // If user has an active subscription and this is a different plan
    if (userSubscription && userSubscription.plan_name !== plan.name) {
      const currentPrice = parseFloat(userSubscription.plan_price || 0);
      const newPrice = parseFloat(plan.price || 0);
      
      // If it's a downgrade or same/cheaper plan, show warning
      if (newPrice <= currentPrice) {
        setPendingPlanChange(plan);
        setShowPlanChangeWarning(true);
        return;
      }
    }
    
    // For new subscriptions or upgrades, proceed normally
    setSelectedPlan(plan);
  }, [user, showError, canPurchasePlan, showWarning, userSubscription]);

  const handlePaymentSuccess = useCallback(async (plan, paymentData) => {
    setSelectedPlan(plan);
    showSuccess(
      `Welcome to ${plan.name}! Your subscription is now active and will renew automatically.`,
      'Subscription Activated'
    );
    
    // Refresh subscription data without page reload
    try {
      await fetchUserSubscription(false); // Don't show loading state
      showSuccess('Subscription data updated successfully!', 'Data Refreshed');
    } catch (err) {
      console.error('Error refreshing subscription:', err);
      showError('Failed to refresh subscription data. Please refresh the page manually.', 'Refresh Failed');
    }
  }, [showSuccess, fetchUserSubscription, showError]);

  // Handle plan change confirmation from warning widget
  const handleConfirmPlanChange = useCallback(async () => {
    if (!pendingPlanChange || !user) return;
    
    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/change-plan/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: user.email,
          plan_id: pendingPlanChange.id
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setShowPlanChangeWarning(false);
        setPendingPlanChange(null);
        
        showSuccess(
          `Plan changed successfully! Your next payment will be €${pendingPlanChange.price}.`,
          'Plan Updated'
        );
        
        // Refresh subscription data
        await fetchUserSubscription(false);
      } else {
        throw new Error(data.error || 'Failed to change plan');
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      showError(error.message || 'Failed to change plan. Please try again.', 'Change Failed');
    }
  }, [pendingPlanChange, user, showSuccess, showError, fetchUserSubscription]);

  // Handle plan change cancellation
  const handleCancelPlanChange = useCallback(() => {
    setShowPlanChangeWarning(false);
    setPendingPlanChange(null);
  }, []);

  const handlePaymentError = useCallback((error) => {
    showError(error.message || 'Payment failed. Please try again.', 'Payment Failed');
  }, [showError]);

  // Manual refresh function for subscription data
  const refreshSubscriptionData = async () => {
    try {
      showInfo('Refreshing subscription data...', 'Loading');
      await fetchUserSubscription(false);
      showSuccess('Subscription data refreshed successfully!', 'Data Updated');
    } catch (err) {
      showError('Failed to refresh subscription data.', 'Refresh Failed');
    }
  };

  // Quick Actions handler
  const handleQuickAction = useCallback((actionId) => {
    switch (actionId) {
      case 'compare-plans':
        setShowPlanComparison(true);
        break;
      case 'update-payment':
        showInfo('Payment update feature coming soon!', 'Feature Update');
        break;
      case 'pause-subscription':
        showWarning('Are you sure you want to pause your subscription?', 'Confirm Action');
        break;
      case 'holiday-offer':
        showSuccess('Holiday offer details will be sent to your email!', 'Offer Claimed');
        break;
      default:
        showInfo(`Action "${actionId}" triggered`, 'Quick Action');
    }
  }, [showInfo, showWarning, showSuccess]);

  // Fetch available plans for comparison
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/api/plans/`);
        if (response.ok) {
          const plans = await response.json();
          setAvailablePlans(plans);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      }
    };
    fetchPlans();
  }, []);

  // Arrow handlers
  const handlePrev = () => {
    setStartIdx((prev) =>
      prev === 0
        ? Math.max(0, filteredGames.length - visibleCount)
        : Math.max(0, prev - visibleCount)
    );
  };

  const handleNext = () => {
    setStartIdx((prev) =>
      prev + visibleCount >= filteredGames.length
        ? 0
        : prev + visibleCount
    );
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };



  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#000000', color: '#ffffff', padding: '2rem' }}>
      {/* Plan Change Warning Widget */}
      {userSubscription && pendingPlanChange && (
        <PlanChangeWarning
          isOpen={showPlanChangeWarning}
          currentPlan={userSubscription}
          newPlan={pendingPlanChange}
          onConfirm={handleConfirmPlanChange}
          onCancel={handleCancelPlanChange}
        />
      )}
      
      {/* Chat Widget - Lazy loaded */}
      {shouldLoadHeavyComponents && (
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      )}
      
      {/* Notification System */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px'
      }}>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              background: notification.type === 'success' ? '#22c55e' :
                         notification.type === 'error' ? '#dc2626' :
                         notification.type === 'warning' ? '#f59e0b' : '#3b82f6',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              cursor: 'pointer',
              animation: 'slideInRight 0.3s ease-out'
            }}
            onClick={() => removeNotification(notification.id)}
          >
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {notification.title}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.4' }}>
                {notification.message}
              </div>
            </div>
            <span style={{ marginLeft: '12px', fontSize: '18px', cursor: 'pointer' }}>×</span>
          </div>
        ))}
      </div>

      {/* Welcome Section */}
      <div style={{ 
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          color: '#22c55e', 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          margin: '0 0 0.5rem 0' 
        }}>
          Welcome to PlayAtac
        </h1>
        {user && (
          <p style={{ 
            color: '#9ca3af', 
            fontSize: '1.1rem', 
            margin: 0 
          }}>
            Hi {user.username || user.email?.split('@')[0]}! Ready to play?
          </p>
        )}
      </div>

      {/* Smart Alerts Section */}
      <SmartAlerts 
        subscription={userSubscription}
        user={user}
        onActionClick={handleQuickAction}
      />

      {/* Enhanced Game Search */}
      {shouldLoadHeavyComponents && (
        <Suspense fallback={
          <div style={{ 
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            Loading search...
          </div>
        }>
          <EnhancedGameSearch 
            games={gamesData}
            onFilteredGames={setFilteredGames}
            loading={gamesLoading}
          />
        </Suspense>
      )}      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h2 style={{ color: '#ffffffff', fontSize: 32, margin: 0 }}>
          {gamesLoading ? 
            'Loading Games...' :
            filteredGames.length < gamesData.length ? 
            `Found ${filteredGames.length} Games` : 
            `Featured Games (${gamesData.length})`
          }
        </h2>
        
        <button
          onClick={() => setShowGameSearch(!showGameSearch)}
          style={{
            background: showGameSearch ? '#22c55e' : 'transparent',
            border: '2px solid #22c55e',
            color: showGameSearch ? '#000' : '#22c55e',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
        >
          {showGameSearch ? '🔍 Search Active' : '🔍 Search Games'}
        </button>
      </div>
      
      {gamesLoading ? (
        <GameCardSkeleton count={4} />
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '2rem',
          width: '100%',
          maxWidth: '100vw',
        }}>
          <button
            onClick={handlePrev}
            style={{
              background: '#222',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              fontSize: '32px',
              cursor: 'pointer'
            }}
          >
            &#8592;
          </button>
          <div style={{
            display: 'flex',
            gap: '24px',
            overflow: 'hidden',
            width: '100%',
            minHeight: '320px',
            justifyContent: 'center'
          }}>
            {visibleGames.map((game, index) => (
              <div
                key={game.id}
                style={{
                  minWidth: '260px',
                  maxWidth: '300px',
                  border: '1px solid #ccc',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  background: '#111',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                }}
              >
                <div style={{
                  width: '100%',
                  height: '200px',
                  borderRadius: '8px',
                  background: '#1f2937',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <img
                    src={game.image_url}
                    alt={game.display_name || game.name}
                    loading={index < 4 ? 'eager' : 'lazy'}
                    decoding="async"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      borderRadius: '8px',
                      transition: 'opacity 0.3s ease'
                    }}
                    onLoad={(e) => {
                      e.target.style.opacity = '1';
                    }}
                    onError={(e) => {
                      e.target.style.opacity = '0.5';
                      e.target.alt = 'Image unavailable';
                    }}
                  />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
                  {game.display_name || game.name}
                </h3>
                {game.genre && (
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    background: '#22c55e',
                    color: '#000',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {game.genre}
                  </span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={handleNext}
            style={{
              background: '#222',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              fontSize: '32px',
              cursor: 'pointer'
            }}
          >
            &#8594;
          </button>
        </div>
      )}

      {/* Professional Subscription Dashboard */}
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Subscription Overview Cards */}
        {loading ? (
          <SubscriptionCardSkeleton count={3} />
        ) : (
          <div className="subscription-cards-grid">
          {/* Current Subscription Card */}
          <div className="subscription-overview-card" style={{
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            border: '1px solid #374151',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ 
              color: '#22c55e', 
              marginBottom: '1rem', 
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>💎</span> Current Plan
              </span>
              <button
                onClick={refreshSubscriptionData}
                style={{
                  background: 'transparent',
                  border: '1px solid #22c55e',
                  color: '#22c55e',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#22c55e';
                  e.target.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#22c55e';
                }}
                title="Refresh subscription data"
              >
                🔄
              </button>
            </h3>
            {userSubscription ? (
              <div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: '#ffffff', 
                  marginBottom: '0.5rem' 
                }}>
                  {userSubscription.plan_name}
                </div>
                <div style={{ 
                  fontSize: '1.1rem', 
                  color: '#22c55e', 
                  marginBottom: '1rem',
                  fontWeight: '600'
                }}>
                  €{userSubscription.plan_price}/month
                </div>
                <div style={{ 
                  padding: '0.75rem 1rem',
                  backgroundColor: userSubscription.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${userSubscription.status === 'active' ? '#22c55e' : '#ef4444'}`,
                  borderRadius: '8px',
                  display: 'inline-block',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  <span style={{
                    color: userSubscription.status === 'active' ? '#22c55e' : '#ef4444'
                  }}>
                    ● {userSubscription.status.charAt(0).toUpperCase() + userSubscription.status.slice(1)}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  color: '#9ca3af', 
                  marginBottom: '1rem' 
                }}>
                  No Active Subscription
                </div>
                <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Choose a plan below to get started with unlimited gaming access
                </p>
              </div>
            )}
          </div>

          {/* Next Payment Card */}
          <div className="subscription-overview-card" style={{
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            border: '1px solid #374151',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ 
              color: '#3b82f6', 
              marginBottom: '1rem', 
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>📅</span> Next Payment
            </h3>
            {userSubscription?.renewal_date ? (
              <div>
                <div style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold', 
                  color: '#ffffff', 
                  marginBottom: '0.5rem',
                  lineHeight: '1.3'
                }}>
                  {new Date(userSubscription.renewal_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: '0.9rem',
                  marginBottom: '1rem'
                }}>
                  {Math.ceil((new Date(userSubscription.renewal_date) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                </div>
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: '#3b82f6'
                }}>
                  Amount: €{userSubscription.plan_price}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ 
                  fontSize: '1.25rem', 
                  color: '#9ca3af', 
                  marginBottom: '1rem' 
                }}>
                  No upcoming payments
                </div>
                <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
                  {userSubscription ? 'Your subscription is not set for auto-renewal' : 'Subscribe to a plan to see payment schedule'}
                </p>
              </div>
            )}
          </div>

          {/* Account Status Card */}
          <div className="subscription-overview-card" style={{
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            border: '1px solid #374151',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ 
              color: '#f59e0b', 
              marginBottom: '1rem', 
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>⚡</span> Access Level
            </h3>
            <div>
              <div style={{ 
                fontSize: '1.3rem', 
                fontWeight: 'bold', 
                color: '#ffffff', 
                marginBottom: '0.5rem' 
              }}>
                {userSubscription ? 'Premium Access' : 'Limited Access'}
              </div>
              <div style={{ 
                color: '#9ca3af', 
                fontSize: '0.95rem',
                marginBottom: '1rem',
                lineHeight: '1.5'
              }}>
                {userSubscription 
                  ? 'Unlimited access to all games and features'
                  : 'Upgrade to unlock the full game library'
                }
              </div>
              {!userSubscription && (
                <button
                  onClick={() => {
                    document.getElementById('subscription-plans').scrollIntoView({ 
                      behavior: 'smooth' 
                    });
                  }}
                  style={{
                    background: 'linear-gradient(45deg, #f59e0b, #d97706)',
                    color: '#000',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 16px rgba(245, 158, 11, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  Upgrade Now
                </button>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Detailed Subscription Status */}
        <div style={{ marginTop: '2rem' }}>
          <UserSubscriptionStatus />
        </div>
      </div>

      {/* Plans Section */}
      <div id="subscription-plans">
        <SubscriptionList
          selectedPlan={selectedPlan}
          handlePlanSelection={handlePlanSelection}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          user={user}
          hasActiveSubscription={userSubscription && userSubscription.status === 'active'}
          currentSubscription={userSubscription}
        />
      </div>

      {/* Quick Actions Sidebar */}
      <QuickActions 
        subscription={userSubscription}
        user={user}
        onActionClick={handleQuickAction}
      />

      {/* Plan Comparison Modal */}
      {shouldLoadHeavyComponents && showPlanComparison && (
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
            zIndex: 9999
          }}>
            <div style={{ color: '#22c55e', fontSize: '1.2rem' }}>Loading comparison...</div>
          </div>
        }>
          <PlanComparison
            plans={availablePlans}
            isOpen={showPlanComparison}
            onClose={() => setShowPlanComparison(false)}
            onSelectPlan={handlePlanSelection}
            currentPlan={userSubscription}
          />
        </Suspense>
      )}
      
      {/* CSS Animations & Responsive Design */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .subscription-card {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .subscription-card:nth-child(2) {
          animation-delay: 0.1s;
        }
        
        .subscription-card:nth-child(3) {
          animation-delay: 0.2s;
        }

        .subscription-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        @media (max-width: 1200px) {
          .subscription-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
          }
        }

        @media (max-width: 768px) {
          .subscription-cards-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        @media (max-width: 480px) {
          .subscription-cards-grid {
            gap: 0.75rem;
          }
        }

        .detailed-overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .detailed-overview-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }

        .subscription-overview-card {
          animation: fadeInUp 0.8s ease-out;
        }

        .subscription-overview-card:hover {
          transform: translateY(-4px);
          transition: transform 0.3s ease;
        }
      `}</style>
    </div>
  );
}