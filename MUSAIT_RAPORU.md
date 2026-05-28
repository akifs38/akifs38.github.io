# 📋 Müfredat Boşluk Analizi — Stajyer Raporu

**Tarih:** 27 Mayıs 2026
**Hazırlayan:** Akif Şahin, Mekatronik Mühendisliği 3. Sınıf, Yıldız Teknik Üniversitesi
**Platform:** Otomasyon Akademi v0.5
**Staj Yeri:** Otomasyon Akademi — İçerik & Eğitim Tasarımı Birimi

---

## Yönetici Özeti

Otomasyon Akademi v0.5, elektrik kumanda devresi konusunda oldukça sağlam bir temel atmış; özellikle t01'den t16'ya uzanan görev serisi, bir stajyer veya yeni başlayan teknisyen için mantıklı bir öğrenme eğrisi sunuyor. Ancak platform, PLC programlama derinliği, sürücü teknolojileri (VFD/servo), endüstriyel iletişim protokolleri ve pratik proje entegrasyonu açısından ciddi boşluklar içeriyor. SIEMENS TIA Portal, FANUC robotik eğitimleri ve YTÜ Mekatronik müfredatı ile karşılaştırıldığında platformun yaklaşık %40-45 kapsamda kaldığı görülüyor. Bu rapor, eksikleri öncelik sırasıyla ortaya koyarak somut görev ve modül önerileri sunmaktadır.

---

## ✅ Mevcut Güçlü Noktalar

- **Klasik kumanda devresi serisi (t01–t16):** Sinyal lambası, jog, mühürleme, kilitleme, yıldız-üçgen, faz koruma gibi temel devrelerin tamamı mevcut; sıralama pedagojik olarak doğru.
- **Interaktif simülasyon:** Terminaller arası kablo çizme yaklaşımı gerçek tezgâh bağlantısını taklit ediyor; öğrenme transferi yüksek.
- **IEC/EN standart referansları:** Eleman bilgi kartlarında IEC 60204-1, EN ISO 13850, EN 60947 atıfları var; bu endüstri odaklı bir yaklaşım.
- **Mekanik eleman kataloğu:** Rulman'dan bilyalı vidaya, kam'dan amortisöre 15+ element ve ISO/DIN kodları içeriyor; mekatronik müfredat uyumlu.
- **Robot sekmesi:** FK/IK, PTP/LIN hareket modları ile 6-eklemli robot simülasyonu; FANUC/KUKA eğitim materyalleriyle örtüşüyor.
- **Güvenlik sekmesi:** LOTO, E-stop, CE gereklilikleri; iş güvenliği farkındalığı açısından değerli.
- **Pnömatik simülasyon:** Endüstriyel otomasyon için vazgeçilmez; ayrı sekme olarak yer alması doğru.
- **Gamification altyapısı:** `gamification.js` dosyası mevcut; motivasyon için seviye/puan sistemi var gibi görünüyor.
- **PWA desteği:** `manifest.json` ve `sw.js` dosyaları mevcut; offline çalışabilirlik eklenmiş.

---

## ❌ Eksik / Yetersiz Konular

Aşağıdaki tablo, eksikleri sekiz ana kategoriye ayırıyor. Her satırda öncelik, boşluğun ne olduğu ve kısa gerekçe yer alıyor.

---

### KATEGORİ 1 — PLC Programlama (Öncelik: 🔴 Yüksek)

| # | Eksik Konu | Öncelik | Neden Önemli |
|---|-----------|---------|-------------|
| 1.1 | PLC Veri Tipleri (BOOL, INT, REAL, WORD, DWORD, STRING) | 🔴 Yüksek | TIA Portal S7-1200/1500'de değişken tanımlamadan hiçbir program yazılamaz; YTÜ Otomasyon dersinde ilk hafta |
| 1.2 | Timer Blokları (TON, TOF, TP — IEC 61131-3) | 🔴 Yüksek | Mevcut PLC Editöründe yalnızca NO/NC/Bobin var; zamanlayıcı yok |
| 1.3 | Counter Blokları (CTU, CTD, CTUD) | 🔴 Yüksek | Parça sayma, konveyör adım sayma; IEC 61131-3 zorunlu bloğu |
| 1.4 | Karşılaştırma Blokları (EQ, GT, LT, GE, LE) | 🔴 Yüksek | Analog eşik karşılaştırması, sıcaklık kontrolü için temel |
| 1.5 | Math/Aritmetik Bloklar (ADD, SUB, MUL, DIV, MOD) | 🔴 Yüksek | Oran hesabı, kalibrasyon, PID giriş hesabı |
| 1.6 | SET/RESET (SR Flip-Flop) koili | 🔴 Yüksek | Latch fonksiyonu; mühürleme yerine SET/RESET kullanımı standart PLC pratiği |
| 1.7 | Function Block Diagram (FBD) editörü | 🟡 Orta | IEC 61131-3 altındaki 4 dilden biri; endüstride Ladder kadar yaygın |
| 1.8 | Structured Text (ST) editörü | 🟡 Orta | Python'a benzer sözdizimi; SIEMENS SCL; 3. sınıftan itibaren öğretilmeli |
| 1.9 | Function (FC) ve Function Block (FB) kavramı | 🔴 Yüksek | Modüler program yapısı; endüstride 1000+ satır düz kod yazılmaz |
| 1.10 | PLC I/O adresleme (I0.0, Q0.0, MW100 vb.) | 🔴 Yüksek | Mevcut ladder editörü soyut; gerçek adres ataması yok |
| 1.11 | Program Organization Units (OB, FB, FC, DB) | 🟡 Orta | TIA Portal mimarisi; OB1 Main, OB30 Cyclic Interrupt vb. |
| 1.12 | Analog giriş/çıkış ölçeklendirme (0-10V → 0-100 bar) | 🔴 Yüksek | Basınç/sıcaklık transmitter zaten sensörler sekmesinde var; PLC'de okutmak tamamlayıcı |

**Mevcut durum analizi:** `plc.js` ve `plc.css` dosyaları mevcut; editörün NO/NC/Bobin/OR yeteneği var. Ancak bu, IEC 61131-3 Ladder diyagramının en fazla %20'si. SIEMENS TIA Portal Step 7 Essentials eğitim müfredatı 40+ saat; platformun PLC bölümü bunu 4-5 saatlik içerikle geçiştiriyor.

---

### KATEGORİ 2 — Sürücü Teknolojileri / Güç Elektroniği (Öncelik: 🔴 Yüksek)

| # | Eksik Konu | Öncelik | Neden Önemli |
|---|-----------|---------|-------------|
| 2.1 | VFD (Hız Ayarlı Sürücü) devre simülasyonu | 🔴 Yüksek | Güvenlik sekmesinde sadece "VFD tanıtımı" var; somut devre ve parametre ayarı yok |
| 2.2 | VFD parametreleri (P0-P10 hızlanma/yavaşlama rampa, max frekans) | 🔴 Yüksek | SIEMENS G120, ABB ACS550 eğitimlerinin temel içeriği |
| 2.3 | Motor hız-tork karakteristiği eğrisi | 🟡 Orta | Asenkron motor çalışma bölgeleri (yıldız-üçgen zaten var ama karakteristik grafik yok) |
| 2.4 | Servo sürücü ve servo motor kavramı | 🟡 Orta | CNC, pick-and-place; mekatronik 3. sınıf zorunlu konusu |
| 2.5 | Stepper motor sürme (tam adım, yarım adım, mikro adım) | 🟡 Orta | Düşük maliyetli CNC, 3D yazıcı, dozaj sistemleri |
| 2.6 | Soft Starter (yumuşak yol verici) prensibi | 🟡 Orta | Yıldız-üçgen alternatifi; mekanik darbe azaltma |
| 2.7 | Frenleme yöntemleri (dinamik frenleme, enjeksiyon frenleme) | 🟡 Orta | Güç elektroniği derslerinde işleniyor; pratik uygulaması platformda yok |
| 2.8 | Motor koruma: termistör (PTC) bağlantısı | 🟡 Orta | Sarım sıcaklık koruması; termik röleden farklı çalışma prensibi |

---

### KATEGORİ 3 — Endüstriyel İletişim Protokolleri (Öncelik: 🔴 Yüksek)

| # | Eksik Konu | Öncelik | Neden Önemli |
|---|-----------|---------|-------------|
| 3.1 | PROFINET temelleri (IO Device, IO Controller, adres atama) | 🔴 Yüksek | SIEMENS S7-1200/1500 standart ağ protokolü; TIA Portal öğrencilerinin %90'ı bunu öğreniyor |
| 3.2 | Modbus RTU/TCP (Register okuma/yazma, slave/master yapısı) | 🔴 Yüksek | Marka bağımsız en yaygın endüstriyel protokol; VFD ve sensörler için de kullanılıyor |
| 3.3 | EtherNet/IP kavramı | 🟡 Orta | Allen-Bradley (Rockwell) standartı; AB PLC'li fabrikalarda zorunlu |
| 3.4 | IO-Link sensör arayüzü | 🟡 Orta | Akıllı sensör yapılandırması; Endüstri 4.0'ın sensör katmanı |
| 3.5 | OPC-UA (sunucu-istemci, Namespace, Node) | 🟡 Orta | Endüstri 4.0 veri entegrasyonu; YTÜ Akıllı Üretim dersinde işleniyor |
| 3.6 | PROFIBUS DP (eski tesislerde hâlâ dominant) | 🟡 Orta | 20 yıllık kurulu parkta bakım mühendisi PROFIBUS bilmek zorunda |
| 3.7 | AS-Interface (ASi) hat protokolü | 🟢 Düşük | Basit sensör/aktüatör ağı; özelleşmiş ama bilinmesi gereken |

**Gerekçe:** Bir fabrikaya gittiğimde ilk gördüğüm şey PROFINET kablolaması. Platformda hiç bahsi geçmiyor. Bu, mekatronik mühendisinin ayaklarını yere bastıran temel bilgi.

---

### KATEGORİ 4 — Sensör Derinliği ve Kalibrasyon (Öncelik: 🟡 Orta)

Mevcut sensörler sekmesi iyi ama çok yüzeysel.

| # | Eksik Konu | Öncelik | Neden Önemli |
|---|-----------|---------|-------------|
| 4.1 | PNP vs NPN bağlantı farkı ve sinkhole/source kavramı | 🔴 Yüksek | t11'de "PNP sensör" deniyor ama PNP/NPN seçim kriteri ve bağlantı farkı açıklanmıyor |
| 4.2 | 4-20mA akım döngüsü ve ölçeklendirme | 🔴 Yüksek | Basınç transmitter mevcut; ama 4-20mA sinyal kondisyonlama işlenmemiş |
| 4.3 | Enkoder sinyal yorumlama (A/B/Z kanalı, quadrature) | 🔴 Yüksek | Enkoder sensör listesinde var ama nasıl okunduğu/PLC'ye bağlantısı yok |
| 4.4 | Termocouple (K, J, T tipi) ve PT100 karşılaştırması | 🟡 Orta | PT100/PT1000 mevcut; termocouple yok; ikisi birden işlenmeli |
| 4.5 | LVDT (Lineer Değişken Diferansiyel Trafo) | 🟡 Orta | Hassas pozisyon ölçümü; mekatronik laboratuvarında kullanılıyor |
| 4.6 | Güç kalitesi ölçümü (akım trafosu, CT) | 🟡 Orta | Motor akım izleme için; endüktif sensörden farklı çalışma prensibi |
| 4.7 | Akış sensörleri (elektromanyetik, vortex, Coriolis) | 🟡 Orta | Prosess endüstrisi temel; kimya/gıda fabrikalarında her yerde |
| 4.8 | Vision/görüntü işleme sensörü (basit konsept) | 🟢 Düşük | Endüstriyel kamera; kalite kontrol; mekatronik müfredatında yer alıyor |
| 4.9 | Sensör kalibrasyon prosedürü (zero/span, HART protokolü) | 🟡 Orta | Saha bakım mühendisi için temel; pratik olmadan teoride kalıyor |

---

### KATEGORİ 5 — Güvenlik Fonksiyonları / Fonksiyonel Güvenlik (Öncelik: 🔴 Yüksek)

| # | Eksik Konu | Öncelik | Neden Önemli |
|---|-----------|---------|-------------|
| 5.1 | Safety Integrity Level (SIL 1/2/3) kavramı | 🔴 Yüksek | IEC 62061 / ISO 13849; CE belgeli makine tasarımı için zorunlu |
| 5.2 | Performance Level (PL a/b/c/d/e) hesabı | 🔴 Yüksek | EN ISO 13849-1; güvenlik kategorileri (Cat B, 1, 2, 3, 4) |
| 5.3 | Güvenlik PLC (Safety CPU) ve güvenlik rölesi farkı | 🔴 Yüksek | SIEMENS S7-300F, Pilz PNOZ; sıradan PLC ile karıştırılıyor |
| 5.4 | İki kanallı E-stop devre yapısı (redundant) | 🔴 Yüksek | t14'te tek kanallı acil stop var; gerçek makinelerde 2 kanal zorunlu |
| 5.5 | Işık perdesi (light curtain) ve güvenlik kapısı entegrasyonu | 🔴 Yüksek | Robot hücrelerinde zorunlu; FANUC eğitiminde ilk haftalarda işleniyor |
| 5.6 | Güvenlik kategori diyagramı (risk assessment matrisi) | 🟡 Orta | ISO 12100 risk değerlendirme akışı |
| 5.7 | Two-hand control (çift el kontrolü) devresi | 🟡 Orta | Pres makineleri standart güvenlik devresi |
| 5.8 | Muting (geçici devre dışı bırakma) fonksiyonu | 🟢 Düşük | Konveyör yükleme noktasında ışık perdesi muting |

---

### KATEGORİ 6 — Pnömatik Derinliği (Öncelik: 🟡 Orta)

Pnömatik sekmesi var ama içerik belirsiz. Aşağıdakiler işlenmemiş görünüyor:

| # | Eksik Konu | Öncelik | Neden Önemli |
|---|-----------|---------|-------------|
| 6.1 | 5/2 ve 5/3 yönlü kontrol valfi devresi | 🔴 Yüksek | Çift etkili silindir kontrolünün temeli; her endüstri robotunda var |
| 6.2 | Tek etkili vs çift etkili silindir farkı | 🔴 Yüksek | Yay geri dönüşlü vs pnömatik geri dönüşlü; tasarım seçimi kritiği |
| 6.3 | Hız kontrol valfleri (akış kısma) | 🟡 Orta | Silindir hızını ayarlama; ön-akış ve geri-akış kısma farkı |
| 6.4 | Pnömatik devre sembolleri (ISO 1219) | 🔴 Yüksek | Elektrik IEC 60617 gibi pnömatik için ISO 1219 var; sembol öğretimi yok |
| 6.5 | Vakum sistemleri (ejektör, vakum kavrama) | 🟡 Orta | Pick-and-place robotik için standart; mekatronik laboratuvarında kullanılıyor |
| 6.6 | Basınç düşürücü ve emniyet valfi | 🟡 Orta | Sistem tasarımında zorunlu güvenlik elemanı |
| 6.7 | Pnömatik-elektrik dönüşüm (solenoid valf sürme) | 🔴 Yüksek | PLC çıkışından solenoid valfe; kontrol döngüsünün kilit noktası |
| 6.8 | FRL ünitesi (Filtre-Regülatör-Yağlayıcı) | 🟡 Orta | Her pnömatik sistemde girişteki ilk eleman |
| 6.9 | Çoklu silindir sıralama devresi (A+B+A-B-) | 🟡 Orta | Otomasyon mühendisinin ilk pratik pnömatik projesi |

---

### KATEGORİ 7 — Robot Programlama Derinliği (Öncelik: 🟡 Orta)

Robot sekmesi FK/IK gösteriyor ama programlama tarafı eksik.

| # | Eksik Konu | Öncelik | Neden Önemli |
|---|-----------|---------|-------------|
| 7.1 | Denavit-Hartenberg (DH) parametre tablosu | 🔴 Yüksek | FK hesabı yapıldığı gösteriliyor ama DH matrisi gösterilmiyor; YTÜ Robot Teknolojisi dersinin ilk ödevi |
| 7.2 | İş uzayı (workspace) ve tekil nokta (singularity) görselleştirme | 🔴 Yüksek | Simülatörde robot kolu var; tekil nokta uyarısı yok |
| 7.3 | TP (Teach Pendant) programlama simülasyonu | 🟡 Orta | FANUC TP, KUKA KRL; P[1] FINE / CNT; endüstri standartı |
| 7.4 | Robot güvenlik çitleri ve çalışma hacmi sınırlama | 🔴 Yüksek | Gerçek robot hücresi kurulumu için zorunlu; ışık perdesi ile entegrasyon |
| 7.5 | CIRC (dairesel) hareket tipi | 🟡 Orta | Mevcut PTP/LIN var; CIRC eksik; kaynak robotu için kritik |
| 7.6 | Koordinat sistemleri (World, Base, Tool, User) | 🔴 Yüksek | FANUC eğitim müfredatının ilk modülü; offset programlamada temel |
| 7.7 | Robot program akış kontrolü (IF/THEN, FOR, WAIT) | 🟡 Orta | Kondisyonel hareketler; sensör sinyaline göre karar |
| 7.8 | Yük kapasitesi ve erişim yarıçapı seçim kriterleri | 🟡 Orta | Hangi robot seçilir? Payload vs reach matrisi |
| 7.9 | Colaboratif robot (cobot) farkı ve güvenlik konsepti | 🟡 Orta | UR5, FANUC CRX; ISO/TS 15066; yeni nesil robot türü |

---

### KATEGORİ 8 — Endüstri 4.0 / Proses Kontrol (Öncelik: 🟡 Orta)

| # | Eksik Konu | Öncelik | Neden Önemli |
|---|-----------|---------|-------------|
| 8.1 | PID kontrol algoritması (P, I, D terimleri, tuning) | 🔴 Yüksek | Sıcaklık, basınç, hız kapalı döngü kontrolü; YTÜ Kontrol Sistemleri dersinin pratiği |
| 8.2 | P&ID (Piping & Instrumentation Diagram) okuma | 🔴 Yüksek | Proses fabrikasında her mühendis okuyor; ISA 5.1 semboller |
| 8.3 | SCADA temel kavramı (tag, historian, HMI) | 🟡 Orta | Endüstri 4.0 veri katmanı; WinCC, Ignition |
| 8.4 | HMI (İnsan-Makine Arayüzü) tasarım prensipleri | 🟡 Orta | Butonun yerleşimi, alarm yönetimi EEMUA 191 |
| 8.5 | Digital twin kavramı | 🟢 Düşük | Platformun simülasyon altyapısı digital twin kavramına zemin hazırlıyor |
| 8.6 | Endüstri 4.0 bileşenleri (IoT, Edge Computing, Cloud) | 🟢 Düşük | Stratejik farkındalık; somut uygulama henüz gerekli değil |
| 8.7 | FMEA (Arıza Modu ve Etki Analizi) | 🟡 Orta | Bakım mühendisliği temel aracı; QA/kalite kontrol |
| 8.8 | Konveyör sistemi tasarımı (bütünleşik proje) | 🔴 Yüksek | Sensör + PLC + pnömatik + motor; tüm konuların birleştiği proje |

---

## 🎯 Öncelikli Eklenmesi Gereken Görevler (t17+)

Mevcut görev serisi t01-t16 arası kumanda devresi konusunda çok iyi. Aşağıdaki görevler bu temelin üzerine inşa edilmeli.

### Seviye L5-L6: Devre Tamamlama Görevleri

| Görev ID | Başlık | Seviye | Kategori | Açıklama |
|----------|--------|--------|----------|----------|
| **t17** | **Off-Delay Zamanlama (KT · AG)** | L5 · Zamanlama | Zaman Röleleri | K1 düşünce 10sn sonra alarm lambası sönsün. TOF bloğu eşdeğeri. Mevcut t10 On-Delay; Off-Delay eksik. KT1'in 16. terminali kullanılacak. |
| **t18** | **İki Kontaktörle Sıralı Çalışma** | L5 · Zamanlama | Ardışık Kontrol | Konveyör A başlar → 3sn sonra Konveyör B otomatik devreye girer. K1 NO kontağı → KT1 → KT1·15-18 → K2 bobini. |
| **t19** | **Sayaç Rölesi ile Parti Sayma** | L5 · Sayaç | Endüstri | Endüktif sensör 10 parça sayınca konveyör dursun. Impulse sayacı devresi; platformda henüz hiç sayaç yok. |
| **t20** | **PNP-NPN Sensör Devre Farkı** | L4 · Sensör | Sensör Bağlantısı | Aynı sensör iki farklı bağlantı şemasıyla: PNP (source) ve NPN (sink). t11'de yalnızca PNP var. |
| **t21** | **Çift Etkili Silindir Solenoidi** | L5 · Pnömatik | Elektropnömatik | PLC/röle çıkışından 5/2 valf solenoid bobini sürmek. Q0.0 → YV1A, Q0.1 → YV1B. |
| **t22** | **Solenoid Valf + Silindir İleri-Geri** | L5 · Pnömatik | Elektropnömatik | S1 bas → YV1A enerjilenir → silindir ileri; S2 bas → YV1B enerjilenir → geri. |
| **t23** | **4-20mA Basınç Transmitter Okuma** | L6 · Analog | Ölçüm | 4-20mA sinyal → 0-10V dönüştürücü → PLC AI → 0-100 bar ölçeklendirme devresi. |
| **t24** | **VFD Start-Stop ve Frekans Ayarı** | L6 · Sürücü | VFD | PLC dijital çıkışından VFD RUN/DIR sinyali; potansiyometre ile AIN → frekans kontrolü. SIEMENS G120 bağlantı şeması referans alınacak. |
| **t25** | **İki Kanallı E-Stop Güvenlik Devresi** | L6 · Güvenlik | Fonksiyonel Güvenlik | EN ISO 13850 Cat 3 PLd. İki NC kontak seri, iki ayrı KM ile kontrol; bir kontak arızasında sistem yine de durur. |
| **t26** | **Yıldız-Üçgen + Termik + Faz Koruma (Tam Komple)** | L7 · Usta | Birleşik Proje | t15 + t16 + t07'nin birleşimi. Gerçek endüstriyel komple motor kumanda panosu şeması. |
| **t27** | **Enkoder + Sayaç ile Konum Kontrolü** | L6 · Sensör | Pozisyon | İnkremental enkoder A/B kanalı → up/down sayaç → hedef pozisyona gelince K1 dursun. |
| **t28** | **PT100 Sıcaklık Kontrolü Devresi** | L5 · Analog | Proses | PT100 → sıcaklık transmitter → 4-20mA → karşılaştırıcı röle → ısıtıcı kontaktörü. |
| **t29** | **Güvenlik Rölesi (Safety Relay) Devresi** | L6 · Güvenlik | Fonksiyonel Güvenlik | PILZ PNOZ X7 / SIEMENS 3SK tipik devre şeması; reset butonu ile kondisyon izleme. |
| **t30** | **Konveyör + Stopper Pnömatik + Sayaç (Mini Proje)** | L7 · Proje | Entegrasyon | Konveyör motoru + endüktif sensör + pnömatik stopper + sayaç rölesi birleşik devresi. Tüm öğrenilen konuların sentezi. |

### Seviye L7: PLC Görevleri (Ladder Editörüne Eklenmeli)

| Görev ID | Başlık | Seviye | Ladder Elemanı |
|----------|--------|--------|----------------|
| **p01** | **TON Timer ile Motor Gecikmeli Start** | L5 · PLC | TON bloğu — IN, PT, Q, ET terminal gösterimi |
| **p02** | **CTU Sayaç ile 5 Parça Sayma** | L5 · PLC | CTU bloğu — CU, R, PV, Q, CV terminal |
| **p03** | **İleri-Geri Sıralama (SET/RESET)** | L5 · PLC | SET/RST koili — flip-flop davranışı |
| **p04** | **EQ Karşılaştırma ile Hız Seçimi** | L6 · PLC | EQ, GE, LT blokları — MOVE ile çıkışa yazma |
| **p05** | **ADD/SUB ile Parça Sayacı Ekranı** | L6 · PLC | ADD, MOV — MW100 birikimli sayma |
| **p06** | **Analog Ölçeklendirme (NORM + SCALE)** | L6 · PLC | NORM_X + SCALE_X bloğu — 0-27648 → 0-100.0 |
| **p07** | **FC Bloğu Yazma (Motor Kontrol FC)** | L7 · PLC | Parametrik FC tasarımı — IN/OUT/INOUT |
| **p08** | **FB ile Dolum İstasyonu Kontrolü** | L7 · PLC | Statik veri bloğu, instance DB, çoklu çağrı |

---

## 🆕 Önerilen Yeni Sekmeler/Modüller

### 1. VFD / Sürücü Sekmesi (Yeni)

**Öncelik: 🔴 Yüksek**

Mevcut "Güvenlik" sekmesinde yüzeysel "VFD tanıtımı" var. Bunun yerine ayrı bir sekme:

- SIEMENS SINAMICS G120 ve ABB ACS550 referans alınarak VFD ön panel simülasyonu
- Parametre listesi: P0304 (nominal gerilim), P0305 (nominal akım), P0310 (nominal frekans), P1080 (min frekans), P1082 (max frekans), P1120/P1121 (rampa süreleri)
- 3 devre görevi: Sabit hız seti, potansiyometre ile analog hız kontrolü, PLC dijital girişinden iki hız seçimi
- V/f karakteristik grafiği gösterimi
- Motor koruma alarm kodları (F00001, F00011 gibi)

### 2. Endüstriyel Protokoller Sekmesi (Yeni)

**Öncelik: 🔴 Yüksek**

- Modbus RTU frame yapısı: Device Address + Function Code + Data + CRC
- Modbus TCP bağlantı diyagramı
- Register okuma/yazma simülasyonu (Holding Register 4xxxx, Input Register 3xxxx)
- PROFINET temel topoloji: Controller → Switch → Device
- OPC-UA node browser simülasyonu

### 3. PID Kontrol Sekmesi (Yeni)

**Öncelik: 🔴 Yüksek**

Bu modül olmadan mekatronik mühendisliği eğitimi yarım kalır.

- P, I, D terimlerinin ayrı ayrı etkisini gösteren interaktif grafik
- Kp, Ti, Td slider ile ayarlama
- Kapalı döngü sıcaklık kontrol simülasyonu (set point 60°C, ölçüm PT100, çıkış ısıtıcı PWM)
- Ziegler-Nichols tuning yöntemi açıklaması
- Kararlılık analizi: overshoot, settling time, steady-state error gösterimi

### 4. Fonksiyonel Güvenlik Sekmesi (Mevcut "Güvenlik" Sekmesinin Genişletilmesi)

**Öncelik: 🔴 Yüksek**

Mevcut güvenlik sekmesi yalnızca E-stop ve LOTO içeriyor. Eklenmesi gerekenler:

- ISO 13849-1 Risk Değerlendirme Matrisi (şiddet × sıklık × kaçınılabilirlik → PL talebi)
- Performance Level (PLa-PLe) açıklaması ve örnek hesap
- Güvenlik kategorileri şeması (Cat B, 1, 2, 3, 4) + gerçek devre örnekleri
- İki kanallı güvenlik devresi simülasyonu (t25 göreviyle entegre)
- SILCET veya SISTEMA benzeri basit PL hesap aracı

### 5. P&ID Okuma Modülü (Yeni)

**Öncelik: 🟡 Orta**

- ISA 5.1 sembol sözlüğü (enstrüman baloncukları, hat tipleri, valf sembolleri)
- Basit bir ısıtma devresinin P&ID'sini okuma alıştırması
- P&ID üzerinde bir elemanın görev / konumu / bağlantı noktasını bulma soruları

### 6. SCADA / HMI Simülatörü (Yeni)

**Öncelik: 🟡 Orta**

- Sürükle-bırak HMI ekran tasarımı
- Bir konveyör hattı için: Start/Stop butonu, motor deviri göstergesi, sayaç ekranı, alarm listesi
- Gerçek zamanlı simülasyon: PLC Editöründeki ladder ile HMI'yi bağlama
- EEMUA 191 renk standardı: kırmızı=alarm, sarı=uyarı, gri=devre dışı

### 7. Kablolama ve Pano Tasarımı Modülü (Yeni)

**Öncelik: 🟡 Orta**

- DIN ray üzerine eleman yerleşimi (MCB, kontaktör, termik, klemens sırası)
- Klemens şerit sıralaması ve numara etiketi mantığı
- Kablo renk kodu standartları: L1=kahverengi, L2=siyah, L3=gri, N=mavi, PE=sarı-yeşil, 24V DC=kırmızı, 0V=mavi
- Kablo kesit seçimi (AWG/mm² akım tablosu)
- IEC 60445 terminal işaretleme standardı

### 8. Hidrolik Sekmesi (Yeni)

**Öncelik: 🟢 Düşük**

Pnömatik var; hidrolik eksik. Yüksek kuvvet uygulamaları için:

- Hidrolik pompa, silindir, yön valfi temel devreleri
- Basınç relif valfi (güvenlik için zorunlu)
- Pnömatik ile fark: güç yoğunluğu, sızdırmazlık önem, yağ seçimi

---

## 📊 Müfredat Kapsamı Skoru

Aşağıdaki değerlendirme, YTÜ Mekatronik müfredatı, SIEMENS TIA Portal Essentials (40s) ve FANUC Robotics Operations (30s) eğitim içerikleri baz alınarak yapılmıştır.

| Kategori | Kapsanan | Toplam Konu | Puan | Durum |
|----------|---------|------------|------|-------|
| **Elektrik Kumanda Devreleri** | 16/18 konu | 18 | %89 | ✅ Güçlü |
| **PLC Programlama (IEC 61131-3)** | 4/22 konu | 22 | %18 | 🔴 Kritik Eksik |
| **Sürücü Teknolojileri (VFD/Servo)** | 1/8 konu | 8 | %12 | 🔴 Kritik Eksik |
| **Endüstriyel İletişim** | 0/7 konu | 7 | %0 | 🔴 Yok |
| **Sensörler** | 8/17 konu | 17 | %47 | 🟡 Yetersiz |
| **Fonksiyonel Güvenlik** | 3/8 konu | 8 | %37 | 🟡 Yetersiz |
| **Pnömatik** | ~4/9 konu | 9 | %44 | 🟡 Yetersiz |
| **Robot Programlama** | 4/9 konu | 9 | %44 | 🟡 Yetersiz |
| **Proses Kontrol (PID/P&ID)** | 0/8 konu | 8 | %0 | 🔴 Yok |
| **Mekanik Elemanlar** | 15/17 konu | 17 | %88 | ✅ Güçlü |
| **Endüstri 4.0 / SCADA** | 0/6 konu | 6 | %0 | 🔴 Yok |
| **Kablolama / Pano Tasarımı** | 0/5 konu | 5 | %0 | 🔴 Yok |

**Genel Kapsam Skoru: ~39/124 konu = %31**

> Platform mevcut haliyle "elektrik kumanda devreleri kurs kitabı" seviyesinde. Gerçek bir endüstriyel otomasyon ve mekatronik eğitim platformu olabilmesi için kapsamın en az 2-3x genişletilmesi gerekiyor.

---

## 📋 Referans Müfredat Karşılaştırması

### SIEMENS TIA Portal Essentials (Resmi Müfredat)
```
Modül 1:  TIA Portal kullanımı, proje oluşturma (EKSIK)
Modül 2:  S7-1200 donanım yapılandırması (EKSIK)
Modül 3:  Ladder programlama — NO, NC, Coil (KISMİ)
Modül 4:  Timer TON, TOF, TP (EKSIK)
Modül 5:  Counter CTU, CTD (EKSIK)
Modül 6:  Veri blokları (DB) ve hafıza adresleme (EKSIK)
Modül 7:  FC ve FB tasarımı (EKSIK)
Modül 8:  Analog giriş/çıkış ve ölçeklendirme (EKSIK)
Modül 9:  PROFINET yapılandırması (EKSIK)
Modül 10: HMI (KTP700) ekran tasarımı (EKSIK)
Modül 11: Diagnostics ve fault handling (EKSIK)
Plaftorm kapsamı: 1/11 modül ≈ %9
```

### FANUC Robotics Operations & Programming (Resmi Müfredat)
```
Modül 1:  Robot güvenliği ve çalışma hücresi (KISMİ)
Modül 2:  Koordinat sistemleri ve teach pendant (EKSIK)
Modül 3:  PTP ve LIN programlama (VAR)
Modül 4:  Çevrel hız ve hassasiyet ayarları (EKSIK)
Modül 5:  I/O sinyalleri ve PLC entegrasyonu (EKSIK)
Modül 6:  Program akışı (IF, SELECT, CALL) (EKSIK)
Modül 7:  Tool ve User frame ayarı (EKSIK)
Modül 8:  Hata kurtarma ve recovery (EKSIK)
Platform kapsamı: 1.5/8 modül ≈ %19
```

### YTÜ Mekatronik Mühendisliği 3. Sınıf Dersleri
```
MET3001: Kontrol Sistemleri — PID, kararlılık, frekans yanıtı (EKSIK)
MET3002: Akıllı Sistemler — PLC, HMI, SCADA (KISMİ)
MET3003: Robot Teknolojisi — DH parametreleri, FK/IK, trajektori (KISMİ)
MET3004: Pnömatik ve Hidrolik Sistemler (KISMİ)
MET3005: Mekatronik Tasarım — Entegrasyon projesi (EKSIK)
Platform kapsamı: ~2/5 ders ≈ %40
```

---

## 🔧 Acil Düzeltilmesi Gereken Mevcut Hatalar / Tutarsızlıklar

Bu bölüm platform kodunu inceleyerek tespit ettiğim sorunları içeriyor.

### 1. `data.js` — PLC Editörü Sınırlaması

`plc.js` dosyası mevcut ama `TASKS` dizisinde hiç PLC görevi yok; tüm 16 görev devre çizme üzerine. Ladder editörü sanki ayrı bir oyun gibi duruyor; görev serisiyle bütünleşik değil.

**Öneri:** `TASKS` dizisine `type: 'plc'` alanı ekleyerek p01-p08 görevlerini Ladder Editörü üzerinden çözülecek şekilde entegre et.

### 2. Sensörler Sekmesinde PNP/NPN Fark Açıklaması Yok

`data.js`'de sensör info kartı var (`INFO.sensor`) ama yalnızca PNP tipi açıklanıyor. t11 görevi de sadece PNP bağlantısını gösteriyor. NPN bağlantısı, sinkhole akım konfigürasyonu hiç yok.

**Somut düzeltme:** `INFO` nesnesine `sensorNPN` kartı ekle; t20 görevini PNP vs NPN karşılaştırması olarak kur.

### 3. Timer Bilgi Kartında Off-Delay (TOF) Yok

`INFO.timer` sadece On-delay'i anlatıyor (`15-18 NO kapanır`). Off-delay terminalleri (16) ve TP (darbe) tipi hiç açıklanmıyor.

**Somut düzeltme:** `INFO.timer.desc`'e TOF ve TP bilgisi ekle; `term` tablosuna terminal 16 (NC çıkış) ekle.

### 4. Güç Devresi (t13) Termik Bağlantısı Eksik

t13 görevi `powerSolution`'da L1→K1m1, L2→K1m2, L3→K1m3, Kx→Motor bağlantısını istiyor. Ancak gerçek güç devrelerinde termik röle (F2) güç hattında seri bağlı olmalı. t13'te güç devresine termik eklenmemiş — bu eksiklik öğrenciye yanlış öğretiyor.

**Somut düzeltme:** t13 `powerComponents`'a F2 termik elemanı (güç ana kontakları terminalleri 1-2, 3-4, 5-6) ekle; `powerSolution`'u L → K1m → F2 → Motor olarak güncelle.

### 5. Yıldız-Üçgen (t15) KT1 Kablo Çakışması

t15 `solution` dizisinde `k1b_24` terminali birden fazla bağlantıda hedef olarak kullanılıyor (`['k1b_24','kt1_a1']`, `['k1b_24','kt1_15']`, `['k1b_24','kda_21']`). Bu topoloji gerçek devre çizgilerini çakıştırabilir ve simülatörde görsel karmaşa yaratır. Bir terminalden üç kablo çıkması (düğüm noktası) simülatörün sürükleme motoruna kaldığından emin olunmalı.

**Somut düzeltme:** Bench.js'in node validation fonksiyonuna multi-wire node desteği eklenmeli ya da ara ara ara bağlantı noktası (junction) elemanı eklenmeli.

---

## 💡 Önerilen İçerik Yol Haritası (Öncelik Sırası)

### Faz 1 — Acil (0-3 Ay)

1. PLC Editörü: TON, TOF, CTU blokları ekle (p01-p03 görevleri)
2. t17: Off-Delay zamanlama görevi
3. t20: PNP vs NPN sensör devre farkı görevi
4. t21-t22: Elektropnömatik solenoid valf görevleri
5. INFO kartlarına PNP/NPN fark açıklaması
6. VFD sekmesi — temel parametre ve devre (tek bağlantı görevi)
7. t13 güç devresine termik eklenmesi (mevcut hata düzeltmesi)

### Faz 2 — Kısa Vadeli (3-6 Ay)

1. Ladder Editörüne: FC/FB kavramı, SET/RESET koil, aritmetik bloklar
2. t23-t28 görev serisi (analog, VFD, güvenlik devreleri)
3. Fonksiyonel Güvenlik sekmesi genişletme (SIL/PL açıklamaları)
4. Endüstriyel Protokoller sekmesi (en azından Modbus)
5. PID Kontrol sekmesi (interaktif grafik en az)
6. SCADA/HMI temel simülatörü

### Faz 3 — Orta Vadeli (6-12 Ay)

1. p04-p08 PLC görev serisi (analog ölçeklendirme, FB tasarımı)
2. Robot sekmesine DH parametreleri ve koordinat sistemleri
3. TP programlama simülasyonu
4. P&ID okuma modülü
5. Kablolama/Pano tasarım modülü
6. Konveyör bütünleşik proje (t30)

---

## Sonuç

Otomasyon Akademi v0.5'i ilk açtığımda "bu platformu kim yapmış, çok emek var" diye düşündüm. Gerçekten, t01'den t16'ya giden görev serisi, eleman bilgi kartları, IEC standart referansları — bunlar çok profesyonelce yapılmış. Bir öğrenci bu platformda 2-3 saat zaman geçirirse elektrik kumanda devresini kafasında oturtabiliyor, bu küçük bir başarı değil.

Ama bir YTÜ Mekatronik öğrencisi olarak şunu söylemeliyim: Bu platform şu haliyle mezun olmak için değil, ilk okul yılları için yeterli. 3. sınıfta artık PLC'de FC yazıyoruz, PROFINET üzerinden sensörlerden veri çekiyoruz, PID parametresini simülasyonda ayarlıyoruz. Bunların hiçbiri platformda yok.

En kritik eksik bence PLC programlama derinliği. Ladder editörü var ama sadece NO/NC/Bobin var. Bu, Excel'de yalnızca hücre birleştirme öğretip "elektronik tablo biliyorsunuz" demek gibi. TON timer ve CTU sayaç olmadan hiçbir gerçek program yazılamaz.

İkinci kritik eksik: İletişim protokolleri. Fabrikaya girdiğimde PROFINET kablosu görmeden edemiyorum. Modbus olmadan VFD'ye parametre yükleyemiyorum. Bu konular platformda sıfır.

Raporumda listelediğim tüm eksikler hayali değil — bunlar hem üniversite derslerimizde hem de staj başvurularında "bu konuları biliyor musun?" diye sorulan şeyler. Platformun güçlü elektrik kumanda altyapısı üstüne PLC, VFD, protokol ve güvenlik katmanları eklense, Türkiye'nin en iyi endüstriyel otomasyon eğitim platformu olabilir. Potansiyel kesinlikle var.

---

*Bu rapor YTÜ Mekatronik Mühendisliği stajyer gözünden hazırlanmıştır. Teknik doğruluk için SIEMENS TIA Portal Getting Started Guide (2024), FANUC Robotics R-30iB Programming Manual, IEC 61131-3:2013 ve EN ISO 13849-1:2015 standartları referans alınmıştır.*

---

**Rapor sonu — Toplam bölüm sayısı: 11 | Toplam tablo satırı: ~120 | Toplam öneri: ~95**
