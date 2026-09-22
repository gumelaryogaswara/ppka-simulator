import React from 'react';
import { X, BookOpen, AlertTriangle, ShieldCheck, Compass, GitFork, TrafficCone } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100 font-sans tracking-wide">
                Buku Panduan Operasional PPKA
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Pedoman Pengatur Perjalanan Kereta Api & Sistem Interlocking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Panduan */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed font-sans">
          {/* Bagian 1: Tugas Pokok PPKA */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-850">
            <h3 className="font-bold text-sm text-sky-400 mb-2 flex items-center space-x-2 font-mono">
              <Compass className="w-4 h-4" />
              <span>1. Tugas Pokok Pengatur Perjalanan (PPKA)</span>
            </h3>
            <p className="text-slate-300">
              Anda bertindak sebagai <strong>PPKA (Pengatur Perjalanan Kereta Api)</strong> di Stasiun Sentral.
              Tugas utama Anda adalah memandu setiap rangkaian kereta api (terdiri dari <strong>8 gerbong terpisah dan tersambung</strong>)
              agar masuk ke jalur/peron yang telah dijadwalkan secara tepat dan aman.
            </p>
          </div>

          {/* Bagian 2: Pengaturan Wesel */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-850">
            <h3 className="font-bold text-sm text-amber-400 mb-2 flex items-center space-x-2 font-mono">
              <GitFork className="w-4 h-4" />
              <span>2. Pengaturan Wesel (Turnouts)</span>
            </h3>
            <p className="text-slate-300 mb-2">
              Pemain mengatur wesel untuk menentukan percabangan rel menuju peron target:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono">
              <li>
                <strong className="text-emerald-400">LURUS:</strong> Rangkaian tetap melaju lurus pada jalur utama.
              </li>
              <li>
                <strong className="text-amber-400">BELOK:</strong> Mengalihkan rangkaian ke jalur cabang atau peron lain.
              </li>
              <li>
                <strong>Cara Kontrol:</strong> Klik langsung titik wesel di atas rel pada peta, atau tekan tombol wesel di panel meja kendali bawah.
              </li>
            </ul>
          </div>

          {/* Bagian 3: Warna Sinyal 3 Aspek */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-850">
            <h3 className="font-bold text-sm text-emerald-400 mb-2 flex items-center space-x-2 font-mono">
              <TrafficCone className="w-4 h-4" />
              <span>3. Sistem Sinyal 3 Aspek (Merah, Kuning, Hijau)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] mt-2">
              <div className="bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-lg">
                <span className="text-rose-400 font-bold block mb-1">● MERAH (Berhenti)</span>
                Kereta api wajib berhenti sebelum sinyal dan menunggu izin masuk.
              </div>
              <div className="bg-amber-950/40 border border-amber-900/60 p-2.5 rounded-lg">
                <span className="text-amber-400 font-bold block mb-1">● KUNING (Hati-hati)</span>
                Kereta diizinkan melintas dengan kecepatan terbatas (30-40 km/jam).
              </div>
              <div className="bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-lg">
                <span className="text-emerald-400 font-bold block mb-1">● HIJAU (Aman)</span>
                Jalur bebas rintangan, kereta melaju sesuai batas kecepatan normal.
              </div>
            </div>
          </div>

          {/* Bagian 4: Nyawa & Level Tak Terbatas */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-850">
            <h3 className="font-bold text-sm text-rose-400 mb-2 flex items-center space-x-2 font-mono">
              <AlertTriangle className="w-4 h-4" />
              <span>4. Aturan Nyawa, Poin, & Level Tak Terbatas</span>
            </h3>
            <ul className="space-y-1.5 text-slate-300">
              <li>
                • Pemain memiliki <strong>3 Nyawa</strong>.
              </li>
              <li>
                • Kehilangan 1 nyawa apabila:
                <ul className="list-disc list-inside ml-4 text-rose-300 font-mono text-[11px]">
                  <li>Kereta diarahkan ke jalur/peron yang salah.</li>
                  <li>Terjadi tabrakan atau konflik antar kereta di rel.</li>
                  <li>Pelanggaran sinyal merah saat mendekati emplasemen.</li>
                </ul>
              </li>
              <li>
                • Setiap kereta yang berhasil diberangkatkan tepat peron memberi tambahan <strong>+250 Poin</strong> (dikali multiplier level).
              </li>
              <li>
                • <strong>Sistem Infinity Level (∞):</strong> Setiap 450 poin, Anda naik ke tingkat berikutnya tanpa batas akhir (Level 1, 2, 3... ∞).
              </li>
              <li>
                • <strong>Pengganda Skor (Multiplier):</strong> Perolehan poin meningkat +10% per level infinity (x1.1 di Lv 2, x1.5 di Lv 6, x2.0 di Lv 11, dst).
              </li>
              <li>
                • <strong>Bonus Pemulihan Nyawa (Recovery):</strong> Setiap kelipatan 5 level (Level 5, 10, 15, dst), stasiun memberikan bonus pemulihan +1 Nyawa atas dedikasi operasional dinas tanpa henti!
              </li>
            </ul>
          </div>

          {/* Bagian 5: KLB (Kereta Luar Biasa) & Prioritas Utama */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-950/70 to-red-950/40 p-4 rounded-xl border border-amber-500/60">
            <h3 className="font-bold text-sm text-amber-400 mb-2 flex items-center space-x-2 font-mono">
              <span className="text-amber-300 font-bold">⭐</span>
              <span>5. KLB (Kereta Luar Biasa) & Hak Prioritas Utama</span>
            </h3>
            <p className="text-slate-300 mb-2 text-xs">
              Sesuai dengan <strong>Peraturan Dinas Pengaturan Perjalanan Kereta Api</strong>, KLB (seperti KLB VVIP Kepresidenan, Kereta Inspeksi KAIS, atau Medis Darurat) memiliki <strong>Hak Prioritas Tertinggi di seluruh jaringan rel</strong>.
            </p>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-amber-500/30 text-amber-200 font-mono text-[11px] space-y-1">
              <p>• <strong>Semua Kereta Reguler Berhenti:</strong> Begitu KLB aktif atau mendekat, seluruh KA reguler otomatis diberhentikan dan tertahan di posisinya.</p>
              <p>• <strong>Bebaskan Jalur:</strong> Pastikan wesel dan sinyal diarahkan ke jalur yang benar bagi KLB.</p>
              <p>• <strong>Bonus Poin Tinggi:</strong> Meloloskan KLB dengan aman memberikan bonus <strong>+500 Poin</strong>.</p>
              <p>• <strong>Panggil KLB:</strong> Anda dapat menguji fitur ini kapan saja dengan menekan tombol <strong>"Panggil KLB"</strong> di bar atas.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs rounded-lg transition-colors shadow-md"
          >
            Siap Melaksanakan Tugas Dinas
          </button>
        </div>
      </div>
    </div>
  );
};
