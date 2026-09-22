import { Point2D, SignalNode, SwitchNode, TrackSegment } from '../types';

export interface StationDimensions {
  width: number;
  height: number;
}

export const STATION_BOUNDS: StationDimensions = {
  width: 2400,
  height: 900,
};

// Platform coordinates and definitions
export interface PlatformDef {
  number: number;
  name: string;
  trackId: string;
  xStart: number;
  xEnd: number;
  y: number;
  type: 'stasiun_utama' | 'pulau' | 'sisi';
  label: string;
  hasOverheadRoof: boolean;
}

export const PLATFORMS: PlatformDef[] = [
  {
    number: 1,
    name: 'Peron 1 (Utama)',
    trackId: 'track_1',
    xStart: 850,
    xEnd: 1550,
    y: 280,
    type: 'stasiun_utama',
    label: 'PERON 1 - EKSEKUTIF / ARGO',
    hasOverheadRoof: true,
  },
  {
    number: 2,
    name: 'Peron 2',
    trackId: 'track_2',
    xStart: 850,
    xEnd: 1550,
    y: 360,
    type: 'pulau',
    label: 'PERON 2 - REGIONAL / CAMPURAN',
    hasOverheadRoof: true,
  },
  {
    number: 3,
    name: 'Peron 3',
    trackId: 'track_3',
    xStart: 850,
    xEnd: 1550,
    y: 440,
    type: 'pulau',
    label: 'PERON 3 - EKONOMI PREMIUM',
    hasOverheadRoof: true,
  },
  {
    number: 4,
    name: 'Jalur 4 (Langsung)',
    trackId: 'track_4',
    xStart: 850,
    xEnd: 1550,
    y: 520,
    type: 'sisi',
    label: 'JALUR 4 - LANGSUNG / KARGO',
    hasOverheadRoof: false,
  },
  {
    number: 5,
    name: 'Peron 5 (Komuter)',
    trackId: 'track_5',
    xStart: 740,
    xEnd: 1660,
    y: 600,
    type: 'pulau',
    label: 'PERON 5 - COMMUTER LINE / LOKAL',
    hasOverheadRoof: true,
  },
];

// Switches list
export const INITIAL_SWITCHES: SwitchNode[] = [
  // Wesel Barat (West Throat) - Mengatur percabangan dari Jalur Masuk Bawah (Y: 440) ke Arah Timur
  {
    id: 'W-01',
    name: 'Wesel 01 (Barat P3 vs P1-2)',
    x: 360,
    y: 440,
    position: 'lurus',
    sourceTrackId: 'in_west',
    straightTrackId: 'track_3',
    divergingTrackId: 'track_2',
    facingDirection: 'ke_timur',
  },
  {
    id: 'W-02',
    name: 'Wesel 02 (Barat P3 vs J4-5)',
    x: 480,
    y: 440,
    position: 'lurus',
    sourceTrackId: 'track_3',
    straightTrackId: 'track_3',
    divergingTrackId: 'track_4',
    facingDirection: 'ke_timur',
  },
  {
    id: 'W-03',
    name: 'Wesel 03 (Barat P2 vs P1)',
    x: 480,
    y: 360,
    position: 'lurus',
    sourceTrackId: 'track_2',
    straightTrackId: 'track_2',
    divergingTrackId: 'track_1',
    facingDirection: 'ke_timur',
  },
  {
    id: 'W-04',
    name: 'Wesel 04 (Barat J4 vs P5)',
    x: 600,
    y: 520,
    position: 'lurus',
    sourceTrackId: 'track_4',
    straightTrackId: 'track_4',
    divergingTrackId: 'track_5',
    facingDirection: 'ke_timur',
  },

  // Wesel Timur (East Throat) - Mengatur percabangan dari Jalur Masuk Atas (Y: 360) ke Arah Barat
  {
    id: 'W-05',
    name: 'Wesel 05 (Timur P2 vs P3-5)',
    x: 2040,
    y: 360,
    position: 'lurus',
    sourceTrackId: 'in_east',
    straightTrackId: 'track_2',
    divergingTrackId: 'track_3',
    facingDirection: 'ke_barat',
  },
  {
    id: 'W-06',
    name: 'Wesel 06 (Timur P3 vs J4-5)',
    x: 1920,
    y: 440,
    position: 'lurus',
    sourceTrackId: 'track_3',
    straightTrackId: 'track_3',
    divergingTrackId: 'track_4',
    facingDirection: 'ke_barat',
  },
  {
    id: 'W-07',
    name: 'Wesel 07 (Timur P2 vs P1)',
    x: 1920,
    y: 360,
    position: 'lurus',
    sourceTrackId: 'track_2',
    straightTrackId: 'track_2',
    divergingTrackId: 'track_1',
    facingDirection: 'ke_barat',
  },
  {
    id: 'W-08',
    name: 'Wesel 08 (Timur J4 vs P5)',
    x: 1800,
    y: 520,
    position: 'lurus',
    sourceTrackId: 'track_4',
    straightTrackId: 'track_4',
    divergingTrackId: 'track_5',
    facingDirection: 'ke_barat',
  },
];

// Signals list (Sinyal Masuk & Sinyal Berangkat)
export const INITIAL_SIGNALS: SignalNode[] = [
  // Sinyal Masuk Barat (SM-B) - Jalur Bawah untuk Kereta Arah Barat -> Timur (Y: 440)
  {
    id: 'SM-01',
    name: 'Sinyal Masuk Barat (SM-B)',
    x: 280,
    y: 470,
    aspect: 'merah',
    type: 'masuk',
    direction: 'ke_timur',
    associatedTrackId: 'in_west',
    automatic: false,
  },
  // Sinyal Masuk Timur (SM-T) - Jalur Atas untuk Kereta Arah Timur -> Barat (Y: 360)
  {
    id: 'SM-02',
    name: 'Sinyal Masuk Timur (SM-T)',
    x: 2120,
    y: 330,
    aspect: 'merah',
    type: 'masuk',
    direction: 'ke_barat',
    associatedTrackId: 'in_east',
    automatic: false,
  },

  // Sinyal Berangkat ke Timur (di ujung timur setiap peron)
  {
    id: 'SB-01',
    name: 'Sinyal Berangkat P1-T',
    x: 1620,
    y: 250,
    aspect: 'merah',
    type: 'berangkat',
    direction: 'ke_timur',
    associatedTrackId: 'track_1',
    automatic: false,
  },
  {
    id: 'SB-02',
    name: 'Sinyal Berangkat P2-T',
    x: 1620,
    y: 330,
    aspect: 'merah',
    type: 'berangkat',
    direction: 'ke_timur',
    associatedTrackId: 'track_2',
    automatic: false,
  },
  {
    id: 'SB-03',
    name: 'Sinyal Berangkat P3-T',
    x: 1620,
    y: 410,
    aspect: 'merah',
    type: 'berangkat',
    direction: 'ke_timur',
    associatedTrackId: 'track_3',
    automatic: false,
  },
  {
    id: 'SB-04',
    name: 'Sinyal Berangkat J4-T',
    x: 1620,
    y: 490,
    aspect: 'merah',
    type: 'berangkat',
    direction: 'ke_timur',
    associatedTrackId: 'track_4',
    automatic: false,
  },
  {
    id: 'SB-05',
    name: 'Sinyal Berangkat P5-T',
    x: 1665,
    y: 570,
    aspect: 'merah',
    type: 'berangkat',
    direction: 'ke_timur',
    associatedTrackId: 'track_5',
    automatic: false,
  },

  // Sinyal Berangkat ke Barat (di ujung barat setiap peron)
  {
    id: 'SB-06',
    name: 'Sinyal Berangkat P1-B',
    x: 780,
    y: 250,
    aspect: 'merah',
    type: 'berangkat',
    direction: 'ke_barat',
    associatedTrackId: 'track_1',
    automatic: false,
  },
  {
    id: 'SB-07',
    name: 'Sinyal Berangkat P2-B',
    x: 780,
    y: 330,
    aspect: 'merah',
    type: 'berangkat',
    direction: 'ke_barat',
    associatedTrackId: 'track_2',
    automatic: false,
  },
  {
    id: 'SB-08',
    name: 'Sinyal Berangkat P3-B',
    x: 780,
    y: 410,
    aspect: 'merah',
    type: 'berangkat',
    direction: 'ke_barat',
    associatedTrackId: 'track_3',
    automatic: false,
  },
  {
    id: 'SB-09',
    name: 'Sinyal Berangkat J4-B',
    x: 780,
    y: 490,
    aspect: 'merah',
    type: 'berangkat',
    direction: 'ke_barat',
    associatedTrackId: 'track_4',
    automatic: false,
  },
  {
    id: 'SB-10',
    name: 'Sinyal Berangkat P5-B',
    x: 735,
    y: 630,
    aspect: 'merah',
    type: 'berangkat',
    direction: 'ke_barat',
    associatedTrackId: 'track_5',
    automatic: false,
  },
];

/**
 * Menghasilkan kurva / titik koordinat halus untuk jalur kereta
 */
export function generateBezierPoints(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, steps = 24): Point2D[] {
  const points: Point2D[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const inv = 1 - t;
    const x = inv * inv * inv * p0.x + 3 * inv * inv * t * p1.x + 3 * inv * t * t * p2.x + t * t * t * p3.x;
    const y = inv * inv * inv * p0.y + 3 * inv * inv * t * p1.y + 3 * inv * t * t * p2.y + t * t * t * p3.y;
    points.push({ x, y });
  }
  return points;
}

/**
 * Membuat kurva wesel rel yang halus, proporsional, dan memiliki garis singgung horizontal di kedua ujungnya
 */
export function createRailTurnout(p0: Point2D, p1: Point2D): Point2D[] {
  const dx = p1.x - p0.x;
  return generateBezierPoints(
    p0,
    { x: p0.x + dx * 0.45, y: p0.y },
    { x: p1.x - dx * 0.45, y: p1.y },
    p1,
    24
  );
}

/**
 * Menghitung rute perjalanan penuh berdasarkan konfigurasi wesel saat ini.
 * Regulasi Jalur Ganda:
 * - Jalur Bawah (Y = 440) khusus untuk ke arah TIMUR (barat_ke_timur)
 * - Jalur Atas (Y = 360) khusus untuk ke arah BARAT (timur_ke_barat)
 * Percabangan wesel yang proporsional memungkinkan akses ke seluruh peron (1 s/d 5).
 */
export function calculateTrainRoute(
  direction: 'barat_ke_timur' | 'timur_ke_barat',
  switchesOrLine?: SwitchNode[] | number,
  switchesList?: SwitchNode[]
): {
  path: Point2D[];
  resolvedPlatform: number;
  trackId: string;
} {
  let switches: SwitchNode[] = [];
  if (typeof switchesOrLine === 'number') {
    switches = setSwitchesForPlatform(direction, switchesOrLine, INITIAL_SWITCHES);
  } else if (Array.isArray(switchesOrLine)) {
    switches = switchesOrLine;
  } else if (Array.isArray(switchesList)) {
    switches = switchesList;
  } else {
    switches = INITIAL_SWITCHES;
  }

  const getSwitch = (id: string) => switches.find((s) => s.id === id);
  const path: Point2D[] = [];

  if (direction === 'barat_ke_timur') {
    // 1. Jalur Pendekatan Barat (Arah Barat -> Timur pada JALUR BAWAH: Y = 440)
    // Sinyal Masuk Barat SM-01 berada di x = 280
    path.push({ x: -600, y: 440 });
    path.push({ x: 280, y: 440 }); // Sinyal Masuk Barat (SM-01)

    let currentY = 440;
    let resolvedPlatform = 3;
    let currentTrackId = 'track_3';

    // Rangkaian Wesel Barat (West Throat)
    path.push({ x: 360, y: 440 });
    const w01 = getSwitch('W-01');

    if (w01?.position === 'belok') {
      // Crossover naik ke Y: 360 menuju W-03 (x: 480)
      const curve1to3 = createRailTurnout({ x: 360, y: 440 }, { x: 480, y: 360 });
      path.push(...curve1to3);

      const w03 = getSwitch('W-03');
      if (w03?.position === 'belok') {
        // Belok naik ke Peron 1 (Y: 280) di x: 600
        const curve3to1 = createRailTurnout({ x: 480, y: 360 }, { x: 600, y: 280 });
        path.push(...curve3to1);
        currentY = 280;
        resolvedPlatform = 1;
        currentTrackId = 'track_1';
      } else {
        // Lurus ke Peron 2 (Y: 360)
        path.push({ x: 600, y: 360 });
        currentY = 360;
        resolvedPlatform = 2;
        currentTrackId = 'track_2';
      }
    } else {
      // Lurus di Y: 440 menuju W-02 (x: 480)
      path.push({ x: 480, y: 440 });
      const w02 = getSwitch('W-02');

      if (w02?.position === 'lurus') {
        // Lurus ke Peron 3 (Y: 440)
        path.push({ x: 600, y: 440 });
        currentY = 440;
        resolvedPlatform = 3;
        currentTrackId = 'track_3';
      } else {
        // Crossover turun ke Jalur 4 Langsung (Y: 520) di x: 600
        const curve2to4 = createRailTurnout({ x: 480, y: 440 }, { x: 600, y: 520 });
        path.push(...curve2to4);

        const w04 = getSwitch('W-04');
        if (w04?.position === 'lurus') {
          path.push({ x: 720, y: 520 });
          currentY = 520;
          resolvedPlatform = 4;
          currentTrackId = 'track_4';
        } else {
          // Belok turun ke Peron 5 Komuter (Y: 600) di x: 720
          const curve4to5 = createRailTurnout({ x: 600, y: 520 }, { x: 720, y: 600 });
          path.push(...curve4to5);
          currentY = 600;
          resolvedPlatform = 5;
          currentTrackId = 'track_5';
        }
      }
    }

    // Melalui peron tengah stasiun & Sinyal Berangkat Timur
    if (currentY === 600) {
      path.push({ x: 1200, y: 600 });
      path.push({ x: 1680, y: 600 }); // Ujung Peron 5 Timur (SB-05)
      // Naik ke Jalur 4 (Y: 520) lewat wesel W-08 (1800, 520)
      const exitCurve1 = createRailTurnout({ x: 1680, y: 600 }, { x: 1800, y: 520 });
      path.push(...exitCurve1);
      // Naik dari Jalur 4 (Y: 520) ke Jalur Utama Bawah (Y: 440) lewat wesel W-06
      const exitCurve2 = createRailTurnout({ x: 1800, y: 520 }, { x: 1920, y: 440 });
      path.push(...exitCurve2);
      path.push({ x: 3000, y: 440 });
    } else if (currentY === 520) {
      path.push({ x: 1200, y: 520 });
      path.push({ x: 1800, y: 520 });
      const exitCurve = createRailTurnout({ x: 1800, y: 520 }, { x: 1920, y: 440 });
      path.push(...exitCurve);
      path.push({ x: 3000, y: 440 });
    } else if (currentY === 440) {
      path.push({ x: 1200, y: 440 });
      path.push({ x: 1920, y: 440 });
      path.push({ x: 3000, y: 440 });
    } else if (currentY === 360) {
      path.push({ x: 1200, y: 360 });
      path.push({ x: 1800, y: 360 });
      path.push({ x: 1920, y: 360 });
      const exitCurve = createRailTurnout({ x: 1920, y: 360 }, { x: 2040, y: 440 });
      path.push(...exitCurve);
      path.push({ x: 3000, y: 440 });
    } else {
      // Dari Peron 1 (Y: 280)
      path.push({ x: 1200, y: 280 });
      path.push({ x: 1800, y: 280 });
      const exitCurve1 = createRailTurnout({ x: 1800, y: 280 }, { x: 1920, y: 360 });
      const exitCurve2 = createRailTurnout({ x: 1920, y: 360 }, { x: 2040, y: 440 });
      path.push(...exitCurve1);
      path.push(...exitCurve2);
      path.push({ x: 3000, y: 440 });
    }

    return {
      path,
      resolvedPlatform,
      trackId: currentTrackId,
    };
  } else {
    // 2. Jalur Pendekatan Timur (Arah Timur -> Barat pada JALUR ATAS: Y = 360)
    // Sinyal Masuk Timur SM-02 berada di x = 2120
    path.push({ x: 3000, y: 360 });
    path.push({ x: 2120, y: 360 }); // Sinyal Masuk Timur (SM-02)

    let currentY = 360;
    let resolvedPlatform = 2;
    let currentTrackId = 'track_2';

    // Rangkaian Wesel Timur (East Throat)
    path.push({ x: 2040, y: 360 });
    const w05 = getSwitch('W-05');

    if (w05?.position === 'belok') {
      // Crossover turun ke Y: 440 menuju W-06 (x: 1920)
      const curve5to6 = createRailTurnout({ x: 2040, y: 360 }, { x: 1920, y: 440 });
      path.push(...curve5to6);

      const w06 = getSwitch('W-06');
      if (w06?.position === 'lurus') {
        // Lurus ke Peron 3 (Y: 440)
        path.push({ x: 1800, y: 440 });
        currentY = 440;
        resolvedPlatform = 3;
        currentTrackId = 'track_3';
      } else {
        // Crossover turun ke Y: 520 menuju W-08 (x: 1800)
        const curve6to8 = createRailTurnout({ x: 1920, y: 440 }, { x: 1800, y: 520 });
        path.push(...curve6to8);

        const w08 = getSwitch('W-08');
        if (w08?.position === 'lurus') {
          // Lurus ke Jalur 4 Langsung (Y: 520)
          path.push({ x: 1680, y: 520 });
          currentY = 520;
          resolvedPlatform = 4;
          currentTrackId = 'track_4';
        } else {
          // Belok turun ke Peron 5 Komuter (Y: 600) di x: 1680
          const curve8to5 = createRailTurnout({ x: 1800, y: 520 }, { x: 1680, y: 600 });
          path.push(...curve8to5);
          currentY = 600;
          resolvedPlatform = 5;
          currentTrackId = 'track_5';
        }
      }
    } else {
      // Lurus di Y: 360 menuju W-07 (x: 1920)
      path.push({ x: 1920, y: 360 });
      const w07 = getSwitch('W-07');

      if (w07?.position === 'lurus') {
        // Lurus ke Peron 2 (Y: 360)
        path.push({ x: 1800, y: 360 });
        currentY = 360;
        resolvedPlatform = 2;
        currentTrackId = 'track_2';
      } else {
        // Belok naik ke Peron 1 (Y: 280) di x: 1800
        const curve7to1 = createRailTurnout({ x: 1920, y: 360 }, { x: 1800, y: 280 });
        path.push(...curve7to1);
        currentY = 280;
        resolvedPlatform = 1;
        currentTrackId = 'track_1';
      }
    }

    // Melalui peron tengah stasiun & Sinyal Berangkat Barat
    if (currentY === 600) {
      path.push({ x: 1200, y: 600 });
      path.push({ x: 720, y: 600 }); // Sinyal Berangkat P5 Barat (SB-10)
      const exitCurve5 = createRailTurnout({ x: 720, y: 600 }, { x: 600, y: 520 });
      path.push(...exitCurve5);
      const exitCurve4 = createRailTurnout({ x: 600, y: 520 }, { x: 480, y: 440 });
      path.push(...exitCurve4);
      const exitCurve3 = createRailTurnout({ x: 480, y: 440 }, { x: 360, y: 360 });
      path.push(...exitCurve3);
      path.push({ x: -600, y: 360 });
    } else if (currentY === 520) {
      path.push({ x: 1200, y: 520 });
      path.push({ x: 600, y: 520 });
      const exitCurve4 = createRailTurnout({ x: 600, y: 520 }, { x: 480, y: 440 });
      path.push(...exitCurve4);
      const exitCurve3 = createRailTurnout({ x: 480, y: 440 }, { x: 360, y: 360 });
      path.push(...exitCurve3);
      path.push({ x: -600, y: 360 });
    } else if (currentY === 440) {
      path.push({ x: 1200, y: 440 });
      path.push({ x: 600, y: 440 });
      const exitCurve = createRailTurnout({ x: 480, y: 440 }, { x: 360, y: 360 });
      path.push(...exitCurve);
      path.push({ x: -600, y: 360 });
    } else if (currentY === 360) {
      path.push({ x: 1200, y: 360 });
      path.push({ x: 600, y: 360 });
      path.push({ x: 360, y: 360 });
      path.push({ x: -600, y: 360 });
    } else {
      // Peron 1 (Y: 280)
      path.push({ x: 1200, y: 280 });
      path.push({ x: 600, y: 280 });
      const exitCurve = createRailTurnout({ x: 600, y: 280 }, { x: 480, y: 360 });
      path.push(...exitCurve);
      path.push({ x: 360, y: 360 });
      path.push({ x: -600, y: 360 });
    }

    return {
      path,
      resolvedPlatform,
      trackId: currentTrackId,
    };
  }
}

/**
 * Menghitung posisi dan sudut titik pada polyline path berdasarkan jarak akumulatif
 */
export function getPointAndAngleAtDistance(path: Point2D[], targetDistance: number): { x: number; y: number; angle: number } {
  if (path.length === 0) return { x: 0, y: 0, angle: 0 };
  if (path.length === 1) return { x: path[0].x, y: path[0].y, angle: 0 };

  let totalDist = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1].x - path[i].x;
    const dy = path[i + 1].y - path[i].y;
    const segDist = Math.hypot(dx, dy);

    if (totalDist + segDist >= targetDistance) {
      const remaining = targetDistance - totalDist;
      const ratio = segDist > 0 ? remaining / segDist : 0;
      const x = path[i].x + dx * ratio;
      const y = path[i].y + dy * ratio;
      const angle = Math.atan2(dy, dx);
      return { x, y, angle };
    }

    totalDist += segDist;
  }

  // Jika melebihi rute, ambil segmen terakhir
  const last = path[path.length - 1];
  const secondLast = path[path.length - 2];
  const angle = Math.atan2(last.y - secondLast.y, last.x - secondLast.x);
  return { x: last.x, y: last.y, angle };
}

export function getTotalPathLength(path: Point2D[]): number {
  let length = 0;
  for (let i = 0; i < path.length - 1; i++) {
    length += Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y);
  }
  return length;
}

/**
 * Menghitung jarak kumulatif tepat pada polyline rute saat koordinat X mencapai targetX.
 * Sesuai arah pergerakan kereta:
 * - barat_ke_timur: bergerak dari X kecil menuju X besar
 * - timur_ke_barat: bergerak dari X besar menuju X kecil
 */
export function getDistanceToXOnPath(
  path: Point2D[],
  targetX: number,
  direction: 'barat_ke_timur' | 'timur_ke_barat'
): number {
  if (path.length < 2) return 0;
  let accum = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    const segDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const dx = p2.x - p1.x;

    if (direction === 'barat_ke_timur') {
      if (dx > 0.001 && targetX >= p1.x && targetX <= p2.x) {
        const ratio = (targetX - p1.x) / dx;
        return accum + segDist * Math.max(0, Math.min(1, ratio));
      }
    } else {
      if (dx < -0.001 && targetX <= p1.x && targetX >= p2.x) {
        const ratio = (p1.x - targetX) / Math.abs(dx);
        return accum + segDist * Math.max(0, Math.min(1, ratio));
      }
    }

    accum += segDist;
  }

  return accum;
}

/**
 * Menyetel konfigurasi wesel secara instan untuk mengarahkan kereta ke jalur/peron pilihan pemain (1 s/d 5)
 */
export function setSwitchesForPlatform(
  direction: 'barat_ke_timur' | 'timur_ke_barat',
  platform: number,
  switches: SwitchNode[]
): SwitchNode[] {
  return switches.map((sw) => {
    if (direction === 'barat_ke_timur') {
      if (platform === 1) {
        if (sw.id === 'W-01') return { ...sw, position: 'belok' as const };
        if (sw.id === 'W-03') return { ...sw, position: 'belok' as const };
      } else if (platform === 2) {
        if (sw.id === 'W-01') return { ...sw, position: 'belok' as const };
        if (sw.id === 'W-03') return { ...sw, position: 'lurus' as const };
      } else if (platform === 3) {
        if (sw.id === 'W-01') return { ...sw, position: 'lurus' as const };
        if (sw.id === 'W-02') return { ...sw, position: 'lurus' as const };
      } else if (platform === 4) {
        if (sw.id === 'W-01') return { ...sw, position: 'lurus' as const };
        if (sw.id === 'W-02') return { ...sw, position: 'belok' as const };
        if (sw.id === 'W-04') return { ...sw, position: 'lurus' as const };
      } else if (platform === 5) {
        if (sw.id === 'W-01') return { ...sw, position: 'lurus' as const };
        if (sw.id === 'W-02') return { ...sw, position: 'belok' as const };
        if (sw.id === 'W-04') return { ...sw, position: 'belok' as const };
      }
    } else {
      // timur_ke_barat
      if (platform === 1) {
        if (sw.id === 'W-05') return { ...sw, position: 'lurus' as const };
        if (sw.id === 'W-07') return { ...sw, position: 'belok' as const };
      } else if (platform === 2) {
        if (sw.id === 'W-05') return { ...sw, position: 'lurus' as const };
        if (sw.id === 'W-07') return { ...sw, position: 'lurus' as const };
      } else if (platform === 3) {
        if (sw.id === 'W-05') return { ...sw, position: 'belok' as const };
        if (sw.id === 'W-06') return { ...sw, position: 'lurus' as const };
      } else if (platform === 4) {
        if (sw.id === 'W-05') return { ...sw, position: 'belok' as const };
        if (sw.id === 'W-06') return { ...sw, position: 'belok' as const };
        if (sw.id === 'W-08') return { ...sw, position: 'lurus' as const };
      } else if (platform === 5) {
        if (sw.id === 'W-05') return { ...sw, position: 'belok' as const };
        if (sw.id === 'W-06') return { ...sw, position: 'belok' as const };
        if (sw.id === 'W-08') return { ...sw, position: 'belok' as const };
      }
    }
    return sw;
  });
}
