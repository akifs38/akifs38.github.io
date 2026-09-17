import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { downloadJson } from '@/lib/download';
import { formatRelative } from '@/lib/time';
import { MEMORY_KIND_ICON, MEMORY_KIND_LABEL } from '@/services/ai/memoryEngine';
import { MEMORY_KINDS, type Memory, type MemoryKind } from '@/types';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Panel,
  Select,
  Textarea,
  toast,
} from '@/components/ui';
import { useMemories, useSettings, useVisibleMemories } from '@/stores';

/**
 * Hafıza ekranı (11. ve 66. madde).
 *
 * Buradaki asıl iddia şu: Elçin'in hatırladığı her şey görünür ve
 * silinebilir olmalı. Kullanıcının kontrol edemediği bir hafıza, dostluk
 * değil gözetimdir. Bu yüzden ekle/düzenle/sil/ara/dışa aktar hepsi burada.
 */
export function MemoryPage() {
  const userName = useSettings((state) => state.userName);
  const memories = useMemories((state) => state.memories);
  const visible = useVisibleMemories();
  const query = useMemories((state) => state.query);
  const setQuery = useMemories((state) => state.setQuery);
  const kindFilter = useMemories((state) => state.kindFilter);
  const setKindFilter = useMemories((state) => state.setKindFilter);
  const add = useMemories((state) => state.add);
  const update = useMemories((state) => state.update);
  const remove = useMemories((state) => state.remove);
  const clear = useMemories((state) => state.clear);

  const [editing, setEditing] = useState<Memory | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const grouped = MEMORY_KINDS.map((kind) => ({
    kind,
    items: visible.filter((memory) => memory.kind === kind),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">🧠 Elçin'in hafızası</h1>
          <p className="mt-1 text-sm text-muted">
            {userName} hakkında hatırladığı {memories.length} şey. Hepsi senin kontrolünde.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            icon={<Download size={14} />}
            onClick={() => {
              downloadJson('elcin-hafiza.json', memories);
              toast.success('Hafıza dışa aktarıldı.');
            }}
          >
            Dışa aktar
          </Button>
          <Button size="sm" variant="primary" icon={<Plus size={14} />} onClick={() => setCreating(true)}>
            Ekle
          </Button>
        </div>
      </header>

      {/* Arama ve filtre */}
      <Panel className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Hafızada ara…"
            className="pl-9"
            aria-label="Hafızada ara"
          />
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          <FilterChip active={kindFilter === 'all'} onClick={() => setKindFilter('all')}>
            Hepsi
          </FilterChip>
          {MEMORY_KINDS.map((kind) => (
            <FilterChip
              key={kind}
              active={kindFilter === kind}
              onClick={() => setKindFilter(kind)}
            >
              {MEMORY_KIND_ICON[kind]} {MEMORY_KIND_LABEL[kind]}
            </FilterChip>
          ))}
        </div>
      </Panel>

      {visible.length === 0 ? (
        <Panel>
          <EmptyState
            icon="🧠"
            title={query ? 'Bu aramaya uyan bir şey yok' : 'Hafıza şu an boş'}
            description={
              query
                ? 'Başka bir kelime deneyebilirsin.'
                : 'Elçin ile konuştukça buraya kendiliğinden bir şeyler eklenecek.'
            }
          />
        </Panel>
      ) : (
        grouped.map((group) => (
          <section key={group.kind}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {MEMORY_KIND_ICON[group.kind]} {MEMORY_KIND_LABEL[group.kind]}
            </h2>
            <Panel padded={false}>
              <ul className="divide-y divide-line/20">
                {group.items.map((memory) => (
                  <motion.li
                    key={memory.id}
                    layout
                    className="group flex items-start gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed text-ink">{memory.content}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-muted">
                          {formatRelative(memory.updatedAt)}
                        </span>
                        <ImportanceBar value={memory.importance} />
                        {memory.tags.map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <button
                        onClick={() => setEditing(memory)}
                        aria-label="Düzenle"
                        className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          remove(memory.id);
                          toast.info('Bu anı silindi.');
                        }}
                        aria-label="Sil"
                        className="rounded-lg p-1.5 text-muted hover:bg-danger/12 hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </Panel>
          </section>
        ))
      )}

      {memories.length > 0 && (
        <div className="pt-2 text-center">
          <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
            Tüm hafızayı temizle
          </Button>
        </div>
      )}

      <MemoryForm
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={(draft) => {
          add(draft);
          toast.success('Elçin bunu hatırlayacak.');
          setCreating(false);
        }}
      />

      <MemoryForm
        open={Boolean(editing)}
        initial={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSubmit={(draft) => {
          if (editing) update(editing.id, draft);
          setEditing(null);
        }}
      />

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="Hafızayı temizle">
        <p className="text-sm leading-relaxed text-muted">
          Elçin'in hatırladığı her şey silinecek. Bu geri alınamaz — ama istersen önce dışa
          aktarabilirsin.
        </p>
        <div className="mt-5 flex gap-2">
          <Button block onClick={() => setConfirmClear(false)}>
            Vazgeç
          </Button>
          <Button
            block
            variant="danger"
            onClick={() => {
              clear();
              setConfirmClear(false);
              toast.warn('Hafıza temizlendi.');
            }}
          >
            Sil
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors',
        active
          ? 'border-accent/40 bg-accent/12 text-accent'
          : 'border-line/40 bg-surface-2/40 text-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

/** Önem puanını üç kademeli küçük bir çubuğa indirger. */
function ImportanceBar({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" title={`Önem: ${Math.round(value * 100)}%`}>
      {[0.34, 0.67, 1].map((step) => (
        <span
          key={step}
          className={cn(
            'h-1 w-2.5 rounded-full',
            value >= step ? 'bg-accent/70' : 'bg-line/50',
          )}
        />
      ))}
    </span>
  );
}

function MemoryForm({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial?: Memory;
  onClose: () => void;
  onSubmit: (draft: { kind: MemoryKind; content: string; importance: number; tags: string[] }) => void;
}) {
  const [content, setContent] = useState(initial?.content ?? '');
  const [kind, setKind] = useState<MemoryKind>(initial?.kind ?? 'fact');
  const [importance, setImportance] = useState(initial?.importance ?? 0.7);
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));

  // Modal her açıldığında düzenlenen kayda göre yeniden doldurulur.
  const [seeded, setSeeded] = useState<string | null>(null);
  if (open && seeded !== (initial?.id ?? 'new')) {
    setSeeded(initial?.id ?? 'new');
    setContent(initial?.content ?? '');
    setKind(initial?.kind ?? 'fact');
    setImportance(initial?.importance ?? 0.7);
    setTags((initial?.tags ?? []).join(', '));
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Anıyı düzenle' : 'Yeni anı'}>
      <div className="space-y-4">
        <Field label="Ne hatırlansın?">
          <Textarea
            rows={3}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Örn: Sabahları kahve içmeyi seviyor."
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tür">
            <Select value={kind} onChange={(event) => setKind(event.target.value as MemoryKind)}>
              {MEMORY_KINDS.map((option) => (
                <option key={option} value={option}>
                  {MEMORY_KIND_LABEL[option]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={`Önem — ${Math.round(importance * 100)}%`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={importance}
              onChange={(event) => setImportance(Number(event.target.value))}
              className="mt-3 w-full accent-[hsl(var(--accent))]"
              aria-label="Önem"
            />
          </Field>
        </div>

        <Field label="Etiketler" hint="Virgülle ayır: kahve, sabah">
          <Input value={tags} onChange={(event) => setTags(event.target.value)} />
        </Field>

        <Button
          variant="primary"
          block
          disabled={!content.trim()}
          onClick={() =>
            onSubmit({
              kind,
              content: content.trim(),
              importance,
              tags: tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
            })
          }
        >
          {initial ? 'Kaydet' : 'Hatırlat'}
        </Button>
      </div>
    </Modal>
  );
}
