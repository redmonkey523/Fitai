import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import crashReporting from '../services/crashReporting';
import analyticsService from '../services/analytics';

/**
 * Enhanced ErrorBoundary with stack-specific context
 * 
 * @param {string} fallbackRoute - Route to navigate to on error (optional)
 * @param {string} stackName - Name of the stack for context (optional)
 * @param {function} onError - Callback when error occurs (optional)
 * @param {Object} navigation - Navigation object to navigate within stack (optional)
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    const { stackName = 'App', onError } = this.props;
    console.error(`[ErrorBoundary ${stackName}] caught an error:`, error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report to crash reporting services
    try {
      crashReporting.logError(error, {
        stackName,
        componentStack: errorInfo.componentStack,
        source: 'ErrorBoundary',
      });
      
      analyticsService.logError(
        'error_boundary_catch',
        error.message || 'Unknown error',
        stackName
      );
    } catch (reportError) {
      console.error('[ErrorBoundary] Failed to report error:', reportError);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    const { stackName = 'App' } = this.props;
    console.log(`[ErrorBoundary ${stackName}] Retrying...`);
    
    crashReporting.addBreadcrumb({
      message: 'User clicked retry in ErrorBoundary',
      category: 'ui',
      data: { stackName },
    });
    
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Call retry callback if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleGoBack = () => {
    const { fallbackRoute, stackName = 'App', navigation } = this.props;
    console.log(`[ErrorBoundary ${stackName}] Going back/home...`);
    
    crashReporting.addBreadcrumb({
      message: 'User navigated away from error',
      category: 'ui',
      data: { stackName, fallbackRoute },
    });
    
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Priority 1: Use navigation from props (passed from parent)
    if (navigation) {
      if (navigation.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
      } else if (fallbackRoute) {
        navigation.navigate(fallbackRoute);
      }
      return;
    }
    
    // Priority 2: Try to get navigation from children props
    const childNav = this.props.children?.props?.navigation;
    if (childNav) {
      if (childNav.canGoBack && childNav.canGoBack()) {
        childNav.goBack();
      } else if (fallbackRoute) {
        childNav.navigate(fallbackRoute);
      }
    }
  };

  render() {
    if (this.state.hasError) {
      const { stackName = 'App', fallbackRoute, customMessage } = this.props;
      
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={64} color={COLORS.accent.error} />
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorMessage}>
              {customMessage || `Don't worry, this is just a temporary glitch in the ${stackName}. We're working to fix it.`}
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info (Development):</Text>
                <Text style={styles.debugText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
                <Ionicons name="refresh" size={20} color={COLORS.text.primary} />
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.homeButton} onPress={this.handleGoBack}>
                <Ionicons name="arrow-back" size={20} color={COLORS.accent.primary} />
                <Text style={styles.homeText}>
                  {fallbackRoute ? 'Go Back' : 'Go to Home'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing.lg,
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: 400,
  },
  errorTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginTop: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SIZES.spacing.xl,
  },
  debugContainer: {
    backgroundColor: COLORS.background.secondary,
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    marginBottom: SIZES.spacing.lg,
    width: '100%',
  },
  debugTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.accent.error,
    marginBottom: SIZES.spacing.sm,
  },
  debugText: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  buttonContainer: {
    gap: SIZES.spacing.md,
    alignItems: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    minHeight: 44, // Accessibility touch target
  },
  retryText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.background.primary,
    marginLeft: SIZES.spacing.sm,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.accent.primary,
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    minHeight: 44, // Accessibility touch target
  },
  homeText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.accent.primary,
    marginLeft: SIZES.spacing.sm,
  },
});

export default ErrorBoundary;
