import React from 'react';
import { Volume2, VolumeX, Music, Trophy, Briefcase, Eye } from 'lucide-react';
import { sound } from '../game/audio';

interface TopNavProps {
  onOpenLocker: () => void;
  onOpenLeaderboard: () => void;
  cameraMode: 'first_person' | 'third_person';
  onToggleCamera: () => void;
  isPointerLocked: boolean;
  onRequestPointerLock: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isMusicActive: boolean;
  onToggleMusic: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenLocker,
  onOpenLeaderboard,
  cameraMode,
  onToggleCamera,
  isPointerLocked,
  onRequestPointerLock,
  isMuted,
  onToggleMute,
  isMusicActive,
  onToggleMusic,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3.5 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/80 text-neutral-100">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <span className="font-display text-base md:text-lg font-bold tracking-wider text-amber-400 drop-shadow-sm whitespace-nowrap">
          ROBLOX CS:GO PARKOUR 1.25x
        </span>
        <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded">
          BHOP SPEED
        </span>
      </div>

      {/* Zone 2: 4-6 clean text navigation links / actions */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-neutral-300">
        <button
          onClick={onOpenLocker}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          <Briefcase className="w-4 h-4 text-cyan-400" />
          <span>Locker de Facas & Skins</span>
        </button>

        <button
          onClick={onOpenLeaderboard}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Ranks Globais</span>
        </button>

        <button
          onClick={onToggleCamera}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>{cameraMode === 'first_person' ? 'Visão: 1ª Pessoa [V]' : 'Visão: 3ª Pessoa [V]'}</span>
        </button>

        <button
          onClick={onToggleMusic}
          className={`flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            isMusicActive ? 'text-violet-400 hover:text-violet-300' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>{isMusicActive ? 'Música Synth [ON]' : 'Música Synth [OFF]'}</span>
        </button>

        <button
          onClick={onToggleMute}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer whitespace-nowrap text-neutral-400"
          title={isMuted ? 'Desmutar efeitos' : 'Mutar efeitos'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          <span>{isMuted ? 'Mudo' : 'Som FX'}</span>
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenLocker}
          className="lg:hidden p-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
          title="Locker"
        >
          <Briefcase className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={onOpenLeaderboard}
          className="lg:hidden p-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
          title="Ranks Globais"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
        </button>

        <button
          onClick={onRequestPointerLock}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-sm ${
            isPointerLocked
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold active:scale-95'
          }`}
        >
          {isPointerLocked ? '● Jogando (ESC para soltar)' : '▶ Clique p/ Jogar'}
        </button>
      </div>
    </header>
  );
};
