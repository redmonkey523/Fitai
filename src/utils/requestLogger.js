/**
 * Request/Response logging utility for development
 */

const isDev = __DEV__;

/**
 * Log API request
 */
export function logRequest(method, url, data) {
  if (!isDev) return;

  const timestamp = new Date().toLocaleTimeString();
  console.group(`🌐 [${timestamp}] ${method.toUpperCase()} ${url}`);
  if (data) {
    console.log('📤 Request Data:', data);
  }
  console.groupEnd();
}

/**
 * Log API response
 */
export function logResponse(method, url, response, duration) {
  if (!isDev) return;

  const timestamp = new Date().toLocaleTimeString();
  const emoji = response.ok || response.status < 400 ? '✅' : '❌';
  
  console.group(`${emoji} [${timestamp}] ${method.toUpperCase()} ${url} (${duration}ms)`);
  console.log('📊 Status:', response.status, response.statusText || '');
  if (response.data) {
    console.log('📥 Response Data:', response.data);
  }
  console.groupEnd();
}

/**
 * Log API error
 */
export function logError(method, url, error, duration) {
  if (!isDev) return;

  const timestamp = new Date().toLocaleTimeString();
  console.group(`❌ [${timestamp}] ${method.toUpperCase()} ${url} (${duration}ms)`);
  console.error('Error:', error.message || error);
  if (error.response) {
    console.error('Response:', error.response.status, error.response.data);
  }
  console.groupEnd();
}

/**
 * Create a fetch wrapper with logging
 */
export function createLoggedFetch(originalFetch = fetch) {
  return async (url, options = {}) => {
    const method = options.method || 'GET';
    const startTime = Date.now();

    // Log request
    logRequest(method, url, options.body);

    try {
      const response = await originalFetch(url, options);
      const duration = Date.now() - startTime;

      // Clone response to read body without consuming it
      const clonedResponse = response.clone();
      let data;
      try {
        const contentType = clonedResponse.headers.get('content-type') || '';
        const text = await clonedResponse.text();
        // Only parse if content-type indicates JSON
        if (contentType.includes('application/json') && text) {
          data = JSON.parse(text);
        }
      } catch {
        // Not JSON or parse error - ignore for logging
      }

      // Log response
      logResponse(method, url, { ...response, data }, duration);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(method, url, error, duration);
      throw error;
    }
  };
}

