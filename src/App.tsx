import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  TrainTrack,
  Clock,
  GitBranch,
  LayoutGrid,
  Compass,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react';
import { GameState, SignalAspect, SignalNode, StationAlert, SwitchNode, Train, TrainDirection, getInfinityRank } from './types';
import { INITIAL_SIGNALS, INITIAL_SWITCHES, STATION_BOUNDS, calculateTrainRoute, setSwitchesForPlatform } from './game/trackNetwork';
import { createNewTrain, createKLBTrain, updateTrainSimulation, checkTrainConflicts, getAvailablePlatform, isPlatformOccupied } from './game/trainManager';
import { stationRenderer } from './game/renderer';
import { soundEngine } from './audio/soundEngine';
import { DispatcherHUD } from './components/DispatcherHUD';
import { SchedulePanel } from './components/SchedulePanel';
import { InterlockingPanel } from './components/InterlockingPanel';
import { HelpModal } from './components/HelpModal';
import { GameOverModal } from './components/GameOverModal';
import { AlertBanner } from './components/AlertBanner';

export type ActiveMobileTab = 'canvas' | 'schedule' | 'interlocking';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Status Tampilan / Tab (Responsif HP & Tablet)
  const [activeTab, setActiveTab] = useState<ActiveMobileTab>('canvas');
  const [isDesktopSplitMode, setIsDesktopSplitMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Swipe gesture ref
  const touchStartXRef = useRef<number | null>(null);

  // Status Game State
  const [gameState, setGameState] = useState<GameState>({
    lives: 3,
    score: 0,
    level: 1,
    gameTimeSeconds: 0,
    trainsDispatched: 0,
    safeStreak: 0,
    isPaused: false,
    gameSpeed: 1,
    isGameOver: false,
    isSoundMuted: false,
    audioVolume: 0.7,
  });

  const [switches, setSwitches] = useState<SwitchNode[]>(INITIAL_SWITCHES);
  const [signals, setSignals] = useState<SignalNode[]>(INITIAL_SIGNALS);
  const [trains, setTrains] = useState<Train[]>([]);
  const [alerts, setAlerts] = useState<StationAlert[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Kamera Kanvas
  const [camera, setCamera] = useState({ x: -100, y: 0, zoom: 0.85 });
  const [hoveredSwitchId, setHoveredSwitchId] = useState<string | null>(null);
  const [hoveredSignalId, setHoveredSignalId] = useState<string | null>(null);

  // Refs untuk State yang digunakan dalam requestAnimationFrame
  const switchesRef = useRef(switches);
  switchesRef.current = switches;
  const signalsRef = useRef(signals);
  signalsRef.current = signals;
  const trainsRef = useRef(trains);
  trainsRef.current = trains;
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, camX: 0, camY: 0 });
  const lastSpawnTimeRef = useRef(0);
  const lastRumbleTimeRef = useRef(0);

  // Tambah Peringatan / Notifikasi Stasiun
  const addAlert = useCallback((type: 'info' | 'sukses' | 'peringatan' | 'bahaya', message: string) => {
    const totalSecs = 28800 + Math.floor(gameStateRef.current.gameTimeSeconds);
    const h = Math.floor(totalSecs / 3600) % 24;
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = Math.floor(totalSecs % 60);
    const timestamp = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    const newAlert: StationAlert = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp,
      type,
      message,
    };

    setAlerts((prev) => [...prev.slice(-4), newAlert]);
  }, []);

  // Ubah Posisi Wesel
  const handleToggleSwitch = useCallback((switchId: string) => {
    setSwitches((prevSwitches) => {
      const updated = prevSwitches.map((sw) => {
        if (sw.id === switchId) {
          const nextPos = sw.position === 'lurus' ? 'belok' : 'lurus';
          return { ...sw, position: nextPos };
        }
        return sw;
      });

      // Recalculate upcoming train routes yang belum melewati wesel ini
      setTrains((prevTrains) =>
        prevTrains.map((t) => {
          if (t.status === 'menunggu_masuk') {
            const recalculated = updateTrainRouteForSwitch(t, updated);
            return recalculated;
          }
          return t;
        })
      );

      return updated;
    });
  }, []);

  // Update Rute untuk kereta yang belum masuk (mengikuti jalur hasil setelan wesel PPKA)
  function updateTrainRouteForSwitch(train: Train, newSwitches: SwitchNode[]): Train {
    const { path, resolvedPlatform, trackId } = calculateTrainRoute(train.direction, newSwitches);
    return {
      ...train,
      routePath: path,
      assignedPlatform: resolvedPlatform,
      currentTrackId: trackId,
    };
  }

  // Pemain secara langsung menentukan jalur masuk kereta (Platform Assignment oleh PPKA)
  const handleAssignPlatform = useCallback((trainId: string, targetPlatform: number) => {
    const train = trainsRef.current.find((t) => t.id === trainId);
    if (!train) return;

    // Hanya dapat ditentukan saat kereta masih menunggu masuk sebelum memasuki wesel
    if (train.status !== 'menunggu_masuk') {
      return;
    }

    // Cek apakah target platform sedang ditempati oleh kereta lain
    const occupying = isPlatformOccupied(targetPlatform, trainsRef.current, trainId);
    if (occupying) {
      addAlert(
        'peringatan',
        `⚠️ Perhatian: Jalur ${targetPlatform} sedang ditempati ${occupying.name}. Kereta akan menunggu aman di luar sinyal jika jalur belum bebas.`
      );
    }

    // Hitung rute spesifik untuk kereta ini menuju target peron
    const { path, trackId } = calculateTrainRoute(train.direction, targetPlatform);

    // Cek apakah kereta ini berada paling depan di antrean menunggu_masuk arahnya
    const waitingSameDir = trainsRef.current
      .filter((t) => t.direction === train.direction && t.status === 'menunggu_masuk')
      .sort((a, b) => b.carriages[0].distanceOnRoute - a.carriages[0].distanceOnRoute);
    const isFrontTrain = waitingSameDir.length > 0 && waitingSameDir[0].id === train.id;

    if (isFrontTrain) {
      // Selaraskan konfigurasi wesel di stasiun agar langsung mengarah ke peron target kereta terdepan
      const updatedSwitches = setSwitchesForPlatform(train.direction, targetPlatform, switchesRef.current);
      setSwitches(updatedSwitches);
    }

    // Perbarui HANYA kereta target, jangan merusak peron yang telah dialokasikan ke kereta lain!
    setTrains((prevTrains) =>
      prevTrains.map((t) => {
        if (t.id === trainId) {
          return {
            ...t,
            assignedPlatform: targetPlatform,
            routePath: path,
            currentTrackId: trackId,
          };
        }
        return t;
      })
    );

    soundEngine.playSwitchSound();
    addAlert(
      'sukses',
      `🛤️ PPKA menentukan rute ${train.name} (${train.trainNumber}) ke JALUR ${targetPlatform}.`
    );
  }, [addAlert]);

  // Alihkan otomatis ke peron yang sedang kosong agar lebih cepat melayani penumpang
  const handleAutoRouteToFreePlatform = useCallback((trainId: string) => {
    const train = trainsRef.current.find((t) => t.id === trainId);
    if (!train || train.status !== 'menunggu_masuk') return;

    const freePlat = getAvailablePlatform(trainsRef.current, train.type, train.direction);
    handleAssignPlatform(trainId, freePlat);
    addAlert(
      'sukses',
      `⚡ Rute Cepat: ${train.name} dialihkan ke Jalur ${freePlat} (Kosong) agar lekas melayani penumpang!`
    );
  }, [handleAssignPlatform, addAlert]);

  // Memberikan Hak Jalan Mutlak untuk KLB secara langsung
  const handleClearKLBRoute = useCallback(() => {
    const activeKLB = trainsRef.current.find((t) => t.isKLB && t.status !== 'selesai');
    if (!activeKLB) return;

    // 1. Selaraskan wesel ke peron KLB
    const updatedSwitches = setSwitchesForPlatform(activeKLB.direction, activeKLB.assignedPlatform, switchesRef.current);
    setSwitches(updatedSwitches);

    // 2. Buka Sinyal Masuk dan Berangkat untuk KLB
    const isWest = activeKLB.direction === 'barat_ke_timur';
    const homeSigId = isWest ? 'SM-01' : 'SM-02';
    const curPlat = activeKLB.assignedPlatform;
    const depSigId = isWest
      ? `SB-0${curPlat}`
      : curPlat === 5
      ? 'SB-10'
      : `SB-0${5 + curPlat}`;

    setSignals((prev) =>
      prev.map((s) => {
        if (s.id === homeSigId || s.id === depSigId) {
          return { ...s, aspect: 'hijau' as SignalAspect };
        }
        return s;
      })
    );

    soundEngine.playSignalSound('hijau');
    addAlert(
      'sukses',
      `⭐ HAK JALAN MUTLAK DIBERIKAN: Jalur ${activeKLB.assignedPlatform} dibuka HIJAU penuh untuk ${activeKLB.name}!`
    );
  }, [addAlert]);

  // Penyetelan rute cepat ke jalur dari konsol wesel
  const handleSetRouteToPlatform = useCallback((direction: TrainDirection, platform: number) => {
    setSwitches((prevSwitches) => {
      const updated = setSwitchesForPlatform(direction, platform, prevSwitches);
      setTrains((prevTrains) =>
        prevTrains.map((t) => {
          if (t.direction === direction && t.status === 'menunggu_masuk') {
            const { path, resolvedPlatform, trackId } = calculateTrainRoute(t.direction, updated);
            return {
              ...t,
              assignedPlatform: resolvedPlatform,
              routePath: path,
              currentTrackId: trackId,
            };
          }
          return t;
        })
      );
      soundEngine.playSwitchSound();
      addAlert(
        'info',
        `Penyelarasan Wesel: Rute ${direction === 'barat_ke_timur' ? 'Barat' : 'Timur'} disetel menuju Jalur ${platform}.`
      );
      return updated;
    });
  }, [addAlert]);

  // Ubah Aspek Sinyal
  const handleSetSignalAspect = useCallback((signalId: string, aspect: SignalAspect) => {
    // ATURAN OPERASIONAL KLB:
    // 1. "jika berbeda arah dari klb, tidak mempengaruhi kereta tersebut"
    // 2. "klb bisa lewat asalkan kereta depannya sudah masuk stasiun, jadi kereta tetap bisa dijalankan walaupun ada klb yang mau melintas"
    const activeKLB = trainsRef.current.find((t) => t.isKLB && t.status !== 'selesai');
    if (activeKLB && aspect !== 'merah') {
      const isWestKLB = activeKLB.direction === 'barat_ke_timur';
      const oppositeHomeSignal = isWestKLB ? 'SM-02' : 'SM-01';
      const isOppositeDepartureSignal = isWestKLB
        ? ['SB-06', 'SB-07', 'SB-08', 'SB-09', 'SB-10'].includes(signalId)
        : ['SB-01', 'SB-02', 'SB-03', 'SB-04', 'SB-05'].includes(signalId);

      // Jika sinyal untuk arah yang BERBEDA dari KLB: DIIZINKAN PENUH!
      const isOppositeDirSignal = signalId === oppositeHomeSignal || isOppositeDepartureSignal;

      // Jika sinyal masuk sehaluan (agar kereta di depan KLB lekas masuk stasiun/peron): DIIZINKAN!
      const isHomeSignalSameDir = signalId === (isWestKLB ? 'SM-01' : 'SM-02');

      const klbDepSignal = isWestKLB
        ? `SB-0${activeKLB.assignedPlatform}`
        : activeKLB.assignedPlatform === 5
        ? 'SB-10'
        : `SB-0${5 + activeKLB.assignedPlatform}`;

      if (!isOppositeDirSignal && !isHomeSignalSameDir && signalId !== klbDepSignal) {
        soundEngine.playBuzzerWarning();
        addAlert(
          'peringatan',
          `⛔ Sinyal Berangkat ditahan sementara untuk memprioritaskan perlintasan KLB ${activeKLB.name}!`
        );
        return;
      }
    }

    setSignals((prev) =>
      prev.map((s) => {
        if (s.id === signalId) {
          soundEngine.playSignalSound(aspect);
          return { ...s, aspect };
        }
        return s;
      })
    );
  }, [addAlert]);

  // Initial Train Spawning & Reset Game
  const resetGame = useCallback(() => {
    const initialTrain = createNewTrain('barat_ke_timur', 1, INITIAL_SWITCHES);
    setTrains([initialTrain]);
    setSwitches(INITIAL_SWITCHES);
    setSignals(INITIAL_SIGNALS);
    setGameState({
      lives: 3,
      score: 0,
      level: 1,
      gameTimeSeconds: 0,
      trainsDispatched: 0,
      safeStreak: 0,
      isPaused: false,
      gameSpeed: 1,
      isGameOver: false,
      isSoundMuted: false,
      audioVolume: 0.7,
    });
    setAlerts([
      {
        id: 'start-1',
        timestamp: '08:00:00',
        type: 'info',
        message: 'Dinas PPKA Stasiun dimulai. Kereta pertama sedang mendekati Sinyal Masuk Barat!',
      },
    ]);
    centerCamera();
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Center Camera (Proporsional dan Menyesuaikan Lebar & Tinggi Layar)
  const centerCamera = useCallback(() => {
    const el = canvasContainerRef.current || containerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    // Station center is approximately (1200, 440)
    const zoom = Math.min(1.05, Math.max(0.6, Math.min(w / 2100, h / 700)));
    setCamera({
      x: w / 2 - 1200 * zoom,
      y: h / 2 - 440 * zoom,
      zoom,
    });
  }, []);

  const focusWest = useCallback(() => {
    const el = canvasContainerRef.current || containerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const zoom = Math.min(1.1, Math.max(0.7, Math.min(w / 1400, h / 650)));
    setCamera({
      x: w / 2 - 580 * zoom,
      y: h / 2 - 400 * zoom,
      zoom,
    });
  }, []);

  const focusEast = useCallback(() => {
    const el = canvasContainerRef.current || containerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const zoom = Math.min(1.1, Math.max(0.7, Math.min(w / 1400, h / 650)));
    setCamera({
      x: w / 2 - 1800 * zoom,
      y: h / 2 - 400 * zoom,
      zoom,
    });
  }, []);

  // Zoom in / Zoom out
  const handleZoomIn = () => {
    setCamera((prev) => ({ ...prev, zoom: Math.min(1.6, prev.zoom + 0.15) }));
  };
  const handleZoomOut = () => {
    setCamera((prev) => ({ ...prev, zoom: Math.max(0.45, prev.zoom - 0.15) }));
  };

  // Fokus ke Kereta Tertentu (otomatis berpindah ke tab kanvas di HP/Tablet)
  const handleFocusTrain = useCallback((train: Train) => {
    setActiveTab('canvas');
    const el = canvasContainerRef.current || containerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const lead = train.carriages[0];
    setCamera({
      x: w / 2 - lead.x * 0.9,
      y: h / 2 - lead.y * 0.9,
      zoom: 0.9,
    });
  }, []);

  // Panggil Kereta Luar Biasa (KLB) dengan Hak Prioritas Tertinggi
  const handleSpawnKLB = useCallback(() => {
    if (trainsRef.current.some((t) => t.isKLB && t.status !== 'selesai')) {
      return;
    }
    const direction: TrainDirection = Math.random() > 0.5 ? 'barat_ke_timur' : 'timur_ke_barat';
    const klbTrain = createKLBTrain(direction, switchesRef.current);
    setTrains((prev) => [...prev, klbTrain]);
    soundEngine.playKLBPriorityAlarm();
    addAlert(
      'info',
      `🚨 PERHATIAN PPKA: ${klbTrain.name} (${klbTrain.trainNumber}) memasuki wilayah stasiun! Operasional seluruh kereta tetap berjalan normal.`
    );
  }, [addAlert]);

  // Kontrol Mouse Canvas (Pan & Click Wesel / Sinyal)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      camX: cameraRef.current.x,
      camY: cameraRef.current.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setCamera({
        ...cameraRef.current,
        x: dragStartRef.current.camX + dx,
        y: dragStartRef.current.camY + dy,
      });
      return;
    }

    // Cek hover switch / signal di koordinat dunia (world space)
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseCanvasX = e.clientX - rect.left;
    const mouseCanvasY = e.clientY - rect.top;

    const worldX = (mouseCanvasX - cameraRef.current.x) / cameraRef.current.zoom;
    const worldY = (mouseCanvasY - cameraRef.current.y) / cameraRef.current.zoom;

    // Cek hover pada Wesel
    let foundSwitch: string | null = null;
    for (const sw of switchesRef.current) {
      const dist = Math.hypot(worldX - sw.x, worldY - sw.y);
      if (dist < 40) {
        foundSwitch = sw.id;
        break;
      }
    }
    setHoveredSwitchId(foundSwitch);

    // Cek hover pada Sinyal
    let foundSignal: string | null = null;
    for (const sig of signalsRef.current) {
      const dist = Math.hypot(worldX - sig.x, worldY - sig.y);
      if (dist < 32) {
        foundSignal = sig.id;
        break;
      }
    }
    setHoveredSignalId(foundSignal);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const wasDragging =
      Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y) > 6;
    isDraggingRef.current = false;

    if (!wasDragging) {
      // Ini adalah klik murni! Periksa objek yang diklik
      if (hoveredSwitchId) {
        handleToggleSwitch(hoveredSwitchId);
        soundEngine.playSwitchSound();
      } else if (hoveredSignalId) {
        const sig = signalsRef.current.find((s) => s.id === hoveredSignalId);
        if (sig) {
          // Putar aspek: Merah -> Hijau -> Kuning -> Merah
          const nextAspect: SignalAspect =
            sig.aspect === 'merah' ? 'hijau' : sig.aspect === 'hijau' ? 'kuning' : 'merah';
          handleSetSignalAspect(sig.id, nextAspect);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setCamera((prev) => ({
      ...prev,
      zoom: Math.min(1.8, Math.max(0.4, prev.zoom * zoomFactor)),
    }));
  };

  // Kontrol Sentuhan HP / Tablet (Pinch to Zoom, Drag to Pan, Tap to Switch/Signal)
  const touchDataRef = useRef<{
    startX: number;
    startY: number;
    camX: number;
    camY: number;
    startTime: number;
    initialDist?: number;
    initialZoom?: number;
  }>({ startX: 0, startY: 0, camX: 0, camY: 0, startTime: 0 });

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchDataRef.current = {
        startX: t.clientX,
        startY: t.clientY,
        camX: cameraRef.current.x,
        camY: cameraRef.current.y,
        startTime: Date.now(),
      };
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchDataRef.current = {
        ...touchDataRef.current,
        initialDist: dist,
        initialZoom: cameraRef.current.zoom,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - touchDataRef.current.startX;
      const dy = t.clientY - touchDataRef.current.startY;
      setCamera({
        ...cameraRef.current,
        x: touchDataRef.current.camX + dx,
        y: touchDataRef.current.camY + dy,
      });
    } else if (
      e.touches.length === 2 &&
      touchDataRef.current.initialDist &&
      touchDataRef.current.initialZoom
    ) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const scale = dist / touchDataRef.current.initialDist;
      setCamera((prev) => ({
        ...prev,
        zoom: Math.min(1.8, Math.max(0.4, touchDataRef.current.initialZoom! * scale)),
      }));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.changedTouches.length > 0) {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchDataRef.current.startX;
      const dy = t.clientY - touchDataRef.current.startY;
      const distMoved = Math.hypot(dx, dy);
      const timeDiff = Date.now() - touchDataRef.current.startTime;

      // Deteksi Tap cepat tanpa drag banyak
      if (distMoved < 15 && timeDiff < 400 && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const touchCanvasX = t.clientX - rect.left;
        const touchCanvasY = t.clientY - rect.top;
        const worldX = (touchCanvasX - cameraRef.current.x) / cameraRef.current.zoom;
        const worldY = (touchCanvasY - cameraRef.current.y) / cameraRef.current.zoom;

        // Cek tap Wesel
        let tappedSwitchId: string | null = null;
        for (const sw of switchesRef.current) {
          if (Math.hypot(worldX - sw.x, worldY - sw.y) < 45) {
            tappedSwitchId = sw.id;
            break;
          }
        }

        if (tappedSwitchId) {
          handleToggleSwitch(tappedSwitchId);
          soundEngine.playSwitchSound();
          return;
        }

        // Cek tap Sinyal
        let tappedSignalId: string | null = null;
        for (const sig of signalsRef.current) {
          if (Math.hypot(worldX - sig.x, worldY - sig.y) < 38) {
            tappedSignalId = sig.id;
            break;
          }
        }

        if (tappedSignalId) {
          const sig = signalsRef.current.find((s) => s.id === tappedSignalId);
          if (sig) {
            const nextAspect: SignalAspect =
              sig.aspect === 'merah' ? 'hijau' : sig.aspect === 'hijau' ? 'kuning' : 'merah';
            handleSetSignalAspect(sig.id, nextAspect);
            soundEngine.playSignalSound(nextAspect);
          }
        }
      }
    }
  };

  // Deteksi Slide / Swipe antar Tab di Layar Sentuh
  const handleSwipeTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleSwipeTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartXRef.current;
    touchStartXRef.current = null;

    // Ambang batas swipe: 60px
    if (Math.abs(deltaX) > 60) {
      if (deltaX < 0) {
        // Swipe ke kiri -> Tab berikutnya
        setActiveTab((curr) =>
          curr === 'canvas' ? 'schedule' : curr === 'schedule' ? 'interlocking' : 'canvas'
        );
      } else {
        // Swipe ke kanan -> Tab sebelumnya
        setActiveTab((curr) =>
          curr === 'interlocking' ? 'schedule' : curr === 'schedule' ? 'canvas' : 'interlocking'
        );
      }
    }
  };

  // Resize Canvas Otomatis dengan Rasio Proporsional Murni (Anti-Gepeng)
  useEffect(() => {
    let hasInitiallyCentered = false;
    const handleResize = () => {
      const el = canvasContainerRef.current;
      const canvas = canvasRef.current;
      if (canvas && el) {
        const w = Math.round(el.clientWidth);
        const h = Math.round(el.clientHeight);
        if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
          canvas.width = w;
          canvas.height = h;
          if (!hasInitiallyCentered) {
            hasInitiallyCentered = true;
            centerCamera();
          }
        }
      }
    };

    handleResize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && canvasContainerRef.current) {
      ro = new ResizeObserver(() => handleResize());
      ro.observe(canvasContainerRef.current);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Main Simulation & Rendering Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const elapsed = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const currentGameState = gameStateRef.current;
      const currentSwitches = switchesRef.current;
      const currentSignals = signalsRef.current;
      let currentTrains = trainsRef.current;

      if (!currentGameState.isPaused && !currentGameState.isGameOver) {
        const delta = Math.min(0.1, elapsed) * currentGameState.gameSpeed;
        const newGameTime = currentGameState.gameTimeSeconds + delta;

        // 1. Spawner Kereta Baru Berdasarkan Tingkat Infinity
        // Interval kedatangan dinamis, mengizinkan hingga 6 kereta aktif bersamaan di stasiun
        const activeCount = currentTrains.filter((t) => t.status !== 'selesai').length;
        const westWaiting = currentTrains.filter((t) => t.direction === 'barat_ke_timur' && t.status === 'menunggu_masuk').length;
        const eastWaiting = currentTrains.filter((t) => t.direction === 'timur_ke_barat' && t.status === 'menunggu_masuk').length;

        const spawnInterval = Math.max(9, 20 - Math.min(11, Math.log2(currentGameState.level + 1) * 3));
        if (activeCount < 6 && (currentTime - lastSpawnTimeRef.current > spawnInterval * 1000)) {
          lastSpawnTimeRef.current = currentTime;

          // Pilih arah kedatangan yang antreannya lebih sedikit
          let direction: TrainDirection = 'barat_ke_timur';
          if (westWaiting > eastWaiting) {
            direction = 'timur_ke_barat';
          } else if (eastWaiting > westWaiting) {
            direction = 'barat_ke_timur';
          } else {
            direction = Math.random() > 0.5 ? 'barat_ke_timur' : 'timur_ke_barat';
          }

          // Peluang alami kedatangan KLB (Kereta Luar Biasa) Prioritas
          const hasActiveKLB = currentTrains.some((t) => t.isKLB && t.status !== 'selesai');
          const isKLBChance = !hasActiveKLB && currentGameState.level >= 2 && Math.random() < 0.18;

          // Cari jalur/peron kosong agar kereta langsung tersebar merata melayani penumpang
          const freePlatform = getAvailablePlatform(currentTrains, undefined, direction);

          let newTrain: Train;
          if (isKLBChance) {
            newTrain = createKLBTrain(direction, currentSwitches, freePlatform);
            soundEngine.playKLBPriorityAlarm();
            addAlert(
              'peringatan',
              `🚨 PERHATIAN PPKA: ${newTrain.name} (${newTrain.trainNumber}) MEMASUKI STASIUN! Hak Prioritas Tertinggi aktif: Seluruh KA reguler wajib berhenti tertahan!`
            );
          } else {
            newTrain = createNewTrain(direction, currentGameState.level, currentSwitches, freePlatform);
            addAlert(
              'info',
              `Kereta ${newTrain.name} (${newTrain.trainNumber}) mendekati stasiun dari arah ${
                direction === 'barat_ke_timur' ? 'Barat' : 'Timur'
              }. Dialokasikan ke Jalur ${newTrain.assignedPlatform}.`
            );
          }

          currentTrains = [...currentTrains, newTrain];
        }

        // 2. Perbarui Fisika & Pergerakan Seluruh 8 Gerbong untuk Setiap Kereta
        let livesPenalty = 0;
        let scoreAdd = 0;
        let dispatchedIncrement = 0;
        let signalsNeedUpdate = false;
        let switchesNeedUpdate = false;
        let nextSwitches = currentSwitches;
        let currentSafeStreak = currentGameState.safeStreak || 0;

        let updatedTrains = currentTrains.map((train) => {
          const res = updateTrainSimulation(train, delta, currentSignals, currentSwitches, currentTrains);

          if (res.lifeLost) {
            livesPenalty++;
            currentSafeStreak = 0;
          }
          if (res.scoreGained > 0) {
            scoreAdd += res.scoreGained;
          }
          if (res.safeDispatch) {
            dispatchedIncrement++;
            currentSafeStreak++;
            // Semakin banyak kereta yang selamat berhasil berangkat, semakin tinggi perolehan skor!
            const totalDispatched = (currentGameState.trainsDispatched || 0) + dispatchedIncrement;
            // Bonus kelancaran beruntun (Safe Streak): +75 per streak, max 600
            const streakBonus = Math.min(600, (currentSafeStreak - 1) * 75);
            // Bonus volume dinas per kelipatan 3 KA selamat: +150
            const volumeBonus = totalDispatched % 3 === 0 ? 150 : 0;
            const extraScore = streakBonus + volumeBonus;
            if (extraScore > 0) {
              scoreAdd += extraScore;
              addAlert(
                'sukses',
                `🔥 DINAS PPKA SUKSES (${totalDispatched} KA Selamat)! Safe Streak x${currentSafeStreak} (+${extraScore} Bonus Skor)!`
              );
            }
          }
          if (res.signalsAutoTurnedRed && res.signalsAutoTurnedRed.length > 0) {
            signalsNeedUpdate = true;
          }
          if (res.switchesUpdated) {
            switchesNeedUpdate = true;
            nextSwitches = res.switchesUpdated;
          }
          if (res.alert) {
            addAlert(res.alert.type, res.alert.message);
          }

          return train;
        });

        if (signalsNeedUpdate) {
          setSignals([...currentSignals]);
        }
        if (switchesNeedUpdate && nextSwitches) {
          setSwitches([...nextSwitches]);
        }

        // 3. Deteksi Tabrakan / Konflik Rel
        // Instruksi User: "kemudian jika terjadi tabrakan, nyawa berkurang 1, dan kereta yang tabrakan dihilangkan"
        const conflict = checkTrainConflicts(updatedTrains);
        if (conflict.hasConflict) {
          livesPenalty++;
          currentSafeStreak = 0;
          soundEngine.playCrashSound();
          soundEngine.playEmergencyAlarm();

          const collidingSet = new Set(conflict.collidingTrainIds);
          const collidedTrainNames = updatedTrains
            .filter((t) => collidingSet.has(t.id))
            .map((t) => `${t.name} (${t.trainNumber})`)
            .join(' & ');

          // Hilangkan seluruh kereta yang terlibat tabrakan dari jalur rel
          updatedTrains = updatedTrains.filter((t) => !collidingSet.has(t.id));
          currentTrains = updatedTrains;

          addAlert(
            'bahaya',
            `💥 TABRAKAN KERETA TERJADI! Nyawa berkurang 1. Rangkaian ${collidedTrainNames || 'kereta'} dievakuasi dan dihilangkan dari jalur stasiun!`
          );
        }

        // 4. Update Game State (Nyawa, Skor, Infinity Level, Safe Streak)
        const nextLives = Math.max(0, currentGameState.lives - livesPenalty);
        // Bonus pengali skor (multiplier) seiring kenaikan tingkat infinity
        const levelMultiplier = 1 + (currentGameState.level - 1) * 0.1;
        const earnedScore = Math.round(scoreAdd * levelMultiplier);
        const nextScore = currentGameState.score + earnedScore;

        // Endless Infinity Level progression: setiap 450 poin naik 1 level tanpa batas
        const nextLevel = Math.floor(nextScore / 450) + 1;
        let finalLives = nextLives;

        // Kenaikan Tingkat Infinity (Level Up)
        if (nextLevel > currentGameState.level && !currentGameState.isGameOver) {
          soundEngine.playLevelUp();
          const rankTitle = getInfinityRank(nextLevel, nextScore);
          addAlert(
            'sukses',
            `🌟 TINGKAT INFINITY NAIK! Selamat, Anda naik ke Level ${nextLevel} (${rankTitle})!`
          );

          // Bonus pemulihan 1 nyawa setiap kelipatan 5 level infinity (Level 5, 10, 15, dst)
          if (nextLevel % 5 === 0 && finalLives < 3 && finalLives > 0) {
            finalLives = Math.min(3, finalLives + 1);
            addAlert(
              'sukses',
              '❤️ RECOVERY BONUS: +1 Nyawa dipulihkan atas dedikasi dinas operasional tanpa henti!'
            );
          }
        }

        const isNowGameOver = finalLives <= 0;
        if (isNowGameOver && !currentGameState.isGameOver) {
          soundEngine.playEmergencyAlarm();
          addAlert('bahaya', 'DARURAT! 3 Nyawa habis. Dinas PPKA stasiun dinonaktifkan.');
        }

        setGameState((prev) => ({
          ...prev,
          lives: finalLives,
          score: nextScore,
          level: nextLevel,
          trainsDispatched: prev.trainsDispatched + dispatchedIncrement,
          safeStreak: currentSafeStreak,
          gameTimeSeconds: newGameTime,
          isGameOver: isNowGameOver,
        }));

        setTrains(updatedTrains);
      }

      // 6. Render Canvas 60 FPS
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          stationRenderer.render(
            {
              ctx,
              width: canvasRef.current.width,
              height: canvasRef.current.height,
              camera: cameraRef.current,
              gameTime: currentGameState.gameTimeSeconds,
              hoveredSwitchId,
              hoveredSignalId,
            },
            currentSwitches,
            currentSignals,
            trainsRef.current
          );
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [addAlert, hoveredSwitchId, hoveredSignalId]);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden flex flex-col bg-slate-950 font-sans"
    >
      {/* Top HUD PPKA Bar */}
      <DispatcherHUD
        gameState={gameState}
        activeKLB={trains.find((t) => t.isKLB && t.status !== 'selesai') || null}
        onSpawnKLB={handleSpawnKLB}
        onTogglePause={() => setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }))}
        onToggleSpeed={() =>
          setGameState((prev) => ({ ...prev, gameSpeed: prev.gameSpeed === 1 ? 2 : 1 }))
        }
        onToggleMute={() => {
          const nextMuted = !gameState.isSoundMuted;
          soundEngine.setMuted(nextMuted);
          setGameState((prev) => ({ ...prev, isSoundMuted: nextMuted }));
        }}
        onResetGame={resetGame}
        onOpenHelp={() => setIsHelpOpen(true)}
        onManualHorn={() => {
          const hasActiveKRL = trains.some((t) => t.type === 'krl' && t.status !== 'selesai');
          if (hasActiveKRL) {
            soundEngine.playKRLHorn();
          } else {
            soundEngine.playTrainHorn();
          }
        }}
        onCenterCamera={centerCamera}
        onFocusWest={focusWest}
        onFocusEast={focusEast}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      {/* Bar Tab Responsif (Slideable & Scrollable untuk HP/Tablet) */}
      <div className="bg-slate-900 border-b border-slate-800 px-2 sm:px-4 py-1.5 flex items-center justify-between gap-2 shrink-0 z-20 select-none">
        {/* Tombol Tab Navigasi */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none py-0.5">
          {/* Tab 1: Emplasemen Rel */}
          <button
            id="tab-canvas-btn"
            type="button"
            onClick={() => {
              setActiveTab('canvas');
              if (window.innerWidth >= 1024) setIsDesktopSplitMode(false);
            }}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer min-h-[36px] ${
              activeTab === 'canvas' && !isDesktopSplitMode
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <TrainTrack className="w-3.5 h-3.5 text-sky-400" />
            <span>Emplasemen Rel</span>
          </button>

          {/* Tab 2: Jadwal Kereta */}
          <button
            id="tab-schedule-btn"
            type="button"
            onClick={() => {
              setActiveTab('schedule');
              setIsDesktopSplitMode(false);
            }}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer min-h-[36px] ${
              activeTab === 'schedule' && !isDesktopSplitMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Jadwal KA</span>
            {trains.filter((t) => t.status !== 'selesai').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {trains.filter((t) => t.status !== 'selesai').length}
              </span>
            )}
          </button>

          {/* Tab 3: Meja Pelayanan Interlocking */}
          <button
            id="tab-interlocking-btn"
            type="button"
            onClick={() => {
              setActiveTab('interlocking');
              setIsDesktopSplitMode(false);
            }}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer min-h-[36px] ${
              activeTab === 'interlocking' && !isDesktopSplitMode
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            <span>Meja Pelayanan</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
              {switches.length}W
            </span>
          </button>
        </div>

        {/* Di Layar Lebar: Toggle Mode Layar Penuh vs Mode Multitasking */}
        <div className="hidden lg:flex items-center space-x-2">
          <button
            id="btn-toggle-multitasking"
            type="button"
            onClick={() => setIsDesktopSplitMode((prev) => !prev)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors border cursor-pointer ${
              isDesktopSplitMode
                ? 'bg-sky-950/60 border-sky-500/50 text-sky-300 font-semibold'
                : 'bg-slate-850 border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Tampilkan semua panel secara simultan (Peta + List + Meja Wesel)"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
            <span>{isDesktopSplitMode ? 'Mode Multitasking: ON' : 'Mode Multitasking: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Main Area: Render berdasarkan mode (Split Desktop vs Tab Tunggal) */}
      {isDesktopSplitMode ? (
        /* ================= MODE MULTITASKING DESKTOP ================= */
        <>
          <div className="flex-1 relative flex flex-row overflow-hidden">
            {/* Canvas Emplasemen Stasiun */}
            <div
              ref={canvasContainerRef}
              className="flex-1 relative h-full w-full bg-slate-950 overflow-hidden"
            >
              <canvas
                ref={canvasRef}
                id="station-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`w-full h-full block ${
                  hoveredSwitchId || hoveredSignalId ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
                }`}
              />

              {/* Notifikasi Announcement Bar */}
              <AlertBanner alerts={alerts} />

              {/* Indikator Tombol Interaksi Cepat */}
              <div className="absolute top-3 right-4 z-10 pointer-events-none hidden sm:flex items-center space-x-2 text-[10px] font-mono bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 shadow-sm">
                <span>🖱️ Klik Wesel / Sinyal untuk Mengatur Rute</span>
                <span>•</span>
                <span>Geser / Scroll untuk Navigasi Kamera</span>
              </div>
            </div>

            {/* List Kereta Masuk di Sebelah Kanan */}
            <SchedulePanel
              trains={trains}
              signals={signals}
              onSetSignalAspect={handleSetSignalAspect}
              onFocusTrain={handleFocusTrain}
              onAssignPlatform={handleAssignPlatform}
              onAutoRouteToFreePlatform={handleAutoRouteToFreePlatform}
              onClearKLBRoute={handleClearKLBRoute}
            />
          </div>

          {/* Meja Pelayanan Bawah Desktop */}
          <InterlockingPanel
            switches={switches}
            signals={signals}
            onToggleSwitch={handleToggleSwitch}
            onSetSignalAspect={handleSetSignalAspect}
            onSetRouteToPlatform={handleSetRouteToPlatform}
          />
        </>
      ) : (
        /* ================= MODE TAB FOCUS (HP, TABLET & DESKTOP TAB) ================= */
        <div
          className="flex-1 relative overflow-hidden flex flex-col"
          onTouchStart={activeTab !== 'canvas' ? handleSwipeTouchStart : undefined}
          onTouchEnd={activeTab !== 'canvas' ? handleSwipeTouchEnd : undefined}
        >
          {/* TAB 1: EMPLASEMEN REL (KANVAS PENUH) */}
          <div
            ref={canvasContainerRef}
            className={`flex-1 relative h-full w-full bg-slate-950 overflow-hidden ${
              activeTab === 'canvas' ? 'flex flex-col' : 'hidden'
            }`}
          >
            <canvas
              ref={canvasRef}
              id="station-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`w-full h-full block flex-1 ${
                hoveredSwitchId || hoveredSignalId ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
              }`}
            />

            {/* Notifikasi Announcement Bar */}
            <AlertBanner alerts={alerts} />

            {/* Floating Touch Camera Controls di HP & Tablet */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-1 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/80 shadow-2xl">
              <button
                type="button"
                onClick={focusWest}
                className="px-2 py-1 rounded-full hover:bg-slate-800 text-slate-300 hover:text-sky-300 text-[11px] font-mono transition-colors active:scale-95"
                title="Arahkan ke Sisi Barat"
              >
                ◀ Barat
              </button>
              <button
                type="button"
                onClick={centerCamera}
                className="px-2.5 py-1 rounded-full bg-sky-600/30 text-sky-300 border border-sky-500/40 text-[11px] font-bold font-mono transition-colors active:scale-95"
                title="Pusatkan ke Stasiun Sentral"
              >
                Stasiun
              </button>
              <button
                type="button"
                onClick={focusEast}
                className="px-2 py-1 rounded-full hover:bg-slate-800 text-slate-300 hover:text-sky-300 text-[11px] font-mono transition-colors active:scale-95"
                title="Arahkan ke Sisi Timur"
              >
                Timur ▶
              </button>
              <div className="h-4 w-[1px] bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold active:scale-95"
                title="Perbesar Tampilan"
              >
                +
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold active:scale-95"
                title="Perkecil Tampilan"
              >
                -
              </button>
            </div>
          </div>

          {/* TAB 2: JADWAL KERETA (TAMPILAN LEBAR / FULL TAB DENGAN SCROLL) */}
          {activeTab === 'schedule' && (
            <div className="flex-1 h-full w-full overflow-hidden bg-slate-950 flex flex-col">
              <SchedulePanel
                trains={trains}
                signals={signals}
                isFullWidth={true}
                onSetSignalAspect={handleSetSignalAspect}
                onFocusTrain={handleFocusTrain}
                onAssignPlatform={handleAssignPlatform}
                onAutoRouteToFreePlatform={handleAutoRouteToFreePlatform}
                onClearKLBRoute={handleClearKLBRoute}
              />
            </div>
          )}

          {/* TAB 3: MEJA PELAYANAN INTERLOCKING (TAMPILAN PENUH LEGA DENGAN SCROLL) */}
          {activeTab === 'interlocking' && (
            <div className="flex-1 h-full w-full overflow-hidden bg-slate-950 flex flex-col">
              <InterlockingPanel
                switches={switches}
                signals={signals}
                isFullTab={true}
                onToggleSwitch={handleToggleSwitch}
                onSetSignalAspect={handleSetSignalAspect}
                onSetRouteToPlatform={handleSetRouteToPlatform}
              />
            </div>
          )}
        </div>
      )}

      {/* Navigasi Bawah Khusus Handphone (Thumb-Friendly Bottom Bar) */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden bg-slate-900/98 backdrop-blur-lg border-t border-slate-800 px-3 py-1.5 flex items-center justify-around shrink-0 z-30 select-none shadow-2xl"
      >
        <button
          type="button"
          onClick={() => setActiveTab('canvas')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all min-w-[70px] ${
            activeTab === 'canvas'
              ? 'text-sky-400 bg-sky-500/15 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrainTrack className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Emplasemen</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all min-w-[70px] relative ${
            activeTab === 'schedule'
              ? 'text-amber-400 bg-amber-500/15 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Jadwal KA</span>
          {trains.filter((t) => t.status !== 'selesai').length > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
              {trains.filter((t) => t.status !== 'selesai').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('interlocking')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all min-w-[70px] ${
            activeTab === 'interlocking'
              ? 'text-emerald-400 bg-emerald-500/15 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Meja Wesel</span>
        </button>
      </nav>

      {/* Modal Panduan PPKA */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Modal Game Over */}
      <GameOverModal
        isOpen={gameState.isGameOver}
        gameState={gameState}
        onRestart={resetGame}
      />
    </div>
  );
}
