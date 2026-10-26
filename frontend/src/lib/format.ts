export function capitalizeWords(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\b\w+\b/g, (word) => {
      const lower = word.toLowerCase();
      const exceptions = ['de', 'del', 'la', 'los', 'las', 'y', 'e', 'o', 'a', 'el', 'un', 'una', 'en', 'por', 'con', 'para'];
      if (exceptions.includes(lower) && word.length > 1) return lower;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
}

export function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function formatName(value: string): string {
  if (!value) return value;
  return normalizeText(value).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDisplay(value: string): string {
  if (!value) return '';
  return capitalizeWords(value);
}

export function formatInput(value: string): string {
  return normalizeText(value);
}
