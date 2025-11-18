// frontend/exemplu/src/hooks/useAuth.js
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { handleSupabaseRedirect, hasSupabaseRecoveryParams } from '../authMiddleware';
import { clearAllAuthData } from '../utils/authCleanup';
// Create Auth Context
const AuthContext = createContext({});

// Cache for user profile to prevent redundant fetches
const profileCache = new Map();
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const userIdRef = useRef(null);
  const fetchInProgress = useRef(false);

  // Define fetchUserProfile with caching
  const fetchUserProfile = useCallback(async (userId) => {
    // Check cache first
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < PROFILE_CACHE_TTL) {
      setUserProfile(cached.data);
      return cached.data;
    }

    // Prevent duplicate simultaneous fetches
    if (fetchInProgress.current) return;

    try {
      fetchInProgress.current = true;
      const { data, error } = await supabase
        .from('app_user')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      // Cache the result
      profileCache.set(userId, { data, timestamp: Date.now() });
      setUserProfile(data);
      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      fetchInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        // Check if we're in a recovery flow FIRST
        const isRecoveryFlow = hasSupabaseRecoveryParams();

        if (isRecoveryFlow) {
          await handleSupabaseRedirect();
        }

        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setUserProfile(null);
          setSession(null);
          return;
        }

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          userIdRef.current = currentSession.user.id;

          // Fetch profile in background, don't await
          fetchUserProfile(currentSession.user.id).catch(console.error);
        } else {
          setUser(null);
          setUserProfile(null);
          setSession(null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setUser(null);
          setUserProfile(null);
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {

      // Handle sign out
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        setSession(null);
        userIdRef.current = null;
        setLoading(false);
        return;
      }

      // Only process significant events, not token refresh
      if (event === 'TOKEN_REFRESHED') {
        return;
      }

      // For other events, check if user actually changed
      const newUserId = session?.user?.id;

      if (newUserId === userIdRef.current) {
        return;
      }

      // User has changed
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        userIdRef.current = session.user.id;
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
        setSession(null);
        userIdRef.current = null;
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Generate username from email
  const generateUsername = useCallback((email) => {
    const baseUsername = email.split('@')[0];
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${baseUsername}${randomSuffix}`;
  }, []);

  // Create user profile in app_user table
  const createUserProfile = useCallback(
    async (authUser, password = null) => {
      try {
        const username = generateUsername(authUser.email);

        const userProfile = {
          id: authUser.id,
          email: authUser.email,
          username: username,
          role: 'user',
          is_staff: false,
          is_active: true,
          is_superuser: false,
          date_joined: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('app_user')
          .insert(userProfile)
          .select()
          .single();

        if (error) {
          console.error('Error creating user profile:', error);
          throw error;
        }

        setUserProfile(data);
        return data;
      } catch (error) {
        console.error('Error in createUserProfile:', error);
        throw error;
      }
    },
    [generateUsername]
  );

  // Sign up function
  const signUp = useCallback(
    async (email, password) => {
      try {
        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

        if (data.user) {
          await createUserProfile(data.user, password);
        }

        return { success: true, data, error: null };
      } catch (error) {
        console.error('Signup error:', error);
        return { success: false, data: null, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [createUserProfile]
  );

  // Track session in Django backend with timeout
  const trackSession = useCallback(
    async (action, email, sessionId = null) => {
      try {
        const API_URL =
          process.env.REACT_APP_DJANGO_URL || 'http://localhost:8000';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${API_URL}/api/session-tracking/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            email,
            session_id: sessionId,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(
            `Session tracking ${action} failed with status: ${response.status}`
          );
          return null;
        }

        const data = await response.json();
        return data;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn(
            `Session tracking ${action} timeout - continuing anyway`
          );
        } else {
          console.error('Session tracking error:', error);
        }
        return null;
      }
    },
    []
  );

  // Sign in function
  const signIn = useCallback(
    async (email, password) => {
      try {
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const { data: existingProfile } = await supabase
            .from('app_user')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (!existingProfile) {
            await createUserProfile(data.user, 'supabase_auth');
          }

          sessionStorage.setItem('authSessionActive', 'true');

          const sessionData = await trackSession('login', data.user.email);
          if (sessionData?.session_id) {
            sessionStorage.setItem(
              'djangoSessionId',
              sessionData.session_id
            );
          }
        }

        return { success: true, data, error: null };
      } catch (error) {
        console.error('Signin error:', error);
        return { success: false, data: null, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [createUserProfile, trackSession]
  );

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      setLoading(true);

      // Track logout in Django (optional, non-blocking)
      const djangoSessionId = sessionStorage.getItem('djangoSessionId');
      if (user?.email) {
        trackSession('logout', user.email, djangoSessionId).catch((err) => {
          console.warn('Session tracking failed, but continuing logout:', err);
        });
      }

      // STEP 1: Sign out from Supabase FIRST (while tokens still exist)
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('⚠️ Supabase signOut error:', error);
        // Continue with cleanup even if there's an error
      }

      // STEP 2: Now clear local state
      setUser(null);
      setUserProfile(null);
      setSession(null);
      userIdRef.current = null;

      // STEP 3: Clear storage AFTER signOut
      sessionStorage.clear();
      
      // Clear all Supabase-related keys from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });

      return { error: null };
    } catch (error) {
      console.error('❌ Signout error:', error);

      // Force clear everything even on error
      setUser(null);
      setUserProfile(null);
      setSession(null);
      userIdRef.current = null;
      sessionStorage.clear();

      // Clear all storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });

      return { error };
    } finally {
      setLoading(false);
    }
  }, [user, trackSession]);

  // Update user profile
  const updateProfile = useCallback(
    async (updates) => {
      try {
        if (!user) throw new Error('No user logged in');

        const { data, error } = await supabase
          .from('app_user')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();

        if (error) throw error;

        setUserProfile(data);
        return { data, error: null };
      } catch (error) {
        console.error('Update profile error:', error);
        return { data: null, error };
      }
    },
    [user]
  );

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return (
      userProfile?.role === 'admin' || userProfile?.is_superuser || false
    );
  }, [userProfile]);

  // Get user role
  const getUserRole = useCallback(() => {
    return userProfile?.role || 'user';
  }, [userProfile]);

  // Memoize computed values
  const isAuthenticated = useMemo(() => !!user, [user]);
  const username = useMemo(
    () => userProfile?.username,
    [userProfile?.username]
  );
  const email = useMemo(() => user?.email, [user?.email]);

  const value = useMemo(
    () => ({
      user,
      userProfile,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      isAdmin,
      getUserRole,
      isAuthenticated,
      username,
      email,
    }),
    [
      user,
      userProfile,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      isAdmin,
      getUserRole,
      isAuthenticated,
      username,
      email,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};