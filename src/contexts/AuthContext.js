import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Toast from 'react-native-toast-message';
import { 
  initializeGoogleSignIn, 
  signInWithGoogle, 
  signOutFromGoogle,
  registerWithEmail, 
  loginWithEmail, 
  saveSession, 
  loadSession, 
  clearSession,
  getCurrentUser,
  updateUserProfile
} from '../services/authService';
import { COMMERCE_ENTITLEMENTS_ENABLED } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [entitlements, setEntitlements] = useState({ pro: false, programs: [], isAdmin: false });

  // Initialize auth on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Try to initialize Google Sign-In (this may fail on some platforms)
      const googleInitialized = initializeGoogleSignIn();
      
      if (!googleInitialized) {
        console.log('Google Sign-In not available - using email authentication only');
      }
      
      // Load existing session
      const session = await loadSession();
      if (session) {
        setUser(session.user);
        setToken(session.token);
        try {
          if (COMMERCE_ENTITLEMENTS_ENABLED) {
            const api = (await import('../services/api')).default;
            const e = await api.getEntitlements();
            if (e?.success && e.data) setEntitlements(e.data);
          }
        } catch {}
      }
    } catch (error) {
      console.warn('Auth initialization error:', error.message);
      // Don't crash the app - just log the error
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignInPress = async () => {
    setIsAuthenticating(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        await saveSession(result.user, result.token);
        setUser(result.user);
        setToken(result.token);
        Toast.show({
          type: 'success',
          text1: 'Welcome!',
          text2: 'You\'re in—let\'s build your plan.',
        });
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      
      let message = 'Couldn\'t sign you in. Try again.';
      
      if (error.message.includes('not configured') || error.message.includes('not available')) {
        message = 'Google Sign-In is not available. Please use email registration instead.';
        Toast.show({
          type: 'info',
          text1: 'Google Sign-In Unavailable',
          text2: message,
        });
      } else if (error.message.includes('canceled')) {
        message = 'Google sign-in was canceled.';
        Toast.show({
          type: 'info',
          text1: 'Sign-In Canceled',
          text2: message,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Sign-In Failed',
          text2: message,
        });
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailSignUpPress = async (email, password, firstName, lastName) => {
    setIsAuthenticating(true);
    try {
      const result = await registerWithEmail(email, password, firstName, lastName);
      if (result.success) {
        await saveSession(result.user, result.token, result.refreshToken);
        setUser(result.user);
        setToken(result.token);
        Toast.show({
          type: 'success',
          text1: 'Account Created!',
          text2: 'Welcome to FitAI!',
        });
      }
    } catch (error) {
      console.error('Email registration error:', error);
      
      let message = 'Couldn\'t create your account. Try again.';
      
      if (error.message.includes('already in use')) {
        message = 'Email already in use.';
      } else if (error.message.includes('valid email')) {
        message = 'Please enter a valid email address.';
      } else if (error.message.includes('password')) {
        message = 'Please use a stronger password.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: message,
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailLoginPress = async (email, password) => {
    setIsAuthenticating(true);
    try {
      const result = await loginWithEmail(email, password);
      if (result.success) {
        await saveSession(result.user, result.token, result.refreshToken);
        setUser(result.user);
        setToken(result.token);
        try {
          if (COMMERCE_ENTITLEMENTS_ENABLED) {
            const api = (await import('../services/api')).default;
            const e = await api.getEntitlements();
            if (e?.success) setEntitlements(e.data);
          }
        } catch {}
        Toast.show({
          type: 'success',
          text1: 'Welcome Back!',
          text2: 'You\'re in—let\'s build your plan.',
        });
      }
    } catch (error) {
      console.error('Email login error:', error);
      
      let message = 'Couldn\'t sign you in. Try again.';
      
      if (error.message.includes('No account')) {
        message = 'No account with that email.';
      } else if (error.message.includes('Incorrect')) {
        message = 'Incorrect email or password.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: message,
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Sign out from Google if signed in with Google
      if (user?.provider === 'google') {
        await signOutFromGoogle();
      }
      
      // Clear local session
      await clearSession();
      setUser(null);
      setToken(null);
      
      Toast.show({
        type: 'success',
        text1: 'Signed Out',
        text2: 'You have been successfully signed out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local session even if Google sign out fails
      await clearSession();
      setUser(null);
      setToken(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const updatedUser = await updateUserProfile(token, profileData);
      setUser(updatedUser);
      
      // Update stored session
      await saveSession(updatedUser, token);
      
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been saved successfully!',
      });
      
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update profile',
      });
      throw error;
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      if (!token) {
        return null;
      }
      
      const freshUser = await getCurrentUser(token);
      setUser(freshUser);
      
      // Update stored session
      await saveSession(freshUser, token);
      try {
        if (COMMERCE_ENTITLEMENTS_ENABLED) {
          const api = (await import('../services/api')).default;
          const e = await api.getEntitlements();
          if (e?.success) setEntitlements(e.data);
        }
      } catch {}
      
      return freshUser;
    } catch (error) {
      console.error('Refresh user error:', error);
      
      // Only clear session if it's definitely an authentication error
      // Check for 401, 403, or explicit unauthorized messages
      const isAuthError = error.message.includes('401') || 
                         error.message.includes('403') || 
                         error.message.includes('Unauthorized') ||
                         error.message.includes('Token expired') ||
                         error.message.includes('Invalid token');
      
      // Handle specific error types from API
      const isServerError = error.message.includes('Server returned an unexpected response') ||
                           error.message.includes('Network error') ||
                           error.message.includes('Failed to fetch');
      
      if (isAuthError) {
        console.log('Authentication token expired or invalid, logging out user');
        await clearSession();
        setUser(null);
        setToken(null);
        Toast.show({
          type: 'info',
          text1: 'Session Expired',
          text2: 'Please log in again to continue',
        });
      } else if (isServerError) {
        console.log('Temporary server error, keeping user logged in:', error.message);
        // Don't show toast for temporary errors on background refresh
      } else {
        console.log('Temporary refresh error, keeping user logged in:', error.message);
      }
      return null;
    }
  }, [token]);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticating,
    handleGoogleSignInPress,
    handleEmailSignUpPress,
    handleEmailLoginPress,
    handleLogout,
    updateProfile,
    refreshUser,
    entitlements,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
