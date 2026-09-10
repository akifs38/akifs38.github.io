# Varlık Kontrol

Basit depo / varlık sayım sayfası: **marka + kod + adet**.

- Yayın adresi: <https://akifs38.github.io/varlık/> (ASCII kısayol: `/varlik/`)
- Tek dosya, bağımlılık yok: `index.html`
- Liste depodaki **`varlik/veri.json`** dosyasında tutulur; sayfa açılınca oradan okunur,
  değişiklikler oraya commit edilir. Böylece her cihazda aynı liste görünür.

## Veri nasıl saklanıyor?

| Durum | Okuma | Yazma |
|---|---|---|
| Anahtarsız (herkes) | `veri.json` GitHub'dan okunur | yok — değişiklikler yalnızca o tarayıcıda kalır |
| Anahtar bağlı | GitHub API | değişiklikten ~1,5 sn sonra otomatik commit |

Yazma için deponun sahibine ait bir **fine-grained personal access token** gerekir
(yalnızca bu depo, `Contents: Read and write`). Anahtar sadece tarayıcının yerel
deposunda tutulur; siteye veya depoya yazılmaz. Sayfadaki "GitHub'a bağlan"
düğmesi adımları anlatır.

`veri.json` herkese açık bir depoda durduğu için liste de herkese açıktır;
gizli kalması gereken veriler buraya girilmemeli.

## Özellikler

- Marka, kod, adet ve isteğe bağlı raf/açıklama ile kayıt ekleme
- Aynı marka + kod tekrar girilirse adetler toplanır
- Satır üzerinde `+` / `−` ile hızlı sayım, düzenleme ve silme
- Marka, kod veya rafa göre arama; sütun başlığına tıklayarak sıralama
- Özet: farklı kalem, toplam adet, marka sayısı, stoğu biten
- Üstteki çubukta eşitleme durumu; çevrimdışıyken değişiklikler yerelde bekler,
  bağlantı gelince yazılır
- İki cihazdan aynı anda değişiklik olursa hangi listenin geçerli olacağı sorulur
- **Excel'e aktar**: görünen (aranmış) liste, TOPLAM satırıyla birlikte
  Excel 2003 XML (SpreadsheetML) biçiminde `.xls` olarak indirilir
