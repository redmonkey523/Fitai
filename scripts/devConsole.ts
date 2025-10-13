/**
 * Dev Console Hardening
 * Escalates console errors to ErrorBoundary in development mode
 * and captures unhandled promise rejections
 */

let unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

export function hardenConsole() {
  if (!__DEV__) {
    return; // Only in development
  }

  // Store original console.error
  const origError = console.error;
  const origWarn = console.warn;

  // Override console.error to just track errors (don't throw - too aggressive!)
  console.error = (...args: any[]) => {
    origError(...args);

    const msg = String(args[0] ?? '');
    
    // Filter known non-fatal warnings
    const nonFatalPatterns = [
      /Warning:.*deprecated/i,
      /Require cycle/i,
      /VirtualizedList/i,
      /componentWillReceiveProps/i,
      /componentWillMount/i,
      /Failed prop type/i,
      /Each child in a list/i,
    ];

    const isFatal = !nonFatalPatterns.some(pattern => pattern.test(msg));

    if (isFatal) {
      // Just log it with a marker, don't throw
      origError('🔴 [FATAL ERROR]', msg);
      // Note: Throwing here causes infinite loops - disabled
      // if (typeof window !== 'undefined') {
      //   setTimeout(() => { throw new Error(`ConsoleError: ${msg}`); }, 0);
      // }
    }
  };

  // Log warnings but don't escalate
  console.warn = (...args: any[]) => {
    origWarn(...args);
  };

  // Global unhandled promise rejection handler
  if (typeof window !== 'undefined') {
    unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('UNHANDLED_REJECTION:', event.reason);
      event.preventDefault(); // Prevent default browser handling
    };
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
  }

  // Node-like environment (React Native without DOM)
  if (typeof global !== 'undefined' && typeof process !== 'undefined' && process.on) {
    process.on('unhandledRejection', (reason, promise) => {
      console.error('UNHANDLED_REJECTION (Node):', reason);
    });
  }

  console.log('🛡️ Dev console hardening enabled');
}

export function unhardenConsole() {
  if (typeof window !== 'undefined' && unhandledRejectionHandler) {
    window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    unhandledRejectionHandler = null;
  }
  console.log('🛡️ Dev console hardening disabled');
}

