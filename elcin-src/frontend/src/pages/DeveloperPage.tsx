import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { config } from '@/config';
import { formatFull, formatTime } from '@/lib/time';
import { seedFirmware } from '@/services/api/seed';
import { STATE_LABEL, TOUCH_LABEL } from '@/services/device';
import type { DeviceState, LogLevel, TouchGesture } from '@/types';
import { Badge, Button, EmptyState, Field, Input, Panel, SectionTitle, Textarea, toast } from '@/components/ui';
import { useActivity, useDevice, useSettings, useSurprises } from '@/stores';

/**
 * Geliştirici paneli (31. madde).
 *
 * Yalnızca geliştirici rolünde görünür. Buradaki her şey Gülçin'in
 * görmeyeceği şeyler: ham günlükler, simülasyon düğmeleri, firmware ve
 * "Akif'ten mesaj" yazma alanı.
 */

const GESTURES: TouchGesture[] = ['single_tap', 'double_tap', 'long_press', 'very_long_press'];
const STATES: DeviceState[] = ['idle', 'thinking', 'responding', 'sleeping', 'error'];

const LOG_COLOR: Record<LogLevel, string> = {
  debug: 'text-muted',
  info: 'text-ink',
  warn: 'text-warn',
  error: 'text-danger',
};

export function DeveloperPage() {
  const role = useSettings((state) => state.role);

  const logs = useActivity((state) => state.logs);
  const clearActivity = useActivity((state) => state.clear);

  const status = useDevice((state) => state.status);
  const state = useDevice((state) => state.state);
  const online = useDevice((state) => state.online);
  const transport = useDevice((state) => state.transport);
  const simulate = useDevice((state) => state.simulate);
  const setSimulatedOnline = useDevice((state) => state.setSimulatedOnline);
  const send = useDevice((state) => state.send);

  const addDeveloperMessage = useSurprises((state) => state.addDeveloperMessage);
  const developerMessages = useSurprises((state) => state.developerMessages);
  const removeDeveloperMessage = useSurprises((state) => state.removeDeveloperMessage);

  const [title, setTitle] = useState('Akif’ten mesaj');
  const [body, setBody] = useState('');

  const firmware = seedFirmware();
  const latest = firmware[firmware.length - 1];
  const current = status?.firmware ?? config.device.firmware;
  const updateAvailable = latest && latest.version !== current;

  // Rol düşerse panel kendini kapatır; adres çubuğundan girilse bile.
  if (role !== 'developer') return <Navigate to="/ayarlar" replace />;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">🛠 Geliştirici</h1>
          <p className="mt-1 text-sm text-muted">{config.app.developer}</p>
        </div>
        <Badge tone={online ? 'ok' : 'warn'}>
          {STATE_LABEL[state]} · {transport?.simulated ? 'simülasyon' : 'canlı'}
        </Badge>
      </header>

      {/* Mock mode (55. madde) */}
      <Panel title="Simülasyon" subtitle="Cihaz bağlı olmadan sistemi sürmek için">
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-xs text-muted">Dokunma üret</p>
            <div className="flex flex-wrap gap-2">
              {GESTURES.map((gesture) => (
                <Button key={gesture} size="sm" onClick={() => simulate(gesture)}>
                  {TOUCH_LABEL[gesture]}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs text-muted">Durum zorla</p>
            <div className="flex flex-wrap gap-2">
              {STATES.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={state === option ? 'primary' : 'subtle'}
                  onClick={() => send({ type: 'device_command', command: 'state', state: option })}
                >
                  {STATE_LABEL[option]}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs text-muted">Bağlantı</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={online ? 'subtle' : 'primary'} onClick={() => setSimulatedOnline(true)}>
                Çevrimiçi yap
              </Button>
              <Button size="sm" variant={online ? 'danger' : 'subtle'} onClick={() => setSimulatedOnline(false)}>
                Bağlantıyı kopar
              </Button>
              <Button size="sm" onClick={() => send({ type: 'device_command', command: 'reboot' })}>
                Yeniden başlat
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      {/* Ham durum */}
      <Panel title="Cihaz durumu" subtitle="Son heartbeat">
        {status ? (
          <pre className="overflow-x-auto rounded-xl border border-line/30 bg-bg-deep/60 p-4 text-[11px] leading-relaxed text-muted">
            {JSON.stringify(status, null, 2)}
          </pre>
        ) : (
          <EmptyState icon="📡" title="Henüz heartbeat gelmedi" />
        )}
      </Panel>

      {/* Günlükler (53. madde) */}
      <div>
        <SectionTitle
          action={
            <button onClick={clearActivity} className="text-[11px] text-muted hover:text-ink">
              Temizle
            </button>
          }
        >
          Cihaz günlüğü
        </SectionTitle>
        <Panel padded={false}>
          {logs.length === 0 ? (
            <EmptyState icon="🗒️" title="Günlük boş" />
          ) : (
            <div className="max-h-72 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed">
              {logs.map((log) => (
                <p key={log.id} className={cn('flex gap-2', LOG_COLOR[log.level])}>
                  <span className="shrink-0 text-muted">[{formatTime(log.at)}]</span>
                  <span className="shrink-0 uppercase text-muted">{log.level}</span>
                  <span className="min-w-0 break-all">{log.message}</span>
                </p>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Firmware / OTA (35. madde) */}
      <Panel title="Firmware" subtitle="OTA güncellemesi">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-ink">
              Yüklü sürüm: <span className="font-semibold tabular-nums">{current}</span>
            </p>
            {latest && (
              <p className="text-xs text-muted">
                Yayındaki sürüm: <span className="tabular-nums">{latest.version}</span> ·{' '}
                {(latest.size / 1024).toFixed(0)} KB
              </p>
            )}
            {latest && <p className="text-[11px] text-muted">{latest.notes}</p>}
          </div>
          <Button
            variant={updateAvailable ? 'primary' : 'subtle'}
            disabled={!updateAvailable || !online}
            onClick={() => {
              if (!latest) return;
              send({ type: 'device_command', command: 'ota', version: latest.version });
              toast.info(`OTA başlatıldı: v${latest.version}`);
            }}
          >
            {updateAvailable ? 'Güncelle' : 'Güncel'}
          </Button>
        </div>

        <ul className="mt-4 divide-y divide-line/20 border-t border-line/20 pt-1">
          {[...firmware].reverse().map((release) => (
            <li key={release.version} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm tabular-nums text-ink">v{release.version}</p>
                <p className="truncate text-[11px] text-muted">{release.notes}</p>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-muted">{release.checksum}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Akif'ten mesaj (30. madde) */}
      <Panel title="Gülçin'e mesaj bırak" subtitle="Sürprizler sayfasında görünür">
        <div className="space-y-3">
          <Field label="Başlık">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Mesaj">
            <Textarea
              rows={5}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={`${config.app.defaultUserName},\n\numarım bu küçük dost yüzünü biraz olsun güldürür.\n\n❤️`}
            />
          </Field>
          <Button
            variant="primary"
            block
            disabled={!body.trim()}
            onClick={() => {
              addDeveloperMessage({ title: title.trim() || 'Mesaj', body: body.trim() });
              setBody('');
              toast.success('Mesaj bırakıldı.');
            }}
          >
            Mesajı bırak
          </Button>
        </div>

        {developerMessages.length > 0 && (
          <ul className="mt-4 divide-y divide-line/20 border-t border-line/20">
            {developerMessages.map((message) => (
              <li key={message.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-ink">{message.title}</p>
                  <p className="line-clamp-1 text-[11px] text-muted">{message.body}</p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {formatFull(message.createdAt)} ·{' '}
                    {message.readAt ? 'okundu' : 'okunmadı'}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeDeveloperMessage(message.id)}>
                  Sil
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
