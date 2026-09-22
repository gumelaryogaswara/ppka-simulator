import React from 'react';
import { RotateCcw, AlertOctagon, Trophy, Award, CheckCircle2 } from 'lucide-react';
import { GameState, getInfinityRank } from '../types';

interface GameOverModalProps {
  isOpen: boolean;
  gameState: GameState;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  gameState,
  onRestart,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-rose-600/50 rounded-2xl max-w-md w-full p-6 text-center shadow-[0_0_50px_rgba(225,29,72,0.25)] animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-rose-600/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/40">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold font-sans text-slate-100 uppercase tracking-wide mb-1">
          Dinas PPKA Berakhir!
        </h2>
        <p className="text-xs text-rose-400 font-mono mb-6">
          Seluruh 3 nyawa habis akibat insiden operasional di stasiun.
        </p>

        {/* Statistik Permainan */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 mb-6 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
            <span className="text-slate-400">Skor Akhir:</span>
            <strong className="text-emerald-400 text-base font-bold">
              {gameState.score.toLocaleString()} Poin
            </strong>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
            <span className="text-slate-400">Tingkat Infinity Tercapai:</span>
            <strong className="text-amber-400 text-sm font-bold flex items-center">
              Level {gameState.level} <span className="ml-1 text-base">∞</span>
            </strong>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
            <span className="text-slate-400">Kereta Berhasil Dilayani:</span>
            <strong className="text-sky-400 text-sm">{gameState.trainsDispatched} Rangkaian</strong>
          </div>
          <div className="pt-1 text-left">
            <span className="text-slate-500 text-[10px] block">GELAR PRESTASI OPERASIONAL:</span>
            <span className="text-purple-300 font-bold text-xs flex items-center mt-0.5">
              <Award className="w-4 h-4 mr-1.5 text-purple-400 shrink-0" />
              {getInfinityRank(gameState.level, gameState.score)}
            </span>
          </div>
        </div>

        {/* Tombol Main Lagi */}
        <button
          onClick={onRestart}
          className="w-full py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-mono font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Mulai Dinas Baru (Ulangi)</span>
        </button>
      </div>
    </div>
  );
};
