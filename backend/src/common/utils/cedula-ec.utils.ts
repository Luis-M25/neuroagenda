export interface CedulaValidationResult {
  valid: boolean;
  message?: string;
}

// Algoritmo oficial (modulo 10): coeficientes sobre los 9 primeros digitos.
const COEFICIENTES = [2, 1, 2, 1, 2, 1, 2, 1, 2];
const PROVINCIAS_VALIDAS = new Set<string>([
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '30',
]);

export function validateCedulaEcuador(cedula: string): CedulaValidationResult {
  if (!cedula) return { valid: false, message: 'La cédula es obligatoria' };
  const c = cedula.trim();
  if (!/^\d{10}$/.test(c)) {
    return { valid: false, message: 'La cédula debe tener 10 dígitos numéricos' };
  }
  const provincia = c.slice(0, 2);
  if (!PROVINCIAS_VALIDAS.has(provincia)) {
    return { valid: false, message: 'El código de provincia de la cédula es inválido' };
  }
  const tercerDigito = parseInt(c[2], 10);
  if (tercerDigito < 0 || tercerDigito > 5) {
    return { valid: false, message: 'El tercer dígito de la cédula es inválido (debe ser 0-5)' };
  }
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let producto = parseInt(c[i], 10) * COEFICIENTES[i];
    if (producto >= 10) producto -= 9;
    suma += producto;
  }
  const resto = suma % 10;
  const digitoEsperado = resto === 0 ? 0 : 10 - resto;
  const digitoReal = parseInt(c[9], 10);
  if (digitoEsperado !== digitoReal) {
    return { valid: false, message: 'El dígito verificador de la cédula es inválido' };
  }
  return { valid: true };
}

export function validateRucPersonaNaturalEcuador(ruc: string): CedulaValidationResult {
  if (!ruc) return { valid: false, message: 'El RUC es obligatorio' };
  const r = ruc.trim();
  if (!/^\d{13}$/.test(r)) {
    return { valid: false, message: 'El RUC debe tener 13 dígitos numéricos' };
  }
  const cedulaInterna = r.slice(0, 10);
  const cedula = validateCedulaEcuador(cedulaInterna);
  if (!cedula.valid) return cedula;
  const establecimiento = parseInt(r.slice(10), 10);
  if (establecimiento < 1) {
    return { valid: false, message: 'El código de establecimiento del RUC es inválido' };
  }
  return { valid: true };
}
