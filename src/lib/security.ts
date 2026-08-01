import { AuditReport, DecryptedVaultItem } from '../types';
import { evaluatePasswordStrength } from './crypto';

// Known compromised password SHA-1 prefixes for k-Anonymity HIBP simulation
const SIMULATED_HIBP_BREACHED_PASSWORDS = new Set([
  'password', 'password123', '123456', '12345678', 'qwerty', 'admin', 'welcome',
  'letmein', 'monkey', 'dragon', 'iloveyou', 'sunshine', 'princess', 'football'
]);

export function performSecurityAudit(items: DecryptedVaultItem[]): AuditReport {
  if (!items || items.length === 0) {
    return {
      totalItems: 0,
      overallScore: 100,
      weakCount: 0,
      reusedCount: 0,
      oldCount: 0,
      compromisedCount: 0,
      weakItems: [],
      reusedGroups: [],
      oldItems: []
    };
  }

  const weakItems: DecryptedVaultItem[] = [];
  const oldItems: DecryptedVaultItem[] = [];
  const passwordMap = new Map<string, DecryptedVaultItem[]>();
  let compromisedCount = 0;

  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  items.forEach(item => {
    const pwd = item.password || '';
    const strength = evaluatePasswordStrength(pwd);

    if (strength.score < 60) {
      weakItems.push(item);
    }

    if (item.updatedAt && now - item.updatedAt > ninetyDaysMs) {
      oldItems.push(item);
    }

    if (SIMULATED_HIBP_BREACHED_PASSWORDS.has(pwd.toLowerCase())) {
      compromisedCount++;
    }

    if (pwd) {
      const existing = passwordMap.get(pwd) || [];
      existing.push(item);
      passwordMap.set(pwd, existing);
    }
  });

  // Collect reused password groups
  const reusedGroups: { password: string; items: DecryptedVaultItem[] }[] = [];
  let reusedCount = 0;
  passwordMap.forEach((matchedItems, pwd) => {
    if (matchedItems.length > 1) {
      reusedGroups.push({ password: pwd, items: matchedItems });
      reusedCount += matchedItems.length;
    }
  });

  // Calculate overall vault health score (0-100)
  const total = items.length;
  let scoreDeductions = 0;

  scoreDeductions += (weakItems.length / total) * 40;
  scoreDeductions += (reusedCount / total) * 30;
  scoreDeductions += (oldItems.length / total) * 15;
  scoreDeductions += (compromisedCount / total) * 15;

  const overallScore = Math.max(0, Math.min(100, Math.round(100 - scoreDeductions)));

  return {
    totalItems: total,
    overallScore,
    weakCount: weakItems.length,
    reusedCount,
    oldCount: oldItems.length,
    compromisedCount,
    weakItems,
    reusedGroups,
    oldItems
  };
}
