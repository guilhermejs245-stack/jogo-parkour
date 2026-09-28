export type KnifeType = 'karambit' | 'butterfly' | 'm9_bayonet' | 'skeleton' | 'gut_knife';

export type KnifeSkinId =
  | 'fade'
  | 'doppler'
  | 'tiger_tooth'
  | 'crimson_web'
  | 'case_hardened'
  | 'hyper_beast'
  | 'asiimov';

export interface KnifeDef {
  id: KnifeType;
  name: string;
  category: 'Karambit' | 'Butterfly' | 'Bayonet' | 'Skeleton' | 'Gut Knife';
  description: string;
  rarity: 'Covert' | 'Extraordinary';
  inspectType: 'ring_spin' | 'butterfly_flip' | 'tactical_twirl' | 'skeleton_roll';
  speedBonus: number; // 1.25x multiplier
}

export interface KnifeSkinDef {
  id: KnifeSkinId;
  name: string;
  themeColor: string;
  glowColor: string;
  rarity: 'Mil-Spec' | 'Restricted' | 'Classified' | 'Covert';
  description: string;
}

export interface CharacterSkin {
  id: string;
  name: string;
  category: 'outfit' | 'hat' | 'skin_tone' | 'face';
  value: string;
  description: string;
  previewColor?: string;
}

export interface PlayerCustomization {
  nickname: string;
  knife: KnifeType;
  knifeSkin: KnifeSkinId;
  skinTone: string;
  shirt: string;
  pants: string;
  hat: string;
  face: string;
}

export interface RankTier {
  id: string;
  name: string;
  minRP: number;
  maxRP: number;
  badgeColor: string;
  accentColor: string;
  division: string;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  playerName: string;
  country: string;
  countryFlag: string;
  timeSeconds: number;
  formattedTime: string;
  rankTier: string;
  knife: KnifeType;
  knifeSkin: KnifeSkinId;
  deaths: number;
  maxSpeed: number;
  date: string;
  isUser?: boolean;
}

export interface StageInfo {
  id: number;
  name: string;
  subtitle: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil' | 'Extremo' | 'Global Elite';
  checkpointsCount: number;
  color: string;
}

export interface GameStats {
  elapsedSeconds: number;
  currentStage: number;
  currentCheckpoint: number;
  totalCheckpoints: number;
  deaths: number;
  currentSpeed: number;
  maxSpeed: number;
  bhopStreak: number;
  rankPoints: number;
  isInspecting: boolean;
  isSlashing: boolean;
  isGrounded: boolean;
  cameraMode: 'first_person' | 'third_person';
  gameCompleted: boolean;
}
