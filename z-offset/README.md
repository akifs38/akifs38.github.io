# Robot Kesim · Z-Offset Hesabı

Levha kesim rotası boyunca alınan ölçümlerden her nokta için uygulanması
gereken **kümülatif Z offset** değerini hesaplar.

🌐 `/z-offset/`

## Model

Rota 5 nokta indeksinden oluşur: `0 → 1 → 2 → 3 → 4`.
**İlk ve son nokta aynı fiziksel noktadır** — kesim orada başlar, orada biter.
Bu yüzden 4 kenar ve toplam 8 ölçüm vardır.

Nokta adları kullanıcıya bağlıdır; robot programındaki adlar ne ise arayüzden
girilir (hazır şablonlar: `P1…P5` ve `P2…P6`). Hesap adlarla değil indekslerle
yapılır, ad değişikliği sonucu etkilemez.

| Kenar | Ölçümler |
|---|---|
| 0 → 1 (alt) | Ölçüm 1, Ölçüm 2 |
| 1 → 2 (sağ) | Ölçüm 3, Ölçüm 4 |
| 2 → 3 (üst) | Ölçüm 5, Ölçüm 6 |
| 3 → 4 (sol) | Ölçüm 7, Ölçüm 8 |

## Hesap

Kenarın yerel sapması:

```
Δ = ölçüm_başlangıç − ölçüm_bitiş     (mesafe ölçümü modu)
Δ = ölçüm_bitiş − ölçüm_başlangıç     (doğrudan Z okuması modu)
```

Offsetler zincirlemedir — bir noktaya verilen düzeltme, rotada ondan sonra
gelen bütün noktaları da kaydırır:

```
offset[0] = 0
offset[k] = offset[k-1] + Δ(k-1 → k)
```

**Örnek** (varsayılan `P1…P5` adlandırmasıyla): Ölçüm 1 = 15 mm, Ölçüm 2 = 12 mm
→ `Δ = +3` → P2 için **+3.00 mm**. Ardından Ölçüm 3 = 12, Ölçüm 4 = 10 → `Δ = +2`
→ P3 için **+5.00 mm** (kendi farkı +2, P2'den devraldığı +3).

## Kapanış hatası

İlk ve son nokta aynı yer olduğu için offsetleri de aynı çıkmalıdır. Aradaki
fark **kapanış hatasıdır** ve doğrudan ölçüm hatasını gösterir. Seçenek açılırsa
hata 4 kenara eşit dağıtılarak dengelenir (klasik kapalı poligon dengelemesi).

## Diğer seçenekler

- **Referans nokta** — offset = 0 kabul edilecek noktayı değiştirir.
- **Nominal Z** — offsetin üstüne eklenerek mutlak Z değerini gösterir.
- **Ondalık basamak** — 0.0 / 0.00 / 0.000.
- Ölçümler ve nokta adları tarayıcıda `localStorage` ile saklanır.
