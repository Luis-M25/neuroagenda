import { ecStartOfDay, ecEndOfDay, parseEcDate, ecDateRange } from './date-ec.utils';

describe('date-ec.utils (zona horaria Ecuador UTC-5)', () => {
  describe('ecStartOfDay', () => {
    it('retorna 05:00 UTC para medianoche en Ecuador', () => {
      expect(ecStartOfDay(2026, 7, 21)).toEqual(new Date('2026-07-21T05:00:00.000Z'));
    });

    it('no cambia de día respecto a la fecha local ecuatoriana', () => {
      const d = ecStartOfDay(2026, 1, 1);
      expect(d.toISOString()).toBe('2026-01-01T05:00:00.000Z');
    });
  });

  describe('ecEndOfDay', () => {
    it('retorna 04:59:59.999 UTC del día siguiente', () => {
      expect(ecEndOfDay(2026, 7, 21)).toEqual(new Date('2026-07-22T04:59:59.999Z'));
    });
  });

  describe('parseEcDate', () => {
    it('parsea YYYY-MM-DD como inicio de día en Ecuador', () => {
      expect(parseEcDate('2026-01-15')).toEqual(new Date('2026-01-15T05:00:00.000Z'));
    });
  });

  describe('ecDateRange', () => {
    it('retorna rango [gte, lt) cubriendo el día completo en Ecuador', () => {
      const { gte, lt } = ecDateRange('2026-03-10');
      expect(gte).toEqual(new Date('2026-03-10T05:00:00.000Z'));
      expect(lt).toEqual(new Date('2026-03-11T05:00:00.000Z'));
    });
  });
});