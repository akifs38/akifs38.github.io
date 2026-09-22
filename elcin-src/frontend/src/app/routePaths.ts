/**
 * Uygulamanın rota tablosu.
 *
 * Hem router hem de derleme sonrası dizin indeksi üreten Vite eklentisi aynı
 * listeyi okur; böylece yeni bir sayfa eklendiğinde derin bağlantısı da
 * kendiliğinden çalışır. (Eklenti Node tarafında çalıştığı için bu dosya
 * tarayıcıya özgü hiçbir şey import etmez.)
 */
export const ROUTE_PATHS = [
  "/",
  "/sohbet",
  "/hafiza",
  "/duygular",
  "/takvim",
  "/surprizler",
  "/cihaz",
  "/govde",
  "/ayarlar",
  "/gelistirici",
] as const;

export type RoutePath = (typeof ROUTE_PATHS)[number];
