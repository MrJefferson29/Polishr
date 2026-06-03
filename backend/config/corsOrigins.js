/**
 * Allowed browser origins for Express CORS and Socket.io.
 *
 * On Render, set:
 *   FRONTEND_URL=https://polishr-blue.vercel.app
 * or comma-separated:
 *   CORS_ALLOWED_ORIGINS=https://polishr-blue.vercel.app,https://polishr.vercel.app
 */

const STATIC_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://driv-inn.vercel.app',
  'https://polishr-blue.vercel.app',
  'https://polishr.vercel.app',
];

function parseEnvOrigins() {
  return [process.env.FRONTEND_URL, process.env.CORS_ALLOWED_ORIGINS]
    .filter(Boolean)
    .flatMap((value) => value.split(',').map((s) => s.trim()))
    .filter(Boolean);
}

function getAllowedOrigins() {
  return [...new Set([...STATIC_ORIGINS, ...parseEnvOrigins()])];
}

/** Vercel production + preview URLs for Polishr */
function isPolishrVercelHost(hostname) {
  if (!hostname || !hostname.endsWith('.vercel.app')) return false;
  return (
    hostname === 'polishr-blue.vercel.app' ||
    hostname === 'polishr.vercel.app' ||
    hostname.startsWith('polishr-') ||
    hostname.endsWith('-polishr.vercel.app') ||
    hostname.includes('polishr')
  );
}

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (getAllowedOrigins().includes(origin)) return true;
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    if (isPolishrVercelHost(hostname)) return true;
  } catch {
    return false;
  }
  return false;
}

/** Express `cors` origin callback */
function corsOriginCallback(origin, callback) {
  if (isOriginAllowed(origin)) {
    callback(null, origin || true);
  } else {
    console.warn('[CORS] Blocked origin:', origin);
    callback(null, false);
  }
}

module.exports = {
  getAllowedOrigins,
  isOriginAllowed,
  corsOriginCallback,
};
