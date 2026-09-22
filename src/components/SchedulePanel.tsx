import React from 'react';
import { Train, SignalNode } from '../types';
import { Clock, ArrowRight, CheckCircle2, ChevronRight, Zap, ShieldAlert, TrainTrack } from 'lucide-react';

interface SchedulePanelProps {
  trains: Train[];
  signals: SignalNode[];
  onSetSignalAspect: (signalId: string, aspect: 'merah' | 'kuning' | 'hijau') => void;
  onFocusTrain: (train: Train) => void;
  onAssignPlatform?: (trainId: string, targetPlatform: number) => void;
  onAutoRouteToFreePlatform?: (trainId: string) => void;
  onClearKLBRoute?: () => void;
  isFullWidth?: boolean;
}

export const SchedulePanel: React.FC<SchedulePanelProps> = ({
  trains,
  signals,
  onSetSignalAspect,
  onFocusTrain,
  onAssignPlatform,
  onAutoRouteToFreePlatform,
  onClearKLBRoute,
  isFullWidth = false,
}) => {
  const activeKLB = trains.find((t) => t.isKLB && t.status !== 'selesai');
  const hasActiveKLB = Boolean(activeKLB);

  // Kereta aktif diurutkan: KLB paling depan, lalu yang sedang menunggu masuk
  const activeTrains = trains
    .filter((t) => t.status !== 'selesai')
    .sort((a, b) => (b.isKLB ? 1 : 0) - (a.isKLB ? 1 : 0));

  // Platform occupancy check (1 to 5)
  const platformOccupancy: { [plat: number]: Train | undefined } = {
    1: undefined,
    2: undefined,
    3: undefined,
    4: undefined,
    5: undefined,
  };
  activeTrains.forEach((t) => {
    if (t.status === 'masuk_stasiun' || t.status === 'berhenti_di_peron' || t.status === 'siap_berangkat') {
      platformOccupancy[t.assignedPlatform] = t;
    }
  });

  return (
    <aside
      className={`bg-slate-900/95 backdrop-blur-md flex flex-col h-full overflow-hidden text-slate-200 select-none z-10 ${
        isFullWidth
          ? 'w-full border-none'
          : 'w-72 2xl:w-80 border-l border-slate-800 shrink-0'
      }`}
    >
      {/* Header Panel */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <TrainTrack className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Daftar Kereta Masuk
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
          {activeTrains.length} Aktif
        </span>
      </div>

      {/* KLB Priority Banner jika ada KLB */}
      {hasActiveKLB && (
        <div className="px-3 py-2 bg-amber-950/90 border-b border-amber-600 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[11px] font-mono font-bold text-amber-200">
              ⭐ PRIORITAS KLB AKTIF
            </span>
          </div>
          {onClearKLBRoute && (
            <button
              type="button"
              onClick={onClearKLBRoute}
              className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer transition-colors shadow-sm"
              title="Bebaskan jalur dan buka sinyal langsung untuk KLB"
            >
              Bebaskan Jalur
            </button>
          )}
        </div>
      )}

      {/* Ringkasan Okupansi Peron Stasiun (Ditampilkan di Atas saat Tab Penuh) */}
      {isFullWidth && (
        <div className="p-2.5 sm:p-3 border-b border-slate-800 bg-slate-950/90 shrink-0 text-[10px] font-mono">
          <div className="text-slate-400 font-bold mb-1.5 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>STATUS OKUPANSI 5 JALUR PERON:</span>
            </span>
            <span className="text-slate-500 text-[9px]">Tap kartu kereta di bawah untuk fokus di peta</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center">
            {[1, 2, 3, 4, 5].map((plat) => {
              const occ = platformOccupancy[plat];
              return (
                <div
                  key={plat}
                  className={`py-1.5 px-1 rounded-lg border text-[10px] font-bold transition-all ${
                    occ
                      ? 'bg-amber-950/60 border-amber-500/80 text-amber-200 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                  title={occ ? `Jalur ${plat}: Terisi ${occ.name}` : `Jalur ${plat}: Kosong`}
                >
                  <div className="text-[11px] font-black text-slate-200">Peron {plat}</div>
                  <div className="truncate text-[9px] font-medium mt-0.5">
                    {occ ? occ.trainNumber : '🟢 Bebas'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List Antrean Kereta (Scrollable Vertikal / Responsif Grid) */}
      <div
        className={`flex-1 overflow-y-auto p-2.5 sm:p-3 scrollbar-thin scrollbar-thumb-slate-700 ${
          isFullWidth
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-max pb-28 sm:pb-12'
            : 'space-y-2.5 pb-6'
        }`}
      >
        {activeTrains.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs font-mono">
            Tidak ada kereta di emplasemen.
            <br />
            Kereta berikutnya akan segera tiba...
          </div>
        ) : (
          activeTrains.map((train) => {
            const isWest = train.direction === 'barat_ke_timur';
            const homeSigId = isWest ? 'SM-01' : 'SM-02';
            const homeSig = signals.find((s) => s.id === homeSigId);
            const curPlat = train.assignedPlatform;
            const depSigId = isWest
              ? `SB-0${curPlat}`
              : curPlat === 5
              ? 'SB-10'
              : `SB-0${5 + curPlat}`;
            const depSig = signals.find((s) => s.id === depSigId);

            return (
              <div
                key={train.id}
                onClick={() => onFocusTrain(train)}
                className={`p-2.5 rounded-lg border text-xs font-mono transition-all cursor-pointer shadow-sm ${
                  train.isKLB
                    ? 'bg-amber-950/70 border-amber-500 text-amber-200 ring-1 ring-amber-400/50'
                    : train.isHeldForKLB
                    ? 'bg-rose-950/50 border-rose-800 text-rose-300'
                    : 'bg-slate-950/80 border-slate-800 hover:border-sky-500 hover:bg-slate-900'
                }`}
              >
                {/* Header Card: Dot, Nomor, Nama, Badge */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5 truncate mr-1">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${train.isKLB ? 'animate-ping' : ''}`}
                      style={{ backgroundColor: train.colorTheme.primary }}
                    />
                    <strong className="text-slate-100 font-bold">{train.trainNumber}</strong>
                    <span className="text-[11px] text-slate-300 truncate max-w-[110px]">{train.name}</span>
                  </div>

                  {train.isHeldForKLB ? (
                    <span className="px-1.5 py-0.5 text-[9px] rounded bg-rose-950 text-rose-300 border border-rose-700 animate-pulse shrink-0">
                      ⛔ Tahan
                    </span>
                  ) : train.isKLB ? (
                    <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-500 text-slate-950 font-bold shrink-0">
                      ⭐ KLB
                    </span>
                  ) : train.status === 'menunggu_masuk' ? (
                    <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-950/90 text-amber-300 border border-amber-700 shrink-0">
                      Antre Masuk
                    </span>
                  ) : train.status === 'masuk_stasiun' ? (
                    <span className="px-1.5 py-0.5 text-[9px] rounded bg-sky-950/90 text-sky-300 border border-sky-700 animate-pulse shrink-0">
                      Masuk J{train.assignedPlatform}
                    </span>
                  ) : train.status === 'berhenti_di_peron' ? (
                    <span className="px-1.5 py-0.5 text-[9px] rounded bg-emerald-950/90 text-emerald-300 border border-emerald-700 shrink-0">
                      P{train.assignedPlatform} ({Math.ceil(train.dwellTimer)}s)
                    </span>
                  ) : train.status === 'siap_berangkat' ? (
                    <span className="px-1.5 py-0.5 text-[9px] rounded bg-purple-950/90 text-purple-300 border border-purple-700 animate-bounce shrink-0">
                      Siap Berangkat!
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[9px] rounded bg-blue-950/90 text-blue-300 border border-blue-700 shrink-0">
                      Keluar
                    </span>
                  )}
                </div>

                {/* Info Rute & Kecepatan */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                  <span>{isWest ? '➡️ Barat ke Timur' : '⬅️ Timur ke Barat'}</span>
                  <span>{Math.round(train.speed)} km/j</span>
                </div>

                {/* Pemilih Jalur Peron Cepat [1][2][3][4][5] */}
                {(train.status === 'menunggu_masuk' || train.status === 'masuk_stasiun') && onAssignPlatform && (
                  <div
                    className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] text-slate-400 font-semibold">Jalur:</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((platNum) => {
                        const isOccupiedByOther =
                          platformOccupancy[platNum] && platformOccupancy[platNum]?.id !== train.id;
                        return (
                          <button
                            key={platNum}
                            type="button"
                            onClick={() => onAssignPlatform(train.id, platNum)}
                            className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                              train.assignedPlatform === platNum
                                ? 'bg-sky-500 text-slate-950 font-black shadow-sm ring-1 ring-sky-300'
                                : isOccupiedByOther
                                ? 'bg-rose-950/60 text-rose-300 border border-rose-900/50 hover:bg-rose-900/50'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                            title={`Jalur ${platNum}${isOccupiedByOther ? ' (Terisi)' : ' (Kosong)'}`}
                          >
                            {platNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tombol Auto Reroute ke Jalur Bebas */}
                    {onAutoRouteToFreePlatform && (
                      <button
                        type="button"
                        onClick={() => onAutoRouteToFreePlatform(train.id)}
                        className="px-1.5 h-6 rounded bg-emerald-700 hover:bg-emerald-600 text-emerald-100 text-[10px] font-bold flex items-center space-x-0.5 cursor-pointer transition-colors shadow-sm"
                        title="Alihkan otomatis ke jalur kosong yang tersedia"
                      >
                        <Zap className="w-2.5 h-2.5" />
                        <span>Bebas</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Tombol Aksi Sinyal Cepat */}
                {train.status === 'menunggu_masuk' && homeSig && (
                  <div
                    className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] text-slate-400">
                      Sinyal Masuk ({homeSig.id}):
                    </span>
                    <button
                      type="button"
                      onClick={() => onSetSignalAspect(homeSig.id, 'hijau')}
                      className={`px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
                        homeSig.aspect === 'hijau'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 hover:bg-emerald-600 text-emerald-300'
                      }`}
                    >
                      <span>{homeSig.aspect === 'hijau' ? '🟢 HIJAU (Aman)' : 'Buka Masuk 🟢'}</span>
                    </button>
                  </div>
                )}

                {train.status === 'siap_berangkat' && depSig && (
                  <div
                    className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] text-purple-300 font-bold">
                      Siap Berangkat ({depSig.id}):
                    </span>
                    <button
                      type="button"
                      onClick={() => onSetSignalAspect(depSig.id, 'hijau')}
                      className={`px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors animate-pulse ${
                        depSig.aspect === 'hijau'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                      }`}
                    >
                      <span>Beri Sinyal Berangkat 🟢</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Ringkasan Okupansi Peron Stasiun di Bawah Sidebar (Mode Desktop Sidebar) */}
      {!isFullWidth && (
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/80 shrink-0 text-[10px] font-mono">
          <div className="text-slate-400 font-bold mb-1.5 flex items-center justify-between">
            <span>STATUS OKUPANSI JALUR:</span>
          </div>
          <div className="grid grid-cols-5 gap-1 text-center">
            {[1, 2, 3, 4, 5].map((plat) => {
              const occ = platformOccupancy[plat];
              return (
                <div
                  key={plat}
                  className={`py-1 px-0.5 rounded border text-[9px] font-bold ${
                    occ
                      ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title={occ ? `Jalur ${plat}: Terisi ${occ.name}` : `Jalur ${plat}: Kosong`}
                >
                  <div>J{plat}</div>
                  <div className="truncate text-[8px]">{occ ? 'TERISI' : 'BEBAS'}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};
