import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '5mb' }));

// Set up persistent data store directory
const DATA_DIR = path.join(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'db.json');

interface UserRecord {
  id: string;
  username: string;
  serverAuthHash: string; // scrypt(authSecret)
  vaultSalt: string;
  authSalt: string;
  kdfIterations: number;
  createdAt: string;
}

interface VaultItemRecord {
  id: string;
  userId: string;
  ciphertext: string;
  iv: string;
  category: string;
  favorite: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

interface DBStructure {
  users: Record<string, UserRecord>; // key: username
  sessions: Record<string, { userId: string; username: string; expiresAt: number }>;
  vaultItems: Record<string, VaultItemRecord>; // key: itemId
}

// Read database from disk or initialize
function readDB(): DBStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB file, starting fresh:', err);
  }
  return { users: {}, sessions: {}, vaultItems: {} };
}

// Save database to disk
function saveDB(db: DBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

// Initialize database
let db = readDB();

// Helper: Scrypt password hashing for authSecret on server
const SERVER_PEPPER = 'AegisVault_ZeroKnowledge_Pepper_2026_Key';

function hashAuthSecret(authSecretHex: string, salt: string): string {
  const combined = authSecretHex + SERVER_PEPPER;
  const hash = crypto.scryptSync(combined, salt, 64);
  return hash.toString('hex');
}

// In-Memory Rate Limiter
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitBucket>();

function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const key = `${req.path}_${ip}`;
    const now = Date.now();

    let bucket = rateLimitMap.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = {
        count: 1,
        resetAt: now + windowMs
      };
      rateLimitMap.set(key, bucket);
    } else {
      bucket.count++;
    }

    const remaining = Math.max(0, maxRequests - bucket.count);
    const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (bucket.count > maxRequests) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please wait ${resetSeconds} seconds before trying again.`,
        resetSeconds
      });
      return;
    }

    next();
  };
}

// Rate Limiting Middlewares
const authRateLimiter = createRateLimiter(15, 60 * 1000); // 15 auth calls per min
const vaultRateLimiter = createRateLimiter(150, 60 * 1000); // 150 vault calls per min

// Middleware to authenticate session token
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing session token' });
    return;
  }

  const token = authHeader.substring(7);
  const session = db.sessions[token];

  if (!session || session.expiresAt < Date.now()) {
    if (session) {
      delete db.sessions[token];
      saveDB(db);
    }
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    return;
  }

  (req as any).user = { id: session.userId, username: session.username };
  next();
}

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ---------------- API ROUTES ----------------

// 1. Get KDF parameters for login (salt & iterations)
app.get('/api/auth/params', authRateLimiter, (req: Request, res: Response) => {
  const username = (req.query.username as string || '').toLowerCase().trim();
  if (!username) {
    res.status(400).json({ error: 'Username parameter required' });
    return;
  }

  const user = db.users[username];
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    vaultSalt: user.vaultSalt,
    authSalt: user.authSalt,
    kdfIterations: user.kdfIterations
  });
});

// 2. Register User
app.post('/api/auth/register', authRateLimiter, (req: Request, res: Response) => {
  const { username, authSecret, vaultSalt, authSalt, kdfIterations } = req.body;

  if (!username || !authSecret || !vaultSalt || !authSalt) {
    res.status(400).json({ error: 'Missing required registration parameters' });
    return;
  }

  const cleanUsername = username.toLowerCase().trim();
  if (db.users[cleanUsername]) {
    res.status(409).json({ error: 'Username already registered. Please login or choose another.' });
    return;
  }

  const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
  const serverAuthHash = hashAuthSecret(authSecret, authSalt);

  const newUser: UserRecord = {
    id: userId,
    username: cleanUsername,
    serverAuthHash,
    vaultSalt,
    authSalt,
    kdfIterations: kdfIterations || 100000,
    createdAt: new Date().toISOString()
  };

  db.users[cleanUsername] = newUser;

  // Issue session token
  const token = 'tok_' + crypto.randomBytes(24).toString('hex');
  db.sessions[token] = {
    userId: newUser.id,
    username: newUser.username,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hour session
  };

  saveDB(db);

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      vaultSalt: newUser.vaultSalt,
      authSalt: newUser.authSalt,
      kdfIterations: newUser.kdfIterations
    }
  });
});

// 3. Login User
app.post('/api/auth/login', authRateLimiter, (req: Request, res: Response) => {
  const { username, authSecret } = req.body;

  if (!username || !authSecret) {
    res.status(400).json({ error: 'Username and Auth Secret required' });
    return;
  }

  const cleanUsername = username.toLowerCase().trim();
  const user = db.users[cleanUsername];

  if (!user) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const computedHash = hashAuthSecret(authSecret, user.authSalt);

  // Constant-time buffer comparison to prevent timing attacks
  const bufA = Buffer.from(computedHash, 'hex');
  const bufB = Buffer.from(user.serverAuthHash, 'hex');

  let match = false;
  if (bufA.length === bufB.length) {
    match = crypto.timingSafeEqual(bufA, bufB);
  }

  if (!match) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  // Generate new token
  const token = 'tok_' + crypto.randomBytes(24).toString('hex');
  db.sessions[token] = {
    userId: user.id,
    username: user.username,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000
  };

  saveDB(db);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      vaultSalt: user.vaultSalt,
      authSalt: user.authSalt,
      kdfIterations: user.kdfIterations
    }
  });
});

// 4. Check Current Session
app.get('/api/auth/session', authRateLimiter, authenticateToken, (req: Request, res: Response) => {
  const sessionUser = (req as any).user;
  const user = db.users[sessionUser.username];

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      vaultSalt: user.vaultSalt,
      authSalt: user.authSalt,
      kdfIterations: user.kdfIterations
    }
  });
});

// 5. Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    delete db.sessions[token];
    saveDB(db);
  }
  res.json({ message: 'Logged out successfully' });
});

// 6. Get Vault Items (Encrypted payloads only)
app.get('/api/vault', vaultRateLimiter, authenticateToken, (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const items = Object.values(db.vaultItems)
    .filter(item => item.userId === userId)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  res.json({ items });
});

// 7. Add New Encrypted Vault Item
app.post('/api/vault', vaultRateLimiter, authenticateToken, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { ciphertext, iv, category, favorite, tags } = req.body;

  if (!ciphertext || !iv) {
    res.status(400).json({ error: 'Missing encrypted payload parameters (ciphertext, iv required)' });
    return;
  }

  const newItem: VaultItemRecord = {
    id: 'vitem_' + crypto.randomBytes(8).toString('hex'),
    userId,
    ciphertext,
    iv,
    category: category || 'Logins',
    favorite: Boolean(favorite),
    tags: Array.isArray(tags) ? tags : [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  db.vaultItems[newItem.id] = newItem;
  saveDB(db);

  res.status(201).json({ item: newItem });
});

// 8. Update Encrypted Vault Item
app.put('/api/vault/:id', vaultRateLimiter, authenticateToken, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const itemId = req.params.id;

  const existing = db.vaultItems[itemId];
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: 'Vault item not found' });
    return;
  }

  const { ciphertext, iv, category, favorite, tags } = req.body;

  if (ciphertext) existing.ciphertext = ciphertext;
  if (iv) existing.iv = iv;
  if (category) existing.category = category;
  if (favorite !== undefined) existing.favorite = Boolean(favorite);
  if (Array.isArray(tags)) existing.tags = tags;

  existing.updatedAt = Date.now();

  db.vaultItems[itemId] = existing;
  saveDB(db);

  res.json({ item: existing });
});

// 9. Delete Vault Item
app.delete('/api/vault/:id', vaultRateLimiter, authenticateToken, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const itemId = req.params.id;

  const existing = db.vaultItems[itemId];
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: 'Vault item not found' });
    return;
  }

  delete db.vaultItems[itemId];
  saveDB(db);

  res.json({ message: 'Item deleted successfully', id: itemId });
});

// Server status & Rate Limit Test Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    totalUsers: Object.keys(db.users).length,
    totalEncryptedVaultItems: Object.keys(db.vaultItems).length
  });
});

// ---------------- VITE MIDDLEWARE SETUP ----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Aegis Vault] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
