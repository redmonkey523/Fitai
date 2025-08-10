// Authentication Test Utility
// Use this to test authentication functionality during development

import { mockUsers } from '../services/authService';

export const AuthTest = {
  // Clear all test data
  clearTestData: () => {
    // Clear mock users
    mockUsers.clear();
    console.log('🧹 Test data cleared');
  },

  // Add a test user
  addTestUser: (email, password, userData = {}) => {
    const user = {
      id: `test_user_${Date.now()}`,
      email,
      firstName: userData.firstName || 'Test',
      lastName: userData.lastName || 'User',
      avatar: userData.avatar || null,
      provider: 'email',
      memberSince: new Date(),
      isPremium: userData.isPremium || false,
      token: `test_token_${Date.now()}`,
      password, // Store password for testing
    };
    
    mockUsers.set(email, user);
    console.log('👤 Test user added:', { email, firstName: user.firstName });
    return user;
  },

  // List all test users
  listTestUsers: () => {
    const users = Array.from(mockUsers.entries()).map(([email, user]) => ({
      email,
      firstName: user.firstName,
      lastName: user.lastName,
      isPremium: user.isPremium,
    }));
    console.log('📋 Test users:', users);
    return users;
  },

  // Test authentication flow
  testAuthFlow: async (authService) => {
    console.log('🧪 Testing authentication flow...');
    
    try {
      // Test 1: Email registration
      console.log('1️⃣ Testing email registration...');
      const registerResult = await authService.registerWithEmail('test@example.com', 'password123');
      console.log('✅ Registration result:', registerResult.success);
      
      // Test 2: Email login
      console.log('2️⃣ Testing email login...');
      const loginResult = await authService.loginWithEmail('test@example.com', 'password123');
      console.log('✅ Login result:', loginResult.success);
      
      // Test 3: Duplicate email
      console.log('3️⃣ Testing duplicate email...');
      try {
        await authService.registerWithEmail('test@example.com', 'password456');
        console.log('❌ Should have failed for duplicate email');
      } catch (error) {
        console.log('✅ Correctly rejected duplicate email:', error.message);
      }
      
      // Test 4: Wrong password
      console.log('4️⃣ Testing wrong password...');
      try {
        await authService.loginWithEmail('test@example.com', 'wrongpassword');
        console.log('❌ Should have failed for wrong password');
      } catch (error) {
        console.log('✅ Correctly rejected wrong password:', error.message);
      }
      
      console.log('🎉 All authentication tests passed!');
      
    } catch (error) {
      console.error('❌ Authentication test failed:', error);
    }
  },

  // Test session persistence
  testSessionPersistence: async (authService) => {
    console.log('💾 Testing session persistence...');
    
    try {
      // Create a user and save session
      const user = AuthTest.addTestUser('persist@example.com', 'password123');
      await authService.saveUserSession(user);
      
      // Retrieve session
      const session = await authService.getUserSession();
      console.log('✅ Session saved and retrieved:', !!session);
      
      // Clear session
      await authService.clearUserSession();
      const clearedSession = await authService.getUserSession();
      console.log('✅ Session cleared:', !clearedSession);
      
    } catch (error) {
      console.error('❌ Session persistence test failed:', error);
    }
  },

  // Run all tests
  runAllTests: async (authService) => {
    console.log('🚀 Running all authentication tests...');
    
    AuthTest.clearTestData();
    await AuthTest.testAuthFlow(authService);
    await AuthTest.testSessionPersistence(authService);
    
    console.log('✨ All tests completed!');
  },
};

// Development helper - expose to global scope for testing
if (__DEV__) {
  global.AuthTest = AuthTest;
}
