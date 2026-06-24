/* ============================================================================
   ARDUINO OTOMATİK YANGIN TESPİT ve SÖNDÜRME KULESİ
   ----------------------------------------------------------------------------
   - 2x SG90 servo: ALT (tarama) + ÜST (hedefleme/nişan)
   - 1x ALEV SENSÖRÜ modülü (alt servo üzerinde döner, ortamı tarar)
   - 1x mini DC POMPA (MOSFET/röle ile sürülür)
   - 2x durum LED'i (tespit = kırmızı, pompa = yeşil)

   Mantık (web simülasyonuyla AYNI sıra):
     TARA -> BUL -> NİŞAN AL -> SÖNDÜR -> TARAMAYA DÖN

   Seri protokol (115200 baud, satır sonu '\n'):
     PC -> Arduino (komut):
        RUN 1 | RUN 0     -> başlat / durdur
        SPD <derece/sn>   -> tarama hızı
        TOL <derece>      -> tespit/onay toleransı
        PING              -> "PONG" döner
     Arduino -> PC (telemetri, ~10 Hz):
        T <scan> <aim> <pump> <state> <flame>
        scan,aim  : servo açıları (derece, 0..180)
        pump      : 0/1
        state     : 0=IDLE 1=SCAN 2=DETECT 3=AIM 4=EXTINGUISH 5=RETURN
        flame     : tespit açısı (derece) ya da -1 (yok)
   ============================================================================ */

#include <Servo.h>

/* ----------------------- PİN TANIMLARI ----------------------- */
const uint8_t PIN_SCAN_SERVO = 9;    // ALT servo (tarama)
const uint8_t PIN_AIM_SERVO  = 10;   // ÜST servo (nişan)
const uint8_t PIN_FLAME_AO   = A0;   // alev sensörü ANALOG çıkış
const uint8_t PIN_FLAME_DO   = 2;    // alev sensörü DİJİTAL çıkış (opsiyonel)
const uint8_t PIN_PUMP       = 7;    // DC pompa (MOSFET/röle gate/IN)
const uint8_t PIN_LED_DETECT = 5;    // tespit LED'i (kırmızı)
const uint8_t PIN_LED_PUMP   = 6;    // pompa LED'i (yeşil)
const uint8_t PIN_FAKE       = 3;    // SAHTE ALARM: bu pini GND'ye değdir = yangın (test)

/* ----------------------- AYARLAR ----------------------- */
// Alev sensörü: alev VARKEN analog değer DÜŞER (daha çok IR).
// Kendi modülüne göre kalibre et (Serial Monitor'da A0 değerine bak).
int   FLAME_THRESHOLD = 300;   // bu değerin ALTI = alev var
int   scanSpeedDps    = 55;    // tarama hızı (derece/sn)
int   toleranceDeg    = 6;     // onay toleransı (derece)

// RÖLE POLARİTESİ: çoğu ucuz modül TERS çalışır (IN=LOW -> röle çeker).
// Röle ters davranıyorsa (boşta pompa açık / hiç çalışmıyorsa) bunu true yap.
const bool RELAY_ACTIVE_LOW = true;

const uint16_t DETECT_HOLD_MS    = 600;   // tespitte bekleme
const uint16_t RETURN_DELAY_MS   = 400;   // söndürme sonrası bekleme
const uint16_t EXTINGUISH_MAX_MS = 6000;  // güvenlik: max söndürme süresi
const uint8_t  AIM_STEP_DEG      = 2;      // nişan servosunun adım büyüklüğü
const uint16_t AIM_STEP_MS       = 15;     // nişan servosu adım periyodu

/* ----------------------- DURUMLAR ----------------------- */
enum State { IDLE=0, SCANNING=1, DETECTED=2, AIMING=3, EXTINGUISHING=4, RETURNING=5 };

Servo scanServo;
Servo aimServo;

bool    running     = true;      // açılışta otomatik tarama (RUN 0 ile durur)
uint8_t flameCount  = 0;         // arka arkaya alev görme sayacı (yanlış alarm engeli)
State   state       = IDLE;

float   scanAngle   = 90;        // alt servo anlık açı
int     scanDir     = 1;         // tarama yönü +1/-1
float   aimAngle    = 90;        // üst servo anlık açı
int     detectAngle = -1;        // tespit edilen yangının açısı
bool    pumpOn      = false;

unsigned long tLastScan  = 0;    // tarama adımı zamanlayıcı
unsigned long tLastAim   = 0;    // nişan adımı zamanlayıcı
unsigned long tStateIn   = 0;    // duruma giriş zamanı
unsigned long tLastTelem = 0;    // telemetri zamanlayıcı

/* ----------------------- YARDIMCILAR ----------------------- */
void setPump(bool on) {
  pumpOn = on;
  bool level = RELAY_ACTIVE_LOW ? !on : on;          // role polaritesine göre
  digitalWrite(PIN_PUMP, level ? HIGH : LOW);
  digitalWrite(PIN_LED_PUMP, on ? HIGH : LOW);
}

void enterState(State s) {
  state = s;
  tStateIn = millis();
  digitalWrite(PIN_LED_DETECT, (s == DETECTED || s == AIMING || s == EXTINGUISHING) ? HIGH : LOW);
}

// Alev sensörü o an alev görüyor mu?
bool flameSeen() {
  // SAHTE ALARM: D3 pini GND'ye çekilirse (buton/jumper) yangın say (test için)
  if (digitalRead(PIN_FAKE) == LOW) return true;
  int ao = analogRead(PIN_FLAME_AO);
  // İstersen dijital çıkışı da kullan: LOW = alev (çoğu modülde)
  // bool do = (digitalRead(PIN_FLAME_DO) == LOW);
  return (ao < FLAME_THRESHOLD);
}

/* ----------------------- KURULUM ----------------------- */
void setup() {
  Serial.begin(115200);

  pinMode(PIN_FLAME_DO, INPUT);
  pinMode(PIN_FAKE, INPUT_PULLUP);     // sahte alarm: normalde HIGH, GND'ye değince LOW
  pinMode(PIN_PUMP, OUTPUT);
  pinMode(PIN_LED_DETECT, OUTPUT);
  pinMode(PIN_LED_PUMP, OUTPUT);
  setPump(false);

  scanServo.attach(PIN_SCAN_SERVO);
  aimServo.attach(PIN_AIM_SERVO);
  scanServo.write((int)scanAngle);
  aimServo.write((int)aimAngle);

  enterState(IDLE);
  Serial.println(F("# Yangin Kulesi hazir. Komutlar: RUN 1/0, SPD <n>, TOL <n>, PING"));
}

/* ----------------------- ANA DÖNGÜ ----------------------- */
void loop() {
  handleSerial();         // PC'den gelen komutları işle
  updateStateMachine();   // tara/bul/nişan al/söndür
  sendTelemetry();        // PC'ye durum gönder
}

/* ----------------------- DURUM MAKİNESİ ----------------------- */
void updateStateMachine() {
  unsigned long now = millis();

  if (!running) {
    // durdurulduysa pompayı kapat, taramayı durdur
    if (pumpOn) setPump(false);
    if (state != IDLE) enterState(IDLE);
    return;
  }

  switch (state) {

    case IDLE:
      enterState(SCANNING);
      break;

    case SCANNING: {
      // tarama hızına göre adım periyodu (her adım 1 derece)
      unsigned long stepMs = (scanSpeedDps > 0) ? (1000UL / scanSpeedDps) : 20;
      if (now - tLastScan >= stepMs) {
        tLastScan = now;
        scanAngle += scanDir;
        if (scanAngle >= 180) { scanAngle = 180; scanDir = -1; }
        if (scanAngle <= 0)   { scanAngle = 0;   scanDir =  1; }
        scanServo.write((int)scanAngle);

        // sensör o anki açıda alev görüyor mu? (3 ardışık okuma = gerçek alev,
        // tek seferlik gürültü/boşta kalan pin yanlış alarmı engellenir)
        if (flameSeen()) {
          if (++flameCount >= 3) {
            flameCount = 0;
            detectAngle = (int)scanAngle;     // yangının yönü = sensörün baktığı açı
            enterState(DETECTED);
          }
        } else {
          flameCount = 0;
        }
      }
      break;
    }

    case DETECTED:
      // tarama bu açıda kısa süre dursun (onay)
      if (now - tStateIn >= DETECT_HOLD_MS) {
        if (flameSeen()) enterState(AIMING);   // hâlâ alev varsa nişan al
        else             enterState(SCANNING); // yanlış alarm -> taramaya dön
      }
      break;

    case AIMING:
      // üst servoyu yumuşak geçişle tespit açısına döndür
      if (now - tLastAim >= AIM_STEP_MS) {
        tLastAim = now;
        if (abs((int)aimAngle - detectAngle) <= AIM_STEP_DEG) {
          aimAngle = detectAngle;
          aimServo.write((int)aimAngle);
          setPump(true);                 // nişan tamam -> pompa ON
          enterState(EXTINGUISHING);
        } else {
          aimAngle += (detectAngle > aimAngle) ? AIM_STEP_DEG : -AIM_STEP_DEG;
          aimServo.write((int)aimAngle);
        }
      }
      break;

    case EXTINGUISHING:
      // alev sönene kadar pompayı çalıştır (güvenlik süresiyle sınırlı)
      if (!flameSeen() || (now - tStateIn >= EXTINGUISH_MAX_MS)) {
        setPump(false);
        enterState(RETURNING);
      }
      break;

    case RETURNING:
      if (now - tStateIn >= RETURN_DELAY_MS) {
        detectAngle = -1;
        enterState(SCANNING);            // sıradaki yangını ara
      }
      break;
  }
}

/* ----------------------- TELEMETRİ ----------------------- */
void sendTelemetry() {
  unsigned long now = millis();
  if (now - tLastTelem < 100) return;    // ~10 Hz
  tLastTelem = now;

  Serial.print(F("T "));
  Serial.print((int)scanAngle); Serial.print(' ');
  Serial.print((int)aimAngle);  Serial.print(' ');
  Serial.print(pumpOn ? 1 : 0); Serial.print(' ');
  Serial.print((int)state);     Serial.print(' ');
  Serial.println(detectAngle);

  // teşhis: saniyede bir A0 değeri (kalibrasyon için). '#' satırını sim yok sayar.
  static unsigned long tDbg = 0;
  if (now - tDbg >= 1000) {
    tDbg = now;
    Serial.print(F("# A0=")); Serial.print(analogRead(PIN_FLAME_AO));
    Serial.print(F(" thr=")); Serial.print(FLAME_THRESHOLD);
    Serial.print(F(" run=")); Serial.print(running);
    Serial.print(F(" state=")); Serial.println((int)state);
  }
}

/* ----------------------- SERİ KOMUTLAR ----------------------- */
void handleSerial() {
  static char buf[32];
  static uint8_t idx = 0;

  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (idx > 0) { buf[idx] = 0; parseCommand(buf); idx = 0; }
    } else if (idx < sizeof(buf) - 1) {
      buf[idx++] = c;
    }
  }
}

void parseCommand(char *cmd) {
  if (strncmp(cmd, "RUN", 3) == 0) {
    running = (atoi(cmd + 4) != 0);
    if (!running) { setPump(false); enterState(IDLE); }
  }
  else if (strncmp(cmd, "SPD", 3) == 0) {
    int v = atoi(cmd + 4);
    if (v > 0) scanSpeedDps = v;
  }
  else if (strncmp(cmd, "TOL", 3) == 0) {
    int v = atoi(cmd + 4);
    if (v > 0) toleranceDeg = v;
  }
  else if (strncmp(cmd, "PING", 4) == 0) {
    Serial.println(F("PONG"));
  }
}
