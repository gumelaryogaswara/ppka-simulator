import { Carriage, SignalNode, SwitchNode, Train, TrainDirection, TrainType } from '../types';
import { calculateTrainRoute, getDistanceToXOnPath, getPointAndAngleAtDistance, getTotalPathLength, setSwitchesForPlatform } from './trackNetwork';
import { soundEngine } from '../audio/soundEngine';

export const CARRIAGE_LENGTH = 72;
export const CARRIAGE_WIDTH = 18;
export const CARRIAGE_GAP = 6;
export const CAR_STEP = CARRIAGE_LENGTH + CARRIAGE_GAP; // 78px

const TRAIN_NAMES: { name: string; number: string; type: TrainType; defaultPlatform: number }[] = [
  { name: 'Argo Bromo Anggrek', number: 'KA 1', type: 'eksekutif', defaultPlatform: 1 },
  { name: 'Argo Wilis', number: 'KA 6', type: 'eksekutif', defaultPlatform: 1 },
  { name: 'Argo Lawu', number: 'KA 7', type: 'eksekutif', defaultPlatform: 1 },
  { name: 'Argo Dwipangga', number: 'KA 9', type: 'eksekutif', defaultPlatform: 1 },
  { name: 'Taksaka', number: 'KA 68', type: 'eksekutif', defaultPlatform: 1 },
  { name: 'Turangga', number: 'KA 79', type: 'eksekutif', defaultPlatform: 1 },
  { name: 'Bima Eksekutif', number: 'KA 59', type: 'eksekutif', defaultPlatform: 1 },
  { name: 'Gajayana', number: 'KA 55', type: 'eksekutif', defaultPlatform: 2 },
  { name: 'Sancaka Cepat', number: 'KA 175', type: 'eksekutif', defaultPlatform: 2 },
  { name: 'Malabar Priority', number: 'KA 121', type: 'eksekutif', defaultPlatform: 2 },
  { name: 'Lodaya', number: 'KA 92', type: 'ekonomi', defaultPlatform: 2 },
  { name: 'Jayabaya', number: 'KA 108', type: 'ekonomi', defaultPlatform: 3 },
  { name: 'Matarmaja', number: 'KA 282', type: 'ekonomi', defaultPlatform: 3 },
  { name: 'Kertajaya Panjang', number: 'KA 255', type: 'ekonomi', defaultPlatform: 3 },
  { name: 'Sri Tanjung', number: 'KA 288', type: 'ekonomi', defaultPlatform: 3 },
  { name: 'Logawa', number: 'KA 247', type: 'ekonomi', defaultPlatform: 3 },
  { name: 'KRL Commuter Line JR 205', number: 'KRL 2044', type: 'krl', defaultPlatform: 5 },
  { name: 'KRL Tokyu Series 8500', number: 'KRL 1120', type: 'krl', defaultPlatform: 5 },
  { name: 'KRL Red Line', number: 'KRL 2052', type: 'krl', defaultPlatform: 5 },
  { name: 'KRL Blue Line', number: 'KRL 2088', type: 'krl', defaultPlatform: 5 },
  { name: 'KRL Bandara Railink Listrik', number: 'KRL 804', type: 'krl', defaultPlatform: 2 },
  { name: 'KA Petikemas Tanjung Priok', number: 'KA 2510', type: 'petikemas', defaultPlatform: 4 },
  { name: 'KA Petikemas Kalimas Cepat', number: 'KA 2518', type: 'petikemas', defaultPlatform: 4 },
  { name: 'KA Ketel BBM Pertamina Cilacap', number: 'KA 2602', type: 'bbm', defaultPlatform: 4 },
  { name: 'KA Avtur Pertamina Rewulu', number: 'KA 2608', type: 'bbm', defaultPlatform: 4 },
  { name: 'KA Semen Curah Karangtalun', number: 'KA 2701', type: 'kargo', defaultPlatform: 4 },
  { name: 'KA Kargo Baja Coil Krakatau', number: 'KA 2706', type: 'kargo', defaultPlatform: 4 },
  { name: 'Bandara Railink', number: 'KA 802', type: 'bandara', defaultPlatform: 2 },
  { name: 'Sembrani', number: 'KA 78', type: 'eksekutif', defaultPlatform: 1 },
];

export function getThemeForType(type: TrainType, trainName?: string) {
  switch (type) {
    case 'eksekutif':
      return {
        primary: '#3b82f6', // Biru KAI Executive
        secondary: '#e2e8f0', // Stainless steel
        stripe: '#f97316', // Orange striping
        roof: '#64748b',
      };
    case 'ekonomi':
      return {
        primary: '#f8fafc', // Putih KAI
        secondary: '#0284c7', // Biru muda
        stripe: '#ea580c', // Oranye
        roof: '#475569',
      };
    case 'commuter':
      return {
        primary: '#dc2626', // Merah KCI
        secondary: '#fef08a', // Kuning
        stripe: '#ffffff',
        roof: '#334155',
      };
    case 'krl':
      if (trainName?.toLowerCase().includes('blue')) {
        return {
          primary: '#2563eb', // Biru Elektrik KRL Blue Line (Cikarang)
          secondary: '#93c5fd', // Aksen biru langit
          stripe: '#ffffff',
          roof: '#64748b', // Stainless steel dengan pantograf
        };
      }
      return {
        primary: '#e11d48', // Merah terang khas KRL Red Line
        secondary: '#fef08a', // Striping kuning khas KRL Jabodetabek
        stripe: '#ffffff',
        roof: '#64748b', // Stainless steel dengan pantograf
      };
    case 'kargo':
      return {
        primary: '#d97706', // Oranye/Bata Kargo
        secondary: '#78716c', // Kontainer / Semen Curah
        stripe: '#f59e0b',
        roof: '#292524',
      };
    case 'bbm':
      return {
        primary: '#0f172a', // Hitam doff gerbong ketel BBM Pertamina
        secondary: '#dc2626', // Merah Pertamina
        stripe: '#2563eb', // Biru Pertamina
        roof: '#1e293b',
      };
    case 'petikemas':
      return {
        primary: '#1d4ed8', // Biru laut kontainer
        secondary: '#059669', // Hijau Evergreen
        stripe: '#f59e0b', // Oranye Maersk
        roof: '#334155',
      };
    case 'bandara':
      return {
        primary: '#059669', // Hijau Emerald Railink
        secondary: '#f8fafc',
        stripe: '#10b981',
        roof: '#475569',
      };
    case 'klb':
      return {
        primary: '#d97706', // Emas Royal Kuning Kehormatan VVIP
        secondary: '#ffffff', // Putih Mutiara Kenegaraan
        stripe: '#dc2626', // Merah Kenegaraan
        roof: '#0f172a', // Atap Hitam Elegan
      };
  }
}

const KLB_TEMPLATES: { name: string; number: string; type: TrainType; defaultPlatform: number }[] = [
  { name: 'KLB VVIP Kepresidenan', number: 'KLB RI-1', type: 'klb', defaultPlatform: 4 },
  { name: 'KLB Inspeksi KAIS Merbabu', number: 'KLB KAIS-01', type: 'klb', defaultPlatform: 4 },
  { name: 'KLB Gerak Cepat Penolong & Medis', number: 'KLB DR-99', type: 'klb', defaultPlatform: 3 },
];

let trainIdCounter = 1;

export function getAvailablePlatform(
  activeTrains: Train[],
  preferredType?: TrainType,
  direction?: TrainDirection
): number {
  // Cek peron mana saja yang sedang terisi oleh kereta yang belum selesai
  const occupiedPlatforms = new Set<number>();
  for (const t of activeTrains) {
    if (t.status !== 'selesai') {
      occupiedPlatforms.add(t.assignedPlatform);
    }
  }

  // Prioritas alokasi peron cerdas berdasarkan jenis kereta:
  // Jalur 4 adalah Jalur Lurus Langsung (ideal untuk kargo, bbm, petikemas, klb yang melintas langsung tanpa henti)
  let priorityList = [1, 2, 3, 5, 4];
  if (preferredType === 'commuter' || preferredType === 'krl') priorityList = [5, 3, 2, 1, 4];
  else if (preferredType === 'kargo' || preferredType === 'bbm' || preferredType === 'petikemas') priorityList = [4, 3, 2, 1, 5];
  else if (preferredType === 'klb') priorityList = [4, 3, 2, 1, 5];
  else if (preferredType === 'eksekutif') priorityList = [1, 2, 3, 4, 5];
  else if (preferredType === 'ekonomi') priorityList = [3, 2, 1, 5, 4];

  for (const p of priorityList) {
    if (!occupiedPlatforms.has(p)) {
      return p;
    }
  }

  // Jika semua peron sedang terisi, alokasikan ke peron prioritas default
  return priorityList[0];
}

export function createKLBTrain(
  direction: TrainDirection,
  switches: SwitchNode[],
  targetPlatformOrTrains?: number | Train[]
): Train {
  const seed = Math.floor(Math.random() * KLB_TEMPLATES.length);
  const template = KLB_TEMPLATES[seed];

  // KLB lebih mengutamakan Jalur 4 (Jalur Langsung) atau jalur kosong
  let targetPlatform = 4;
  if (typeof targetPlatformOrTrains === 'number') {
    targetPlatform = targetPlatformOrTrains;
  } else if (Array.isArray(targetPlatformOrTrains)) {
    const occupiedPlatforms = new Set(
      targetPlatformOrTrains.filter((t) => t.status !== 'selesai').map((t) => t.assignedPlatform)
    );
    if (occupiedPlatforms.has(4)) {
      for (const p of [3, 2, 1, 5]) {
        if (!occupiedPlatforms.has(p)) {
          targetPlatform = p;
          break;
        }
      }
    }
  }

  const { path, trackId } = calculateTrainRoute(direction, targetPlatform);
  const totalLength = 8 * CAR_STEP;
  const carriages: Carriage[] = [];
  const startPt = path[0] || {
    x: direction === 'barat_ke_timur' ? -600 : 3000,
    y: direction === 'barat_ke_timur' ? 440 : 360,
  };
  const startAngle = direction === 'barat_ke_timur' ? 0 : Math.PI;

  for (let i = 0; i < 8; i++) {
    carriages.push({
      carIndex: i,
      x: startPt.x,
      y: startPt.y,
      angle: startAngle,
      length: CARRIAGE_LENGTH,
      width: CARRIAGE_WIDTH,
      distanceOnRoute: -i * CAR_STEP,
    });
  }

  const speedBase = 85;

  const train: Train = {
    id: `KLB-${trainIdCounter++}`,
    trainNumber: template.number,
    name: template.name,
    type: 'klb',
    isKLB: true,
    klbTitle: 'KLB PRIORITAS TERTINGGI',
    isHeldForKLB: false,
    direction,
    assignedPlatform: targetPlatform,
    isNonStop: true, // KLB selalu melintas langsung
    status: 'menunggu_masuk',
    carriages,
    totalLength,
    speed: 0,
    maxSpeed: speedBase,
    targetSpeed: speedBase,
    currentTrackId: trackId,
    routeProgress: 0,
    currentRouteIndex: 0,
    routePath: path,
    dwellTimeSeconds: 0, // Tidak berhenti di stasiun
    dwellTimer: 0,
    hasTriggeredWrongPlatform: false,
    hasTriggeredSPAD: false,
    hasPassedHomeSignal: false,
    hasPassedDepartureSignal: false,
    isRouteLocked: false,
    colorTheme: getThemeForType('klb'),
  };

  return train;
}

export function createNewTrain(
  direction: TrainDirection,
  level: number,
  switches: SwitchNode[],
  targetPlatformInput?: number
): Train {
  const seed = Math.floor(Math.random() * TRAIN_NAMES.length);
  const template = TRAIN_NAMES[seed];

  // Rute awal ditentukan oleh targetPlatformInput jika diberikan,
  // atau rute yang selaras dengan wesel
  const targetPlatform =
    typeof targetPlatformInput === 'number'
      ? targetPlatformInput
      : calculateTrainRoute(direction, switches).resolvedPlatform;

  const { path, trackId } = calculateTrainRoute(direction, targetPlatform);

  // Kereta kargo, BBM, Petikemas, dan KLB berjalan langsung (tidak berhenti melayani peron stasiun)
  const isThroughTrainType =
    template.type === 'kargo' ||
    template.type === 'bbm' ||
    template.type === 'petikemas' ||
    template.type === 'klb';

  const isNonStop = isThroughTrainType;
  const dwellTime = isNonStop ? 0 : template.type === 'krl' || template.type === 'commuter' ? 7 : 10;

  const totalLength = 8 * CAR_STEP;
  // Buat 8 gerbong
  const carriages: Carriage[] = [];
  const startPt = path[0] || {
    x: direction === 'barat_ke_timur' ? -600 : 3000,
    y: direction === 'barat_ke_timur' ? 440 : 360,
  };
  const startAngle = direction === 'barat_ke_timur' ? 0 : Math.PI;

  for (let i = 0; i < 8; i++) {
    carriages.push({
      carIndex: i,
      x: startPt.x,
      y: startPt.y,
      angle: startAngle,
      length: CARRIAGE_LENGTH,
      width: CARRIAGE_WIDTH,
      distanceOnRoute: -i * CAR_STEP,
    });
  }

  // Kecepatan lokomotif beradaptasi dinamis seiring tingkat infinity meningkat
  const speedBase = 65 + Math.min(50, Math.log2(level + 1) * 12);

  const train: Train = {
    id: `KA-${trainIdCounter++}`,
    trainNumber: template.number,
    name: template.name,
    type: template.type,
    direction,
    assignedPlatform: targetPlatform,
    isNonStop,
    status: 'menunggu_masuk',
    carriages,
    totalLength,
    speed: 0,
    maxSpeed: speedBase,
    targetSpeed: speedBase,
    currentTrackId: trackId,
    routeProgress: 0,
    currentRouteIndex: 0,
    routePath: path,
    dwellTimeSeconds: dwellTime,
    dwellTimer: dwellTime,
    hasTriggeredWrongPlatform: false,
    hasTriggeredSPAD: false,
    hasPassedHomeSignal: false,
    hasPassedDepartureSignal: false,
    isRouteLocked: false,
    colorTheme: getThemeForType(template.type, template.name),
  };

  return train;
}

export interface UpdateResult {
  lifeLost: boolean;
  scoreGained: number;
  safeDispatch?: boolean;
  signalsAutoTurnedRed?: string[];
  switchesUpdated?: SwitchNode[];
  alert?: {
    type: 'info' | 'sukses' | 'peringatan' | 'bahaya';
    message: string;
  };
}

export function isPlatformOccupied(
  platform: number,
  trains: Train[],
  excludeTrainId?: string
): Train | undefined {
  return trains.find(
    (t) =>
      t.id !== excludeTrainId &&
      t.assignedPlatform === platform &&
      t.status !== 'selesai' &&
      (t.status === 'masuk_stasiun' ||
        t.status === 'berhenti_di_peron' ||
        t.status === 'siap_berangkat' ||
        (t.status === 'berangkat' &&
          t.carriages[t.carriages.length - 1].distanceOnRoute < 1700))
  );
}

// Cek batas tenggorokan wesel stasiun
export function isEntranceThroatOccupied(
  direction: TrainDirection,
  trains: Train[],
  currentTrainId: string
): boolean {
  const isWest = direction === 'barat_ke_timur';
  return trains.some((t) => {
    if (t.id === currentTrainId || t.status === 'selesai' || t.status === 'menunggu_masuk') {
      return false;
    }
    return t.carriages.some((c) => {
      if (isWest) {
        // Begitu ekor kereta melewati x = 730, kereta sudah sepenuhnya masuk sepur lurus peron
        return c.x >= 320 && c.x <= 730;
      } else {
        return c.x >= 1670 && c.x <= 2080;
      }
    });
  });
}

export function updateTrainSimulation(
  train: Train,
  deltaSeconds: number,
  signals: SignalNode[],
  switches: SwitchNode[],
  allTrains: Train[]
): UpdateResult {
  const result: UpdateResult = {
    lifeLost: false,
    scoreGained: 0,
  };

  if (train.status === 'selesai') return result;

  const pathLength = getTotalPathLength(train.routePath);
  const leadCar = train.carriages[0];

  // Cari sinyal masuk yang relevan (SM-01 untuk Barat, SM-02 untuk Timur)
  const isWest = train.direction === 'barat_ke_timur';
  const homeSignalId = isWest ? 'SM-01' : 'SM-02';
  const homeSignal = signals.find((s) => s.id === homeSignalId);

  // Sinyal Berangkat untuk peron kereta ini
  const curPlat = train.assignedPlatform;
  const depSignalId = isWest
    ? `SB-0${curPlat}`
    : curPlat === 5
    ? 'SB-10'
    : `SB-0${5 + curPlat}`;
  const depSignal = signals.find((s) => s.id === depSignalId);

  // Posisi sinyal & stasiun pada rute perjalanan:
  // Jarak dari titik spawn (x: -600 atau x: 3000) ke Sinyal Masuk (x: 280 atau x: 2120) = 880px
  const homeSignalDistance = homeSignal
    ? getDistanceToXOnPath(train.routePath, homeSignal.x, train.direction)
    : 880;

  // Koordinat X tiang Sinyal Berangkat
  const depSignalX = depSignal
    ? depSignal.x
    : isWest
    ? curPlat === 5
      ? 1665
      : 1620
    : curPlat === 5
    ? 735
    : 780;

  // Jarak tepat tiang Sinyal Berangkat pada rute polyline
  const departureSignalDistance = getDistanceToXOnPath(train.routePath, depSignalX, train.direction);

  // Titik henti kereta tepat sampai di ujung depan peron:
  const targetStopX = isWest
    ? curPlat === 5
      ? 1640
      : 1545
    : curPlat === 5
    ? 760
    : 855;

  const platformStopDistance = getDistanceToXOnPath(train.routePath, targetStopX, train.direction);

  // 0. FITUR KHUSUS: PRIORITAS TERTINGGI KLB (KERETA LUAR BIASA)
  // Aturan Operasional KLB:
  // 0. KLB (KERETA LUAR BIASA): Sesuai instruksi pengguna, jika ada KLB lewat fungsi kereta lain
  // TETAP NORMAL dan TIDAK DITAHAN. Semua kereta berjalan sesuai persinyalan dan wesel standar.
  train.isHeldForKLB = false;

  // 0b. Headway Protection & Antrean Kereta (Queueing System Sinyal Masuk)
  const precedingTrains = allTrains.filter((other) => {
    if (other.id === train.id || other.status === 'selesai' || other.direction !== train.direction) {
      return false;
    }
    // Kereta lain harus berada di depan kereta ini
    if (other.carriages[0].distanceOnRoute <= leadCar.distanceOnRoute) {
      return false;
    }
    // Cek antrean di jalur pendekatan
    const otherInApproach = other.carriages[0].distanceOnRoute < homeSignalDistance + 80;
    const thisInApproach = leadCar.distanceOnRoute < homeSignalDistance;
    if (otherInApproach && thisInApproach) {
      return true;
    }
    // Jika sudah masuk peron yang sama
    return other.assignedPlatform === train.assignedPlatform;
  });

  let closestAhead: Train | null = null;
  let distanceToTailAhead = 99999;
  let tailAheadDistance = 99999;

  if (precedingTrains.length > 0) {
    precedingTrains.sort((a, b) => a.carriages[0].distanceOnRoute - b.carriages[0].distanceOnRoute);
    closestAhead = precedingTrains[0];
    const tailCarAhead = closestAhead.carriages[closestAhead.carriages.length - 1];
    tailAheadDistance = tailCarAhead.distanceOnRoute;
    distanceToTailAhead = tailAheadDistance - leadCar.distanceOnRoute;
  }

  // 1. Logika Kecepatan, Antrean & Sinyal Masuk (Sebelum melewati Sinyal Masuk)
  const isBeforeHomeSignal = leadCar.distanceOnRoute < homeSignalDistance;

  if (isBeforeHomeSignal) {
    const signalStopLine = homeSignalDistance - 45;
    const queueBuffer = 75;
    const queueStopLine = closestAhead ? tailAheadDistance - queueBuffer : signalStopLine;

    if (!homeSignal || homeSignal.aspect === 'merah') {
      train.status = 'menunggu_masuk';
      const effectiveStopLine = Math.min(signalStopLine, queueStopLine);
      const distToStop = effectiveStopLine - leadCar.distanceOnRoute;

      if (distToStop <= 4) {
        train.speed = 0;
        train.targetSpeed = 0;
        leadCar.distanceOnRoute = Math.min(leadCar.distanceOnRoute, effectiveStopLine);
      } else if (distToStop < 450) {
        const decelSpeed = Math.max(0, Math.min(train.maxSpeed * 0.7, distToStop * 0.42));
        train.targetSpeed = decelSpeed;
        if (distToStop <= 8 && train.speed < 12) {
          train.speed = 0;
          train.targetSpeed = 0;
          leadCar.distanceOnRoute = Math.min(leadCar.distanceOnRoute, effectiveStopLine);
        }
      } else {
        train.targetSpeed = train.maxSpeed * 0.75;
      }
    } else {
      // Sinyal Masuk Hijau / Kuning
      // Cek apakah ada kereta lain langsung di depan sebelum tiang sinyal
      if (closestAhead && closestAhead.carriages[0].distanceOnRoute < homeSignalDistance && distanceToTailAhead < 180) {
        const safeHeadwaySpeed = Math.max(0, Math.min(train.maxSpeed * 0.5, (distanceToTailAhead - 75) * 0.4));
        train.targetSpeed = safeHeadwaySpeed;
        if (distanceToTailAhead <= 75) {
          train.speed = 0;
          train.targetSpeed = 0;
          leadCar.distanceOnRoute = Math.min(leadCar.distanceOnRoute, queueStopLine);
        }
      } else {
        // Cek tenggorokan wesel masuk
        const throatOccupied = isEntranceThroatOccupied(train.direction, allTrains, train.id);
        // Cek apakah peron target sedang ditempati kereta lain
        const occupyingTrain = isPlatformOccupied(train.assignedPlatform, allTrains, train.id);

        if (throatOccupied) {
          // Tunggu di tiang sinyal sampai wesel masuk kosong
          const distToSignal = signalStopLine - leadCar.distanceOnRoute;
          if (distToSignal <= 6) {
            train.speed = 0;
            train.targetSpeed = 0;
            leadCar.distanceOnRoute = Math.min(leadCar.distanceOnRoute, signalStopLine);
          } else {
            train.targetSpeed = Math.max(0, Math.min(train.maxSpeed * 0.5, distToSignal * 0.4));
          }
        } else if (occupyingTrain) {
          // "buat kereta bisa masuk ke jalur lain, setelah ada kereta di peron lain, sehingga bisa lebih cepat dalam melayani penumpang"
          // Cari jalur/peron kosong lain yang siap menerima kereta
          const freePlatform = [1, 2, 3, 4, 5].find((p) => !isPlatformOccupied(p, allTrains, train.id));
          if (freePlatform) {
            train.assignedPlatform = freePlatform;
            const updatedSwitches = setSwitchesForPlatform(train.direction, freePlatform, switches);
            const { path, trackId } = calculateTrainRoute(train.direction, updatedSwitches);
            train.routePath = path;
            train.currentTrackId = trackId;
            result.switchesUpdated = updatedSwitches;
            train.targetSpeed = homeSignal.aspect === 'kuning' ? train.maxSpeed * 0.55 : train.maxSpeed * 0.85;
            train.status = 'masuk_stasiun';
            result.alert = {
              type: 'sukses',
              message: `⚡ Jalur ${occupyingTrain.assignedPlatform} ada ${occupyingTrain.name}. ${train.name} lekas masuk ke Jalur ${freePlatform} yang kosong agar lebih cepat melayani penumpang!`,
            };
          } else {
            // Semua 5 peron stasiun penuh, tahan di tiang sinyal
            const distToSignal = signalStopLine - leadCar.distanceOnRoute;
            if (distToSignal <= 6) {
              train.speed = 0;
              train.targetSpeed = 0;
              leadCar.distanceOnRoute = Math.min(leadCar.distanceOnRoute, signalStopLine);
            } else {
              train.targetSpeed = Math.max(0, Math.min(train.maxSpeed * 0.5, distToSignal * 0.4));
            }
            result.alert = {
              type: 'peringatan',
              message: `⚠️ Seluruh peron stasiun sedang terisi! ${train.name} menunggu di Sinyal Masuk.`,
            };
          }
        } else {
          // Wesel dan peron aman! Masuk stasiun
          train.targetSpeed = homeSignal.aspect === 'kuning' ? train.maxSpeed * 0.55 : train.maxSpeed * 0.85;
          train.status = 'masuk_stasiun';
        }
      }
    }
  } else {
    // Kereta TELAH MELEWATI Sinyal Masuk!
    // KUNCI PERSINYALAN: Sinyal otomatis kembali MERAH TEPAT SATU KALI saat roda pertama melintas
    if (!train.hasPassedHomeSignal) {
      train.hasPassedHomeSignal = true;
      train.isRouteLocked = true;
      if (homeSignal && homeSignal.aspect !== 'merah') {
        homeSignal.aspect = 'merah';
        if (!result.signalsAutoTurnedRed) result.signalsAutoTurnedRed = [];
        result.signalsAutoTurnedRed.push(homeSignal.id);
        result.alert = {
          type: 'info',
          message: `Sinyal Masuk ${homeSignal.name} otomatis kembali MERAH setelah dilintasi ${train.name}.`,
        };
      }
    }
    if (train.status === 'menunggu_masuk') {
      train.status = 'masuk_stasiun';
    }
  }

  // 2. Logika Masuk Stasiun & Pemeriksaan Peron
  if (train.status === 'masuk_stasiun') {
    const currentPlatform =
      leadCar.y < 310 ? 1 : leadCar.y < 390 ? 2 : leadCar.y < 470 ? 3 : leadCar.y < 550 ? 4 : 5;

      // Cek ketika kepala kereta telah melewati wesel dan mencapai area peron
      if (leadCar.distanceOnRoute >= 1550 && !train.hasTriggeredWrongPlatform) {
        train.hasTriggeredWrongPlatform = true;
        train.assignedPlatform = currentPlatform;
        result.scoreGained += 75;
        result.alert = {
          type: 'sukses',
          message: `✅ ${train.name} (${train.trainNumber}) selamat tiba di Jalur ${currentPlatform} (Pilihan PPKA)! (+75 Poin)`,
        };
      }

      // Pemeriksaan apakah kereta merupakan kereta langsung (kargo, BBM, Petikemas, KLB, atau KA Non-stop)
      const isDirectThroughTrain =
        train.isNonStop ||
        train.isKLB ||
        train.type === 'kargo' ||
        train.type === 'bbm' ||
        train.type === 'petikemas' ||
        train.type === 'klb';

      // Melambat mendekati titik henti peron HANYA jika kereta penumpang reguler
      if (!isDirectThroughTrain) {
        const distToStop = platformStopDistance - leadCar.distanceOnRoute;
        if (distToStop > 0 && distToStop < 450) {
          train.targetSpeed = Math.max(0, Math.min(train.maxSpeed * 0.75, (distToStop - 15) * 0.4));
          if (distToStop < 22 && train.speed < 10) {
            train.speed = 0;
            train.targetSpeed = 0;
            leadCar.distanceOnRoute = platformStopDistance;
            train.status = 'berhenti_di_peron';
            if (train.type === 'krl') {
              soundEngine.playKRLDoorChime();
            } else {
              soundEngine.playStationArrivalChime();
            }
            result.alert = {
              type: 'sukses',
              message: `${train.name} tiba di Jalur ${train.assignedPlatform}. Pelayanan naik/turun penumpang aktif.`,
            };
          }
        } else if (distToStop <= 0) {
          train.speed = 0;
          train.targetSpeed = 0;
          leadCar.distanceOnRoute = platformStopDistance;
          train.status = 'berhenti_di_peron';
        }
      } else {
        // Kereta kargo, BBM, petikemas, dan KLB: BERJALAN LANGSUNG (tidak berhenti di stasiun)
        // Mengecek Sinyal Berangkat apakah aman untuk melintas langsung
        const distToDep = departureSignalDistance - leadCar.distanceOnRoute;
        if (depSignal && depSignal.aspect === 'merah') {
          if (distToDep <= 50) {
            train.speed = 0;
            train.targetSpeed = 0;
            leadCar.distanceOnRoute = Math.min(leadCar.distanceOnRoute, departureSignalDistance - 50);
            train.status = 'siap_berangkat';
            result.alert = {
              type: 'peringatan',
              message: `⚠️ ${train.name} (Berjalan Langsung) tertahan di Jalur ${curPlat} karena Sinyal Berangkat ${depSignal.name} MERAH!`,
            };
          } else if (distToDep < 450) {
            train.targetSpeed = Math.max(0, Math.min(train.maxSpeed * 0.75, (distToDep - 50) * 0.45));
          }
        } else {
          // Sinyal Berangkat Hijau/Kuning: Melaju melintas langsung tanpa henti!
          train.targetSpeed = train.maxSpeed * 0.9;
          if (leadCar.distanceOnRoute > platformStopDistance - 100) {
            train.status = 'berangkat';
          }
        }
      }
  }

  // 3. Logika Berhenti di Peron (Dwell / Naik Turun Penumpang)
  if (train.status === 'berhenti_di_peron') {
    const isDirectThroughTrain =
      train.isNonStop ||
      train.isKLB ||
      train.type === 'kargo' ||
      train.type === 'bbm' ||
      train.type === 'petikemas' ||
      train.type === 'klb';

    if (isDirectThroughTrain) {
      // Kereta kargo, bbm, petikemas, klb tidak berhenti di peron - langsung berangkat
      train.status = 'berangkat';
      train.targetSpeed = train.maxSpeed * 0.9;
    } else {
      train.speed = 0;
      train.targetSpeed = 0;
      train.dwellTimer -= deltaSeconds;
      if (train.dwellTimer <= 0) {
        train.status = 'siap_berangkat';
        result.alert = {
          type: 'info',
          message: `${train.name} (${train.trainNumber}) selesai melayani penumpang di Jalur ${train.assignedPlatform}. Siap diberangkatkan!`,
        };
      }
    }
  }

  // 4. Logika Siap Berangkat & Sinyal Berangkat
  if (train.status === 'siap_berangkat') {
    if (!depSignal || depSignal.aspect === 'merah') {
      train.targetSpeed = 0;
      train.speed = 0;
    } else {
      train.status = 'berangkat';
      train.targetSpeed = depSignal.aspect === 'kuning' ? train.maxSpeed * 0.55 : train.maxSpeed * 0.85;
      soundEngine.playDepartureWhistle();
      setTimeout(() => {
        if (train.type === 'krl' || train.type === 'commuter') {
          soundEngine.playKRLHorn();
        } else {
          soundEngine.playTrainHorn();
        }
      }, 400);
      result.alert = {
        type: 'sukses',
        message: `Peluit kondektur (Semboyan 41) & Klakson (Semboyan 35) dibunyikan. ${train.name} diberangkatkan dari Jalur ${curPlat}!`,
      };
    }
  }

  // 5. Bergerak Berangkat Menuju Stasiun Selanjutnya
  if (train.status === 'berangkat') {
    // Periksa apakah kereta belum melewati Sinyal Berangkat
    if (leadCar.distanceOnRoute < departureSignalDistance) {
      if (depSignal && depSignal.aspect === 'merah') {
        const distToDep = departureSignalDistance - leadCar.distanceOnRoute;
        if (distToDep <= 50) {
          train.speed = 0;
          train.targetSpeed = 0;
          leadCar.distanceOnRoute = Math.min(leadCar.distanceOnRoute, departureSignalDistance - 50);
          train.status = 'siap_berangkat';
        } else {
          train.targetSpeed = Math.max(0, (distToDep - 50) * 0.45);
        }
      } else {
        train.targetSpeed = depSignal?.aspect === 'kuning' ? train.maxSpeed * 0.55 : train.maxSpeed * 0.85;
      }
    } else {
        // Kereta TELAH MELEWATI Sinyal Berangkat!
        // Sinyal berangkat otomatis berubah menjadi MERAH TEPAT SATU KALI
        if (!train.hasPassedDepartureSignal) {
          train.hasPassedDepartureSignal = true;
          if (depSignal && depSignal.aspect !== 'merah') {
            depSignal.aspect = 'merah';
            if (!result.signalsAutoTurnedRed) result.signalsAutoTurnedRed = [];
            result.signalsAutoTurnedRed.push(depSignal.id);
            result.alert = {
              type: 'info',
              message: `Sinyal Berangkat ${depSignal.name} otomatis kembali MERAH setelah dilintasi ${train.name}.`,
            };
          }
        }

        // Headway proteksi di jalur keluar stasiun
        const aheadDeparting = allTrains.find(
          (ot) =>
            ot.id !== train.id &&
            ot.status === 'berangkat' &&
            ot.direction === train.direction &&
            ot.carriages[0].distanceOnRoute > leadCar.distanceOnRoute
        );
        if (aheadDeparting) {
          const tailAhead = aheadDeparting.carriages[aheadDeparting.carriages.length - 1];
          const dist = tailAhead.distanceOnRoute - leadCar.distanceOnRoute;
          if (dist < 180) {
            train.targetSpeed = Math.max(0, Math.min(train.maxSpeed * 0.6, (dist - 80) * 0.4));
          } else {
            train.targetSpeed = train.maxSpeed;
          }
        } else {
          train.targetSpeed = train.maxSpeed;
        }

        // Cek jika seluruh 8 gerbong sudah keluar stasiun
        const lastCar = train.carriages[train.carriages.length - 1];
        if (lastCar.distanceOnRoute >= pathLength - 100) {
          train.status = 'selesai';
          const gain = train.isKLB ? 600 : 300;
          result.scoreGained += gain;
          result.safeDispatch = true;
          soundEngine.playSuccessChime();
          result.alert = {
            type: 'sukses',
            message: train.isKLB
              ? `⭐ KLB Prioritas Tertinggi (${train.name}) SELAMAT MELINTAS & KELUAR EMPLASEMEN! (+600 Poin)`
              : `🎉 ${train.name} (${train.trainNumber}) SELAMAT BERHASIL BERANGKAT! (+300 Poin)`,
          };
        }
      }
    }

  // Akselerasi / Deselerasi halus
  if (train.speed < train.targetSpeed) {
    train.speed = Math.min(train.targetSpeed, train.speed + 35 * deltaSeconds);
  } else if (train.speed > train.targetSpeed) {
    train.speed = Math.max(train.targetSpeed, train.speed - 55 * deltaSeconds);
  }

  // Pindahkan seluruh 8 gerbong secara terpisah dan tersambung
  const moveDistance = train.speed * deltaSeconds;
  leadCar.distanceOnRoute += moveDistance;

  for (let i = 0; i < 8; i++) {
    const car = train.carriages[i];
    // Pastikan setiap gerbong terangkai tepat di belakang gerbong di depannya
    car.distanceOnRoute = leadCar.distanceOnRoute - i * CAR_STEP;

    // Ambil koordinat dan sudut spline berdasarkan jarak car
    const { x, y, angle } = getPointAndAngleAtDistance(train.routePath, Math.max(0, car.distanceOnRoute));
    car.x = x;
    car.y = y;
    car.angle = angle;
  }

  return result;
}

/**
 * Mendeteksi konflik atau tabrakan antar kereta di jaringan rel.
 * Sesuai aturan PPKA: Tabrakan HANYA terjadi di dalam emplasemen stasiun
 * jika pemain salah mengatur wesel atau sinyal (misal: dua kereta masuk ke jalur/peron yang sama,
 * atau persilangan bertabrakan). Antrean di luar sinyal masuk tidak pernah tabrakan.
 */
export function checkTrainConflicts(trains: Train[]): {
  hasConflict: boolean;
  collidingTrainIds: string[];
} {
  const activeTrains = trains.filter((t) => t.status !== 'selesai');
  const collidingTrainIds: string[] = [];

  for (let i = 0; i < activeTrains.length; i++) {
    for (let j = i + 1; j < activeTrains.length; j++) {
      const trainA = activeTrains[i];
      const trainB = activeTrains[j];

      // Tabrakan hanya dapat terjadi jika setidaknya satu kereta sedang melaju
      if (trainA.speed < 2 && trainB.speed < 2) continue;

      let conflict = false;
      for (const carA of trainA.carriages) {
        // HANYA area emplasemen stasiun & wesel (X: 460 s/d 1940)
        // Di luar area ini adalah blok pendekatan sinyal masuk (tempat mengantre aman)
        if (carA.x < 460 || carA.x > 1940) continue;

        for (const carB of trainB.carriages) {
          if (carB.x < 460 || carB.x > 1940) continue;

          const dist = Math.hypot(carA.x - carB.x, carA.y - carB.y);
          if (dist < 28) {
            // Benturan fisik antar gerbong di dalam stasiun
            conflict = true;
            break;
          }
        }
        if (conflict) break;
      }

      if (conflict) {
        // Cek apakah tabrakan ini baru saja terjadi (belum dipotong nyawa sebelumnya)
        const isNewCollision = !trainA.hasCollided || !trainB.hasCollided;
        trainA.hasCollided = true;
        trainB.hasCollided = true;
        trainA.speed = 0;
        trainA.targetSpeed = 0;
        trainB.speed = 0;
        trainB.targetSpeed = 0;

        if (isNewCollision) {
          collidingTrainIds.push(trainA.id, trainB.id);
        }
      }
    }
  }

  return {
    hasConflict: collidingTrainIds.length > 0,
    collidingTrainIds,
  };
}
