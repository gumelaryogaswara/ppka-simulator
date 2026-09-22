/**
 * Tipe data untuk Simulasi PPKA Stasiun Kereta Api
 */

export type SignalAspect = 'merah' | 'kuning' | 'hijau';

export type SwitchPosition = 'lurus' | 'belok';

export type TrainDirection = 'barat_ke_timur' | 'timur_ke_barat';

export type TrainStatus = 
  | 'menunggu_masuk' 
  | 'mendekati' 
  | 'masuk_stasiun' 
  | 'berhenti_di_peron' 
  | 'siap_berangkat' 
  | 'berangkat' 
  | 'selesai' 
  | 'konflik_darurat';

export type TrainType = 
  | 'eksekutif' 
  | 'ekonomi' 
  | 'commuter' 
  | 'krl' 
  | 'kargo' 
  | 'bbm' 
  | 'petikemas' 
  | 'bandara' 
  | 'klb';

export interface Point2D {
  x: number;
  y: number;
}

export interface TrackSegment {
  id: string;
  name: string;
  points: Point2D[]; // Polyline/spline coordinates
  isPlatform?: boolean;
  platformNumber?: number;
  platformSide?: 'kiri' | 'kanan' | 'kedua';
  speedLimit: number; // km/h
  isOccupied: boolean;
  occupyingTrainId?: string;
}

export interface SwitchNode {
  id: string;
  name: string;
  x: number;
  y: number;
  position: SwitchPosition; // 'lurus' | 'belok'
  sourceTrackId: string;
  straightTrackId: string;
  divergingTrackId: string;
  facingDirection: 'ke_timur' | 'ke_barat';
  angleDegrees?: number;
}

export interface SignalNode {
  id: string;
  name: string;
  x: number;
  y: number;
  aspect: SignalAspect;
  type: 'masuk' | 'berangkat';
  direction: 'ke_timur' | 'ke_barat';
  associatedTrackId: string;
  associatedSwitchId?: string;
  automatic: boolean; // Auto drop to red when train passes
}

export interface Carriage {
  carIndex: number; // 0 = Lokomotif, 1-6 = Gerbong Penumpang/Kargo, 7 = Gerbong Akhir
  x: number;
  y: number;
  angle: number; // Radian
  length: number; // Panjang dalam pixel
  width: number;
  distanceOnRoute: number; // Jarak dari awal rute kereta
}

export interface Train {
  id: string;
  trainNumber: string; // e.g. "KA 1"
  name: string; // e.g. "Argo Bromo Anggrek"
  type: TrainType;
  direction: TrainDirection;
  assignedPlatform: number; // 1, 2, 3, 4, 5
  isNonStop: boolean; // Langsung tanpa henti
  status: TrainStatus;
  
  carriages: Carriage[]; // 8 gerbong
  totalLength: number;
  speed: number; // pixel per detik
  maxSpeed: number;
  targetSpeed: number;
  
  currentTrackId: string;
  routeProgress: number; // Progress keseluruhan
  currentRouteIndex: number;
  routePath: Point2D[]; // List koordinat path yang dilalui
  
  dwellTimeSeconds: number; // Waktu tunggu di peron
  dwellTimer: number; // Countdown
  
  hasTriggeredWrongPlatform: boolean;
  hasTriggeredSPAD: boolean; // Signal passed at danger
  hasCollided?: boolean;
  hasPassedHomeSignal?: boolean; // Mencegah pemaksaan aspek merah berulang setiap frame
  hasPassedDepartureSignal?: boolean;
  isRouteLocked?: boolean;
  
  // Properti Khusus KLB (Kereta Luar Biasa / Prioritas Tertinggi)
  isKLB?: boolean;
  isHeldForKLB?: boolean; // Bernilai true jika KA reguler tertahan berhenti darurat karena KLB sedang melintas
  klbTitle?: string; // e.g. "KLB VVIP Kepresidenan"
  
  colorTheme: {
    primary: string;
    secondary: string;
    stripe: string;
    roof: string;
  };
}

export interface StationAlert {
  id: string;
  timestamp: string;
  type: 'info' | 'sukses' | 'peringatan' | 'bahaya';
  message: string;
}

export interface GameState {
  lives: number; // Max 3
  score: number;
  level: number;
  gameTimeSeconds: number;
  trainsDispatched: number;
  isPaused: boolean;
  gameSpeed: number; // 1x, 2x
  isGameOver: boolean;
  isSoundMuted: boolean;
  audioVolume: number;
}

export function getInfinityRank(level: number, score?: number): string {
  if (level >= 30 || (score !== undefined && score >= 15000)) return 'Maestro PPKA Legendaris Stasiun Sentral ∞';
  if (level >= 20 || (score !== undefined && score >= 9000)) return 'Master Train Controller Eksekutif';
  if (level >= 15 || (score !== undefined && score >= 6500)) return 'Kepala Wilayah Pengendali Operasi KA';
  if (level >= 10 || (score !== undefined && score >= 4200)) return 'Kepala Stasiun Besar Utama (Superintenden)';
  if (level >= 7 || (score !== undefined && score >= 2800)) return 'PPKA Senior Kelas 1 (Pakar Emplasemen)';
  if (level >= 4 || (score !== undefined && score >= 1500)) return 'PPKA Madya (Pengendali Jalur Handal)';
  if (level >= 2 || (score !== undefined && score >= 600)) return 'PPKA Pratama (Petugas Terlatih)';
  return 'PPKA Magang / Pemula';
}
