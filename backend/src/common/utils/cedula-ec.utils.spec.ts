import {
  validateCedulaEcuador,
  validateRucPersonaNaturalEcuador,
} from './cedula-ec.utils';

describe('cedula-ec.utils', () => {
  describe('validateCedulaEcuador', () => {
    it.each(['1710034065', '0926687856', '0100000025', '3000000012'])(
      'acepta la cedula valida %s',
      (cedula) => {
        expect(validateCedulaEcuador(cedula)).toEqual({ valid: true });
      },
    );

    it('rechaza una cedula con digito verificador alterado', () => {
      const result = validateCedulaEcuador('1710034064');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('El dígito verificador de la cédula es inválido');
    });

    it('rechaza codigos de provincia inexistentes', () => {
      const result = validateCedulaEcuador('0000000000');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('El código de provincia de la cédula es inválido');
    });

    it('rechaza cedulas que no tienen 10 digitos', () => {
      expect(validateCedulaEcuador('171003406').message).toBe(
        'La cédula debe tener 10 dígitos numéricos',
      );
      expect(validateCedulaEcuador('171003406A').valid).toBe(false);
    });

    it('rechaza el tercer digito mayor a 5', () => {
      expect(validateCedulaEcuador('1760034065').valid).toBe(false);
    });

    it('rechaza cedulas vacias', () => {
      expect(validateCedulaEcuador('').valid).toBe(false);
    });
  });

  describe('validateRucPersonaNaturalEcuador', () => {
    it('acepta un RUC valido con establecimiento 001', () => {
      expect(validateRucPersonaNaturalEcuador('1710034065001')).toEqual({
        valid: true,
      });
    });

    it('rechaza un RUC con cedula interna invalida', () => {
      expect(validateRucPersonaNaturalEcuador('1710034064001').valid).toBe(
        false,
      );
    });

    it('rechaza un RUC con establecimiento 000', () => {
      expect(validateRucPersonaNaturalEcuador('1710034065000').valid).toBe(
        false,
      );
    });
  });
});
