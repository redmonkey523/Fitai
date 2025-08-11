let SecureStore;
try {
  SecureStore = require('expo-secure-store');
} catch {}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// Initialize Google Sign-In with error handling
export const initializeGoogleSignIn = () => {
  // Temporarily disabled to prevent native module errors
  console.log('Google Sign-In temporarily disabled for mobile compatibility');
  return false;
};

// Sign in with Google
export const signInWithGoogle = async () => {
  throw new Error('Google Sign-In is temporarily disabled. Please use email registration instead.');
};

// Sign out from Google
export const signOutFromGoogle = async () => {
  // No-op since Google Sign-In is disabled
};

// Email/Password Registration
export const registerWithEmail = async (email, password, firstName, lastName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/test-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return {
      success: true,
      user: data.data.user,
      token: data.data.token,
      refreshToken: data.data.refreshToken,
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Email/Password Login
export const loginWithEmail = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return {
      success: true,
      user: data.data.user,
      token: data.data.token,
      refreshToken: data.data.refreshToken,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Get current user profile
export const getCurrentUser = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user profile');
    }

    return data.data.user;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (token, profileData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    return data.data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

// Logout
export const logout = async (token) => {
  try {
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Don't throw error - we still want to clear local session
  }
};

// Session Management
export const saveSession = async (user, token, refreshToken) => {
  try {
    const save = async (k, v) => {
      if (SecureStore?.setItemAsync) return SecureStore.setItemAsync(k, v);
      return AsyncStorage.setItem(k, v);
    };
    await save('user', JSON.stringify(user));
    await save('token', token);
    if (refreshToken) await save('refreshToken', refreshToken);
    await save('isAuthenticated', 'true');
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

export const loadSession = async () => {
  try {
    const get = async (k) => (SecureStore?.getItemAsync ? SecureStore.getItemAsync(k) : AsyncStorage.getItem(k));
    const user = await get('user');
    const token = await get('token');
    const refreshToken = await get('refreshToken');
    const isAuthenticated = await get('isAuthenticated');
    
    if (user && token && isAuthenticated === 'true') {
      // Verify token is still valid by getting fresh user data
      try {
        const freshUser = await getCurrentUser(token);
        return { user: freshUser, token, refreshToken };
      } catch (error) {
        // Token is invalid, clear session
        await clearSession();
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
};

export const clearSession = async () => {
  try {
    const get = async (k) => (SecureStore?.getItemAsync ? SecureStore.getItemAsync(k) : AsyncStorage.getItem(k));
    const remove = async (k) => (SecureStore?.deleteItemAsync ? SecureStore.deleteItemAsync(k) : AsyncStorage.removeItem(k));
    const token = await get('token');
    if (token) {
      await logout(token);
    }
    await remove('user');
    await remove('token');
    await remove('refreshToken');
    await remove('isAuthenticated');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

export const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to refresh token');
    }
    return { token: data.data.token, refreshToken: data.data.refreshToken };
  } catch (error) {
    console.error('Refresh token error:', error);
    throw error;
  }
};
