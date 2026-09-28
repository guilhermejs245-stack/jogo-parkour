import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { KnifeType, KnifeSkinId, PlayerCustomization } from '../types/game';
import { createKnifeModel } from '../game/knives';
import { RobloxCharacter } from '../game/character';
import { X, Check, Sparkles, User, ShieldAlert, Disc } from 'lucide-react';

interface LockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customization: PlayerCustomization;
  onSave: (customization: PlayerCustomization) => void;
}

const KNIVES: { id: KnifeType; name: string; desc: string; inspectName: string }[] = [
  { id: 'karambit', name: 'Karambit', desc: 'Lâmina curva em garra com anel para o dedo indicador. Inspeção com giro contínuo de 720°!', inspectName: 'Giro no Anel' },
  { id: 'butterfly', name: 'Faca Butterfly', desc: 'Faca balisong de dois cabos com manobras de abertura e fechamento acrobáticas.', inspectName: 'Flips Balisong' },
  { id: 'm9_bayonet', name: 'Baioneta M9', desc: 'Lâmina tática robusta com serra dorsal e anel de acoplamento militar.', inspectName: 'Giro Tático' },
  { id: 'skeleton', name: 'Faca Skeleton', desc: 'Lâmina esqueletizada leve com furo central para rotação nos dedos.', inspectName: 'Roll no Furo' },
  { id: 'gut_knife', name: 'Faca Gut', desc: 'Lâmina pronunciada com o clássico gancho superior de caça.', inspectName: 'Giro no Dedo' },
];

const SKINS: { id: KnifeSkinId; name: string; desc: string; rarity: string; color: string }[] = [
  { id: 'fade', name: 'Fade', desc: 'Gradiente icônico de amarelo âmbar para rosa choque e ponta azul real.', rarity: 'Covert ★', color: '#ec4899' },
  { id: 'doppler', name: 'Doppler Phase 2', desc: 'Nebulosa cósmica de rubi rosa brilhante e safira profunda.', rarity: 'Covert ★', color: '#f43f5e' },
  { id: 'tiger_tooth', name: 'Tiger Tooth', desc: 'Acabamento em ouro anodizado com listras negras de predador.', rarity: 'Covert ★', color: '#f59e0b' },
  { id: 'crimson_web', name: 'Crimson Web', desc: 'Fundo vermelho laca de alta densidade com teias de aranha intrincadas.', rarity: 'Classified', color: '#ef4444' },
  { id: 'case_hardened', name: 'Case Hardened (Blue Gem)', desc: 'Aço temperado a altas temperaturas com manchas de pátina azul puro.', rarity: 'Classified', color: '#38bdf8' },
  { id: 'hyper_beast', name: 'Hyper Beast', desc: 'Arte psicodélica vibrante inspirada em mandíbulas cibernéticas.', rarity: 'Covert ★', color: '#a855f7' },
  { id: 'asiimov', name: 'Asiimov', desc: 'Design futurista geométrico em branco espacial e faixas laranja de alerta.', rarity: 'Classified', color: '#f97316' },
];

const SKIN_TONES = [
  { id: '#facc15', name: 'Amarelo Roblox Clássico', color: '#facc15' },
  { id: '#fed7aa', name: 'Tom Claro', color: '#fed7aa' },
  { id: '#d97706', name: 'Bronzeado', color: '#d97706' },
  { id: '#78350f', name: 'Escuro', color: '#78350f' },
  { id: '#06b6d4', name: 'Ciano Neon Cyborg', color: '#06b6d4' },
  { id: '#fbbf24', name: 'Dourado Campeão', color: '#fbbf24' },
];

const SHIRTS = [
  { id: 'noob', name: 'Noob Clássico (Azul)', desc: 'Camisa azul clássica com logotipo Roblox' },
  { id: 'guest666', name: 'Guest 666', desc: 'Moletom negro com emblema vermelho 666' },
  { id: 'csgo_t', name: 'Terrorista CS:GO', desc: 'Jaqueta oliva tática com coldres' },
  { id: 'csgo_ct', name: 'Contra-Terrorista SWAT', desc: 'Colete azul marinho POLICE' },
  { id: 'hyper_beast_shirt', name: 'Hyper Beast Neon', desc: 'Gradiente cibernético de alta velocidade' },
  { id: 'gold_vip', name: 'VIP Speedrunner Gold', desc: 'Ouro maciço para quem lidera o ranking' },
];

const PANTS = [
  { id: '#1e3a8a', name: 'Jeans Azul Clássico', color: '#1e3a8a' },
  { id: '#15803d', name: 'Verde Noob Clássico', color: '#15803d' },
  { id: '#18181b', name: 'Calça Tática Preta', color: '#18181b' },
  { id: '#365314', name: 'Camuflagem Militar', color: '#365314' },
  { id: '#b91c1c', name: 'Vermelho Carmesim', color: '#b91c1c' },
  { id: '#ca8a04', name: 'Dourado Nobre', color: '#ca8a04' },
];

const HATS = [
  { id: 'none', name: 'Nenhum' },
  { id: 'roblox_cap', name: 'Boné Roblox Vermelho' },
  { id: 'halo', name: 'Auréola Dourada de Anjo' },
  { id: 'valkyrie', name: 'Elmo de Valquíria com Asas' },
  { id: 'headphones', name: 'Headset Gamer Tático Neon' },
  { id: 'horns', name: 'Chifres de Demônio' },
];

const FACES = [
  { id: 'smile', name: 'Sorriso Clássico' },
  { id: 'epic', name: 'Epic / Awesome Face' },
  { id: 'chill', name: 'Chill (Óculos Escuros)' },
  { id: 'determined', name: 'Determinado / Pro Player' },
];

export const LockerModal: React.FC<LockerModalProps> = ({
  isOpen,
  onClose,
  customization,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'knives' | 'skins' | 'character'>('knives');
  const [previewCustom, setPreviewCustom] = useState<PlayerCustomization>(customization);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const previewModelGroup = useRef<THREE.Group>(new THREE.Group());
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setPreviewCustom(customization);
  }, [customization, isOpen]);

  // 3D Preview Engine
  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(0, 0, 1.2);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    fillLight.position.set(-2, -1, 2);
    scene.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    scene.add(previewModelGroup.current);

    // Animation Loop (slow rotating showcase)
    let rot = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      rot += 0.015;
      previewModelGroup.current.rotation.y = rot;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [isOpen]);

  // Update 3D Preview Model when tab or customization changes
  useEffect(() => {
    if (!isOpen || !sceneRef.current || !cameraRef.current) return;

    while (previewModelGroup.current.children.length > 0) {
      previewModelGroup.current.remove(previewModelGroup.current.children[0]);
    }

    if (activeTab === 'character') {
      const char = new RobloxCharacter(previewCustom);
      char.group.position.set(0, -0.7, 0);
      char.group.scale.set(0.75, 0.75, 0.75);
      previewModelGroup.current.add(char.group);
      cameraRef.current.position.set(0, 0, 2.3);
    } else {
      // Knife preview
      const knifeObj = createKnifeModel(previewCustom.knife, previewCustom.knifeSkin);
      knifeObj.root.scale.set(3.2, 3.2, 3.2);
      knifeObj.root.position.set(0, -0.15, 0);
      knifeObj.root.rotation.x = 0.2;
      previewModelGroup.current.add(knifeObj.root);
      cameraRef.current.position.set(0, 0, 1.1);
    }
  }, [isOpen, activeTab, previewCustom]);

  if (!isOpen) return null;

  const handleApply = () => {
    onSave(previewCustom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[85vh] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-display text-lg font-bold text-white tracking-wide">
              LOCKER DE FACAS & SKINS CS:GO
            </h2>
          </div>

          {/* Segmented Tab Controls */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
            <button
              onClick={() => setActiveTab('knives')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'knives' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Facas CS:GO
            </button>
            <button
              onClick={() => setActiveTab('skins')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'skins' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Pinturas (Skins)
            </button>
            <button
              onClick={() => setActiveTab('character')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'character' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Avatar Roblox
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left Selection Grid + Right 3D Showcase */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Panel: Options */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Nickname Field */}
            <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl">
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Seu Nickname (Ranking Global)
              </label>
              <input
                type="text"
                maxLength={20}
                value={previewCustom.nickname}
                onChange={e => setPreviewCustom({ ...previewCustom, nickname: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                placeholder="Ex: ProRunner_BR"
              />
            </div>

            {/* TAB 1: KNIVES */}
            {activeTab === 'knives' && (
              <div className="space-y-4">
                <div className="text-xs text-neutral-400">
                  Todas as facas concedem <strong>+25% de velocidade (1.25x)</strong> no parkour e animação exclusiva ao pressionar <strong>[F]</strong>.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {KNIVES.map(knife => {
                    const isSelected = previewCustom.knife === knife.id;
                    return (
                      <div
                        key={knife.id}
                        onClick={() => setPreviewCustom({ ...previewCustom, knife: knife.id })}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-display font-bold text-sm text-white">
                              {knife.name}
                            </h4>
                            {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                          </div>
                          <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                            {knife.desc}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-neutral-800 text-neutral-500">
                          <span>Inspeção: <strong className="text-neutral-300">{knife.inspectName}</strong></span>
                          <span className="text-amber-400 font-bold">1.25x Boost</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: SKINS */}
            {activeTab === 'skins' && (
              <div className="space-y-4">
                <div className="text-xs text-neutral-400">
                  Padrões icônicos de CS:GO com gradientes metálicos e reflexos de verniz de alta fidelidade.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SKINS.map(skin => {
                    const isSelected = previewCustom.knifeSkin === skin.id;
                    return (
                      <div
                        key={skin.id}
                        onClick={() => setPreviewCustom({ ...previewCustom, knifeSkin: skin.id })}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-display font-bold text-sm" style={{ color: skin.color }}>
                              {skin.name}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                          </div>
                          <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                            {skin.desc}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-neutral-800">
                          <span className="font-semibold text-rose-400">{skin.rarity}</span>
                          <span className="text-neutral-500">Metalness 88%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: CHARACTER CUSTOMIZATION */}
            {activeTab === 'character' && (
              <div className="space-y-6">
                {/* Skin Tone */}
                <div>
                  <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
                    Tom de Pele
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {SKIN_TONES.map(st => (
                      <button
                        key={st.id}
                        onClick={() => setPreviewCustom({ ...previewCustom, skinTone: st.id })}
                        className={`w-9 h-9 rounded-lg border-2 transition-transform cursor-pointer flex items-center justify-center ${
                          previewCustom.skinTone === st.id ? 'border-amber-400 scale-110 shadow-lg' : 'border-neutral-700 hover:scale-105'
                        }`}
                        style={{ backgroundColor: st.color }}
                        title={st.name}
                      >
                        {previewCustom.skinTone === st.id && <Check className="w-4 h-4 text-neutral-950 font-bold" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Torso / Shirt */}
                <div>
                  <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
                    Camisa / Torso
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {SHIRTS.map(sh => (
                      <button
                        key={sh.id}
                        onClick={() => setPreviewCustom({ ...previewCustom, shirt: sh.id })}
                        className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all cursor-pointer ${
                          previewCustom.shirt === sh.id
                            ? 'bg-amber-500/15 border-amber-500 text-white'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-850'
                        }`}
                      >
                        <div className="font-semibold">{sh.name}</div>
                        <div className="text-[11px] text-neutral-500">{sh.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pants */}
                <div>
                  <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
                    Calças
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {PANTS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setPreviewCustom({ ...previewCustom, pants: p.id })}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                          previewCustom.pants === p.id
                            ? 'bg-amber-500/15 border-amber-500 text-white'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hats & Accessories */}
                <div>
                  <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
                    Acessório / Chapéu
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {HATS.map(h => (
                      <button
                        key={h.id}
                        onClick={() => setPreviewCustom({ ...previewCustom, hat: h.id })}
                        className={`p-2 rounded-lg border text-left text-xs font-medium transition-all cursor-pointer ${
                          previewCustom.hat === h.id
                            ? 'bg-amber-500/15 border-amber-500 text-white'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {h.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Faces */}
                <div>
                  <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
                    Expressão Facial
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {FACES.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setPreviewCustom({ ...previewCustom, face: f.id })}
                        className={`p-2 rounded-lg border text-left text-xs font-medium transition-all cursor-pointer ${
                          previewCustom.face === f.id
                            ? 'bg-amber-500/15 border-amber-500 text-white'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: 3D Showcase Preview */}
          <div className="w-full lg:w-80 h-64 lg:h-auto border-t lg:border-t-0 lg:border-l border-neutral-800 bg-neutral-900/30 flex flex-col p-6 items-center justify-between">
            <div className="w-full text-center">
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
                Visualização 3D em Tempo Real
              </span>
            </div>

            <div className="w-full flex-1 relative flex items-center justify-center my-2">
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full max-h-72 rounded-xl"
              />
            </div>

            <div className="w-full pt-4 border-t border-neutral-800/80 flex flex-col gap-2">
              <button
                onClick={handleApply}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-all cursor-pointer shadow-lg active:scale-95"
              >
                EQUIPAR & SALVAR
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
