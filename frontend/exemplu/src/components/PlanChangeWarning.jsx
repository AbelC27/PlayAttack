import React from 'react';

export default function PlanChangeWarning({ 
  currentPlan, 
  newPlan, 
  onConfirm, 
  onCancel, 
  isOpen 
}) {
  if (!isOpen) return null;

  const isDowngrade = parseFloat(newPlan.price) < parseFloat(currentPlan.plan_price);

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
      zIndex: 10000,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        border: '2px solid #374151',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {/* Warning Icon */}
        <div style={{
          textAlign: 'center',
          fontSize: '4rem',
          marginBottom: '1rem'
        }}>
          {isDowngrade ? '⚠️' : '🔄'}
        </div>

        {/* Title */}
        <h2 style={{
          color: isDowngrade ? '#f59e0b' : '#22c55e',
          textAlign: 'center',
          marginBottom: '1rem',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          {isDowngrade ? 'Downgrade Plan?' : 'Change Plan?'}
        </h2>

        {/* Current and New Plan Info */}
        <div style={{
          background: '#0f172a',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              color: '#9ca3af', 
              fontSize: '0.875rem', 
              marginBottom: '0.25rem' 
            }}>
              Current Plan
            </div>
            <div style={{ 
              color: '#ffffff', 
              fontSize: '1.25rem', 
              fontWeight: 'bold' 
            }}>
              {currentPlan.plan_name} - €{currentPlan.plan_price}/month
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            margin: '1rem 0',
            fontSize: '1.5rem'
          }}>
            ⬇️
          </div>

          <div>
            <div style={{ 
              color: '#9ca3af', 
              fontSize: '0.875rem', 
              marginBottom: '0.25rem' 
            }}>
              New Plan
            </div>
            <div style={{ 
              color: '#22c55e', 
              fontSize: '1.25rem', 
              fontWeight: 'bold' 
            }}>
              {newPlan.name} - €{newPlan.price}/month
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div style={{
          background: isDowngrade ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
          border: `1px solid ${isDowngrade ? '#f59e0b' : '#22c55e'}`,
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{
            color: '#ffffff',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            margin: 0
          }}>
            {isDowngrade ? (
              <>
                You are about to <strong style={{ color: '#f59e0b' }}>downgrade</strong> to a cheaper plan. 
                Your current subscription will be updated immediately, and your next payment will be 
                <strong style={{ color: '#22c55e' }}> €{newPlan.price}</strong> instead of €{currentPlan.plan_price}.
                <br /><br />
                <strong>No additional payment required</strong> - you've already paid for this month!
              </>
            ) : (
              <>
                You are about to change your plan. Your subscription will be updated, and your next 
                payment will be <strong style={{ color: '#22c55e' }}>€{newPlan.price}</strong>.
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '0.875rem 1.5rem',
              background: 'transparent',
              border: '2px solid #6b7280',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#374151';
              e.target.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = '#6b7280';
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '0.875rem 1.5rem',
              background: isDowngrade 
                ? 'linear-gradient(45deg, #f59e0b, #d97706)' 
                : 'linear-gradient(45deg, #22c55e, #16a34a)',
              border: 'none',
              color: '#000000',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 16px rgba(34, 197, 94, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Confirm Change
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
