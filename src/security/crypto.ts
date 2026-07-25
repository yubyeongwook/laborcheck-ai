import crypto from 'crypto';

/**
 * Financial-grade AES-256-GCM Encryption/Decryption Utility
 * Ensures Zero Plaintext leakage for sensitive employee data (RRN, Bank Accounts).
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits standard for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits auth tag

/**
 * Resolves 32-byte secret key from environment or fallback hash
 */
function getSecretKey(): Buffer {
  const secret = process.env.AES_SECRET_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  if (Buffer.from(secret, 'hex').length === 32) {
    return Buffer.from(secret, 'hex');
  }
  // Fallback to SHA-256 hash if provided string is not 32 hex bytes
  return crypto.createHash('sha256').update(secret).digest();
}

export interface EncryptedPayload {
  encryptedData: string; // Base64 encoded cipher text
  iv: string;            // Hex encoded initialization vector
  authTag: string;       // Hex encoded authentication tag
  combined: string;      // Single string representation (iv:authTag:encryptedData)
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 */
export function encryptData(plaintext: string): EncryptedPayload {
  if (!plaintext) {
    throw new Error('[CryptoError] Plaintext string cannot be empty.');
  }

  const key = getSecretKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  const ivHex = iv.toString('hex');
  const authTagHex = authTag.toString('hex');
  const combined = `${ivHex}:${authTagHex}:${encrypted}`;

  return {
    encryptedData: encrypted,
    iv: ivHex,
    authTag: authTagHex,
    combined,
  };
}

/**
 * Decrypts an encrypted payload or combined string back to plaintext
 */
export function decryptData(input: string | EncryptedPayload): string {
  const key = getSecretKey();
  let ivHex: string;
  let authTagHex: string;
  let encryptedText: string;

  if (typeof input === 'string') {
    const parts = input.split(':');
    if (parts.length !== 3) {
      throw new Error('[CryptoError] Invalid payload format for combined string.');
    }
    [ivHex, authTagHex, encryptedText] = parts;
  } else {
    ivHex = input.iv;
    authTagHex = input.authTag;
    encryptedText = input.encryptedData;
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Masking utility for display purposes (e.g., 900101-1******)
 */
export function maskRRN(rrn: string): string {
  const clean = rrn.replace(/[^0-9]/g, '');
  if (clean.length === 13) {
    return `${clean.substring(0, 6)}-${clean.substring(6, 7)}******`;
  }
  return '******-*******';
}
