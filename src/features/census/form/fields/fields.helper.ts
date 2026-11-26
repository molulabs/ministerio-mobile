/** A locality of the catalog by its id, or one the catalog lacks by its name (the API adds it). */
export type LocalityRef = CatalogRef | null;

/**
 * Where an address is, as typed: each level inside the one before it. The municipality is always
 * one of the catalog (they are loaded in the office, never added from the phone).
 */
export type PlaceValues = {
  department: string;
  municipality: number | null;
  locality: LocalityRef;
};

/** What the place needs of a locality of the catalog. */
type CatalogLocality = { id: number; municipalityId: number | null };

/** Another department has other municipalities and localities, so it starts them over. */
export const withDepartment = (department: string): PlaceValues => ({
  department,
  municipality: null,
  locality: null,
});

/**
 * The locality stays only while it is in the municipality: one of the catalog when it is that
 * municipality's, a new one (added inside the municipality) while there is a municipality.
 */
export function withMunicipality(
  place: PlaceValues,
  municipality: number | null,
  localities: CatalogLocality[],
): PlaceValues {
  const { locality } = place;
  const stays =
    typeof locality === 'number'
      ? (localities.find(({ id }) => id === locality)?.municipalityId ?? null) === municipality
      : locality !== null && municipality !== null;
  return { ...place, municipality, locality: stays ? locality : null };
}

/** A locality of the catalog brings its municipality, when the catalog says which it is. */
export function withLocality(
  place: PlaceValues,
  locality: LocalityRef,
  localities: CatalogLocality[],
): PlaceValues {
  const municipality =
    typeof locality === 'number'
      ? (localities.find(({ id }) => id === locality)?.municipalityId ?? null)
      : null;
  return { ...place, locality, municipality: municipality ?? place.municipality };
}

/** A saved id of a catalog entry the phone only picks, never adds; null when it is none. */
export const toId = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) ? value : null;

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
