// Quick script to clear expired session
// Run this if you're stuck with expired tokens

if (typeof window !== 'undefined' && window.localStorage) {
  // Web
  console.log('Clearing web session...');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
  console.log('✅ Session cleared! Refresh the page.');
} else {
  console.log('⚠️  This script is for web only.');
  console.log('On mobile: Just restart the app or run:');
  console.log('  - Shake device → Reload');
  console.log('  - Or press "R" in terminal');
}

