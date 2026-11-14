/** A locality of the catalog by its id, or one the catalog lacks by its name (the API adds it). */
export type LocalityRef = number | { name: string } | null;

export const textOrNull = (value: string) => (value.trim() === '' ? null : value.trim());

/** A figure as typed, with a comma or a point; a lone "-" or "." is no figure yet: none. */
export function toNumber(value: string): number | null {
  const figure = Number(value.trim().replace(',', '.'));
  return value.trim() !== '' && Number.isFinite(figure) ? figure : null;
}

/** A saved text or figure back as typed. */
export const asText = (value: unknown) =>
  typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';

export function toLocalityRef(value: unknown): LocalityRef {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'object' && value !== null && 'name' in value) {
    const name = (value as { name: unknown }).name;
    if (typeof name === 'string' && name.trim() !== '') return { name };
  }
  return null;
}
