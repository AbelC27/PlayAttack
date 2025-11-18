import React, { useState, useEffect } from 'react';

const SmartAlerts = ({ subscription, user, onActionClick }) => {
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(
    JSON.parse(localStorage.getItem('dismissedAlerts') || '[]')
  );

  useEffect(() => {
    if (!subscription && !user) return;

    const smartAlerts = [];
    const currentDate = new Date();

    // Payment reminder alerts
    if (subscription?.renewal_date) {
      const renewalDate = new Date(subscription.renewal_date);
      const daysUntilRenewal = Math.ceil((renewalDate - currentDate) / (1000 * 60 * 60 * 24));

      if (daysUntilRenewal <= 7 && daysUntilRenewal > 0 && !dismissedAlerts.includes('payment-reminder')) {
        smartAlerts.push({
          id: 'payment-reminder',
          type: 'warning',
          icon: '💳',
          title: 'Payment Due Soon',
          message: `Your ${subscription.plan_name} subscription renews in ${daysUntilRenewal} day${daysUntilRenewal > 1 ? 's' : ''}`,
          action: { 
            text: 'Update Payment Method', 
            onClick: () => onActionClick?.('update-payment') 
          },
          dismissable: true
        });
      }

      // Overdue payment
      if (daysUntilRenewal < 0 && !dismissedAlerts.includes('payment-overdue')) {
        smartAlerts.push({
          id: 'payment-overdue',
          type: 'error',
          icon: '🚨',
          title: 'Payment Overdue',
          message: `Your subscription payment is ${Math.abs(daysUntilRenewal)} days overdue. Update your payment method to continue service.`,
          action: { 
            text: 'Update Payment Now', 
            onClick: () => onActionClick?.('update-payment') 
          },
          dismissable: false // Critical alert
        });
      }
    }

    // Welcome message for new users
    if (user && !subscription && !dismissedAlerts.includes('welcome-new-user')) {
      smartAlerts.push({
        id: 'welcome-new-user',
        type: 'info',
        icon: '🎉',
        title: 'Welcome to PlayAtac!',
        message: 'Start your gaming journey with our Free plan or upgrade for unlimited access to our game library.',
        action: { 
          text: 'Browse Plans', 
          onClick: () => {
            document.getElementById('subscription-plans')?.scrollIntoView({ behavior: 'smooth' });
          }
        },
        dismissable: true
      });
    }

    // Usage milestone (simulated based on plan)
    if (subscription && Math.random() > 0.6 && !dismissedAlerts.includes('usage-milestone')) {
      const gamesAccessed = Math.floor(Math.random() * 25) + 15;
      smartAlerts.push({
        id: 'usage-milestone',
        type: 'success',
        icon: '🎯',
        title: 'Gaming Milestone!',
        message: `Awesome! You've accessed ${gamesAccessed} games this month with your ${subscription.plan_name} plan.`,
        action: { 
          text: 'View Analytics', 
          onClick: () => onActionClick?.('view-analytics') 
        },
        dismissable: true
      });
    }

    // Upgrade suggestion for Free plan users
    if (subscription?.plan_name === 'Free' && !dismissedAlerts.includes('upgrade-suggestion-free')) {
      smartAlerts.push({
        id: 'upgrade-suggestion-free',
        type: 'info',
        icon: '⬆️',
        title: 'Unlock More Games',
        message: 'You\'re on the Free plan. Upgrade to Pro for unlimited access and priority support!',
        action: { 
          text: 'Compare Plans', 
          onClick: () => onActionClick?.('compare-plans') 
        },
        dismissable: true
      });
    }

    // Upgrade suggestion for Pro users
    if (subscription?.plan_name === 'Pro' && Math.random() > 0.8 && !dismissedAlerts.includes('upgrade-suggestion-pro')) {
      smartAlerts.push({
        id: 'upgrade-suggestion-pro',
        type: 'info',
        icon: '🚀',
        title: 'Consider Business Plan',
        message: 'Based on your usage pattern, the Business plan offers better value with API access and custom integrations.',
        action: { 
          text: 'Learn More', 
          onClick: () => onActionClick?.('compare-plans') 
        },
        dismissable: true
      });
    }

    // Special offers (seasonal)
    const month = currentDate.getMonth();
    if ((month === 11 || month === 0) && !dismissedAlerts.includes('holiday-offer-2025')) { // December or January
      smartAlerts.push({
        id: 'holiday-offer-2025',
        type: 'special',
        icon: '🎁',
        title: 'Holiday Special!',
        message: 'Get 20% off any annual subscription plan. Limited time offer ending January 31st!',
        action: { 
          text: 'Claim Offer', 
          onClick: () => onActionClick?.('holiday-offer') 
        },
        dismissable: true
      });
    }

    // Data backup reminder
    if (subscription && Math.random() > 0.9 && !dismissedAlerts.includes('backup-reminder')) {
      smartAlerts.push({
        id: 'backup-reminder',
        type: 'info',
        icon: '💾',
        title: 'Backup Your Game Data',
        message: 'Remember to backup your game saves and settings. We recommend doing this monthly.',
        action: { 
          text: 'Backup Guide', 
          onClick: () => onActionClick?.('backup-guide') 
        },
        dismissable: true
      });
    }

    setAlerts(smartAlerts);
  }, [subscription, user, dismissedAlerts, onActionClick]);

  const dismissAlert = (alertId) => {
    const newDismissed = [...dismissedAlerts, alertId];
    setDismissedAlerts(newDismissed);
    localStorage.setItem('dismissedAlerts', JSON.stringify(newDismissed));
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  if (alerts.length === 0) return null;

  const getAlertStyles = (type) => {
    const styles = {
      warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b' },
      error: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444' },
      success: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e' },
      info: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6' },
      special: { bg: 'rgba(147, 51, 234, 0.1)', border: '#9333ea' }
    };
    return styles[type] || styles.info;
  };

  return (
    <div style={{
      background: '#1a1a1a',
      borderRadius: '12px',
      padding: '2rem',
      marginBottom: '2rem',
      border: '1px solid #333',
      animation: 'fadeInUp 0.6s ease-out'
    }}>
      <h3 style={{ 
        color: '#fff', 
        marginBottom: '1.5rem',
        fontSize: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span>🔔</span> Smart Alerts
        <span style={{
          background: '#22c55e',
          color: '#000',
          fontSize: '0.7rem',
          padding: '2px 6px',
          borderRadius: '12px',
          fontWeight: 'bold'
        }}>
          {alerts.length}
        </span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {alerts.map(alert => {
          const alertStyle = getAlertStyles(alert.type);
          
          return (
            <div 
              key={alert.id} 
              style={{
                background: alertStyle.bg,
                border: `1px solid ${alertStyle.border}`,
                borderRadius: '8px',
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                animation: 'slideInLeft 0.4s ease-out',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = `0 8px 16px ${alertStyle.border}33`;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {/* Special glow effect for special alerts */}
              {alert.type === 'special' && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(147, 51, 234, 0.3), transparent)',
                  animation: 'shimmer 2s infinite'
                }}></div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <div style={{ 
                  fontSize: '1.5rem',
                  animation: alert.type === 'error' ? 'pulse 1s infinite' : 'none'
                }}>
                  {alert.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    color: '#fff', 
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}>
                    {alert.title}
                  </h4>
                  <p style={{ 
                    color: '#ccc', 
                    margin: 0, 
                    fontSize: '0.9rem',
                    lineHeight: '1.4'
                  }}>
                    {alert.message}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {alert.action && (
                  <button
                    onClick={alert.action.onClick}
                    style={{
                      background: alert.type === 'special' ? 'linear-gradient(45deg, #9333ea, #7c3aed)' :
                                 alertStyle.border,
                      color: alert.type === 'warning' ? '#000' : 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    {alert.action.text}
                  </button>
                )}

                {alert.dismissable && (
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#888',
                      fontSize: '18px',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#fff';
                      e.target.style.background = 'rgba(255,255,255,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#888';
                      e.target.style.background = 'transparent';
                    }}
                    title="Dismiss alert"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
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
        
        @keyframes slideInLeft {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SmartAlerts;