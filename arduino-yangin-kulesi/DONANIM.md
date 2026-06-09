# Arduino Yangın Kulesi — Donanım & Haberleşme

Bu klasördeki 3D web simülasyonu, gerçek Arduino projesinin **dijital ikizidir**.
Tarayıcı, gerçek karta **Web Serial API** ile doğrudan USB üzerinden bağlanır;
böylece sim, gerçek servoları/sensörü/pompayı **birebir yansıtır** (hardware‑in‑the‑loop).

## Haberleşme mimarisi

```
[Arduino UNO/Nano] --USB seri (115200)--> [Chrome/Edge tarayıcı] --> 3D sim
        ^                                              |
        |------------------ komut (RUN/SPD/TOL) -------|
```

- **Telemetri (Arduino → PC, ~10 Hz):** `T <scan> <aim> <pump> <state> <flame>`
  - `scan`,`aim`: servo açıları (0–180°), `pump`: 0/1, `state`: 0–5, `flame`: tespit açısı veya −1
- **Komut (PC → Arduino):** `RUN 1|0`, `SPD <derece/sn>`, `TOL <derece>`, `PING`

Simülasyondaki **Başlat/Durdur**, **Tarama Hızı** ve **Tolerans** kontrolleri,
Arduino bağlıyken otomatik olarak `RUN/SPD/TOL` komutlarını gönderir.

> Web Serial yalnızca **Chrome/Edge** (masaüstü) ve **https veya localhost** üzerinde çalışır.
> Yayındaki `https://akifs38.github.io/arduino-yangin-kulesi/` adresi https olduğu için uygundur.
> (iOS Safari / Firefox Web Serial desteklemez.)

## Kullanım
1. Arduino'ya `arduino/yangin_kulesi.ino` dosyasını yükle.
2. Kartı USB ile bilgisayara bağla, tarayıcıda simülasyonu aç.
3. Panelde **🔌 Arduino'ya Bağlan** → açılan listeden seri portu seç.
4. Mod "Donanım (Arduino)" olur; 3D kule artık gerçek karttan gelen açılarla hareket eder.

## Bağlantı şeması (pinler `.ino` içinde tanımlı)

| Bileşen                 | Arduino pini | Not |
|-------------------------|--------------|-----|
| Alt servo (TARAMA)      | D9           | SG90 sinyal |
| Üst servo (NİŞAN)       | D10          | SG90 sinyal |
| Alev sensörü — AO       | A0           | analog (alev varken değer DÜŞER) |
| Alev sensörü — DO       | D2           | opsiyonel dijital |
| DC pompa (MOSFET/röle)  | D7           | pompayı asla doğrudan pine bağlama! |
| Tespit LED'i (kırmızı)  | D5           | 220Ω seri direnç |
| Pompa LED'i (yeşil)     | D6           | 220Ω seri direnç |

### Önemli güç/elektrik notları
- **Servolar ve pompa Arduino 5V pininden BESLENMEZ.** Ayrı bir güç kaynağı kullan
  (örn. 2× SG90 için 5V; mini DC pompa için kendi gerilimi). **GND'leri ortak yap.**
- DC pompayı bir **MOSFET (örn. IRLZ44N) veya röle modülü** ile sür; motor uçlarına
  ters akım için **flyback diyot** (örn. 1N4007) koy.
- Alev sensörünü `FLAME_THRESHOLD` ile kalibre et: Seri Monitör'de A0 değerine bakıp
  alevliyken/alevsizken aradaki bir eşiği seç.

## Alternatif: Seri köprü (Web Serial olmayan tarayıcılar)
Web Serial yoksa, bir mini köprü ile aynı işi yapabilirsin:
`Arduino ↔ (Python pyserial / Node serialport) ↔ WebSocket ↔ tarayıcı`.
Telemetri/komut metin protokolü birebir aynı kalır; istenirse eklenebilir.
