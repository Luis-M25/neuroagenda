'use client';

const SPECIALIST_COLORS = [
  '#4f46e5', '#db2777', '#0891b2', '#ea580c', '#7c3aed',
  '#059669', '#ca8a04', '#dc2626', '#2563eb', '#9333ea',
];

function computeBadge(nombre: string, usedForColor: Set<string>): string {
  const parts = nombre.trim().split(/\s+/);
  if (!parts[0]) return '?';

  let badge = parts.length === 1
    ? parts[0].charAt(0).toUpperCase()
    : (parts[0].charAt(0) || '') + (parts[parts.length - 1].charAt(0) || '');
  badge = badge.toUpperCase() || '?';

  if (!usedForColor.has(badge)) return badge;

  const extended = parts.length >= 2
    ? (parts[0].substring(0, 2) + parts[parts.length - 1].substring(0, 2)).toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();

  if (!usedForColor.has(extended)) return extended;

  let count = 1;
  while (usedForColor.has(`${extended}-${count}`)) count++;
  return `${extended}-${count}`;
}

export type Visual = { color: string; badge: string };

export function getSpecialistVisuals(items: Array<{ id: string; nombre: string }>): Map<string, Visual> {
  const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id));
  const result = new Map<string, Visual>();
  const colorUsedBadges = new Map<string, Set<string>>();

  sorted.forEach((item, i) => {
    const color = SPECIALIST_COLORS[i % SPECIALIST_COLORS.length];
    if (!colorUsedBadges.has(color)) colorUsedBadges.set(color, new Set());
    const used = colorUsedBadges.get(color)!;
    const badge = computeBadge(item.nombre, used);
    used.add(badge);
    result.set(item.id, { color, badge });
  });

  return result;
}
