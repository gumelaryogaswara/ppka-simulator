import React from 'react';
import { Volume2, VolumeX, Play, Pause, FastForward, RotateCcw, HelpCircle, ShieldAlert, Train as TrainIcon, Award, Clock, AlertOctagon, Sparkles } from 'lucide-react';
import { GameState, Train } from '../types';

interface DispatcherHUDProps {
  gameState: GameState;
  activeKLB?: Train | null;
  onSpawnKLB?: () => void;
  onTogglePause: () => void;
  onToggleSpeed: () => void;
  onToggleMute: () => void;
  onResetGame: () => void;
  onOpenHelp: () => void;
  onManualHorn: () => void;
  onCenterCamera: () => void;
  onFitStation?: () => void;
  onFocusWest?: () => void;
  onFocusEast?: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const DispatcherHUD: React.FC<DispatcherHUDProps> = ({
  gameState,
  activeKLB,
  onSpawnKLB,
  onTogglePause,
  onToggleSpeed,
  onToggleMute,
  onResetGame,
  onOpenHelp,
  onManualHorn,
  onCenterCamera,
  onFitStation,
  onFocusWest,
  onFocusEast,
  onZoomIn,
  onZoomOut,
}) => {
  // Format waktu stasiun
  const totalSecs = 28800 + Math.floor(gameState.gameTimeSeconds); // Mulai jam 08:00:00
  const hours = Math.floor(totalSecs / 3600) % 24;
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = Math.floor(totalSecs % 60);
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} WIB`;

  return (
    <>
      <header className="bg-slate-900/98 backdrop-blur-md border-b border-slate-800 px-2 sm:px-4 py-1 sm:py-1.5 text-slate-200 z-20 select-none shadow-lg shrink-0">
        {/* ===================== MOBILE VIEW (< md) ===================== */}
        <div className="flex md:hidden flex-col gap-1">
          {/* Row 1: Status Utama (Stasiun, Jam, Nyawa, Level, Skor) */}
          <div className="flex items-center justify-between gap-1 text-xs">
            <div className="flex items-center space-x-1.5 min-w-0">
              <div className="bg-sky-600/20 border border-sky-500/40 p-1 rounded-md shrink-0">
                <TrainIcon className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="flex items-center space-x-1.5 min-w-0">
                <span className="font-bold text-xs tracking-tight text-slate-100 uppercase truncate">
                  PPKA
                </span>
                <span className="text-[10px] font-mono text-sky-400 font-semibold leading-none">
                  {formattedTime}
                </span>
              </div>
            </div>

            {/* Nyawa, Level & Skor */}
            <div className="flex items-center space-x-1 shrink-0">
              {/* Nyawa */}
              <div
                className="flex items-center space-x-0.5 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800"
                title={`Sisa Nyawa: ${gameState.lives}/3`}
              >
                <ShieldAlert
                  className={`w-3 h-3 ${gameState.lives > 0 ? 'text-rose-400' : 'text-slate-600'}`}
                />
                <span className="text-[10px] font-mono font-bold text-rose-300">
                  {gameState.lives}
                </span>
              </div>

              {/* Level */}
              <div className="bg-slate-950 px-1.5 py-0.5 rounded border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300">
                Lv.{gameState.level}
              </div>

              {/* Skor */}
              <div className="bg-slate-950 px-1.5 py-0.5 rounded border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-400 flex items-center space-x-0.5">
                <Award className="w-3 h-3 text-emerald-400" />
                <span>{gameState.score.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Row 2: Kontrol Cepat Mobile */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none py-0.5 text-xs font-mono">
            <div className="flex items-center space-x-1">
              {/* Semboyan 35 */}
              <button
                id="btn-horn-mobile"
                type="button"
                onClick={onManualHorn}
                className="bg-amber-600/25 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-medium transition-colors flex items-center space-x-1 active:scale-95 cursor-pointer min-h-[28px]"
                title="Bunyikan Semboyan 35"
              >
                <span>🎺 S35</span>
              </button>

              {/* Panggil KLB jika ada */}
              {onSpawnKLB && (
                <button
                  id="btn-spawn-klb-mobile"
                  type="button"
                  onClick={onSpawnKLB}
                  disabled={Boolean(activeKLB)}
                  className={`border px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center space-x-1 min-h-[28px] cursor-pointer ${
                    activeKLB
                      ? 'bg-amber-950/40 border-amber-800 text-amber-500/60'
                      : 'bg-amber-500 text-slate-950 border-amber-300 active:scale-95'
                  }`}
                >
                  <Sparkles className="w-2.5 h-2.5 fill-current" />
                  <span>{activeKLB ? 'KLB Aktif' : '+KLB'}</span>
                </button>
              )}

              {/* Fit Stasiun */}
              {onFitStation && (
                <button
                  type="button"
                  onClick={onFitStation}
                  className="bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold min-h-[28px]"
                  title="Tampilkan Seluruh Rel (Fit Layar)"
                >
                  Fit
                </button>
              )}
            </div>

            {/* Simulation controls */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={onToggleSpeed}
                className="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded text-[10px] font-bold min-h-[28px] flex items-center space-x-0.5"
                title="Kecepatan"
              >
                <FastForward className="w-2.5 h-2.5" />
                <span>{gameState.gameSpeed}x</span>
              </button>

              <button
                type="button"
                onClick={onTogglePause}
                className={`px-2 py-0.5 rounded text-[10px] font-bold min-h-[28px] flex items-center space-x-0.5 ${
                  gameState.isPaused
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-200'
                }`}
                title={gameState.isPaused ? 'Lanjut' : 'Jeda'}
              >
                {gameState.isPaused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
              </button>

              <button
                type="button"
                onClick={onToggleMute}
                className="bg-slate-800 text-slate-300 w-7 h-7 rounded flex items-center justify-center"
                title={gameState.isSoundMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
              >
                {gameState.isSoundMuted ? (
                  <VolumeX className="w-3 h-3 text-rose-400" />
                ) : (
                  <Volume2 className="w-3 h-3 text-emerald-400" />
                )}
              </button>

              <button
                type="button"
                onClick={onOpenHelp}
                className="bg-slate-800 text-sky-400 w-7 h-7 rounded flex items-center justify-center"
                title="Bantuan"
              >
                <HelpCircle className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={onResetGame}
                className="bg-slate-800 text-slate-400 w-7 h-7 rounded flex items-center justify-center hover:text-rose-400"
                title="Mulai Ulang"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* ===================== DESKTOP VIEW (>= md) ===================== */}
        <div className="hidden md:flex items-center justify-between gap-3">
          {/* Kiri: Judul Stasiun & Jam Operasional */}
          <div className="flex items-center space-x-3">
            <div className="bg-sky-600/20 border border-sky-500/40 p-1.5 rounded-lg flex items-center justify-center">
              <TrainIcon className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-sm sm:text-base tracking-wider text-slate-100 uppercase font-sans">
                  PPKA Stasiun Sentral
                </h1>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Sistem Interlocking Aktif
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>{formattedTime}</span>
                <span className="text-slate-600">|</span>
                <span>
                  KA Dilayani: <strong className="text-slate-200">{gameState.trainsDispatched}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Tengah: Nyawa, Infinity Level, & Skor */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Nyawa (3 Kesempatan) */}
            <div className="flex items-center space-x-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="text-xs font-mono text-slate-400 mr-0.5">Nyawa:</span>
              {[0, 1, 2].map((idx) => {
                const hasLife = idx < gameState.lives;
                return (
                  <div
                    key={idx}
                    title={hasLife ? 'Nyawa Aktif' : 'Nyawa Hilang'}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                      hasLife
                        ? 'bg-rose-600/20 border border-rose-500 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                        : 'bg-slate-900 border border-slate-800 text-slate-700 opacity-40'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                );
              })}
            </div>

            {/* Mode Infinity Level */}
            <div className="flex flex-col justify-center bg-slate-950/80 px-3 py-1 rounded-lg border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-amber-300/80 uppercase font-bold tracking-wider flex items-center">
                  Mode Infinity <span className="text-amber-400 text-xs ml-1 font-sans">∞</span>
                </span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  Lv. {gameState.level}
                </span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold">
                  x{(1 + (gameState.level - 1) * 0.1).toFixed(1)} Poin
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((gameState.score % 450) / 450) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Skor */}
            <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono text-slate-400">Skor:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm min-w-[50px]">
                {gameState.score.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Kanan: Kontrol Simulasi & Audio */}
          <div className="flex items-center space-x-2">
            {/* Tombol Panggil KLB */}
            {onSpawnKLB && (
              <button
                id="btn-spawn-klb"
                onClick={onSpawnKLB}
                disabled={Boolean(activeKLB)}
                className={`border px-2.5 py-1.5 rounded text-xs font-mono font-bold transition-all flex items-center space-x-1.5 shadow-sm ${
                  activeKLB
                    ? 'bg-amber-950/40 border-amber-800 text-amber-500/60 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 border-amber-300 shadow-amber-500/20 active:scale-95 animate-pulse'
                }`}
                title={activeKLB ? 'KLB sedang aktif melintas di stasiun' : 'Panggil Kereta Luar Biasa'}
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>{activeKLB ? 'KLB Aktif' : 'Panggil KLB'}</span>
              </button>
            )}

            {/* Tombol Klakson Semboyan 35 */}
            <button
              id="btn-horn"
              onClick={onManualHorn}
              className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 px-2.5 py-1.5 rounded text-xs font-mono font-medium transition-colors flex items-center space-x-1 cursor-pointer"
              title="Bunyikan Semboyan 35 (Klakson Lokomotif)"
            >
              <span>🎺 Semboyan 35</span>
            </button>

            {/* Kamera View Presets */}
            <div className="hidden lg:flex items-center space-x-1 bg-slate-950/80 p-0.5 rounded border border-slate-800">
              {onFitStation && (
                <button
                  id="btn-cam-fit"
                  onClick={onFitStation}
                  className="hover:bg-slate-800 text-amber-300 hover:text-amber-200 px-2 py-1 rounded text-[11px] font-mono transition-colors font-bold"
                  title="Tampilkan Seluruh Emplasemen (Fit Layar)"
                >
                  🔍 Fit
                </button>
              )}
              <button
                id="btn-cam-west"
                onClick={onFocusWest}
                className="hover:bg-slate-800 text-slate-300 hover:text-sky-300 px-2 py-1 rounded text-[11px] font-mono transition-colors"
                title="Arahkan Kamera ke Sisi Barat"
              >
                ◀ Barat
              </button>
              <button
                id="btn-center-cam"
                onClick={onCenterCamera}
                className="bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold px-2 py-1 rounded text-[11px] font-mono transition-colors"
                title="Pusatkan Kamera ke Stasiun"
              >
                Stasiun
              </button>
              <button
                id="btn-cam-east"
                onClick={onFocusEast}
                className="hover:bg-slate-800 text-slate-300 hover:text-sky-300 px-2 py-1 rounded text-[11px] font-mono transition-colors"
                title="Arahkan Kamera ke Sisi Timur"
              >
                Timur ▶
              </button>
            </div>

            <div className="flex items-center space-x-0.5">
              <button
                id="btn-zoom-in"
                onClick={onZoomIn}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-7 h-7 rounded text-xs font-mono flex items-center justify-center"
                title="Perbesar Tampilan Rel"
              >
                +
              </button>
              <button
                id="btn-zoom-out"
                onClick={onZoomOut}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-7 h-7 rounded text-xs font-mono flex items-center justify-center"
                title="Perkecil Tampilan Rel"
              >
                -
              </button>
            </div>

            <div className="h-5 w-[1px] bg-slate-800 mx-1" />

            {/* Kecepatan Simulasi */}
            <button
              id="btn-toggle-speed"
              onClick={onToggleSpeed}
              className="bg-slate-800 hover:bg-slate-700 text-sky-300 px-2.5 py-1.5 rounded text-xs font-mono flex items-center space-x-1"
              title="Ubah Kecepatan Simulasi"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>{gameState.gameSpeed}x</span>
            </button>

            {/* Pause / Play */}
            <button
              id="btn-toggle-pause"
              onClick={onTogglePause}
              className={`px-2.5 py-1.5 rounded text-xs font-mono flex items-center space-x-1 transition-colors ${
                gameState.isPaused
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
              title={gameState.isPaused ? 'Lanjutkan Simulasi' : 'Jeda Simulasi'}
            >
              {gameState.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{gameState.isPaused ? 'Lanjut' : 'Jeda'}</span>
            </button>

            {/* Audio Mute */}
            <button
              id="btn-toggle-mute"
              onClick={onToggleMute}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded transition-colors"
              title={gameState.isSoundMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
            >
              {gameState.isSoundMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* Bantuan / Tutorial */}
            <button
              id="btn-open-help"
              onClick={onOpenHelp}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded transition-colors"
              title="Panduan Petugas PPKA"
            >
              <HelpCircle className="w-4 h-4 text-sky-400" />
            </button>

            {/* Restart */}
            <button
              id="btn-reset-game"
              onClick={onResetGame}
              className="bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 p-1.5 rounded transition-colors"
              title="Mulai Ulang Simulasi"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

    {/* Banner Khusus Prioritas KLB Aktif */}
    {activeKLB && (
      <div className="bg-gradient-to-r from-red-950 via-amber-950 to-red-950 border-b border-amber-500/50 text-amber-200 px-4 py-1.5 flex items-center justify-between shadow-md text-xs font-mono z-10 animate-pulse">
        <div className="flex items-center space-x-2">
          <AlertOctagon className="w-4 h-4 text-amber-400 animate-bounce" />
          <span className="font-bold text-amber-300 uppercase tracking-wide">
            [HAK PRIORITAS TERTINGGI] PERJALANAN KERETA LUAR BIASA (KLB) AKTIF:
          </span>
          <span className="font-bold text-white bg-amber-600/30 px-2 py-0.5 rounded border border-amber-500/40">
            {activeKLB.trainNumber} - {activeKLB.name}
          </span>
          <span className="text-amber-300/90 hidden sm:inline">
            | Menuju Jalur {activeKLB.assignedPlatform}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-rose-300 font-semibold text-[11px]">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
          <span>SELURUH KA REGULER DIBERHENTIKAN / TERTAHAN</span>
        </div>
      </div>
    )}
  </>
  );
};
