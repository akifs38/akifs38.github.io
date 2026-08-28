# 3D Üretim Hattı Takibi (S7-300)

Fabrika üretim hattını, **motor (Q) ve sensör (I) adreslerine** göre tarayıcıda 3 boyutlu takip
eden basit bir görselleştirme. Ek kurulum yok — `index.html` tek dosya, Three.js CDN'den yüklenir.

🔗 Canlı: `https://akifs38.github.io/uretim-hatti-3d/`

## Hat Kurgusu

```
K1 → K2 → K3 → K4 → [KROSS 90° dönüş] → [ASANSÖR 1 ↑]
                                              │
        K8 ← K7 ← K6 ← K5  (üst kat)  ────────┘
         │
   [ASANSÖR 2 ↓] → K9 → K10 → K11 → K12
```

- **4 konveyör** (zemin) → **kross** (ürün 90° döner) → **asansör** (yükselir) →
  **üst katta 4 konveyör** → **asansör** (alçalır) → **4 konveyör** (zemin).
- Yükselme ve alçalma **2 ayrı asansör** olarak modellendi. Tek asansör istersen
  `index.html` içindeki `LINE` tablosundan A2'yi çıkarıp düzenleyebilirsin.

## Adresleri Değiştirme

Tüm adresler `index.html` içindeki **`LINE`** tablosunda. Her eleman:

```js
{ id:'K1', label:'Konveyör 1', type:'conveyor', motor:'Q0.0', sensor:'I0.0' }
```

- `motor`  → konveyör/asansör motoru (çıkış, **Q**)
- `sensor` → eleman üzerindeki cisim sensörü (giriş, **I**)
- Kross'ta ayrıca `rotMotor` (döndürme motoru) var.
- Asansörde `sensorBottom` (alt kat) ve `sensorTop` (üst kat) var.

Kendi PLC adreslerini yazman yeterli — sahne ve I/O paneli otomatik güncellenir.

## İki Çalışma Modu

### 1) Simülasyon
Dahili mantık motorları sırayla sürer, ürün hat boyunca akar, sensörler cismin geçişinde yanar.
PLC olmadan hattı göstermek/eğitim için.

### 2) Canlı (PLC)
Üstteki **JSON** kutusuna bir adres verirsin; sayfa 400 ms'de bir şu formatta veri okur:

```json
{ "Q0.0": true, "Q0.2": false, "I0.0": true, "I0.2": false }
```

- **Yeşil LED / etiket** = ilgili motor (Q) çalışıyor.
- **Mavi LED** = ilgili sensör (I) cismi algıladı.
- Ürün, **aktif olan en ileri sensöre** göre takip edilir (gerçek izleme mantığı).

## Gerçek S7-300 Bağlantısı

Tarayıcı doğrudan S7-300 ile konuşamaz; araya küçük bir **köprü** koyman gerekir.
Köprü, PLC'den okuduğu bit'leri yukarıdaki JSON formatında yayınlar:

- **Node-RED** + `node-red-contrib-s7` → bir HTTP endpoint (`/plc.json`) yayınla.
- **Python** + `python-snap7` → adresleri oku, JSON dosyası/servisi üret.
- **OPC-UA** sunucusu (S7-300 CP modülü) → OPC-UA → JSON köprüsü.

JSON'u CORS izinli sunacak şekilde ayarla, adresini **Canlı** moddaki kutuya yaz, **Bağlan**.

`plc.json` dosyası örnek formatı gösterir.
