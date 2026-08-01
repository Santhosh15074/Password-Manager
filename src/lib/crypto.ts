import { PasswordGenOptions, PasswordStrengthResult } from '../types';

// Helper: Convert Uint8Array to Hex string
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: Convert Hex string to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Helper: Convert Uint8Array to Base64
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 to Uint8Array
export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Generate random cryptographically secure hex salt
export function generateRandomSaltHex(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  window.crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

// Derive CryptoKey (AES-GCM 256) and Auth Secret (Hex) using PBKDF2
export async function deriveKeys(
  masterPassword: string,
  vaultSaltHex: string,
  authSaltHex: string,
  iterations = 100000
): Promise<{
  masterKey: CryptoKey;
  masterKeyHex: string;
  authSecretHex: string;
}> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(masterPassword);

  // Import raw master password as base key for PBKDF2
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );

  // 1. Derive AES-GCM Master Key for local vault encryption
  const vaultSaltBytes = hexToBytes(vaultSaltHex);
  const masterKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: vaultSaltBytes,
      iterations,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true, // extractable for inspection/export
    ['encrypt', 'decrypt']
  );

  // Export raw master key bytes for crypto inspector preview
  const exportedMasterKey = await window.crypto.subtle.exportKey('raw', masterKey);
  const masterKeyHex = bytesToHex(new Uint8Array(exportedMasterKey));

  // 2. Derive Auth Secret for zero-knowledge server authentication
  const authSaltBytes = hexToBytes(authSaltHex);
  const authSecretBuffer = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: authSaltBytes,
      iterations,
      hash: 'SHA-256'
    },
    baseKey,
    256 // 256 bits = 32 bytes
  );
  const authSecretHex = bytesToHex(new Uint8Array(authSecretBuffer));

  return {
    masterKey,
    masterKeyHex,
    authSecretHex
  };
}

// AES-256-GCM Encryption
export async function encryptData(
  plaintextJson: string,
  masterKey: CryptoKey
): Promise<{
  ciphertextBase64: string;
  ivBase64: string;
  ivHex: string;
  ciphertextHex: string;
  authTagHex: string;
}> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(plaintextJson);

  // 12-byte (96-bit) IV recommended for AES-GCM
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    masterKey,
    dataBytes
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);

  // GCM appends a 16-byte Auth Tag at the end of the encrypted buffer
  const ciphertextOnlyBytes = encryptedBytes.slice(0, encryptedBytes.length - 16);
  const authTagBytes = encryptedBytes.slice(encryptedBytes.length - 16);

  const ciphertextBase64 = bytesToBase64(encryptedBytes);
  const ivBase64 = bytesToBase64(iv);

  return {
    ciphertextBase64,
    ivBase64,
    ivHex: bytesToHex(iv),
    ciphertextHex: bytesToHex(ciphertextOnlyBytes),
    authTagHex: bytesToHex(authTagBytes)
  };
}

// AES-256-GCM Decryption
export async function decryptData(
  ciphertextBase64: string,
  ivBase64: string,
  masterKey: CryptoKey
): Promise<string> {
  const encryptedBytes = base64ToBytes(ciphertextBase64);
  const ivBytes = base64ToBytes(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes
    },
    masterKey,
    encryptedBytes
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// Word list for Passphrase Generation
const EFF_WORDLIST = [
  'ability', 'account', 'actor', 'adapter', 'address', 'agent', 'airplane', 'alarm',
  'album', 'anchor', 'angel', 'antenna', 'apron', 'arcade', 'architect', 'archive',
  'artist', 'aspect', 'asset', 'athlete', 'atlas', 'atom', 'audio', 'author',
  'avalanche', 'avenue', 'avatar', 'beacon', 'bison', 'blanket', 'blender', 'blossom',
  'blueprint', 'boulder', 'breeze', 'bridge', 'bronze', 'buffer', 'cabinet', 'cable',
  'cactus', 'canyon', 'canvas', 'captain', 'castle', 'catalyst', 'cellular', 'chamber',
  'channel', 'chariot', 'chimney', 'circuit', 'citadel', 'compass', 'comet', 'concept',
  'copper', 'coral', 'crystal', 'curtain', 'cypress', 'decimal', 'delta', 'diagram',
  'diamond', 'digit', 'discovery', 'dolphin', 'dragon', 'dynamic', 'echo', 'eclipse',
  'element', 'emerald', 'engine', 'envelope', 'equator', 'falcon', 'feather', 'fender',
  'fiber', 'filter', 'firewall', 'fjord', 'flamingo', 'galaxy', 'glacier', 'granite',
  'gravity', 'harbor', 'harvest', 'horizon', 'iceberg', 'impulse', 'island', 'jasper',
  'jungle', 'jupiter', 'kernel', 'keyboard', 'lantern', 'legend', 'leopard', 'magnet',
  'matrix', 'meadow', 'mercury', 'monument', 'nebula', 'network', 'neutron', 'oasis',
  'octopus', 'olympus', 'orchid', 'origami', 'orbit', 'panther', 'paradox', 'pelican',
  'phantom', 'phoenix', 'pioneer', 'planet', 'pyramid', 'quantum', 'quartz', 'radar',
  'radiance', 'redwood', 'resonance', 'rhino', 'rhythm', 'safari', 'satellite', 'scholar',
  'shadow', 'shuttle', 'solstice', 'spectrum', 'sphinx', 'stellar', 'symphony', 'tactics',
  'telescope', 'temple', 'titanium', 'tornado', 'transit', 'tsunami', 'tundra', 'typhoon',
  'vector', 'velocity', 'venture', 'vessel', 'vortex', 'vulcan', 'whisper', 'zenith'
];

// Generate customizable random password or passphrase
export function generatePassword(options: PasswordGenOptions): string {
  if (options.isPassphrase) {
    const words: string[] = [];
    const count = Math.max(2, Math.min(10, options.passphraseWordsCount || 4));
    for (let i = 0; i < count; i++) {
      const randBytes = new Uint32Array(1);
      window.crypto.getRandomValues(randBytes);
      const index = randBytes[0] % EFF_WORDLIST.length;
      words.push(EFF_WORDLIST[index]);
    }
    return words.join(options.passphraseSeparator || '-');
  }

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const ambiguous = 'I1lO0';

  let charSet = '';
  if (options.useUppercase) charSet += uppercase;
  if (options.useLowercase) charSet += lowercase;
  if (options.useNumbers) charSet += numbers;
  if (options.useSymbols) charSet += symbols;

  if (options.excludeAmbiguous) {
    charSet = charSet.split('').filter(c => !ambiguous.includes(c)).join('');
  }

  if (!charSet) {
    charSet = lowercase + numbers;
  }

  const length = Math.max(4, Math.min(128, options.length || 16));
  const result: string[] = [];
  const randValues = new Uint32Array(length);
  window.crypto.getRandomValues(randValues);

  for (let i = 0; i < length; i++) {
    result.push(charSet[randValues[i] % charSet.length]);
  }

  return result.join('');
}

// Calculate Password Entropy and Strength
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      label: 'Very Weak',
      entropyBits: 0,
      crackTimeDisplay: 'Instant',
      feedback: ['Password is empty']
    };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  if (poolSize === 0) poolSize = 26;

  // Entropy = length * log2(poolSize)
  const entropyBits = Math.floor(password.length * Math.log2(poolSize));

  // Estimate crack time assuming 100 billion guesses/sec
  const combinations = Math.pow(poolSize, password.length);
  const seconds = combinations / 100000000000;

  let crackTimeDisplay = 'Instant';
  if (seconds > 31536000000) {
    crackTimeDisplay = 'Centuries+';
  } else if (seconds > 31536000) {
    crackTimeDisplay = `${Math.round(seconds / 31536000)} years`;
  } else if (seconds > 86400) {
    crackTimeDisplay = `${Math.round(seconds / 86400)} days`;
  } else if (seconds > 3600) {
    crackTimeDisplay = `${Math.round(seconds / 3600)} hours`;
  } else if (seconds > 60) {
    crackTimeDisplay = `${Math.round(seconds / 60)} minutes`;
  } else if (seconds > 1) {
    crackTimeDisplay = `${Math.round(seconds)} seconds`;
  }

  const feedback: string[] = [];
  if (password.length < 12) feedback.push('Use at least 12 characters');
  if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
  if (!/[0-9]/.test(password)) feedback.push('Add numbers');
  if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Add special symbols');

  let score = 0;
  let label: PasswordStrengthResult['label'] = 'Very Weak';

  if (entropyBits >= 80) {
    score = 100;
    label = 'Very Strong';
  } else if (entropyBits >= 60) {
    score = 75;
    label = 'Strong';
  } else if (entropyBits >= 40) {
    score = 50;
    label = 'Fair';
  } else if (entropyBits >= 25) {
    score = 25;
    label = 'Weak';
  } else {
    score = 10;
    label = 'Very Weak';
  }

  return {
    score,
    label,
    entropyBits,
    crackTimeDisplay,
    feedback
  };
}
