import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Gift, MessageCircle, Sparkles } from 'lucide-react';
import { config } from '@/config';
import { greeting, formatRelative } from '@/lib/time';
import { MOOD_LABEL } from '@/services/ai/moodEngine';
import { ElcinAvatar } from '@/components/avatar/ElcinAvatar';
import { Badge, Button, EmptyState, Modal, Panel, SectionTitle, toast } from '@/components/ui';
import { useSecretTaps } from '@/hooks/useSecretTaps';
import {
  useActivity,
  useChat,
  useDevice,
  useElcin,
  useMemories,
  useSettings,
  useSurprises,
  useUpcoming,
  useUnreadDeveloperMessages,
} from '@/stores';
import { ACTIVITY_ICON } from './activityMeta';

/**
 * Ana sayfa — Elçin'in odası.
 *
 * Buraya bilinçli olarak "gösterge paneli" yerleştirilmedi. Ortada Elçin
 * duruyor, çevresinde yalnızca o anki hayata dair birkaç şey var: ne
 * hissettiği, yaklaşan bir gün, son yaptıkları. Sayılar ve grafikler kendi
 * sayfalarında.
 */
export function HomePage() {
  const navigate = useNavigate();
  const userName = useSettings((state) => state.userName);

  const mood = useElcin((state) => state.mood);
  const animation = useElcin((state) => state.animation);
  const reason = useElcin((state) => state.reason);
  const secretUnlocked = useElcin((state) => state.secretUnlocked);
  const unlockSecret = useElcin((state) => state.unlockSecret);
  const play = useElcin((state) => state.play);

  const lastReaction = useDevice((state) => state.lastReaction);
  const online = useDevice((state) => state.online);

  const memories = useMemories((state) => state.memories);
  const activities = useActivity((state) => state.activities);
  const upcoming = useUpcoming(3);
  const unread = useUnreadDeveloperMessages();
  const markRead = useSurprises((state) => state.markRead);
  const messageCount = useChat((state) => state.messages.length);

  const [secretOpen, setSecretOpen] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);

  const onSecret = useSecretTaps(() => {
    unlockSecret();
    setSecretOpen(true);
    play('heart', 4_000);
  });

  /* Elçin'in karşılama cümlesi. Cihazdan gelen tepki varsa o öne geçer:
     az önce dokunulduysa Elçin'in ilk sözü ona dair olmalı. */
  const line = useMemo(() => {
    if (lastReaction && Date.now() - new Date(lastReaction.at).getTime() < 8_000) {
      return lastReaction.text;
    }
    // Günlük hatırlatmalar "özel gün" değildir; karşılamada anılmaz.
    const today = upcoming.find(
      (entry) => entry.inDays === 0 && entry.event.kind !== 'reminder',
    );
    if (today) return `Bugün senin için özel bir gün: ${today.event.title} 🌸`;
    return `${greeting()} ${userName} 🌸`;
  }, [lastReaction, upcoming, userName]);

  // Geliştiriciden okunmamış mesaj varsa kapıda karşılasın.
  useEffect(() => {
    if (unread.length > 0) setLetterOpen(true);
  }, [unread.length]);

  const letter = unread[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Sahne */}
      <section className="panel relative overflow-hidden px-6 py-10 sm:px-10 sm:py-14">
        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <ElcinAvatar
            mood={mood}
            animation={animation}
            size={200}
            className="animate-float"
            onClick={onSecret}
          />

          <div className="space-y-2">
            <AnimatePresence mode="wait">
              <motion.p
                key={line}
                className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                {line}
              </motion.p>
            </AnimatePresence>
            <p className="text-sm text-muted">{reason}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge tone="accent">{MOOD_LABEL[mood]}</Badge>
            <Badge tone={online ? 'ok' : 'neutral'}>
              {online ? 'Cihaz çevrimiçi' : 'Cihaz çevrimdışı'}
            </Badge>
            <Badge>{memories.length} anı</Badge>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button variant="primary" size="lg" icon={<MessageCircle size={17} />} onClick={() => navigate('/sohbet')}>
              Konuş
            </Button>
            <Button size="lg" icon={<Brain size={16} />} onClick={() => navigate('/hafiza')}>
              Hafızası
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Yaklaşan günler */}
        <div className="lg:col-span-1">
          <SectionTitle action={<Link to="/takvim" className="text-[11px] text-accent">Tümü</Link>}>
            Yaklaşan
          </SectionTitle>
          <Panel padded={false}>
            {upcoming.length === 0 ? (
              <EmptyState icon="📅" title="Yaklaşan bir gün yok" />
            ) : (
              <ul className="divide-y divide-line/20">
                {upcoming.map(({ event, inDays }) => (
                  <li key={event.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-lg">{EVENT_EMOJI[event.kind]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{event.title}</p>
                      <p className="text-[11px] text-muted">
                        {inDays === 0 ? 'Bugün' : inDays === 1 ? 'Yarın' : `${inDays} gün sonra`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Son hareketler */}
        <div className="lg:col-span-2">
          <SectionTitle
            action={<Link to="/cihaz" className="text-[11px] text-accent">Etkinlik günlüğü</Link>}
          >
            Bugün neler oldu
          </SectionTitle>
          <Panel padded={false}>
            <ul className="divide-y divide-line/20">
              {activities.slice(0, 5).map((activity) => (
                <li key={activity.id} className="flex items-center gap-3 px-4 py-3">
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
          </Panel>
        </div>
      </div>

      {/* Küçük ipucu şeridi */}
      <Panel className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <p className="text-xs text-muted">
          {messageCount === 0
            ? 'Elçin ile hiç konuşmadın. Bir "merhaba" yeter.'
            : `Şimdiye kadar ${messageCount} mesaj paylaştınız.`}
        </p>
        <Link to="/surprizler">
          <Button size="sm" icon={<Gift size={14} />}>
            Sürprizlere bak
          </Button>
        </Link>
      </Panel>

      {/* Gizli mod */}
      <Modal open={secretOpen} onClose={() => setSecretOpen(false)} title="✨ Gizli Mod">
        <div className="space-y-4 text-center">
          <ElcinAvatar mood="love" animation="heart" size={140} trackCursor={false} className="mx-auto" />
          <p className="text-sm leading-relaxed text-ink">
            Bu küçük dost,
            <br />
            <span className="font-semibold text-gradient">{config.app.developer}</span> tarafından
            <br />
            {userName} için geliştirildi. ❤️
          </p>
          {!secretUnlocked && <p className="text-xs text-muted">Artık Sürprizler sayfasında da duruyor.</p>}
          <Button
            variant="primary"
            block
            onClick={() => {
              setSecretOpen(false);
              toast.success('Sırrı buldun 🌸');
            }}
          >
            Kapat
          </Button>
        </div>
      </Modal>

      {/* Akif'ten mesaj */}
      <Modal
        open={letterOpen && Boolean(letter)}
        onClose={() => {
          if (letter) markRead(letter.id);
          setLetterOpen(false);
        }}
        title={
          <span className="flex items-center gap-2">
            <Sparkles size={14} className="text-accent" />
            {letter?.title ?? 'Mesaj'}
          </span>
        }
      >
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{letter?.body}</p>
        <Button
          variant="primary"
          block
          className="mt-5"
          onClick={() => {
            if (letter) markRead(letter.id);
            setLetterOpen(false);
          }}
        >
          Okudum
        </Button>
      </Modal>
    </div>
  );
}

const EVENT_EMOJI: Record<string, string> = {
  birthday: '🎂',
  anniversary: '💝',
  special: '📅',
  reminder: '💌',
};
