/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/engine';
import { GameStats, PlayerCustomization } from './types/game';
import { TopNav } from './components/TopNav';
import { HUD } from './components/HUD';
import { LockerModal } from './components/LockerModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { VictoryModal } from './components/VictoryModal';
import { sound } from './game/audio';

const STORAGE_CUSTOMIZATION_KEY = 'roblox_csgo_customization_v1';

const DEFAULT_CUSTOMIZATION: PlayerCustomization = {
  nickname: 'RobloxBhop_BR',
  knife: 'karambit',
  knifeSkin: 'fade',
  skinTone: '#facc15',
  shirt: 'noob',
  pants: '#1e3a8a',
  hat: 'roblox_cap',
  face: 'smile',
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Customization state
  const [customization, setCustomization] = useState<PlayerCustomization>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOMIZATION_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CUSTOMIZATION;
  });

  // Game stats for HUD
  const [stats, setStats] = useState<GameStats>({
    elapsedSeconds: 0,
    currentStage: 1,
    currentCheckpoint: 1,
    totalCheckpoints: 10,
    deaths: 0,
    currentSpeed: 0,
    maxSpeed: 0,
    bhopStreak: 0,
    rankPoints: 1200,
    isInspecting: false,
    isSlashing: false,
    isGrounded: false,
    cameraMode: 'first_person',
    gameCompleted: false,
  });

  // Pointer lock state
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  // Modals
  const [isLockerOpen, setIsLockerOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);

  // Sound state
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicActive, setIsMusicActive] = useState(false);

  // Toast notification for checkpoint
  const [checkpointToast, setCheckpointToast] = useState<string | null>(null);

  // Initialize GameEngine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, customization, {
      onStatsUpdate: newStats => {
        setStats(newStats);
        setIsPointerLocked(engine.isPointerLocked);
      },
      onVictory: (time, deaths, maxSpeed) => {
        setIsVictoryOpen(true);
        engine.exitPointerLock();
      },
      onCheckpointTrigger: (checkpointId, stageName) => {
        setCheckpointToast(`★ Checkpoint Salvo: Stage ${checkpointId}! (+150 RP)`);
        setTimeout(() => setCheckpointToast(null), 3000);
      },
    });

    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handlePointerLockRequest = () => {
    if (engineRef.current) {
      engineRef.current.requestPointerLock();
    }
  };

  const handleSaveCustomization = (newCustom: PlayerCustomization) => {
    setCustomization(newCustom);
    localStorage.setItem(STORAGE_CUSTOMIZATION_KEY, JSON.stringify(newCustom));
    if (engineRef.current) {
      engineRef.current.updateCustomization(newCustom);
    }
  };

  const handleToggleCamera = () => {
    if (engineRef.current) {
      engineRef.current.toggleCameraMode();
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
  };

  const handleToggleMusic = () => {
    const active = sound.toggleMusic();
    setIsMusicActive(active);
  };

  const handlePlayAgain = () => {
    setIsVictoryOpen(false);
    if (engineRef.current) {
      engineRef.current.restartGame();
      engineRef.current.requestPointerLock();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none">
      {/* 1. TOP NAVIGATION (adheres to 3-zone contract) */}
      <TopNav
        onOpenLocker={() => {
          engineRef.current?.exitPointerLock();
          setIsLockerOpen(true);
        }}
        onOpenLeaderboard={() => {
          engineRef.current?.exitPointerLock();
          setIsLeaderboardOpen(true);
        }}
        cameraMode={stats.cameraMode}
        onToggleCamera={handleToggleCamera}
        isPointerLocked={isPointerLocked}
        onRequestPointerLock={handlePointerLockRequest}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isMusicActive={isMusicActive}
        onToggleMusic={handleToggleMusic}
      />

      {/* 2. THREE.JS 3D CANVAS */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair outline-none"
      />

      {/* 3. CHECKPOINT TOAST BANNER */}
      {checkpointToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-emerald-500/90 text-neutral-950 px-5 py-2.5 rounded-full font-bold text-xs md:text-sm shadow-xl flex items-center gap-2 animate-bounce">
          <span>{checkpointToast}</span>
        </div>
      )}

      {/* 4. IN-GAME HUD & SPEEDOMETER */}
      <HUD
        stats={stats}
        customization={customization}
        isPointerLocked={isPointerLocked}
        onRequestPointerLock={handlePointerLockRequest}
        onInspectKnife={() => engineRef.current?.inspectKnife()}
        onSlashKnife={() => engineRef.current?.slashKnife()}
        onJump={() => engineRef.current?.triggerJump()}
        onSlide={() => engineRef.current?.startSlide()}
        onToggleCamera={handleToggleCamera}
        onResetToCheckpoint={() => engineRef.current?.triggerDeath()}
        onMoveChange={(x, y) => {
          if (engineRef.current) {
            engineRef.current.mobileMoveX = x;
            engineRef.current.mobileMoveY = y;
          }
        }}
        onTouchLook={(dx, dy) => {
          if (engineRef.current) {
            engineRef.current.handleTouchLook(dx, dy);
          }
        }}
      />

      {/* 5. MODALS */}
      <LockerModal
        isOpen={isLockerOpen}
        onClose={() => setIsLockerOpen(false)}
        customization={customization}
        onSave={handleSaveCustomization}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        userRP={stats.rankPoints}
      />

      <VictoryModal
        isOpen={isVictoryOpen}
        timeSeconds={stats.elapsedSeconds}
        deaths={stats.deaths}
        maxSpeed={stats.maxSpeed}
        userRP={stats.rankPoints}
        customization={customization}
        onPlayAgain={handlePlayAgain}
        onOpenLeaderboard={() => {
          setIsVictoryOpen(false);
          setIsLeaderboardOpen(true);
        }}
      />
    </div>
  );
}
