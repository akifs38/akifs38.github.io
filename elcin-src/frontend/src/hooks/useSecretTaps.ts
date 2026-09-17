import { useCallback, useRef } from 'react';
import { config } from '@/config';

/**
 * Gizli mod sayacı (32. madde).
 *
 * Avatara belirli süre içinde yeterince dokunulursa geri çağrı tetiklenir.
 * Pencere dışında kalan dokunuşlar sayacı sıfırlar; böylece gün içinde
 * dağınık tıklamalar kazara sırrı açmaz.
 */
export function useSecretTaps(onUnlock: () => void): () => void {
  const taps = useRef<number[]>([]);

  return useCallback(() => {
    const now = Date.now();
    taps.current = [...taps.current, now].filter(
      (stamp) => now - stamp <= config.ui.secretTapWindowMs,
    );

    if (taps.current.length >= config.ui.secretTapCount) {
      taps.current = [];
      onUnlock();
    }
  }, [onUnlock]);
}
