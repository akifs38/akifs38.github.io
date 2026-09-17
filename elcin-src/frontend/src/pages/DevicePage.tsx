import { cn } from '@/lib/cn';
import { formatRelative, formatUptime } from '@/lib/time';
import { STATE_LABEL } from '@/services/device';
import type { AnimationName } from '@/types';
import { ACTIVITY_ICON } from './activityMeta';
import { Badge, Button, EmptyState, Panel, SectionTitle, StatTile, StatusDot } from '@/components/ui';
import {
  signalBars,
  useActivity,
  useDevice,
  useVisibleActivities,
  type ActivityRange,
} from '@/stores';
import { config } from '@/config';

/**
 * Cihaz ekranı.
 *
 * Elçin'in bedeni: bağlantı, çevre birimleri, sinyal, çalışma süresi ve
 * web'den doğrudan kontrol. Buradaki düğmeler gerçek komut gönderir —
 * simülatörde de, gerçek cihazda da aynı yolu izler.
 */

const CONTROLS: { animation: AnimationName; emoji: string; label: string }[] = [
  { animation: 'smile', emoji: '😊', label: 'Gülümse' },
  { animation: 'laugh', emoji: '😂', label: 'Gül' },
  { animation: 'blink', emoji: '👀', label: 'Göz kırp' },
  { animation: 'heart', emoji: '❤️', label: 'Kalp' },
  { animation: 'surprise', emoji: '😮', label: 'Şaşır' },
  { animation: 'think', emoji: '🤔', label: 'Düşün' },
  { animation: 'sleep', emoji: '😴', label: 'Uyut' },
  { animation: 'wake', emoji: '☀️', label: 'Uyandır' },
];

const RANGES: { id: ActivityRange; label: string }[] = [
  { id: 'today', label: 'Bugün' },
  { id: 'week', label: 'Bu hafta' },
  { id: 'month', label: 'Bu ay' },
  { id: 'all', label: 'Tümü' },
];

export function DevicePage() {
  const status = useDevice((state) => state.status);
  const state = useDevice((state) => state.state);
  const online = useDevice((state) => state.online);
  const send = useDevice((state) => state.send);
  const transport = useDevice((state) => state.transport);

  const activities = useVisibleActivities();
  const range = useActivity((state) => state.range);
  const setRange = useActivity((state) => state.setRange);

  const bars = status ? signalBars(status.wifiRssi) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">📱 Elçin cihazı</h1>
          <p className="mt-1 text-sm text-muted">
            {status?.deviceId ?? config.device.defaultId} · {STATE_LABEL[state]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {transport?.simulated && <Badge tone="warn">Simülasyon</Badge>}
          <Badge tone={online ? 'ok' : 'neutral'}>
            <StatusDot online={online} /> {online ? 'Çevrimiçi' : 'Çevrimdışı'}
          </Badge>
        </div>
      </header>

      {/* Çevre birimleri */}
      <Panel title="Donanım" subtitle="Cihazın bildirdiği canlı durum">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Wi-Fi', ok: status?.peripherals.wifi ?? false },
            { label: 'OLED', ok: status?.peripherals.oled ?? false },
            { label: 'Touch', ok: status?.peripherals.touch ?? false },
            { label: 'Cloud', ok: status?.peripherals.cloud ?? false },
          ].map((item) => (
            <div key={item.label} className="panel-flat flex items-center gap-2.5 px-3 py-3">
              <span
                className={cn('h-2.5 w-2.5 rounded-full', item.ok ? 'bg-ok' : 'bg-muted/40')}
              />
              <span className="text-sm text-ink">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Sinyal"
            value={
              <span className="flex items-center gap-2">
                <span className="flex items-end gap-0.5">
                  {[1, 2, 3, 4].map((step) => (
                    <span
                      key={step}
                      className={cn(
                        'w-1.5 rounded-sm',
                        step <= bars ? 'bg-accent' : 'bg-line/50',
                      )}
                      style={{ height: 5 + step * 3 }}
                    />
                  ))}
                </span>
                <span className="text-sm tabular-nums text-muted">
                  {status ? `${status.wifiRssi} dBm` : '—'}
                </span>
              </span>
            }
            hint={status?.ssid}
          />
          <StatTile
            label="Çalışma süresi"
            value={status ? formatUptime(status.uptime) : '—'}
            hint={status ? `Son görülme ${formatRelative(status.lastSeen)}` : undefined}
          />
          <StatTile label="Firmware" value={status?.firmware ?? '—'} hint="Güncel sürüm" />
        </div>
      </Panel>

      {/* Uzaktan kontrol */}
      <Panel title="Elçin'i oynat" subtitle="Düğmeye bastığında cihazdaki yüz değişir">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CONTROLS.map((control) => (
            <button
              key={control.animation}
              disabled={!online}
              onClick={() =>
                send({ type: 'device_command', command: 'animation', animation: control.animation })
              }
              className={cn(
                'panel-flat flex flex-col items-center gap-1.5 px-3 py-4 transition-all',
                'hover:border-accent/40 hover:bg-surface-2 active:scale-[0.97]',
                'disabled:cursor-not-allowed disabled:opacity-40',
              )}
            >
              <span className="text-2xl">{control.emoji}</span>
              <span className="text-xs font-medium text-ink">{control.label}</span>
            </button>
          ))}
        </div>
        {!online && (
          <p className="mt-3 text-center text-xs text-muted">
            Elçin şu an bağlı değil. Bağlantı kurulduğunda düğmeler tekrar çalışacak.
          </p>
        )}
      </Panel>

      {/* Etkinlik günlüğü */}
      <div>
        <SectionTitle
          action={
            <div className="flex gap-1">
              {RANGES.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setRange(option.id)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] transition-colors',
                    range === option.id
                      ? 'bg-accent/12 text-accent'
                      : 'text-muted hover:text-ink',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          }
        >
          Etkinlik
        </SectionTitle>
        <Panel padded={false}>
          {activities.length === 0 ? (
            <EmptyState icon="🗒️" title="Bu aralıkta kayıt yok" />
          ) : (
            <ul className="divide-y divide-line/20">
              {activities.slice(0, 40).map((activity) => (
                <li key={activity.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-base">{ACTIVITY_ICON[activity.kind]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{activity.title}</p>
                    {activity.detail && (
                      <p className="truncate text-[11px] text-muted">{activity.detail}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted">
                    {formatRelative(activity.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <p className="text-sm font-medium text-ink">Cihazı yeniden başlat</p>
          <p className="text-xs text-muted">Elçin birkaç saniyeliğine uyuyup geri dönecek.</p>
        </div>
        <Button
          variant="danger"
          size="sm"
          disabled={!online}
          onClick={() => send({ type: 'device_command', command: 'reboot' })}
        >
          Yeniden başlat
        </Button>
      </Panel>
    </div>
  );
}
