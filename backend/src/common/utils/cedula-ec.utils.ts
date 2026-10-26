export interface CedulaValidationResult {
  valid: boolean;
  message?: string;
}

const COEFICIENTES = [2, 3, 4, 5, 6, 7, 2, 3, 4, 5];
const PROVINCIAS_VALIDAS = new Set<string>([
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24',
]);

export function validateCedulaEcuador(cedula: string): CedulaValidationResult {
  if (!cedula) return { valid: false, message: 'Cedula requerida' };
  const c = cedula.trim();
  if (!/^\d{10}$/.test(c)) {
    return { valid: false, message: 'La cedula debe tener 10 digitos numericos' };
  }
  const provincia = c.slice(0, 2);
  if (!PROVINCIAS_VALIDAS.has(provincia)) {
    return { valid: false, message: 'Codigo de provincia invalido' };
  }
  const tercerDigito = parseInt(c[2], 10);
  if (tercerDigito < 0 || tercerDigito > 5) {
    return { valid: false, message: 'Tercer digito invalido para cedula (debe ser 0-5)' };
  }
  const digitos = c.slice(0, 10).split('').map((d) => parseInt(d, 10));
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    let producto = digitos[i] * COEFICIENTES[i];
    if (producto >= 10) producto -= 9;
    suma += producto;
  }
  const resto = suma % 10;
  const digitoEsperado = resto === 0 ? 0 : 10 - resto;
  const digitoReal = digitos[9];
  if (digitoEsperado !== digitoReal) {
    return { valid: false, message: 'Digito verificador invalido' };
  }
  return { valid: true };
}

export function validateRucPersonaNaturalEcuador(ruc: string): CedulaValidationResult {
  if (!ruc) return { valid: false, message: 'RUC requerido' };
  const r = ruc.trim();
  if (!/^\d{13}$/.test(r)) {
    return { valid: false, message: 'El RUC debe tener 13 digitos numericos' };
  }
  const cedulaInterna = r.slice(0, 10);
  const cedula = validateCedulaEcuador(cedulaInterna);
  if (!cedula.valid) return cedula;
  const establecimiento = parseInt(r[10], 10);
  if (establecimiento < 1) {
    return { valid: false, message: 'Codigo de establecimiento invalido' };
  }
  return { valid: true };
}
