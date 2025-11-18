import React, { useState } from 'react';

const QuickActions = ({ subscription, user, onActionClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getAvailableActions = () => {
    const baseActions = [
      { 
        id: 'contact-support', 
        icon: '💬', 
        label: 'Contact Support', 
        color: '#22c55e',
        available: true,
        description: 'Get help from our support team'
      },
      { 
        id: 'referral-program', 
        icon: '🎁', 
        label: 'Refer Friends', 
        color: '#8b5cf6',
        available: true,
        description: 'Earn rewards for referrals'
      }
    ];

    // Actions for users with subscriptions
    if (subscription) {
      baseActions.unshift(
        { 
          id: 'download-invoice', 
          icon: '📄', 
          label: 'Download Invoice', 
          color: '#3b82f6',
          available: true,
          description: 'Download your latest invoice'
        },
        { 
          id: 'update-payment', 
          icon: '💳', 
          label: 'Update Payment', 
          color: '#f59e0b',
          available: true,
          description: 'Update payment method'
        },
        { 
          id: 'pause-subscription', 
          icon: '⏸️', 
          label: 'Pause Plan', 
          color: '#ef4444',
          available: subscription.status === 'active',
          description: 'Temporarily pause your subscription'
        }
      );
    }

    // Special actions for different plan types
    if (subscription?.plan_name === 'Enterprise') {
      baseActions.push({
        id: 'dedicated-support',
        icon: '🎯',
        label: 'Dedicated Support',
        color: '#22c55e',
        available: true,
        description: 'Access your dedicated account manager'
      });
    }

    if (user && !subscription) {
      baseActions.unshift({
        id: 'browse-plans',
        icon: '📋',
        label: 'Browse Plans',
        color: '#22c55e',
        available: true,
        description: 'Find the perfect plan for you'
      });
    }

    return baseActions.filter(action => action.available);
  };

  const actions = getAvailableActions();

  const handleActionClick = (actionId) => {
    // Handle built-in actions
    switch (actionId) {
      case 'download-invoice':
        // Simulate invoice download
        const link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,Invoice for ' + (subscription?.plan_name || 'Subscription') + ' - €' + (subscription?.plan_price || '0.00');
        link.download = `invoice-${new Date().toISOString().split('T')[0]}.txt`;
        link.click();
        break;
      
      case 'contact-support':
        // Open support modal or redirect
        if (onActionClick) {
          onActionClick(actionId);
        } else {
          // Fallback: open email client
          window.location.href = 'mailto:support@playatac.com?subject=Support Request';
        }
        break;
      
      case 'browse-plans':
        // Scroll to plans section
        document.getElementById('subscription-plans')?.scrollIntoView({ 
          behavior: 'smooth' 
        });
        break;
      
      default:
        // Pass to parent component
        if (onActionClick) {
          onActionClick(actionId);
        }
    }
    
    // Auto-collapse after action (optional)
    setTimeout(() => setIsExpanded(false), 1000);
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        right: isExpanded ? '0' : '-320px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        border: '1px solid #333',
        borderRadius: '12px 0 0 12px',
        padding: '1.5rem',
        transition: 'right 0.3s ease',
        zIndex: 1000,
        width: '340px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '-5px 0 20px rgba(0,0,0,0.5)'
      }}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            position: 'absolute',
            left: '-48px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'linear-gradient(45deg, #22c55e, #16a34a)',
            color: 'white',
            border: 'none',
            borderRadius: '8px 0 0 8px',
            padding: '1rem 0.75rem',
            cursor: 'pointer',
            fontSize: '1.2rem',
            transition: 'all 0.3s ease',
            boxShadow: '-3px 0 10px rgba(0,0,0,0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'linear-gradient(45deg, #16a34a, #15803d)';
            e.target.style.transform = 'translateY(-50%) scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'linear-gradient(45deg, #22c55e, #16a34a)';
            e.target.style.transform = 'translateY(-50%) scale(1)';
          }}
          title={isExpanded ? 'Close Quick Actions' : 'Open Quick Actions'}
        >
          {isExpanded ? '→' : '←'}
        </button>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ 
            color: '#fff', 
            margin: '0 0 0.5rem 0', 
            fontSize: '1.3rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>⚡</span> Quick Actions
          </h3>
          <p style={{ 
            color: '#888', 
            margin: 0, 
            fontSize: '0.85rem',
            lineHeight: '1.4'
          }}>
            {subscription 
              ? `Manage your ${subscription.plan_name} subscription`
              : 'Explore our gaming platform'
            }
          </p>
        </div>

        {/* Actions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {actions.map((action, index) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.id)}
              style={{
                background: 'rgba(42, 42, 42, 0.8)',
                color: '#fff',
                border: `2px solid ${action.color}`,
                borderRadius: '10px',
                padding: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
              }}
              onMouseEnter={(e) => {
                e.target.style.background = action.color;
                e.target.style.transform = 'translateX(-8px)';
                e.target.style.boxShadow = `5px 5px 15px ${action.color}33`;
                e.target.style.color = action.color === '#f59e0b' ? '#000' : '#fff';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(42, 42, 42, 0.8)';
                e.target.style.transform = 'translateX(0)';
                e.target.style.boxShadow = 'none';
                e.target.style.color = '#fff';
              }}
            >
              {/* Icon */}
              <div style={{ 
                fontSize: '1.5rem',
                minWidth: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {action.icon}
              </div>
              
              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: 'bold',
                  marginBottom: '2px',
                  fontSize: '0.95rem'
                }}>
                  {action.label}
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  opacity: 0.8,
                  lineHeight: '1.3'
                }}>
                  {action.description}
                </div>
              </div>

              {/* Arrow indicator */}
              <div style={{ 
                fontSize: '0.8rem', 
                opacity: 0.6,
                transition: 'all 0.3s ease'
              }}>
                →
              </div>

              {/* Hover effect overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${action.color}22, transparent)`,
                transition: 'left 0.5s ease'
              }}></div>
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid #22c55e',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: 'bold' }}>
            💡 Pro Tip
          </div>
          <div style={{ color: '#ccc', fontSize: '0.8rem', marginTop: '4px' }}>
            {subscription 
              ? 'Use keyboard shortcut Ctrl+Q to toggle this panel'
              : 'Subscribe to unlock more quick actions'
            }
          </div>
        </div>
      </div>

      {/* Keyboard shortcut listener */}
      <div style={{ display: 'none' }} 
           onKeyDown={(e) => {
             if (e.ctrlKey && e.key === 'q') {
               e.preventDefault();
               setIsExpanded(!isExpanded);
             }
           }}
           tabIndex={-1}
           ref={(el) => {
             if (el) {
               window.addEventListener('keydown', (e) => {
                 if (e.ctrlKey && e.key === 'q') {
                   e.preventDefault();
                   setIsExpanded(!isExpanded);
                 }
               });
             }
           }}
      />

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        /* Custom scrollbar for the sidebar */
        div::-webkit-scrollbar {
          width: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: #2a2a2a;
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: #22c55e;
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: #16a34a;
        }
      `}</style>
    </>
  );
};

export default QuickActions;