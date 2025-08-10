import AsyncStorage from '@react-native-async-storage/async-storage';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AUTH_CONFIG } from '../config/auth';

// Mock users for development/testing
export const mockUsers = [
  {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatar: null,
    provider: 'email',
    createdAt: new Date().toISOString(),
  },
];

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
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user already exists
    const existingUser = mockUsers.find(user => user.email === email);
    if (existingUser) {
      throw new Error('Email already in use.');
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      firstName,
      lastName,
      avatar: null,
      provider: 'email',
      createdAt: new Date().toISOString(),
    };
    
    mockUsers.push(newUser);
    
    return {
      success: true,
      user: newUser,
    };
  } catch (error) {
    throw error;
  }
};

// Email/Password Login
export const loginWithEmail = async (email, password) => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find user
    const user = mockUsers.find(user => user.email === email);
    if (!user) {
      throw new Error('No account with that email.');
    }
    
    // In a real app, you'd verify the password here
    // For now, we'll just return the user
    return {
      success: true,
      user,
    };
  } catch (error) {
    throw error;
  }
};

// Session Management
export const saveSession = async (user) => {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('isAuthenticated', 'true');
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

export const loadSession = async () => {
  try {
    const user = await AsyncStorage.getItem('user');
    const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
    
    if (user && isAuthenticated === 'true') {
      return JSON.parse(user);
    }
    return null;
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
};

export const clearSession = async () => {
  try {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('isAuthenticated');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};
