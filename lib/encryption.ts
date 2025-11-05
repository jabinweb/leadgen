import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-please-change-in-production-32-chars!!';
const ALGORITHM = 'aes-256-cbc';

// Ensure key is 32 bytes
const getKey = () => {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  return key;
};

/**
 * Encrypt a string (e.g., SMTP password)
 */
export function encrypt(text: string): string {
  if (!text) return '';
  
  const iv = crypto.randomBytes(16);
  const key = getKey();
  // @ts-ignore - Node.js Buffer is compatible with CipherKey
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV + encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a string
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const key = getKey();
    // @ts-ignore - Node.js Buffer is compatible with CipherKey
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

/**
 * Test if encryption/decryption is working
 */
export function testEncryption() {
  const testString = 'test-password-123';
  const encrypted = encrypt(testString);
  const decrypted = decrypt(encrypted);
  
  return {
    success: testString === decrypted,
    original: testString,
    encrypted,
    decrypted,
  };
}
