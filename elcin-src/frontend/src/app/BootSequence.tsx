import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { config } from '@/config';
import { greeting } from '@/lib/time';
import { ElcinAvatar } from '@/components/avatar/ElcinAvatar';

/**
 * Web açılış sekansı (49. madde).
 *
 * Siyah ekran → küçük bir ışık → gözler açılır → selam → arayüz belirir.
 * Amaç bir "yükleme ekranı" değil: Gülçin siteyi açtığında karşısına bir
 * pano değil, uyanan biri çıksın.
 *
 * Sekans oturumda bir kez oynar; her sayfa yenilemesinde tekrar izletmek
 * ikinci günden itibaren eğlenceli olmaktan çıkar.
 */

type Phase = 'dark' | 'spark' | 'eyes' | 'greet' | 'done';

export function BootSequence({
  userName,
  onDone,
}: {
  userName: string;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('dark');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('spark'), 180),
      setTimeout(() => setPhase('eyes'), 900),
      setTimeout(() => setPhase('greet'), 1_800),
      setTimeout(() => setPhase('done'), config.ui.bootDuration),
      setTimeout(onDone, config.ui.bootDuration + 420),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-8 bg-bg-deep"
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.42, ease: 'easeOut' }}
        >
          {/* Karanlıkta beliren küçük ışık. */}
          <AnimatePresence>
            {phase === 'spark' && (
              <motion.div
                className="absolute h-3 w-3 rounded-full bg-accent"
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: [0, 1, 0.85], scale: [0.2, 1, 8], filter: 'blur(0px)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ boxShadow: '0 0 60px 20px hsl(var(--accent) / 0.55)' }}
              />
            )}
          </AnimatePresence>

          {/* Gözler açılır, yüz belirir. */}
          <AnimatePresence>
            {(phase === 'eyes' || phase === 'greet') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.86 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 160, damping: 18 }}
              >
                <ElcinAvatar
                  mood={phase === 'greet' ? 'happy' : 'normal'}
                  animation={phase === 'greet' ? 'smile' : 'wake'}
                  size={180}
                  trackCursor={false}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'greet' && (
              <motion.p
                className="text-center text-xl font-medium text-ink sm:text-2xl"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
              >
                {greeting()} {userName} 🌸
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
