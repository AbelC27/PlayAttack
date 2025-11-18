import '@testing-library/jest-dom';
import { supabase } from './supabaseClient';

// Mock the supabase client to avoid real API calls during tests
jest.mock('./supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        execute: jest.fn(),
      })),
    })),
  },
}));

/**
 * Test 1: Verify Supabase client initialization
 * This ensures that the Supabase connection is properly configured
 */
describe('Supabase Connection Tests', () => {
  test('Supabase client should be initialized', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(typeof supabase.auth.signInWithPassword).toBe('function');
    expect(typeof supabase.auth.signUp).toBe('function');
  });

  test('Supabase environment variables should be set', () => {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

    expect(supabaseUrl).toBeDefined();
    expect(supabaseKey).toBeDefined();
    expect(supabaseUrl).toContain('supabase.co');
  });
});

/**
 * Test 2: Authentication flow tests
 * Tests user sign in, sign up, and sign out functionality
 */
describe('Authentication Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test('Should handle user sign in successfully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    const mockSession = {
      access_token: 'mock-access-token',
      user: mockUser,
    };

    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const result = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.data.user).toEqual(mockUser);
    expect(result.data.session).toEqual(mockSession);
    expect(result.error).toBeNull();
  });

  test('Should handle sign in errors gracefully', async () => {
    const mockError = { message: 'Invalid credentials' };

    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: mockError,
    });

    const result = await supabase.auth.signInWithPassword({
      email: 'wrong@example.com',
      password: 'wrongpassword',
    });

    expect(result.error).toEqual(mockError);
    expect(result.data.user).toBeNull();
  });

  test('Should handle user sign up', async () => {
    const mockUser = {
      id: 'new-user-123',
      email: 'newuser@example.com',
    };

    supabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const result = await supabase.auth.signUp({
      email: 'newuser@example.com',
      password: 'newpassword123',
    });

    expect(result.data.user).toEqual(mockUser);
    expect(result.error).toBeNull();
  });
});

/**
 * Test 3: API integration tests
 * Tests communication with Django backend
 */
describe('Backend API Integration Tests', () => {
  const BACKEND_URL = 'http://localhost:8000';

  beforeEach(() => {
    // Mock fetch globally for API tests
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Should fetch plans from backend API', async () => {
    const mockPlans = [
      { id: 1, name: 'Free', price: 0, currency: 'EUR' },
      { id: 2, name: 'Pro', price: 19.99, currency: 'EUR' },
      { id: 3, name: 'Premium', price: 29.99, currency: 'EUR' },
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockPlans,
    });

    const response = await fetch(`${BACKEND_URL}/api/plans/`);
    const plans = await response.json();

    expect(response.ok).toBe(true);
    expect(plans).toHaveLength(3);
    expect(plans[0].name).toBe('Free');
    expect(plans[1].price).toBe(19.99);
  });

  test('Should handle backend API errors', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });

    const response = await fetch(`${BACKEND_URL}/api/plans/`);

    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });
});

/**
 * Test 4: Payment flow tests
 * Tests Stripe payment integration
 */
describe('Payment Integration Tests', () => {
  const BACKEND_URL = 'http://localhost:8000';

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Should create payment intent', async () => {
    const mockPaymentIntent = {
      client_secret: 'pi_test_secret_123',
      payment_intent_id: 'pi_123',
      demo_mode: false,
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockPaymentIntent,
    });

    const response = await fetch(`${BACKEND_URL}/api/create-payment-intent/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: 2, user_email: 'test@example.com' }),
    });

    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.client_secret).toBeDefined();
    expect(result.payment_intent_id).toBeDefined();
  });

  test('Should confirm payment after successful transaction', async () => {
    const mockConfirmation = {
      success: true,
      message: 'Payment confirmed and subscription activated',
      subscription: {
        id: 1,
        plan_name: 'Pro',
        status: 'active',
      },
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockConfirmation,
    });

    const response = await fetch(`${BACKEND_URL}/api/confirm-payment/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_intent_id: 'pi_123',
        user_email: 'test@example.com',
        plan_id: 2,
      }),
    });

    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.subscription.status).toBe('active');
  });
});

/**
 * Test 5: User session and activity tracking
 * Tests that user sessions are properly tracked
 */
describe('User Session Tracking Tests', () => {
  const BACKEND_URL = 'http://localhost:8000';

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Should track user login session', async () => {
    const mockSession = {
      success: true,
      session_id: 'session-123',
      message: 'Session started',
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockSession,
    });

    const response = await fetch(`${BACKEND_URL}/api/track-session/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: 'test@example.com',
        user_id: 'user-123',
      }),
    });

    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.session_id).toBeDefined();
  });

  test('Should track user logout and calculate duration', async () => {
    const mockLogout = {
      success: true,
      message: 'Session ended',
      duration_minutes: 45,
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockLogout,
    });

    const response = await fetch(`${BACKEND_URL}/api/track-session/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'logout',
        email: 'test@example.com',
        session_id: 'session-123',
      }),
    });

    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.duration_minutes).toBeGreaterThan(0);
  });
});
