import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { config } from '@/config';
import { downloadJson } from '@/lib/download';
import { clearAll } from '@/lib/storage';
import type { ThemeMode } from '@/types';
import { cn } from '@/lib/cn';
import { Button, Field, Input, Modal, Panel, Select, Toggle, toast } from '@/components/ui';
import {
  useActivity,
  useCalendar,
  useChat,
  useElcin,
  useMemories,
  useSettings,
  useSurprises,
} from '@/stores';

/**
 * Ayarlar.
 *
 * Alt kısımdaki veri bölümü 66–67. maddelerin karşılığı: kullanıcı kendi
 * verisini görebilmeli, indirebilmeli ve tamamen silebilmeli. Bu bir ek
 * özellik değil, sistemin şartı.
 */
export function SettingsPage() {
  const settings = useSettings();
  const set = useSettings((state) => state.set);
  const setRole = useSettings((state) => state.setRole);

  const memories = useMemories((state) => state.memories);
  const messages = useChat((state) => state.messages);
  const conversations = useChat((state) => state.conversations);
  const events = useCalendar((state) => state.events);
  const activities = useActivity((state) => state.activities);
  const history = useElcin((state) => state.history);
  const surprises = useSurprises((state) => state.surprises);

  const [confirmWipe, setConfirmWipe] = useState(false);

  const exportAll = () => {
    downloadJson('elcin-verilerim.json', {
      exportedAt: new Date().toISOString(),
      app: { name: config.app.name, version: config.app.version },
      settings,
      memories,
      conversations,
      messages,
      calendar: events,
      activities,
      moodHistory: history,
      surprises,
    });
    toast.success('Verilerin indirildi.');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink">⚙️ Ayarlar</h1>
        <p className="mt-1 text-sm text-muted">Elçin'i kendine göre ayarla.</p>
      </header>

      <Panel title="Kişisel">
        <div className="space-y-4">
          <Field label="Elçin sana nasıl seslensin?">
            <Input
              value={settings.userName}
              onChange={(event) => set('userName', event.target.value)}
              placeholder={config.app.defaultUserName}
            />
          </Field>

          <Field label="Tema">
            <div className="flex gap-2">
              {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => set('theme', mode)}
                  className={cn(
                    'flex-1 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                    settings.theme === mode
                      ? 'border-accent/45 bg-accent/12 text-accent'
                      : 'border-line/40 bg-surface-2/40 text-muted hover:text-ink',
                  )}
                >
                  {THEME_LABEL[mode]}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Panel>

      <Panel title="Davranış" padded={false}>
        <div className="divide-y divide-line/20 px-5">
          <Toggle
            checked={settings.autoMemory}
            onChange={(value) => set('autoMemory', value)}
            label="Kendiliğinden hatırlasın"
            description="Konuşmalardan önemli şeyleri hafızaya alsın. Kapatırsan yalnızca senin eklediklerini hatırlar."
          />
          <Toggle
            checked={settings.proactiveMessages}
            onChange={(value) => set('proactiveMessages', value)}
            label="Kendiliğinden konuşsun"
            description="Özel günlerde ve uzun sessizliklerde ilk sözü Elçin söylesin."
          />
          <Toggle
            checked={settings.reduceMotion}
            onChange={(value) => set('reduceMotion', value)}
            label="Hareketi azalt"
            description="Animasyonlar sakinleşir; Elçin yine ifade değiştirir ama daha durgun."
          />
          <Toggle
            checked={settings.soundEnabled}
            onChange={(value) => set('soundEnabled', value)}
            label="Sesler"
            description="İleride eklenecek ses sistemi için hazır. (Şimdilik sessiz.)"
          />
        </div>
      </Panel>

      <Panel title="Bağlantı" subtitle="Backend gelene kadar demo motoru çalışır">
        <div className="space-y-4">
          <Field
            label="AI sağlayıcısı"
            hint={
              config.api.baseUrl
                ? 'Bulut seçilirse istekler backend üzerinden gider.'
                : 'Backend adresi tanımlı değil, demo motoru kullanılıyor.'
            }
          >
            <Select
              value={settings.aiProvider}
              onChange={(event) => set('aiProvider', event.target.value as 'mock' | 'cloud')}
            >
              <option value="mock">Demo motoru (ücretsiz)</option>
              <option value="cloud">Bulut modeli</option>
            </Select>
          </Field>

          <Field
            label="Cihaz bağlantısı"
            hint={config.api.wsUrl ? undefined : 'WebSocket adresi tanımlı değil, simülasyon çalışıyor.'}
          >
            <Select
              value={settings.deviceTransport}
              onChange={(event) => set('deviceTransport', event.target.value as 'mock' | 'live')}
            >
              <option value="mock">Simülasyon</option>
              <option value="live">Gerçek cihaz</option>
            </Select>
          </Field>

          <Toggle
            checked={settings.role === 'developer'}
            onChange={(value) => setRole(value ? 'developer' : 'user')}
            label="Geliştirici modu"
            description={`${config.app.developer} için: cihaz günlükleri, simülasyon araçları, firmware.`}
          />
        </div>
      </Panel>

      <Panel title="Verilerin" subtitle="Her şey bu tarayıcıda duruyor">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Anı" value={memories.length} />
          <Stat label="Mesaj" value={messages.length} />
          <Stat label="Özel gün" value={events.length} />
          <Stat label="Etkinlik" value={activities.length} />
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button block icon={<Download size={15} />} onClick={exportAll}>
            Verilerimi indir
          </Button>
          <Button block variant="danger" icon={<Trash2 size={15} />} onClick={() => setConfirmWipe(true)}>
            Her şeyi sil
          </Button>
        </div>
      </Panel>

      <p className="pb-2 text-center text-[11px] leading-relaxed text-muted">
        {config.app.name} v{config.app.version} · {config.app.developer} tarafından
        <br />
        {config.app.defaultUserName} için yapıldı 🌸
      </p>

      <Modal open={confirmWipe} onClose={() => setConfirmWipe(false)} title="Her şeyi sil">
        <p className="text-sm leading-relaxed text-muted">
          Hafıza, sohbetler, özel günler ve ayarlar silinecek. Elçin seni ilk günkü gibi
          karşılayacak. Bu geri alınamaz.
        </p>
        <div className="mt-5 flex gap-2">
          <Button block onClick={() => setConfirmWipe(false)}>
            Vazgeç
          </Button>
          <Button
            block
            variant="danger"
            onClick={() => {
              clearAll();
              // Depolama boşaldıktan sonra temiz bir başlangıç için sayfayı
              // yeniden yüklemek, her store'u tek tek sıfırlamaktan güvenli.
              window.location.reload();
            }}
          >
            Sil
          </Button>
        </div>
      </Modal>
    </div>
  );
}

const THEME_LABEL: Record<ThemeMode, string> = {
  dark: '🌙 Koyu',
  light: '☀️ Açık',
  system: '💻 Sistem',
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel-flat px-3 py-3 text-center">
      <p className="text-lg font-semibold tabular-nums text-ink">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
