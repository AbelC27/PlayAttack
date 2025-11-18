import React from 'react';

const LoadingSkeleton = ({ type = 'card', count = 1, height = null }) => {
  const getSkeletonStyle = () => {
    const baseStyle = {
      background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '12px',
      marginBottom: '1rem'
    };

    switch (type) {
      case 'card':
        return { ...baseStyle, height: height || '200px' };
      case 'text':
        return { ...baseStyle, height: height || '20px', width: '100%' };
      case 'title':
        return { ...baseStyle, height: height || '30px', width: '60%' };
      case 'button':
        return { ...baseStyle, height: height || '40px', width: '120px' };
      case 'subscription-card':
        return { ...baseStyle, height: height || '250px' };
      case 'game-card':
        return { ...baseStyle, height: height || '320px' };
      default:
        return { ...baseStyle, height: height || '60px' };
    }
  };

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} style={getSkeletonStyle()}></div>
      ))}
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  );
};

// Specific skeleton components for different use cases
export const SubscriptionCardSkeleton = ({ count = 3 }) => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(3, 1fr)', 
    gap: '1.5rem',
    marginBottom: '3rem'
  }}>
    <LoadingSkeleton type="subscription-card" count={count} />
  </div>
);

export const GameCardSkeleton = ({ count = 4 }) => (
  <div style={{
    display: 'flex',
    gap: '24px',
    overflow: 'hidden',
    width: '100%',
    minHeight: '320px',
    justifyContent: 'center'
  }}>
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        style={{
          minWidth: '260px',
          maxWidth: '300px',
          background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '12px',
          height: '320px'
        }}
      />
    ))}
  </div>
);

export const PlanCardSkeleton = ({ count = 4 }) => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
    gap: '24px',
    marginBottom: '3rem'
  }}>
    <LoadingSkeleton type="card" count={count} height="400px" />
  </div>
);

export default LoadingSkeleton;