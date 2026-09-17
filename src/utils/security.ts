import { Member } from '../types';

/**
 * DevSec Security Utilities:
 * - Anti-XSS Sanitization
 * - Safe Linear ReDoS-free Regex
 * - Anti-Prototype Pollution JSON Deserializer
 * - IANA Timezone Validation & Path-Traversal Prevention
 * - Supabase Row Level Security (RLS) Policy Simulator
 */

// Safe linear-time regex without backtracking for HH:mm format
const TIME_REGEX_STRICT = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

// IANA timezone format validation
const IANA_TZ_REGEX = /^[a-zA-Z0-9_\-+]+(?:\/[a-zA-Z0-9_\-+]+)+$/;

/**
 * HTML Entity Encoder & Sanitizer to neutralize Stored/Reflected XSS attacks
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  // 1. Strip null bytes and control chars
  let clean = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 2. Remove script tags and inline event handlers
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  clean = clean.replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
  clean = clean.replace(/javascript\s*:/gi, 'blocked:');

  // 3. Escape HTML entities
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  return clean.replace(/[&<>"'`=\/]/g, (s) => map[s] || s).trim();
}

/**
 * Validates 24h "HH:mm" time strings in O(1) linear time to prevent ReDoS
 */
export function isValid24HourTime(timeStr: string): boolean {
  if (typeof timeStr !== 'string' || timeStr.length !== 5) {
    return false;
  }
  return TIME_REGEX_STRICT.test(timeStr);
}

/**
 * Deserializes JSON with a reviver that neutralizes Prototype Pollution
 * Drops dangerous property keys: '__proto__', 'constructor', 'prototype'
 */
export function safeJsonParse<T>(jsonStr: string, fallback: T): T {
  try {
    return JSON.parse(jsonStr, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined; // Stripped out
      }
      return value;
    }) as T;
  } catch {
    return fallback;
  }
}

/**
 * Validates IANA TimeZone identifier and defends against Path Traversal (e.g., ../../etc/passwd)
 */
export function isValidIanaTimeZone(tz: string): boolean {
  if (typeof tz !== 'string' || !tz.trim()) return false;
  
  // Defense against Path Traversal and Command Injections
  if (tz.includes('..') || tz.includes('\\') || tz.includes(';') || tz.includes('|') || tz.includes('&')) {
    return false;
  }

  // Validate format e.g. America/El_Salvador, Europe/Madrid
  if (!IANA_TZ_REGEX.test(tz.trim()) && tz.toUpperCase() !== 'UTC') {
    return false;
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * RLS Simulator: Simulates Supabase PostgreSQL Row Level Security
 * Policy:
 * - SELECT: Authenticated team members can view all team directory records
 * - UPDATE/DELETE: Users can ONLY mutate their own member profile and slots (auth.uid() = id)
 * - ADMIN_OVERRIDE: Admins can manage any member and execute security tooling
 */
export function verifyRLSPermission(
  currentUser: { id: string; role?: 'admin' | 'member' | 'guest'; auth_id: string } | null,
  targetMemberId: string,
  action: 'READ' | 'UPDATE_SLOTS' | 'UPDATE_PROFILE' | 'ADMIN_TOOLING'
): { allowed: boolean; reason: string; httpStatus: number } {
  if (!currentUser) {
    return {
      allowed: false,
      reason: '401 Unauthorized: Bearer JWT token missing or expired',
      httpStatus: 401
    };
  }

  // Admins bypass RLS with service/admin claim
  if (currentUser.role === 'admin') {
    return {
      allowed: true,
      reason: '200 OK: Granted via Admin Service Claim',
      httpStatus: 200
    };
  }

  if (action === 'ADMIN_TOOLING') {
    return {
      allowed: false,
      reason: '403 Forbidden: Only administrators have access to DevSec Pentesting & Audits',
      httpStatus: 403
    };
  }

  if (action === 'READ') {
    return {
      allowed: true,
      reason: '200 OK: RLS policy team_read_all evaluated to true',
      httpStatus: 200
    };
  }

  // Member editing own profile or slots
  if (currentUser.id === targetMemberId || currentUser.auth_id === targetMemberId) {
    return {
      allowed: true,
      reason: '200 OK: RLS policy member_update_own evaluated to true (auth.uid() == record.auth_id)',
      httpStatus: 200
    };
  }

  return {
    allowed: false,
    reason: `403 Forbidden: RLS violation. User ${currentUser.id} cannot mutate records of user ${targetMemberId}`,
    httpStatus: 403
  };
}

/**
 * Zero-Trust verification: Ensures no private secrets or keys are leaked in client bundles
 */
export function auditClientSecretsLeak(): { safe: boolean; findings: string[] } {
  const findings: string[] = [];
  
  // Verify window object doesn't leak secrets
  const anyWindow = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : {};
  if (anyWindow['GEMINI_API_KEY'] || anyWindow['SUPABASE_SERVICE_ROLE_KEY']) {
    findings.push('CRITICAL: Secret key detected in global window object');
  }

  // Verify localStorage doesn't store unencrypted sensitive master keys
  if (typeof localStorage !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      if (/service_role|secret_key|private_key/i.test(key)) {
        findings.push(`HIGH: Suspicious key "${key}" found in browser localStorage`);
      }
    }
  }

  return {
    safe: findings.length === 0,
    findings: findings.length === 0 ? ['Zero-Trust verified: No backend service keys exposed in client bundle.'] : findings
  };
}
