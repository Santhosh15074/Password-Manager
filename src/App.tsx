import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { LockScreen } from './components/LockScreen';
import { VaultList } from './components/VaultList';
import { CredentialModal } from './components/CredentialModal';
import { PasswordGenerator } from './components/PasswordGenerator';
import { SecurityAuditView } from './components/SecurityAuditView';
import { CryptoInspector } from './components/CryptoInspector';
import { RateLimitStatus } from './components/RateLimitStatus';
import { ExportImportModal } from './components/ExportImportModal';
import { DeleteModal } from './components/DeleteModal';
import { 
  User, 
  EncryptedVaultItem, 
  DecryptedVaultItem, 
  RateLimitInfo 
} from './types';
import { 
  generateRandomSaltHex, 
  deriveKeys, 
  encryptData, 
  decryptData 
} from './lib/crypto';
import { Lock, ShieldAlert, Sparkles, Key } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(localStorage.getItem('aegis_session_token'));
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [encryptedItems, setEncryptedItems] = useState<EncryptedVaultItem[]>([]);
  const [decryptedItems, setDecryptedItems] = useState<DecryptedVaultItem[]>([]);

  const [activeTab, setActiveTab] = useState<'vault' | 'generator' | 'audit' | 'inspector'>('vault');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(5);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>({
    limit: 150,
    remaining: 150,
    resetSeconds: 60,
    isRateLimited: false
  });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DecryptedVaultItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<DecryptedVaultItem | null>(null);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);

  // Inactivity Auto-Lock timer reference
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);

  const lockVault = useCallback(() => {
    setMasterKey(null);
    setIsUnlocked(false);
    setDecryptedItems([]);
  }, []);

  // Reset auto-lock timer on user activity
  const resetLockTimer = useCallback(() => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);

    if (autoLockMinutes > 0 && isUnlocked) {
      lockTimerRef.current = setTimeout(() => {
        lockVault();
      }, autoLockMinutes * 60 * 1000);
    }
  }, [autoLockMinutes, isUnlocked, lockVault]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    const handleActivity = () => resetLockTimer();

    events.forEach(ev => window.addEventListener(ev, handleActivity));
    resetLockTimer();

    return () => {
      events.forEach(ev => window.removeEventListener(ev, handleActivity));
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, [resetLockTimer]);

  // Extract rate limit headers from API responses
  const updateRateLimitFromResponse = (res: Response) => {
    const limit = res.headers.get('X-RateLimit-Limit');
    const remaining = res.headers.get('X-RateLimit-Remaining');
    const reset = res.headers.get('X-RateLimit-Reset');

    if (limit && remaining) {
      setRateLimitInfo({
        limit: Number(limit),
        remaining: Number(remaining),
        resetSeconds: Number(reset || 0),
        isRateLimited: res.status === 429
      });
    }
  };

  // Check existing session on load
  useEffect(() => {
    if (!sessionToken) return;

    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session', {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
        updateRateLimitFromResponse(res);

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem('aegis_session_token');
          setSessionToken(null);
        }
      } catch (err) {
        console.error('Session check error:', err);
      }
    };

    fetchSession();
  }, [sessionToken]);

  // Fetch encrypted vault items & decrypt them locally
  const fetchAndDecryptVault = useCallback(async (key: CryptoKey, currentUser: User) => {
    if (!sessionToken) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/vault', {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      updateRateLimitFromResponse(res);

      if (!res.ok) {
        throw new Error('Failed to fetch encrypted vault items');
      }

      const data = await res.json();
      const items: EncryptedVaultItem[] = data.items || [];
      setEncryptedItems(items);

      // Decrypt items client-side using AES-256-GCM
      const decryptedList: DecryptedVaultItem[] = [];
      for (const item of items) {
        try {
          const jsonText = await decryptData(item.ciphertext, item.iv, key);
          const parsed = JSON.parse(jsonText);
          decryptedList.push({
            id: item.id,
            userId: item.userId,
            title: parsed.title,
            username: parsed.username,
            password: parsed.password,
            url: parsed.url,
            category: item.category,
            notes: parsed.notes,
            favorite: item.favorite,
            tags: item.tags,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          });
        } catch (decErr) {
          console.error(`Failed to decrypt vault item ${item.id}:`, decErr);
        }
      }

      setDecryptedItems(decryptedList);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error fetching vault data');
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  // Handle User Registration
  const handleRegister = async (username: string, masterPassword: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Generate client-side salts
      const vaultSalt = generateRandomSaltHex(16);
      const authSalt = generateRandomSaltHex(16);

      // 2. Derive Master Key & Auth Secret via PBKDF2 SHA-256 (100,000 rounds)
      const { masterKey: derivedMasterKey, authSecretHex } = await deriveKeys(
        masterPassword,
        vaultSalt,
        authSalt,
        100000
      );

      // 3. Post registration payload to Express backend
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          authSecret: authSecretHex,
          vaultSalt,
          authSalt,
          kdfIterations: 100000
        })
      });

      updateRateLimitFromResponse(res);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // 4. Save session token & set state
      localStorage.setItem('aegis_session_token', data.token);
      setSessionToken(data.token);
      setUser(data.user);
      setMasterKey(derivedMasterKey);
      setIsUnlocked(true);

      // Fetch empty vault
      await fetchAndDecryptVault(derivedMasterKey, data.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle User Login
  const handleLogin = async (username: string, masterPassword: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Fetch user's salt & KDF params from server
      const paramsRes = await fetch(`/api/auth/params?username=${encodeURIComponent(username)}`);
      updateRateLimitFromResponse(paramsRes);
      const paramsData = await paramsRes.json();

      if (!paramsRes.ok) {
        throw new Error(paramsData.error || 'User not found');
      }

      const { vaultSalt, authSalt, kdfIterations } = paramsData;

      // 2. Re-derive Master Key & Auth Secret client-side
      const { masterKey: derivedMasterKey, authSecretHex } = await deriveKeys(
        masterPassword,
        vaultSalt,
        authSalt,
        kdfIterations || 100000
      );

      // 3. Post login verification payload
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          authSecret: authSecretHex
        })
      });

      updateRateLimitFromResponse(loginRes);
      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        throw new Error(loginData.error || 'Invalid credentials');
      }

      // 4. Set unlock state
      localStorage.setItem('aegis_session_token', loginData.token);
      setSessionToken(loginData.token);
      setUser(loginData.user);
      setMasterKey(derivedMasterKey);
      setIsUnlocked(true);

      // 5. Fetch & decrypt vault
      await fetchAndDecryptVault(derivedMasterKey, loginData.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Instant Test Drive Demo Account Setup
  const handleQuickDemo = async () => {
    const demoUser = 'demo_engineer@aegis.io';
    const demoPassword = 'DemoMasterPassword2026!';

    try {
      // Try login first
      await handleLogin(demoUser, demoPassword);
    } catch (err) {
      // Register if demo user doesn't exist yet
      await handleRegister(demoUser, demoPassword);

      // Pre-seed demo user with sample encrypted credentials
      setTimeout(async () => {
        if (masterKey) {
          const sampleCredentials = [
            {
              title: 'GitHub Enterprise',
              username: 'sec_engineer',
              password: 'P@ssw0rd!G1tHub2026',
              category: 'Logins' as const,
              url: 'https://github.com',
              notes: 'Primary developer repository access token',
              tags: ['work', 'dev'],
              favorite: true
            },
            {
              title: 'Google Cloud Platform',
              username: 'admin@aegis.io',
              password: 'weakpwd',
              category: 'Logins' as const,
              url: 'https://console.cloud.google.com',
              notes: 'GCP production deployment console',
              tags: ['work', 'cloud'],
              favorite: true
            },
            {
              title: 'AWS Production Database',
              username: 'db_admin',
              password: 'P@ssw0rd!G1tHub2026', // Reused password for security audit demonstration!
              category: 'API Keys' as const,
              url: 'https://aws.amazon.com',
              notes: 'PostgreSQL cluster connection string secret',
              tags: ['database'],
              favorite: false
            }
          ];

          for (const item of sampleCredentials) {
            await handleSaveCredential(item);
          }
        }
      }, 500);
    }
  };

  // Logout
  const handleLogout = async () => {
    if (sessionToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    localStorage.removeItem('aegis_session_token');
    setSessionToken(null);
    setUser(null);
    setMasterKey(null);
    setIsUnlocked(false);
    setDecryptedItems([]);
    setEncryptedItems([]);
  };

  // Save (Create or Update) Credential
  const handleSaveCredential = async (
    itemData: Omit<DecryptedVaultItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    if (!masterKey || !sessionToken) return;

    try {
      // 1. Serialize unencrypted payload
      const unencryptedJson = JSON.stringify({
        title: itemData.title,
        username: itemData.username,
        password: itemData.password,
        url: itemData.url,
        notes: itemData.notes
      });

      // 2. Encrypt using AES-256-GCM client-side
      const encrypted = await encryptData(unencryptedJson, masterKey);

      const endpoint = id ? `/api/vault/${id}` : '/api/vault';
      const method = id ? 'PUT' : 'POST';

      // 3. Post base64 ciphertext to server
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          ciphertext: encrypted.ciphertextBase64,
          iv: encrypted.ivBase64,
          category: itemData.category,
          favorite: itemData.favorite,
          tags: itemData.tags
        })
      });

      updateRateLimitFromResponse(res);

      if (!res.ok) {
        throw new Error('Failed to save vault item');
      }

      // 4. Re-fetch vault
      await fetchAndDecryptVault(masterKey, user!);
    } catch (err: any) {
      alert(`Error saving credential: ${err.message}`);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (item: DecryptedVaultItem) => {
    setDeletingItem(item);
  };

  // Perform Delete Credential
  const handleConfirmDeleteCredential = async (id: string) => {
    if (!sessionToken) return;

    const res = await fetch(`/api/vault/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sessionToken}` }
    });

    updateRateLimitFromResponse(res);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete credential');
    }

    setDecryptedItems(prev => prev.filter(i => i.id !== id));
    setEncryptedItems(prev => prev.filter(i => i.id !== id));
  };

  // Toggle Favorite
  const handleToggleFavorite = async (item: DecryptedVaultItem) => {
    await handleSaveCredential({
      ...item,
      favorite: !item.favorite
    }, item.id);
  };

  // Fix Item from Security Audit
  const handleFixAuditItem = (item: DecryptedVaultItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Import Items from CSV
  const handleImportItems = async (
    imported: Omit<DecryptedVaultItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]
  ) => {
    for (const item of imported) {
      await handleSaveCredential(item);
    }
  };

  // Rate Limiter Test Trigger
  const handleSimulateRateLimit = async () => {
    for (let i = 0; i < 20; i++) {
      const res = await fetch('/api/auth/params?username=rate_limit_test');
      updateRateLimitFromResponse(res);
    }
  };

  // If not authenticated or vault locked, show LockScreen
  if (!user || !isUnlocked || !masterKey) {
    return (
      <LockScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
        onQuickDemo={handleQuickDemo}
        isLoading={isLoading}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLock={lockVault}
        onLogout={handleLogout}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        autoLockMinutes={autoLockMinutes}
        setAutoLockMinutes={setAutoLockMinutes}
        rateLimitInfo={rateLimitInfo}
      />

      {/* Main App Container */}
      <main className="flex-1 pb-12">
        {activeTab === 'vault' && (
          <VaultList
            items={decryptedItems}
            onAddNew={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            onEdit={(item) => {
              setEditingItem(item);
              setIsModalOpen(true);
            }}
            onDelete={handleOpenDeleteModal}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'generator' && <PasswordGenerator />}

        {activeTab === 'audit' && (
          <SecurityAuditView
            items={decryptedItems}
            onFixItem={handleFixAuditItem}
          />
        )}

        {activeTab === 'inspector' && (
          <CryptoInspector user={user} />
        )}
      </main>

      {/* Bottom Floating Rate Limit Inspector Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-6">
        <RateLimitStatus
          rateLimitInfo={rateLimitInfo}
          onSimulateRateLimit={handleSimulateRateLimit}
        />
      </div>

      {/* Modals */}
      <CredentialModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveCredential}
        editingItem={editingItem}
      />

      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        encryptedItems={encryptedItems}
        decryptedItems={decryptedItems}
        onImportItems={handleImportItems}
      />

      <DeleteModal
        isOpen={Boolean(deletingItem)}
        item={deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirmDelete={handleConfirmDeleteCredential}
      />

    </div>
  );
}
