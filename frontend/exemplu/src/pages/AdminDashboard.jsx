import React, { useState, useEffect, useRef, lazy, Suspense, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PlayAtacLogo from '../assets/logo.png';
import ProfitPrediction from '../components/ProfitPrediction';

// Lazy load ChatWidget for better performance
const ChatWidget = lazy(() => import('../components/ChatWidget'));

/**
 * AdminDashboard — Enhanced with Revenue Analytics & Hosting Cost Management
 * - Green / Grey / Black palette
 * - Revenue charts (daily, monthly, overall)
 * - Hosting cost tracking per plan
 * - Docker & Supabase cost management
 * - Interactive charts with hover effects
 */

// ========================================
// INTERACTIVE CHART COMPONENTS
// ========================================

/**
 * Interactive Activity Chart Component
 * Shows 30-day user activity with hover tooltips
 * Memoized to prevent unnecessary re-renders
 */
const InteractiveActivityChart = memo(function InteractiveActivityChart({ data }) {
  const canvasRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!data || data.length === 0) return;
    
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
    const padding = { top: 40, right: 30, bottom: 60, left: 60 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;
    
    // Get data values
    const values = data.map(d => d.total_hours || 0);
    const maxValue = Math.max(...values, 1);
    const minValue = 0;
    
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
      const value = maxValue - (maxValue / 5) * i;
      ctx.fillStyle = '#8b95a5';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(1) + 'h', padding.left - 10, y + 4);
    }
    
    // Draw gradient area
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0.05)');
    
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    
    data.forEach((point, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const value = point.total_hours || 0;
      const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
      
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
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    data.forEach((point, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const value = point.total_hours || 0;
      const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
      
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
      const value = point.total_hours || 0;
      const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, hoveredPoint === index ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = hoveredPoint === index ? '#16a34a' : '#22c55e';
      ctx.fill();
      ctx.strokeStyle = '#0f1419';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    // Draw X-axis labels (smart frequency based on data length)
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
    
    // Draw title with dynamic date range
    const firstDate = data[0]?.date ? new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    const lastDate = data[data.length - 1]?.date ? new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const titleText = firstDate && lastDate ? `Daily User Activity (${firstDate} - ${lastDate})` : 'Daily User Activity';
    
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(titleText, padding.left, 25);
    
  }, [data, hoveredPoint]);

  const handleMouseMove = (e) => {
    if (!data || data.length === 0) return;
    
    const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;    setMousePos({ x: e.clientX, y: e.clientY });
    
    const padding = { top: 40, right: 30, bottom: 60, left: 60 };
    const chartWidth = rect.width - padding.left - padding.right;
    
    let closest = null;
    let minDist = Infinity;
    
    data.forEach((point, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
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

  if (!data || data.length === 0) {
    return (
      <div className="chart-wrapper">
        <div className="chart-fallback">
          <div className="fallback-icon">📊</div>
          <p className="muted">Loading activity data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-wrapper" style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        className="interactive-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ width: '100%', height: '400px', cursor: 'crosshair' }}
      />
      {hoveredPoint !== null && data[hoveredPoint] && (
        <div 
          className="chart-tooltip"
          style={{
            position: 'fixed',
            left: mousePos.x + 15,
            top: mousePos.y - 10,
            pointerEvents: 'none'
          }}
        >
          <div className="tooltip-date">{new Date(data[hoveredPoint].date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })}</div>
          <div className="tooltip-value">
            <strong>{data[hoveredPoint].total_hours?.toFixed(1) || 0}h</strong> total time
          </div>
          <div className="tooltip-users">
            {data[hoveredPoint].active_users || 0} active users
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Smart Chart Card Component
 * Shows loading state, handles errors gracefully, and only shows fallback when truly failed
 * Memoized for performance
 */
const SmartChartCard = memo(function SmartChartCard({ title, icon, chartUrl, altText }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setLoading(false);
    setImageLoaded(true);
    setError(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
    setImageLoaded(false);
  };

  return (
    <div className="chart-card">
      <h3 className="chart-card-title">
        <span className="chart-icon">{icon}</span>
        {title}
      </h3>
      <div className="chart-container-enhanced">
        {loading && !error && (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <p className="muted">Loading chart...</p>
          </div>
        )}
        
        <img
          className={`chart-image ${imageLoaded ? 'loaded' : ''}`}
          src={`${chartUrl}?t=${Date.now()}`}
          alt={altText}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: imageLoaded ? 'block' : 'none' }}
        />
        
        {error && !loading && (
          <div className="chart-fallback error-state">
            <div className="fallback-icon">⚠️</div>
            <p className="error-title">Chart Unavailable</p>
            <p className="muted small">Unable to load chart. Backend service may be starting up.</p>
            <button 
              className="btn btn-sm btn-success retry-btn"
              onClick={() => {
                setError(false);
                setLoading(true);
                setImageLoaded(false);
              }}
            >
              🔄 Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // STATE (enhanced with analytics)
  const [users, setUsers] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);
  const [userPurchases, setUserPurchases] = useState({});
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', price: '', currency: 'EUR', features: '' });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userListExpanded, setUserListExpanded] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Notification system
  const [notifications, setNotifications] = useState([]);
  
  // Notification helper functions
  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const notification = { id, message, type, duration };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove notification
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };
  
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  // New analytics state
  const [revenueData, setRevenueData] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    total: 0,
    dailyChart: [],
    monthlyChart: []
  });
  const [hostingCosts, setHostingCosts] = useState([]);
  const [showCostModal, setShowCostModal] = useState(false);
  const [costForm, setCostForm] = useState({ plan_id: '', description: '', amount: '', category: 'hosting' });
  const [planAnalytics, setPlanAnalytics] = useState([]);
  
  // User activity tracking state
  const [userActivity, setUserActivity] = useState({
    overview: {
      total_active_users: 0,
      currently_online: 0,
      today_active: 0,
      week_active: 0,
      avg_session_minutes: 0,
      total_time_hours: 0
    },
    online_users: [],  // Added for list of currently online users
    top_users: [],
    daily_activity: [],
    hourly_activity: []
  });

  // Defer loading of heavy components
  const [shouldLoadChatWidget, setShouldLoadChatWidget] = useState(false);

  // Memoize admin and user counts
  const adminCount = useMemo(() => users.filter(u => u.role === 'admin').length, [users]);
  const userCount = useMemo(() => users.length, [users]);

  useEffect(() => { 
    fetchAdminData();
    fetchRevenueData();
    fetchHostingCosts();
    fetchPlanAnalytics();
    fetchUserActivityData();
    
    // Load chat widget after initial render
    const timer = setTimeout(() => {
      setShouldLoadChatWidget(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const fetchAdminData = useCallback(async () => {
    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const [plansResponse, usersResponse] = await Promise.all([
        fetch(`${API_URL}/api/plans/`),
        fetch(`${API_URL}/api/users/`)
      ]);
      if (!plansResponse.ok) throw new Error(`Plans API error: ${plansResponse.status}`);
      if (!usersResponse.ok) throw new Error(`Users API error: ${usersResponse.status}`);
      const plansData = await plansResponse.json();
      const usersData = await usersResponse.json();
      setUsers(usersData || []);
      setPlans(plansData || []);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally { setLoading(false); }
  }, []);

  const fetchRevenueData = async () => {
    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/analytics/revenue/`);
      if (response.ok) {
        const data = await response.json();
        setRevenueData(data);
      }
    } catch (e) {
      console.error('Error fetching revenue data:', e);
    }
  };

  const fetchHostingCosts = async () => {
    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/hosting-costs/`);
      if (response.ok) {
        const data = await response.json();
        setHostingCosts(data);
      }
    } catch (e) {
      console.error('Error fetching hosting costs:', e);
    }
  };

  const fetchPlanAnalytics = async () => {
    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/analytics/plans/`);
      if (response.ok) {
        const data = await response.json();
        setPlanAnalytics(data);
      }
    } catch (e) {
      console.error('Error fetching plan analytics:', e);
    }
  };

  const fetchUserActivityData = async () => {
    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/analytics/user-activity/`);
      if (response.ok) {
        const data = await response.json();
        setUserActivity(data);
      }
    } catch (e) {
      console.error('Error fetching user activity data:', e);
    }
  };

  const fetchUserPurchases = async (userId) => {
    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/users/${userId}/payments/`, { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const purchases = await res.json();
      setUserPurchases(prev => ({ ...prev, [userId]: purchases }));
    } catch (e) { console.error('Error fetching user purchases:', e); }
  };

  const toggleUserRole = async (userId, currentRole) => {
    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/users/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId }) });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const updatedUser = await res.json();
      setUsers(users.map(u => (u.id === userId ? updatedUser : u)));
    } catch (e) { console.error('Error updating user role:', e); alert('Failed to update user role'); }
  };

  const deleteUser = async (userId, userRole) => {
    if (userRole === 'admin') { alert('Cannot delete admin users'); return; }
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/users/`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId }) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || `API error: ${res.status}`); }
      setUsers(users.filter(u => u.id !== userId));
    } catch (e) { console.error('Error deleting user:', e); alert('Failed to delete user: ' + e.message); }
  };

  const openPlanModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({ name: plan.name, price: plan.price.toString(), currency: plan.currency, features: plan.features });
    } else {
      setEditingPlan(null);
      setPlanForm({ name: '', price: '', currency: 'EUR', features: '' });
    }
    setShowPlanModal(true);
  };

  const closePlanModal = () => {
    setShowPlanModal(false);
    setEditingPlan(null);
    setPlanForm({ name: '', price: '', currency: 'EUR', features: '' });
  };

  const savePlan = async () => {
    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const method = editingPlan ? 'PUT' : 'POST';
      const data = editingPlan ? { ...planForm, id: editingPlan.id, price: parseFloat(planForm.price) } : { ...planForm, price: parseFloat(planForm.price) };
      const res = await fetch(`${API_URL}/api/plans/`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || `API error: ${res.status}`); }
      const saved = await res.json();
      setPlans(editingPlan ? plans.map(p => (p.id === editingPlan.id ? saved : p)) : [...plans, saved]);
      closePlanModal();
    } catch (e) { console.error('Error saving plan:', e); alert('Failed to save plan: ' + e.message); }
  };

  const deletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/plans/`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: planId }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || `API error: ${res.status}`); }
      setPlans(plans.filter(p => p.id !== planId));
    } catch (e) { console.error('Error deleting plan:', e); alert('Failed to delete plan: ' + e.message); }
  };

  // Cost management functions
  const openCostModal = () => {
    setCostForm({ plan_id: '', description: '', amount: '', category: 'hosting' });
    setShowCostModal(true);
  };

  const closeCostModal = () => {
    setShowCostModal(false);
    setCostForm({ plan_id: '', description: '', amount: '', category: 'hosting' });
  };

  const saveCost = async () => {
    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/hosting-costs/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: costForm.plan_id || null,
          description: costForm.description,
          amount: parseFloat(costForm.amount),
          category: costForm.category
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `API error: ${res.status}`);
      }
      await fetchHostingCosts();
      closeCostModal();
    } catch (e) {
      console.error('Error saving cost:', e);
      alert('Failed to save cost: ' + e.message);
    }
  };

  const deleteCost = async (costId) => {
    if (!window.confirm('Are you sure you want to delete this cost entry?')) return;
    try {
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/hosting-costs/${costId}/`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `API error: ${res.status}`);
      }
      await fetchHostingCosts();
    } catch (e) {
      console.error('Error deleting cost:', e);
      alert('Failed to delete cost: ' + e.message);
    }
  };

  // Helper function for category icons
  const getCategoryIcon = (category) => {
    const icons = {
      hosting: '🏗️',
      database: '🗄️',
      supabase: '⚡',
      docker: '🐳',
      cdn: '🌐',
      storage: '💾',
      other: '🔧'
    };
    return icons[category.toLowerCase()] || '🔧';
  };

  // Test PDF Connection
  const testPDFConnection = async () => {
    try {
      addNotification('🔧 Testing PDF connection...', 'info', 3000);
      
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_URL}/api/test-pdf/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });
      
      if (response.ok) {
        const pdfBlob = await response.blob();
        
        // Download the test PDF
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'test_pdf_report.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        addNotification('✅ Test PDF connection successful!', 'success', 5000);
      } else {
        const errorText = await response.text();
        addNotification(`❌ Test PDF failed: ${response.status} - ${errorText}`, 'error', 8000);
      }
      
    } catch (error) {
      addNotification(`❌ Test PDF connection failed: ${error.message}`, 'error', 8000);
    }
  };

  // PDF Report Generation - Professional Download via Backend API
  const generatePDFReport = async () => {
    // Get the button element to show loading state
    const pdfButton = document.querySelector('.pdf-btn');
    const originalText = pdfButton ? pdfButton.innerHTML : '';
    
    try {
      // Update button to show loading state
      if (pdfButton) {
        pdfButton.innerHTML = '<span class="btn-icon">⏳</span>Generating PDF...';
        pdfButton.disabled = true;
        pdfButton.style.opacity = '0.7';
      }

      // Show loading notification
      addNotification('📄 Generating professional PDF report...', 'info', 3000);

      // Call the Django backend API to generate PDF
      const API_URL = process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/generate-pdf-report/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Try to get detailed error from response
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If not JSON, use the status text
          errorMessage = `Server returned ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      // Get the PDF blob from response
      const pdfBlob = await response.blob();
      
      if (pdfBlob.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const timeString = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      link.download = `PlayAtac_Dashboard_Report_${timestamp}_${timeString}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);

      // Show success message
      addNotification(
        `✅ PDF Report Downloaded! File: PlayAtac_Dashboard_Report_${timestamp}_${timeString}.pdf`, 
        'success', 
        8000
      );
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      
      // Show error notification based on error type
      let errorMsg = `❌ PDF Generation Failed: ${error.message}`;
      
      if (error.message.includes('HTTP 500')) {
        errorMsg = '❌ Server Error: Check Django server console for detailed error logs';
      } else if (error.message.includes('HTTP 404')) {
        errorMsg = '❌ API Endpoint Not Found: Verify the PDF endpoint exists in Django urls.py';
      } else if (error.message.includes('HTTP 406')) {
        errorMsg = '❌ Content Type Error: Server cannot generate PDF in requested format';
      } else if (error.message.includes('fetch')) {
        errorMsg = '❌ Network Error: Ensure Django backend server is running on port 8000';
      }
      
      addNotification(errorMsg, 'error', 8000);
    } finally {
      // Restore button state
      if (pdfButton) {
        pdfButton.innerHTML = originalText;
        pdfButton.disabled = false;
        pdfButton.style.opacity = '1';
      }
    }
  };



  return (
    <div className={`shell ${sidebarOpen ? 'shell--sidebar-open' : ''}`}>
      <StyleTag />
      
      {/* Chat Widget - Lazy loaded */}
      {shouldLoadChatWidget && (
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      )}
      
      {/* Notification System */}
      <div className="notification-container">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification notification-${notification.type}`}
            onClick={() => removeNotification(notification.id)}
          >
            <div className="notification-content">
              {notification.message}
            </div>
            <button className="notification-close" onClick={() => removeNotification(notification.id)}>
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <aside className="sidebar" aria-label="Sidebar">
        <div className="sb-brand">
          <img src={PlayAtacLogo} alt="PlayAtac" onError={(e) => (e.currentTarget.style.display='none')} />
          <span>Admin</span>
        </div>
        <nav className="sb-nav">
          <a className="sb-link active" href="#top">Dashboard</a>
          <a className="sb-link" href="#revenue">Revenue</a>
          <a className="sb-link" href="#hosting">Hosting Costs</a>
          <a className="sb-link" href="#users">Users</a>
          <a className="sb-link" href="#plans">Plans</a>
          <a className="sb-link" href="#analytics">Analytics</a>
        </nav>
        <div className="sb-foot">© {new Date().getFullYear()}</div>
      </aside>

      {/* Main column */}
      <div className="main">
        {/* Topbar */}
        <header className="topbar">
          <button className="icon-btn" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar" title="Toggle sidebar">
            ☰
          </button>
          <div className="flex-grow" />
          <div className="userbox">
            {user ? (
              <>
                <span className="welcome">{user.username || user.email}</span>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={async () => {
                    try { await signOut(); } catch (e) { console.error(e); } finally { navigate('/'); setTimeout(() => window.location.reload(), 100); }
                  }}
                >Logout</button>
              </>
            ) : (
              <span className="muted">Loading user…</span>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="content">
          {/* Enhanced Hero / Stats row */}
          <section className="hero enhanced-hero">
            <div className="hero-bg" />
            <div className="hero-content">
              <div className="hero-title">
                <h1>Admin Dashboard</h1>
                <p className="hero-subtitle">Complete business overview and analytics</p>
              </div>
              
              <div className="stats enhanced-stats">
                <div className="stat animated-stat" style={{ animationDelay: '0.1s' }}>
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <span>Total Users</span>
                    <strong className="counter" data-target={userCount}>{userCount}</strong>
                  </div>
                </div>
                
                <div className="stat animated-stat" style={{ animationDelay: '0.2s' }}>
                  <div className="stat-icon">👑</div>
                  <div className="stat-content">
                    <span>Admin Users</span>
                    <strong className="counter" data-target={adminCount}>
                      {adminCount}
                    </strong>
                  </div>
                </div>
                
                <div className="stat animated-stat" style={{ animationDelay: '0.3s' }}>
                  <div className="stat-icon">📋</div>
                  <div className="stat-content">
                    <span>Available Plans</span>
                    <strong className="counter" data-target={plans.length}>{plans.length}</strong>
                  </div>
                </div>
                
                <div className="stat revenue animated-stat" style={{ animationDelay: '0.4s' }}>
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <span>Total Revenue</span>
                    <strong className="counter revenue-counter">€{revenueData.total?.toFixed(2) || '0.00'}</strong>
                  </div>
                </div>
                
                <div className="stat revenue animated-stat" style={{ animationDelay: '0.5s' }}>
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <span>Monthly Revenue</span>
                    <strong className="counter revenue-counter">€{revenueData.monthly?.toFixed(2) || '0.00'}</strong>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="quick-actions">
                <button className="quick-btn" onClick={() => setShowPlanModal(true)}>
                  <span className="btn-icon">➕</span>
                  Add Plan
                </button>
                <button className="quick-btn" onClick={() => setShowCostModal(true)}>
                  <span className="btn-icon">💸</span>
                  Add Cost
                </button>
                <button className="quick-btn" onClick={() => {
                  fetchAdminData();
                  fetchRevenueData();
                  fetchHostingCosts();
                  fetchPlanAnalytics();
                }}>
                  <span className="btn-icon">🔄</span>
                  Refresh Data
                </button>
                <button className="quick-btn pdf-btn" onClick={generatePDFReport}>
                  <span className="btn-icon">📄</span>
                  Download PDF Report
                </button>
              </div>
            </div>
          </section>

          {/* Revenue Analytics */}
          <section className="panel">
            <header className="panel__head">
              <h2>Revenue Analytics</h2>
            </header>
            <div className="panel__body">
              <div className="revenue-grid">
                <div className="revenue-card">
                  <h4>Daily Revenue</h4>
                  <div className="revenue-amount">€{revenueData.daily?.toFixed(2) || '0.00'}</div>
                  <p className="muted">Today's earnings</p>
                </div>
                <div className="revenue-card">
                  <h4>Weekly Revenue</h4>
                  <div className="revenue-amount">€{revenueData.weekly?.toFixed(2) || '0.00'}</div>
                  <p className="muted">Last 7 days</p>
                </div>
                <div className="revenue-card">
                  <h4>Monthly Revenue</h4>
                  <div className="revenue-amount">€{revenueData.monthly?.toFixed(2) || '0.00'}</div>
                  <p className="muted">This month</p>
                </div>
                <div className="revenue-card">
                  <h4>Total Revenue</h4>
                  <div className="revenue-amount">€{revenueData.total?.toFixed(2) || '0.00'}</div>
                  <p className="muted">All time</p>
                </div>
              </div>
              
              {/* Enhanced Revenue Charts */}
              <div className="charts-grid">
                <div className="chart-container">
                  <h4>Revenue Trend (Last 30 Days)</h4>
                  <div className="animated-chart">
                    {revenueData.dailyChart && revenueData.dailyChart.length > 0 ? (
                      revenueData.dailyChart.map((day, index) => {
                        const maxAmount = Math.max(...revenueData.dailyChart.map(d => d.amount));
                        const height = Math.max(8, (day.amount / maxAmount) * 100);
                        return (
                          <div 
                            key={index} 
                            className="chart-bar animated-bar" 
                            style={{ 
                              height: `${height}%`,
                              animationDelay: `${index * 50}ms`
                            }}
                            title={`${day.date}: €${day.amount.toFixed(2)}`}
                            data-value={day.amount.toFixed(2)}
                          >
                            <div className="bar-value">€{day.amount.toFixed(0)}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-data-chart">
                        <div className="no-data-icon">📊</div>
                        <p className="muted i">No revenue data available</p>
                        <small className="muted">Start making sales to see your revenue trend</small>
                      </div>
                    )}
                  </div>
                </div>

                {/* Revenue Growth Chart */}
                <div className="chart-container">
                  <h4>Revenue Growth</h4>
                  <div className="growth-indicators">
                    <div className="growth-card">
                      <div className="growth-icon up">📈</div>
                      <div className="growth-content">
                        <span className="growth-label">Daily Growth</span>
                        <span className="growth-value positive">
                          +{((revenueData.daily / (revenueData.weekly / 7) - 1) * 100).toFixed(1) || '0.0'}%
                        </span>
                      </div>
                    </div>
                    <div className="growth-card">
                      <div className="growth-icon up">💰</div>
                      <div className="growth-content">
                        <span className="growth-label">Monthly Growth</span>
                        <span className="growth-value positive">
                          +{((revenueData.monthly / (revenueData.total / 12) - 1) * 100).toFixed(1) || '0.0'}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Circular Progress */}
                  <div className="revenue-progress">
                    <div className="progress-circle">
                      <svg className="progress-ring" width="120" height="120">
                        <circle
                          className="progress-ring-circle-bg"
                          stroke="var(--border)"
                          strokeWidth="8"
                          fill="transparent"
                          r="52"
                          cx="60"
                          cy="60"
                        />
                        <circle
                          className="progress-ring-circle"
                          stroke="var(--green)"
                          strokeWidth="8"
                          fill="transparent"
                          r="52"
                          cx="60"
                          cy="60"
                          style={{
                            strokeDasharray: `${2 * Math.PI * 52}`,
                            strokeDashoffset: `${2 * Math.PI * 52 * (1 - Math.min(revenueData.monthly / 10000, 1))}`,
                            transform: 'rotate(-90deg)',
                            transformOrigin: '60px 60px'
                          }}
                        />
                      </svg>
                      <div className="progress-text">
                        <div className="progress-value">€{revenueData.monthly?.toFixed(0) || '0'}</div>
                        <div className="progress-label">This Month</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* AI Profit Prediction */}
          <section className="panel">
            <header className="panel__head">
              <h2>Profit Prediction</h2>
            </header>
            <div className="panel__body">
              <ProfitPrediction />
            </div>
          </section>

          {/* Hosting Costs Management */}
          <section className="panel">
            <header className="panel__head">
              <h2>Hosting Costs & Infrastructure</h2>
              <button className="btn btn-success" onClick={openCostModal}>Add Cost Entry</button>
            </header>
            <div className="panel__body">
              <div className="costs-overview">
                <div className="cost-summary">
                  <h4>Monthly Infrastructure Costs</h4>
                  <div className="cost-breakdown">
                    {Object.entries(hostingCosts.reduce((acc, cost) => {
                      const category = cost.category || 'Other';
                      acc[category] = (acc[category] || 0) + parseFloat(cost.amount);
                      return acc;
                    }, {})).map(([category, total], index) => {
                      const totalCosts = Object.values(hostingCosts.reduce((acc, cost) => {
                        const cat = cost.category || 'Other';
                        acc[cat] = (acc[cat] || 0) + parseFloat(cost.amount);
                        return acc;
                      }, {})).reduce((sum, val) => sum + val, 0);
                      const percentage = totalCosts > 0 ? (total / totalCosts) * 100 : 0;
                      
                      return (
                        <div 
                          key={category} 
                          className="cost-item animated-cost-item"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="cost-info">
                            <span className="cost-category">
                              {getCategoryIcon(category)} {category}
                            </span>
                            <span className="cost-amount">€{total.toFixed(2)}</span>
                          </div>
                          <div className="cost-bar">
                            <div 
                              className="cost-bar-fill" 
                              style={{ 
                                width: `${percentage}%`,
                                animationDelay: `${0.5 + index * 0.1}s`
                              }}
                            />
                          </div>
                          <div className="cost-percentage">{percentage.toFixed(1)}%</div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Total Cost Display */}
                  <div className="total-costs">
                    <div className="total-icon">💸</div>
                    <div className="total-info">
                      <span className="total-label">Total Monthly Costs</span>
                      <span className="total-value">
                        €{hostingCosts.reduce((sum, cost) => sum + parseFloat(cost.amount), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="cost-per-plan">
                  <h4>Profitability Analysis</h4>
                  {planAnalytics.map((analytics, planIndex) => {
                    // Get the correct monthly cost based on plan order (Premium=100, Pro=50, Free=25)
                    const getMonthlyCost = (planName) => {
                      if (planName.toLowerCase().includes('premium')) return 100;
                      if (planName.toLowerCase().includes('pro')) return 50;
                      return 25; // Free plan
                    };
                    
                    const monthlyCost = getMonthlyCost(analytics.name);
                    const revenue = analytics.active_users * analytics.price_per_user;
                    const profit = revenue - monthlyCost;
                    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
                    
                    return (
                      <div 
                        key={analytics.id} 
                        className="plan-cost-analysis enhanced-plan-card"
                        style={{ animationDelay: `${planIndex * 0.2}s` }}
                      >
                        <div className="plan-header">
                          <h5>{analytics.name}</h5>
                          <div className={`profit-badge ${profit >= 0 ? 'profitable' : 'loss'}`}>
                            {profit >= 0 ? '✓ Profitable' : '⚠ Loss'}
                          </div>
                        </div>
                        
                        <div className="cost-metrics">
                          <div className="metric-card">
                            <div className="metric-icon">💰</div>
                            <div className="metric-content">
                              <span className="metric-value">€{analytics.price_per_user.toFixed(2)}</span>
                              <span className="metric-label">Revenue/User</span>
                            </div>
                          </div>
                          
                          <div className="metric-card">
                            <div className="metric-icon">🏗️</div>
                            <div className="metric-content">
                              <span className="metric-value">€{monthlyCost.toFixed(2)}</span>
                              <span className="metric-label">Monthly Cost</span>
                            </div>
                          </div>
                          
                          <div className="metric-card profit-metric">
                            <div className="metric-icon">{profit >= 0 ? '📈' : '📉'}</div>
                            <div className="metric-content">
                              <span className={`metric-value ${profit >= 0 ? 'profit' : 'loss'}`}>
                                €{profit.toFixed(2)}
                              </span>
                              <span className="metric-label">Net Profit</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Profit Margin Bar */}
                        <div className="profit-margin-bar">
                          <div className="margin-label">
                            Profit Margin: {profitMargin.toFixed(1)}%
                          </div>
                          <div className="margin-bar">
                            <div 
                              className={`margin-fill ${profit >= 0 ? 'positive' : 'negative'}`}
                              style={{ width: `${Math.min(Math.abs(profitMargin), 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cost Entries Table */}
              <div className="cost-entries">
                <h4>Cost Entries</h4>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Plan</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hostingCosts.map((cost, i) => (
                        <tr key={cost.id} className={i % 2 ? 'alt' : ''}>
                          <td>{cost.description}</td>
                          <td>{cost.plan_id ? plans.find(p => p.id === cost.plan_id)?.name || 'Unknown Plan' : 'General'}</td>
                          <td><span className="pill pill--ok">{cost.category}</span></td>
                          <td>€{parseFloat(cost.amount).toFixed(2)}</td>
                          <td>{new Date(cost.date).toLocaleDateString()}</td>
                          <td>
                            <button 
                              className="btn btn-danger btn-xs" 
                              onClick={() => deleteCost(cost.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {loading ? (
            <section className="skeleton">
              <div className="sk sk--card" />
              <div className="sk sk--card" />
              <div className="sk sk--wide" />
            </section>
          ) : (
            <>
              {/* Users panel */}
              <section id="users" className="panel">
                <header className="panel__head" style={{ cursor: 'pointer' }} onClick={() => setUserListExpanded(!userListExpanded)}>
                  <h2>Users ({users.length})</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                      {userListExpanded ? 'Click to collapse' : 'Click to expand'}
                    </span>
                    <span style={{ fontSize: '20px', transition: 'transform 0.3s ease', transform: userListExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      ▼
                    </span>
                  </div>
                </header>
                {userListExpanded && (
                  <div className="panel__body" style={{ animation: 'fadeInDown 0.3s ease-out' }}>
                    {/* Search Bar */}
                    <div style={{ marginBottom: '16px' }}>
                      <input
                        type="text"
                        placeholder="🔍 Search by username or email..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '1px solid var(--border)',
                          background: '#0a0d11',
                          color: 'var(--text)',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#2d9a57';
                          e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      {userSearchQuery && (
                        <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--muted)' }}>
                          Found {users.filter(u => 
                            (u.username?.toLowerCase() || '').includes(userSearchQuery.toLowerCase()) || 
                            (u.email?.toLowerCase() || '').includes(userSearchQuery.toLowerCase())
                          ).length} user(s)
                        </div>
                      )}
                    </div>
                    
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users
                            .filter(u => 
                              (u.username?.toLowerCase() || '').includes(userSearchQuery.toLowerCase()) || 
                              (u.email?.toLowerCase() || '').includes(userSearchQuery.toLowerCase())
                            )
                            .map((u, i) => (
                            <React.Fragment key={u.id}>
                              <tr className={i % 2 ? 'alt' : ''}>
                                <td>{u.username}</td>
                                <td className="muted">{u.email}</td>
                                <td>
                                  <span className={`pill ${u.role === 'admin' ? 'pill--warn' : 'pill--ok'}`}>{u.role}</span>
                                </td>
                                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                <td>
                                  <div className="row-actions">
                                    <button
                                      className="btn btn-info btn-sm"
                                      onClick={() => {
                                        if (expandedUser === u.id) setExpandedUser(null); else { setExpandedUser(u.id); fetchUserPurchases(u.id); }
                                      }}
                                    >{expandedUser === u.id ? 'Hide Purchases' : 'Show Purchases'}</button>
                                    <button
                                      className={`btn btn-sm ${u.role === 'admin' ? 'btn-warning' : 'btn-primary'}`}
                                      onClick={() => toggleUserRole(u.id, u.role)}
                                    >{u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}</button>
                                    {u.role !== 'admin' && (
                                      <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id, u.role)}>Delete</button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {expandedUser === u.id && (
                                <tr className="expand">
                                  <td colSpan={5}>
                                    <div className="expand__box">
                                      <h4>Purchase History</h4>
                                      {userPurchases[u.id]?.length ? (
                                        <div className="table-wrap">
                                          <table className="table table--compact">
                                            <thead>
                                              <tr>
                                                <th>Plan</th>
                                                <th>Price</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {userPurchases[u.id].map(p => (
                                                <tr key={p.id}>
                                                  <td>{p.plan_name}</td>
                                                  <td>
                                                    {p.status === 'plan_change' 
                                                      ? <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Plan Change</span>
                                                      : `${p.amount} ${p.currency}`
                                                    }
                                                  </td>
                                                  <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                                                  <td>
                                                    <span className={`pill ${
                                                      p.status === 'paid' ? 'pill--ok' : 
                                                      p.status === 'plan_change' ? 'pill--warn' : 
                                                      'pill--bad'
                                                    }`}>
                                                      {p.status === 'plan_change' ? 'Changed Plan' : p.status}
                                                    </span>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <p className="muted i">No purchase history available</p>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                      {users.filter(u => 
                        (u.username?.toLowerCase() || '').includes(userSearchQuery.toLowerCase()) || 
                        (u.email?.toLowerCase() || '').includes(userSearchQuery.toLowerCase())
                      ).length === 0 && userSearchQuery && (
                        <div style={{ 
                          padding: '40px 20px', 
                          textAlign: 'center', 
                          color: 'var(--muted)',
                          fontSize: '14px'
                        }}>
                          <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>🔍</div>
                          <p style={{ margin: 0 }}>No users found matching "<strong>{userSearchQuery}</strong>"</p>
                          <p style={{ margin: '8px 0 0', fontSize: '13px' }}>Try a different search term</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Plans panel */}
              <section id="plans" className="panel">
                <header className="panel__head">
                  <h2>Plans</h2>
                  <button className="btn btn-success" onClick={() => openPlanModal()}>Add New Plan</button>
                </header>
                <div className="plan-grid">
                  {plans.map(plan => (
                    <article key={plan.id} className="plan">
                      <div className="plan__actions">
                        <button className="btn btn-info btn-xs" onClick={() => openPlanModal(plan)}>Edit</button>
                        <button className="btn btn-danger btn-xs" onClick={() => deletePlan(plan.id)}>Delete</button>
                      </div>
                      <h3 className="plan__title">{plan.name}</h3>
                      <div className="plan__meta">
                        <div><span className="muted">Price</span> <strong>€{plan.price}</strong></div>
                        <div><span className="muted">Currency</span> <strong>{plan.currency}</strong></div>
                      </div>
                      <div className="plan__features">
                        <span className="muted">Features</span>
                        {plan.features ? (
                          <ul>
                            {plan.features.split('\n').map((f, idx) => <li key={idx}>• {f.trim()}</li>)}
                          </ul>
                        ) : <p className="muted i">No features listed</p>}
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* User Activity Analytics - NEW ENHANCED SECTION */}
              <section id="user-activity" className="panel">
                <header className="panel__head">
                  <h2>👥 User Engagement & Activity</h2>
                  <button className="btn btn-info btn-sm" onClick={fetchUserActivityData}>
                    <span className="btn-icon">🔄</span> Refresh
                  </button>
                </header>
                <div className="panel__body">
                  {/* Activity Overview Cards */}
                  <div className="activity-overview">
                    <div className="activity-card pulse-card online-users-card">
                      <div className="activity-icon online">🟢</div>
                      <div className="activity-content">
                        <span className="activity-label">Currently Online</span>
                        <strong className="activity-value">{userActivity.overview.currently_online}</strong>
                      </div>
                      {userActivity.online_users && userActivity.online_users.length > 0 && (
                        <div className="online-users-dropdown">
                          <div className="online-users-header">
                            <span className="online-indicator">🟢</span>
                            <strong>Active Users:</strong>
                          </div>
                          <div className="online-users-list">
                            {userActivity.online_users.map((user, index) => (
                              <div key={user.id || index} className="online-user-item">
                                <span className="user-avatar">👤</span>
                                <span className="user-email">{user.email}</span>
                                {user.last_active && (
                                  <span className="user-time" title={user.last_active}>
                                    {new Date(user.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="activity-card">
                      <div className="activity-icon">📅</div>
                      <div className="activity-content">
                        <span className="activity-label">Active Today</span>
                        <strong className="activity-value">{userActivity.overview.today_active}</strong>
                      </div>
                    </div>
                    
                    <div className="activity-card">
                      <div className="activity-icon">📊</div>
                      <div className="activity-content">
                        <span className="activity-label">This Week</span>
                        <strong className="activity-value">{userActivity.overview.week_active}</strong>
                      </div>
                    </div>
                    
                    <div className="activity-card">
                      <div className="activity-icon">⏱️</div>
                      <div className="activity-content">
                        <span className="activity-label">Avg Session</span>
                        <strong className="activity-value">{userActivity.overview.avg_session_minutes}m</strong>
                      </div>
                    </div>
                    
                    <div className="activity-card highlight-card">
                      <div className="activity-icon">⏰</div>
                      <div className="activity-content">
                        <span className="activity-label">Total Time Spent</span>
                        <strong className="activity-value big">{userActivity.overview.total_time_hours}h</strong>
                      </div>
                    </div>
                  </div>

                  {/* User Activity Chart - Interactive Canvas Version */}
                  <div className="chart-section">
                    <h3 className="chart-title">📈 User Time Spent Online</h3>
                    <InteractiveActivityChart data={userActivity.daily_activity} />
                  </div>

                  {/* Top Active Users */}
                  <div className="top-users-section">
                    <h3 className="section-title">🏆 Most Active Users</h3>
                    <div className="top-users-grid">
                      {userActivity.top_users.slice(0, 5).map((user, index) => (
                        <div key={index} className="top-user-card" style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className="user-rank">#{index + 1}</div>
                          <div className="user-info">
                            <div className="user-email">{user.email}</div>
                            <div className="user-stats">
                              <span className="stat-item">
                                <span className="stat-icon">⏱️</span>
                                {user.total_formatted}
                              </span>
                              <span className="stat-item">
                                <span className="stat-icon">🔄</span>
                                {user.session_count} sessions
                              </span>
                            </div>
                          </div>
                          <div className="user-badge">
                            {index === 0 && '👑'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hourly Activity Heatmap */}
                  <div className="hourly-activity-section">
                    <h3 className="section-title">🕐 Activity by Hour (Last 24h)</h3>
                    <div className="hourly-heatmap">
                      {userActivity.hourly_activity.map((hour, index) => {
                        const maxUsers = Math.max(...userActivity.hourly_activity.map(h => h.users), 1);
                        const intensity = (hour.users / maxUsers) * 100;
                        return (
                          <div 
                            key={index} 
                            className="hour-bar"
                            style={{ 
                              height: `${Math.max(intensity, 5)}%`,
                              animationDelay: `${index * 0.02}s`
                            }}
                            title={`${hour.hour}: ${hour.users} users`}
                          >
                            <div className="hour-label">{hour.hour}</div>
                            <div className="hour-value">{hour.users}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* Analytics Dashboard - ENHANCED */}
              <section id="analytics" className="panel">
                <header className="panel__head">
                  <h2>📊 Business Analytics Dashboard</h2>
                </header>

                <div className="panel__body">
                  <div className="analytics-grid-enhanced">
                    {/* Pie chart with smart loading */}
                    <SmartChartCard
                      title="User Distribution by Plan"
                      icon="📊"
                      chartUrl={`${process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000'}/piechart.png`}
                      altText="Plans Pie Chart"
                    />

                    {/* Line chart with smart loading */}
                    <SmartChartCard
                      title="Monthly Infrastructure Costs"
                      icon="📈"
                      chartUrl={`${process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000'}/charts/monthly-costs/`}
                      altText="Monthly Costs Line Chart"
                    />
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal__head"><h3>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</h3></div>
            <div className="modal__body">
              <label className="field"><span>Plan Name</span>
                <input type="text" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} />
              </label>
              <label className="field"><span>Price</span>
                <input type="number" step="0.01" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} />
              </label>
              <label className="field"><span>Currency</span>
                <select value={planForm.currency} onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </label>
              <label className="field"><span>Features (one per line)</span>
                <textarea rows={6} value={planForm.features} onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })} placeholder={`Access to limited games
Play on 1 device
Monthly game updates`} />
              </label>
            </div>
            <div className="modal__foot">
              <button className="btn" onClick={closePlanModal}>Cancel</button>
              <button className="btn btn-success" onClick={savePlan}>{editingPlan ? 'Update Plan' : 'Create Plan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Cost Modal */}
      {showCostModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal__head"><h3>Add Hosting Cost</h3></div>
            <div className="modal__body">
              <label className="field"><span>Description</span>
                <input 
                  type="text" 
                  value={costForm.description} 
                  onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}
                  placeholder="e.g., Docker hosting, Supabase Pro plan, CDN costs" 
                />
              </label>
              <label className="field"><span>Plan (Optional)</span>
                <select 
                  value={costForm.plan_id} 
                  onChange={(e) => setCostForm({ ...costForm, plan_id: e.target.value })}
                >
                  <option value="">General Infrastructure</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </label>
              <label className="field"><span>Category</span>
                <select 
                  value={costForm.category} 
                  onChange={(e) => setCostForm({ ...costForm, category: e.target.value })}
                >
                  <option value="hosting">Hosting</option>
                  <option value="database">Database</option>
                  <option value="cdn">CDN</option>
                  <option value="storage">Storage</option>
                  <option value="docker">Docker</option>
                  <option value="supabase">Supabase</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="field"><span>Monthly Cost (EUR)</span>
                <input 
                  type="number" 
                  step="0.01" 
                  value={costForm.amount} 
                  onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
                  placeholder="e.g., 29.99" 
                />
              </label>
            </div>
            <div className="modal__foot">
              <button className="btn" onClick={closeCostModal}>Cancel</button>
              <button className="btn btn-success" onClick={saveCost}>Add Cost</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** STYLES */
function StyleTag(){
  const css = `
  :root{--bg:#0a0b0c;--panel:#0f1216;--panel2:#0b0e12;--border:#22272f;--muted:#8b95a5;--text:#f3f6f4;--green:#22c55e;--green2:#16a34a;--warn:#f59e0b;--red:#ef4444;--shadow:0 10px 30px rgba(0,0,0,.45);--r:16px}
  *{box-sizing:border-box}
  body{background:var(--bg);color:var(--text)}
  .shell{min-height:100vh;display:grid;grid-template-columns:260px 1fr;background:
    radial-gradient(1000px 600px at 100% -10%, rgba(34,197,94,.06), transparent 60%),
    radial-gradient(900px 500px at -10% 120%, rgba(34,197,94,.05), transparent 60%),
    var(--bg)}
  .shell:not(.shell--sidebar-open){grid-template-columns:68px 1fr}
/* Fully collapsed variations */
.shell:not(.shell--sidebar-open) .sb-brand{justify-content:center;padding:12px 0}
.shell:not(.shell--sidebar-open) .sb-brand img{height:32px}
.shell:not(.shell--sidebar-open) .sb-brand span{display:none}
.shell:not(.shell--sidebar-open) .sb-nav{padding:6px}
.shell:not(.shell--sidebar-open) .sb-link{padding:10px 0;text-align:center}
.shell:not(.shell--sidebar-open) .sb-link::after{content:'';display:block;width:6px;height:6px;border-radius:999px;margin:0 auto;background:#324052}
.shell:not(.shell--sidebar-open) .sb-link.active::after{background:var(--green)}
.shell:not(.shell--sidebar-open) .sb-link{color:transparent}
.shell:not(.shell--sidebar-open) .sb-foot{display:none}
.shell:not(.shell--sidebar-open) .sidebar{width:68px}

  /* Sidebar */
  .sidebar{position:sticky;top:0;height:100vh;border-right:1px solid var(--border);background:linear-gradient(180deg,var(--panel),var(--panel2));box-shadow:var(--shadow);display:flex;flex-direction:column;min-width:0;overflow:hidden;transition:width .18s ease}
  .sb-brand{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid var(--border)}
  .sb-brand img{height:36px;width:auto;border-radius:10px}
  .sb-brand span{font-weight:800;color:var(--green)}
  .sb-nav{display:flex;flex-direction:column;padding:10px}
  .sb-link{padding:10px 12px;border-radius:12px;color:#cbd5e1;text-decoration:none;border:1px solid transparent}
  .sb-link:hover{background:#0e141a;border-color:#1d222b}
  .sb-link.active{background:#0f1913;border-color:#1c3322;color:var(--green)}
  .sb-foot{margin-top:auto;padding:14px 16px;color:#5b6574;border-top:1px solid var(--border)}

  /* Main column */
  .main{display:flex;flex-direction:column;min-width:0}
  .topbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid var(--border);background:linear-gradient(180deg,rgba(15,18,22,.9),rgba(15,18,22,.7));backdrop-filter:blur(8px)}
  .icon-btn{appearance:none;border:none;background:#141920;border:1px solid #1d2330;color:#d1d5db;border-radius:12px;padding:8px 10px;cursor:pointer;font-weight:900}
  .icon-btn:hover{filter:brightness(1.1)}
  .flex-grow{flex:1}
  .userbox{display:flex;align-items:center;gap:10px}
  .welcome{color:var(--green);font-weight:700}

  .content{padding:22px;display:grid;gap:22px}

  /* Enhanced Hero */
  .enhanced-hero{position:relative;border:1px solid var(--border);border-radius:var(--r);overflow:hidden;min-height:200px;background:linear-gradient(135deg,#0d1116,#0a0e12,#0f1419)}
  .hero-bg{position:absolute;inset:0;background:
    radial-gradient(1200px 400px at 10% 20%, rgba(34,197,94,.08), transparent 60%),
    radial-gradient(800px 300px at 90% 80%, rgba(34,197,94,.06), transparent 50%),
    linear-gradient(45deg, transparent 30%, rgba(34,197,94,.02) 50%, transparent 70%)}
  
  .hero-content{position:relative;padding:24px}
  .hero-title{text-align:center;margin-bottom:24px}
  .hero-title h1{margin:0;font-size:32px;background:linear-gradient(135deg,var(--green),#16a34a,var(--green));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .hero-subtitle{margin:8px 0 0;color:var(--muted);font-size:16px}
  
  .enhanced-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}
  .animated-stat{display:flex;align-items:center;gap:16px;border:1px solid var(--border);border-radius:16px;padding:20px;background:linear-gradient(135deg,#0c1014,#0a0e12);box-shadow:var(--shadow);transition:all .3s ease;animation:statSlideIn 0.6s ease-out forwards;opacity:0;transform:translateY(30px)}
  .animated-stat:hover{transform:translateY(-4px);box-shadow:0 8px 25px rgba(34,197,94,0.15);border-color:var(--green)}
  
  @keyframes statSlideIn{to{opacity:1;transform:translateY(0)}}
  
  .stat-icon{font-size:32px;display:flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:12px;background:rgba(34,197,94,0.1)}
  .stat-content{display:flex;flex-direction:column}
  .stat-content span{color:var(--green);font-weight:700;font-size:14px;margin-bottom:4px}
  .stat-content strong{font-size:28px;font-weight:800;color:var(--text)}
  
  .counter{transition:all 0.5s ease}
  .revenue-counter{color:var(--green)!important}
  
  /* Quick Actions */
  .quick-actions{display:flex;justify-content:center;gap:16px;flex-wrap:wrap}
  .quick-btn{display:flex;align-items:center;gap:8px;padding:12px 20px;border:1px solid var(--border);border-radius:12px;background:linear-gradient(135deg,#0c1014,#0f1419);color:var(--text);cursor:pointer;transition:all .3s ease;text-decoration:none}
  .quick-btn:hover{transform:translateY(-2px);border-color:var(--green);box-shadow:0 4px 15px rgba(34,197,94,0.2)}
  .quick-btn.pdf-btn{background:linear-gradient(135deg,#1e40af,#3b82f6);border-color:#3b82f6;color:#fff}
  .quick-btn.pdf-btn:hover{border-color:#60a5fa;box-shadow:0 4px 15px rgba(59,130,246,0.3);transform:translateY(-2px) scale(1.02)}
  .btn-icon{font-size:18px}

  /* Skeleton */
  .skeleton{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
  .sk{height:120px;border-radius:14px;background:linear-gradient(90deg,#12161b,#0f1419,#12161b);background-size:200% 100%;animation:shim 1.4s infinite}
  .sk--wide{grid-column:1/-1;height:280px}
  @keyframes shim{0%{background-position:200% 0}100%{background-position:-200% 0}}

  /* Panels */
  .panel{border:1px solid var(--border);border-radius:var(--r);background:linear-gradient(180deg,var(--panel),var(--panel2));box-shadow:var(--shadow)}
  .panel__head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border)}
  .panel__head h2{margin:0;color:var(--green)}
  .panel__body{padding:14px}

  /* ML Badge */
  .badge-ml{
    display:inline-block;
    padding:6px 12px;
    background:linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color:#fff;
    font-size:11px;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:0.5px;
    border-radius:999px;
    box-shadow:0 2px 8px rgba(34, 197, 94, 0.3);
  }

  /* Table */
  .table-wrap{overflow:auto}
  .table{width:100%;border-collapse:separate;border-spacing:0}
  .table thead th{position:sticky;top:0;background:#151b22;color:var(--green);text-align:left;padding:12px;border-bottom:1px solid var(--border);font-size:12px;letter-spacing:.08em;text-transform:uppercase}
  .table tbody td{padding:12px;border-top:1px solid var(--border)}
  .table tbody tr:hover{background:#0e1419}
  .table .alt{background:#0c1116}
  .table.table--compact td,.table.table--compact th{padding:10px}

  .expand td{background:#0b0f13}
  .expand__box{border:1px solid var(--border);border-radius:12px;padding:14px;background:#0a0d11}
  .expand__box h4{margin:0 0 10px 0;color:var(--green)}

  /* Pills */
  .pill{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--border);padding:6px 10px;border-radius:999px;font-size:12px;font-weight:800;background:#0f1419}
  .pill--ok{border-color:#214c33;background:#0f1a14;color:var(--green)}
  .pill--bad{border-color:#4c2121;background:#1a0f0f;color:#ff6b6b}
  .pill--warn{border-color:#4c3a21;background:#1a140f;color:var(--warn)}

  /* Buttons */
  .btn{appearance:none;border:none;cursor:pointer;border-radius:12px;padding:10px 14px;font-weight:800;background:#23272f;color:#e6ebf0;transition:transform .06s ease, filter .15s ease, background .2s ease}
  .btn:hover{filter:brightness(1.08)}
  .btn:active{transform:translateY(1px)}
  .btn-sm{padding:8px 10px;font-size:12px}
  .btn-xs{padding:6px 8px;font-size:11px}
  .btn-primary{background:linear-gradient(180deg,#15223a,#121a2d);border:1px solid #27324a}
  .btn-info{background:linear-gradient(180deg,#102236,#0e1a2a);border:1px solid #253a52}
  .btn-success{background:linear-gradient(180deg,#0e2a17,#0c2213);border:1px solid #185a33;color:var(--green)}
  .btn-warning{background:linear-gradient(180deg,#2d1f0b,#231908);border:1px solid #6a4b16;color:var(--warn)}
  .btn-danger{background:linear-gradient(180deg,#2a0f10,#200b0b);border:1px solid #6a1b1b;color:#ff7b7b}

  .row-actions{display:flex;flex-wrap:wrap;gap:8px}
  .center{text-align:center}

  /* Plans */
  .plan-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;padding:14px}
  .plan{position:relative;border:1px solid var(--border);border-radius:16px;padding:16px;background:linear-gradient(180deg,#0d1116,#0b0f13 70%, #0a0e12);box-shadow:var(--shadow);overflow:hidden}
  .plan__actions{position:absolute;top:12px;right:12px;display:flex;gap:6px}
  .plan__title{margin:0 0 8px 0;color:var(--green)}
  .plan__meta{display:grid;gap:6px;margin-bottom:8px}
  .plan__features ul{margin:8px 0 0;padding-left:0;list-style:none}
  .plan__features li{padding:6px 0;border-bottom:1px dashed #1e242c}

  /* Chart */
  .chart{width:100%;max-width:640px;border-radius:12px;border:1px solid var(--border);box-shadow:var(--shadow)}
  .hidden{display:none}

  /* Modal */
  .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;z-index:50}
  .modal{width:min(560px,96%);border:1px solid var(--border);border-radius:16px;background:linear-gradient(180deg,var(--panel),var(--panel2));box-shadow:var(--shadow);display:flex;flex-direction:column}
  .modal__head{padding:16px;border-bottom:1px solid var(--border)}
  .modal__head h3{margin:0;color:var(--green)}
  .modal__body{padding:16px;display:grid;gap:12px;max-height:60vh;overflow:auto}
  .modal__foot{padding:14px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px}

  .field{display:grid;gap:8px}
  .field>span{font-size:12px;color:var(--muted)}
  .field input,.field select,.field textarea{width:100%;padding:12px;border-radius:10px;border:1px solid var(--border);background:#0a0d11;color:var(--text);outline:none}
  .field input:focus,.field select:focus,.field textarea:focus{border-color:#2d9a57;box-shadow:0 0 0 3px rgba(34,197,94,.15)}

  .muted{color:var(--muted)}
  .i{font-style:italic}

  /* Revenue Analytics */
  .revenue-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:24px}
  .revenue-card{border:1px solid var(--border);border-radius:12px;padding:16px;background:linear-gradient(135deg,#0f1419,#0c1014);box-shadow:var(--shadow)}
  .revenue-card h4{margin:0 0 8px 0;color:var(--green);font-size:14px;font-weight:600}
  .revenue-amount{font-size:28px;font-weight:800;color:var(--text);margin-bottom:4px}
  .revenue-card .muted{font-size:12px}
  .stat.revenue{border-color:var(--green);background:linear-gradient(135deg,#0e2a17,#0a1f12)}
  .stat.revenue span{color:var(--green)}

  /* Enhanced Charts */
  .charts-grid{display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-top:24px}
  .chart-container{border:1px solid var(--border);border-radius:12px;padding:16px;background:linear-gradient(135deg,#0f1419,#0c1014)}
  .chart-container h4{margin:0 0 16px 0;color:var(--green)}
  
  .animated-chart{display:flex;align-items:end;gap:3px;height:140px;padding:12px;border:1px solid var(--border);border-radius:8px;background:#0a0d11;position:relative}
  .animated-bar{position:relative;background:linear-gradient(to top,var(--green),#16a34a,#22c55e);min-width:12px;border-radius:4px 4px 0 0;cursor:pointer;transition:all .3s ease;animation:slideUp 0.8s ease-out forwards;transform:scaleY(0);transform-origin:bottom}
  .animated-bar:hover{filter:brightness(1.3);transform:scaleY(1.1);box-shadow:0 0 15px rgba(34,197,94,0.4)}
  
  @keyframes slideUp{to{transform:scaleY(1)}}
  
  .bar-value{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:var(--green);font-size:10px;padding:2px 6px;border-radius:4px;opacity:0;transition:opacity .3s ease;white-space:nowrap}
  .animated-bar:hover .bar-value{opacity:1}
  
  .no-data-chart{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--muted);text-align:center}
  .no-data-icon{font-size:48px;margin-bottom:12px;opacity:0.5}
  
  /* Growth Indicators */
  .growth-indicators{display:grid;gap:12px;margin-bottom:20px}
  .growth-card{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border);border-radius:8px;background:#0a0d11}
  .growth-icon{font-size:24px}
  .growth-content{display:flex;flex-direction:column}
  .growth-label{font-size:12px;color:var(--muted)}
  .growth-value{font-weight:800;font-size:16px}
  .growth-value.positive{color:var(--green)}
  .growth-value.negative{color:var(--red)}
  
  /* Circular Progress */
  .revenue-progress{display:flex;justify-content:center;align-items:center}
  .progress-circle{position:relative;display:flex;align-items:center;justify-content:center}
  .progress-ring-circle{transition:stroke-dashoffset 2s ease-out;animation:progressFill 2s ease-out}
  .progress-text{position:absolute;text-align:center}
  .progress-value{font-size:18px;font-weight:800;color:var(--green)}
  .progress-label{font-size:12px;color:var(--muted)}
  
  @keyframes progressFill{from{stroke-dashoffset:327}}

  /* Enhanced Hosting Costs */
  .costs-overview{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
  .cost-summary,.cost-per-plan{border:1px solid var(--border);border-radius:12px;padding:16px;background:linear-gradient(135deg,#0f1419,#0c1014)}
  .cost-summary h4,.cost-per-plan h4{margin:0 0 16px 0;color:var(--green)}
  .cost-breakdown{display:grid;gap:12px}
  
  .animated-cost-item{padding:12px;border:1px solid var(--border);border-radius:8px;background:#0a0d11;transition:all .3s ease;animation:fadeInUp 0.6s ease-out forwards;opacity:0;transform:translateY(20px)}
  .animated-cost-item:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(34,197,94,0.1)}
  
  @keyframes fadeInUp{to{opacity:1;transform:translateY(0)}}
  
  .cost-info{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  .cost-category{font-weight:600;text-transform:capitalize;display:flex;align-items:center;gap:8px}
  .cost-amount{font-weight:800;color:var(--green);font-size:16px}
  
  .cost-bar{height:6px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:4px}
  .cost-bar-fill{height:100%;background:linear-gradient(90deg,var(--green),#16a34a);border-radius:3px;transition:width 1.5s ease-out;animation:fillBar 1.5s ease-out}
  
  @keyframes fillBar{from{width:0}}
  
  .cost-percentage{font-size:12px;color:var(--muted);text-align:right}
  
  .total-costs{display:flex;align-items:center;gap:12px;margin-top:16px;padding:12px;border:2px solid var(--green);border-radius:8px;background:rgba(34,197,94,0.05)}
  .total-icon{font-size:24px}
  .total-info{display:flex;flex-direction:column}
  .total-label{font-size:12px;color:var(--muted)}
  .total-value{font-size:20px;font-weight:800;color:var(--green)}
  
  /* Enhanced Plan Analysis */
  .enhanced-plan-card{margin-bottom:16px;padding:16px;border:1px solid var(--border);border-radius:12px;background:linear-gradient(135deg,#0a0d11,#0c1014);transition:all .3s ease;animation:slideInFromRight 0.8s ease-out forwards;opacity:0;transform:translateX(30px)}
  .enhanced-plan-card:hover{transform:translateY(-2px) translateX(0);box-shadow:0 8px 25px rgba(0,0,0,0.3)}
  
  @keyframes slideInFromRight{to{opacity:1;transform:translateX(0)}}
  
  .plan-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
  .plan-header h5{margin:0;color:var(--text);font-size:18px}
  
  .profit-badge{padding:4px 12px;border-radius:20px;font-size:12px;font-weight:800}
  .profit-badge.profitable{background:rgba(34,197,94,0.2);color:var(--green);border:1px solid var(--green)}
  .profit-badge.loss{background:rgba(239,68,68,0.2);color:var(--red);border:1px solid var(--red)}
  
  .cost-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
  .metric-card{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border);border-radius:8px;background:#0a0d11;transition:all .3s ease}
  .metric-card:hover{transform:translateY(-2px);border-color:var(--green)}
  
  .metric-icon{font-size:20px}
  .metric-content{display:flex;flex-direction:column}
  .metric-value{font-weight:800;font-size:16px}
  .metric-label{font-size:12px;color:var(--muted)}
  
  .profit-margin-bar{margin-top:12px}
  .margin-label{font-size:12px;color:var(--muted);margin-bottom:6px}
  .margin-bar{height:8px;background:var(--border);border-radius:4px;overflow:hidden}
  .margin-fill{height:100%;border-radius:4px;transition:width 1.5s ease-out}
  .margin-fill.positive{background:linear-gradient(90deg,var(--green),#16a34a)}
  .margin-fill.negative{background:linear-gradient(90deg,var(--red),#ef4444)}
  
  .user-count-display{background:#f8f9fa;border-radius:8px;padding:1rem;margin:1rem 0;border:1px solid #e9ecef}
  .user-info{display:flex;align-items:center;gap:0.75rem}
  .user-icon{font-size:1.5rem}
  .user-details{display:flex;flex-direction:column}
  .user-count{font-size:1.25rem;font-weight:600;color:#2196f3}
  .user-label{font-size:0.85rem;color:#666}
  
  .revenue-formula{background:linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%);border-radius:8px;padding:1rem;margin:1rem 0;border:1px solid #d1ecf1}
  .formula-text{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:0.5rem;font-family:'Courier New',monospace}
  .formula-part{background:#fff;padding:0.25rem 0.5rem;border-radius:4px;font-weight:600;color:#495057;border:1px solid #dee2e6}
  .formula-operator{font-size:1.1rem;font-weight:bold;color:#6c757d}
  .formula-result{background:#d4edda;padding:0.25rem 0.5rem;border-radius:4px;font-weight:600;color:#155724;border:1px solid #c3e6cb}
  
  .formula-in-metric{margin-bottom:4px}
  .formula-compact{font-size:11px;font-family:'Courier New',monospace;background:rgba(34,197,94,0.1);color:var(--green);padding:4px 6px;border-radius:4px;display:inline-block;border:1px solid rgba(34,197,94,0.2)}
  
  .profit{color:var(--green);font-weight:800}
  .loss{color:var(--red);font-weight:800}
  .cost-entries{margin-top:24px}
  .cost-entries h4{margin:0 0 16px 0;color:var(--green)}

  @media (max-width: 980px){ 
    .shell{grid-template-columns:68px 1fr} 
    .costs-overview{grid-template-columns:1fr}
    .revenue-grid{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
    .charts-grid{grid-template-columns:1fr}
    .cost-metrics{grid-template-columns:1fr}
  }
  @media (max-width: 720px){ 
    .content{padding:14px} 
    .panel__body{padding:10px} 
    .plan-grid{padding:10px} 
    .welcome{display:none}
    .revenue-grid{grid-template-columns:1fr}
    .costs-overview{grid-template-columns:1fr}
    .charts-grid{grid-template-columns:1fr}
    .cost-metrics{grid-template-columns:1fr}
    .animated-chart{height:100px}
    .progress-circle{transform:scale(0.8)}
  }

  /* Notification System Styles */
  .notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 400px;
  }

  .notification {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 16px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    animation: slideInRight 0.3s ease-out;
    box-shadow: var(--shadow);
    position: relative;
  }

  .notification-success {
    border-left: 4px solid var(--green);
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, var(--panel) 100%);
  }

  .notification-error {
    border-left: 4px solid var(--red);
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, var(--panel) 100%);
  }

  .notification-info {
    border-left: 4px solid #3b82f6;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, var(--panel) 100%);
  }

  .notification-content {
    flex: 1;
    font-size: 14px;
    line-height: 1.4;
    color: var(--text);
  }

  .notification-close {
    background: none;
    border: none;
    color: var(--muted);
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .notification-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text);
  }

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

  .notification:hover {
    cursor: pointer;
    opacity: 0.9;
  }

  /* ===== USER ACTIVITY ANALYTICS STYLES ===== */
  .activity-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }

  .activity-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border: 1px solid var(--border);
    border-radius: 16px;
    background: linear-gradient(135deg, #0c1014, #0f1419);
    box-shadow: var(--shadow);
    transition: all 0.3s ease;
    animation: slideInUp 0.6s ease-out forwards;
  }

  .activity-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(34, 197, 94, 0.15);
    border-color: var(--green);
  }

  .activity-card.pulse-card {
    border-color: var(--green);
    background: linear-gradient(135deg, #0e2a17, #0a1f12);
    animation: pulse 2s infinite;
  }

  .activity-card.highlight-card {
    grid-column: span 1;
    background: linear-gradient(135deg, #1a2e1c, #0f1a12);
    border-color: var(--green);
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
    50% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
  }

  .activity-icon {
    font-size: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 12px;
    background: rgba(34, 197, 94, 0.1);
  }

  .activity-icon.online {
    animation: blink 2s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .activity-content {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .activity-label {
    font-size: 12px;
    color: var(--muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .activity-value {
    font-size: 28px;
    font-weight: 800;
    color: var(--green);
  }

  .activity-value.big {
    font-size: 36px;
  }

  /* Online Users Card Styles */
  .online-users-card {
    position: relative;
    cursor: pointer;
    flex-direction: column;
    align-items: flex-start;
  }

  .online-users-card > div:first-child {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  .online-users-dropdown {
    margin-top: 16px;
    width: 100%;
    padding-top: 16px;
    border-top: 1px solid rgba(34, 197, 94, 0.2);
    animation: fadeInDown 0.3s ease-out;
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .online-users-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 13px;
    color: var(--green);
  }

  .online-indicator {
    font-size: 10px;
    animation: blink 2s ease-in-out infinite;
  }

  .online-users-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
    padding-right: 8px;
  }

  .online-users-list::-webkit-scrollbar {
    width: 6px;
  }

  .online-users-list::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  .online-users-list::-webkit-scrollbar-thumb {
    background: var(--green);
    border-radius: 3px;
  }

  .online-user-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(34, 197, 94, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(34, 197, 94, 0.1);
    transition: all 0.2s ease;
  }

  .online-user-item:hover {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.3);
    transform: translateX(4px);
  }

  .user-avatar {
    font-size: 16px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(34, 197, 94, 0.2);
    border-radius: 50%;
  }

  .user-email {
    flex: 1;
    font-size: 13px;
    color: var(--text);
    font-weight: 500;
  }

  .user-time {
    font-size: 11px;
    color: var(--muted);
    font-weight: 600;
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }

  /* Chart Section */
  .chart-section {
    margin: 32px 0;
    padding: 24px;
    border: 1px solid var(--border);
    border-radius: 16px;
    background: linear-gradient(135deg, #0f1419, #0c1014);
  }

  .chart-title {
    margin: 0 0 20px 0;
    color: var(--green);
    font-size: 20px;
    font-weight: 700;
  }

  .chart-wrapper {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    background: #0a0d11;
    padding: 12px;
  }

  .activity-chart {
    width: 100%;
    height: auto;
    border-radius: 8px;
    display: block;
  }

  .chart-fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: var(--muted);
  }

  .fallback-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  /* Top Users Section */
  .top-users-section {
    margin: 32px 0;
  }

  .section-title {
    margin: 0 0 20px 0;
    color: var(--green);
    font-size: 20px;
    font-weight: 700;
  }

  .top-users-grid {
    display: grid;
    gap: 12px;
  }

  .top-user-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: linear-gradient(135deg, #0c1014, #0a0e12);
    transition: all 0.3s ease;
    animation: slideInLeft 0.6s ease-out forwards;
    opacity: 0;
  }

  .top-user-card:hover {
    transform: translateX(8px);
    border-color: var(--green);
    box-shadow: 0 4px 15px rgba(34, 197, 94, 0.2);
  }

  @keyframes slideInLeft {
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .user-rank {
    font-size: 24px;
    font-weight: 800;
    color: var(--green);
    min-width: 40px;
    text-align: center;
  }

  .user-info {
    flex: 1;
  }

  .user-email {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 4px;
  }

  .user-stats {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: var(--muted);
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .stat-icon {
    font-size: 14px;
  }

  .user-badge {
    font-size: 28px;
  }

  /* Hourly Activity Heatmap */
  .hourly-activity-section {
    margin: 32px 0;
  }

  .hourly-heatmap {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 200px;
    padding: 20px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: #0a0d11;
  }

  .hour-bar {
    position: relative;
    flex: 1;
    background: linear-gradient(to top, var(--green), #16a34a);
    border-radius: 4px 4px 0 0;
    min-height: 5%;
    cursor: pointer;
    transition: all 0.3s ease;
    animation: growUp 0.8s ease-out forwards;
    transform-origin: bottom;
  }

  .hour-bar:hover {
    filter: brightness(1.3);
    transform: scaleY(1.05);
  }

  @keyframes growUp {
    from {
      transform: scaleY(0);
      opacity: 0;
    }
    to {
      transform: scaleY(1);
      opacity: 1;
    }
  }

  .hour-label {
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 9px;
    color: var(--muted);
    white-space: nowrap;
  }

  .hour-value {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    font-weight: 700;
    color: var(--green);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .hour-bar:hover .hour-value {
    opacity: 1;
  }

  /* Enhanced Analytics Grid */
  .analytics-grid-enhanced {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 32px;
    padding: 24px 0;
  }

  .chart-card {
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    background: linear-gradient(135deg, #0f1419, #0c1014);
    box-shadow: var(--shadow);
    transition: all 0.3s ease;
  }

  .chart-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
    border-color: var(--green);
  }

  .chart-card-title {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--green);
    text-align: center;
  }

  .chart-container-enhanced {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    background: #0a0d11;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chart-image {
    width: 100%;
    height: auto;
    border-radius: 8px;
    display: block;
    transition: opacity 0.3s ease;
  }

  .chart-image.loaded {
    animation: fadeIn 0.5s ease-in;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }

  .chart-icon {
    display: inline-block;
    margin-right: 8px;
    font-size: 20px;
  }

  /* Interactive Canvas Styles */
  .interactive-canvas {
    display: block;
    border-radius: 8px;
  }

  /* Chart Tooltip */
  .chart-tooltip {
    background: linear-gradient(135deg, #0f1419, #0c1014);
    border: 2px solid var(--green);
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
    z-index: 1000;
    animation: tooltipFadeIn 0.2s ease-out;
    min-width: 180px;
  }

  @keyframes tooltipFadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .tooltip-date {
    font-size: 13px;
    color: var(--green);
    font-weight: 700;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tooltip-value {
    font-size: 18px;
    color: var(--text);
    margin-bottom: 4px;
  }

  .tooltip-value strong {
    color: var(--green);
    font-weight: 800;
  }

  .tooltip-users {
    font-size: 12px;
    color: var(--muted);
  }

  /* Loading State */
  .chart-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    gap: 16px;
  }

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(34, 197, 94, 0.1);
    border-top-color: var(--green);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Error State */
  .chart-fallback.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 40px 20px;
    text-align: center;
  }

  .error-title {
    font-size: 16px;
    font-weight: 700;
    color: #ef4444;
    margin: 12px 0 8px 0;
  }

  .muted.small {
    font-size: 13px;
    max-width: 300px;
  }

  .retry-btn {
    margin-top: 16px;
    padding: 8px 16px;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .retry-btn:hover {
    transform: scale(1.05);
  }

  @media (max-width: 980px) {
    .activity-overview {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }
    
    .analytics-grid-enhanced {
      grid-template-columns: 1fr;
    }
    
    .hourly-heatmap {
      height: 150px;
    }
  }

  @media (max-width: 720px) {
    .activity-overview {
      grid-template-columns: 1fr;
    }
    
    .activity-card {
      padding: 16px;
    }
    
    .activity-icon {
      width: 50px;
      height: 50px;
      font-size: 24px;
    }
    
    .activity-value {
      font-size: 24px;
    }
    
    .top-users-grid {
      gap: 8px;
    }
    
    .user-rank {
      font-size: 18px;
      min-width: 30px;
    }
  }
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
