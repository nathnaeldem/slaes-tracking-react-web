import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] Initializing auth state');
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('userData');
    
    if (storedToken && storedUser) {
      console.log('[Auth] Found existing credentials');
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setTimeout(() => setAppLoading(false), 500); // Ensure state propagation
    } else {
      console.log('[Auth] No stored credentials');
      setAppLoading(false);
    }
  }, []);

  // src/AuthContext.js

  const login = async ({ username, password, role }) => { // Destructure parameters here
    console.log('[Auth] Login initiated');
    try {
      const res = await fetch('/auths.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }) // Now these variables are correctly defined
      });
      
      const data = await res.json();
      console.log('Login API response:', data); // Debugging
      
      if (!res.ok || !data.token) {
        // Handle API error messages
        const errorMessage = data.message || 'Login failed';
        console.error('Login failed:', res.status, errorMessage);
        return { success: false, message: errorMessage };
      }
  
      // Verify response structure
      if (!data.token || !data.user) {
        console.error('Invalid API response structure:', data);
        return { success: false, message: 'Invalid server response' };
      }
  
      console.log('[Auth] Login successful, updating state');
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      // Batch state updates
      React.startTransition(() => {
        setToken(data.token);
        setUser(data.user);
      });
      
      return { success: true };
    } catch (err) {
      console.error('[Auth] Login error:', err);
      return { success: false, message: err.message };
    }
  };

  function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      appLoading,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}