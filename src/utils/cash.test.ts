import { describe, expect, it } from 'vitest';
import {
  applyOperation,
  compareCompositions,
  emptyComposition,
  findChange,
  parseCents,
  totalComposition,
  undoOperation,
} from './cash';

describe('moteur de caisse', () => {
  it('convertit les montants en centimes sans flottants', () => {
    expect(parseCents('12,20')).toBe(1220);
    expect(parseCents('1 234,56')).toBe(123456);
    expect(parseCents('12,345')).toBeNull();
  });

  it('totalise une composition', () => {
    const c = emptyComposition();
    c['2000'] = 2;
    c['50'] = 3;
    expect(totalComposition(c)).toBe(4150);
  });

  it('applique et annule exactement une transaction', () => {
    const base = emptyComposition();
    base['500'] = 1;
    base['100'] = 2;
    const add = emptyComposition();
    const remove = emptyComposition();
    add['2000'] = 1;
    remove['500'] = 1;
    remove['100'] = 1;
    const current = applyOperation(base, add, remove);
    expect(current['2000']).toBe(1);
    const restored = undoOperation(current, {
      id: 'x',
      at: '',
      type: 'paiement espèces',
      amount: 1400,
      added: add,
      removed: remove,
    });
    expect(restored).toEqual(base);
  });

  it('refuse un retrait indisponible', () => {
    expect(() => applyOperation(emptyComposition(), emptyComposition(), { ...emptyComposition(), '500': 1 })).toThrow();
  });

  it('compare le réel au théorique', () => {
    const t = emptyComposition();
    const a = emptyComposition();
    t['2000'] = 5;
    a['2000'] = 4;
    a['200'] = 2;
    const rows = compareCompositions(t, a);
    expect(rows.find(r => r.value === 2000)?.amountDifference).toBe(-2000);
    expect(rows.find(r => r.value === 200)?.amountDifference).toBe(400);
  });

  it('trouve un rendu exact disponible', () => {
    const a = emptyComposition();
    a['500'] = 1;
    a['200'] = 1;
    expect(findChange(700, a)).toMatchObject({ '500': 1, '200': 1 });
  });

  it('trouve une alternative et détecte l’impossible', () => {
    const a = emptyComposition();
    a['200'] = 3;
    a['100'] = 1;
    expect(totalComposition(findChange(700, a)!)).toBe(700);
    expect(findChange(705, a)).toBeNull();
  });

  it('optimise le rendu avec le moins de pièces possible', () => {
    const a = emptyComposition();
    a['200'] = 1;
    a['100'] = 10;
    const result = findChange(200, a)!;
    expect(result['200']).toBe(1);
    expect(result['100']).toBe(0);
  });

  it('respecte vraiment les espèces disponibles dans la caisse', () => {
    const a = emptyComposition();
    a['100'] = 2;
    a['50'] = 1;
    const result = findChange(200, a)!;
    expect(result['100']).toBe(2);
    expect(result['50']).toBe(0);
  });
});
