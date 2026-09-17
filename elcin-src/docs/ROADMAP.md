# Elçin — Yol haritası

| # | Faz | Durum |
|---|-----|-------|
| 1 | Web UI deneyimi | ✅ Tamam |
| 2 | Backend + Database | ⏳ Sırada |
| 3 | Authentication | ⏳ |
| 4 | Chat + gerçek AI | ⏳ |
| 5 | Hafıza kalıcılığı | ⏳ |
| 6 | ESP32 OLED yüz | ✅ Tamam |
| 7 | Dokunma | ✅ Tamam |
| 8 | WebSocket | ✅ Tamam (cihaz ucu) |
| 9 | Web ↔ ESP32 senkron | ⏳ |
| 10 | Geliştirici paneli (cihaz bağlı) | ⏳ |
| 11 | Özel mesajlar | ⏳ |
| 12 | Takvim bildirimleri | ⏳ |
| 13 | Bildirim sistemi | ⏳ |
| 14 | OTA | ✅ Cihaz ucu tamam (sunucu ucu PHASE 2) |
| 15 | Ses (STT/TTS) | ⏳ |
| 16 | 3D avatar | ⏳ |

---

## PHASE 1 — ne yapıldı

**Ekranlar (9):** Ana sayfa, Sohbet, Hafıza, Duygular, Takvim, Sürprizler,
Cihaz, Ayarlar, Geliştirici.

**Motorlar:**
- Demo AI motoru (niyet öncelikli, uzunluk uyumlu, Türkçe)
- Mood engine (kural tabanlı çıkarım + harmanlama)
- Hafıza motoru (çıkarım, tekilleştirme, getirme, arama)
- Cihaz simülatörü (durum makinesi + heartbeat + dokunma tanıyıcı)

**Testler:** 112 test — dokunma debounce, durum geçişleri, hafıza çıkarımı,
ruh hali, cevap ayrıştırma, WebSocket olay okuma, yüz geometrisi, demo motoru.

**Bilerek yapılmayanlar:**
- Gerçek authentication (rol değişimi şimdilik yerel bir anahtar; PHASE 3)
- Veri sunucuda saklanmıyor (tarayıcıda; PHASE 2)
- Ses ve 3D (mimari hazır, uygulama sonraki fazlarda)

---

## PHASE 6–8 — ne yapıldı

**Firmware (ESP32-C3):** OLED yüz motoru (10 ifade, 12 animasyon), dokunma
tanıyıcı, Türkçe font, açılış sekansı, durum makinesi, WebSocket istemcisi,
heartbeat, çevrimdışı mod, eşleşme ekranı, OTA ve geri alma.

**Testler:** 296 test masaüstünde koşuyor — dokunma debounce'u, durum
geçişleri, protokol ayrıştırma, OTA kararları, yüz geometrisi, UTF-8 ve font.
Ayrıca `make render` bütün ifadeleri PNG olarak döküyor.

**Sözleşme denetimi:** `tools/check_contract.py` cihazın ve web'in aynı
kelimeleri kullandığını doğruluyor (mood, animation, state, touch).

**Bilerek yapılmayanlar:**
- Firmware hedef için derlenmedi (bu ortamda ESP32 araç zinciri indirilemedi);
  taşınabilir çekirdek g++ ile derlenip test edildi, donanım katmanı gözden
  geçirildi ama derlenmedi.
- Sunucu ucu OTA ve eşleşme uçları PHASE 2'ye bağlı.
- Ses ve 3D (mimari hazır).

---

## PHASE 2 için hazır olanlar

- `types/index.ts` — frontend ↔ backend ortak sözleşme yazılı
- `CloudAIProvider` — `VITE_API_URL` verilince devreye girer
- `LiveDeviceTransport` — `VITE_WS_URL` verilince devreye girer
- Beklenen uçlar ve tablolar: `docs/ARCHITECTURE.md` §11

Backend geldiğinde arayüz kodunda değişmesi gereken yer yok; yalnızca ortam
değişkenleri tanımlanacak.
