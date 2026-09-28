import React, { useRef, useState, useEffect } from 'react';
import { GameStats, PlayerCustomization } from '../types/game';
import { getRankProgress } from '../game/ranks';
import { formatTime } from '../game/leaderboard';
import { Flame, Compass, RefreshCw, Zap, Shield, ArrowUp } from 'lucide-react';

interface HUDProps {
  stats: GameStats;
  customization: PlayerCustomization;
  isPointerLocked: boolean;
  onRequestPointerLock: () => void;
  onInspectKnife: () => void;
  onSlashKnife: () => void;
  onJump: () => void;
  onSlide: () => void;
  onToggleCamera: () => void;
  onResetToCheckpoint: () => void;
  onMoveChange: (x: number, y: number) => void;
  onTouchLook: (dx: number, dy: number) => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  customization,
  isPointerLocked,
  onRequestPointerLock,
  onInspectKnife,
  onSlashKnife,
  onJump,
  onSlide,
  onToggleCamera,
  onResetToCheckpoint,
  onMoveChange,
  onTouchLook,
}) => {
  const { current: rank, next: nextRank, percent: rankPercent } = getRankProgress(stats.rankPoints);

  // Speedometer color based on calibrated 1.25x threshold (15.0 u/s)
  const speedColor =
    stats.currentSpeed > 20
      ? 'text-rose-400'
      : stats.currentSpeed > 14
      ? 'text-amber-400'
      : stats.currentSpeed > 4
      ? 'text-cyan-400'
      : 'text-neutral-400';

  // Dynamic CS2 crosshair expansion with movement speed
  const crosshairGap = Math.min(14, 5 + stats.currentSpeed * 0.35);

  // Mobile Touch Joystick state
  const [touchActive, setTouchActive] = useState(false);
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const touchStartPos = useRef({ x: 0, y: 0 });

  // Right-screen swipe look tracking
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // Left half = joystick
      if (touch.clientX < window.innerWidth * 0.45 && !touchActive) {
        setTouchActive(true);
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
        setKnobPos({ x: 0, y: 0 });
      }
      // Right half = look
      else if (touch.clientX >= window.innerWidth * 0.45 && lookTouchId.current === null) {
        lookTouchId.current = touch.identifier;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touchActive && touch.clientX < window.innerWidth * 0.5) {
        const dx = touch.clientX - touchStartPos.current.x;
        const dy = touch.clientY - touchStartPos.current.y;
        const dist = Math.hypot(dx, dy);
        const maxRadius = 45;
        const clampedDist = Math.min(dist, maxRadius);
        const angle = Math.atan2(dy, dx);
        const clampedX = Math.cos(angle) * clampedDist;
        const clampedY = Math.sin(angle) * clampedDist;
        setKnobPos({ x: clampedX, y: clampedY });
        onMoveChange(clampedX / maxRadius, -clampedY / maxRadius);
      } else if (lookTouchId.current === touch.identifier) {
        const dX = touch.clientX - lastLookPos.current.x;
        const dY = touch.clientY - lastLookPos.current.y;
        onTouchLook(dX, dY);
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touchActive && touch.clientX < window.innerWidth * 0.5) {
        setTouchActive(false);
        setKnobPos({ x: 0, y: 0 });
        onMoveChange(0, 0);
      }
      if (lookTouchId.current === touch.identifier) {
        lookTouchId.current = null;
      }
    }
  };

  const getKnifeDisplayName = () => {
    const names: Record<string, string> = {
      karambit: 'Karambit',
      butterfly: 'Faca Borboleta (Butterfly)',
      m9_bayonet: 'Baioneta M9',
      skeleton: 'Faca Skeleton',
      gut_knife: 'Faca Gut',
    };
    const skins: Record<string, string> = {
      fade: 'Fade',
      doppler: 'Doppler Phase 2',
      tiger_tooth: 'Tiger Tooth',
      crimson_web: 'Crimson Web',
      case_hardened: 'Case Hardened (Blue Gem)',
      hyper_beast: 'Hyper Beast',
      asiimov: 'Asiimov',
    };
    return `★ ${names[customization.knife] || 'Faca'} | ${skins[customization.knifeSkin] || 'Padrão'}`;
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 md:p-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. TOP STATUS BAR (Below Header) */}
      <div className="mt-14 flex items-start justify-between w-full max-w-7xl mx-auto">
        {/* Left: Speedrun Timer & Stage Indicator */}
        <div className="flex flex-col gap-1.5 bg-neutral-950/75 backdrop-blur-md border border-neutral-800/80 px-4 py-3 rounded-xl shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Tempo Speedrun
            </span>
            <span className="text-xs text-neutral-500">·</span>
            <span className="text-xs text-emerald-400 font-medium">1.25x Ativado</span>
          </div>

          <div className="font-mono-nums text-2xl md:text-3xl font-bold tracking-tight text-white">
            {formatTime(stats.elapsedSeconds)}
          </div>

          <div className="flex items-center gap-3 pt-1 border-t border-neutral-800 text-xs text-neutral-300">
            <span>
              Stage <strong className="text-amber-400 font-mono-nums">{stats.currentStage}</strong>/10
            </span>
            <span className="text-neutral-600">·</span>
            <span>
              Checkpoint <strong className="text-cyan-400 font-mono-nums">{stats.currentCheckpoint}</strong>
            </span>
            <span className="text-neutral-600">·</span>
            <span>
              Mortes: <strong className="text-rose-400 font-mono-nums">{stats.deaths}</strong>
            </span>
          </div>
        </div>

        {/* Center: Tactical Dynamic CS2 Crosshair */}
        {isPointerLocked && stats.cameraMode === 'first_person' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
            {/* Center dot */}
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_6px_#34d399]" />
            {/* Dynamic expanding cross arms */}
            <div
              className="absolute w-0.5 h-2 bg-emerald-400/90 shadow-[0_0_4px_#34d399]"
              style={{ bottom: `${crosshairGap}px` }}
            />
            <div
              className="absolute w-0.5 h-2 bg-emerald-400/90 shadow-[0_0_4px_#34d399]"
              style={{ top: `${crosshairGap}px` }}
            />
            <div
              className="absolute h-0.5 w-2 bg-emerald-400/90 shadow-[0_0_4px_#34d399]"
              style={{ right: `${crosshairGap}px` }}
            />
            <div
              className="absolute h-0.5 w-2 bg-emerald-400/90 shadow-[0_0_4px_#34d399]"
              style={{ left: `${crosshairGap}px` }}
            />
          </div>
        )}

        {/* Right: Competitive Rank Card & RP Progress */}
        <div className="flex flex-col items-end gap-1 bg-neutral-950/75 backdrop-blur-md border border-neutral-800/80 px-4 py-3 rounded-xl shadow-lg">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="font-display text-sm font-bold tracking-wide" style={{ color: rank.badgeColor }}>
              {rank.name}
            </span>
            <span className="text-xs text-neutral-400 font-mono-nums">
              ({stats.rankPoints} RP)
            </span>
          </div>

          {/* RP Progress Bar */}
          <div className="w-36 md:w-48 h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${rankPercent}%`,
                backgroundColor: rank.badgeColor,
                boxShadow: `0 0 8px ${rank.badgeColor}`,
              }}
            />
          </div>

          <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
            {nextRank ? (
              <>
                <span>Próximo: {nextRank.name}</span>
                <span className="text-neutral-500">({rankPercent}%)</span>
              </>
            ) : (
              <span className="text-amber-400 font-semibold">★ Rank Máximo Alcançado!</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. CENTER CLICK TO PLAY OVERLAY (If not pointer locked) */}
      {!isPointerLocked && !stats.gameCompleted && (
        <div className="self-center my-auto flex flex-col items-center justify-center p-6 bg-neutral-950/90 backdrop-blur-md border border-amber-500/30 rounded-2xl shadow-2xl text-center max-w-md pointer-events-auto">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3 text-amber-400">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-1">
            ROBLOX PARKOUR 1.25x SPEED
          </h2>
          <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
            Física acelerada em 1.25x com bunny hopping, facas de CS:GO com inspeção e
            manobras autênticas. Trave o mouse para ter mira livre total!
          </p>

          <button
            onClick={onRequestPointerLock}
            className="w-full py-3 px-6 rounded-xl font-display font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-950 hover:brightness-110 active:scale-95 transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <span>CLIQUE PARA COMEÇAR</span>
            <ArrowUp className="w-4 h-4 rotate-45" />
          </button>

          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-neutral-400 w-full pt-3 border-t border-neutral-800 text-left">
            <div><strong className="text-neutral-200">WASD</strong>: Mover</div>
            <div><strong className="text-neutral-200">Espaço</strong>: Pular / Bhop</div>
            <div><strong className="text-neutral-200">F</strong>: Inspecionar Faca</div>
            <div><strong className="text-neutral-200">C</strong>: Deslizar (Slide)</div>
            <div><strong className="text-neutral-200">Clique Esq.</strong>: Cortar</div>
            <div><strong className="text-neutral-200">V</strong>: 1ª / 3ª Pessoa</div>
          </div>
        </div>
      )}

      {/* 3. BOTTOM HUD (Speedometer & Knife Display & Controls) */}
      <div className="flex items-end justify-between w-full max-w-7xl mx-auto">
        {/* Left: Speedometer Gauge (CS:GO Bhop Meter) */}
        <div className="flex flex-col gap-1 bg-neutral-950/75 backdrop-blur-md border border-neutral-800/80 px-4 py-3 rounded-xl shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Velocímetro 1.25x
              </span>
            </div>
            {stats.bhopStreak > 1 && (
              <div className="flex items-center gap-1 text-xs font-bold text-rose-400 animate-bounce">
                <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>Bhop x{stats.bhopStreak}!</span>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className={`font-mono-nums text-3xl md:text-4xl font-black ${speedColor}`}>
              {stats.currentSpeed.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-neutral-400">u/s</span>
          </div>

          {/* Speed Indicator Bar */}
          <div className="w-40 md:w-52 h-2 bg-neutral-800 rounded-full overflow-hidden mt-0.5">
            <div
              className={`h-full transition-all duration-100 rounded-full ${
                stats.currentSpeed > 20
                  ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
                  : stats.currentSpeed > 14
                  ? 'bg-amber-400 shadow-[0_0_8px_#facc15]'
                  : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, (stats.currentSpeed / 25) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-neutral-500">
            <span>0</span>
            <span className="text-amber-400 font-bold">1.25x (15.0)</span>
            <span>25 Max</span>
          </div>
        </div>

        {/* Center: Quick action bar on Mobile */}
        <div className="lg:hidden flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onJump}
            className="w-12 h-12 rounded-xl bg-amber-500 text-neutral-950 font-bold flex items-center justify-center shadow-lg active:scale-95"
            title="Pular"
          >
            PULO
          </button>
          <button
            onClick={onSlide}
            className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-cyan-400 font-bold flex items-center justify-center shadow-lg active:scale-95"
            title="Deslizar"
          >
            SLIDE
          </button>
          <button
            onClick={onInspectKnife}
            className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-amber-400 font-bold flex items-center justify-center shadow-lg active:scale-95"
            title="Inspecionar"
          >
            FACA
          </button>
        </div>

        {/* Right: Knife Equip Card with Inspect Prompt */}
        <div className="flex flex-col items-end gap-1.5 bg-neutral-950/75 backdrop-blur-md border border-neutral-800/80 px-4 py-3 rounded-xl shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              {getKnifeDisplayName()}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={onInspectKnife}
              className={`pointer-events-auto px-3 py-1 rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                stats.isInspecting
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${stats.isInspecting ? 'animate-spin' : ''}`} />
              <span>[F] Inspecionar</span>
            </button>

            <button
              onClick={onSlashKnife}
              className="pointer-events-auto px-3 py-1 rounded font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors cursor-pointer"
            >
              [Click] Cortar
            </button>
          </div>

          <div className="text-[11px] text-neutral-400 flex items-center gap-2">
            <span>Bônus: <strong>+25% Velocidade</strong></span>
            <span>·</span>
            <span>Raridade: <strong>Covert ★</strong></span>
          </div>
        </div>
      </div>

      {/* 4. Controls Footer Helper */}
      <div className="hidden md:flex justify-center items-center gap-3 text-xs text-neutral-400 py-1 font-mono">
        <span>WASD: Mover</span>
        <span>·</span>
        <span>Espaço: Bhop / Salto</span>
        <span>·</span>
        <span>C: Deslizar</span>
        <span>·</span>
        <span>Shift: Sprint 1.25x</span>
        <span>·</span>
        <span>F: Inspecionar Faca</span>
        <span>·</span>
        <span>V: Alternar Câmera</span>
        <span>·</span>
        <span>R: Checkpoint</span>
      </div>
    </div>
  );
};
