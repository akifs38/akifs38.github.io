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

## Hat Düzenleyici (sayfadan konveyör ekleme)

Üstteki **✚ Düzenle** butonuyla soldaki **Hat Düzenleyici** açılır:

- **Yeni konveyör boyu (m):** ölçüyü gir → **+ Konveyör Ekle**. Yeni konveyör
  hattın sonuna eklenir; 3B'de o boyda çizilir.
- **I/O adresleri S7 sırasıyla otomatik atanır:** `Q0.0→Q0.1…→Q0.7→Q1.0…`
  (motor/çıkış) ve aynı şekilde `I0.0→…` (sensör/giriş). Yani her yeni konveyöre
  sıradaki boş adres verilir.
- Her satırdaki **boy kutusundan** o konveyörün ölçüsünü sonradan değiştirebilir, **✕**
  ile silebilirsin. **+ Kross** ve **+ Asansör ↑/↓** ile köşe/dik transfer de eklenir.
- **Varsayılan Hat** düğmesi baştaki 4 konveyör + kross + asansör düzenine döner;
  **Hattı Temizle** sıfırdan kurmak için hepsini siler.
- Kurduğun hat **tarayıcıya kaydedilir** (localStorage), sayfayı yenileyince korunur.

## Adresleri / hattı kodla değiştirme

Varsayılan hat `index.html` içindeki **`DEFAULT_LINE`** tablosunda:

```js
{ id:'K1', type:'conveyor', len:2 }   // len = boy (metre); adres otomatik
```

- Eleman tipleri: `conveyor` · `cross` · `elevator` (`dir:'up'|'down'`).
- Adres yazmazsan **S7 sırasıyla** otomatik atanır; sabitlemek istersen elle
  `motor:'Q0.0'`, `sensor:'I0.0'` ekleyebilirsin (kross'ta `rotMotor`, asansörde
  `sensorTop`/`sensorBottom`).
- `SCALE` sabiti 1 metrenin kaç sahne birimi olduğunu belirler.

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
