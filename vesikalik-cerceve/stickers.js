// Hazır renkli sticker çizimleri (SVG). Hepsi 200×200 kare; arka plan tüm kareyi
// doldurur ki daire, oval ya da kare kesimde boşluk kalmasın. Önemli kısım ortada.

const TXT = (y, s, fill = '#fff', size = 22) =>
  `<text x="100" y="${y}" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-weight="900" font-size="${size}" letter-spacing="2" fill="${fill}"
    stroke="rgba(0,0,0,.35)" stroke-width="1.2" paint-order="stroke">${s}</text>`;

const turtle = (x, y, k, rot = 0) => `
  <g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})">
    <ellipse cx="0" cy="-38" rx="11" ry="13" fill="#7cc576"/>
    <circle cx="-5" cy="-42" r="2.2" fill="#123"/><circle cx="5" cy="-42" r="2.2" fill="#123"/>
    <path d="M-22 -12 C-48 -18 -60 -2 -56 10 C-44 4 -34 0 -22 2Z" fill="#6bb865"/>
    <path d="M22 -12 C48 -18 60 -2 56 10 C44 4 34 0 22 2Z" fill="#6bb865"/>
    <path d="M-16 22 C-30 26 -34 38 -30 44 C-22 38 -16 34 -10 30Z" fill="#6bb865"/>
    <path d="M16 22 C30 26 34 38 30 44 C22 38 16 34 10 30Z" fill="#6bb865"/>
    <path d="M0 34 L-4 46 L4 46Z" fill="#6bb865"/>
    <ellipse cx="0" cy="4" rx="27" ry="33" fill="#8a5a2b"/>
    <ellipse cx="0" cy="4" rx="23" ry="29" fill="#b07a3e"/>
    <path d="M0 -14 L10 -6 L10 8 L0 16 L-10 8 L-10 -6Z" fill="#d6a15e" stroke="#7a4d22" stroke-width="2"/>
    <path d="M0 -14 L0 -25 M10 -6 L20 -12 M10 8 L21 14 M0 16 L0 30 M-10 8 L-21 14 M-10 -6 L-20 -12"
      stroke="#7a4d22" stroke-width="2.4" stroke-linecap="round"/>
  </g>`;

export const STICKERS = [
  {
    id: 'caretta', ad: 'Caretta',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3fd0d4"/><stop offset="1" stop-color="#0b5d8c"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#g)"/>
      <path d="M0 40 Q25 30 50 40 T100 40 T150 40 T200 40" stroke="#bff3f2" stroke-width="3" fill="none" opacity=".5"/>
      <path d="M0 158 Q25 148 50 158 T100 158 T150 158 T200 158 V200 H0Z" fill="#e8d3a2"/>
      <circle cx="40" cy="70" r="4" fill="#d8fbff" opacity=".7"/><circle cx="160" cy="60" r="6" fill="#d8fbff" opacity=".6"/>
      <circle cx="150" cy="120" r="3" fill="#d8fbff" opacity=".7"/>
      ${turtle(100, 98, 1.25, -12)}
      ${TXT(176, 'DALYAN', '#fff', 18)}
    </svg>`,
  },
  {
    id: 'gunbatimi', ad: 'Gün batımı',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ff5f6d"/><stop offset=".55" stop-color="#ffc371"/><stop offset="1" stop-color="#ffe29a"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#s)"/>
      <circle cx="100" cy="112" r="46" fill="#fff3b0"/>
      <circle cx="100" cy="112" r="38" fill="#ffd23f"/>
      <rect y="120" width="200" height="80" fill="#1a7fb5"/>
      <path d="M0 128 Q20 120 40 128 T80 128 T120 128 T160 128 T200 128" stroke="#9fe3ff" stroke-width="4" fill="none"/>
      <path d="M20 150 Q40 142 60 150 T100 150" stroke="#9fe3ff" stroke-width="3" fill="none" opacity=".8"/>
      <path d="M110 162 Q130 154 150 162 T190 162" stroke="#9fe3ff" stroke-width="3" fill="none" opacity=".8"/>
      <path d="M62 112 h28 l-4 10 h-20z" fill="#5a3517"/><path d="M76 112 v-26 l14 20z" fill="#fff"/>
      ${TXT(48, 'İZTUZU', '#fff', 24)}
    </svg>`,
  },
  {
    id: 'yengec', ad: 'Mavi yengeç',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#f4e2b8"/>
      <circle cx="30" cy="40" r="5" fill="#e7cf98"/><circle cx="170" cy="150" r="6" fill="#e7cf98"/><circle cx="160" cy="40" r="4" fill="#e7cf98"/>
      <g stroke="#1d4f9c" stroke-width="7" stroke-linecap="round" fill="none">
        <path d="M66 110 L36 122 L26 142"/><path d="M68 122 L42 140 L36 160"/><path d="M74 132 L54 154 L52 172"/>
        <path d="M134 110 L164 122 L174 142"/><path d="M132 122 L158 140 L164 160"/><path d="M126 132 L146 154 L148 172"/>
        <path d="M76 92 L56 70 L60 52"/><path d="M124 92 L144 70 L140 52"/>
      </g>
      <path d="M52 52 C40 40 46 22 62 24 L60 40 L70 30 C76 40 68 54 52 52Z" fill="#2c6fd1"/>
      <path d="M148 52 C160 40 154 22 138 24 L140 40 L130 30 C124 40 132 54 148 52Z" fill="#2c6fd1"/>
      <path d="M40 104 Q100 64 160 104 Q148 140 100 142 Q52 140 40 104Z" fill="#2c6fd1"/>
      <path d="M40 104 L22 96 L44 112Z M160 104 L178 96 L156 112Z" fill="#2c6fd1"/>
      <path d="M60 108 Q100 84 140 108" stroke="#7fb2ff" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="88" cy="88" r="5" fill="#fff"/><circle cx="112" cy="88" r="5" fill="#fff"/>
      <circle cx="88" cy="89" r="2.5" fill="#111"/><circle cx="112" cy="89" r="2.5" fill="#111"/>
      ${TXT(178, 'DALYAN', '#1d4f9c', 18)}
    </svg>`,
  },
  {
    id: 'mezar', ad: 'Kaya mezarları',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs><linearGradient id="k" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ff9a5a"/><stop offset="1" stop-color="#ffd59a"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#k)"/>
      <circle cx="160" cy="44" r="18" fill="#fff1c1"/>
      <path d="M0 150 L0 70 L30 52 L70 58 L110 38 L160 60 L200 54 L200 150Z" fill="#a8693a"/>
      <path d="M0 150 L0 92 L40 80 L100 90 L150 78 L200 88 L200 150Z" fill="#8c5229" opacity=".6"/>
      <g fill="#e2b483" stroke="#5e3214" stroke-width="2">
        <path d="M34 100 h34 v34 h-34z"/><path d="M30 100 L51 84 L72 100Z"/>
        <path d="M88 92 h40 v42 h-40z"/><path d="M84 92 L108 74 L132 92Z"/>
        <path d="M146 102 h30 v32 h-30z"/><path d="M142 102 L161 88 L180 102Z"/>
      </g>
      <g fill="#4a240c"><rect x="45" y="112" width="12" height="22"/><rect x="101" y="106" width="14" height="28"/><rect x="155" y="114" width="12" height="20"/></g>
      <rect y="150" width="200" height="50" fill="#2a8fb0"/>
      <path d="M0 160 Q25 152 50 160 T100 160 T150 160 T200 160" stroke="#b9ecff" stroke-width="3" fill="none"/>
      <path d="M70 176 h50 l-8 8 h-34z" fill="#fff"/><path d="M90 176 v-14 l10 12z" fill="#ffd23f"/>
      ${TXT(42, 'KAUNOS', '#fff', 18)}
    </svg>`,
  },
  {
    id: 'bulut', ad: 'Bulutlar',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5ec8ff"/><stop offset="1" stop-color="#c9f0ff"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#b)"/>
      <g fill="#ffd23f"><circle cx="150" cy="56" r="22"/></g>
      <g stroke="#ffd23f" stroke-width="5" stroke-linecap="round">
        <path d="M150 20 v-8 M150 100 v-8 M114 56 h-8 M194 56 h-8 M124 30 l-6 -6 M182 88 l-6 -6 M124 82 l-6 6 M182 24 l-6 6"/>
      </g>
      <g fill="#fff">
        <circle cx="62" cy="100" r="26"/><circle cx="92" cy="88" r="32"/><circle cx="124" cy="104" r="24"/>
        <rect x="40" y="100" width="104" height="28" rx="14"/>
        <circle cx="140" cy="150" r="16"/><circle cx="160" cy="142" r="20"/><circle cx="180" cy="152" r="14"/>
        <rect x="126" y="150" width="68" height="16" rx="8"/>
      </g>
      <circle cx="80" cy="108" r="4" fill="#2d3a4a"/><circle cx="104" cy="108" r="4" fill="#2d3a4a"/>
      <path d="M84 118 Q92 126 100 118" stroke="#2d3a4a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="74" cy="116" r="4" fill="#ffb3c7"/><circle cx="110" cy="116" r="4" fill="#ffb3c7"/>
      ${TXT(176, 'DALYAN', '#fff', 18)}
    </svg>`,
  },
];

export function stickerById(id) {
  return STICKERS.find((s) => s.id === id) || null;
}

export function svgDataUrl(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
