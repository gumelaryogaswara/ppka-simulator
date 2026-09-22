import React from 'react';
import { StationAlert } from '../types';
import { Info, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface AlertBannerProps {
  alerts: StationAlert[];
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  // Hanya tampilkan notifikasi terbaru agar ringkas dan tidak menutupi layar
  const latestAlert = alerts[alerts.length - 1];
  if (!latestAlert) return null;

  let bgClass = 'bg-slate-900/90 border-slate-700 text-slate-200';
  let Icon = Info;
  let iconColor = 'text-sky-400';

  if (latestAlert.type === 'sukses') {
    bgClass = 'bg-emerald-950/90 border-emerald-700 text-emerald-100';
    Icon = CheckCircle2;
    iconColor = 'text-emerald-400';
  } else if (latestAlert.type === 'peringatan') {
    bgClass = 'bg-amber-950/90 border-amber-700 text-amber-100';
    Icon = AlertTriangle;
    iconColor = 'text-amber-400';
  } else if (latestAlert.type === 'bahaya') {
    bgClass = 'bg-rose-950/90 border-rose-600 text-rose-100 shadow-[0_0_12px_rgba(225,29,72,0.4)]';
    Icon = AlertOctagon;
    iconColor = 'text-rose-400';
  }

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-auto max-w-xl px-2">
      <div
        key={latestAlert.id}
        className={`px-3 py-1.5 rounded-full border backdrop-blur-md flex items-center space-x-2 text-[11px] font-mono shadow-md transition-all animate-in fade-in slide-in-from-top-1 duration-200 ${bgClass}`}
      >
        <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
        <span className="text-[9px] text-slate-400 font-mono shrink-0">[{latestAlert.timestamp}]</span>
        <p className="leading-tight truncate max-w-md">{latestAlert.message}</p>
      </div>
    </div>
  );
};

