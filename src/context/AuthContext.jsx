import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper: extract a safe user object from Supabase session
  // Email is always normalized to lowercase for consistent lookups.
  const buildUser = (session) => {
    if (!session?.user) return null;
    const email = session.user.email.toLowerCase();
    return {
      id: session.user.id,
      email,
      name: email.split('@')[0]
    };
  };

  // On mount: restore session and listen for auth state changes
  useEffect(() => {
    // Get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const userData = buildUser(session);
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      }
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const userData = buildUser(session);
        setUser(userData);
        setIsAuthenticated(!!userData);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  // Register function
  const register = async (email, password, confirmPassword) => {
    // Client-side validation
    if (!email || !password) {
      return { success: false, error: 'Please fill in all fields' };
    }
    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    if (!email.includes('@')) {
      return { success: false, error: 'Please enter a valid email' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If Supabase returns a session, user is auto-logged in
      // If email confirmation is enabled, session will be null and user must confirm
      if (data.session) {
        return { success: true };
      }

      return {
        success: true,
        message: 'Registration successful. Please check your email to confirm your account.'
      };
    } catch (err) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  // Logout function
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};