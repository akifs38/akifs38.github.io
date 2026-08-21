# Rota Yahyalı — Astro kaynak projesi

Bu klasör, `rotayahyali/` altında yayınlanan tanıtım sitesinin **kaynak kodudur**.
Site [Astro](https://astro.build) ile üretilir; çıktı doğrudan repo kökündeki
`../rotayahyali/` klasörüne yazılır ve GitHub Pages oradan yayınlar.

## Kurulum & geliştirme

```bash
cd site-src
npm install        # bağımlılıkları kur (ilk seferde)
npm run dev        # http://localhost:4321/rotayahyali/ canlı önizleme
```

## Yayına hazırlama (build)

```bash
cd site-src
npm run build      # ../rotayahyali/ klasörünü yeniden üretir
```

Ardından repo kökünde `rotayahyali/` içindeki değişiklikleri commit’leyin.
`main` dalına geçtiğinde GitHub Pages otomatik yayınlar.

## İçeriği düzenleme (kod bilmeden)

Neredeyse tüm içerik tek dosyada: **`src/data/places.js`**

- **Yeni gezi yeri** → `places` dizisine bir nesne ekleyin.
- **Yeni galeri karesi** → `gallery` dizisine ekleyin.
- **Haritaya nokta** → `mapPoints` dizisine `lat`/`lng` ile ekleyin.
- **Tarihçe / istatistik / öne çıkanlar** → ilgili diziler aynı dosyada.

Kaydedip `npm run build` çalıştırın; sayfa otomatik güncellenir.

## Fotoğraf ekleme

Fotoğrafları **`public/img/`** klasörüne koyun (bkz. `public/img/README.md`).
Aynı adla yerel dosya varsa site onu, yoksa Wikimedia Commons bağlantısını kullanır.

## Yapı

```
src/
  data/places.js        ← tek merkezî içerik kaynağı
  layouts/Base.astro    ← <head>, fontlar, global stil
  components/           ← Nav, Hero, About, Places, WaterfallScene, Nature,
                          Timeline, Culture, Gallery, MapSection, Footer
  scripts/ui.js         ← menü, scroll animasyonları, sayaç, galeri lightbox
  styles/global.css     ← tüm tasarım + animasyonlar
public/                 ← statik dosyalar (img, .nojekyll)
```
