import { SignalNode, SwitchNode, Train } from '../types';
import { PLATFORMS, PlatformDef } from './trackNetwork';
import { CARRIAGE_GAP, CARRIAGE_LENGTH, CARRIAGE_WIDTH } from './trainManager';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  camera: { x: number; y: number; zoom: number };
  gameTime: number;
  hoveredSwitchId: string | null;
  hoveredSignalId: string | null;
}

/**
 * Renderer simulator stasiun kereta api realistis
 */
export class StationRenderer {
  public render(
    rc: RenderContext,
    switches: SwitchNode[],
    signals: SignalNode[],
    trains: Train[]
  ) {
    const { ctx, width, height, camera, gameTime } = rc;

    // Bersihkan canvas dengan warna tanah / ballast dasar
    ctx.save();
    ctx.fillStyle = '#0f172a'; // slate-900 dasar malam/senja stasiun
    ctx.fillRect(0, 0, width, height);

    // Transformasi Kamera (Pan & Zoom)
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // 1. Gambar Lingkungan & Pondasi Stasiun
    this.drawEnvironment(ctx, gameTime);

    // 2. Gambar Peron, Fasilitas & Animasi Penumpang Hidup
    this.drawPlatforms(ctx, gameTime, trains);

    // 3. Gambar Bantalan & Rel Baja (Tracks & Sleepers)
    this.drawTracks(ctx, switches);

    // 3b. Indikator Rute Aktif & Peringatan Jalur (User-Friendly Guidance)
    this.drawActiveRoutePreviews(ctx, trains, switches, gameTime);

    // 4. Gambar Wesel (Switch mechanisms, blades, and indicator lamps)
    this.drawSwitches(ctx, switches, rc.hoveredSwitchId, gameTime);

    // 5. Gambar Sinyal 3 Aspek (Merah, Kuning, Hijau)
    this.drawSignals(ctx, signals, rc.hoveredSignalId, gameTime);

    // 6. Gambar Tiang & Kabel Listrik Aliran Atas (LAA / Catenary)
    this.drawCatenaryGantries(ctx);

    // 7. Gambar Seluruh Kereta Api (8 Gerbong Terpisah dan Tersambung)
    this.drawTrains(ctx, trains, gameTime);

    // 8. Gambar Kabel Kontak LAA di atas kereta (Overhead wires)
    this.drawCatenaryWires(ctx);

    // 9. Gambar Atap Peron & Gedung Stasiun Tingkat Atas
    this.drawPlatformRoofs(ctx, gameTime);

    ctx.restore();
  }

  private drawEnvironment(ctx: CanvasRenderingContext2D, gameTime: number) {
    // Area rumput & lansekap sekitar rel
    ctx.fillStyle = '#112217'; // dark forest landscape
    ctx.fillRect(-600, 100, 3700, 750);

    // Tekstur rumput halus
    ctx.fillStyle = '#162e20';
    for (let x = -550; x < 3000; x += 90) {
      ctx.fillRect(x, 110, 45, 120);
      ctx.fillRect(x + 30, 670, 50, 160);
    }

    // ==========================================
    // AREA BALLAST GRAVEL (KRICAK REL KA ELEGAN)
    // Bentuk embankment berkontur alami mengikuti percabangan rel
    // ==========================================

    // 1. Bahu Balas Bawah (Dark outer shoulder bevel / lereng balas)
    ctx.fillStyle = '#1c1f26';
    ctx.beginPath();
    // Jalur ganda barat (Y: 360-440, balas: 310-490)
    ctx.moveTo(-600, 310);
    ctx.lineTo(340, 310);
    // Melebar ke utara menyelimuti Peron 1 (Y: 280, balas: 230)
    ctx.lineTo(600, 230);
    ctx.lineTo(1800, 230);
    // Menyempit kembali ke jalur timur (Y: 360-440)
    ctx.lineTo(2060, 310);
    ctx.lineTo(3000, 310);
    ctx.lineTo(3000, 495);
    ctx.lineTo(2060, 495);
    // Melebar ke selatan menyelimuti Peron 5 (Y: 600, balas: 645)
    ctx.lineTo(1880, 560);
    ctx.lineTo(1720, 645);
    ctx.lineTo(680, 645);
    ctx.lineTo(560, 560);
    ctx.lineTo(340, 495);
    ctx.lineTo(-600, 495);
    ctx.closePath();
    ctx.fill();

    // 2. Lapisan Inti Balas Kricak (Main High-Grade Crushed Granite Ballast)
    ctx.fillStyle = '#272b34';
    ctx.beginPath();
    ctx.moveTo(-600, 318);
    ctx.lineTo(350, 318);
    ctx.lineTo(610, 238);
    ctx.lineTo(1790, 238);
    ctx.lineTo(2050, 318);
    ctx.lineTo(3000, 318);
    ctx.lineTo(3000, 485);
    ctx.lineTo(2050, 485);
    ctx.lineTo(1870, 552);
    ctx.lineTo(1710, 638);
    ctx.lineTo(690, 638);
    ctx.lineTo(570, 552);
    ctx.lineTo(350, 485);
    ctx.lineTo(-600, 485);
    ctx.closePath();
    ctx.fill();

    // 3. Tekstur Butiran Kricak Batu Pecah Realistis
    ctx.fillStyle = '#3a404d';
    for (let x = -580; x < 2980; x += 32) {
      for (let y = 245; y < 640; y += 18) {
        // Abaikan area luar kontur balas
        const inStationYard = x >= 640 && x <= 1760;
        const inWestFlare = x >= 340 && x < 640;
        const inEastFlare = x > 1760 && x <= 2060;
        const inDoubleTrack = y >= 318 && y <= 485;

        if (!inStationYard && !inWestFlare && !inEastFlare && !inDoubleTrack) continue;

        if ((x * 3 + y * 7) % 5 === 0) {
          ctx.fillRect(x + ((y * 2) % 11), y + ((x * 5) % 9), 3, 2);
        }
      }
    }

    // Parit Beton & Jalur Saluran Kabel Sinyal/Wesel (Concrete Cable Duct & Trench)
    ctx.fillStyle = '#1e2430';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    // Saluran kabel utara
    ctx.strokeRect(480, 234, 1450, 4);
    // Saluran kabel selatan
    ctx.strokeRect(480, 644, 1450, 4);

    // ==========================================
    // PERLINTASAN SEBIDANG (PJL 220) & JALAN RAYA
    // ==========================================
    ctx.fillStyle = '#1b2028'; // Aspal hitam
    ctx.fillRect(200, 100, 64, 750);
    // Trotoar jalan
    ctx.fillStyle = '#334155';
    ctx.fillRect(196, 100, 4, 750);
    ctx.fillRect(264, 100, 4, 750);

    // Marka jalan kuning & putih
    ctx.strokeStyle = '#facc15';
    ctx.setLineDash([14, 12]);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(232, 100);
    ctx.lineTo(232, 315);
    ctx.moveTo(232, 490);
    ctx.lineTo(232, 850);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bantalan Karet Perlintasan Kereta (Rubber Crossing Flange Panels)
    ctx.fillStyle = '#111827';
    ctx.fillRect(200, 350, 64, 20);
    ctx.fillRect(200, 430, 64, 20);

    // Palang Pintu Perlintasan (Zebra Striping Merah-Putih)
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(185, 312);
    ctx.lineTo(265, 312);
    ctx.moveTo(185, 492);
    ctx.lineTo(265, 492);
    ctx.stroke();

    // Pos Jaga Perlintasan (Gardu PJL 220)
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(274, 305, 36, 26, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(278, 312, 12, 10);
    ctx.font = 'bold 7px "Share Tech Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('PJL 220', 276, 301);

    // Gedung Utama Stasiun (Stasiun Sentral PPKA) di sisi utara (Y: 110 - 240)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(900, 120, 600, 115, 8);
    ctx.fill();
    ctx.stroke();

    // Menara Pengatur PPKA (Interlocking Control Tower)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(1140, 130, 120, 95, 6);
    ctx.fill();
    ctx.stroke();

    // Jendela Kaca Menara PPKA (Pantulan Biru / Interior Kuning)
    ctx.fillStyle = '#38bdf8';
    ctx.globalAlpha = 0.65;
    ctx.fillRect(1150, 140, 100, 35);
    ctx.globalAlpha = 1.0;

    // Tulisan Papan Nama Stasiun
    ctx.font = 'bold 15px "Chakra Petch", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText('STASIUN SENTRAL UTAMA', 1200, 205);
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('GARDU PENGATUR PERJALANAN KERETA API (PPKA)', 1200, 222);

    // Lampu jam stasiun
    const pulse = Math.sin(gameTime * 3) > 0 ? '#22c55e' : '#15803d';
    ctx.fillStyle = pulse;
    ctx.beginPath();
    ctx.arc(1200, 133, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawPlatforms(ctx: CanvasRenderingContext2D, gameTime: number, trains?: Train[]) {
    PLATFORMS.forEach((p) => {
      // Plat beton peron
      ctx.save();
      const pWidth = p.xEnd - p.xStart;
      const pHeight = 26;
      const pY = p.y - 32;

      // Bayangan peron
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(p.xStart - 5, pY + 2, pWidth + 10, pHeight + 6);

      // Permukaan beton peron
      ctx.fillStyle = '#475569';
      ctx.fillRect(p.xStart, pY, pWidth, pHeight);

      // Garis Peringatan Kuning Bertekstur (Yellow Tactile Warning Line)
      ctx.fillStyle = '#eab308';
      ctx.fillRect(p.xStart, pY + pHeight - 4, pWidth, 4);

      // Garis Ubin Taktil Disabilitas
      ctx.fillStyle = '#ca8a04';
      for (let x = p.xStart + 10; x < p.xEnd - 10; x += 16) {
        ctx.fillRect(x, pY + pHeight - 8, 8, 3);
      }

      // Tulisan & Papan Penunjuk Peron Berpendar Jelas (Prominent Platform Signs)
      const labelXPositions = [p.xStart + 35, p.xStart + pWidth / 2, p.xEnd - 70];
      labelXPositions.forEach((lx) => {
        ctx.fillStyle = '#0369a1';
        ctx.fillRect(lx - 26, pY + 2, 52, 15);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(lx - 26, pY + 2, 52, 15);

        ctx.font = 'bold 9px "Chakra Petch", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`PERON ${p.number}`, lx, pY + 13);
      });

      // Bangku Tunggu Stasiun (Station Waiting Benches)
      for (let bx = p.xStart + 120; bx < p.xEnd - 120; bx += 240) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(bx, pY + 4, 22, 6);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx + 1, pY + 10, 3, 2);
        ctx.fillRect(bx + 18, pY + 10, 3, 2);

        // Penumpang duduk di bangku
        ctx.fillStyle = '#3b82f6'; // Baju biru
        ctx.fillRect(bx + 4, pY + 4, 5, 4);
        ctx.fillStyle = '#fdba74'; // Kepala
        ctx.beginPath();
        ctx.arc(bx + 6.5, pY + 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Penumpang kedua duduk santai
        ctx.fillStyle = '#ef4444'; // Baju merah
        ctx.fillRect(bx + 13, pY + 4, 5, 4);
        ctx.fillStyle = '#fed7aa'; // Kepala
        ctx.beginPath();
        ctx.arc(bx + 15.5, pY + 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lampu penerangan peron
      for (let lx = p.xStart + 60; lx < p.xEnd; lx += 180) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(lx, pY + 6, 3, 0, Math.PI * 2);
        ctx.fill();

        // Pendaran cahaya lampu peron
        ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
        ctx.beginPath();
        ctx.arc(lx, pY + 6, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cek apakah ada kereta penumpang yang sedang berhenti melayani peron ini
      const stoppedTrain = trains?.find(
        (t) =>
          t.assignedPlatform === p.number &&
          t.status === 'berhenti_di_peron' &&
          !t.isNonStop &&
          t.type !== 'kargo' &&
          t.type !== 'bbm' &&
          t.type !== 'petikemas' &&
          t.type !== 'klb'
      );
      const isBoarding = Boolean(stoppedTrain);

      // Gambar Animasi Penumpang Hidup (Berjalan, Menunggu, Naik/Turun Kereta)
      this.drawAnimatedPassengers(ctx, p, pY, pHeight, gameTime, isBoarding);

      // Marka Batas Berhenti Lokomotif (Semboyan 8A / Papan Tanda "S" Ujung Depan Peron)
      // 1. Ujung Timur (Arah Barat -> Timur)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(p.xEnd - 8, pY + pHeight - 7, 6, 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.xEnd - 7, pY + pHeight - 6, 4, 5);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('S', p.xEnd - 5, pY + pHeight - 2);

      // Tiang Marka Ujung Timur
      ctx.fillStyle = '#64748b';
      ctx.fillRect(p.xEnd - 6, pY - 8, 2, 8);
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(p.xEnd - 5, pY - 11, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 5px "Share Tech Mono", monospace';
      ctx.fillText('S', p.xEnd - 5, pY - 9);

      // 2. Ujung Barat (Arah Timur -> Barat)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(p.xStart + 2, pY + pHeight - 7, 6, 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.xStart + 3, pY + pHeight - 6, 4, 5);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 5px sans-serif';
      ctx.fillText('S', p.xStart + 5, pY + pHeight - 2);

      // Tiang Marka Ujung Barat
      ctx.fillStyle = '#64748b';
      ctx.fillRect(p.xStart + 4, pY - 8, 2, 8);
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(p.xStart + 5, pY - 11, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 5px "Share Tech Mono", monospace';
      ctx.fillText('S', p.xStart + 5, pY - 9);

      ctx.restore();
    });
  }

  /**
   * Menggambar Animasi Penumpang di Peron
   * Menampilkan penumpang berjalan, mondar-mandir menunggu, memakai tas ransel,
   * menarik koper beroda, memeriksa smartphone, serta animasi naik/turun saat kereta berhenti.
   */
  private drawAnimatedPassengers(
    ctx: CanvasRenderingContext2D,
    platform: (typeof PLATFORMS)[0],
    pY: number,
    pHeight: number,
    gameTime: number,
    isBoarding: boolean
  ) {
    const passengerCount = platform.number === 4 ? 6 : 18; // Peron 4 adalah jalur cepat/kargo, penumpang lebih sedikit
    const clothesColors = [
      '#ef4444', // Merah
      '#3b82f6', // Biru KAI
      '#10b981', // Hijau
      '#f59e0b', // Oranye / Amber
      '#8b5cf6', // Ungu
      '#ec4899', // Pink
      '#f8fafc', // Putih kemeja
      '#0284c7', // Cyan
      '#059669', // Emerald
      '#d97706', // Coklat muda
    ];

    const skinTones = ['#fed7aa', '#fcd34d', '#fdba74', '#fbcfe8', '#e2e8f0'];

    for (let i = 0; i < passengerCount; i++) {
      const baseSpan = (platform.xEnd - platform.xStart - 120);
      const baseX = platform.xStart + 60 + (i * (baseSpan / passengerCount));
      const speed = 0.5 + (i % 3) * 0.35;
      const walkCycle = (gameTime * speed + i * 2.3);

      let curX = baseX;
      let curY = pY + 10 + ((i * 7) % 8);
      let isWalking = (i % 2 === 0);
      let walkDir = ((i % 4) < 2) ? 1 : -1;

      if (isBoarding) {
        // Ketika kereta berhenti: penumpang bergerak menuju pintu kereta (arah rel bawah peron)
        const boardingCycle = Math.sin(gameTime * 3 + i);
        curX += Math.cos(gameTime * 2 + i) * 6;
        curY = pY + 12 + Math.abs(boardingCycle) * 7; // Mendekati tepi peron
        isWalking = true;
      } else if (isWalking) {
        // Berjalan perlahan bolak-balik di peron
        const walkOffset = Math.sin(walkCycle) * 22;
        curX += walkOffset;
        walkDir = Math.cos(walkCycle) >= 0 ? 1 : -1;
      }

      // Animasi langkah vertikal (bobbing kaki/badan saat melangkah)
      const bobbing = isWalking ? Math.abs(Math.sin(walkCycle * 4)) * 1.5 : 0;
      const drawY = curY - bobbing;

      const shirtColor = clothesColors[(i * 3) % clothesColors.length];
      const skinColor = skinTones[i % skinTones.length];
      const pantsColor = (i % 2 === 0) ? '#1e293b' : '#334155'; // Celana gelap / jeans

      ctx.save();
      ctx.translate(curX, drawY);

      // Bayangan penumpang di atas ubin peron
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(0, 7, 3, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Kaki penumpang (animasi melangkah bergantian)
      ctx.fillStyle = pantsColor;
      if (isWalking) {
        const legSwing = Math.sin(walkCycle * 4) * 2;
        ctx.fillRect(-1.5 + legSwing, 4, 1.5, 3.5);
        ctx.fillRect(0.5 - legSwing, 4, 1.5, 3.5);
      } else {
        ctx.fillRect(-1.5, 4, 1.5, 3.5);
        ctx.fillRect(0.5, 4, 1.5, 3.5);
      }

      // Badan / Baju Penumpang
      ctx.fillStyle = shirtColor;
      ctx.fillRect(-2, 0, 4, 4.5);

      // Kepala & Rambut
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(0, -2.5, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Rambut penumpang
      ctx.fillStyle = (i % 3 === 0) ? '#0f172a' : (i % 3 === 1) ? '#451a03' : '#1e293b';
      ctx.beginPath();
      ctx.arc(0, -3.2, 1.6, Math.PI, Math.PI * 2);
      ctx.fill();

      // Aksesoris Penumpang:
      // 1. Tas Ransel / Backpack
      if (i % 3 === 1) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-walkDir * 2.8, 0.5, 1.8, 3);
      }

      // 2. Koper Beroda (Luggage Suitcase) yang ditarik di belakang
      if (i % 4 === 0) {
        const koperX = -walkDir * 5;
        ctx.fillStyle = clothesColors[(i * 5) % clothesColors.length];
        ctx.fillRect(koperX - 1.5, 2.5, 3, 4);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(koperX - 1, 1.5, 2, 1); // Gagang koper
        ctx.fillRect(koperX - 1.5, 6.5, 1, 0.8); // Roda kecil
        ctx.fillRect(koperX + 0.5, 6.5, 1, 0.8);
      }

      // 3. Memeriksa Smartphone (Layar berpendar putih/biru lembut)
      if (!isWalking && i % 3 === 2) {
        const glowPhase = Math.sin(gameTime * 4 + i);
        if (glowPhase > 0) {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(1, 1.5, 1.2, 1.8);
          // Pendaran layar hp
          ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.beginPath();
          ctx.arc(1.5, 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  private drawTracks(ctx: CanvasRenderingContext2D, switches: SwitchNode[]) {
    // 1. DUA JALUR UTAMA MENDEKATI STASIUN & MELINTAS LANGSUNG
    // Jalur Arah Barat (Y: 360): Dari ujung timur X: 3000 melintas hingga X: -600
    this.drawSingleTrackLine(ctx, -600, 360, 3000, 360);
    // Jalur Arah Timur (Y: 440): Dari ujung barat X: -600 melintas hingga X: 3000
    this.drawSingleTrackLine(ctx, -600, 440, 3000, 440);

    // 2. TIGA JALUR PERON EMPLASEMEN STASIUN (Percabangan Wesel):
    // Peron 1 (Y: 280): dari wesel barat (X: 600) ke wesel timur (X: 1800)
    this.drawSingleTrackLine(ctx, 600, 280, 1800, 280);
    // Jalur 4 Langsung (Y: 520): dari wesel barat (X: 600) ke wesel timur (X: 1800)
    this.drawSingleTrackLine(ctx, 600, 520, 1800, 520);
    // Peron 5 Komuter (Y: 600): dari wesel barat (X: 720) ke wesel timur (X: 1680)
    this.drawSingleTrackLine(ctx, 720, 600, 1680, 600);

    // 3. JALUR KURVA WESEL BARAT (West Throat Interlocking):
    // W-01: Crossover dari (360, 440) naik ke W-03 (480, 360)
    this.drawBezierTrack(
      ctx,
      { x: 360, y: 440 },
      { x: 360 + 120 * 0.45, y: 440 },
      { x: 480 - 120 * 0.45, y: 360 },
      { x: 480, y: 360 }
    );
    // Crossover Keluar Arah Barat: dari (360, 360) ke W-02 (480, 440)
    this.drawBezierTrack(
      ctx,
      { x: 360, y: 360 },
      { x: 360 + 120 * 0.45, y: 360 },
      { x: 480 - 120 * 0.45, y: 440 },
      { x: 480, y: 440 },
      true
    );
    // W-03: Dari (480, 360) belok naik ke Peron 1 (600, 280)
    this.drawBezierTrack(
      ctx,
      { x: 480, y: 360 },
      { x: 480 + 120 * 0.45, y: 360 },
      { x: 600 - 120 * 0.45, y: 280 },
      { x: 600, y: 280 }
    );
    // W-02: Crossover dari (480, 440) turun ke W-04 (600, 520)
    this.drawBezierTrack(
      ctx,
      { x: 480, y: 440 },
      { x: 480 + 120 * 0.45, y: 440 },
      { x: 600 - 120 * 0.45, y: 520 },
      { x: 600, y: 520 }
    );
    // W-04: Dari (600, 520) belok turun ke Peron 5 (720, 600)
    this.drawBezierTrack(
      ctx,
      { x: 600, y: 520 },
      { x: 600 + 120 * 0.45, y: 520 },
      { x: 720 - 120 * 0.45, y: 600 },
      { x: 720, y: 600 }
    );

    // 4. JALUR KURVA WESEL TIMUR (East Throat Interlocking):
    // W-05: Crossover Masuk dari (1920, 440) ke (2040, 360)
    this.drawBezierTrack(
      ctx,
      { x: 1920, y: 440 },
      { x: 1920 + 120 * 0.45, y: 440 },
      { x: 2040 - 120 * 0.45, y: 360 },
      { x: 2040, y: 360 }
    );
    // Crossover Keluar Arah Timur: dari (1920, 360) ke (2040, 440)
    this.drawBezierTrack(
      ctx,
      { x: 1920, y: 360 },
      { x: 1920 + 120 * 0.45, y: 360 },
      { x: 2040 - 120 * 0.45, y: 440 },
      { x: 2040, y: 440 },
      true
    );
    // W-07: Dari (1800, 280) belok naik ke (1920, 360)
    this.drawBezierTrack(
      ctx,
      { x: 1800, y: 280 },
      { x: 1800 + 120 * 0.45, y: 280 },
      { x: 1920 - 120 * 0.45, y: 360 },
      { x: 1920, y: 360 }
    );
    // W-06: Crossover dari (1800, 520) ke (1920, 440)
    this.drawBezierTrack(
      ctx,
      { x: 1800, y: 520 },
      { x: 1800 + 120 * 0.45, y: 520 },
      { x: 1920 - 120 * 0.45, y: 440 },
      { x: 1920, y: 440 }
    );
    // W-08: Dari (1680, 600) belok turun ke (1800, 520)
    this.drawBezierTrack(
      ctx,
      { x: 1680, y: 600 },
      { x: 1680 + 120 * 0.45, y: 600 },
      { x: 1800 - 120 * 0.45, y: 520 },
      { x: 1800, y: 520 }
    );
  }

  private drawSingleTrackLine(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) {
    ctx.save();
    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.translate(x1, y1);
    ctx.rotate(angle);

    // 1. Bantalan Rel (Sleepers - Beton bertulang pracetak / Kayu bantalan KA)
    const sleeperSpacing = 11;
    for (let x = 0; x < length; x += sleeperSpacing) {
      // Bayangan dasar bantalan
      ctx.fillStyle = '#171a21';
      ctx.fillRect(x, -11, 6, 22);
      // Badan bantalan beton
      ctx.fillStyle = '#474c56';
      ctx.fillRect(x + 1, -11, 4, 21);
      // Sisi atas terang bantalan
      ctx.fillStyle = '#5a6270';
      ctx.fillRect(x + 1, -10, 4, 2);

      // Pelat Landas & Penambat Rel Pandrol E-Clip
      ctx.fillStyle = '#222731';
      ctx.fillRect(x + 1, -8, 4, 4);
      ctx.fillRect(x + 1, 4, 4, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x + 2, -7, 2, 2);
      ctx.fillRect(x + 2, 5, 2, 2);
    }

    // 2. Rel Baja (Dual Steel Rails UIC-54)
    // Kaki Rel / Bayangan Rel Bawah (-6px) dan Atas (+6px)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, -8, length, 4);
    ctx.fillRect(0, 4, length, 4);

    // Badan Rel (Web)
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, -7, length, 2.5);
    ctx.fillRect(0, 4.5, length, 2.5);

    // Kepala Rel Baja Mengkilap (Gleaming Steel Rail Crown)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, -6.5, length, 1.5);
    ctx.fillRect(0, 5, length, 1.5);

    // Highlight Specular Refleksi Baja Rel
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, -6, length, 0.6);
    ctx.fillRect(0, 5.4, length, 0.6);

    ctx.restore();
  }

  private drawBezierTrack(
    ctx: CanvasRenderingContext2D,
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    skipDiamondCenter?: boolean
  ) {
    const steps = 48; // Presisi tinggi untuk kelengkungan wesel super mulus
    const pts: { x: number; y: number; nx: number; ny: number; angle: number }[] = [];

    // Hitung titik kurva spline beserta sudut tangen dan vektor normal tegak lurus
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const inv = 1 - t;
      const x = inv * inv * inv * p0.x + 3 * inv * inv * t * p1.x + 3 * inv * t * t * p2.x + t * t * t * p3.x;
      const y = inv * inv * inv * p0.y + 3 * inv * inv * t * p1.y + 3 * inv * t * t * p2.y + t * t * t * p3.y;

      // Turunan pertama (vektor arah tangen)
      const dx = 3 * inv * inv * (p1.x - p0.x) + 6 * inv * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
      const dy = 3 * inv * inv * (p1.y - p0.y) + 6 * inv * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
      const angle = Math.atan2(dy, dx);
      const len = Math.hypot(dx, dy) || 1;
      // Vektor normal tegak lurus (perpendicular normal unit vector)
      const nx = -dy / len;
      const ny = dx / len;

      pts.push({ x, y, nx, ny, angle });
    }

    // 1. Gambar Bantalan Rel yang berotasi tegak lurus kurva
    for (let i = 0; i < pts.length - 1; i += 2) {
      const p = pts[i];
      // Lewati bantalan jika terlalu dekat dengan jalur utama (< 8px jarak vertikal dari p0 atau p3)
      // agar tidak bertumpuk janggal dengan bantalan jalur lurus di titik wesel
      if (Math.abs(p.y - p0.y) < 8 || Math.abs(p.y - p3.y) < 8) {
        continue;
      }
      // Lewati bantalan jika persis di titik persilangan intan (scissors diamond)
      if (skipDiamondCenter && (Math.abs(p.x - 420) < 16 || Math.abs(p.x - 1980) < 16)) {
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Bayangan dasar bantalan
      ctx.fillStyle = '#171a21';
      ctx.fillRect(-3, -11, 6, 22);
      // Badan bantalan beton
      ctx.fillStyle = '#474c56';
      ctx.fillRect(-2, -11, 4, 21);
      // Sisi atas bantalan
      ctx.fillStyle = '#5a6270';
      ctx.fillRect(-2, -10, 4, 2);

      // Penambat Pandrol clips pada kurva
      ctx.fillStyle = '#222731';
      ctx.fillRect(-2, -8, 4, 4);
      ctx.fillRect(-2, 4, 4, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-1, -7, 2, 2);
      ctx.fillRect(-1, 5, 2, 2);

      ctx.restore();
    }

    // 2. Gambar Dual Rails dengan ketebalan dan jarak gauge 12px matematis sempurna
    const railOffset = 6; // Gauge = 12px

    // Dasar Rel (Shadow / Base)
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const rx = p.x - railOffset * p.nx;
      const ry = p.y - railOffset * p.ny;
      if (idx === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    });
    ctx.stroke();
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const rx = p.x + railOffset * p.nx;
      const ry = p.y + railOffset * p.ny;
      if (idx === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    });
    ctx.stroke();

    // Badan Rel (Web)
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const rx = p.x - railOffset * p.nx;
      const ry = p.y - railOffset * p.ny;
      if (idx === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    });
    ctx.stroke();
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const rx = p.x + railOffset * p.nx;
      const ry = p.y + railOffset * p.ny;
      if (idx === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    });
    ctx.stroke();

    // Kepala Rel Baja Mengkilap (Rail Crown)
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const rx = p.x - railOffset * p.nx;
      const ry = p.y - railOffset * p.ny;
      if (idx === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    });
    ctx.stroke();
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const rx = p.x + railOffset * p.nx;
      const ry = p.y + railOffset * p.ny;
      if (idx === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    });
    ctx.stroke();

    // Specular Highlight Rel Baja
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = '#f8fafc';
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const rx = p.x - (railOffset - 0.2) * p.nx;
      const ry = p.y - (railOffset - 0.2) * p.ny;
      if (idx === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    });
    ctx.stroke();
    ctx.beginPath();
    pts.forEach((p, idx) => {
      const rx = p.x + (railOffset + 0.2) * p.nx;
      const ry = p.y + (railOffset + 0.2) * p.ny;
      if (idx === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    });
    ctx.stroke();
  }

  /**
   * Preview Jalur Aktif (User-Friendly Route Guide Overlay)
   * Menampilkan garis alur bersinar di atas rel menuju peron mana wesel saat ini mengarah.
   * Hijau/Cyan = Sesuai dengan jadwal peron target.
   * Merah/Kuning Berkedip = Salah arah! Memberi petunjuk jelas agar pemain tidak kehilangan nyawa.
   */
  private drawActiveRoutePreviews(
    ctx: CanvasRenderingContext2D,
    trains: Train[],
    switches: SwitchNode[],
    gameTime: number
  ) {
    const approachingTrains = trains.filter(
      (t) => (t.status === 'menunggu_masuk' || t.status === 'masuk_stasiun') && t.carriages[0].x < 2200
    );

    approachingTrains.forEach((train) => {
      const isWest = train.direction === 'barat_ke_timur';
      const path = train.routePath;
      if (!path || path.length < 2) return;

      // Cari perkiraan peron tujuan dari path
      // Jalur stasiun memiliki Y: 280 (P1), 360 (P2), 440 (P3), 520 (P4), 600 (P5)
      const midPoint = path.find((pt) => pt.x >= 900 && pt.x <= 1500);
      const targetY = midPoint ? midPoint.y : path[path.length - 1].y;
      const targetPlatform =
        targetY < 310 ? 1 : targetY < 390 ? 2 : targetY < 470 ? 3 : targetY < 550 ? 4 : 5;
      const otherTrainOnPlatform = trains.find(
        (ot) => ot.id !== train.id && ot.assignedPlatform === targetPlatform && ot.status !== 'selesai'
      );
      const isConflict = Boolean(otherTrainOnPlatform);

      ctx.save();
      // Gambar garis alur rute bercahaya
      ctx.lineWidth = isConflict ? 5 : 4;
      ctx.strokeStyle = isConflict
        ? 'rgba(239, 68, 68, 0.85)' // Merah peringatan konflik jalur terisi
        : 'rgba(14, 165, 233, 0.8)'; // Sian navigasi rute pilihan PPKA

      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = -gameTime * 35; // Animasi aliran maju

      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();

      // Papan Petunjuk Rute Mengapung (Visual Route Badge)
      if (midPoint) {
        ctx.setLineDash([]);
        const badgeX = isWest ? 920 : 1480;
        const badgeY = targetY - 22;

        ctx.fillStyle = isConflict ? 'rgba(127, 29, 29, 0.95)' : 'rgba(12, 74, 110, 0.9)';
        ctx.strokeStyle = isConflict ? '#f87171' : '#38bdf8';
        ctx.lineWidth = 1.5;

        const badgeText = isConflict
          ? `⚠️ PERHATIAN: Jalur ${targetPlatform} Konflik/Terisi!`
          : `🚆 ${train.name} ➔ JALUR ${targetPlatform} (Pilihan PPKA)`;

        ctx.font = 'bold 10px "Chakra Petch", sans-serif';
        const tw = ctx.measureText(badgeText).width;

        ctx.beginPath();
        ctx.roundRect(badgeX - tw / 2 - 8, badgeY - 10, tw + 16, 20, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isConflict ? '#fef2f2' : '#f0f9ff';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, badgeX, badgeY + 4);
      }

      ctx.restore();
    });
  }

  private drawSwitches(
    ctx: CanvasRenderingContext2D,
    switches: SwitchNode[],
    hoveredSwitchId: string | null,
    gameTime: number
  ) {
    switches.forEach((sw) => {
      const isHovered = hoveredSwitchId === sw.id;
      const isDiverging = sw.position === 'belok';

      ctx.save();
      ctx.translate(sw.x, sw.y);

      // Area aura interaktif saat kursor berada di atas wesel (Lebih responsif & ramah pengguna)
      if (isHovered) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Tombol / Plat Indikator Interaktif di Atas Rel (Hitbox jelas)
      ctx.fillStyle = isHovered ? '#1e293b' : '#0f172a';
      ctx.strokeStyle = isHovered ? '#38bdf8' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-22, 12, 44, 28, 6);
      ctx.fill();
      ctx.stroke();

      // Tentukan arah belok vertikal wesel: -1 (atas/utara) atau +1 (bawah/selatan)
      const divergeY = (sw.id === 'W-01' || sw.id === 'W-03' || sw.id === 'W-07') ? -1 : 1;

      // Panah Arah Jalur (Arrow indicator lurus vs belok sesuai facingDirection)
      ctx.strokeStyle = isDiverging ? '#f59e0b' : '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const isWestFacing = sw.facingDirection === 'ke_barat';
      if (!isDiverging) {
        // Panah Lurus Horizontal
        if (isWestFacing) {
          ctx.moveTo(12, 22);
          ctx.lineTo(-8, 22);
          ctx.lineTo(-4, 18);
          ctx.moveTo(-8, 22);
          ctx.lineTo(-4, 26);
        } else {
          ctx.moveTo(-12, 22);
          ctx.lineTo(8, 22);
          ctx.lineTo(4, 18);
          ctx.moveTo(8, 22);
          ctx.lineTo(4, 26);
        }
      } else {
        // Panah Melengkung Belok sesuai arah fisik percabangan (divergeY)
        const targetArrowY = 22 + divergeY * 6;
        if (isWestFacing) {
          ctx.moveTo(12, 22);
          ctx.quadraticCurveTo(2, 22, -8, targetArrowY);
          ctx.lineTo(-3, targetArrowY - divergeY * 4);
          ctx.moveTo(-8, targetArrowY);
          ctx.lineTo(-3, targetArrowY + divergeY * 4);
        } else {
          ctx.moveTo(-12, 22);
          ctx.quadraticCurveTo(-2, 22, 8, targetArrowY);
          ctx.lineTo(3, targetArrowY - divergeY * 4);
          ctx.moveTo(8, targetArrowY);
          ctx.lineTo(3, targetArrowY + divergeY * 4);
        }
      }
      ctx.stroke();

      // Lidah wesel mekanik di atas rel (Switch Point Blade)
      // Terhubung presisi ke rel lurus atau rel belok tanpa celah
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = isDiverging ? '#f59e0b' : '#38bdf8';
      ctx.beginPath();
      const bladeTipY = isDiverging ? divergeY * 7 : 0;
      if (isWestFacing) {
        ctx.moveTo(14, 0);
        ctx.lineTo(-14, bladeTipY);
      } else {
        ctx.moveTo(-14, 0);
        ctx.lineTo(14, bladeTipY);
      }
      ctx.stroke();

      // Jarum wesel (Frog / Crossing check rails)
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (isWestFacing) {
        ctx.moveTo(-14, divergeY * 7);
        ctx.lineTo(-26, divergeY * 13);
      } else {
        ctx.moveTo(14, divergeY * 7);
        ctx.lineTo(26, divergeY * 13);
      }
      ctx.stroke();

      // Lampu Indikator Wesel LED
      const indicatorColor = isDiverging ? '#f59e0b' : '#10b981';
      ctx.fillStyle = indicatorColor;
      ctx.beginPath();
      ctx.arc(14, 26, 4, 0, Math.PI * 2);
      ctx.fill();

      // Label Nama Wesel & Tombol Status [KLIK UNTUK UBAH]
      ctx.font = 'bold 10px "Share Tech Mono", monospace';
      ctx.fillStyle = isHovered ? '#38bdf8' : '#e2e8f0';
      ctx.textAlign = 'center';
      ctx.fillText(sw.name, 0, 52);

      ctx.font = 'bold 8px "Chakra Petch", sans-serif';
      ctx.fillStyle = isDiverging ? '#fbbf24' : '#34d399';
      ctx.fillText(isDiverging ? 'BELOK (KLIK)' : 'LURUS (KLIK)', 0, 62);

      ctx.restore();
    });
  }

  private drawSignals(
    ctx: CanvasRenderingContext2D,
    signals: SignalNode[],
    hoveredSignalId: string | null,
    gameTime: number
  ) {
    signals.forEach((sig) => {
      const isHovered = hoveredSignalId === sig.id;
      ctx.save();
      ctx.translate(sig.x, sig.y);

      // Aura interaktif hover
      if (isHovered) {
        ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Tiang Sinyal (Signal Mast)
      ctx.fillStyle = '#475569';
      ctx.fillRect(-2, 0, 4, 25);

      // Rumah Sinyal 3 Lensa (Signal Head Target Board)
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-8, -26, 16, 32, 4);
      ctx.fill();
      ctx.stroke();

      // 3 Lensa Lampu Sinyal:
      // Atas: Merah (-20px)
      // Tengah: Kuning (-11px)
      // Bawah: Hijau (-2px)
      const isRed = sig.aspect === 'merah';
      const isYellow = sig.aspect === 'kuning';
      const isGreen = sig.aspect === 'hijau';

      // 1. Lampu Merah
      ctx.fillStyle = isRed ? '#ef4444' : '#451a1a';
      ctx.beginPath();
      ctx.arc(0, -20, 3.5, 0, Math.PI * 2);
      ctx.fill();
      if (isRed) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.beginPath();
        ctx.arc(0, -20, 11, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Lampu Kuning
      ctx.fillStyle = isYellow ? '#eab308' : '#3f3209';
      ctx.beginPath();
      ctx.arc(0, -11, 3.5, 0, Math.PI * 2);
      ctx.fill();
      if (isYellow) {
        ctx.fillStyle = 'rgba(234, 179, 8, 0.45)';
        ctx.beginPath();
        ctx.arc(0, -11, 11, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Lampu Hijau
      ctx.fillStyle = isGreen ? '#22c55e' : '#0c341b';
      ctx.beginPath();
      ctx.arc(0, -2, 3.5, 0, Math.PI * 2);
      ctx.fill();
      if (isGreen) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
        ctx.beginPath();
        ctx.arc(0, -2, 11, 0, Math.PI * 2);
        ctx.fill();
      }

      // Label Sinyal
      ctx.font = 'bold 9px "Share Tech Mono", monospace';
      ctx.fillStyle = isHovered ? '#fde047' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(sig.id, 0, -32);

      ctx.restore();
    });
  }

  private drawCatenaryGantries(ctx: CanvasRenderingContext2D) {
    // Portal tiang listrik aliran atas (LAA) melintang setiap 300px
    const gantryX = [180, 500, 820, 1180, 1520, 1850, 2180];

    gantryX.forEach((gx) => {
      ctx.save();
      // Tiang baja kiri & kanan
      ctx.fillStyle = '#334155';
      ctx.fillRect(gx - 4, 250, 8, 380);

      // Struktur rangka baja melintang atas
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.strokeRect(gx - 6, 250, 12, 380);

      // Isolator porselen keramik putih di setiap jalur
      const yTracks = [280, 360, 440, 520, 600];
      yTracks.forEach((yt) => {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(gx - 3, yt - 28, 6, 8);
        ctx.fillStyle = '#b45309'; // Brass clamp
        ctx.fillRect(gx - 2, yt - 20, 4, 4);
      });

      ctx.restore();
    });
  }

  private drawCatenaryWires(ctx: CanvasRenderingContext2D) {
    // Garis kabel kontak tembaga halus di atas rel
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1;

    const yTracks = [280, 360, 440, 520, 600];
    yTracks.forEach((yt) => {
      ctx.beginPath();
      ctx.moveTo(-200, yt - 18);
      ctx.lineTo(2600, yt - 18);
      ctx.stroke();
    });

    ctx.restore();
  }

  private drawPlatformRoofs(ctx: CanvasRenderingContext2D, gameTime: number) {
    PLATFORMS.filter((p) => p.hasOverheadRoof).forEach((p) => {
      ctx.save();
      const rx = p.xStart + 40;
      const rw = p.xEnd - p.xStart - 80;
      const ry = p.y - 48;
      const rh = 16;

      // Struktur atap peron (Canopy roof)
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);

      // Papan Informasi Keberangkatan Digital (PIDS)
      const pidsX = rx + rw / 2 - 50;
      ctx.fillStyle = '#020617';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.fillRect(pidsX, ry + 16, 100, 16);
      ctx.strokeRect(pidsX, ry + 16, 100, 16);

      ctx.font = 'bold 8px "Share Tech Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(`JALUR ${p.number} -> AMAN`, pidsX + 50, ry + 28);

      ctx.restore();
    });
  }

  private drawTrains(ctx: CanvasRenderingContext2D, trains: Train[], gameTime: number) {
    trains.forEach((train) => {
      if (train.status === 'selesai') return;

      const theme = train.colorTheme;

      // Gambar masing-masing dari 8 gerbong
      // Kita gambar dari gerbong belakang (7) ke gerbong depan (0)
      for (let i = 7; i >= 0; i--) {
        const car = train.carriages[i];
        if (car.x < -250 || car.x > 2650) continue;

        ctx.save();
        ctx.translate(car.x, car.y);
        ctx.rotate(car.angle);

        // Bayangan gerbong pada rel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(-car.length / 2 + 2, -car.width / 2 + 3, car.length, car.width + 3);

        // Bogie Roda Baja Depan & Belakang Kereta (Rail Bogies & Wheelsets)
        const bogieDist = car.length * 0.32;
        const bogieW = car.width - 2;
        [-bogieDist, bogieDist].forEach((bx) => {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(bx - 6, -bogieW / 2, 12, bogieW);
          // Roda baja kiri dan kanan
          ctx.fillStyle = '#334155';
          [-5, 3].forEach((wx) => {
            ctx.fillRect(bx + wx, -bogieW / 2 - 1.5, 3, 2);
            ctx.fillRect(bx + wx, bogieW / 2 - 0.5, 3, 2);
          });
        });

        if (i === 0) {
          // 1. KEPALA KERETA / LOKOMOTIF / KRL CAB
          if (train.type === 'krl') {
            this.drawKRLCab(ctx, car.length, car.width, theme, train, gameTime);
          } else {
            this.drawLocomotive(ctx, car.length, car.width, theme, train, gameTime);
          }
        } else if (i === 7) {
          // 2. GERBONG BELAKANG (Tail car dengan lampu merah semboyan 21)
          if (train.type === 'krl') {
            this.drawKRLTailCab(ctx, car.length, car.width, theme, train);
          } else if (train.type === 'bbm') {
            this.drawFuelTankWagon(ctx, car.length, car.width, 7, true);
          } else if (train.type === 'petikemas') {
            this.drawContainerWagon(ctx, car.length, car.width, 7, true);
          } else if (train.type === 'kargo') {
            this.drawFreightWagon(ctx, car.length, car.width, 7);
          } else {
            this.drawTailCoach(ctx, car.length, car.width, theme, train);
          }
        } else {
          // 3. GERBONG TENGAH (KRL, BBM, Petikemas, Kargo, atau Penumpang Reguler)
          if (train.type === 'krl') {
            this.drawKRLCoach(ctx, car.length, car.width, theme, i, gameTime);
          } else if (train.type === 'bbm') {
            this.drawFuelTankWagon(ctx, car.length, car.width, i, false);
          } else if (train.type === 'petikemas') {
            this.drawContainerWagon(ctx, car.length, car.width, i, false);
          } else if (train.type === 'kargo') {
            this.drawFreightWagon(ctx, car.length, car.width, i);
          } else {
            this.drawPassengerCoach(ctx, car.length, car.width, theme, i);
          }
        }

        // Sambungan antar gerbong (Gangway Rubber Bellows)
        if (i < 7) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(car.length / 2, -5, CARRIAGE_GAP, 10);
        }

        ctx.restore();
      }

      // Label Indikator Kereta (Nomor & Target Peron) di atas kepala kereta
      const lead = train.carriages[0];
      if (lead.x > -400 && lead.x < 2850) {
        ctx.save();
        ctx.translate(lead.x, lead.y - 24);

        // Balon nama kereta & status KLB
        const isKLB = Boolean(train.isKLB);
        const isHeld = Boolean(train.isHeldForKLB);

        // Styling badge
        if (isKLB) {
          ctx.fillStyle = 'rgba(153, 27, 27, 0.95)'; // Merah kenegaraan gelap
          ctx.strokeStyle = '#f59e0b'; // Emas bersinar
          ctx.lineWidth = 2;
        } else if (isHeld) {
          ctx.fillStyle = 'rgba(69, 10, 10, 0.95)';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
        }

        const tagText = isKLB
          ? `⭐ ${train.trainNumber} ${train.name} (PRIORITAS UTAMA) ⭐`
          : `${train.trainNumber} ${train.name}`;

        ctx.font = 'bold 10px "Chakra Petch", sans-serif';
        const textWidth = ctx.measureText(tagText).width;

        ctx.beginPath();
        ctx.roundRect(-textWidth / 2 - 8, -12, textWidth + 16, 18, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isKLB ? '#fef08a' : '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(tagText, 0, 1);

        // Badge Status Tambahan: Peringatan Tertahan KLB atau Status Jalur PPKA
        ctx.font = 'bold 9px "Share Tech Mono", monospace';
        if (isHeld) {
          ctx.fillStyle = '#fca5a5';
          ctx.fillText(`⛔ BERHENTI (TERTAHAN KLB PRIORITAS)`, 0, 18);
        } else if (isKLB) {
          ctx.fillStyle = '#fde047';
          ctx.fillText(`KLB MENUJU JALUR ${train.assignedPlatform}`, 0, 18);
        } else {
          const statusDesc =
            train.status === 'berhenti_di_peron'
              ? `Di Peron ${train.assignedPlatform}`
              : train.status === 'siap_berangkat'
              ? `Siap Berangkat (Jalur ${train.assignedPlatform})`
              : train.status === 'berangkat'
              ? `Melaju dari Jalur ${train.assignedPlatform}`
              : `Menuju Jalur ${train.assignedPlatform} (Pilihan PPKA)`;
          ctx.fillStyle = '#38bdf8';
          ctx.fillText(statusDesc, 0, 18);
        }

        ctx.restore();
      }
    });
  }

  private drawLocomotive(
    ctx: CanvasRenderingContext2D,
    len: number,
    width: number,
    theme: { primary: string; secondary: string; stripe: string; roof: string },
    train: Train,
    gameTime: number
  ) {
    const halfL = len / 2;
    const halfW = width / 2;

    // ========================================================
    // TAMPILAN ATAP LOKOMOTIF (TOP-DOWN BIRD'S EYE VIEW)
    // Berdasarkan Lokomotif Diesel Elektrik KAI (CC 206 / CC 201)
    // ========================================================

    // 1. Bordes / Gangway Jalan Samping (Side Walkways dengan Anti-Slip)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-halfL, -halfW, len, width);

    // Handrail Pengaman Samping (Kuning Keselamatan terlihat dari atas)
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-halfL + 4, -halfW + 0.8);
    ctx.lineTo(halfL - 4, -halfW + 0.8);
    ctx.moveTo(-halfL + 4, halfW - 0.8);
    ctx.lineTo(halfL - 4, halfW - 0.8);
    ctx.stroke();

    // 2. Badan Utama / Kap Mesin & Kabin (Tampak Atas)
    // Kap mesin sedikit lebih ramping dari lebar total bordes
    const hoodW = width - 4;
    const halfHoodW = hoodW / 2;

    ctx.fillStyle = theme.primary;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    // Ujung moncong depan agak tirus aerodinamis
    ctx.moveTo(-halfL + 4, -halfHoodW);
    ctx.lineTo(halfL - 6, -halfHoodW);
    ctx.lineTo(halfL + 1, -halfHoodW + 3);
    ctx.lineTo(halfL + 2, 0);
    ctx.lineTo(halfL + 1, halfHoodW - 3);
    ctx.lineTo(halfL - 6, halfHoodW);
    ctx.lineTo(-halfL + 4, halfHoodW);
    ctx.lineTo(-halfL, halfHoodW - 3);
    ctx.lineTo(-halfL, -halfHoodW + 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Atap Kabin Masinis Depan (Cab Roof)
    ctx.fillStyle = theme.roof || '#334155';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(halfL - 16, -halfHoodW + 0.5, 16, hoodW - 1, 2);
    ctx.fill();
    ctx.stroke();

    // Klakson Semboyan 35 (Dual Air Horns di atap kabin)
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(halfL - 8, -3, 5, 2);
    ctx.fillRect(halfL - 8, 1, 5, 2);
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(halfL - 3, -2, 1.5, 0, Math.PI * 2);
    ctx.arc(halfL - 3, 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Antena Radio Lokomotif & Dome GPS di Atap Kabin
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(halfL - 12, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 4. Atap Kabin Belakang (Untuk CC 206 Dual-Cab)
    ctx.fillStyle = theme.roof || '#334155';
    ctx.beginPath();
    ctx.roundRect(-halfL + 1, -halfHoodW + 0.5, 12, hoodW - 1, 2);
    ctx.fill();
    ctx.stroke();

    // 5. Ruang Mesin & Kipas Pendingin Radiator (Dynamic Brake & Radiator Fans)
    const engineX = -halfL + 15;
    const engineW = len - 33;
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(engineX, -halfHoodW + 1, engineW, hoodW - 2);

    // Dua Kipas Radiator Raksasa Bulat di Atap Mesin
    const fanCenters = [-halfL + 24, halfL - 25];
    fanCenters.forEach((fcx) => {
      // Cekungan kipas radiator
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(fcx, 0, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Baling-baling kipas radiator berputar
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      const fanAngle = gameTime * 12;
      ctx.beginPath();
      ctx.moveTo(fcx + Math.cos(fanAngle) * 3.5, Math.sin(fanAngle) * 3.5);
      ctx.lineTo(fcx - Math.cos(fanAngle) * 3.5, -Math.sin(fanAngle) * 3.5);
      ctx.moveTo(fcx + Math.cos(fanAngle + Math.PI / 2) * 3.5, Math.sin(fanAngle + Math.PI / 2) * 3.5);
      ctx.lineTo(fcx - Math.cos(fanAngle + Math.PI / 2) * 3.5, -Math.sin(fanAngle + Math.PI / 2) * 3.5);
      ctx.stroke();

      // Jaring Pelindung Kipas (Mesh Grille)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.beginPath();
      ctx.arc(fcx, 0, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Lubang Knalpot Silencer Diesel (Exhaust Manifold) di Tengah Atap
    const exhaustX = (fanCenters[0] + fanCenters[1]) / 2;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(exhaustX - 4, -2.5, 8, 5, 1.5);
    ctx.fill();
    ctx.stroke();

    // Corong lubang asap gelap
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(exhaustX, 0, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kisi-kisi Ventilasi Udara Atap (Roof Louvre Slats)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let lx = engineX + 16; lx < engineX + engineW - 16; lx += 4) {
      if (Math.abs(lx - exhaustX) < 6) continue;
      ctx.beginPath();
      ctx.moveTo(lx, -halfHoodW + 2);
      ctx.lineTo(lx, halfHoodW - 2);
      ctx.stroke();
    }

    // 6. Strobo Lampu Peringatan Darurat Atap Khusus KLB VVIP
    if (train.isKLB) {
      const isRedPhase = Math.floor(gameTime * 8) % 2 === 0;
      const strobeColor1 = isRedPhase ? '#ef4444' : '#f59e0b';
      const strobeColor2 = isRedPhase ? '#f59e0b' : '#ef4444';

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(halfL - 10, -5, 4, 10);

      // Lampu rotator berkedip atas
      ctx.fillStyle = strobeColor1;
      ctx.beginPath();
      ctx.arc(halfL - 8, -3, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = strobeColor2;
      ctx.beginPath();
      ctx.arc(halfL - 8, 3, 2, 0, Math.PI * 2);
      ctx.fill();

      // Pendaran cahaya strobo di atas atap
      ctx.fillStyle = isRedPhase ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)';
      ctx.beginPath();
      ctx.arc(halfL - 8, 0, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Partikel Asap Tipis / Heat Haze dari Knalpot Mesin Saat Berjalan
    if (train.speed > 5) {
      const smokeCount = 4;
      for (let s = 1; s <= smokeCount; s++) {
        const smokeOffset = (gameTime * 45 + s * 10) % 36;
        const smokeX = exhaustX - smokeOffset;
        const smokeY = Math.sin(gameTime * 6 + s) * 1.8;
        const smokeRadius = 2.5 + smokeOffset * 0.18;
        const alpha = Math.max(0, 0.22 - (smokeOffset / 36) * 0.22);

        ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
        ctx.beginPath();
        ctx.arc(smokeX, smokeY, smokeRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 8. Alat Perangkai Baja (AAR Coupler) di Ujung Depan Tampak Atas
    ctx.fillStyle = '#334155';
    ctx.fillRect(halfL + 2, -2, 3, 4);

    // 9. Sorot Lampu Depan (Headlights) di Ujung Moncong Atas
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(halfL + 1, -3, 1.8, 0, Math.PI * 2);
    ctx.arc(halfL + 1, 3, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Sorotan Berkas Cahaya Lampu Depan ke Arah Depan Rel
    const beamGrad = ctx.createRadialGradient(
      halfL + 2, 0, 2,
      halfL + 160, 0, 160
    );
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
    beamGrad.addColorStop(0.3, 'rgba(254, 240, 138, 0.22)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0.0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(halfL + 2, -5);
    ctx.lineTo(halfL + 160, -38);
    ctx.lineTo(halfL + 160, 38);
    ctx.lineTo(halfL + 2, 5);
    ctx.closePath();
    ctx.fill();
  }

  private drawPassengerCoach(
    ctx: CanvasRenderingContext2D,
    len: number,
    width: number,
    theme: { primary: string; secondary: string; stripe: string; roof: string },
    coachIndex: number
  ) {
    const halfL = len / 2;
    const halfW = width / 2;

    // ========================================================
    // TAMPILAN ATAP GERBONG PENUMPANG (TOP-DOWN BIRD'S EYE VIEW)
    // Kereta Stainless Steel KAI dengan AC Atap & Corrugated Ribs
    // ========================================================

    // 1. Permukaan Lengkung Atap Kereta (Roof Shell)
    const roofGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
    roofGrad.addColorStop(0, '#64748b');     // Tepi atap melengkung gelap
    roofGrad.addColorStop(0.18, '#94a3b8');  // Transisi lengkung
    roofGrad.addColorStop(0.5, '#cbd5e1');   // Puncak kubah atap terang
    roofGrad.addColorStop(0.82, '#94a3b8');  // Transisi lengkung
    roofGrad.addColorStop(1, '#64748b');     // Tepi atap melengkung gelap

    ctx.fillStyle = roofGrad;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, len, width, 3);
    ctx.fill();
    ctx.stroke();

    // 2. Garis-garis Gelombang Memanjang Atap Stainless Steel (Corrugated Roof Ribs)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 0.8;
    const ribYs = [-5.5, -3.5, -1.8, 0, 1.8, 3.5, 5.5];
    ribYs.forEach((ry) => {
      ctx.beginPath();
      ctx.moveTo(-halfL + 4, ry);
      ctx.lineTo(halfL - 4, ry);
      ctx.stroke();
    });

    // 3. Dua Unit AC HVAC Atap (Front & Rear Rooftop Air Conditioner Modules)
    const acUnits = [-halfL + 12, halfL - 12];
    acUnits.forEach((acX) => {
      // Box AC Unit
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(acX - 6, -halfW + 3.5, 12, width - 7, 2);
      ctx.fill();
      ctx.stroke();

      // Kisi-kisi Kipas Kondensor AC
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(acX - 2.5, 0, 2.2, 0, Math.PI * 2);
      ctx.arc(acX + 2.5, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Pelindung Kipas AC
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(acX - 2.5, 0, 2.2, 0, Math.PI * 2);
      ctx.arc(acX + 2.5, 0, 2.2, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 4. Ventilator Statis Atap (Torpedo Roof Vents) di Tengah Kereta
    ctx.fillStyle = '#334155';
    [-2, 2].forEach((vx) => {
      ctx.beginPath();
      ctx.roundRect(vx - 2, -1, 4, 2, 1);
      ctx.fill();
    });

    // 5. Tutup Plat Sambungan Bordes & Karet Gangway di Ujung
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-halfL, -halfW + 3, 2, width - 6);
    ctx.fillRect(halfL - 2, -halfW + 3, 2, width - 6);
  }

  private drawFreightWagon(
    ctx: CanvasRenderingContext2D,
    len: number,
    width: number,
    wagonIndex: number
  ) {
    const halfL = len / 2;
    const halfW = width / 2;

    // ========================================================
    // TAMPILAN ATAP GERBONG DATAR & KONTAINER (TOP-DOWN VIEW)
    // ========================================================

    // 1. Ujung Sasis Kereta Datar & Coupler yang Terlihat
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(-halfL, -halfW, len, width);

    // 2. Atap Kontainer ISO 40-Feet (Corrugated Steel Roof Panels)
    const containerColors = [
      '#991b1b', // Merah tua (Maersk / MSC)
      '#1e40af', // Biru laut (CMA CGM)
      '#92400e', // Coklat karat
      '#065f46', // Hijau tua (Evergreen)
      '#374151', // Abu-abu gelap (ONE / Hapag-Lloyd)
    ];
    const cColor = containerColors[wagonIndex % containerColors.length];

    const cWidth = width - 2;
    const halfCW = cWidth / 2;
    const cLen = len - 4;
    const halfCL = cLen / 2;

    ctx.fillStyle = cColor;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-halfCL, -halfCW, cLen, cWidth);
    ctx.strokeRect(-halfCL, -halfCW, cLen, cWidth);

    // 3. Garis Gelombang Melintang Plat Atap Kontainer (Transverse Ribs)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1;
    for (let rx = -halfCL + 4; rx < halfCL - 3; rx += 3.5) {
      ctx.beginPath();
      ctx.moveTo(rx, -halfCW + 1);
      ctx.lineTo(rx, halfCW - 1);
      ctx.stroke();
    }

    // 4. Casting Sudut Kontainer (ISO Corner Castings di 4 Sudut Atap)
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.8;
    const cornerOffsets = [
      { x: -halfCL + 1, y: -halfCW + 1 },
      { x: halfCL - 3, y: -halfCW + 1 },
      { x: -halfCL + 1, y: halfCW - 3 },
      { x: halfCL - 3, y: halfCW - 3 },
    ];
    cornerOffsets.forEach((co) => {
      ctx.fillRect(co.x, co.y, 2.5, 2.5);
      ctx.strokeRect(co.x, co.y, 2.5, 2.5);
    });
  }

  private drawTailCoach(
    ctx: CanvasRenderingContext2D,
    len: number,
    width: number,
    theme: { primary: string; secondary: string; stripe: string; roof: string },
    train: Train
  ) {
    // Gambar atap gerbong penumpang dasar
    this.drawPassengerCoach(ctx, len, width, theme, 7);

    const halfL = len / 2;

    // ========================================================
    // TAMPILAN SEMBOYAN 21 DI ATAP BELAKANG (TOP-DOWN)
    // Sepasang Lentera Merah di Ujung Bibir Atap Belakang Kereta
    // ========================================================
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-halfL + 1, -5, 2.2, 0, Math.PI * 2);
    ctx.arc(-halfL + 1, 5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Efek pendaran merah atmosferik Semboyan 21
    ctx.fillStyle = 'rgba(239, 68, 68, 0.55)';
    ctx.beginPath();
    ctx.arc(-halfL + 1, -5, 7, 0, Math.PI * 2);
    ctx.arc(-halfL + 1, 5, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * ==========================================================
   * KRL COMMUTER LINE (KERETA REL LISTRIK) - KEPALA KABIN DEPAN
   * Tampilan Atas Aerodinamis Modern KRL JR 205 / Tokyu Series
   * ==========================================================
   */
  private drawKRLCab(
    ctx: CanvasRenderingContext2D,
    len: number,
    width: number,
    theme: { primary: string; secondary: string; stripe: string; roof: string },
    train: Train,
    gameTime: number
  ) {
    const halfL = len / 2;
    const halfW = width / 2;

    // 1. Badan Kereta Stainless Steel KRL dengan Lis Merah & Kuning KCI
    const roofGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
    roofGrad.addColorStop(0, '#475569');
    roofGrad.addColorStop(0.2, '#94a3b8');
    roofGrad.addColorStop(0.5, '#e2e8f0');
    roofGrad.addColorStop(0.8, '#94a3b8');
    roofGrad.addColorStop(1, '#475569');

    ctx.fillStyle = roofGrad;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    // Ujung moncong KRL agak membulat halus khas EMU komuter
    ctx.moveTo(-halfL, -halfW);
    ctx.lineTo(halfL - 8, -halfW);
    ctx.quadraticCurveTo(halfL + 1, -halfW, halfL + 3, 0);
    ctx.quadraticCurveTo(halfL + 1, halfW, halfL - 8, halfW);
    ctx.lineTo(-halfL, halfW);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Garis Striping Merah / Biru & Kuning Khas KRL Commuter Line di Tepi Atap
    ctx.fillStyle = theme.primary; // Merah KRL Red Line atau Biru KRL Blue Line
    ctx.fillRect(-halfL + 4, -halfW + 0.8, len - 14, 1.8);
    ctx.fillRect(-halfL + 4, halfW - 2.6, len - 14, 1.8);

    ctx.fillStyle = theme.secondary; // Kuning atau Biru muda
    ctx.fillRect(-halfL + 4, -halfW + 2.6, len - 14, 1);
    ctx.fillRect(-halfL + 4, halfW - 3.6, len - 14, 1);

    // 3. Kaca Depan Kabin Masinis KRL Berwarna Gelap (Panoramic Windshield)
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.moveTo(halfL - 8, -halfW + 2);
    ctx.lineTo(halfL, -halfW + 3.5);
    ctx.lineTo(halfL + 2, 0);
    ctx.lineTo(halfL, halfW - 3.5);
    ctx.lineTo(halfL - 8, halfW - 2);
    ctx.closePath();
    ctx.fill();

    // Papan Rute Digital LED (Destination Rollsign Display)
    ctx.fillStyle = train.name.toLowerCase().includes('blue') ? '#38bdf8' : '#ef4444'; // LED Biru/Merah menyala
    ctx.fillRect(halfL - 5, -3, 3, 6);

    // 4. Modul AC HVAC Atap KRL
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.roundRect(-halfL + 14, -halfW + 3.5, 14, width - 7, 2);
    ctx.fill();
    ctx.stroke();

    // Kipas Kondensor AC
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-halfL + 18, 0, 2.2, 0, Math.PI * 2);
    ctx.arc(-halfL + 24, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Lampu Depan Kembar LED KRL (Dual High-Beam Headlights)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(halfL + 1.5, -4, 1.8, 0, Math.PI * 2);
    ctx.arc(halfL + 1.5, 4, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Sorot Cahaya Lampu Depan KRL ke Rel
    const beamGrad = ctx.createRadialGradient(
      halfL + 2, 0, 2,
      halfL + 150, 0, 150
    );
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
    beamGrad.addColorStop(0.35, 'rgba(254, 240, 138, 0.2)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0.0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(halfL + 2, -5);
    ctx.lineTo(halfL + 150, -35);
    ctx.lineTo(halfL + 150, 35);
    ctx.lineTo(halfL + 2, 5);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * ==========================================================
   * KRL COMMUTER LINE - GERBONG PENUMPANG TENGAH (DENGAN PANTOGRAF)
   * ==========================================================
   */
  private drawKRLCoach(
    ctx: CanvasRenderingContext2D,
    len: number,
    width: number,
    theme: { primary: string; secondary: string; stripe: string; roof: string },
    coachIndex: number,
    gameTime: number
  ) {
    // Dasar gerbong stainless steel penumpang
    this.drawPassengerCoach(ctx, len, width, theme, coachIndex);

    const halfL = len / 2;
    const halfW = width / 2;

    // Gerbong 2 dan 5 dilengkapi Pantograf Pengambil Listrik Aliran Atas (LAA)
    const hasPantograph = coachIndex === 2 || coachIndex === 5;

    if (hasPantograph) {
      const pantoX = halfL - 10;

      // Dudukan Isolator Porselen Keramik Coklat/Putih (Pantograph Insulators)
      ctx.fillStyle = '#b45309';
      [-3.5, 3.5].forEach((iy) => {
        ctx.fillRect(pantoX - 5, iy - 1, 3, 2);
        ctx.fillRect(pantoX + 3, iy - 1, 3, 2);
      });

      // Rangka Pantograf Baja Berlian (Diamond / Arm Pantograph Frame)
      ctx.strokeStyle = '#ef4444'; // Rangka merah cerah khas KRL
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pantoX - 4, -3.5);
      ctx.lineTo(pantoX, 0);
      ctx.lineTo(pantoX - 4, 3.5);
      ctx.moveTo(pantoX + 3, -3.5);
      ctx.lineTo(pantoX, 0);
      ctx.lineTo(pantoX + 3, 3.5);
      ctx.stroke();

      // Sepatu Kontak Tembaga Karbon Pantograf (Contact Bow / Shoe)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(pantoX - 1, -halfW + 2, 2, width - 4);

      // Percikan Listrik Kontak LAA Halus Saat Melaju
      if (Math.random() > 0.7) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(pantoX, (Math.random() - 0.5) * 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * ==========================================================
   * KRL COMMUTER LINE - KABIN BELAKANG DENGAN SEMBOYAN 21
   * ==========================================================
   */
  private drawKRLTailCab(
    ctx: CanvasRenderingContext2D,
    len: number,
    width: number,
    theme: { primary: string; secondary: string; stripe: string; roof: string },
    train: Train
  ) {
    const halfL = len / 2;
    const halfW = width / 2;

    // Gambar bodi KRL
    const roofGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
    roofGrad.addColorStop(0, '#475569');
    roofGrad.addColorStop(0.2, '#94a3b8');
    roofGrad.addColorStop(0.5, '#e2e8f0');
    roofGrad.addColorStop(0.8, '#94a3b8');
    roofGrad.addColorStop(1, '#475569');

    ctx.fillStyle = roofGrad;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(halfL, -halfW);
    ctx.lineTo(-halfL + 8, -halfW);
    ctx.quadraticCurveTo(-halfL - 1, -halfW, -halfL - 3, 0);
    ctx.quadraticCurveTo(-halfL - 1, halfW, -halfL + 8, halfW);
    ctx.lineTo(halfL, halfW);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Garis striping KCI
    ctx.fillStyle = theme.primary;
    ctx.fillRect(-halfL + 6, -halfW + 0.8, len - 14, 1.8);
    ctx.fillRect(-halfL + 6, halfW - 2.6, len - 14, 1.8);
    ctx.fillStyle = theme.secondary;
    ctx.fillRect(-halfL + 6, -halfW + 2.6, len - 14, 1);
    ctx.fillRect(-halfL + 6, halfW - 3.6, len - 14, 1);

    // Kaca Belakang Kabin
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.moveTo(-halfL + 8, -halfW + 2);
    ctx.lineTo(-halfL, -halfW + 3.5);
    ctx.lineTo(-halfL - 2, 0);
    ctx.lineTo(-halfL, halfW - 3.5);
    ctx.lineTo(-halfL + 8, halfW - 2);
    ctx.closePath();
    ctx.fill();

    // Semboyan 21: Lampu Belakang Merah Menyala
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-halfL - 1, -4, 2, 0, Math.PI * 2);
    ctx.arc(-halfL - 1, 4, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(239, 68, 68, 0.55)';
    ctx.beginPath();
    ctx.arc(-halfL - 1, -4, 6, 0, Math.PI * 2);
    ctx.arc(-halfL - 1, 4, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * ==========================================================
   * GERBONG KETEL BBM (KERETA BAHAN BAKAR MINYAK PERTAMINA)
   * Tampilan Atas Tangki Silinder Baja, Manhole Dome, & Hazmat
   * ==========================================================
   */
  private drawFuelTankWagon(
    ctx: CanvasRenderingContext2D,
    len: number,
    width: number,
    wagonIndex: number,
    isTail: boolean
  ) {
    const halfL = len / 2;
    const halfW = width / 2;

    // 1. Sasis Baja Hitam Bawah (Chassis Platform)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(-halfL, -halfW, len, width);

    // 2. Badan Tangki Silinder BBM (Cylindrical Tank Body - 3D Top Gradient)
    const tankGrad = ctx.createLinearGradient(0, -halfW + 1, 0, halfW - 1);
    tankGrad.addColorStop(0, '#0f172a');     // Tepi lengkung bayangan gelap
    tankGrad.addColorStop(0.2, '#1e293b');
    tankGrad.addColorStop(0.5, '#334155');   // Puncak silinder memantulkan cahaya
    tankGrad.addColorStop(0.8, '#1e293b');
    tankGrad.addColorStop(1, '#0f172a');

    const tankLen = len - 6;
    const halfTL = tankLen / 2;
    const tankW = width - 2;
    const halfTW = tankW / 2;

    ctx.fillStyle = tankGrad;
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    // Ujung tangki setengah lingkaran (Hemispherical Tank Heads)
    ctx.roundRect(-halfTL, -halfTW, tankLen, tankW, 5);
    ctx.fill();
    ctx.stroke();

    // 3. Pita Korporat Pertamina (Garis Merah & Biru Ciri Khas KA BBM Cilacap/Rewulu)
    ctx.fillStyle = '#dc2626'; // Merah Pertamina
    ctx.fillRect(-10, -halfTW, 20, 2);
    ctx.fillRect(-10, halfTW - 2, 20, 2);

    ctx.fillStyle = '#2563eb'; // Biru Pertamina
    ctx.fillRect(-10, -halfTW + 2, 20, 1.2);
    ctx.fillRect(-10, halfTW - 3.2, 20, 1.2);

    // 4. Manhole / Kubah Pengisian BBM Atap (Top Dome & Inspection Hatch)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tutup Baut Manhole Tengah
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Jembatan Titian Periksa Atap (Catwalk Grating & Handrails)
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-16, -2);
    ctx.lineTo(16, -2);
    ctx.moveTo(-16, 2);
    ctx.lineTo(16, 2);
    ctx.stroke();

    // 6. Belah Ketupat Tanda Bahan Berbahaya (Class 3 Flammable Liquid Hazmat Placard)
    ctx.save();
    ctx.translate(halfTL - 10, 0);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ef4444'; // Merah bahaya api
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();

    // 7. Jika Gerbong Paling Belakang: Lampu Semboyan 21 Merah
    if (isTail) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-halfL + 1, -5, 2.2, 0, Math.PI * 2);
      ctx.arc(-halfL + 1, 5, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(239, 68, 68, 0.55)';
      ctx.beginPath();
      ctx.arc(-halfL + 1, -5, 7, 0, Math.PI * 2);
      ctx.arc(-halfL + 1, 5, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * ==========================================================
   * GERBONG PETIKEMAS (INTERMODAL CONTAINER FLATCAR)
   * Tampilan Atas Gerbong Datar dengan Kontainer Berbagai Merk
   * ==========================================================
   */
  private drawContainerWagon(
    ctx: CanvasRenderingContext2D,
    len: number,
    width: number,
    wagonIndex: number,
    isTail: boolean
  ) {
    const halfL = len / 2;
    const halfW = width / 2;

    // Sasis Gerbong Datar (GD Skeleton Flatbed Chassis)
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(-halfL, -halfW, len, width);

    // Warna-warna Kontainer Pelayaran Nyata (Maritime Shipping Lines)
    const containerLiveries = [
      { bg: '#047857', name: 'EVERGREEN' }, // Hijau tua Evergreen
      { bg: '#0284c7', name: 'MAERSK' },    // Biru laut Maersk
      { bg: '#db2777', name: 'ONE' },       // Magenta cerah ONE
      { bg: '#1e3a8a', name: 'CMA CGM' },   // Biru tua CMA
      { bg: '#d97706', name: 'MSC' },       // Oranye MSC
      { bg: '#475569', name: 'HAPAG' },     // Abu-abu Hapag-Lloyd
    ];

    const livery = containerLiveries[wagonIndex % containerLiveries.length];
    const cWidth = width - 2.5;
    const halfCW = cWidth / 2;
    const cLen = len - 4;
    const halfCL = cLen / 2;

    // Bodi Atap Kontainer Baja Bergelombang
    ctx.fillStyle = livery.bg;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-halfCL, -halfCW, cLen, cWidth);
    ctx.strokeRect(-halfCL, -halfCW, cLen, cWidth);

    // Garis Gelombang Melintang Plat Atap (Corrugated Steel Ribs)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 0.9;
    for (let rx = -halfCL + 4; rx < halfCL - 3; rx += 3.2) {
      ctx.beginPath();
      ctx.moveTo(rx, -halfCW + 0.8);
      ctx.lineTo(rx, halfCW - 0.8);
      ctx.stroke();
    }

    // Tulisan Kode Kontainer di Atap
    ctx.font = 'bold 5px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'center';
    ctx.fillText(livery.name, 0, 1.8);

    // Kunci Pengikat Sudut Kontainer (ISO Twist Locks)
    ctx.fillStyle = '#eab308'; // Kuning pengunci
    const corners = [
      { x: -halfCL + 0.8, y: -halfCW + 0.8 },
      { x: halfCL - 3, y: -halfCW + 0.8 },
      { x: -halfCL + 0.8, y: halfCW - 3 },
      { x: halfCL - 3, y: halfCW - 3 },
    ];
    corners.forEach((c) => {
      ctx.fillRect(c.x, c.y, 2.2, 2.2);
    });

    // Jika Gerbong Paling Belakang: Semboyan 21 Merah
    if (isTail) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-halfL + 1, -5, 2.2, 0, Math.PI * 2);
      ctx.arc(-halfL + 1, 5, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(239, 68, 68, 0.55)';
      ctx.beginPath();
      ctx.arc(-halfL + 1, -5, 7, 0, Math.PI * 2);
      ctx.arc(-halfL + 1, 5, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export const stationRenderer = new StationRenderer();
