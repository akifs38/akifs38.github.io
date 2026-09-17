import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { config } from '@/config';
import { formatFull, formatRelative } from '@/lib/time';
import type { Surprise } from '@/types';
import { ElcinAvatar } from '@/components/avatar/ElcinAvatar';
import { Badge, Button, Modal, Panel, SectionTitle, toast } from '@/components/ui';
import { useChat, useElcin, useSurprises } from '@/stores';

/**
 * Sürprizler.
 *
 * Bazı kutular açık, bazıları kilitli. Kilit koşulları gerçek: sohbet sayısı,
 * tarih, gizli dokunuş. Böylece burası bir liste değil, zamanla açılan küçük
 * bir hediye rafı olur.
 */
export function SurprisesPage() {
  const surprises = useSurprises((state) => state.surprises);
  const open = useSurprises((state) => state.open);
  const unlock = useSurprises((state) => state.unlock);
  const refreshLocks = useSurprises((state) => state.refreshLocks);
  const developerMessages = useSurprises((state) => state.developerMessages);
  const markRead = useSurprises((state) => state.markRead);

  const secretUnlocked = useElcin((state) => state.secretUnlocked);
  const conversationCount = useChat((state) => state.conversations.length);
  const messageCount = useChat((state) => state.messages.length);

  const [opened, setOpened] = useState<Surprise | null>(null);
  const [letter, setLetter] = useState<(typeof developerMessages)[number] | null>(null);

  /* Kilit koşulları tek yerde değerlendirilir: zamanı gelenler, yeterince
     konuşulanlar ve gizli modu bulanlar açılır. */
  useEffect(() => {
    refreshLocks();
    if (messageCount >= 6 || conversationCount > 1) unlock('sur_animasyon');
    if (secretUnlocked) unlock('sur_egg');
  }, [refreshLocks, unlock, messageCount, conversationCount, secretUnlocked]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink">🎁 Sürprizler</h1>
        <p className="mt-1 text-sm text-muted">
          Bazıları şimdi açık, bazıları zamanla açılacak.
        </p>
      </header>

      {/* Akif'ten mesajlar */}
      {developerMessages.length > 0 && (
        <section>
          <SectionTitle>Akif'ten</SectionTitle>
          <div className="space-y-2.5">
            {developerMessages.map((message) => (
              <Panel
                key={message.id}
                className={cn(
                  'flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:border-accent/40',
                  !message.readAt && 'border-accent/35 bg-accent/6',
                )}
                onClick={() => {
                  setLetter(message);
                  markRead(message.id);
                }}
              >
                <span className="mt-0.5 text-accent">
                  <Mail size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">{message.title}</p>
                    {!message.readAt && <Badge tone="accent">Yeni</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                    {message.body}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">{formatRelative(message.createdAt)}</p>
                </div>
              </Panel>
            ))}
          </div>
        </section>
      )}

      {/* Kutular */}
      <section>
        <SectionTitle>Kutular</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {surprises.map((surprise, index) => (
            <motion.button
              key={surprise.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              disabled={surprise.locked}
              onClick={() => {
                const result = open(surprise.id);
                if (result) setOpened(result);
                else toast.info('Bu kutu henüz kilitli.');
              }}
              className={cn(
                'panel group relative overflow-hidden px-5 py-6 text-left transition-all',
                surprise.locked
                  ? 'cursor-not-allowed opacity-60'
                  : 'hover:border-accent/45 hover:shadow-lg active:scale-[0.99]',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-3xl">{surprise.locked ? '🔒' : KIND_EMOJI[surprise.kind]}</span>
                {surprise.openedAt ? (
                  <Badge>Açıldı</Badge>
                ) : surprise.locked ? (
                  <Badge tone="neutral">
                    <Lock size={10} /> Kilitli
                  </Badge>
                ) : (
                  <Badge tone="accent">
                    <Sparkles size={10} /> Hazır
                  </Badge>
                )}
              </div>

              <p className="mt-3 text-sm font-semibold text-ink">{surprise.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {surprise.locked ? surprise.hint : 'Açmak için dokun.'}
              </p>
              {surprise.locked && surprise.unlocksAt && (
                <p className="mt-2 text-[10px] text-muted">
                  Açılış: {formatFull(surprise.unlocksAt)}
                </p>
              )}
            </motion.button>
          ))}
        </div>
      </section>

      <p className="pb-2 text-center text-[11px] text-muted">
        Bu küçük dost {config.app.developer} tarafından yapıldı.
      </p>

      {/* Açılan kutu */}
      <Modal open={Boolean(opened)} onClose={() => setOpened(null)} title={opened?.title}>
        <div className="space-y-4 text-center">
          <ElcinAvatar
            mood={opened?.kind === 'easter_egg' ? 'love' : 'happy'}
            animation={opened?.kind === 'easter_egg' ? 'heart' : 'smile'}
            size={120}
            trackCursor={false}
            className="mx-auto"
          />
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{opened?.body}</p>
          <Button variant="primary" block onClick={() => setOpened(null)}>
            Kapat
          </Button>
        </div>
      </Modal>

      {/* Mektup */}
      <Modal open={Boolean(letter)} onClose={() => setLetter(null)} title={letter?.title}>
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{letter?.body}</p>
        <p className="mt-4 text-[11px] text-muted">
          {letter ? formatFull(letter.createdAt) : ''}
        </p>
        <Button variant="primary" block className="mt-4" onClick={() => setLetter(null)}>
          Kapat
        </Button>
      </Modal>
    </div>
  );
}

const KIND_EMOJI: Record<Surprise['kind'], string> = {
  message: '💌',
  animation: '✨',
  note: '📝',
  easter_egg: '🥚',
};
