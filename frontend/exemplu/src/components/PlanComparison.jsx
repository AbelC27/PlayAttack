import React, { useState } from 'react';

const PlanComparison = ({ plans, isOpen, onClose, onSelectPlan, currentPlan }) => {
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  if (!isOpen) return null;

  // Define comprehensive feature categories
  const featureCategories = [
    {
      name: 'Gaming Access',
      features: [
        { id: 'monthly_games', name: 'Monthly Games', type: 'number' },
        { id: 'game_library', name: 'Full Game Library Access', type: 'boolean' },
        { id: 'early_access', name: 'Early Access to New Games', type: 'boolean' },
        { id: 'exclusive_titles', name: 'Exclusive Titles', type: 'boolean' },
        { id: 'cloud_gaming', name: 'Cloud Gaming Support', type: 'boolean' }
      ]
    },
    {
      name: 'Support & Service',
      features: [
        { id: 'support_type', name: 'Support Type', type: 'text' },
        { id: 'response_time', name: 'Response Time', type: 'text' },
        { id: 'priority_support', name: 'Priority Support', type: 'boolean' },
        { id: 'dedicated_manager', name: 'Dedicated Account Manager', type: 'boolean' },
        { id: 'phone_support', name: 'Phone Support', type: 'boolean' }
      ]
    },
    {
      name: 'Features & Tools',
      features: [
        { id: 'analytics', name: 'Analytics Dashboard', type: 'boolean' },
        { id: 'api_access', name: 'API Access', type: 'boolean' },
        { id: 'custom_integrations', name: 'Custom Integrations', type: 'boolean' },
        { id: 'backup_saves', name: 'Cloud Save Backup', type: 'boolean' },
        { id: 'multi_device', name: 'Multi-Device Sync', type: 'boolean' }
      ]
    },
    {
      name: 'Limits & Restrictions',
      features: [
        { id: 'concurrent_sessions', name: 'Concurrent Gaming Sessions', type: 'number' },
        { id: 'download_speed', name: 'Download Speed Priority', type: 'text' },
        { id: 'storage_limit', name: 'Cloud Storage Limit', type: 'text' },
        { id: 'bandwidth_limit', name: 'Monthly Bandwidth', type: 'text' }
      ]
    }
  ];

  // Enhanced plan feature mapping
  const getPlanFeatures = (plan) => {
    const baseFeatures = {
      Free: {
        monthly_games: '5 games',
        game_library: false,
        early_access: false,
        exclusive_titles: false,
        cloud_gaming: false,
        support_type: 'Email',
        response_time: '48h',
        priority_support: false,
        dedicated_manager: false,
        phone_support: false,
        analytics: false,
        api_access: false,
        custom_integrations: false,
        backup_saves: true,
        multi_device: false,
        concurrent_sessions: '1 session',
        download_speed: 'Standard',
        storage_limit: '1GB',
        bandwidth_limit: '10GB'
      },
      Pro: {
        monthly_games: 'Unlimited',
        game_library: true,
        early_access: false,
        exclusive_titles: false,
        cloud_gaming: true,
        support_type: 'Email + Chat',
        response_time: '24h',
        priority_support: true,
        dedicated_manager: false,
        phone_support: false,
        analytics: true,
        api_access: false,
        custom_integrations: false,
        backup_saves: true,
        multi_device: true,
        concurrent_sessions: '2 sessions',
        download_speed: 'High',
        storage_limit: '50GB',
        bandwidth_limit: '100GB'
      },
      Business: {
        monthly_games: 'Unlimited',
        game_library: true,
        early_access: true,
        exclusive_titles: false,
        cloud_gaming: true,
        support_type: 'Email + Chat + Phone',
        response_time: '4h',
        priority_support: true,
        dedicated_manager: false,
        phone_support: true,
        analytics: true,
        api_access: true,
        custom_integrations: true,
        backup_saves: true,
        multi_device: true,
        concurrent_sessions: '5 sessions',
        download_speed: 'Premium',
        storage_limit: '500GB',
        bandwidth_limit: 'Unlimited'
      },
      Enterprise: {
        monthly_games: 'Unlimited',
        game_library: true,
        early_access: true,
        exclusive_titles: true,
        cloud_gaming: true,
        support_type: 'Dedicated Support',
        response_time: '30min',
        priority_support: true,
        dedicated_manager: true,
        phone_support: true,
        analytics: true,
        api_access: true,
        custom_integrations: true,
        backup_saves: true,
        multi_device: true,
        concurrent_sessions: 'Unlimited',
        download_speed: 'Enterprise',
        storage_limit: 'Unlimited',
        bandwidth_limit: 'Unlimited'
      }
    };

    return baseFeatures[plan.name] || baseFeatures.Free;
  };

  const renderFeatureValue = (feature, value) => {
    if (feature.type === 'boolean') {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: value ? '#22c55e' : '#ef4444',
          fontSize: '1.2rem'
        }}>
          {value ? '✅' : '❌'}
        </div>
      );
    }
    
    if (feature.type === 'number' || feature.type === 'text') {
      return (
        <div style={{
          textAlign: 'center',
          color: '#fff',
          fontSize: '0.9rem',
          fontWeight: value.toString().includes('Unlimited') ? 'bold' : 'normal'
        }}>
          {value}
        </div>
      );
    }

    return value;
  };

  const getPlanCardStyle = (plan) => {
    const isPopular = plan.name === 'Pro';
    const isEnterprise = plan.name === 'Enterprise';
    const isCurrent = currentPlan?.plan_name === plan.name;

    return {
      background: isCurrent 
        ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
        : isEnterprise 
          ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' 
          : isPopular 
            ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
            : '#2a2a2a',
      border: isCurrent 
        ? '3px solid #22c55e' 
        : isPopular 
          ? '2px solid #3b82f6' 
          : '1px solid #444',
      borderRadius: '16px',
      padding: '2rem',
      position: 'relative',
      transform: isPopular ? 'scale(1.05)' : 'scale(1)',
      boxShadow: isPopular ? '0 10px 30px rgba(59, 130, 246, 0.3)' : '0 5px 15px rgba(0,0,0,0.3)'
    };
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: '2rem',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1b35 100%)',
        borderRadius: '20px',
        padding: '2rem',
        maxWidth: '1400px',
        width: '100%',
        maxHeight: '95vh',
        overflow: 'auto',
        border: '1px solid #333',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem',
          borderBottom: '2px solid #333',
          paddingBottom: '1rem'
        }}>
          <div>
            <h2 style={{ 
              color: '#fff', 
              margin: '0 0 0.5rem 0',
              fontSize: '2rem',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #22c55e, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              📊 Plan Comparison
            </h2>
            <p style={{ color: '#888', margin: 0, fontSize: '1rem' }}>
              Compare features and find the perfect plan for your gaming needs
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* View Toggle */}
            <div style={{
              background: '#2a2a2a',
              borderRadius: '8px',
              padding: '4px',
              border: '1px solid #444'
            }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  background: viewMode === 'table' ? '#22c55e' : 'transparent',
                  color: viewMode === 'table' ? '#000' : '#ccc',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                📋 Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  background: viewMode === 'cards' ? '#22c55e' : 'transparent',
                  color: viewMode === 'cards' ? '#000' : '#ccc',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🃏 Cards
              </button>
            </div>

            <button 
              onClick={onClose} 
              style={{
                background: 'transparent',
                border: '2px solid #ef4444',
                color: '#ef4444',
                fontSize: '1.2rem',
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#ef4444';
                e.target.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#ef4444';
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {viewMode === 'cards' ? (
          /* Card View */
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(plans.length, 4)}, 1fr)`,
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {plans.map(plan => {
              const features = getPlanFeatures(plan);
              return (
                <div key={plan.id} style={getPlanCardStyle(plan)}>
                  {/* Popular Badge */}
                  {plan.name === 'Pro' && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(45deg, #f59e0b, #d97706)',
                      color: '#000',
                      padding: '6px 16px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      🔥 MOST POPULAR
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {currentPlan?.plan_name === plan.name && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'rgba(0,0,0,0.8)',
                      color: '#22c55e',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}>
                      CURRENT
                    </div>
                  )}

                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ 
                      color: '#fff', 
                      fontSize: '1.5rem', 
                      margin: '0 0 1rem 0',
                      fontWeight: 'bold'
                    }}>
                      {plan.name}
                    </h3>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ 
                        fontSize: '3rem', 
                        fontWeight: 'bold',
                        color: '#fff'
                      }}>
                        €{plan.price}
                      </span>
                      <span style={{ color: '#ccc', fontSize: '1rem' }}>
                        {plan.price > 0 ? '/month' : ''}
                      </span>
                    </div>

                    <button 
                      onClick={() => onSelectPlan(plan)}
                      disabled={currentPlan?.plan_name === plan.name}
                      style={{
                        background: currentPlan?.plan_name === plan.name 
                          ? '#666' 
                          : 'linear-gradient(45deg, #22c55e, #16a34a)',
                        color: 'white',
                        border: 'none',
                        padding: '1rem 2rem',
                        borderRadius: '8px',
                        cursor: currentPlan?.plan_name === plan.name ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        width: '100%',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {currentPlan?.plan_name === plan.name ? 'Current Plan' : `Choose ${plan.name}`}
                    </button>
                  </div>

                  {/* Key Features */}
                  <div style={{ fontSize: '0.9rem' }}>
                    <div style={{ color: '#ccc', marginBottom: '1rem', fontWeight: 'bold' }}>
                      Key Features:
                    </div>
                    {[
                      `${features.monthly_games} monthly`,
                      features.analytics ? 'Analytics Dashboard' : null,
                      features.api_access ? 'API Access' : null,
                      features.support_type
                    ].filter(Boolean).slice(0, 4).map((feature, i) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        color: '#fff'
                      }}>
                        <span style={{ color: '#22c55e' }}>✓</span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{
                    background: '#2a2a2a',
                    color: '#fff',
                    padding: '1rem',
                    textAlign: 'left',
                    border: '1px solid #444',
                    fontWeight: 'bold',
                    minWidth: '200px'
                  }}>
                    Features
                  </th>
                  {plans.map(plan => (
                    <th key={plan.id} style={{
                      background: currentPlan?.plan_name === plan.name ? '#22c55e' : '#2a2a2a',
                      color: currentPlan?.plan_name === plan.name ? '#000' : '#fff',
                      padding: '1rem',
                      textAlign: 'center',
                      border: '1px solid #444',
                      minWidth: '150px',
                      position: 'relative'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {plan.name}
                      </div>
                      <div style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 'bold',
                        marginBottom: '0.5rem'
                      }}>
                        €{plan.price}
                      </div>
                      {currentPlan?.plan_name === plan.name && (
                        <div style={{
                          fontSize: '0.8rem',
                          background: 'rgba(0,0,0,0.2)',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          CURRENT
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureCategories.map(category => (
                  <React.Fragment key={category.name}>
                    <tr>
                      <td colSpan={plans.length + 1} style={{
                        background: '#333',
                        color: '#22c55e',
                        padding: '0.75rem 1rem',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        border: '1px solid #444'
                      }}>
                        {category.name}
                      </td>
                    </tr>
                    {category.features.map(feature => (
                      <tr key={feature.id}>
                        <td style={{
                          background: '#1a1a1a',
                          color: '#ccc',
                          padding: '0.75rem 1rem',
                          border: '1px solid #444'
                        }}>
                          {feature.name}
                        </td>
                        {plans.map(plan => {
                          const planFeatures = getPlanFeatures(plan);
                          return (
                            <td key={plan.id} style={{
                              background: currentPlan?.plan_name === plan.name ? 'rgba(34, 197, 94, 0.1)' : '#1a1a1a',
                              padding: '0.75rem',
                              border: '1px solid #444',
                              textAlign: 'center'
                            }}>
                              {renderFeatureValue(feature, planFeatures[feature.id])}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          paddingTop: '2rem',
          borderTop: '2px solid #333'
        }}>
          <button
            onClick={() => window.open('/support', '_blank')}
            style={{
              background: 'transparent',
              border: '2px solid #3b82f6',
              color: '#3b82f6',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            💬 Need Help Choosing?
          </button>
          
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(45deg, #22c55e, #16a34a)',
              border: 'none',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            ✓ Done Comparing
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanComparison;