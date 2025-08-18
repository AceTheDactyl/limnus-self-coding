import { createHash, randomBytes } from 'crypto';

export function sigprint20(TT: string, CC: string, SS: string, PP: string[], RR: string): string {
  // Canonicalize fields for deterministic hashing
  const canonicalData = {
    TT: TT.trim(),
    CC: CC.trim(),
    SS: SS.trim(),
    PP: PP.map(p => p.trim()).sort(), // Sort for consistency
    RR: RR.trim()
  };
  
  // Create deterministic material string
  const material = JSON.stringify(canonicalData, null, 0); // No whitespace
  const hash = createHash('sha256').update(material, 'utf8').digest();
  
  // Convert to Base32-like encoding (using Base64 chars but cropped)
  const b32 = hash.toString('base64')
    .replace(/[^A-Z2-7]/gi, '') // Keep only Base32-compatible chars
    .toUpperCase()
    .slice(0, 20);
  
  return b32.padEnd(20, '2'); // Pad with '2' if needed
}

export function contentSha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2, 8);
}

export function generatePatchId(): string {
  return 'patch_' + Math.random().toString(36).substring(2, 8);
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `PT${minutes}M${remainingSeconds}S`;
}

// Nonce management for replay protection
const nonceStore = new Map<string, number>();
const NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export function generateNonce(): string {
  return randomBytes(16).toString('hex');
}

export function validateAndConsumeNonce(nonce: string): boolean {
  const now = Date.now();
  
  // Clean expired nonces
  for (const [key, timestamp] of nonceStore.entries()) {
    if (now - timestamp > NONCE_EXPIRY_MS) {
      nonceStore.delete(key);
    }
  }
  
  // Check if nonce exists (already used)
  if (nonceStore.has(nonce)) {
    return false;
  }
  
  // Store nonce with timestamp
  nonceStore.set(nonce, now);
  return true;
}

// Rate limiting per device/IP
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS_PER_WINDOW = 3;

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const existing = rateLimitStore.get(identifier);
  
  if (!existing || now > existing.resetTime) {
    // New window or expired
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    return true;
  }
  
  if (existing.count >= MAX_ATTEMPTS_PER_WINDOW) {
    return false;
  }
  
  existing.count++;
  return true;
}

// Generate a fresh nonce for client use
export function createNonce(): { nonce: string; expiresAt: number } {
  const nonce = generateNonce();
  const expiresAt = Date.now() + NONCE_EXPIRY_MS;
  return { nonce, expiresAt };
}