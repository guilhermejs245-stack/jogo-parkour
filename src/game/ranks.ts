import { RankTier } from '../types/game';

export const RANK_TIERS: RankTier[] = [
  {
    id: 'silver_1',
    name: 'Silver I',
    division: 'Prata',
    minRP: 0,
    maxRP: 499,
    badgeColor: '#94a3b8',
    accentColor: '#cbd5e1',
  },
  {
    id: 'silver_elite',
    name: 'Silver Elite Master',
    division: 'Prata Elite',
    minRP: 500,
    maxRP: 1199,
    badgeColor: '#64748b',
    accentColor: '#94a3b8',
  },
  {
    id: 'gold_nova_1',
    name: 'Gold Nova I',
    division: 'Ouro I',
    minRP: 1200,
    maxRP: 2199,
    badgeColor: '#eab308',
    accentColor: '#fef08a',
  },
  {
    id: 'gold_nova_master',
    name: 'Gold Nova Master',
    division: 'Ouro Mestre',
    minRP: 2200,
    maxRP: 3499,
    badgeColor: '#d97706',
    accentColor: '#fde047',
  },
  {
    id: 'master_guardian_1',
    name: 'Master Guardian I',
    division: 'Guardião Mestre (AK)',
    minRP: 3500,
    maxRP: 4999,
    badgeColor: '#0ea5e9',
    accentColor: '#38bdf8',
  },
  {
    id: 'master_guardian_elite',
    name: 'Master Guardian Elite',
    division: 'Duplo AK',
    minRP: 5000,
    maxRP: 6799,
    badgeColor: '#2563eb',
    accentColor: '#60a5fa',
  },
  {
    id: 'distinguished_master_guardian',
    name: 'Distinguished Master Guardian',
    division: 'Xerife (DMG)',
    minRP: 6800,
    maxRP: 8799,
    badgeColor: '#7c3aed',
    accentColor: '#a78bfa',
  },
  {
    id: 'legendary_eagle',
    name: 'Legendary Eagle',
    division: 'Águia Lendária',
    minRP: 8800,
    maxRP: 10999,
    badgeColor: '#db2777',
    accentColor: '#f472b6',
  },
  {
    id: 'supreme_master',
    name: 'Supreme Master First Class',
    division: 'Supremo',
    minRP: 11000,
    maxRP: 13999,
    badgeColor: '#dc2626',
    accentColor: '#f87171',
  },
  {
    id: 'the_global_elite',
    name: 'The Global Elite',
    division: 'Global Elite ★',
    minRP: 14000,
    maxRP: 999999,
    badgeColor: '#fbbf24',
    accentColor: '#ffffff',
  },
];

export function getRankTier(rp: number): RankTier {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (rp >= RANK_TIERS[i].minRP) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0];
}

export function getRankProgress(rp: number): { current: RankTier; next: RankTier | null; percent: number } {
  const current = getRankTier(rp);
  const currentIndex = RANK_TIERS.findIndex(r => r.id === current.id);
  const next = currentIndex < RANK_TIERS.length - 1 ? RANK_TIERS[currentIndex + 1] : null;

  if (!next) {
    return { current, next: null, percent: 100 };
  }

  const range = next.minRP - current.minRP;
  const earned = Math.max(0, rp - current.minRP);
  const percent = Math.min(100, Math.round((earned / range) * 100));

  return { current, next, percent };
}
