# Elçin

Gülçin için kişisel AI arkadaş: React web uygulaması, ESP32-C3 firmware'i ve
3B basılan panda gövde. Yazışma ve belgeler Türkçe.

## Yerleşim

- `frontend/` — React + Vite + three.js. Canlı: akifs38.github.io/elcin/
- `esp32/` — firmware (`arduino/Elcin/`, PlatformIO), `tools/to_png.py`
- `kutu/` — gövde: `elcin_kutu_uret.py` (tek kaynak), `dogrula.py`,
  `montaj.py`, `onizle.py`, `stl/`, `onizleme/`, `README.md`

## Komutlar

```bash
# kutu (pip install manifold3d numpy-stl)
cd kutu
python3 elcin_kutu_uret.py && python3 montaj.py && python3 dogrula.py
python3 onizle.py && python3 ../esp32/tools/to_png.py onizleme/*.pgm

# frontend
cd frontend && npm ci && npm test && npx tsc --noEmit -p .
BASE_PATH=/elcin/ npm run build
```

## Kurallar

- **`dogrula.py` geçmeden commit yok.** Çıkış kodunu doğrudan denetle:
  `python3 dogrula.py >/dev/null && git commit ...`. `| tail` gibi bir boru
  çıkış kodunu yutar; bir kez "SORUN VAR" iken commit gitti.
- Çakışma testi yalnızca iç içe geçmeyi görür. Tutmayan yuva, teğet temas,
  ters çizilmiş pim, baskıda kaynaşan esnek parça onu geçer. Yeni bir yuva ya
  da geçme eklerken ona özel bir denetim de ekle (kayma, giriş derinliği,
  komşuya uzaklık ≥ 0.5 mm, düz taban…) ve denetimin eski hatayı
  yakaladığını sına.
- **Gövde (`elcin_govde.stl`) ve kapak basıldı.** Kullanıcı istemedikçe
  yuvalarını değiştirme. Değişiklikten sonra gövdenin üçgen kümesinin aynı
  kaldığını karşılaştırarak kanıtla.
- STL başlığında zaman damgası var. Geometrisi değişmeyen dosyaları
  (üçgen kümesi aynıysa) commit'ten önce `git checkout` ile geri al.
- Ölçüler kullanıcının ölçümlerinden ve gönderdiği modellerden geliyor;
  tahmin edilenler kodda "ÖLÇ" diye işaretli. Basılmadan önce şablon
  (`elcin_*_sablonu.stl`) ver.
- Firmware gizli bilgileri yalnızca NVS'de; API anahtarı yalnızca backend'de;
  `.env`, `.env.local`, `secrets` git dışında.

## Yayın

Geliştirme dalı `claude/elcin-ai-companion-7hh0ta`. Canlıya almak = main'e
birleştirmek. Yalnızca kullanıcı "canlıya al" deyince yapılır.
`build-elcin` workflow'u `elcin/` klasörünü derleyip commit'liyor; GitHub
Pages oradan yayınlıyor.
