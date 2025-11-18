import React, { useState, useEffect, useRef, memo } from 'react';

const ProfitChart = memo(function ProfitChart({ predictions }) {
  const canvasRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!predictions || !predictions.predictions || predictions.predictions.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas resolution
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Chart dimensions
    const padding = { top: 40, right: 30, bottom: 60, left: 70 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;
    
    // Get data values
    const data = predictions.predictions;
    const values = data.map(d => d.profit || 0);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1; // Prevent division by zero
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
      
      // Y-axis labels
      const value = maxValue - (range / 5) * i;
      ctx.fillStyle = '#8b95a5';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText('€' + value.toFixed(0), padding.left - 10, y + 4);
    }
    
    // Draw gradient area
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
    
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    
    data.forEach((point, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const value = point.profit || 0;
      const y = padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
      
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    data.forEach((point, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const value = point.profit || 0;
      const y = padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw points
    data.forEach((point, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const value = point.profit || 0;
      const y = padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, hoveredPoint === index ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = hoveredPoint === index ? '#2563eb' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#0f1419';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    // Draw X-axis labels
    const labelFrequency = data.length > 20 ? Math.ceil(data.length / 6) : Math.ceil(data.length / 10);
    ctx.fillStyle = '#8b95a5';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    data.forEach((point, index) => {
      if (index % labelFrequency === 0 || index === data.length - 1) {
        const x = padding.left + (chartWidth / (data.length - 1)) * index;
        const label = point.date ? new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        ctx.save();
        ctx.translate(x, padding.top + chartHeight + 15);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    });
    
    // Draw title
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('AI Profit Forecast (Next 30 Days)', padding.left, 25);
    
  }, [predictions, hoveredPoint]);

  const handleMouseMove = (e) => {
    if (!predictions || !predictions.predictions) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    setMousePos({ x: e.clientX, y: e.clientY });
    
    const padding = { top: 40, right: 30, bottom: 60, left: 70 };
    const chartWidth = rect.width - padding.left - padding.right;
    
    let closest = null;
    let minDist = Infinity;
    
    predictions.predictions.forEach((point, index) => {
      const x = padding.left + (chartWidth / (predictions.predictions.length - 1)) * index;
      const dist = Math.abs(mouseX - x);
      
      if (dist < minDist && dist < 20) {
        minDist = dist;
        closest = index;
      }
    });
    
    setHoveredPoint(closest);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  if (!predictions || !predictions.predictions) return null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '400px' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'crosshair'
        }}
      />
      {hoveredPoint !== null && 
       predictions && 
       predictions.predictions && 
       predictions.predictions[hoveredPoint] &&
       predictions.predictions[hoveredPoint].profit !== undefined && (
        <div
          style={{
            position: 'fixed',
            left: mousePos.x + 15,
            top: mousePos.y - 60,
            background: 'rgba(15, 20, 25, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            minWidth: '180px'
          }}
        >
          <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>
            {predictions.predictions[hoveredPoint].date ? 
              new Date(predictions.predictions[hoveredPoint].date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              }) : 'N/A'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0', fontSize: '12px' }}>
            <span>Predicted Profit:</span>
            <strong style={{ color: '#22c55e', marginLeft: '8px' }}>
              €{(predictions.predictions[hoveredPoint].profit || 0).toFixed(2)}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
});

const ProfitPrediction = () => {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelTrained, setModelTrained] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [training, setTraining] = useState(false);

  const API_BASE = 'http://localhost:8000';

  useEffect(() => {
    checkModelStatus();
  }, []);

  useEffect(() => {
    if (modelTrained) {
      fetchPredictions();
    }
  }, [modelTrained]);

  const checkModelStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/ml/model-status/`);
      const data = await response.json();
      
      setModelTrained(data.trained);
      setModelInfo(data);
      
      if (!data.trained) {
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to check model status');
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/ml/profit-prediction/?days=30`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPredictions(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async () => {
    setTraining(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/ml/train-model/`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setModelTrained(true);
        setModelInfo(data);
        await fetchPredictions();
      } else {
        setError(data.error || 'Training failed');
      }
    } catch (err) {
      setError('Failed to train model: ' + err.message);
    } finally {
      setTraining(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 20, 25, 0.95) 0%, rgba(20, 25, 30, 0.95) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{ color: '#8b95a5', fontSize: '16px' }}>Loading predictions...</div>
      </div>
    );
  }

  // Not trained state
  if (!modelTrained) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 20, 25, 0.95) 0%, rgba(20, 25, 30, 0.95) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '12px', fontSize: '24px' }}>
          Model Not Trained
        </h3>
        <p style={{ color: '#8b95a5', marginBottom: '24px', fontSize: '15px' }}>
          Train the model to start predicting future profits based on your data
        </p>
        <button
          onClick={trainModel}
          disabled={training}
          style={{
            background: training ? '#374151' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            padding: '14px 32px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: training ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: training ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}
          onMouseOver={(e) => {
            if (!training) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = training ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)';
          }}
        >
          {training ? 'Training Model...' : 'Train Model'}
        </button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 20, 25, 0.95) 0%, rgba(20, 25, 30, 0.95) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ color: '#ef4444', marginBottom: '12px', fontSize: '20px' }}>Error</h3>
        <p style={{ color: '#8b95a5', fontSize: '14px' }}>{error}</p>
        <button
          onClick={fetchPredictions}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '16px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Main display
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15, 20, 25, 0.95) 0%, rgba(20, 25, 30, 0.95) 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{ color: '#8b95a5', fontSize: '13px', marginBottom: '8px', background: 'transparent' }}>30-Day Forecast</div>
          <div style={{ color: '#3b82f6', fontSize: '28px', fontWeight: 'bold' }}>
            €{predictions?.summary?.total_predicted_profit?.toFixed(2) || '0.00'}
          </div>
        </div>
        
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(34, 197, 94, 0.2)'
        }}>
          <div style={{ color: '#8b95a5', fontSize: '13px', marginBottom: '8px', background: 'transparent' }}>Daily Average</div>
          <div style={{ color: '#22c55e', fontSize: '28px', fontWeight: 'bold' }}>
            €{predictions?.summary?.average_daily_profit?.toFixed(2) || '0.00'}
          </div>
        </div>
        
        <div style={{
          background: 'rgba(168, 85, 247, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(168, 85, 247, 0.2)'
        }}>
          <div style={{ color: '#8b95a5', fontSize: '13px', marginBottom: '8px' }}>Trend</div>
          <div style={{ color: '#a855f7', fontSize: '28px', fontWeight: 'bold' }}>
            {predictions?.summary?.trend === 'increasing' ? '📈' : '📉'} {predictions?.summary?.trend || 'N/A'}
          </div>
        </div>
      </div>

      {/* Chart */}
      <ProfitChart predictions={predictions} />
    </div>
  );
};

export default ProfitPrediction;
