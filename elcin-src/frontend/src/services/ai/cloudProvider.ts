import { config } from '@/config';
import type { AnimationName, DeviceCommand, MemoryDraft } from '@/types';
import { animationForMood, coerceMood } from './moodEngine';
import type { AIProvider, AIRequest, AIResponse, MemoryAction } from './types';

/**
 * Bulut sağlayıcısı.
 *
 * Model anahtarı burada *yoktur* ve olamaz: tarayıcıya inen her şey
 * okunabilir. Bu sınıf yalnızca kendi backend'imize konuşur; hangi modelin
 * çağrıldığına (OpenAI, Gemini, başka bir şey) backend karar verir.
 *
 * Backend PHASE 2'de yazılacak; sözleşme şimdiden sabit olduğu için o gün
 * yalnızca `VITE_API_URL` verilmesi yetecek.
 */
export class CloudAIProvider implements AIProvider {
  readonly id = 'cloud';
  readonly label = 'Bulut modeli';
  readonly billable = true;

  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async respond(request: AIRequest): Promise<AIResponse> {
    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.api.timeoutMs);
    request.signal?.addEventListener('abort', () => controller.abort(), { once: true });

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          message: request.input,
          user_name: request.userName,
          current_mood: request.currentMood,
          occasion: request.occasion ?? null,
          memory_ids: request.memories.map((memory) => memory.id),
        }),
      });

      if (!response.ok) {
        throw new Error(`Sohbet isteği başarısız oldu (${response.status})`);
      }

      return parseResponse(await response.json(), started);
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Cevap ayrıştırıcı.
 *
 * Şema genişletilebilir: bilinmeyen alanlar yok sayılır, eksik alanlar makul
 * varsayılana düşer. Model bozuk JSON döndürdüğünde kullanıcı teknik hata
 * değil, Elçin'in bir cümlesini görür.
 */
export function parseResponse(payload: unknown, startedAt: number): AIResponse {
  const data = (payload ?? {}) as Record<string, unknown>;
  const mood = coerceMood(data.mood);
  const message =
    typeof data.message === 'string' && data.message.trim()
      ? data.message
      : 'Bir an dalmışım. Tekrar söyler misin?';

  return {
    message,
    mood,
    animation: coerceAnimation(data.animation, mood),
    deviceAction: coerceDeviceAction(data.device_action),
    memoryActions: coerceMemoryActions(data.memory_action ?? data.memory_actions),
    usedMemoryIds: Array.isArray(data.used_memory_ids)
      ? data.used_memory_ids.filter((id): id is string => typeof id === 'string')
      : [],
    meta: {
      provider: 'cloud',
      model: typeof data.model === 'string' ? data.model : config.ai.model,
      latencyMs: Date.now() - startedAt,
    },
  };
}

const ANIMATION_NAMES = new Set<string>([
  'idle', 'blink', 'smile', 'laugh', 'sad', 'surprise',
  'think', 'talk', 'heart', 'sleep', 'wake', 'loading',
]);

function coerceAnimation(value: unknown, mood: ReturnType<typeof coerceMood>): AnimationName {
  if (typeof value === 'string' && ANIMATION_NAMES.has(value)) return value as AnimationName;
  return animationForMood(mood);
}

const COMMANDS = new Set(['animation', 'mood', 'state', 'message', 'reboot', 'ota']);

function coerceDeviceAction(value: unknown): DeviceCommand | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.command !== 'string' || !COMMANDS.has(raw.command)) return null;
  return { type: 'device_command', ...raw } as DeviceCommand;
}

function coerceMemoryActions(value: unknown): MemoryAction[] {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  const actions: MemoryAction[] = [];

  for (const entry of list) {
    if (!entry || typeof entry !== 'object') continue;
    const raw = entry as Record<string, unknown>;

    if (raw.op === 'reinforce' && typeof raw.id === 'string') {
      actions.push({ op: 'reinforce', id: raw.id, importance: toScore(raw.importance) });
      continue;
    }
    if (typeof raw.content !== 'string' || !raw.content.trim()) continue;

    const draft: MemoryDraft = {
      kind: coerceKind(raw.type ?? raw.kind),
      content: raw.content,
      importance: toScore(raw.importance),
      tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === 'string') : [],
    };
    actions.push({ op: 'create', memory: draft });
  }

  return actions;
}

const KINDS = new Set(['preference', 'fact', 'event', 'relationship', 'short_term']);

function coerceKind(value: unknown): MemoryDraft['kind'] {
  return typeof value === 'string' && KINDS.has(value)
    ? (value as MemoryDraft['kind'])
    : 'fact';
}

function toScore(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return 0.5;
  return Math.min(1, Math.max(0, num));
}
