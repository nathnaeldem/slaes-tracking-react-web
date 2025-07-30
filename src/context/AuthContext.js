// AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios'; // Import axios directly

const AuthContext = createContext();

// Replace with your actual API base URL
const API_URL = 'https://dankula.x10.mx/auth.php'; // Make sure this is your correct API endpoint

// Create an axios instance for authentication requests
const authAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // For initial app load (checking AsyncStorage)
  const [isAuthenticating, setIsAuthenticating] = useState(false); // For ongoing login/register/reset API calls
  const [error, setError] = useState(null);

  // Load user from storage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // Set token in axios headers for this instance
          // Ensure organization_id is available if needed for default headers, though typically not for Authorization itself
          authAxios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (e) {
        console.error('Failed to load user:', e);
        // It might be good to clear potentially corrupted storage here
        // await AsyncStorage.multiRemove(['user', 'token']);
      } finally {
        setLoading(false); // Initial app load is complete
      }
    };

    loadUser();
  }, []);

  // Set axios authorization header
  const setAuthHeader = useCallback((token) => {
    if (token) {
      authAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete authAxios.defaults.headers.common['Authorization'];
    }
  }, []);

  // Login function
  const login = useCallback(async (username, password) => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const response = await authAxios.post('', { // The body for the POST request
        username,
        password
      }, {
        params: { action: 'login' } // Query parameters for the URL
      });

      // Expecting 'user' object in response.data which includes id, username, role, and organization_id
      const { user: apiUser, token } = response.data;

      if (!apiUser || !token) {
        throw new Error('Login response did not include user or token.');
      }
      // Ensure organization_id is present in the apiUser object from the server
      if (apiUser.organization_id === undefined) {
          console.warn("Organization ID is missing in the login response user object!");
          // Depending on your app's requirements, you might want to throw an error here
          // or handle it by setting a default/null value if permissible.
          // For now, we'll proceed, but this is a critical check.
      }


      // Store user data (including organization_id) and token
      await AsyncStorage.multiSet([
        ['user', JSON.stringify(apiUser)], // apiUser should now contain organization_id from the backend
        ['token', token]
      ]);

      setAuthHeader(token);
      setUser(apiUser); // Set user, which will make isAuthenticated true and include organization_id

      return true;
    } catch (e) {
      console.error('Login Error in AuthContext:', e);
      // More detailed error checking
      if (e.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Login Error Response Data:', e.response.data);
        console.error('Login Error Response Status:', e.response.status);
        setError(e.response.data?.message || `Server error: ${e.response.status}`);
      } else if (e.request) {
        // The request was made but no response was received
        console.error('Login Error Request:', e.request);
        setError('No response from server. Please check your network connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Login Error Message:', e.message);
        setError(e.message || 'Login failed. Please try again.');
      }
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [setAuthHeader]);

  // Register function (assuming organization_name is part of userData)
  const register = useCallback(async (userData) => { // userData should include { username, email, password, organization_name }
    setIsAuthenticating(true);
    setError(null);
    try {
      // The backend auth.php for register now creates an organization and links it.
      // The response is just a success message, no token or user object is returned directly on register.
      // User will have to login after successful registration.
      const response = await authAxios.post('', userData, {
        params: { action: 'register' }
      });
      // Assuming response.data contains { message: "..." }
      return { success: true, message: response.data.message };
    } catch (e) {
      console.error('Register Error in AuthContext:', e);
      if (e.response) {
        console.error('Register Error Response Data:', e.response.data);
        setError(e.response.data?.message || 'Registration failed.');
      } else if (e.request) {
        setError('No response from server during registration.');
      } else {
        setError(e.message || 'Registration failed. Please try again.');
      }
      return { success: false, message: error };
    } finally {
      setIsAuthenticating(false);
    }
  }, [error]); // Added error to dependency array

  // Reset password function
  const resetPassword = useCallback(async (email) => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const response = await authAxios.post('', { email }, {
        params: { action: 'reset' }
      });
      // Assuming response.data contains { message: "..." }
      return { success: true, message: response.data.message };
    } catch (e) {
      console.error('Reset Password Error in AuthContext:', e);
       if (e.response) {
        setError(e.response.data?.message || 'Password reset failed.');
      } else if (e.request) {
        setError('No response from server during password reset.');
      } else {
        setError(e.message || 'Password reset failed. Please try again.');
      }
      return { success: false, message: error };
    } finally {
      setIsAuthenticating(false);
    }
  }, [error]); // Added error to dependency array


  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'token']);
      setAuthHeader(null);
      setUser(null);
    } catch (e) {
      console.error('Logout failed:', e);
      // Optionally set an error state here if needed
    }
  }, [setAuthHeader]);

  return (
    <AuthContext.Provider
      value={{
        user, // This user object will now contain organization_id if login was successful
        loading,
        isAuthenticating,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        resetPassword,
        clearError: () => setError(null),
        // Expose authAxios if you want to make authenticated API calls from outside directly
        // Be cautious with this, usually, you'd create service functions.
        // authAxiosInstance: authAxios
      }}
    >
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
