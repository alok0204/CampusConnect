import assert from 'assert';
import app, { isOriginAllowed, getProductionAllowedOrigins } from '../server.js';

const BASE_URL = 'http://localhost:5000/api';

async function runPhaseDTests() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🛡️ CAMPUS CONNECT — PHASE D: RATE LIMITING & CORS HARDENING 🛡️');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    // 1. Verify Proxy Trust Setting
    console.log('🔹 [1/4] Verifying Express Proxy Trust Setting for Render...');
    const trustProxySetting = app.get('trust proxy');
    assert.strictEqual(
      trustProxySetting,
      1,
      `Expected app.get('trust proxy') to equal 1 (1 reverse proxy hop), got ${trustProxySetting}`
    );
    console.log('  ✅ Verified: app.get(\'trust proxy\') === 1 (narrowest safe single-hop configuration for Render)');

    // 2. Unit Testing CORS Logic (Production & Development)
    console.log('\n🔹 [2/4] Verifying CORS Origin Filtering & Normalization...');

    // A. Production Mode Checks
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = 'https://campusconnect.vercel.app, https://preview-campusconnect.vercel.app/';

    // Configured origin 1 (exact)
    assert.strictEqual(isOriginAllowed('https://campusconnect.vercel.app'), true);
    // Configured origin 1 with trailing slash
    assert.strictEqual(isOriginAllowed('https://campusconnect.vercel.app/'), true);
    // Configured origin 2 (whitespace & trailing slash trimmed)
    assert.strictEqual(isOriginAllowed('https://preview-campusconnect.vercel.app'), true);
    assert.strictEqual(isOriginAllowed('https://preview-campusconnect.vercel.app/'), true);

    // Untrusted external origin
    assert.strictEqual(isOriginAllowed('https://malicious-site.com'), false);
    // Untrusted random Vercel preview domain (ensure wildcards do not match)
    assert.strictEqual(isOriginAllowed('https://random-unauthorized.vercel.app'), false);
    // Localhost in production when not in CLIENT_URL
    assert.strictEqual(isOriginAllowed('http://localhost:5173'), false);
    // No origin (server-to-server, health check, curl)
    assert.strictEqual(isOriginAllowed(undefined), true);
    assert.strictEqual(isOriginAllowed(''), true);

    console.log('  ✅ Production CORS verified: Strictly accepts configured CLIENT_URL origins');
    console.log('  ✅ Production CORS verified: Strictly blocks arbitrary domains & untrusted Vercel previews');
    console.log('  ✅ Production CORS verified: Trailing slashes normalized');
    console.log('  ✅ Production CORS verified: Non-browser requests (no origin) allowed');

    // B. Development Mode Checks
    process.env.NODE_ENV = 'development';
    assert.strictEqual(isOriginAllowed('http://localhost:5173'), true);
    assert.strictEqual(isOriginAllowed('http://127.0.0.1:5173'), true);
    assert.strictEqual(isOriginAllowed('http://localhost:3000'), true);
    assert.strictEqual(isOriginAllowed('http://192.168.1.45:5173'), true);
    assert.strictEqual(isOriginAllowed('http://10.0.0.5:5173'), true);

    console.log('  ✅ Development CORS verified: Supports local Vite dev server and mobile LAN IPs');

    // C. Live HTTP CORS Request Check against running server
    const corsDevRes = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      headers: { Origin: 'http://localhost:5173' },
    });
    assert.strictEqual(corsDevRes.status, 200);
    assert.strictEqual(corsDevRes.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    console.log('  ✅ Live HTTP CORS verified: Allowed origin received matching Access-Control-Allow-Origin header');

    // 3. Testing Rate Limiting on Login Endpoint (HTTP 429)
    console.log('\n🔹 [3/4] Testing Login Rate Limiting (10 req/15 min limit)...');

    // We send requests sequentially from an isolated client identity or direct IP to test limit breach
    let rateLimitTriggered = false;
    let rateLimitResponseData = null;

    // Use a unique client IP header simulated via X-Forwarded-For since trust proxy = 1
    const testClientIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;

    for (let i = 1; i <= 12; i++) {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': testClientIp,
        },
        body: JSON.stringify({
          identifier: 'nonexistent@campus.edu',
          password: 'WrongPassword123!',
        }),
      });

      if (res.status === 429) {
        rateLimitTriggered = true;
        rateLimitResponseData = await res.json();
        console.log(`  🛡️ Attempt ${i}: Rate limiter engaged with HTTP 429 Too Many Requests`);
        break;
      }
    }

    assert.ok(rateLimitTriggered, 'Rate limiter failed to trigger 429 after 10 requests');
    assert.strictEqual(rateLimitResponseData.success, false);
    assert.ok(
      rateLimitResponseData.message.includes('Too many authentication attempts'),
      `Unexpected rate limit message: ${rateLimitResponseData.message}`
    );
    console.log(`  ✅ Rate limit error message verified: "${rateLimitResponseData.message}"`);

    // 4. Testing Rate Limiting on Forgot Password Endpoint
    console.log('\n🔹 [4/4] Testing Forgot Password Rate Limiting...');
    const forgotTestIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
    let forgotRateLimitTriggered = false;

    for (let i = 1; i <= 12; i++) {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': forgotTestIp,
        },
        body: JSON.stringify({
          email: 'student@campus.edu',
        }),
      });

      if (res.status === 429) {
        forgotRateLimitTriggered = true;
        break;
      }
    }

    assert.ok(forgotRateLimitTriggered, 'Forgot password rate limiter failed to trigger 429');
    console.log('  ✅ Forgot-password endpoint successfully protected by rate limiter (HTTP 429)');

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('🎉 ALL PHASE D RATE LIMITING & CORS CHECKS PASSED 100%! 🎉');
    console.log('════════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Phase D Tests Failed:', error.stack || error);
    process.exit(1);
  }
}

runPhaseDTests();
