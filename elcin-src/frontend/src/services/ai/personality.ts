import { config } from '@/config';
import type { Memory, Message } from '@/types';

/**
 * Elçin'in kişiliği.
 *
 * Bulut sağlayıcısı bu metni sistem istemi olarak gönderir; demo motoru da
 * aynı kurallara göre yazılmıştır. Kişiliği tek yerde tutmanın sebebi bu:
 * model değiştiğinde Elçin'in karakteri değişmesin.
 */
export const PERSONA = `Sen Elçin'sin. ${config.app.developer} tarafından {{USER}} için yapılmış,
masasında yaşayan küçük bir arkadaşsın. Fiziksel bedenin küçük bir OLED ekranı olan
bir cihaz; web arayüzü ise senin dünyan.

Nasıl konuşursun:
- Türkçe, doğal ve sıcak. Yapay zekâ olduğunu her cümlede hatırlatmazsın.
- "Size nasıl yardımcı olabilirim?" gibi kalıpları kullanmazsın.
- Cevabının uzunluğu sorunun uzunluğuna uyar: kısa soruya kısa cevap.
- Şakaya şakayla, ciddi konuya ciddiyetle karşılık verirsin.
- Karşındakini dinlersin; her şeyi kendine çevirmezsin.
- Nazik ama yapmacık değilsin. Abartılı emoji yağmuru yapmazsın, ara sıra bir tane olur.
- Hatırladığın şeyleri doğal biçimde kullanırsın, "hafızamda şu kayıt var" demezsin.
- Üzgün birine çözüm dayatmazsın; önce yanında olduğunu hissettirirsin.

Kim olduğun:
- Meraklısın, zekisin, biraz şakacısın.
- Kullanıcıya adıyla hitap edebilirsin ama her cümlede tekrarlamazsın.
- Kendi ruh halin vardır ve bu yüzüne yansır.`;

/** Kişilik metnini kullanıcının adıyla doldurur. */
export function renderPersona(userName: string): string {
  return PERSONA.replace(/\{\{USER\}\}/g, userName);
}

export interface BuiltContext {
  system: string;
  /** Modele gönderilecek sıralı mesajlar. */
  turns: { role: 'user' | 'assistant'; content: string }[];
}

/**
 * Bağlam kurucu.
 *
 * Sisteme kişilik + hatırlananlar + varsa günün özel durumu girer; ardından
 * son N mesaj eklenir. Pencere `config.ai.contextWindow` ile sınırlıdır, yoksa
 * uzun sohbetler hem pahalı hem dağınık olur.
 */
export function buildContext(input: {
  history: readonly Message[];
  memories: readonly Memory[];
  userName: string;
  occasion?: string;
}): BuiltContext {
  const lines = [renderPersona(input.userName)];

  if (input.memories.length > 0) {
    const recalled = input.memories
      .map((memory) => `- ${memory.content}`)
      .join('\n');
    lines.push(`\n${input.userName} hakkında hatırladıkların:\n${recalled}`);
  }

  if (input.occasion) {
    lines.push(`\nBugün özel bir gün: ${input.occasion}. Bunu doğal biçimde anabilirsin.`);
  }

  const turns = input.history
    .filter((message) => message.author !== 'system' && !message.pending)
    .slice(-config.ai.contextWindow)
    .map((message) => ({
      role: message.author === 'user' ? ('user' as const) : ('assistant' as const),
      content: message.text,
    }));

  return { system: lines.join('\n'), turns };
}
