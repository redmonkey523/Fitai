let SecureStore;
try {
  SecureStore = require('expo-secure-store');
} catch {}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import apiService from './api';

// Initialize Google Sign-In (gracefully disabled - no native modules required)
export const initializeGoogleSignIn = () => {
  try {
    console.log('Google Sign-In not configured - using email authentication only');
    return false;
  } catch (error) {
    console.warn('Google Sign-In initialization failed:', error.message);
    console.log('Google Sign-In not available - using email authentication only');
    return false;
  }
};

// Sign in with Google using expo-auth-session (Expo-compatible, no native modules)
export const signInWithGoogle = async () => {
  // For now, gracefully inform users that Google Sign-In is not configured
  // This prevents the native module crash while keeping the app functional
  throw new Error('Google Sign-In is not available. Please use email sign-in instead.');
  
  /* 
  // Production implementation with expo-auth-session (uncomment when configured):
  // 
  // NOTE: This requires:
  // 1. Google OAuth Client ID configured in Google Cloud Console
  // 2. Backend endpoint /auth/google to verify tokens
  // 3. Redirect URI registered with Google
  //
  try {
    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
    };

    const authRequest = new AuthSession.AuthRequest({
      clientId: GOOGLE_OAUTH_CONFIG.clientId,
      scopes: GOOGLE_OAUTH_CONFIG.scopes,
      redirectUri: GOOGLE_OAUTH_CONFIG.redirectUri,
      responseType: AuthSession.ResponseType.Token,
    });

    await authRequest.makeAuthUrlAsync(discovery);
    const result = await authRequest.promptAsync(discovery);
    
    if (result.type === 'success') {
      const { authentication } = result;
      
      // Exchange token with backend
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: authentication.idToken,
          accessToken: authentication.accessToken,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Google sign-in failed');
      }
      
      return {
        success: true,
        user: data.data.user,
        token: data.data.token,
        refreshToken: data.data.refreshToken,
      };
    } else if (result.type === 'cancel') {
      throw new Error('Google sign-in was canceled');
    } else {
      throw new Error('Google sign-in failed');
    }
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
  */
};

// Sign out from Google (no-op since we're using email auth)
export const signOutFromGoogle = async () => {
  // No action needed for email-based auth
  // If Google OAuth is configured, this would revoke tokens
  console.log('Sign-Out: No Google session to clear');
};

// Email/Password Registration
export const registerWithEmail = async (email, password, firstName, lastName) => {
  try {
    // Prefer full register if backend supports it; fallback to test-register for minimal fields
    const payload = {
      email,
      password,
      firstName: firstName || 'New',
      lastName: lastName || 'User',
    };

    // Try strict register first using ApiService
    let data;
    try {
      data = await apiService.makeRequest('/auth/register', {
        method: 'POST',
        body: payload,
        includeAuth: false,
        silent: true,
      });
    } catch (error) {
      // Fallback to test-register for MVP
      data = await apiService.makeRequest('/auth/test-register', {
        method: 'POST',
        body: payload,
        includeAuth: false,
      });
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
    const data = await apiService.makeRequest('/auth/login', {
      method: 'POST',
      body: {
        email,
        password,
      },
      includeAuth: false,
    });

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

// Get current user profile with robust error handling
export const getCurrentUser = async (token) => {
  try {
    // Temporarily store token in ApiService if provided
    const originalGetToken = apiService.getAuthToken;
    if (token) {
      apiService.getAuthToken = async () => token;
    }
    
    try {
      const data = await apiService.makeRequest('/auth/me', {
        method: 'GET',
      });
      return data.data.user;
    } finally {
      // Restore original getAuthToken
      apiService.getAuthToken = originalGetToken;
    }
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

// Update user profile with robust error handling
export const updateUserProfile = async (token, profileData) => {
  try {
    // Temporarily store token in ApiService if provided
    const originalGetToken = apiService.getAuthToken;
    if (token) {
      apiService.getAuthToken = async () => token;
    }
    
    try {
      const data = await apiService.makeRequest('/users/profile', {
        method: 'PUT',
        body: profileData,
      });
      return data.data;
    } finally {
      // Restore original getAuthToken
      apiService.getAuthToken = originalGetToken;
    }
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

// Logout
export const logout = async (token) => {
  try {
    if (token) {
      // Temporarily store token in ApiService if provided
      const originalGetToken = apiService.getAuthToken;
      apiService.getAuthToken = async () => token;
      
      try {
        await apiService.makeRequest('/auth/logout', {
          method: 'POST',
          silent: true,
        });
      } finally {
        // Restore original getAuthToken
        apiService.getAuthToken = originalGetToken;
      }
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
      // 1) AsyncStorage / SecureStore (native & fallback)
      try {
        if (SecureStore?.setItemAsync) {
          await SecureStore.setItemAsync(k, v);
        } else {
          await AsyncStorage.setItem(k, v);
        }
      } catch (err) {
        console.warn('AsyncStorage/SecureStore save failed, continuing:', err?.message);
      }
      // 2) Always update localStorage for web reliability
      if (typeof window !== 'undefined' && window.localStorage) {
        try { window.localStorage.setItem(k, v); } catch {}
      }
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
    const get = async (k) => {
      try {
        if (SecureStore?.getItemAsync) return SecureStore.getItemAsync(k);
        return await AsyncStorage.getItem(k);
      } catch {
        if (typeof window !== 'undefined' && window.localStorage) return window.localStorage.getItem(k);
        return null;
      }
    };
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
    const get = async (k) => {
      try {
        if (SecureStore?.getItemAsync) return SecureStore.getItemAsync(k);
        return await AsyncStorage.getItem(k);
      } catch {
        if (typeof window !== 'undefined' && window.localStorage) return window.localStorage.getItem(k);
        return null;
      }
    };
    const remove = async (k) => {
      try {
        if (SecureStore?.deleteItemAsync) return SecureStore.deleteItemAsync(k);
        await AsyncStorage.removeItem(k);
      } catch {
        if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem(k);
      }
    };
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
    const data = await apiService.makeRequest('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      includeAuth: false,
    });
    return { token: data.data.token, refreshToken: data.data.refreshToken };
  } catch (error) {
    console.error('Refresh token error:', error);
    throw error;
  }
};
