# Robot Kesim · Z-Offset Hesabı

Levha kesiminde `P2 → P3 → P4 → P5 → P6` rotası boyunca alınan ölçümlerden
her nokta için uygulanması gereken **kümülatif Z offset** değerini hesaplar.

🌐 `/z-offset/`

## Model

Kesim rotası kapalı bir çevrimdir; `P6` fiziksel olarak `P2`'nin yanındadır
(kesim ağzı boşluğu). Her kenarda iki ölçüm alınır — kenarın başındaki ve
sonundaki nokta:

| Kenar | Ölçümler |
|---|---|
| P2 → P3 (alt) | Ölçüm 1, Ölçüm 2 |
| P3 → P4 (sağ) | Ölçüm 3, Ölçüm 4 |
| P4 → P5 (üst) | Ölçüm 5, Ölçüm 6 |
| P5 → P6 (sol) | Ölçüm 7, Ölçüm 8 |

## Hesap

Kenarın yerel sapması:

```
Δ = ölçüm_başlangıç − ölçüm_bitiş     (mesafe ölçümü modu)
Δ = ölçüm_bitiş − ölçüm_başlangıç     (doğrudan Z okuması modu)
```

Offsetler zincirlemedir — bir noktaya verilen düzeltme, rotada ondan sonra
gelen bütün noktaları da kaydırır:

```
offset(P2) = 0
offset(P3) = offset(P2) + Δ(P2→P3)
offset(P4) = offset(P3) + Δ(P3→P4)
offset(P5) = offset(P4) + Δ(P4→P5)
offset(P6) = offset(P5) + Δ(P5→P6)
```

**Örnek:** Ölçüm 1 = 15 mm, Ölçüm 2 = 12 mm → `Δ = +3` → P3 için **+3.00 mm**.
Ardından Ölçüm 3 = 12, Ölçüm 4 = 10 → `Δ = +2` → P4 için **+5.00 mm**
(kendi farkı +2, P3'ten devraldığı +3).

## Kapanış hatası

Çevrim kapalı olduğu için `offset(P6)` teorik olarak `offset(P2)` ile aynı
olmalıdır. Aradaki fark **kapanış hatasıdır** ve ölçüm hatasını gösterir.
Seçenek açılırsa hata 4 kenara eşit dağıtılarak dengelenir (klasik kapalı
poligon dengelemesi).

## Diğer seçenekler

- **Referans nokta** — offset = 0 kabul edilecek noktayı değiştirir.
- **Nominal Z** — offsetin üstüne eklenerek mutlak Z değerini gösterir.
- **Ondalık basamak** — 0.0 / 0.00 / 0.000.
- Ölçümler tarayıcıda `localStorage` ile saklanır, sayfa yenilense de kalır.
