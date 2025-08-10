import React, { createContext, useContext, useState, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { 
  initializeGoogleSignIn, 
  signInWithGoogle, 
  signOutFromGoogle,
  registerWithEmail, 
  loginWithEmail, 
  saveSession, 
  loadSession, 
  clearSession 
} from '../services/authService';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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
      const savedUser = await loadSession();
      if (savedUser) {
        setUser(savedUser);
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
        await saveSession(result.user);
        setUser(result.user);
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
        await saveSession(result.user);
        setUser(result.user);
        Toast.show({
          type: 'success',
          text1: 'Account Created!',
          text2: 'You\'re in—let\'s build your plan.',
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
        await saveSession(result.user);
        setUser(result.user);
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
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticating,
    handleGoogleSignInPress,
    handleEmailSignUpPress,
    handleEmailLoginPress,
    handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
