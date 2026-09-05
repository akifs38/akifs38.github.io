/* =====================================================================
 * LightText — Ekran ışığı ile telefonlar arası metin aktarımı
 * Saf HTML5 + CSS3 + Vanilla JS. Backend / ağ / Bluetooth YOK.
 *
 * PROTOKOL (LightText v1)
 * ----------------------------------------------------------------------
 * Modülasyon: Pulse-Width / kendinden saatli (self-clocking).
 *   Her bit bir "darbe" (pulse). Darbe polaritesi (ON=beyaz / OFF=siyah)
 *   her bitte otomatik değişir; bilgi darbe SÜRESİNDE taşınır:
 *       bit 0 = KISA darbe
 *       bit 1 = UZUN darbe
 *   Her bitte kesin bir kenar (edge) olduğu için alıcı kamerayı saatler
 *   ve FPS'ten bağımsız çalışır. Süreler mutlak zaman damgalarıyla ölçülür.
 *
 * Çerçeve (byte dizisi, MSB-first):
 *   [PREAMBLE] [SFD] [VERSION] [LENGTH(2)] [DATA(n)] [CRC16(2)] [END]
 *     PREAMBLE : "10" x 12  -> kalibrasyon (kısa/uzun kümeleri)
 *     SFD      : 0x7E        -> başlangıç işareti (byte hizalama)
 *     VERSION  : 0x01
 *     LENGTH   : UTF-8 veri byte sayısı (uint16, big-endian)
 *     DATA     : UTF-8 kodlanmış mesaj (Türkçe karakterler dahil)
 *     CRC16    : CRC-16/CCITT-FALSE  (VERSION+LENGTH+DATA üzerinde)
 *     END      : 0x7E        -> bitiş işareti
 * ===================================================================== */

'use strict';

/* ------------------------- Protokol sabitleri ------------------------- */
const PROTO = {
  VERSION: 0x01,
  SFD: 0x7e,
  END: 0x7e,
  PREAMBLE_BITS: (() => { const a = []; for (let i = 0; i < 12; i++) a.push(1, 0); return a; })(),
  MAX_LEN: 4096,
};

/* Zamanlama profilleri (ms). short = bit0, long = bit1 */
const TIMINGS = {
  slow:   { short: 220, long: 440, leadIn: 800, trail: 1000, gap: 1200 },
  normal: { short: 140, long: 280, leadIn: 700, trail: 900,  gap: 1000 },
  fast:   { short: 100, long: 200, leadIn: 600, trail: 800,  gap: 800 },
};

/* ============================ Yardımcılar ============================ */

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF)
function crc16(bytes) {
  let crc = 0xffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= (bytes[i] & 0xff) << 8;
    for (let b = 0; b < 8; b++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc & 0xffff;
}

function byteToBits(v) {
  const bits = [];
  for (let i = 7; i >= 0; i--) bits.push((v >> i) & 1);
  return bits;
}

function bitsToByte(bits, offset) {
  let v = 0;
  for (let i = 0; i < 8; i++) v = (v << 1) | (bits[offset + i] & 1);
  return v & 0xff;
}

/* ==================== KODLAYICI (metin -> darbeler) ==================== */

function buildFrameBits(text) {
  const data = new TextEncoder().encode(text); // UTF-8
  if (data.length > PROTO.MAX_LEN) {
    throw new Error('Mesaj çok uzun (' + data.length + ' byte). En fazla ' + PROTO.MAX_LEN + ' byte.');
  }
  const len = data.length;
  const lenHi = (len >> 8) & 0xff;
  const lenLo = len & 0xff;

  const crcInput = [PROTO.VERSION, lenHi, lenLo, ...data];
  const crc = crc16(crcInput);

  const frameBytes = [
    PROTO.SFD,
    PROTO.VERSION,
    lenHi, lenLo,
    ...data,
    (crc >> 8) & 0xff, crc & 0xff,
    PROTO.END,
  ];

  const bits = [...PROTO.PREAMBLE_BITS];
  for (const b of frameBytes) bits.push(...byteToBits(b));
  return bits;
}

// bit dizisini darbe (pulse) listesine çevir; polarite her bitte değişir.
function bitsToPulses(bits, timing) {
  const pulses = [];
  pulses.push({ on: false, dur: timing.leadIn }); // başlangıç siyah (min parlaklık kalibrasyonu)
  for (let i = 0; i < bits.length; i++) {
    const on = (i % 2 === 0);                       // ilk darbe ON'dan başlar
    const dur = bits[i] ? timing.long : timing.short;
    pulses.push({ on, dur });
  }
  const lastOn = ((bits.length - 1) % 2 === 0);
  pulses.push({ on: !lastOn, dur: timing.trail });  // son bitin kenarını üret + boşta bekle
  return pulses;
}

/* ============================ GÖNDERİCİ ============================ */

const Sender = (() => {
  let rafId = null;
  let wakeLock = null;
  let cancelled = false;

  const flashEl = () => document.getElementById('flash');
  const areaEl = () => document.getElementById('flashArea');
  const stateEl = () => document.getElementById('sendState');
  const progEl = () => document.getElementById('sendProgress');

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => {});
        return true;
      }
    } catch (e) { /* yoksay */ }
    return false;
  }
  async function releaseWakeLock() {
    try { if (wakeLock) { await wakeLock.release(); } } catch (e) {}
    wakeLock = null;
  }
  // Sekme geri gelince wake lock'u yenile
  document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible' && rafId) {
      try { wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
    }
  });

  // Tek bir çerçeveyi (repeat kez) gönder
  async function send(text, speed, repeat) {
    cancelled = false;
    const timing = TIMINGS[speed] || TIMINGS.normal;

    let bits;
    try { bits = buildFrameBits(text); }
    catch (e) { alert(e.message); return; }

    const framePulses = bitsToPulses(bits, timing);

    // Tekrarları tek bir zaman çizelgesinde birleştir (aralara boşluk koy)
    const pulses = [];
    for (let r = 0; r < repeat; r++) {
      for (const p of framePulses) pulses.push(p);
      if (r < repeat - 1) pulses.push({ on: false, dur: timing.gap }); // tekrarlar arası boşluk
    }

    // Mutlak başlangıç zamanlarını hesapla
    let acc = 0;
    const starts = new Array(pulses.length);
    for (let i = 0; i < pulses.length; i++) { starts[i] = acc; acc += pulses[i].dur; }
    const total = acc;

    // Arayüzü hazırla
    flashEl().hidden = false;
    stateEl().textContent = 'Gönderiliyor…';
    progEl().style.width = '0%';

    const hadWake = await requestWakeLock();
    // Wake Lock uyarısı ana ekranda zaten gösteriliyor; burada state'e de yansıt
    if (!hadWake) stateEl().textContent = 'Gönderiliyor… (ekranı açık tutun)';

    // Tam ekran (best-effort)
    try { if (flashEl().requestFullscreen) await flashEl().requestFullscreen(); } catch (e) {}

    const t0 = performance.now();

    return new Promise((resolve) => {
      function frame(now) {
        if (cancelled) { finish(false); resolve(false); return; }
        const elapsed = now - t0;

        if (elapsed >= total) {
          areaEl().classList.remove('on');
          progEl().style.width = '100%';
          finish(true);
          resolve(true);
          return;
        }

        // İkili arama yerine ileri tarama (darbe sayısı küçük)
        // Geçerli darbeyi bul
        let idx = pulses.length - 1;
        for (let i = 0; i < pulses.length; i++) {
          if (elapsed < starts[i] + pulses[i].dur) { idx = i; break; }
        }
        areaEl().classList.toggle('on', pulses[idx].on);
        progEl().style.width = Math.min(100, (elapsed / total) * 100).toFixed(1) + '%';

        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  async function finish(ok) {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    await releaseWakeLock();
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) {}
    if (ok) stateEl().textContent = '✅ Mesaj gönderildi';
    // Kısa bir süre sonra kapat
    setTimeout(() => { flashEl().hidden = true; }, ok ? 900 : 100);
  }

  function cancel() { cancelled = true; }

  return { send, cancel };
})();

/* ============================ ALICI / DECODER ============================
 * İki bağımsız uyarlanabilir katman:
 *   1) Parlaklık -> seviye (ON/OFF): kayan pencere min/max + histerezis
 *      (pozlama / ortam ışığı değişimlerine dayanıklı)
 *   2) Süre -> bit (kısa/uzun): kayan pencere üzerinde k-means (k=2)
 *      (gönderim hızından / FPS'ten bağımsız)
 * ====================================================================== */

const Receiver = (() => {
  let stream = null;
  let rafId = null;
  let running = false;

  let video, canvas, ctx;
  const AW = 80, AH = 60; // analiz çözünürlüğü (düşük CPU)

  // Parlaklık örnekleri (zaman pencereli)
  let samples = [];              // {t, b}
  const SAMPLE_WINDOW_MS = 2500;
  const MIN_CONTRAST = 22;       // min-max farkı bu değerin altındaysa sinyal yok

  // Seviye / kenar durumu
  let level = 0;                 // 0=OFF, 1=ON
  let lastEdgeT = null;
  let firstEdgeSeen = false;

  // Darbe süreleri ve bitler
  let pulseDurs = [];            // ölçülen tüm darbe süreleri (px sonrası)
  const KMEANS_WINDOW = 90;      // merkez hesabı için son N darbe
  let calibrated = false;
  let threshold = 0;
  let shortEst = 0, longEst = 0;

  let searchStart = 0;           // SFD aramaya başlanacak bit indeksi
  let decoded = false;

  // Callbacks
  let onStatus = () => {};
  let onProgress = () => {};
  let onResult = () => {};
  let onLevel = () => {};

  function reset() {
    samples = [];
    level = 0; lastEdgeT = null; firstEdgeSeen = false;
    pulseDurs = []; calibrated = false; threshold = 0; shortEst = 0; longEst = 0;
    searchStart = 0; decoded = false;
  }

  async function start(cbs) {
    onStatus = cbs.onStatus || onStatus;
    onProgress = cbs.onProgress || onProgress;
    onResult = cbs.onResult || onResult;
    onLevel = cbs.onLevel || onLevel;

    if (!isSecureContext && location.hostname !== 'localhost') {
      throw new Error('Kamera için güvenli bağlantı (HTTPS) gerekir.');
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Bu tarayıcı kamera erişimini (getUserMedia) desteklemiyor.');
    }

    onStatus('Kamera açılıyor…');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 }, height: { ideal: 480 },
        },
        audio: false,
      });
    } catch (err) {
      throw mapCameraError(err);
    }

    video = document.getElementById('video');
    video.srcObject = stream;
    video.setAttribute('playsinline', '');
    try { await video.play(); } catch (e) {}

    canvas = document.createElement('canvas');
    canvas.width = AW; canvas.height = AH;
    ctx = canvas.getContext('2d', { willReadFrequently: true });

    reset();
    running = true;
    onStatus('Kalibrasyon yapılıyor');
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    if (video) video.srcObject = null;
  }

  function mapCameraError(err) {
    const n = err && err.name;
    if (n === 'NotAllowedError' || n === 'SecurityError') {
      return new Error('Kamera erişimi reddedildi. Tarayıcı ayarlarından kamera iznini açın.');
    }
    if (n === 'NotFoundError' || n === 'DevicesNotFoundError') {
      return new Error('Kamera bulunamadı. Cihazınızda bir kamera olduğundan emin olun.');
    }
    if (n === 'NotReadableError' || n === 'TrackStartError') {
      return new Error('Kameraya erişilemiyor. Başka bir uygulama kamerayı kullanıyor olabilir.');
    }
    return new Error('Kamera başlatılamadı: ' + (err && err.message ? err.message : n || 'bilinmeyen hata'));
  }

  function loop(ts) {
    if (!running) return;
    if (video && video.readyState >= 2) {
      const b = sampleBrightness();
      processSample(ts, b);
    }
    rafId = requestAnimationFrame(loop);
  }

  // Orta bölge (ROI) ortalama parlaklığı
  function sampleBrightness() {
    ctx.drawImage(video, 0, 0, AW, AH);
    const rx = Math.floor(AW * 0.3), ry = Math.floor(AH * 0.3);
    const rw = Math.floor(AW * 0.4), rh = Math.floor(AH * 0.4);
    const data = ctx.getImageData(rx, ry, rw, rh).data;
    let sum = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      // luma yaklaşık: 0.299R + 0.587G + 0.114B
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    return sum / n;
  }

  function processSample(t, b) {
    samples.push({ t, b });
    // pencereyi buda
    const cutoff = t - SAMPLE_WINDOW_MS;
    while (samples.length && samples[0].t < cutoff) samples.shift();

    // kayan pencere min/max
    let mn = Infinity, mx = -Infinity;
    for (const s of samples) { if (s.b < mn) mn = s.b; if (s.b > mx) mx = s.b; }
    const range = mx - mn;

    // seviye çubuğu (aiming için)
    onLevel(range > 1 ? (b - mn) / range : 0);

    if (range < MIN_CONTRAST) {
      // yeterli kontrast yok -> kalibrasyon / sinyal bekleniyor
      if (!decoded) onStatus('Kalibrasyon yapılıyor');
      return;
    }

    // histerezis eşikleri
    const hi = mn + range * 0.6;
    const lo = mn + range * 0.4;
    const newLevel = (b > hi) ? 1 : (b < lo) ? 0 : level;

    if (newLevel !== level) {
      level = newLevel;
      // kenar
      if (!firstEdgeSeen) {
        firstEdgeSeen = true;
        lastEdgeT = t;
      } else {
        const dur = t - lastEdgeT;
        lastEdgeT = t;
        if (dur >= 30) {          // çok kısa titremeleri (glitch) yoksay
          onPulse(dur);
        }
      }
    }
  }

  function onPulse(dur) {
    pulseDurs.push(dur);
    // bellek sınırı
    if (pulseDurs.length > 6000) pulseDurs.splice(0, pulseDurs.length - 6000);

    calibrate();
    if (!calibrated) { onStatus('Sinyal aranıyor…'); return; }

    tryDecode();
  }

  // Son KMEANS_WINDOW darbe üzerinde k-means (k=2)
  function calibrate() {
    const win = pulseDurs.slice(-KMEANS_WINDOW);
    if (win.length < 8) { calibrated = false; return; }

    let c0 = Math.min(...win);
    let c1 = Math.max(...win);
    if (c1 - c0 < 1) { calibrated = false; return; }

    for (let iter = 0; iter < 12; iter++) {
      let s0 = 0, n0 = 0, s1 = 0, n1 = 0;
      const mid = (c0 + c1) / 2;
      for (const d of win) {
        if (d <= mid) { s0 += d; n0++; } else { s1 += d; n1++; }
      }
      if (n0 === 0 || n1 === 0) break;
      const nc0 = s0 / n0, nc1 = s1 / n1;
      if (Math.abs(nc0 - c0) < 0.5 && Math.abs(nc1 - c1) < 0.5) { c0 = nc0; c1 = nc1; break; }
      c0 = nc0; c1 = nc1;
    }

    // iki küme yeterince ayrık mı? (uzun/kısa oranı)
    if (c0 > 0 && c1 / c0 >= 1.45) {
      shortEst = c0; longEst = c1; threshold = (c0 + c1) / 2; calibrated = true;
    } else {
      calibrated = false;
    }
  }

  // Tüm darbe sürelerini geçerli eşikle bitlere çevir
  function buildBits() {
    const bits = new Array(pulseDurs.length);
    for (let i = 0; i < pulseDurs.length; i++) bits[i] = pulseDurs[i] < threshold ? 0 : 1;
    return bits;
  }

  function findSFD(bits, from) {
    const sfd = byteToBits(PROTO.SFD); // 8 bit
    for (let i = from; i + 8 <= bits.length; i++) {
      let ok = true;
      for (let j = 0; j < 8; j++) { if (bits[i + j] !== sfd[j]) { ok = false; break; } }
      if (ok) return i;
    }
    return -1;
  }

  function tryDecode() {
    if (decoded) return;
    const bits = buildBits();

    let sfdPos = findSFD(bits, searchStart);
    while (sfdPos !== -1) {
      const headStart = sfdPos + 8;
      // VERSION(8) + LENGTH(16) gerekli
      if (headStart + 24 > bits.length) { onStatus('Sinyal algılandı'); return; }

      const version = bitsToByte(bits, headStart);
      const len = (bitsToByte(bits, headStart + 8) << 8) | bitsToByte(bits, headStart + 16);

      if (len > PROTO.MAX_LEN) {
        // geçersiz -> sahte SFD, sonrakini ara
        searchStart = sfdPos + 1;
        sfdPos = findSFD(bits, searchStart);
        continue;
      }

      const dataStart = headStart + 24;
      const totalNeeded = dataStart + len * 8 + 16 + 8; // data + crc16 + end

      // ilerleme
      const have = Math.max(0, bits.length - dataStart);
      const pct = len > 0 ? Math.min(100, Math.floor((have / (len * 8)) * 100)) : 100;
      onProgress(pct);
      onStatus('Veri okunuyor %' + pct);

      if (bits.length < totalNeeded) return; // daha fazla bit bekle

      // Baytları çıkar
      const dataBytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) dataBytes[i] = bitsToByte(bits, dataStart + i * 8);
      const crcRecv = (bitsToByte(bits, dataStart + len * 8) << 8) | bitsToByte(bits, dataStart + len * 8 + 8);
      const endByte = bitsToByte(bits, dataStart + len * 8 + 16);

      const crcCalc = crc16([version, (len >> 8) & 0xff, len & 0xff, ...dataBytes]);

      if (crcCalc === crcRecv && endByte === PROTO.END) {
        // Başarılı
        let text;
        try {
          text = new TextDecoder('utf-8', { fatal: false }).decode(dataBytes);
        } catch (e) { text = new TextDecoder().decode(dataBytes); }
        decoded = true;
        onProgress(100);
        onStatus('Mesaj çözüldü');
        onResult(text);
        return;
      } else {
        // Hatalı çerçeve -> sonraki SFD'yi dene
        searchStart = sfdPos + 1;
        sfdPos = findSFD(bits, searchStart);
        onStatus('Sinyal bozuldu, tekrar deneniyor…');
      }
    }
  }

  return { start, stop, reset };
})();

/* ============================ ARAYÜZ / NAVIGASYON ============================ */

(function initUI() {
  const $ = (id) => document.getElementById(id);

  const screens = { home: $('home'), sender: $('sender'), receiver: $('receiver') };
  function show(name) {
    Object.keys(screens).forEach(k => { screens[k].hidden = (k !== name); });
    if (name !== 'receiver') Receiver.stop();
  }

  // Güvenli bağlam uyarısı (kamera)
  if (!window.isSecureContext && location.hostname !== 'localhost') {
    const w = $('secWarn'); if (w) w.hidden = false;
  }

  // ---- Navigasyon ----
  $('btnGoSend').addEventListener('click', () => show('sender'));
  $('btnGoRecv').addEventListener('click', () => show('receiver'));
  document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => show('home')));

  // ---- Gönderici ayarları ----
  let curSpeed = 'normal';
  let curRepeat = 2;

  function wireSegmented(containerId, attr, cb) {
    const el = $(containerId);
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      el.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      cb(btn.getAttribute(attr));
    });
  }
  wireSegmented('speedSel', 'data-speed', v => curSpeed = v);
  wireSegmented('repeatSel', 'data-repeat', v => curRepeat = parseInt(v, 10) || 1);

  // Karakter / byte sayacı
  const msgInput = $('msgInput');
  const byteInfo = $('byteInfo');
  function updateCount() {
    const text = msgInput.value;
    const bytes = new TextEncoder().encode(text).length;
    byteInfo.textContent = text.length + ' karakter · ' + bytes + ' byte';
    if (bytes > PROTO.MAX_LEN) byteInfo.textContent += ' ⚠️ çok uzun';
  }
  msgInput.addEventListener('input', updateCount);
  updateCount();

  // Wake Lock uyarısı
  if (!('wakeLock' in navigator)) { $('wakeWarn').hidden = false; }

  // Gönder
  $('btnSend').addEventListener('click', async () => {
    const text = msgInput.value;
    if (!text) { alert('Lütfen gönderilecek bir metin yazın.'); return; }
    await Sender.send(text, curSpeed, curRepeat);
  });
  $('btnCancel').addEventListener('click', () => Sender.cancel());

  // ---- Alıcı ----
  const btnCam = $('btnCam');
  const statusText = $('statusText');
  const progressFill = $('progressFill');
  const levelFill = $('levelFill');
  const camError = $('camError');
  const resultBox = $('resultBox');
  const resultText = $('resultText');

  let camOn = false;

  function setStatus(s) { statusText.textContent = s; }
  function setProgress(p) { progressFill.style.width = p + '%'; }
  function setLevel(v) { levelFill.style.width = Math.max(0, Math.min(100, v * 100)).toFixed(0) + '%'; }

  async function startCamera() {
    camError.hidden = true;
    resultBox.hidden = true;
    setProgress(0);
    try {
      await Receiver.start({
        onStatus: setStatus,
        onProgress: setProgress,
        onLevel: setLevel,
        onResult: (text) => {
          resultText.textContent = text;
          resultBox.hidden = false;
          setProgress(100);
        },
      });
      camOn = true;
      btnCam.textContent = 'Kamerayı Durdur';
    } catch (err) {
      camError.textContent = err.message || String(err);
      camError.hidden = false;
      setStatus('Kamera bekleniyor');
      camOn = false;
      btnCam.textContent = 'Kamerayı Başlat';
    }
  }

  function stopCamera() {
    Receiver.stop();
    camOn = false;
    btnCam.textContent = 'Kamerayı Başlat';
    setStatus('Kamera bekleniyor');
    setLevel(0);
  }

  btnCam.addEventListener('click', () => { camOn ? stopCamera() : startCamera(); });

  // Kopyala / Temizle
  $('btnCopy').addEventListener('click', async () => {
    const text = resultText.textContent || '';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      }
      const btn = $('btnCopy'); const old = btn.textContent;
      btn.textContent = '✅ Kopyalandı'; setTimeout(() => btn.textContent = old, 1500);
    } catch (e) { alert('Kopyalanamadı: ' + e.message); }
  });

  $('btnClear').addEventListener('click', () => {
    resultText.textContent = '';
    resultBox.hidden = true;
    setProgress(0);
    Receiver.reset();
    if (camOn) setStatus('Sinyal aranıyor…');
  });
})();
