# Elçin — Mimari

Bu belge sistemin bütününü ve parçalar arası sözleşmeleri anlatır. PHASE 1'de
yalnızca web parçası yazıldı; ama sözleşmeler baştan sabitlendiği için backend
ve firmware eklendiğinde arayüz kodunun değişmesi gerekmiyor.

---

## 1. Genel görünüm

```
   Gülçin                                        Mehmet Akif
     │                                                │
     ▼                                                ▼
┌─────────────────────────────────────────────────────────────┐
│                        WEB APP (React)                      │
│  sohbet · hafıza · duygular · takvim · sürprizler · cihaz   │
└───────────────┬───────────────────────────┬─────────────────┘
                │ REST                      │ WebSocket
                ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      CLOUD (PHASE 2+)                       │
│   auth · AI · hafıza · mood · cihaz kayıt · bildirim · OTA  │
└───────────────┬───────────────────────────┬─────────────────┘
                │ PostgreSQL                │ WebSocket
                ▼                           ▼
         ┌────────────┐              ┌──────────────┐
         │  Database  │              │  ESP32-C3    │
         └────────────┘              │  OLED+Touch  │
                                     └──────────────┘
```

---

## 2. Katmanlar ve sorumlulukları

| Katman | Sorumluluk | Bilmediği şey |
|--------|-----------|----------------|
| `pages/` | Ekranlar, düzen | Verinin nereden geldiği |
| `stores/` | Uygulama durumu, akışlar | HTTP/WebSocket ayrıntısı |
| `services/ai/` | Cevap üretimi | Hangi model olduğu (soyutlama) |
| `services/device/` | Cihaz olayları | Simülatör mü gerçek mi |
| `types/` | Ortak sözleşme | — |
| `config/` | Tüm sabitler | — |

**Kural:** Bir bileşen doğrudan `fetch` çağırmaz. Her dış dünya erişimi bir
servis soyutlamasının arkasındadır.

---

## 3. AI katmanı

```
Kullanıcı mesajı
      ↓
Bağlam kurucu        (personality.ts — kişilik + hatırlananlar + özel gün)
      ↓
Hafıza getirme       (memoryEngine.retrieveMemories)
      ↓
AIProvider.respond() ← soyutlama
      ↓
Cevap ayrıştırma     (şema doğrulama, güvenli varsayılanlar)
      ↓
Hafıza güncelleme    (memoryActions)
      ↓
Cihaz komutu         (deviceAction)
```

### Sağlayıcı soyutlaması

```
AIProvider (arayüz)
├── MockAIProvider    — kural tabanlı demo motoru, ücretsiz
└── CloudAIProvider   — kendi backend'imize konuşur
```

Model seçimi hiçbir yere gömülü değildir. Yeni bir sağlayıcı eklemek
`AIProvider` arayüzünü uygulayan bir sınıf yazmaktır.

> **Güvenlik:** `CloudAIProvider` model anahtarı taşımaz ve taşıyamaz.
> Tarayıcıya inen her şey okunabilir. Anahtar yalnızca backend'de durur;
> tarayıcı yalnızca kendi oturumunu taşır.

### Cevap şeması

Genişletilebilir tutuldu: bilinmeyen alanlar yok sayılır, eksik alanlar makul
varsayılana düşer. Zorunlu olan tek alan `message`.

```json
{
  "message": "Merhaba Gülçin 🌸",
  "mood": "happy",
  "animation": "smile",
  "device_action": { "command": "animation", "animation": "smile" },
  "memory_action": [
    { "type": "preference", "content": "Kahve seviyor.", "importance": 0.8 }
  ],
  "used_memory_ids": ["mem_kahve"]
}
```

Model bozuk JSON döndürdüğünde kullanıcı yığın izi değil, Elçin'in bir cümlesini
görür (`parseResponse` + `ErrorBoundary`).

---

## 4. Hafıza

Beş tür: `preference`, `fact`, `event`, `relationship`, `short_term`.

**Çıkarım.** Her cümle hatırlanmaz. Desenler *sadeleştirilmiş* metinde (Türkçe
harfler ASCII'ye indirgenmiş) aranır, ama kayıt **ham metinden** kesilir —
`fold()` birebir karakter eşlemesi olduğu için konumlar örtüşür. Böylece
eşleştirme sağlam, kayıt Türkçe olur ("müziği", "muzig" değil).

Yakalanan ifade `tidyPhrase` ile çekirdeğine indirilir: son bağlaçtan sonrası
alınır, baştaki dolgu kelimeleri atılır, en fazla dört kelime kalır.

> "bugün biraz yorgunum **ama kahveyi** çok seviyorum"
> → `Gülçin kahveyi seviyor.`

**Getirme.** Puan = kelime örtüşmesi + önem + tazelik. Alakasız kayıt bağlama
girmez; yalnızca çok önemli kayıtlar (≥0.85) her zaman taşınır.

**Kullanıcı kontrolü.** Hafızanın tamamı görünür, düzenlenebilir, silinebilir ve
dışa aktarılabilir. Kullanıcının kontrol edemediği bir hafıza dostluk değil,
gözetimdir — bu yüzden kontrol isteğe bağlı bir özellik değil, sistemin şartı.

---

## 5. Mood engine

Kural tabanlı çıkarım: anahtar kelime sinyalleri toplanır, en yüksek skor
kazanır. Sinyal yoksa soru cümlesi "meraklı", düz cümle "normal" sayılır.

`blendMood` ani sıçramayı engeller: zayıf bir sinyal, güçlü bir önceki ruh
halini deviremez. Elçin bir anda uçtan uca geçmez.

Bulut modeli ruh halini doğrudan döndürdüğünde bu motor yedek ve doğrulayıcı
olarak kalır (`coerceMood` saçma değeri yakalar).

---

## 6. Cihaz katmanı

### Taşıma soyutlaması

```
DeviceTransport (arayüz)
├── MockDeviceTransport   — simüle ESP32 (durum makinesi + heartbeat + dokunma)
└── LiveDeviceTransport   — gerçek WebSocket, üstel geri çekilme ile yeniden bağlanma
```

Simülatör bilinçli olarak "sahte veri üreten bir stub" değil, küçük bir cihaz
taklidi: kendi durum makinesini işletir, bağlanınca kendini tanıtır, dokunma
kenarlarını gerçek tanıyıcıdan geçirir, boşta kalınca uyur.

### Durum makinesi

```
boot → welcome → idle ⇄ touch
                  ↓ ↑
              thinking → responding
                  ↓
              sleeping / offline / error / pairing
```

Tablo `stateMachine.ts` içinde; aynı tablo firmware'e birebir taşınacak.
Tanımsız geçiş mevcut durumu korur.

### Dokunma tanıyıcı

`TouchRecognizer` bilerek **saf** yazıldı: kendi zamanını okumaz (`now`
dışarıdan verilir), hiçbir zamanlayıcı kurmaz. İki sebebi var:

1. Test edilebilir — saati ilerletmek sadece sayı vermek demek.
2. Aynı mantık ESP32'ye `millis()` ile birebir taşınabilir; `delay()` ile ana
   döngüyü bloke eden bir tasarıma hiç yaklaşılmaz.

Tek dokunuş kararı, çift dokunuş penceresi kapandıktan sonra verilir — tek ile
çift ancak beklenerek ayrılır.

### Protokol

Cihaz → bulut → tarayıcı:

```json
{ "type": "device_event", "event": "touch", "touch": "double_tap" }
{ "type": "device_event", "event": "heartbeat", "status": { "...": "..." } }
```

Tarayıcı → bulut → cihaz:

```json
{ "type": "device_command", "command": "animation", "animation": "laugh" }
```

Bozuk veya tanınmayan mesaj sessizce düşer; kötü bir paket kullanıcının
ekranına hata basmaz.

---

## 7. Gerçek zamanlı senkron

```
Gülçin cihaza dokundu          Web'den "Gül" butonuna basıldı
        ↓                                ↓
      ESP32                            Backend
        ↓                                ↓
     WebSocket                        WebSocket
        ↓                                ↓
      Backend                          ESP32
        ↓                                ↓
     Tarayıcı                           OLED
        ↓                                ↓
   Avatar gülüyor                        😂
```

Web'deki Elçin ile OLED'deki Elçin tek bir ruh hali kaynağından (`elcinStore`)
beslenir. İki tarafın senkron görünmesi ağ gecikmesine takılmasın diye, web
avatarı komutu gönderirken anında tepki verir.

---

## 8. Avatar ve 3D'ye hazırlık

Yüz bir resim değil, yaşayan bir SVG. Geometri (`faceGeometry.ts`) bileşenden
ayrı tutuldu: göz/ağız şekilleri saf sayılar olarak tanımlı, oranlar kasıtlı
olarak basit — aynı değerler 128×64'lük OLED yüz motoruna çevrilebilsin diye.

`ElcinAvatar` dışarıya yalnızca `mood` ve `animation` alır. İleride aynı
sözleşmeyi uygulayan bir React Three Fiber sahnesi buraya takıldığında çağıran
taraf hiç değişmez.

**Dikkat:** framer-motion'da `y` bir *dönüşümdür* (translateY), SVG'nin `y`
özniteliği değil. Göz kutuları bu yüzden düz `<rect>` ile çizilir; yumuşatma
CSS geçişine bırakılır.

---

## 9. Durum yönetimi

zustand + `persist`. Tüm anahtarlar `elcin.v1.` önekiyle yazılır.

> **Tuzak:** zustand v5'te seçici her çağrıda yeni bir dizi döndürürse
> `useSyncExternalStore` sonsuz döngüye girer (React #185). Türetilmiş listeler
> bu yüzden seçicinin dışında, `useMemo` ile hesaplanır:
> `useUpcoming`, `useVisibleMemories`, `useVisibleActivities`,
> `useActiveMessages`, `useUnreadDeveloperMessages`.

Depolama erişilemezse (gizli sekme, kota dolu) uygulama bellekte çalışmaya
devam eder — her okuma/yazma `try/catch` içinde.

---

## 10. Hata deneyimi

Kullanıcı teknik hata görmez.

| Yanlış | Doğru |
|--------|-------|
| `WebSocketException: ECONNRESET` | "Elçin şu an bağlantısını kaybetti. Tekrar bağlanmayı deniyorum…" |

`ErrorBoundary` beklenmeyen çökmede Elçin'in üzgün yüzünü gösterir; yığın izi
yalnızca konsola yazılır. Geliştirici paneli ham günlükleri gösterir.

---

## 11. Backend sözleşmesi (PHASE 2)

Frontend'in beklediği uçlar:

```
POST   /api/chat                     → AIResponse şeması
GET    /api/conversations
GET    /api/memories
POST   /api/memories
DELETE /api/memories/:id
GET    /api/devices
GET    /api/devices/:id/status
POST   /api/devices/:id/command
GET    /api/activities
GET    /api/events
POST   /api/developer/messages
GET    /api/firmware
POST   /api/firmware
WS     /ws?device=<id>
```

Tablolar: `users`, `devices`, `conversations`, `messages`, `memories`, `moods`,
`activities`, `events`, `surprises`, `developer_messages`, `firmware_versions`,
`device_logs`, `settings`.

Çok cihaz baştan tasarlandı: `DeviceStatus.deviceId` her olayda taşınır, hiçbir
yerde tek cihaz varsayımı yoktur.
