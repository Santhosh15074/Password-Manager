export type CategoryType = 'Logins' | 'Credit Cards' | 'Secure Notes' | 'API Keys' | 'Personal IDs';

export interface User {
  id: string;
  username: string;
  vaultSalt: string;
  authSalt: string;
  kdfIterations: number;
  createdAt: string;
}

export interface EncryptedVaultItem {
  id: string;
  userId: string;
  ciphertext: string; // Base64 encoded AES-256-GCM ciphertext + auth tag
  iv: string;         // Base64 encoded 12-byte initialization vector
  category: CategoryType;
  favorite: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface DecryptedVaultItem {
  id: string;
  userId: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  category: CategoryType;
  notes?: string;
  favorite: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CryptoInspectionData {
  masterPassword: string;
  vaultSaltHex: string;
  authSaltHex: string;
  kdfAlgorithm: string;
  iterations: number;
  derivedMasterKeyHex: string;
  derivedAuthSecretHex: string;
  lastEncryptedSample?: {
    plaintextJson: string;
    ivHex: string;
    ciphertextHex: string;
    authTagHex: string;
    serverPayloadJson: string;
  };
}

export interface PasswordGenOptions {
  length: number;
  useUppercase: boolean;
  useLowercase: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  excludeAmbiguous: boolean;
  isPassphrase: boolean;
  passphraseWordsCount: number;
  passphraseSeparator: string;
}

export interface PasswordStrengthResult {
  score: number; // 0 to 100
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  entropyBits: number;
  crackTimeDisplay: string;
  feedback: string[];
}

export interface AuditReport {
  totalItems: number;
  overallScore: number;
  weakCount: number;
  reusedCount: number;
  oldCount: number;
  compromisedCount: number;
  weakItems: DecryptedVaultItem[];
  reusedGroups: { password: string; items: DecryptedVaultItem[] }[];
  oldItems: DecryptedVaultItem[];
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetSeconds: number;
  isRateLimited: boolean;
}
