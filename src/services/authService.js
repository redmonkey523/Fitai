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
export const saveSession = async (user, token) => {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('isAuthenticated', 'true');
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

export const loadSession = async () => {
  try {
    const user = await AsyncStorage.getItem('user');
    const token = await AsyncStorage.getItem('token');
    const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
    
    if (user && token && isAuthenticated === 'true') {
      // Verify token is still valid by getting fresh user data
      try {
        const freshUser = await getCurrentUser(token);
        return { user: freshUser, token };
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
    const token = await AsyncStorage.getItem('token');
    if (token) {
      await logout(token);
    }
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('isAuthenticated');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};
