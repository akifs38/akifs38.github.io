import { describe, expect, it } from 'vitest';
import type { Memory } from '@/types';
import {
  extractMemories,
  findDuplicate,
  matchesQuery,
  retrieveMemories,
  similarity,
} from './memoryEngine';

function memory(partial: Partial<Memory> & Pick<Memory, 'content'>): Memory {
  const now = new Date().toISOString();
  return {
    id: partial.id ?? 'm1',
    kind: partial.kind ?? 'preference',
    content: partial.content,
    importance: partial.importance ?? 0.7,
    tags: partial.tags ?? [],
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
}

describe('extractMemories', () => {
  it('sevilen şeyi tercih olarak kaydeder', () => {
    const drafts = extractMemories('ben kahveyi çok seviyorum', 'Gülçin');
    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.kind).toBe('preference');
    expect(drafts[0]?.content).toContain('Gülçin');
    expect(drafts[0]?.content).toContain('kahve');
  });

  it('sevilmeyeni ayrı etiketle kaydeder', () => {
    const drafts = extractMemories('brokoliyi hiç sevmiyorum', 'Gülçin');
    expect(drafts[0]?.tags).toContain('sevmedikleri');
    expect(drafts[0]?.content).toContain('sevmiyor');
  });

  it('sıradan cümleden hafıza çıkarmaz', () => {
    expect(extractMemories('bugün hava güzel', 'Gülçin')).toHaveLength(0);
  });

  it('kaynak mesaj kimliğini taşır', () => {
    const drafts = extractMemories('müziği seviyorum', 'Gülçin', 'msg_7');
    expect(drafts[0]?.sourceMessageId).toBe('msg_7');
  });

  it('yaklaşan planı olay olarak yakalar', () => {
    const drafts = extractMemories('yarın sınavım var', 'Gülçin');
    expect(drafts.some((d) => d.kind === 'event')).toBe(true);
  });

  it('aynı çıkarımı iki kez üretmez', () => {
    const drafts = extractMemories('kahveyi seviyorum, kahveyi seviyorum', 'Gülçin');
    expect(drafts).toHaveLength(1);
  });
});

describe('findDuplicate', () => {
  it('aynı içeriği yakalar', () => {
    const existing = [memory({ id: 'a', content: 'Gülçin kahve seviyor.' })];
    const duplicate = findDuplicate(existing, {
      kind: 'preference',
      content: 'Gülçin kahve seviyor.',
      importance: 0.8,
    });
    expect(duplicate?.id).toBe('a');
  });

  it('farklı türdeki benzer içeriği ayrı tutar', () => {
    const existing = [memory({ id: 'a', kind: 'fact', content: 'Gülçin kahve seviyor.' })];
    expect(
      findDuplicate(existing, {
        kind: 'preference',
        content: 'Gülçin kahve seviyor.',
        importance: 0.8,
      }),
    ).toBeUndefined();
  });
});

describe('similarity', () => {
  it('aynı metinde 1 döner', () => {
    expect(similarity('a b c', 'a b c')).toBe(1);
  });

  it('ortak kelime yoksa 0 döner', () => {
    expect(similarity('kahve', 'müzik')).toBe(0);
  });

  it('boş metinde patlamaz', () => {
    expect(similarity('', 'kahve')).toBe(0);
  });
});

describe('retrieveMemories', () => {
  const store = [
    memory({ id: 'a', content: 'Gülçin kahve seviyor.', tags: ['sevdikleri'] }),
    memory({ id: 'b', content: 'Gülçin müzik dinlemeyi seviyor.', tags: ['sevdikleri'] }),
    memory({ id: 'c', kind: 'fact', content: 'Adı Gülçin.', importance: 0.95 }),
  ];

  it('ilgili kaydı öne çıkarır', () => {
    const found = retrieveMemories(store, 'bugün kahve içtim');
    expect(found[0]?.id).toBe('a');
  });

  it('çok önemli kaydı alakasız soruda bile taşır', () => {
    const found = retrieveMemories(store, 'zzz');
    expect(found.map((m) => m.id)).toContain('c');
  });

  it('limite uyar', () => {
    expect(retrieveMemories(store, 'gülçin seviyor', 1)).toHaveLength(1);
  });
});

describe('matchesQuery', () => {
  const m = memory({ content: 'Gülçin kahve seviyor.', tags: ['sevdikleri'] });

  it('boş sorgu her kaydı geçirir', () => {
    expect(matchesQuery(m, '   ')).toBe(true);
  });

  it('Türkçe harf farkını aşar', () => {
    expect(matchesQuery(m, 'GÜLÇİN')).toBe(true);
    expect(matchesQuery(m, 'gulcin')).toBe(true);
  });

  it('etiket üzerinden bulur', () => {
    expect(matchesQuery(m, 'sevdikleri')).toBe(true);
  });

  it('alakasız sorguda eşleşmez', () => {
    expect(matchesQuery(m, 'futbol')).toBe(false);
  });
});

describe('ifade sadeleştirme', () => {
  it('bağlaçtan sonrasını alır, cümlenin tamamını hafızaya yazmaz', () => {
    const drafts = extractMemories('bugün biraz yorgunum ama kahveyi çok seviyorum', 'Gülçin');
    const preference = drafts.find((draft) => draft.kind === 'preference');
    expect(preference?.content).toContain('kahve');
    expect(preference?.content).not.toContain('yorgunum');
    expect(preference?.content).not.toContain('ama');
  });

  it('baştaki dolgu kelimelerini atar', () => {
    const drafts = extractMemories('ben gerçekten müziği seviyorum', 'Gülçin');
    expect(drafts[0]?.content).toContain('müzi');
    expect(drafts[0]?.content).not.toContain('gerçekten');
  });

  it('Türkçe harfleri koruyarak kaydeder', () => {
    // Eşleştirme sadeleştirilmiş metinde yapılır ama kayıt ham metinden kesilir.
    const drafts = extractMemories('çiçekleri seviyorum', 'Gülçin');
    expect(drafts[0]?.content).toContain('çiçek');
    expect(drafts[0]?.content).not.toContain('cicek');
  });

  it('uzun ifadeyi kısaltır', () => {
    const drafts = extractMemories(
      'sabahları balkonda oturup sessizce kitap okumayı seviyorum',
      'Gülçin',
    );
    const words = (drafts[0]?.content ?? '').split(/\s+/);
    expect(words.length).toBeLessThanOrEqual(7);
  });

  it('sadeleştirme sonrası boş ya da bozuk içerik üretmez', () => {
    for (const input of ['seviyorum', 'ben seviyorum', 'çok seviyorum', 'müziği sevmiyorum']) {
      for (const draft of extractMemories(input, 'Gülçin')) {
        expect(draft.content.trim().length).toBeGreaterThan(0);
        expect(draft.content).not.toContain('  ');
        expect(draft.content).not.toContain('undefined');
      }
    }
  });
});
