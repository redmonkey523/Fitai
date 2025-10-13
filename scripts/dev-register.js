#!/usr/bin/env node

const axios = require('axios');

async function main() {
  const base = process.env.API_BASE_URL || process.env.EXPO_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
  const api = `${base}/api`;
  console.log('Testing registration against:', api);

  // Health
  try {
    const h = await axios.get(`${base}/health`, { timeout: 5000 });
    console.log('Health:', h.status, h.data.status);
  } catch (e) {
    console.log('Health check failed:', e.response?.status, e.message);
  }

  const ts = Date.now();
  const email = `test${ts}@example.com`;
  const fullPayload = {
    email,
    username: `test${ts}`,
    password: 'Password123',
    firstName: 'Test',
    lastName: 'User',
    dateOfBirth: '1990-01-01',
    gender: 'prefer_not_to_say',
    height: { value: 170, unit: 'cm' },
    weight: { value: 70, unit: 'kg' }
  };

  // Try strict register
  try {
    const r = await axios.post(`${api}/auth/register`, fullPayload, { timeout: 10000 });
    console.log('Register (strict) OK:', r.status, !!r.data?.data?.token);
  } catch (e) {
    console.log('Register (strict) failed:', e.response?.status, e.response?.data || e.message);
  }

  // Try test-register fallback
  try {
    const r2 = await axios.post(`${api}/auth/test-register`, {
      email,
      password: 'Password123',
      firstName: 'Test',
      lastName: 'User'
    }, { timeout: 10000 });
    console.log('Register (test-register) OK:', r2.status, !!r2.data?.data?.token);
  } catch (e) {
    console.log('Register (test-register) failed:', e.response?.status, e.response?.data || e.message);
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});


