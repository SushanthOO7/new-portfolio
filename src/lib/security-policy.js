import { createHash } from 'node:crypto';
import { getThemeBootstrapScript } from './theme.js';

export function sha256CspHash(value) {
  const digest = createHash('sha256').update(value, 'utf8').digest('base64');
  return `'sha256-${digest}'`;
}

const THEME_BOOTSTRAP_HASH = sha256CspHash(getThemeBootstrapScript());

export function contentSecurityPolicy(additionalScriptHashes = []) {
  const scriptHashes = [...new Set([THEME_BOOTSTRAP_HASH, ...additionalScriptHashes])].sort();
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "style-src 'self'",
    "style-src-attr 'unsafe-inline'",
    `script-src 'self' ${scriptHashes.join(' ')}`,
    "connect-src 'self'",
    "media-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function inlineScriptHashes(htmlDocuments) {
  const hashes = [];
  for (const html of htmlDocuments) {
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      const [, attributes, script] = match;
      if (/\bsrc\s*=/i.test(attributes) || script.length === 0) continue;
      hashes.push(sha256CspHash(script));
    }
  }
  return [...new Set(hashes)].sort();
}

export const CONTENT_SECURITY_POLICY = contentSecurityPolicy();

export const REQUIRED_SECURITY_HEADERS = Object.freeze({
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Permitted-Cross-Domain-Policies': 'none',
});

export function securityHeadersForHtml(htmlDocuments) {
  return Object.freeze({
    ...REQUIRED_SECURITY_HEADERS,
    'Content-Security-Policy': contentSecurityPolicy(inlineScriptHashes(htmlDocuments)),
  });
}
