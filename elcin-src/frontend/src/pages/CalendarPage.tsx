import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDayMonth } from '@/lib/time';
import type { CalendarEventKind } from '@/types';
import { Badge, Button, EmptyState, Field, Input, Modal, Panel, Select, Textarea, Toggle, toast } from '@/components/ui';
import { EVENT_ICON, EVENT_LABEL, useCalendar, useSettings, useUpcoming } from '@/stores';

/**
 * Takvim ekranı.
 *
 * Bu bir ajanda değil: yalnızca "günler" tutulur — doğum günü, yıldönümü,
 * hatırlatma. Zamanı geldiğinde Elçin bunları kendiliğinden anar (sohbet
 * bağlamına `occasion` olarak girer).
 */
export function CalendarPage() {
  const userName = useSettings((state) => state.userName);
  const events = useCalendar((state) => state.events);
  const upcoming = useUpcoming(20);
  const add = useCalendar((state) => state.add);
  const remove = useCalendar((state) => state.remove);

  const [creating, setCreating] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">📅 Özel günler</h1>
          <p className="mt-1 text-sm text-muted">
            Elçin bu günleri hatırlar ve zamanı gelince {userName}'e söyler.
          </p>
        </div>
        <Button size="sm" variant="primary" icon={<Plus size={14} />} onClick={() => setCreating(true)}>
          Gün ekle
        </Button>
      </header>

      {upcoming.length === 0 ? (
        <Panel>
          <EmptyState
            icon="📅"
            title="Takvim boş"
            description="Bir doğum günü ya da hatırlatma ekleyince Elçin o günü unutmayacak."
          />
        </Panel>
      ) : (
        <div className="space-y-2.5">
          {upcoming.map(({ event, date, inDays }, index) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Panel
                className={cn(
                  'group flex items-center gap-4 px-5 py-4',
                  inDays === 0 && 'border-accent/40 bg-accent/6',
                )}
              >
                <span className="text-2xl">{EVENT_ICON[event.kind]}</span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">{event.title}</p>
                    <Badge tone={inDays === 0 ? 'accent' : 'neutral'}>{EVENT_LABEL[event.kind]}</Badge>
                    {event.recurring && <Badge>Her yıl</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDayMonth(date.toISOString())} ·{' '}
                    {inDays === 0 ? 'bugün' : inDays === 1 ? 'yarın' : `${inDays} gün sonra`}
                  </p>
                  {event.note && <p className="mt-1 text-[11px] text-muted">{event.note}</p>}
                  {event.message && (
                    <p className="mt-1.5 rounded-lg border border-line/30 bg-surface-2/50 px-3 py-2 text-[11px] italic text-muted">
                      Elçin diyecek ki: “{event.message}”
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    remove(event.id);
                    toast.info('Gün silindi.');
                  }}
                  aria-label="Sil"
                  className="shrink-0 rounded-lg p-2 text-muted opacity-0 transition-opacity hover:bg-danger/12 hover:text-danger group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </Panel>
            </motion.div>
          ))}
        </div>
      )}

      <p className="text-center text-[11px] text-muted">
        Toplam {events.length} kayıtlı gün.
      </p>

      <EventForm
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={(event) => {
          add(event);
          setCreating(false);
          toast.success('Elçin bu günü unutmayacak.');
        }}
      />
    </div>
  );
}

const KINDS: CalendarEventKind[] = ['birthday', 'anniversary', 'special', 'reminder'];

function EventForm({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: {
    kind: CalendarEventKind;
    title: string;
    date: string;
    recurring: boolean;
    note?: string;
    message?: string;
  }) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [kind, setKind] = useState<CalendarEventKind>('special');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [recurring, setRecurring] = useState(true);
  const [message, setMessage] = useState('');

  return (
    <Modal open={open} onClose={onClose} title="Yeni özel gün">
      <div className="space-y-4">
        <Field label="Ne için?">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Örn: Doğum günü"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tür">
            <Select value={kind} onChange={(event) => setKind(event.target.value as CalendarEventKind)}>
              {KINDS.map((option) => (
                <option key={option} value={option}>
                  {EVENT_ICON[option]} {EVENT_LABEL[option]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tarih">
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
        </div>

        <Toggle
          checked={recurring}
          onChange={setRecurring}
          label="Her yıl tekrarlansın"
          description="Doğum günleri ve yıldönümleri için."
        />

        <Field label="Elçin ne desin?" hint="Boş bırakırsan kendi cümlesini kurar.">
          <Textarea
            rows={2}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Doğum günün kutlu olsun 🌸"
          />
        </Field>

        <Button
          variant="primary"
          block
          disabled={!title.trim()}
          onClick={() =>
            onSubmit({
              kind,
              title: title.trim(),
              date,
              recurring,
              message: message.trim() || undefined,
            })
          }
        >
          Ekle
        </Button>
      </div>
    </Modal>
  );
}
