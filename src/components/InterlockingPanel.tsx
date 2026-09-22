import React from 'react';
import { SwitchNode, SignalNode, SignalAspect } from '../types';
import { GitBranch, Radio, Navigation, ArrowRight, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface InterlockingPanelProps {
  switches: SwitchNode[];
  signals: SignalNode[];
  onToggleSwitch: (switchId: string) => void;
  onSetSignalAspect: (signalId: string, aspect: SignalAspect) => void;
  onSetRouteToPlatform?: (direction: 'barat_ke_timur' | 'timur_ke_barat', platform: number) => void;
  isFullTab?: boolean;
}

export const InterlockingPanel: React.FC<InterlockingPanelProps> = ({
  switches,
  signals,
  onToggleSwitch,
  onSetSignalAspect,
  onSetRouteToPlatform,
  isFullTab = false,
}) => {
  // If rendered as a full tab (e.g. on mobile or dedicated tab view)
  if (isFullTab) {
    const homeSignals = signals.filter((s) => s.type === 'masuk');
    const departureSignals = signals.filter((s) => s.type === 'keluar');

    return (
      <div className="w-full h-full bg-slate-950/95 overflow-y-auto p-3 sm:p-5 pb-28 sm:pb-12 space-y-4 text-slate-200 font-mono select-none scrollbar-thin scrollbar-thumb-slate-700">
        {/* Header Meja Pelayanan */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 shadow-md">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-950/80 border border-sky-800 text-sky-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 uppercase font-sans">
                Meja Pelayanan PPKA (Interlocking)
              </h2>
              <p className="text-[11px] text-slate-400">
                Penyelarasan wesel, kedudukan rute, dan pengaturan aspek sinyal stasiun
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-sky-300">
              {switches.length} Wesel
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-amber-300">
              {signals.length} Sinyal
            </span>
          </div>
        </div>

        {/* 1. PENATAAN RUTE CEPAT KE PERON (Auto-Align Switches) */}
        {onSetRouteToPlatform && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 sm:p-4 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase">
              <Navigation className="w-4 h-4 text-sky-400" />
              <span>Penyelarasan Cepat Rute ke Jalur Peron</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Masuk dari Barat */}
              <div className="bg-slate-950/80 border border-slate-800/90 p-2.5 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-[11px] text-sky-300">
                  <span className="font-bold flex items-center space-x-1">
                    <span>Dari Barat</span>
                    <ArrowRight className="w-3 h-3 text-sky-400" />
                  </span>
                  <span className="text-[10px] text-slate-400">Wesel Masuk Barat (W1A/B, W3A/B)</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((plat) => (
                    <button
                      key={`west-${plat}`}
                      type="button"
                      onClick={() => {
                        onSetRouteToPlatform('barat_ke_timur', plat);
                        soundEngine.playSwitchSound();
                      }}
                      className="py-2 px-1 rounded bg-slate-900 hover:bg-sky-600/30 active:bg-sky-600 border border-slate-700 hover:border-sky-500 text-slate-200 hover:text-sky-200 text-center font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer min-h-[44px] flex flex-col items-center justify-center"
                    >
                      <span className="text-[9px] text-slate-400">Jalur</span>
                      <span>{plat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Masuk dari Timur */}
              <div className="bg-slate-950/80 border border-slate-800/90 p-2.5 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-[11px] text-amber-300">
                  <span className="font-bold flex items-center space-x-1">
                    <span>Dari Timur</span>
                    <ArrowRight className="w-3 h-3 text-amber-400" />
                  </span>
                  <span className="text-[10px] text-slate-400">Wesel Masuk Timur (W2A/B, W4A/B)</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((plat) => (
                    <button
                      key={`east-${plat}`}
                      type="button"
                      onClick={() => {
                        onSetRouteToPlatform('timur_ke_barat', plat);
                        soundEngine.playSwitchSound();
                      }}
                      className="py-2 px-1 rounded bg-slate-900 hover:bg-amber-600/30 active:bg-amber-600 border border-slate-700 hover:border-amber-500 text-slate-200 hover:text-amber-200 text-center font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer min-h-[44px] flex flex-col items-center justify-center"
                    >
                      <span className="text-[9px] text-slate-400">Jalur</span>
                      <span>{plat}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. KENDALI WESEL INDIVIDUAL */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-sky-400 uppercase">
              <GitBranch className="w-4 h-4" />
              <span>Daftar Wesel Stasiun (Turnout Switches)</span>
            </div>
            <span className="text-[10px] text-slate-400">Sentuh tombol untuk alihkan Lurus / Belok</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {switches.map((sw) => {
              const isDiverging = sw.position === 'belok';
              return (
                <button
                  key={sw.id}
                  id={`switch-full-btn-${sw.id}`}
                  onClick={() => {
                    onToggleSwitch(sw.id);
                    soundEngine.playSwitchSound();
                  }}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between min-h-[72px] transition-all cursor-pointer active:scale-95 shadow-sm ${
                    isDiverging
                      ? 'bg-amber-950/60 border-amber-600/90 text-amber-200 ring-1 ring-amber-500/50'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-600 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-sky-300">{sw.id}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isDiverging ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                      }`}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans truncate">{sw.name}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
                    <span className="text-[10px] text-slate-400">Kedudukan:</span>
                    <span
                      className={`text-xs font-black uppercase ${
                        isDiverging ? 'text-amber-300' : 'text-emerald-400'
                      }`}
                    >
                      {isDiverging ? 'BELOK ⤴' : 'LURUS ➔'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. PERSINYALAN STASIUN (Signals) */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 sm:p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase">
              <Radio className="w-4 h-4" />
              <span>Persinyalan Elektrik Stasiun</span>
            </div>
            <span className="text-[10px] text-slate-400">Pilih aspek sinyal langsung</span>
          </div>

          {/* Sinyal Masuk */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Sinyal Masuk (Home Signals)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {homeSignals.map((sig) => (
                <div
                  key={sig.id}
                  className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-200">{sig.id}</div>
                    <div className="text-[10px] text-slate-400 truncate">{sig.name}</div>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    {(['merah', 'kuning', 'hijau'] as SignalAspect[]).map((aspect) => {
                      const isActive = sig.aspect === aspect;
                      return (
                        <button
                          key={aspect}
                          type="button"
                          onClick={() => {
                            onSetSignalAspect(sig.id, aspect);
                            soundEngine.playSignalSound(aspect);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer min-h-[36px] flex items-center space-x-1 ${
                            isActive
                              ? aspect === 'merah'
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 ring-1 ring-rose-400'
                                : aspect === 'kuning'
                                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/40 ring-1 ring-amber-300'
                                : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40 ring-1 ring-emerald-400'
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              aspect === 'merah'
                                ? 'bg-rose-500'
                                : aspect === 'kuning'
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                          <span className="hidden xs:inline">{aspect}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sinyal Berangkat */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Sinyal Berangkat (Departure Signals)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {departureSignals.map((sig) => (
                <div
                  key={sig.id}
                  className="bg-slate-950/80 border border-slate-800 p-2 rounded-lg flex items-center justify-between gap-1.5"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-[11px] text-slate-200">{sig.id}</div>
                    <div className="text-[9px] text-slate-400 truncate">{sig.name}</div>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    {(['merah', 'kuning', 'hijau'] as SignalAspect[]).map((aspect) => {
                      const isActive = sig.aspect === aspect;
                      return (
                        <button
                          key={aspect}
                          type="button"
                          onClick={() => {
                            onSetSignalAspect(sig.id, aspect);
                            soundEngine.playSignalSound(aspect);
                          }}
                          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                            isActive
                              ? aspect === 'merah'
                                ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                                : aspect === 'kuning'
                                ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-300'
                                : 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                              : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
                          }`}
                          title={`${sig.id} -> ${aspect.toUpperCase()}`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              aspect === 'merah'
                                ? 'bg-rose-500'
                                : aspect === 'kuning'
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standalone floating bar (Default desktop bottom console)
  return (
    <div className="absolute bottom-1 left-2 right-2 z-20 pointer-events-none flex justify-center pb-1">
      <div className="w-full max-w-7xl bg-slate-950/92 backdrop-blur-md border border-slate-800/90 rounded-xl shadow-2xl p-2 pointer-events-auto flex flex-col gap-1.5 text-xs font-mono">
        {/* BARIS 1: WESEL (Turnout Switches) - 1 Baris Memanjang */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <div className="flex items-center gap-1 shrink-0 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-sky-400 font-bold uppercase">
            <GitBranch className="w-3 h-3 text-sky-400 shrink-0" />
            <span>WESEL</span>
          </div>

          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {switches.map((sw) => {
              const isDiverging = sw.position === 'belok';
              return (
                <button
                  key={sw.id}
                  id={`switch-btn-${sw.id}`}
                  onClick={() => {
                    onToggleSwitch(sw.id);
                    soundEngine.playSwitchSound();
                  }}
                  title={`${sw.name} - Klik untuk alihkan (${isDiverging ? 'LURUS' : 'BELOK'})`}
                  className={`flex-1 min-w-[90px] px-2 py-1 rounded border flex items-center justify-between text-[10px] transition-all hover:scale-[1.02] active:scale-95 ${
                    isDiverging
                      ? 'bg-amber-950/60 border-amber-600/80 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                      : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500 text-slate-200'
                  }`}
                >
                  <span className="font-bold text-[10px]">{sw.id}</span>
                  <div className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDiverging ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                      }`}
                    />
                    <span className={`text-[9px] font-bold ${isDiverging ? 'text-amber-300' : 'text-emerald-400'}`}>
                      {isDiverging ? 'BELOK' : 'LURUS'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* BARIS 2: PERSINYALAN (Signals) - 1 Baris Memanjang */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <div className="flex items-center gap-1 shrink-0 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-amber-400 font-bold uppercase">
            <Radio className="w-3 h-3 text-amber-400 shrink-0" />
            <span>SINYAL</span>
          </div>

          <div className="flex items-center gap-1 flex-1 min-w-0">
            {signals.map((sig) => {
              const isGreen = sig.aspect === 'hijau';
              const isYellow = sig.aspect === 'kuning';

              return (
                <button
                  key={sig.id}
                  id={`signal-btn-${sig.id}`}
                  onClick={() => {
                    const nextAspect: SignalAspect =
                      sig.aspect === 'merah' ? 'hijau' : sig.aspect === 'hijau' ? 'kuning' : 'merah';
                    onSetSignalAspect(sig.id, nextAspect);
                    soundEngine.playSignalSound(nextAspect);
                  }}
                  title={`${sig.name} (${sig.aspect.toUpperCase()}) - Klik ubah aspek`}
                  className={`flex-1 min-w-[68px] px-1.5 py-1 rounded border flex items-center justify-between text-[10px] transition-all hover:scale-[1.02] active:scale-95 ${
                    isGreen
                      ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-200'
                      : isYellow
                      ? 'bg-amber-950/60 border-amber-600/80 text-amber-200'
                      : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="font-bold text-[9px] truncate">{sig.id}</span>
                  <div className="flex items-center gap-0.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isGreen
                          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(34,197,94,0.8)]'
                          : isYellow
                          ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                          : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
