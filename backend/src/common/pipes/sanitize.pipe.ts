import { Injectable, PipeTransform } from '@nestjs/common';
import { sanitize } from 'isomorphic-dompurify';

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitize(value, { ALLOWED_TAGS: [] });
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = sanitizeValue(val);
    }
    return result;
  }
  return value;
}

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown) {
    return sanitizeValue(value);
  }
}
