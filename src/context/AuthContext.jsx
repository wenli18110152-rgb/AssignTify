import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('assigntify_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // Login function
  const login = (email, password) => {
    // Simple validation - in real app this would be API call
    const users = JSON.parse(localStorage.getItem('assigntify_users') || '[]');
    const existingUser = users.find(u => u.email === email && u.password === password);
    
    if (existingUser) {
      const userData = { email: existingUser.email, name: existingUser.name || email.split('@')[0] };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('assigntify_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  // Register function
  const register = (email, password, confirmPassword) => {
    // Validation
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

    // Check if user exists
    const users = JSON.parse(localStorage.getItem('assigntify_users') || '[]');
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }

    // Save new user
    const newUser = { email, password, name: email.split('@')[0] };
    users.push(newUser);
    localStorage.setItem('assigntify_users', JSON.stringify(users));

    // Auto login after registration
    const userData = { email: newUser.email, name: newUser.name };
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('assigntify_user', JSON.stringify(userData));

    return { success: true };
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('assigntify_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
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