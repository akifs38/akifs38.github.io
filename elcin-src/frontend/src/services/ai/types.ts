import type {
  AnimationName,
  DeviceCommand,
  Memory,
  MemoryDraft,
  Message,
  Mood,
} from '@/types';

/**
 * AI sağlayıcı sözleşmesi.
 *
 * Model seçimi hiçbir yere gömülmez: UI yalnızca bu arayüzü tanır, arkasında
 * demo motoru da olabilir, backend üzerinden gerçek bir model de. Yeni bir
 * sağlayıcı eklemek = bu arayüzü uygulayan bir sınıf yazmak.
 */
export interface AIProvider {
  readonly id: string;
  readonly label: string;
  /** Gerçek bir modele para ödeniyor mu — UI bunu rozetle gösterir. */
  readonly billable: boolean;
  respond(request: AIRequest): Promise<AIResponse>;
}

export interface AIRequest {
  /** Kullanıcının bu turdaki mesajı. */
  input: string;
  /** Bağlam penceresine giren son mesajlar (eski → yeni). */
  history: Message[];
  /** Bağlama katılan hafıza kayıtları. */
  memories: Memory[];
  /** Elçin'in hitap edeceği ad. */
  userName: string;
  /** Elçin'in cevaptan önceki ruh hali. */
  currentMood: Mood;
  /** Bugüne denk gelen özel gün varsa başlığı. */
  occasion?: string;
  signal?: AbortSignal;
}

/**
 * Genişletilebilir cevap şeması.
 *
 * Yeni alanlar (ses, görsel, öneri…) eklendiğinde eski istemciler kırılmasın
 * diye hepsi opsiyonel; zorunlu olan yalnızca `message`.
 */
export interface AIResponse {
  message: string;
  mood: Mood;
  animation: AnimationName;
  /** Cevapla birlikte cihaza gidecek komut. */
  deviceAction: DeviceCommand | null;
  /** Bu turdan çıkarılan hafıza işlemleri. */
  memoryActions: MemoryAction[];
  /** Cevabı üretirken dayanılan hafıza kayıtları. */
  usedMemoryIds: string[];
  meta: {
    provider: string;
    model: string;
    /** Demo motorunda hangi kuralın eşleştiği — hata ayıklamayı kolaylaştırır. */
    matchedIntent?: string;
    latencyMs: number;
  };
}

export type MemoryAction =
  | { op: 'create'; memory: MemoryDraft }
  | { op: 'reinforce'; id: string; importance: number };
