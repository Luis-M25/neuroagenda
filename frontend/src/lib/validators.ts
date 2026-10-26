export interface ValidationResult {
  valid: boolean;
  message: string;
}

export interface PasswordStrength {
  score: number;
  label: string;
  issues: string[];
}

function isDefined(value: string | undefined | null): value is string {
  return value !== undefined && value !== null && value.trim().length > 0;
}

export function validateRequired(value: string | undefined | null, fieldName: string): ValidationResult {
  if (!isDefined(value)) {
    return { valid: false, message: `${fieldName} es obligatorio (ISO 9001)` };
  }
  return { valid: true, message: '' };
}

export function validateNombres(value: string | undefined | null, fieldName: string): ValidationResult {
  if (!isDefined(value)) {
    return { valid: false, message: `${fieldName} es obligatorio` };
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑäëïöüÄËÏÖÜ\s'-]+$/.test(value.trim())) {
    return { valid: false, message: `${fieldName} solo debe contener letras y espacios (ISO 8601)` };
  }
  if (value.trim().length < 2) {
    return { valid: false, message: `${fieldName} debe tener al menos 2 caracteres` };
  }
  if (value.trim().length > 100) {
    return { valid: false, message: `${fieldName} no debe exceder 100 caracteres` };
  }
  return { valid: true, message: '' };
}

export function validateCedulaEcuador(cedula: string): ValidationResult {
  if (!cedula || cedula.trim().length === 0) {
    return { valid: false, message: 'Número de identificación es obligatorio' };
  }
  const cleaned = cedula.trim();
  if (!/^\d{10}$/.test(cleaned)) {
    return { valid: false, message: 'La cédula ecuatoriana debe tener 10 dígitos numéricos (NTE INEN 001)' };
  }
  const provincia = parseInt(cleaned.substring(0, 2), 10);
  const provinciasValidas = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,30];
  if (!provinciasValidas.includes(provincia)) {
    return { valid: false, message: 'Código de provincia inválido (debe ser 01-24 o 30 para ecuatorianos en el exterior)' };
  }
  const tercerDigito = parseInt(cleaned[2], 10);
  if (tercerDigito > 5) {
    return { valid: false, message: 'El tercer dígito debe ser menor a 6 (persona natural inválida)' };
  }
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cleaned[i], 10) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }
  const digitoVerificador = parseInt(cleaned[9], 10);
  const residuo = suma % 10;
  const digitoCalculado = residuo === 0 ? 0 : 10 - residuo;
  if (digitoCalculado !== digitoVerificador) {
    return { valid: false, message: 'Dígito verificador inválido (módulo 10 falló)' };
  }
  return { valid: true, message: '' };
}

export function validatePasaporte(value: string): ValidationResult {
  if (!value || value.trim().length === 0) {
    return { valid: false, message: 'Número de pasaporte es obligatorio' };
  }
  const cleaned = value.trim().toUpperCase();
  if (!/^[A-Z0-9]{6,20}$/.test(cleaned)) {
    return { valid: false, message: 'El pasaporte debe tener entre 6 y 20 caracteres alfanuméricos (solo mayúsculas y números)' };
  }
  return { valid: true, message: '' };
}

export interface DocumentValidationResult {
  valido: boolean;
  tipo: 'CEDULA' | 'PASAPORTE' | null;
  mensaje: string;
}

export function validateDocument(documento: string): DocumentValidationResult {
  if (!documento || documento.trim().length === 0) {
    return { valido: false, tipo: null, mensaje: 'Debe ingresar un número de identificación' };
  }

  const cleaned = documento.trim();
  const cedulaResult = validateCedulaEcuador(cleaned);
  if (cedulaResult.valid) {
    return { valido: true, tipo: 'CEDULA', mensaje: '' };
  }

  const pasaporteResult = validatePasaporte(cleaned);
  if (pasaporteResult.valid) {
    return { valido: true, tipo: 'PASAPORTE', mensaje: '' };
  }

  const soloNumeros = /^\d+$/.test(cleaned);
  if (soloNumeros) {
    return { valido: false, tipo: null, mensaje: 'El número no corresponde a una cédula ecuatoriana válida' };
  }

  return { valido: false, tipo: null, mensaje: 'Debe ingresar una cédula (10 dígitos) o un pasaporte válido' };
}

export function validateIdentificacion(
  tipo: string,
  numero: string,
): ValidationResult {
  if (tipo === 'CEDULA') return validateCedulaEcuador(numero);
  if (tipo === 'PASAPORTE') return validatePasaporte(numero);
  return { valid: false, message: 'Tipo de identificación no válido' };
}

export function validateEmail(email: string | undefined | null): ValidationResult {
  if (!isDefined(email)) {
    return { valid: false, message: 'El correo electrónico es obligatorio' };
  }
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email.trim())) {
    return { valid: false, message: 'Formato de correo electrónico inválido (ISO 8601)' };
  }
  if (email.trim().length > 254) {
    return { valid: false, message: 'El correo no debe exceder 254 caracteres' };
  }
  return { valid: true, message: '' };
}

export function validatePhoneEcuador(phone: string | undefined | null, fieldName: string): ValidationResult {
  if (!isDefined(phone)) {
    return { valid: false, message: `${fieldName} es obligatorio` };
  }
  const cleaned = phone.trim().replace(/\s|-/g, '');
  if (!/^\d{10}$/.test(cleaned)) {
    return { valid: false, message: `${fieldName} debe tener 10 dígitos numéricos` };
  }
  if (!/^09\d{8}$/.test(cleaned)) {
    return { valid: false, message: `${fieldName} debe comenzar con 09 (formato Ecuador)` };
  }
  return { valid: true, message: '' };
}

export function validatePhoneOptional(phone: string | undefined | null): ValidationResult {
  if (!isDefined(phone)) {
    return { valid: true, message: '' };
  }
  const cleaned = phone.trim().replace(/\s|-/g, '');
  if (!/^\d{10}$/.test(cleaned)) {
    return { valid: false, message: 'Debe tener 10 dígitos numéricos' };
  }
  return { valid: true, message: '' };
}

export function validatePasswordStrength(password: string | undefined | null): PasswordStrength {
  const issues: string[] = [];
  let score = 0;

  if (!isDefined(password)) {
    issues.push('La contraseña es obligatoria');
    return { score: 0, label: 'Muy débil', issues };
  }

  if (password.length < 8) {
    issues.push('Mínimo 8 caracteres (ISO 27001)');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  if (/[a-z]/.test(password)) score += 1;
  else issues.push('Debe contener minúsculas');

  if (/[A-Z]/.test(password)) score += 1;
  else issues.push('Debe contener mayúsculas');

  if (/\d/.test(password)) score += 1;
  else issues.push('Debe contener al menos un número');

  if (/[!@#$%^&*(),.?":{}|<>?_=+-]/.test(password)) score += 1;
  else issues.push('Debe contener al menos un carácter especial (!@#$%^&*(),.?":{}|<>?_=+-)');

  if (/(.)\1{2,}/.test(password)) {
    issues.push('No debe tener caracteres repetidos 3+ veces seguidas');
    score -= 1;
  }

  const comunes = ['123456', 'password', 'admin', '12345678', 'qwerty'];
  if (comunes.some((c) => password.toLowerCase().includes(c))) {
    issues.push('No debe contener palabras comunes');
    score -= 1;
  }

  let label: string;
  if (score <= 1) label = 'Muy débil';
  else if (score <= 2) label = 'Débil';
  else if (score <= 3) label = 'Media';
  else if (score <= 4) label = 'Fuerte';
  else label = 'Muy fuerte';

  if (score < 0) score = 0;
  if (score > 5) score = 5;

  return { score, label, issues };
}

export function validatePasswordConfirm(password: string, confirm: string): ValidationResult {

  if (password !== confirm) {
    return { valid: false, message: 'Las contraseñas no coinciden' };
  }
  return { valid: true, message: '' };
}

// Réplica exacta de la política del backend
// (backend/src/common/validators/password-strength.validator.ts).
// Todo lo que pase esta función pasa el ValidationPipe del backend.
export function meetsBackendPasswordPolicy(password: string | undefined | null): boolean {
  if (typeof password !== 'string') return false;
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>?_=+-]/.test(password)
  );
}

export const BACKEND_PASSWORD_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un dígito y un carácter especial';

export function validateDateNotPast(dateStr: string | undefined | null, fieldName: string): ValidationResult {
  if (!isDefined(dateStr)) {
    return { valid: false, message: `${fieldName} es obligatorio` };
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { valid: false, message: `${fieldName} no es una fecha válida` };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return { valid: false, message: `${fieldName} no puede ser anterior a hoy` };
  }
  return { valid: true, message: '' };
}

export function validateDateNotFuture(dateStr: string | undefined | null, fieldName: string): ValidationResult {
  if (!isDefined(dateStr)) {
    return { valid: false, message: `${fieldName} es obligatorio` };
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { valid: false, message: `${fieldName} no es una fecha válida` };
  }
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date > today) {
    return { valid: false, message: `${fieldName} no puede ser futura` };
  }
  return { valid: true, message: '' };
}

export function validateDateRange(
  start: string | undefined | null,
  end: string | undefined | null,
  fieldName: string,
): ValidationResult {
  if (!isDefined(start) || !isDefined(end)) {
    return { valid: false, message: `${fieldName}: ambas fechas son obligatorias` };
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { valid: false, message: `${fieldName}: fechas inválidas` };
  }
  if (endDate <= startDate) {
    return { valid: false, message: `${fieldName}: fecha fin debe ser posterior a fecha inicio` };
  }
  return { valid: true, message: '' };
}

export function validateTimeOrder(
  start: string | undefined | null,
  end: string | undefined | null,
  fieldName: string,
): ValidationResult {
  if (!isDefined(start) || !isDefined(end)) {
    return { valid: false, message: `${fieldName}: hora inicio y fin son obligatorias` };
  }
  if (start >= end) {
    return { valid: false, message: `${fieldName}: hora fin debe ser posterior a hora inicio` };
  }
  return { valid: true, message: '' };
}

export function validatePastDate(dateStr: string | undefined | null, fieldName: string): ValidationResult {
  if (!isDefined(dateStr)) {
    return { valid: false, message: `${fieldName} es obligatorio` };
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { valid: false, message: `${fieldName} no es una fecha válida (ISO 8601)` };
  }
  const minDate = new Date('1900-01-01');
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date < minDate) {
    return { valid: false, message: `${fieldName} no puede ser anterior a 1900` };
  }
  if (date > today) {
    return { valid: false, message: `${fieldName} no puede ser futura` };
  }
  return { valid: true, message: '' };
}

export function validateUrl(url: string | undefined | null): ValidationResult {
  if (!isDefined(url)) {
    return { valid: true, message: '' };
  }
  try {
    new URL(url.trim());
    return { valid: true, message: '' };
  } catch {
    return { valid: false, message: 'URL inválida (debe comenzar con http:// o https://)' };
  }
}

export function validateMinMax(
  value: number | undefined | null,
  min: number,
  max: number,
  fieldName: string,
): ValidationResult {
  if (value === undefined || value === null || isNaN(value)) {
    return { valid: false, message: `${fieldName} es obligatorio` };
  }
  if (value < min) {
    return { valid: false, message: `${fieldName} debe ser mínimo ${min}` };
  }
  if (value > max) {
    return { valid: false, message: `${fieldName} debe ser máximo ${max}` };
  }
  return { valid: true, message: '' };
}
