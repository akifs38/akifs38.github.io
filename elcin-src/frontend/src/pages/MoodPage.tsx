import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatRelative, formatTime } from '@/lib/time';
import { MOOD_ACCENT, MOOD_LABEL } from '@/services/ai/moodEngine';
import { MOODS, type Mood } from '@/types';
import { ElcinAvatar } from '@/components/avatar/ElcinAvatar';
import { Badge, Button, EmptyState, Panel, SectionTitle, StatTile } from '@/components/ui';
import { useElcin } from '@/stores';

/**
 * Duygular ekranı.
 *
 * Grafik kütüphanesi yok — 24 saatlik seyir, her biri kendi rengini taşıyan
 * küçük çubuklarla çiziliyor. Hafif kalması bir yana, bu Elçin'in ruh halini
 * bir metrik gibi değil, bir günlük gibi gösteriyor.
 */
export function MoodPage() {
  const mood = useElcin((state) => state.mood);
  const animation = useElcin((state) => state.animation);
  const intensity = useElcin((state) => state.intensity);
  const reason = useElcin((state) => state.reason);
  const since = useElcin((state) => state.since);
  const history = useElcin((state) => state.history);
  const setMood = useElcin((state) => state.setMood);
  const resetHistory = useElcin((state) => state.resetHistory);

  const recent = useMemo(() => history.slice(-40).reverse(), [history]);

  /** En sık görülen ruh hali — "Elçin bugünlerde nasıl?" sorusunun cevabı. */
  const dominant = useMemo(() => {
    if (history.length === 0) return null;
    const counts = new Map<Mood, number>();
    for (const sample of history) counts.set(sample.mood, (counts.get(sample.mood) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  }, [history]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink">❤️ Duygular</h1>
        <p className="mt-1 text-sm text-muted">Elçin'in ruh hali, nereden geldiği ve seyri.</p>
      </header>

      {/* Şu anki hâl */}
      <Panel className="flex flex-col items-center gap-5 px-6 py-8 sm:flex-row sm:items-center sm:gap-8">
        <ElcinAvatar mood={mood} animation={animation} size={140} trackCursor={false} />
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div>
            <p className="text-2xl font-semibold text-ink">{MOOD_LABEL[mood]}</p>
            <p className="mt-0.5 text-sm text-muted">{reason}</p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
              <span>Yoğunluk</span>
              <span className="tabular-nums">{Math.round(intensity * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `hsl(${MOOD_ACCENT[mood]})` }}
                initial={{ width: 0 }}
                animate={{ width: `${intensity * 100}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
          </div>

          <p className="text-[11px] text-muted">Bu haldeyken geçen süre: {formatRelative(since)}</p>
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Kayıt" value={history.length} hint="Ruh hali değişimi" />
        <StatTile
          label="Baskın hal"
          value={dominant ? MOOD_LABEL[dominant[0]] : '—'}
          hint={dominant ? `${dominant[1]} kez` : 'Henüz veri yok'}
        />
        <StatTile label="Şu anki yoğunluk" value={`${Math.round(intensity * 100)}%`} />
      </div>

      {/* Seyir */}
      <div>
        <SectionTitle
          action={
            history.length > 0 ? (
              <button onClick={resetHistory} className="text-[11px] text-muted hover:text-ink">
                Geçmişi sıfırla
              </button>
            ) : null
          }
        >
          Ruh hali seyri
        </SectionTitle>
        <Panel padded={false}>
          {recent.length === 0 ? (
            <EmptyState
              icon="📈"
              title="Henüz seyir yok"
              description="Elçin ile konuştukça ruh hali burada birikecek."
            />
          ) : (
            <>
              {/* Çubuk şerit */}
              <div className="flex items-end gap-0.5 overflow-hidden px-4 pt-5">
                {[...recent].reverse().map((sample, index) => (
                  <motion.div
                    key={`${sample.at}-${index}`}
                    className="flex-1 rounded-t-sm"
                    style={{
                      background: `hsl(${MOOD_ACCENT[sample.mood]})`,
                      minWidth: 3,
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: 14 + sample.intensity * 50 }}
                    transition={{ delay: index * 0.012, type: 'spring', stiffness: 160, damping: 20 }}
                    title={`${MOOD_LABEL[sample.mood]} — ${formatTime(sample.at)}`}
                  />
                ))}
              </div>

              <ul className="mt-4 divide-y divide-line/20">
                {recent.slice(0, 12).map((sample, index) => (
                  <li key={`${sample.at}-${index}`} className="flex items-center gap-3 px-4 py-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: `hsl(${MOOD_ACCENT[sample.mood]})` }}
                    />
                    <span className="text-sm text-ink">{MOOD_LABEL[sample.mood]}</span>
                    <span className="min-w-0 flex-1 truncate text-[11px] text-muted">
                      {sample.reason}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted">
                      {formatTime(sample.at)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      {/* Elle ruh hali seçimi — hem test hem de "Elçin'i neşelendir" düğmesi. */}
      <div>
        <SectionTitle>Elçin'in halini değiştir</SectionTitle>
        <Panel>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={option === mood ? 'primary' : 'subtle'}
                onClick={() =>
                  setMood({ mood: option, intensity: 0.7, reason: 'Sen seçtin' })
                }
              >
                {MOOD_LABEL[option]}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted">
            Seçtiğin hal cihazdaki yüze de yansır.
          </p>
          <Badge tone="accent" className="mt-3">
            Şu an: {MOOD_LABEL[mood]}
          </Badge>
        </Panel>
      </div>
    </div>
  );
}
