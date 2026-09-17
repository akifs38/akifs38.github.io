import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Plus, Send, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/time';
import { MOOD_LABEL } from '@/services/ai/moodEngine';
import { ElcinAvatar } from '@/components/avatar/ElcinAvatar';
import { Badge, Button, EmptyState, Panel, Textarea } from '@/components/ui';
import {
  CHAT_SUGGESTIONS,
  useActiveMessages,
  useChat,
  useElcin,
  useMemories,
  useSettings,
} from '@/stores';

/**
 * Sohbet ekranı.
 *
 * Solda Elçin'in yüzü, ortada konuşma. Yüzün sabit durması kasıtlı: yazışırken
 * karşındakinin ifadesini görmek, baloncukların içinde kaybolmaktan iyidir.
 */
export function ChatPage() {
  const userName = useSettings((state) => state.userName);
  const mood = useElcin((state) => state.mood);
  const animation = useElcin((state) => state.animation);

  const messages = useActiveMessages();
  const thinking = useChat((state) => state.thinking);
  const send = useChat((state) => state.send);
  const newConversation = useChat((state) => state.newConversation);
  const clearAll = useChat((state) => state.clearAll);

  const memories = useMemories((state) => state.memories);
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Yeni mesaj gelince en alta kay; okurken yukarı kaçmasın diye yalnızca
  // mesaj sayısı ya da yazma durumu değiştiğinde.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, thinking]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || thinking) return;
    setDraft('');
    void send(text);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[260px_1fr]">
      {/* Elçin paneli */}
      <aside className="hidden lg:block">
        <Panel className="sticky top-20 flex flex-col items-center gap-3 px-5 py-6 text-center">
          <ElcinAvatar
            mood={thinking ? 'thinking' : mood}
            animation={thinking ? 'think' : animation}
            size={130}
          />
          <div>
            <p className="text-sm font-semibold text-ink">Elçin</p>
            <p className="text-xs text-muted">{MOOD_LABEL[thinking ? 'thinking' : mood]}</p>
          </div>
          <Badge tone="accent">
            <Brain size={11} /> {memories.length} anı
          </Badge>
          <div className="mt-2 flex w-full flex-col gap-1.5">
            <Button size="sm" block icon={<Plus size={13} />} onClick={newConversation}>
              Yeni sohbet
            </Button>
            <Button size="sm" block variant="ghost" icon={<Trash2 size={13} />} onClick={clearAll}>
              Geçmişi temizle
            </Button>
          </div>
        </Panel>
      </aside>

      {/* Konuşma */}
      <Panel padded={false} className="flex h-[calc(100dvh-10rem)] flex-col lg:h-[calc(100dvh-7.5rem)]">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.length === 0 && !thinking ? (
            <EmptyState
              icon={<ElcinAvatar mood="curious" animation="blink" size={110} trackCursor={false} />}
              title={`Merhaba ${userName} 🌸`}
              description="Aklından geçeni yazabilirsin. Kısa da olur, uzun da."
            />
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className={cn('flex', message.author === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[70%]',
                    message.author === 'user'
                      ? 'rounded-br-md bg-linear-to-br from-accent to-accent-2 text-white'
                      : 'rounded-bl-md border border-line/35 bg-surface-2/70 text-ink',
                  )}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                  <div
                    className={cn(
                      'mt-1.5 flex items-center gap-2 text-[10px]',
                      message.author === 'user' ? 'text-white/70' : 'text-muted',
                    )}
                  >
                    <span className="tabular-nums">{formatTime(message.createdAt)}</span>
                    {message.mood && message.author === 'elcin' && (
                      <span>· {MOOD_LABEL[message.mood]}</span>
                    )}
                    {message.usedMemoryIds && message.usedMemoryIds.length > 0 && (
                      <span title="Bu cevapta hatırladıklarını kullandı">· 🧠</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}

          {/* Yazıyor göstergesi */}
          <AnimatePresence>
            {thinking && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-line/35 bg-surface-2/70 px-4 py-3">
                  {[0, 1, 2].map((index) => (
                    <motion.span
                      key={index}
                      className="h-1.5 w-1.5 rounded-full bg-accent"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: index * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endRef} />
        </div>

        {/* Öneriler — yalnızca boş sohbette. */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-6">
            {CHAT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => void send(suggestion)}
                className="rounded-full border border-line/40 bg-surface-2/50 px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/40 hover:text-ink"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Giriş */}
        <form
          onSubmit={submit}
          className="flex items-end gap-2 border-t border-line/25 px-4 py-3 sm:px-6"
        >
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter gönderir, Shift+Enter satır atlar — yazışma alışkanlığı bu.
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={`Elçin'e bir şey yaz, ${userName}…`}
            className="max-h-32 min-h-11 flex-1"
            aria-label="Mesajın"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!draft.trim() || thinking}
            aria-label="Gönder"
            className="h-11 w-11 shrink-0 rounded-xl p-0"
          >
            <Send size={16} />
          </Button>
        </form>
      </Panel>
    </div>
  );
}
