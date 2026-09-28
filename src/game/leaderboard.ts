import { LeaderboardEntry, KnifeType, KnifeSkinId } from '../types/game';

const STORAGE_KEY = 'roblox_csgo_parkour_leaderboard_v1';
const USER_BEST_KEY = 'roblox_csgo_parkour_user_best_v1';

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

const DEFAULT_GLOBAL_ENTRIES: LeaderboardEntry[] = [
  {
    id: 'runner_1',
    rank: 1,
    playerName: 's1mple_bhop',
    country: 'Ucrânia',
    countryFlag: '🇺🇦',
    timeSeconds: 72.45,
    formattedTime: '01:12.45',
    rankTier: 'The Global Elite',
    knife: 'butterfly',
    knifeSkin: 'fade',
    deaths: 0,
    maxSpeed: 44.8,
    date: '2026-09-24',
  },
  {
    id: 'runner_2',
    rank: 2,
    playerName: 'Gaules_Tribo',
    country: 'Brasil',
    countryFlag: '🇧🇷',
    timeSeconds: 74.2,
    formattedTime: '01:14.20',
    rankTier: 'The Global Elite',
    knife: 'karambit',
    knifeSkin: 'doppler',
    deaths: 0,
    maxSpeed: 43.5,
    date: '2026-09-26',
  },
  {
    id: 'runner_3',
    rank: 3,
    playerName: 'm0NESY_flick',
    country: 'Rússia',
    countryFlag: '🇷🇺',
    timeSeconds: 75.3,
    formattedTime: '01:15.30',
    rankTier: 'The Global Elite',
    knife: 'karambit',
    knifeSkin: 'tiger_tooth',
    deaths: 0,
    maxSpeed: 45.2,
    date: '2026-09-27',
  },
  {
    id: 'runner_4',
    rank: 4,
    playerName: 'coldzera_jump',
    country: 'Brasil',
    countryFlag: '🇧🇷',
    timeSeconds: 78.9,
    formattedTime: '01:18.90',
    rankTier: 'Supreme Master First Class',
    knife: 'm9_bayonet',
    knifeSkin: 'crimson_web',
    deaths: 1,
    maxSpeed: 41.8,
    date: '2026-09-22',
  },
  {
    id: 'runner_5',
    rank: 5,
    playerName: 'Shroud_Bhop',
    country: 'Canadá',
    countryFlag: '🇨🇦',
    timeSeconds: 82.1,
    formattedTime: '01:22.10',
    rankTier: 'Supreme Master First Class',
    knife: 'butterfly',
    knifeSkin: 'fade',
    deaths: 0,
    maxSpeed: 40.5,
    date: '2026-09-20',
  },
  {
    id: 'runner_6',
    rank: 6,
    playerName: 'ZywOo_Surfer',
    country: 'França',
    countryFlag: '🇫🇷',
    timeSeconds: 85.8,
    formattedTime: '01:25.80',
    rankTier: 'Legendary Eagle',
    knife: 'skeleton',
    knifeSkin: 'fade',
    deaths: 1,
    maxSpeed: 39.4,
    date: '2026-09-18',
  },
  {
    id: 'runner_7',
    rank: 7,
    playerName: 'FalleN_Prof',
    country: 'Brasil',
    countryFlag: '🇧🇷',
    timeSeconds: 89.4,
    formattedTime: '01:29.40',
    rankTier: 'Distinguished Master Guardian',
    knife: 'karambit',
    knifeSkin: 'case_hardened',
    deaths: 2,
    maxSpeed: 38.6,
    date: '2026-09-25',
  },
  {
    id: 'runner_8',
    rank: 8,
    playerName: 'NiKo_Bhop',
    country: 'Bósnia',
    countryFlag: '🇧🇦',
    timeSeconds: 93.1,
    formattedTime: '01:33.10',
    rankTier: 'Master Guardian Elite',
    knife: 'm9_bayonet',
    knifeSkin: 'doppler',
    deaths: 1,
    maxSpeed: 37.9,
    date: '2026-09-23',
  },
  {
    id: 'runner_9',
    rank: 9,
    playerName: 'RobloxSpeed_BR',
    country: 'Brasil',
    countryFlag: '🇧🇷',
    timeSeconds: 98.5,
    formattedTime: '01:38.50',
    rankTier: 'Master Guardian I',
    knife: 'butterfly',
    knifeSkin: 'hyper_beast',
    deaths: 3,
    maxSpeed: 36.2,
    date: '2026-09-28',
  },
  {
    id: 'runner_10',
    rank: 10,
    playerName: 'Tarik_Pro',
    country: 'EUA',
    countryFlag: '🇺🇸',
    timeSeconds: 104.2,
    formattedTime: '01:44.20',
    rankTier: 'Gold Nova Master',
    knife: 'gut_knife',
    knifeSkin: 'tiger_tooth',
    deaths: 2,
    maxSpeed: 35.1,
    date: '2026-09-21',
  },
];

export function getGlobalLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading leaderboard', e);
  }
  return DEFAULT_GLOBAL_ENTRIES;
}

export function getUserBestRun(): LeaderboardEntry | null {
  try {
    const raw = localStorage.getItem(USER_BEST_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return null;
}

export function saveUserRun(params: {
  playerName: string;
  timeSeconds: number;
  rankTierName: string;
  knife: KnifeType;
  knifeSkin: KnifeSkinId;
  deaths: number;
  maxSpeed: number;
}): { newRank: number; isPersonalBest: boolean } {
  const currentLeaderboard = getGlobalLeaderboard().filter(e => !e.isUser);
  const prevBest = getUserBestRun();
  const isPersonalBest = !prevBest || params.timeSeconds < prevBest.timeSeconds;

  const userEntry: LeaderboardEntry = {
    id: 'user_current',
    rank: 0,
    playerName: params.playerName.trim() || 'Você (Player)',
    country: 'Brasil',
    countryFlag: '🇧🇷',
    timeSeconds: params.timeSeconds,
    formattedTime: formatTime(params.timeSeconds),
    rankTier: params.rankTierName,
    knife: params.knife,
    knifeSkin: params.knifeSkin,
    deaths: params.deaths,
    maxSpeed: Math.round(params.maxSpeed * 10) / 10,
    date: new Date().toISOString().split('T')[0],
    isUser: true,
  };

  if (isPersonalBest) {
    localStorage.setItem(USER_BEST_KEY, JSON.stringify(userEntry));
  }

  // Combine and sort by time
  const bestUserEntry = isPersonalBest ? userEntry : prevBest!;
  const combined = [...currentLeaderboard, bestUserEntry].sort((a, b) => a.timeSeconds - b.timeSeconds);

  // Re-assign 1-based ranks
  combined.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));

  const userRank = combined.find(e => e.isUser)?.rank || combined.length;
  return { newRank: userRank, isPersonalBest };
}
