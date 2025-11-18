// frontend/exemplu/src/pages/UserProfile.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// Add CSS animation for spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  if (!document.querySelector('style[data-spinner-animation]')) {
    style.setAttribute('data-spinner-animation', 'true');
    document.head.appendChild(style);
  }
}

export default function UserProfile() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [subscription, setSubscription] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Extract stable email value to prevent infinite loops
  const userEmail = useMemo(() => user?.email, [user?.email]);

  // Fetch user subscription data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userEmail) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
        
        const response = await fetch(
          `${API_URL}/api/user-subscription/?email=${encodeURIComponent(userEmail)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription);
          setPaymentHistory(data.payment_history || []);
          setError(null);
        } else {
          console.error('Failed to fetch subscription data');
          setError('Failed to load subscription information');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Unable to connect to server');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data when user is fully loaded
    if (!authLoading && userEmail) {
      fetchUserData();
    } else if (!authLoading && !userEmail) {
      setLoading(false);
    }
  }, [userEmail, authLoading]);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#22c55e';
      case 'canceled':
        return '#ef4444';
      case 'paid':
        return '#22c55e';
      default:
        return '#9ca3af';
    }
  };

  return (
    <div style={styles.container}>
      {/* Profile Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.avatarCircle}>
            {userProfile?.username?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={styles.headerTitle}>My Account</h1>
            <p style={styles.headerSubtitle}>
              Manage your profile and subscription
            </p>
          </div>
        </div>
      </div>

      <div style={styles.contentWrapper}>
        {/* Account Information Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              <span style={styles.cardIcon}>👤</span>
              Account Information
            </h2>
          </div>
          <div style={styles.cardBody}>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <label style={styles.infoLabel}>Email Address</label>
                <div style={styles.infoValue}>{user.email}</div>
              </div>
              
              <div style={styles.infoItem}>
                <label style={styles.infoLabel}>Username</label>
                <div style={styles.infoValue}>
                  {userProfile?.username || 'Not set'}
                </div>
              </div>
              
              <div style={styles.infoItem}>
                <label style={styles.infoLabel}>Account Type</label>
                <div style={{
                  ...styles.infoValue,
                  color: userProfile?.role === 'admin' ? '#fbbf24' : '#22c55e'
                }}>
                  {userProfile?.role === 'admin' ? '👑 Admin' : '👤 User'}
                </div>
              </div>
              
              <div style={styles.infoItem}>
                <label style={styles.infoLabel}>Member Since</label>
                <div style={styles.infoValue}>
                  {formatDate(userProfile?.date_joined)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              <span style={styles.cardIcon}>💳</span>
              Subscription Status
            </h2>
          </div>
          <div style={styles.cardBody}>
            {loading ? (
              <div style={styles.loadingSmall}>
                <div style={styles.spinnerSmall}></div>
                <span>Loading subscription details...</span>
              </div>
            ) : error ? (
              <div style={styles.errorMessage}>
                <span>⚠️</span> {error}
              </div>
            ) : subscription ? (
              <div style={styles.subscriptionContent}>
                <div style={styles.subscriptionHeader}>
                  <div style={styles.planBadge}>
                    {subscription.plan_name}
                  </div>
                  <div style={{
                    ...styles.statusBadge,
                    backgroundColor: subscription.status === 'active' ? '#065f46' : '#7f1d1d',
                    borderColor: getStatusColor(subscription.status)
                  }}>
                    {subscription.status === 'active' ? '✓ Active' : '⚠ Inactive'}
                  </div>
                </div>
                
                <div style={styles.subscriptionGrid}>
                  <div style={styles.subscriptionItem}>
                    <label style={styles.infoLabel}>Plan Price</label>
                    <div style={styles.priceValue}>
                      {subscription.plan_price} {subscription.plan_currency}
                      <span style={styles.pricePeriod}>/month</span>
                    </div>
                  </div>
                  
                  <div style={styles.subscriptionItem}>
                    <label style={styles.infoLabel}>Start Date</label>
                    <div style={styles.infoValue}>
                      {formatDate(subscription.start_date)}
                    </div>
                  </div>
                  
                  {subscription.renewal_date && (
                    <div style={styles.subscriptionItem}>
                      <label style={styles.infoLabel}>Next Renewal</label>
                      <div style={styles.infoValue}>
                        {formatDate(subscription.renewal_date)}
                      </div>
                    </div>
                  )}
                </div>

                {subscription.plan_features && (
                  <div style={styles.featuresSection}>
                    <label style={styles.infoLabel}>Plan Features</label>
                    <ul style={styles.featuresList}>
                      {subscription.plan_features.split('\n').map((feature, index) => (
                        <li key={index} style={styles.featureItem}>
                          <span style={styles.checkmark}>✓</span>
                          {feature.trim()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.noSubscription}>
                <div style={styles.noSubscriptionIcon}>📦</div>
                <p style={styles.noSubscriptionText}>
                  You don't have an active subscription yet
                </p>
                <button
                  style={styles.upgradeButton}
                  onClick={() => navigate('/plans')}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  View Available Plans
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payment History Card */}
        {paymentHistory && paymentHistory.length > 0 && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📜</span>
                Payment History
              </h2>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.tableHeader}>Date</th>
                      <th style={styles.tableHeader}>Plan</th>
                      <th style={styles.tableHeader}>Amount</th>
                      <th style={styles.tableHeader}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment, index) => (
                      <tr key={payment.id} style={styles.tableRow}>
                        <td style={styles.tableCell}>
                          {formatDate(payment.date)}
                        </td>
                        <td style={styles.tableCell}>{payment.plan_name}</td>
                        <td style={styles.tableCell}>
                          {payment.amount} {payment.currency}
                        </td>
                        <td style={styles.tableCell}>
                          <span style={{
                            ...styles.statusBadgeSmall,
                            backgroundColor: payment.status === 'paid' ? '#065f46' : '#7f1d1d',
                            borderColor: getStatusColor(payment.status)
                          }}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0b0c',
    color: '#f3f6f4',
    padding: '2rem 1rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #22272f',
    borderTop: '4px solid #22c55e',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '1rem',
    color: '#8b95a5',
    fontSize: '1.1rem',
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto 2rem',
    backgroundColor: '#0f1216',
    borderRadius: '16px',
    padding: '2rem',
    border: '1px solid #22272f',
    boxShadow: '0 10px 30px rgba(0,0,0,.45)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  avatarCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    color: '#0a0b0c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#f3f6f4',
    margin: '0 0 0.5rem 0',
  },
  headerSubtitle: {
    fontSize: '1.1rem',
    color: '#8b95a5',
    margin: 0,
  },
  contentWrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: '#0f1216',
    borderRadius: '16px',
    border: '1px solid #22272f',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,.45)',
  },
  cardHeader: {
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #22272f',
    backgroundColor: '#0b0e12',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#f3f6f4',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  cardIcon: {
    fontSize: '1.75rem',
  },
  cardBody: {
    padding: '2rem',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  infoLabel: {
    fontSize: '0.875rem',
    color: '#8b95a5',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '1.125rem',
    color: '#f3f6f4',
    fontWeight: '600',
  },
  subscriptionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  subscriptionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  planBadge: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#22c55e',
    padding: '0.5rem 1.25rem',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: '12px',
    border: '2px solid #22c55e',
  },
  statusBadge: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    border: '1px solid',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  subscriptionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    padding: '1.5rem',
    backgroundColor: '#0b0e12',
    borderRadius: '12px',
    border: '1px solid #22272f',
  },
  subscriptionItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  priceValue: {
    fontSize: '1.75rem',
    color: '#22c55e',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.25rem',
  },
  pricePeriod: {
    fontSize: '0.875rem',
    color: '#8b95a5',
    fontWeight: 'normal',
  },
  featuresSection: {
    marginTop: '1rem',
  },
  featuresList: {
    listStyle: 'none',
    padding: 0,
    margin: '0.75rem 0 0 0',
    display: 'grid',
    gap: '0.75rem',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#f3f6f4',
    fontSize: '1rem',
  },
  checkmark: {
    color: '#22c55e',
    fontSize: '1.25rem',
    fontWeight: 'bold',
  },
  noSubscription: {
    textAlign: 'center',
    padding: '3rem 2rem',
  },
  noSubscriptionIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  noSubscriptionText: {
    color: '#8b95a5',
    fontSize: '1.125rem',
    marginBottom: '1.5rem',
  },
  upgradeButton: {
    backgroundColor: '#22c55e',
    color: '#0a0b0c',
    border: 'none',
    padding: '0.875rem 2rem',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
  },
  loadingSmall: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '2rem',
    color: '#8b95a5',
  },
  spinnerSmall: {
    width: '24px',
    height: '24px',
    border: '3px solid #22272f',
    borderTop: '3px solid #22c55e',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorMessage: {
    padding: '2rem',
    textAlign: 'center',
    color: '#ef4444',
    fontSize: '1.125rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    borderBottom: '2px solid #22272f',
  },
  tableHeader: {
    padding: '1rem',
    textAlign: 'left',
    fontSize: '0.875rem',
    color: '#8b95a5',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '600',
  },
  tableRow: {
    borderBottom: '1px solid #22272f',
    transition: 'background-color 0.2s ease',
  },
  tableCell: {
    padding: '1rem',
    color: '#f3f6f4',
  },
  statusBadgeSmall: {
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    border: '1px solid',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'inline-block',
  },
};