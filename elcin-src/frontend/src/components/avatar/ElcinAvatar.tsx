import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { MOOD_ACCENT } from '@/services/ai/moodEngine';
import type { AnimationName, Mood } from '@/types';
import { FACES, OVERLAYS, mouthPath } from './faceGeometry';

/**
 * Elçin'in yüzü.
 *
 * Tasarım kararı: yüz bir resim değil, yaşayan bir SVG. Göz bebekleri imleci
 * takip eder, gözler kendiliğinden kırpar, ağız konuşurken oynar. Bunların
 * hiçbiri "efekt" olsun diye değil — bakan birinin karşısında biri olduğunu
 * hissetmesi için.
 *
 * 3D'ye hazırlık (33. madde): bu bileşen dışarıya yalnızca `mood`/`animation`
 * alır. İleride aynı sözleşmeyi uygulayan bir React Three Fiber sahnesi
 * buraya takıldığında çağıran taraf değişmez.
 */

export interface ElcinAvatarProps {
  mood: Mood;
  animation: AnimationName;
  /** Piksel cinsinden kenar uzunluğu. */
  size?: number;
  /** Göz bebekleri imleci takip etsin mi. */
  trackCursor?: boolean;
  className?: string;
  onClick?: () => void;
}

export function ElcinAvatar({
  mood,
  animation,
  size = 220,
  trackCursor = true,
  className,
  onClick,
}: ElcinAvatarProps) {
  const reduceMotion = useReducedMotion();
  const wrapper = useRef<HTMLDivElement>(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const [chattering, setChattering] = useState(false);

  const face = FACES[mood];
  const overlay = OVERLAYS[animation];
  const accent = MOOD_ACCENT[mood];

  /* Kendiliğinden göz kırpma: sabit aralık makine gibi durur, bu yüzden her
     seferinde 2.6–6.5 sn arasında yeni bir zamanlayıcı kurulur. */
  useEffect(() => {
    if (reduceMotion || overlay.eyesClosed) return;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timer = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 130);
        schedule();
      }, 2_600 + Math.random() * 3_900);
    };

    schedule();
    return () => clearTimeout(timer);
  }, [reduceMotion, overlay.eyesClosed]);

  /* Konuşma ritmi: ağız iki kare arasında gidip gelir. Yol verisini
     ara değerlemek yerine kare değiştirmek hem doğru hem de ucuz. */
  useEffect(() => {
    if (!overlay.chatter || reduceMotion) {
      setChattering(false);
      return;
    }
    const timer = setInterval(() => setChattering((open) => !open), 210);
    return () => {
      clearInterval(timer);
      setChattering(false);
    };
  }, [overlay.chatter, reduceMotion]);

  /* Bakış takibi: imleç uzaklaştıkça göz bebeği kayar ama ±3 birimle sınırlı,
     yoksa gözler yuvasından fırlamış gibi görünür. */
  useEffect(() => {
    if (!trackCursor || reduceMotion) return;

    const onMove = (event: PointerEvent) => {
      const node = wrapper.current;
      if (!node) return;
      const box = node.getBoundingClientRect();
      const dx = (event.clientX - (box.left + box.width / 2)) / (window.innerWidth / 2);
      const dy = (event.clientY - (box.top + box.height / 2)) / (window.innerHeight / 2);
      setGaze({
        x: Math.max(-1, Math.min(1, dx)) * 3,
        y: Math.max(-1, Math.min(1, dy)) * 2.2,
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [trackCursor, reduceMotion]);

  const eyesClosed = overlay.eyesClosed || blinking;
  const eyeHeight = eyesClosed ? 2.5 : face.eye.height;

  const mouthD = useMemo(() => mouthPath(face.mouth), [face.mouth]);
  const chatterMouthD = useMemo(
    () => mouthPath({ ...face.mouth, open: Math.max(face.mouth.open, 3) + 6 }),
    [face.mouth],
  );

  const eyeX = 50 - 13;
  const eyeY = 44 + face.eye.offsetY;

  return (
    <div
      ref={wrapper}
      className={cn('relative select-none', onClick && 'cursor-pointer', className)}
      style={{ width: size, height: size }}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : -1}
      aria-label={`Elçin, ${mood}`}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {/* Ruh haline göre renk değiştiren hâle. */}
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        animate={{ opacity: reduceMotion ? 0.4 : [0.35, 0.62, 0.35] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: `radial-gradient(circle, hsl(${accent} / 0.55), transparent 68%)` }}
      />

      <motion.svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="relative z-10"
        animate={{
          rotate: reduceMotion ? 0 : face.tilt,
          y: reduceMotion ? 0 : overlay.bounce ? [0, -overlay.bounce, 0] : [0, -3, 0],
        }}
        transition={{
          rotate: { type: 'spring', stiffness: 120, damping: 14 },
          y: {
            duration: overlay.bounce ? 0.42 : 5.4,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        <defs>
          <radialGradient id="elcin-body" cx="38%" cy="28%">
            <stop offset="0%" stopColor={`hsl(${accent} / 0.55)`} />
            <stop offset="58%" stopColor="hsl(var(--surface-2))" />
            <stop offset="100%" stopColor="hsl(var(--surface))" />
          </radialGradient>
          <linearGradient id="elcin-rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`hsl(${accent} / 0.9)`} />
            <stop offset="100%" stopColor="hsl(var(--accent-2) / 0.5)" />
          </linearGradient>
        </defs>

        {/* Gövde */}
        <circle cx="50" cy="50" r="44" fill="url(#elcin-body)" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="url(#elcin-rim)" strokeWidth="1.6" />
        {/* Cam parlaması: yüzeyi ekran gibi gösterir. */}
        <ellipse cx="34" cy="28" rx="17" ry="11" fill="hsl(var(--text) / 0.07)" />

        {/* Yanaklar */}
        <motion.g animate={{ opacity: face.blush }} transition={{ duration: 0.4 }}>
          <ellipse cx="26" cy="60" rx="7.5" ry="4.5" fill={`hsl(${accent} / 0.45)`} />
          <ellipse cx="74" cy="60" rx="7.5" ry="4.5" fill={`hsl(${accent} / 0.45)`} />
        </motion.g>

        {/* Kaşlar */}
        {face.eye.brow && (
          <g stroke="hsl(var(--text) / 0.75)" strokeWidth="2.4" strokeLinecap="round">
            <motion.line
              x1={eyeX - 7} y1={eyeY - 15} x2={eyeX + 7} y2={eyeY - 15}
              animate={{ rotate: face.eye.browAngle }}
              style={{ originX: `${eyeX}px`, originY: `${eyeY - 15}px` }}
              transition={{ type: 'spring', stiffness: 140, damping: 16 }}
            />
            <motion.line
              x1={50 + 13 - 7} y1={eyeY - 15} x2={50 + 13 + 7} y2={eyeY - 15}
              animate={{ rotate: -face.eye.browAngle }}
              style={{ originX: `${50 + 13}px`, originY: `${eyeY - 15}px` }}
              transition={{ type: 'spring', stiffness: 140, damping: 16 }}
            />
          </g>
        )}

        {/* Gözler */}
        <g>
          {/*
            Düz <rect>, motion.rect değil: framer-motion'da `y` bir dönüşümdür
            (translateY), SVG'nin y özniteliği değil. Animasyona verilince göz
            kutuları konumlarının altına kayıyordu. Geometri doğrudan
            özniteliklerle yazılır, yumuşatma CSS geçişine bırakılır.
          */}
          {[eyeX, 50 + 13].map((cx, index) => (
            <rect
              key={index}
              x={cx - face.eye.width / 2 + gaze.x}
              y={eyeY - eyeHeight / 2 + gaze.y}
              width={face.eye.width}
              height={eyeHeight}
              rx={Math.min(face.eye.radius, eyeHeight / 2)}
              fill="hsl(var(--text))"
              style={{
                transition: reduceMotion
                  ? undefined
                  : `height ${eyesClosed ? 90 : 220}ms ease-out, y ${
                      eyesClosed ? 90 : 220
                    }ms ease-out, width 220ms ease-out`,
              }}
            />
          ))}
          {/* Göz parıltısı — kapalıyken gizlenir. */}
          {!eyesClosed && (
            <g fill="hsl(var(--bg-deep) / 0.85)">
              <circle cx={eyeX + 3.4 + gaze.x} cy={eyeY - 4 + gaze.y} r="1.9" />
              <circle cx={50 + 13 + 3.4 + gaze.x} cy={eyeY - 4 + gaze.y} r="1.9" />
            </g>
          )}
        </g>

        {/* Ağız */}
        <path
          d={chattering ? chatterMouthD : mouthD}
          fill={(chattering ? 1 : face.mouth.open) > 0.4 ? 'hsl(var(--text))' : 'none'}
          stroke="hsl(var(--text))"
          strokeWidth="2.6"
          strokeLinecap="round"
        />

        {/* Kalpler */}
        {overlay.hearts && (
          <g>
            {[
              { x: 20, y: 30, delay: 0 },
              { x: 78, y: 24, delay: 0.5 },
              { x: 68, y: 38, delay: 1 },
            ].map((heart) => (
              <motion.text
                key={`${heart.x}-${heart.y}`}
                x={heart.x}
                y={heart.y}
                fontSize="11"
                textAnchor="middle"
                initial={{ opacity: 0, y: heart.y }}
                animate={{ opacity: [0, 1, 0], y: [heart.y, heart.y - 16] }}
                transition={{ duration: 2, repeat: Infinity, delay: heart.delay }}
              >
                ❤️
              </motion.text>
            ))}
          </g>
        )}

        {/* Uyku baloncukları */}
        {overlay.zzz && (
          <g fill="hsl(var(--text) / 0.6)" fontSize="9" fontWeight="600">
            {[
              { x: 78, y: 26, delay: 0 },
              { x: 86, y: 18, delay: 0.7 },
            ].map((z) => (
              <motion.text
                key={z.x}
                x={z.x}
                y={z.y}
                animate={{ opacity: [0, 1, 0], y: [z.y, z.y - 8] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: z.delay }}
              >
                z
              </motion.text>
            ))}
          </g>
        )}

        {/* Düşünme noktaları */}
        {(overlay.bubble || overlay.loading) && (
          <g fill={`hsl(${accent})`}>
            {[0, 1, 2].map((index) => (
              <motion.circle
                key={index}
                cx={76 + index * 7}
                cy={overlay.loading ? 84 : 22}
                r="2.6"
                animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.15, 0.85] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: index * 0.16 }}
              />
            ))}
          </g>
        )}
      </motion.svg>
    </div>
  );
}
