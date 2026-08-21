// @ts-check
import { defineConfig } from 'astro/config';

// Site, GitHub Pages'te https://akifs38.github.io/rotayahyali/ altında yayınlanır.
// Build çıktısı doğrudan repo kökündeki ../rotayahyali klasörüne yazılır;
// böylece mevcut Pages (branch) ayarları ve kökteki diğer proje değişmez.
export default defineConfig({
  site: 'https://akifs38.github.io',
  base: '/rotayahyali',
  outDir: '../rotayahyali',
  build: {
    // outDir'i temizlerken README ve kullanıcı fotoğraflarını koru
    assets: 'assets',
  },
  trailingSlash: 'ignore',
});
