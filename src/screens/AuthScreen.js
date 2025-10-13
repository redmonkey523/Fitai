import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Import components
import Button from '../components/Button';
import Card from '../components/Card';

// Import auth context
import { useAuth } from '../contexts/AuthContext';

const AuthScreen = ({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState('welcome'); // 'welcome', 'email', 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');

  // Get auth methods from context
  const { 
    handleGoogleSignInPress, 
    handleEmailSignUpPress, 
    handleEmailLoginPress, 
    isAuthenticating 
  } = useAuth();

  // Handle Email Registration
  const handleEmailSignUp = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    setFirstNameError('');
    setLastNameError('');

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      await handleEmailSignUpPress(email, password, firstName, lastName);
      // The auth context will handle the success and show toast
    } catch (error) {
      // Error handling is done in the auth context
    }
  };

  // Handle Email Login
  const handleEmailLogin = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    // Basic validation
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      await handleEmailLoginPress(email, password);
      // The auth context will handle the success and show toast
    } catch (error) {
      // Error handling is done in the auth context
    }
  };

  // Render welcome screen
  const renderWelcomeScreen = () => {
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.logoContainer}>
          <Ionicons name="fitness" size={64} color={COLORS.accent.primary} />
          <Text style={styles.appName}>FitAI</Text>
        </View>

        <Text style={styles.welcomeTitle}>Welcome to FitAI</Text>
        <Text style={styles.welcomeSubtitle}>
          Create your account to save workouts, track macros, and sync across devices.
        </Text>

        {/* Benefits List */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.accent.success} />
            <Text style={styles.benefitText}>Personalized plans & progress insights</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.accent.success} />
            <Text style={styles.benefitText}>Cloud backups across devices</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.accent.success} />
            <Text style={styles.benefitText}>One-tap sign-in with Google</Text>
          </View>
        </View>

        {/* Primary CTA */}
        <Button
          type="primary"
          label={isAuthenticating ? "Signing in..." : "Continue with Google"}
          onPress={handleGoogleSignInPress}
          disabled={isAuthenticating}
          style={styles.primaryButton}
          icon={<Ionicons name="logo-google" size={20} color={COLORS.text.primary} />}
        />

        {/* Secondary CTA */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setAuthMode('email')}
          disabled={isAuthenticating}
        >
          <Text style={styles.secondaryButtonText}>Use email instead</Text>
        </TouchableOpacity>

        {/* Login Link for existing users */}
        <TouchableOpacity
          style={styles.existingUserLink}
          onPress={() => setAuthMode('login')}
          disabled={isAuthenticating}
        >
          <Text style={styles.existingUserText}>
            Already have an account? <Text style={styles.existingUserBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>

        {/* Legal Text */}
        <Text style={styles.legalText}>
          By continuing you agree to our{' '}
          <Text style={styles.legalLink}>Terms</Text>
          {' '}and{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Text>

        <Text style={styles.googleNote}>
          Note: We'll only use your Google account to sign you in—no posts, ever.
        </Text>
      </View>
    );
  };

  // Render email sign-up screen
  const renderEmailSignUpScreen = () => {
    return (
      <View style={styles.emailContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setAuthMode('welcome')}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>

        <Text style={styles.emailTitle}>Create Account</Text>
        <Text style={styles.emailSubtitle}>
          Enter your details to get started
        </Text>

        {/* First Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>First name</Text>
          <TextInput
            style={[styles.textInput, firstNameError && styles.inputError]}
            placeholder="Enter your first name"
            placeholderTextColor={COLORS.text.tertiary}
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              setFirstNameError('');
            }}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {firstNameError ? <Text style={styles.errorText}>{firstNameError}</Text> : null}
        </View>

        {/* Last Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Last name</Text>
          <TextInput
            style={[styles.textInput, lastNameError && styles.inputError]}
            placeholder="Enter your last name"
            placeholderTextColor={COLORS.text.tertiary}
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              setLastNameError('');
            }}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {lastNameError ? <Text style={styles.errorText}>{lastNameError}</Text> : null}
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={[styles.textInput, emailError && styles.inputError]}
            placeholder="Enter your email"
            placeholderTextColor={COLORS.text.tertiary}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.textInput, styles.passwordInput, passwordError && styles.inputError]}
              placeholder="Create a password"
              placeholderTextColor={COLORS.text.tertiary}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={COLORS.text.secondary}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.passwordHint}>
            8+ characters, 1 number, 1 letter
          </Text>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        {/* Create Account Button */}
                 <Button
           type="primary"
           label={isAuthenticating ? "Creating account..." : "Create account"}
           onPress={handleEmailSignUp}
           disabled={isAuthenticating}
           style={styles.createAccountButton}
         />

        {/* Login Link */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => setAuthMode('login')}
          disabled={isAuthenticating}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={styles.loginLinkBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>

        {/* Legal Text */}
        <Text style={styles.legalText}>
          By creating an account you agree to our{' '}
          <Text style={styles.legalLink}>Terms</Text>
          {' '}and{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Text>
      </View>
    );
  };

  // Render email login screen
  const renderEmailLoginScreen = () => {
    return (
      <View style={styles.emailContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setAuthMode('welcome')}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>

        <Text style={styles.emailTitle}>Sign In</Text>
        <Text style={styles.emailSubtitle}>
          Welcome back! Sign in to your account
        </Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={[styles.textInput, emailError && styles.inputError]}
            placeholder="Enter your email"
            placeholderTextColor={COLORS.text.tertiary}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.textInput, styles.passwordInput, passwordError && styles.inputError]}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.text.tertiary}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={COLORS.text.secondary}
              />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        {/* Sign In Button */}
                 <Button
           type="primary"
           label={isAuthenticating ? "Signing in..." : "Sign in"}
           onPress={handleEmailLogin}
           disabled={isAuthenticating}
           style={styles.createAccountButton}
         />

        {/* Sign Up Link */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => setAuthMode('email')}
          disabled={isAuthenticating}
        >
          <Text style={styles.loginLinkText}>
            Don't have an account? <Text style={styles.loginLinkBold}>Create one</Text>
          </Text>
        </TouchableOpacity>

        {/* Forgot Password Link */}
        <TouchableOpacity
          style={styles.forgotPasswordLink}
          onPress={() => Alert.alert('Forgot Password', 'This would open the password reset flow.')}
          disabled={isAuthenticating}
        >
          <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[COLORS.background.secondary, COLORS.background.primary]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {authMode === 'welcome' && renderWelcomeScreen()}
          {authMode === 'email' && renderEmailSignUpScreen()}
          {authMode === 'login' && renderEmailLoginScreen()}
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SIZES.spacing.lg,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.xl,
  },
  appName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.title,
    fontWeight: FONTS.weight.black,
    marginTop: SIZES.spacing.sm,
  },
  welcomeTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxxl,
    fontWeight: FONTS.weight.bold,
    textAlign: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  welcomeSubtitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SIZES.spacing.xl,
    paddingHorizontal: SIZES.spacing.md,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: SIZES.spacing.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  benefitText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    marginLeft: SIZES.spacing.sm,
  },
  primaryButton: {
    width: '100%',
    marginBottom: SIZES.spacing.md,
  },
  secondaryButton: {
    paddingVertical: SIZES.spacing.md,
  },
  secondaryButtonText: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
  },
  legalText: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SIZES.spacing.lg,
  },
  legalLink: {
    color: COLORS.accent.primary,
    textDecorationLine: 'underline',
  },
  googleNote: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
    marginTop: SIZES.spacing.md,
    fontStyle: 'italic',
  },
  emailContainer: {
    flex: 1,
    paddingTop: SIZES.spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: SIZES.spacing.lg,
  },
  emailTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxxl,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.sm,
  },
  emailSubtitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginBottom: SIZES.spacing.xl,
  },
  inputContainer: {
    marginBottom: SIZES.spacing.lg,
  },
  inputLabel: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    marginBottom: SIZES.spacing.sm,
  },
  textInput: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.md,
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    borderWidth: 1,
    borderColor: COLORS.utility.divider,
  },
  inputError: {
    borderColor: COLORS.accent.error,
  },
  errorText: {
    color: COLORS.accent.error,
    fontSize: FONTS.size.sm,
    marginTop: SIZES.spacing.xs,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: SIZES.spacing.md,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  passwordHint: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
    marginTop: SIZES.spacing.xs,
  },
  createAccountButton: {
    width: '100%',
    marginTop: SIZES.spacing.md,
  },
  loginLink: {
    paddingVertical: SIZES.spacing.md,
    alignItems: 'center',
  },
  loginLinkText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
  },
  loginLinkBold: {
    color: COLORS.accent.primary,
    fontWeight: FONTS.weight.bold,
  },
  existingUserLink: {
    paddingVertical: SIZES.spacing.md,
    alignItems: 'center',
  },
  existingUserText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
  },
  existingUserBold: {
    color: COLORS.accent.primary,
    fontWeight: FONTS.weight.bold,
  },
  forgotPasswordLink: {
    paddingVertical: SIZES.spacing.sm,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.sm,
    textDecorationLine: 'underline',
  },
});

export default AuthScreen;
