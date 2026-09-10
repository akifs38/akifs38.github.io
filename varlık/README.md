# Varlık Kontrol

Basit depo / varlık sayım sayfası: **marka + kod + adet**.

- Yayın adresi: <https://akifs38.github.io/varlık/> (ASCII kısayol: `/varlik/`)
- Tek dosya, bağımlılık yok: `index.html`
- Veriler tarayıcının `localStorage` deposunda tutulur, sunucuya gidilmez.

## Özellikler

- Marka, kod, adet ve isteğe bağlı raf/açıklama ile kayıt ekleme
- Aynı marka + kod tekrar girilirse adetler toplanır
- Satır üzerinde `+` / `−` ile hızlı sayım, düzenleme ve silme
- Marka, kod veya rafa göre arama; sütun başlığına tıklayarak sıralama
- Özet: farklı kalem, toplam adet, marka sayısı, stoğu biten
- **Excel'e aktar**: görünen (aranmış) liste, TOPLAM satırıyla birlikte
  Excel 2003 XML (SpreadsheetML) biçiminde `.xls` olarak indirilir; Excel,
  LibreOffice ve Google E-Tablolar doğrudan açar.
