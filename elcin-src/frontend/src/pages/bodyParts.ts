/**
 * Gövde görüntüleyicisinin parça tablosu.
 *
 * Dosya adları elcin-src/kutu/montaj.py'nin yazdığı adlarla birebir aynı;
 * hepsi montaj konumunda dışa aktarılıyor, yani tarayıcı tarafında hiçbir
 * dönüşüm gerekmiyor — yalnızca renk ve kapak açma kaydırması.
 */

export interface BodyPart {
  /** stl/montaj/ altındaki dosya adı (uzantısız). */
  id: string;
  label: string;
  note: string;
  color: string;
  /** Basılan kabuk parçası mı, içine giren modül mü? */
  kind: "kabuk" | "modul";
  /** Kapak açılınca kapakla birlikte geliyor mu? */
  onLid?: boolean;
  /** Kabuk şeffaflaştığında bu parça da şeffaflaşır. */
  shell?: boolean;
}

export const BODY_PARTS: BodyPart[] = [
  {
    id: "govde",
    label: "Gövde",
    note: "Beyaz · yüz tablada basılır",
    color: "#eef0f3",
    kind: "kabuk",
    shell: true,
  },
  {
    id: "kapak",
    label: "Arka kapak",
    note: "Beyaz · ters basılır, raylar yukarı",
    color: "#dfe3e8",
    kind: "kabuk",
    onLid: true,
    shell: true,
  },
  {
    id: "goz_yamasi",
    label: "Göz yaması",
    note: "Siyah · 47 × 24 mm",
    color: "#25272c",
    kind: "kabuk",
  },
  {
    id: "kulaklar",
    label: "Kulaklar",
    note: "Siyah · 2 adet",
    color: "#25272c",
    kind: "kabuk",
  },
  {
    id: "kollar",
    label: "Patiler",
    note: "Siyah · 2 adet",
    color: "#25272c",
    kind: "kabuk",
  },
  {
    id: "oled",
    label: "SSD1306 OLED",
    note: "27 × 27 × 4.1 mm · gövdede",
    color: "#3f5f8f",
    kind: "modul",
  },
  {
    id: "esp32",
    label: "ESP32-C3 Super Mini",
    note: "23 × 18 × 5 mm · kapakta",
    color: "#4b4f58",
    kind: "modul",
    onLid: true,
  },
  {
    id: "pil",
    label: "Li-Po pil",
    note: "40 × 30 × 5 mm · gövdede",
    color: "#a8b0ba",
    kind: "modul",
  },
  {
    id: "tp4056",
    label: "TP4056 Type-C",
    note: "26.5 × 17 × 5 mm · göbeğin altında, 28° yatık",
    color: "#2f6fbf",
    kind: "modul",
  },
  {
    id: "ttp223",
    label: "TTP223 dokunma",
    note: "15 × 11 × 1.6 mm · tepede, duvarın içinde",
    color: "#3f8f66",
    kind: "modul",
  },
  {
    id: "anahtar",
    label: "Aç/kapa anahtarı",
    note: "Delik 20 × 5 mm · kapakta",
    color: "#7c8490",
    kind: "modul",
    onLid: true,
  },
];

/**
 * Kapağın açılma yönü — dünya koordinatlarında birim vektör.
 *
 * Kutu baskı ekseninde çizilir, montajda rot_x(90 + LEAN) ile masaya oturur.
 * Kapak baskı eksenindeki +Z yönünde ayrılıyor; o yön bu dönüşümle
 * (0, −sin, −cos)'a gidiyor. Elle "arkaya doğru" demek yaslanma açısını
 * gözden kaçırırdı ve kapak gövdeyi sıyırarak açılırdı.
 */
export const LEAN_DEG = 10;

export function lidAxis(): [number, number, number] {
  const a = ((90 + LEAN_DEG) * Math.PI) / 180;
  return [0, -Math.sin(a), Math.cos(a)];
}
