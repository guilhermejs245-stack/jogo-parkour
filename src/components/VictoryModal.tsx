import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { PlayerCustomization } from '../types/game';
import { formatTime, saveUserRun } from '../game/leaderboard';
import { getRankTier } from '../game/ranks';
import { Trophy, Flame, Zap, ArrowRight, RotateCcw } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  timeSeconds: number;
  deaths: number;
  maxSpeed: number;
  userRP: number;
  customization: PlayerCustomization;
  onPlayAgain: () => void;
  onOpenLeaderboard: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  timeSeconds,
  deaths,
  maxSpeed,
  userRP,
  customization,
  onPlayAgain,
  onOpenLeaderboard,
}) => {
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [isPB, setIsPB] = useState(false);
  const rank = getRankTier(userRP);

  useEffect(() => {
    if (isOpen) {
      // Fire confetti bursts
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 350);

      // Automatically save/update user run
      const result = saveUserRun({
        playerName: customization.nickname,
        timeSeconds,
        rankTierName: rank.name,
        knife: customization.knife,
        knifeSkin: customization.knifeSkin,
        deaths,
        maxSpeed,
      });

      setSubmittedRank(result.newRank);
      setIsPB(result.isPersonalBest);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-neutral-950 border border-amber-500/40 rounded-2xl p-6 md:p-8 flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Golden Trophy Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <Trophy className="w-8 h-8" />
        </div>

        <span className="text-xs font-mono font-semibold uppercase tracking-widest text-amber-400 mb-1">
          PERCURSO COMPLETO FINALIZADO
        </span>

        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white mb-2">
          VITÓRIA NO OBBY 1.25x!
        </h2>

        <p className="text-xs text-neutral-400 mb-6 max-w-sm">
          Você superou todos os 10 stages de parkour extremo com velocidade acelerada em 1.25x e dominou as mecânicas de bhop!
        </p>

        {/* Global Rank Placement Announcement */}
        {submittedRank !== null && (
          <div className="w-full bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 border border-amber-500/40 rounded-xl p-3.5 mb-6">
            <div className="text-xs font-medium text-amber-300">
              {isPB ? '★ Novo Recorde Pessoal Registrado!' : 'Tempo Registrado no Ranking'}
            </div>
            <div className="font-display text-lg font-bold text-white mt-0.5">
              Posição no Ranking Mundial: #{submittedRank}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 w-full mb-6 font-mono-nums">
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-center">
            <span className="text-[11px] text-neutral-400 block font-sans">Tempo Final</span>
            <span className="text-lg md:text-xl font-bold text-white">
              {formatTime(timeSeconds)}
            </span>
          </div>

          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-center">
            <span className="text-[11px] text-neutral-400 block font-sans">Bhop Máximo</span>
            <span className="text-lg md:text-xl font-bold text-cyan-400 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-rose-500" />
              {maxSpeed.toFixed(1)} <span className="text-xs font-normal">u/s</span>
            </span>
          </div>

          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-center">
            <span className="text-[11px] text-neutral-400 block font-sans">Mortes</span>
            <span className="text-lg md:text-xl font-bold text-rose-400">
              {deaths}
            </span>
          </div>
        </div>

        {/* RP & Rank Badge */}
        <div className="w-full flex items-center justify-between p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl mb-6">
          <div className="flex items-center gap-3 text-left">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-neutral-950"
              style={{ backgroundColor: rank.badgeColor }}
            >
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-sm text-white">{rank.name}</div>
              <div className="text-xs text-neutral-400">{rank.division}</div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-emerald-400 font-mono-nums block">+1500 RP</span>
            <span className="text-[11px] text-neutral-500">Bônus Conclusão</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>JOGAR NOVAMENTE</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <span>VER RANKING</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
