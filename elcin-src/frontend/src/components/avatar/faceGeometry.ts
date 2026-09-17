import type { AnimationName, Mood } from '@/types';

/**
 * Yüz geometrisi.
 *
 * Elçin'in yüzü 100×100'lük bir SVG kutusunda yaşıyor. Her ruh hali için göz
 * ve ağız şekilleri burada sayı olarak tanımlı; bileşen yalnızca bu sayıları
 * yumuşatarak birinden diğerine geçiyor.
 *
 * Aynı değerler ileride OLED yüz motoruna (PHASE 6) çevrilecek: 128×64'lük
 * ekranda da aynı ifadeler çizilebilsin diye oranlar kasıtlı olarak basit.
 */

export interface EyeShape {
  /** Göz genişliği ve yüksekliği (yarıçap değil, tam ölçü). */
  width: number;
  height: number;
  /** Köşe yuvarlaklığı. */
  radius: number;
  /** Merkeze göre dikey kayma — üzgün gözler biraz aşağıda durur. */
  offsetY: number;
  /** Kaş açısı (derece); 0 = düz. */
  browAngle: number;
  /** Kaş görünür mü. */
  brow: boolean;
}

export interface MouthShape {
  /**
   * Ağzın yay yüksekliği. Pozitif = gülümseme, negatif = üzgün, 0 = düz.
   */
  curve: number;
  width: number;
  /** Açık ağız yüksekliği (konuşurken/şaşırınca). */
  open: number;
  offsetY: number;
}

export interface FaceShape {
  eye: EyeShape;
  mouth: MouthShape;
  /** Yanak allığının opaklığı. */
  blush: number;
  /** Yüzün hafif eğilmesi (derece) — meraklı hâlde kafa yana yatar. */
  tilt: number;
}

const BASE_EYE: EyeShape = {
  width: 15,
  height: 20,
  radius: 8,
  offsetY: 0,
  browAngle: 0,
  brow: false,
};

const BASE_MOUTH: MouthShape = { curve: 3, width: 20, open: 0, offsetY: 0 };

export const FACES: Record<Mood, FaceShape> = {
  normal: {
    eye: BASE_EYE,
    mouth: BASE_MOUTH,
    blush: 0,
    tilt: 0,
  },
  happy: {
    eye: { ...BASE_EYE, height: 16, radius: 8 },
    mouth: { curve: 9, width: 26, open: 0, offsetY: 1 },
    blush: 0.5,
    tilt: 0,
  },
  excited: {
    eye: { ...BASE_EYE, width: 17, height: 22, radius: 9 },
    mouth: { curve: 12, width: 30, open: 9, offsetY: 2 },
    blush: 0.7,
    tilt: -2,
  },
  sad: {
    eye: { ...BASE_EYE, height: 17, offsetY: 3, browAngle: -16, brow: true },
    mouth: { curve: -7, width: 20, open: 0, offsetY: 3 },
    blush: 0.15,
    tilt: 3,
  },
  curious: {
    eye: { ...BASE_EYE, width: 16, height: 21, browAngle: 10, brow: true },
    mouth: { curve: 2, width: 13, open: 3, offsetY: 1 },
    blush: 0.2,
    tilt: -7,
  },
  thinking: {
    eye: { ...BASE_EYE, width: 14, height: 13, offsetY: -2, browAngle: 8, brow: true },
    mouth: { curve: 0, width: 12, open: 0, offsetY: 2 },
    blush: 0,
    tilt: -4,
  },
  surprised: {
    eye: { ...BASE_EYE, width: 20, height: 24, radius: 10, browAngle: 14, brow: true },
    mouth: { curve: 0, width: 14, open: 14, offsetY: 2 },
    blush: 0.3,
    tilt: 0,
  },
  sleepy: {
    eye: { ...BASE_EYE, height: 4, radius: 2, offsetY: 2 },
    mouth: { curve: 2, width: 12, open: 4, offsetY: 3 },
    blush: 0.25,
    tilt: 6,
  },
  talking: {
    eye: { ...BASE_EYE, height: 19 },
    mouth: { curve: 5, width: 22, open: 8, offsetY: 1 },
    blush: 0.3,
    tilt: 0,
  },
  love: {
    eye: { ...BASE_EYE, width: 17, height: 17, radius: 9 },
    mouth: { curve: 8, width: 22, open: 0, offsetY: 1 },
    blush: 0.85,
    tilt: -3,
  },
};

/** Animasyonun ruh hali dışında yüze eklediği anlık etki. */
export interface AnimationOverlay {
  /** Gözler kapalı mı (göz kırpma, uyku). */
  eyesClosed?: boolean;
  /** Kalp gösterilsin mi. */
  hearts?: boolean;
  /** Düşünme balonu. */
  bubble?: boolean;
  /** Uyku baloncukları (zzz). */
  zzz?: boolean;
  /** Ağız konuşma ritminde oynasın mı. */
  chatter?: boolean;
  /** Yükleniyor noktaları. */
  loading?: boolean;
  /** Gövde zıplaması (gülme). */
  bounce?: number;
}

export const OVERLAYS: Record<AnimationName, AnimationOverlay> = {
  idle: {},
  blink: { eyesClosed: true },
  smile: {},
  laugh: { bounce: 4, chatter: true },
  sad: {},
  surprise: { bounce: 2 },
  think: { bubble: true },
  talk: { chatter: true },
  heart: { hearts: true },
  sleep: { eyesClosed: true, zzz: true },
  wake: {},
  loading: { loading: true },
};

/** İki yüz arasında yumuşak geçiş — ani sıçrama Elçin'i makineleştirir. */
export function lerpFace(from: FaceShape, to: FaceShape, t: number): FaceShape {
  const mix = (a: number, b: number) => a + (b - a) * t;
  return {
    eye: {
      width: mix(from.eye.width, to.eye.width),
      height: mix(from.eye.height, to.eye.height),
      radius: mix(from.eye.radius, to.eye.radius),
      offsetY: mix(from.eye.offsetY, to.eye.offsetY),
      browAngle: mix(from.eye.browAngle, to.eye.browAngle),
      brow: t > 0.5 ? to.eye.brow : from.eye.brow,
    },
    mouth: {
      curve: mix(from.mouth.curve, to.mouth.curve),
      width: mix(from.mouth.width, to.mouth.width),
      open: mix(from.mouth.open, to.mouth.open),
      offsetY: mix(from.mouth.offsetY, to.mouth.offsetY),
    },
    blush: mix(from.blush, to.blush),
    tilt: mix(from.tilt, to.tilt),
  };
}

/**
 * Ağzı SVG yoluna çevirir.
 *
 * Kapalı ağız tek bir kuadratik yay; açık ağız iki yaydan kapalı bir şekil.
 * Tek fonksiyonda toplanması, gülümserken ağzın açılmasını (kahkaha) tek
 * parametreyle mümkün kılıyor.
 */
export function mouthPath(mouth: MouthShape, centerX = 50, centerY = 62): string {
  const { curve, width, open, offsetY } = mouth;
  const half = width / 2;
  const y = centerY + offsetY;
  const left = centerX - half;
  const right = centerX + half;

  if (open <= 0.4) {
    return `M ${left} ${y} Q ${centerX} ${y + curve * 1.6} ${right} ${y}`;
  }

  const bottom = y + open;
  return [
    `M ${left} ${y}`,
    `Q ${centerX} ${y + curve * 1.2} ${right} ${y}`,
    `Q ${centerX} ${bottom} ${left} ${y}`,
    'Z',
  ].join(' ');
}
