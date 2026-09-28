import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types/game';
import { getGlobalLeaderboard, getUserBestRun } from '../game/leaderboard';
import { RANK_TIERS, getRankTier } from '../game/ranks';
import { Trophy, X, Shield, Zap, Medal } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRP: number;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  userRP,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'ranks'>('leaderboard');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const userBest = getUserBestRun();
  const currentRank = getRankTier(userRP);

  useEffect(() => {
    if (isOpen) {
      setEntries(getGlobalLeaderboard());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[80vh] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-display text-lg font-bold text-white tracking-wide">
              SISTEMA DE RANKS GLOBAL CS:GO & ROBLOX
            </h2>
          </div>

          {/* Segmented Controls */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'leaderboard' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Ranking Mundial
            </button>
            <button
              onClick={() => setActiveTab('ranks')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'ranks' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Patentes & Ranks (10 Tiers)
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Status Banner */}
        <div className="px-6 py-3 bg-neutral-900/40 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentRank.badgeColor }} />
            <span className="text-neutral-300">
              Sua Patente Atual: <strong className="font-display text-white">{currentRank.name}</strong> ({currentRank.division})
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-amber-400 font-mono-nums font-semibold">{userRP} Pontos de Rank (RP)</span>
          </div>

          <div className="flex items-center gap-2 text-neutral-400">
            <span>Melhor Tempo:</span>
            <span className="font-mono-nums font-bold text-white">
              {userBest ? userBest.formattedTime : 'Ainda não completou'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'leaderboard' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <p>Speedrunners verificados no percurso completo Obby com física 1.25x:</p>
                <span className="font-mono">Tempo oficial</span>
              </div>

              {/* Table */}
              <div className="border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900/80 text-neutral-400 font-semibold border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Speedrunner</th>
                      <th className="py-3 px-4">Patente CS:GO</th>
                      <th className="py-3 px-4">Faca / Skin</th>
                      <th className="py-3 px-4 text-center">Mortes</th>
                      <th className="py-3 px-4 text-center">Bhop Máx</th>
                      <th className="py-3 px-4 text-right">Tempo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono-nums">
                    {entries.map(entry => {
                      const isTop3 = entry.rank <= 3;
                      const isUser = entry.isUser;
                      return (
                        <tr
                          key={entry.id}
                          className={`transition-colors ${
                            isUser
                              ? 'bg-amber-500/15 text-amber-200 font-semibold'
                              : 'hover:bg-neutral-900/50 text-neutral-300'
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            {isTop3 ? (
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold ${
                                  entry.rank === 1
                                    ? 'bg-amber-400 text-neutral-950'
                                    : entry.rank === 2
                                    ? 'bg-slate-300 text-neutral-950'
                                    : 'bg-amber-700 text-white'
                                }`}
                              >
                                {entry.rank}
                              </span>
                            ) : (
                              <span className="text-neutral-500">{entry.rank}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-sans font-medium text-white flex items-center gap-2">
                            <span>{entry.countryFlag}</span>
                            <span>{entry.playerName}</span>
                            {isUser && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950 font-bold uppercase tracking-wider">
                                VOCÊ
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span className="text-neutral-300 font-medium">{entry.rankTier}</span>
                          </td>
                          <td className="py-3 px-4 capitalize font-sans text-neutral-400">
                            {entry.knife.replace('_', ' ')} · {entry.knifeSkin.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-4 text-center text-neutral-400">
                            {entry.deaths}
                          </td>
                          <td className="py-3 px-4 text-center text-cyan-400">
                            {entry.maxSpeed} u/s
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-white text-sm">
                            {entry.formattedTime}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* TAB: CS:GO RANKS LADDER */
            <div className="space-y-4">
              <p className="text-xs text-neutral-400">
                Evolua nas patentes competitivas ganhando RP ao completar checkpoints, bater recordes de velocidade no bhop e finalizar o obby sem mortes.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {RANK_TIERS.map(tier => {
                  const isCurrent = currentRank.id === tier.id;
                  return (
                    <div
                      key={tier.id}
                      className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'bg-neutral-900/40 border-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-md"
                          style={{
                            backgroundColor: tier.badgeColor,
                            color: '#09090b',
                          }}
                        >
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-sm text-white">
                              {tier.name}
                            </h4>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-neutral-950 font-bold uppercase">
                                Sua Patente
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-neutral-400 font-sans">
                            {tier.division}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-amber-400">
                          {tier.minRP}+ RP
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {tier.maxRP === 999999 ? 'Patente Suprema' : `Até ${tier.maxRP} RP`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
