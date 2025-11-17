/**
 * Frontend Debugging Utilities
 * Run this in browser console to diagnose auth issues
 */

// 1. Check localStorage
window.debug = {
  // Check auth storage in localStorage
  checkStorage: () => {
    const authStorage = localStorage.getItem('auth-storage');
    console.log('=== Auth Storage ===');
    console.log('Raw:', authStorage);
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        console.log('Parsed:', parsed);
        console.log('Token:', parsed.state?.token || parsed.token);
      } catch (e) {
        console.error('Failed to parse:', e);
      }
    } else {
      console.log('No auth storage found');
    }
  },

  // Check current auth state from Zustand
  checkAuthState: () => {
    // This requires the authStore to be available
    console.log('=== Auth Store State ===');
    // You'll need to import and access useAuthStore in your component
    console.log('Check browser devtools Network tab for Authorization headers');
  },

  // Make a test request to auth/verify
  testAuthVerify: async () => {
    console.log('=== Testing /api/auth/verify ===');
    try {
      const authStorage = localStorage.getItem('auth-storage');
      let token = null;

      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        token = parsed.state?.token || parsed.token;
      }

      console.log('Token found:', !!token);
      console.log('Token:', token ? token.substring(0, 20) + '...' : 'none');

      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      return { status: response.status, data };
    } catch (error) {
      console.error('Error:', error);
      return { error };
    }
  },

  // Check backend connectivity
  testBackendHealth: async () => {
    console.log('=== Testing Backend Health ===');
    try {
      const response = await fetch('http://localhost:5001/api/ai/models');
      const data = await response.json();
      console.log('Backend status: Connected ✅');
      console.log('Current model:', data.data?.currentModel);
      return { connected: true, model: data.data?.currentModel };
    } catch (error) {
      console.log('Backend status: Not connected ❌');
      console.error('Error:', error);
      return { connected: false, error };
    }
  },

  // Clear auth and force re-login
  clearAuthAndReload: () => {
    console.log('Clearing auth storage...');
    localStorage.removeItem('auth-storage');
    window.location.href = '/login';
  },

  // Full diagnosis
  fullDiagnosis: async () => {
    console.log('=== FULL DIAGNOSIS ===\n');

    console.log('1️⃣ Checking localStorage...');
    this.checkStorage();

    console.log('\n2️⃣ Testing backend connectivity...');
    const backendHealth = await this.testBackendHealth();

    console.log('\n3️⃣ Testing auth/verify endpoint...');
    const authTest = await this.testAuthVerify();

    console.log('\n=== SUMMARY ===');
    console.log('Backend connected:', backendHealth.connected ? '✅' : '❌');
    console.log('Auth verify status:', authTest.status);
    console.log('Auth verify success:', authTest.data?.success ? '✅' : '❌');

    if (!authTest.data?.success) {
      console.log('\n⚠️ Issues found:');
      if (authTest.status === 401) {
        console.log('- Token is missing or invalid (401)');
      } else if (authTest.status === 403) {
        console.log('- Token verification failed (403)');
        console.log('- This usually means the token is malformed or JWT_SECRET mismatch');
      }
      console.log('\nSuggestion: Run window.debug.clearAuthAndReload() to clear auth and re-login');
    }
  },
};

console.log('🔧 Debug utilities loaded!');
console.log('Run:');
console.log('  window.debug.fullDiagnosis()  - Full diagnosis');
console.log('  window.debug.checkStorage()    - Check localStorage');
console.log('  window.debug.testAuthVerify()  - Test auth endpoint');
console.log('  window.debug.testBackendHealth() - Check backend');
console.log('  window.debug.clearAuthAndReload() - Clear auth and reload');
