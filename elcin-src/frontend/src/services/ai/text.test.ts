import { describe, expect, it } from 'vitest';
import { fold, includesAny, isQuestion, trLower, wordCount } from './text';

describe('trLower', () => {
  it('İ harfini birleşik nokta üretmeden küçültür', () => {
    expect(trLower('İSTANBUL')).toBe('istanbul');
    expect(trLower('İSTANBUL')).not.toContain('̇');
  });

  it('I harfini noktasız ı yapar', () => {
    expect(trLower('IRMAK')).toBe('ırmak');
  });
});

describe('fold', () => {
  it('Türkçe harfleri ASCII karşılığına indirger', () => {
    expect(fold('Gülçin şiir İçin ĞÖZ')).toBe('gulcin siir icin goz');
  });

  it('zaten sade metni bozmaz', () => {
    expect(fold('kahve')).toBe('kahve');
  });
});

describe('includesAny', () => {
  it('yazım farkına rağmen eşleşir', () => {
    expect(includesAny('Bugün çok YORGUNUM', ['yorgun'])).toBe(true);
    expect(includesAny('Kahve içtim', ['çay'])).toBe(false);
  });
});

describe('isQuestion', () => {
  it('soru işaretini yakalar', () => {
    expect(isQuestion('Nasılsın?')).toBe(true);
  });

  it('soru ekini işaretsiz de yakalar', () => {
    expect(isQuestion('bugün gelecek mi acaba')).toBe(true);
  });

  it('düz cümleyi soru saymaz', () => {
    expect(isQuestion('Bugün işe gittim.')).toBe(false);
  });
});

describe('wordCount', () => {
  it('boş metinde sıfır döner', () => {
    expect(wordCount('   ')).toBe(0);
  });

  it('fazla boşlukları saymaz', () => {
    expect(wordCount('bir   iki üç')).toBe(3);
  });
});
