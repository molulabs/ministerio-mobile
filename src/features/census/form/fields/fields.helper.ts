/** A locality of the catalog by its id, or one the catalog lacks by its name (the API adds it). */
export type LocalityRef = CatalogRef | null;

/** A catalog entry (locality, breed, forest species) by its id, or one the catalog lacks by its name. */
export type CatalogRef = number | { name: string };

export const textOrNull = (value: string) => (value.trim() === '' ? null : value.trim());

/** A figure as typed, with a comma or a point; a lone "-" or "." is no figure yet: none. */
export function toNumber(value: string): number | null {
  const figure = Number(value.trim().replace(',', '.'));
  return value.trim() !== '' && Number.isFinite(figure) ? figure : null;
}

/** A saved text or figure back as typed. */
export const asText = (value: unknown) =>
  typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';

/** A saved catalog reference, or null when it is none. */
export function toCatalogRef(value: unknown): CatalogRef | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'object' && value !== null && 'name' in value) {
    const name = (value as { name: unknown }).name;
    if (typeof name === 'string' && name.trim() !== '') return { name };
  }
  return null;
}

/** A saved list of catalog references, without whatever is not one. */
export const toCatalogRefs = (value: unknown): CatalogRef[] =>
  Array.isArray(value)
    ? value.map(toCatalogRef).filter((ref): ref is CatalogRef => ref !== null)
    : [];

/** A count of animals as typed: its digits, or none. */
export function toCount(value: string): number | null {
  const digits = value.replace(/\D/g, '');
  return digits === '' ? null : Number(digits);
}
