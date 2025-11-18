import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SupabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {

      // Test basic connection
      const { data, error } = await supabase
        .from('app_plan')
        .select('*');

      if (error) {
        console.error('Supabase error:', error);
        setError(error.message);
        setConnectionStatus('❌ Connection failed');
      } else {
        setPlans(data || []);
        setConnectionStatus(`✅ Connected! Found ${data?.length || 0} plans`);
      }
    } catch (err) {
      console.error('Test error:', err);
      setError(err.message);
      setConnectionStatus('❌ Test failed');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '1rem',
      color: '#white',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h4 style={{ color: '#22c55e', margin: '0 0 0.5rem 0' }}>Supabase Debug</h4>
      <p style={{ margin: '0.25rem 0' }}>Status: {connectionStatus}</p>
      {error && <p style={{ color: '#ff4444', margin: '0.25rem 0' }}>Error: {error}</p>}
      <p style={{ margin: '0.25rem 0' }}>Plans found: {plans.length}</p>
      {plans.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <strong>Plans:</strong>
          <ul style={{ margin: '0.25rem 0', paddingLeft: '1rem' }}>
            {plans.map(plan => (
              <li key={plan.id} style={{ margin: '0.25rem 0' }}>
                {plan.name} - €{plan.price}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SupabaseTest;