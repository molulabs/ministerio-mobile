/** The payload version the API reads (CensusSubmissionService::SCHEMA_VERSION). */
export const SCHEMA_VERSION = 2;

/** The parts of the payload each step fills, shaped like the request the web saves that step with. */
export const CENSUS_SECTIONS = [
  'producer',
  'familyFinances',
  'productionUnit',
  'livestock',
  'crops',
  'farmInputs',
  'infrastructure',
] as const;

export type CensusSection = (typeof CENSUS_SECTIONS)[number];

type Section = Record<string, unknown>;

/** The body of the PUT, as a draft keeps it on the phone. */
export type CensusPayload = {
  schemaVersion: number;
  /** YYYY-MM-DD. */
  date: string | null;
  formNumber: string | null;
  observations: string | null;
  /** "Es otra finca del productor": the API gives the census a new farm. */
  newFarm: boolean;
} & Record<CensusSection, Section>;

/** What the wizard edits. Each step owns its section; a step not built yet keeps it as it came. */
export type CensusFormValues = {
  date: string;
  formNumber: string;
  observations: string;
  newFarm: boolean;
  sections: Record<CensusSection, Section>;
};

const emptySections = (): Record<CensusSection, Section> =>
  Object.fromEntries(CENSUS_SECTIONS.map((section) => [section, {}])) as Record<
    CensusSection,
    Section
  >;

/** YYYY-MM-DD of the phone's own day, not UTC: a census taken at 22:00 in Jujuy is of that day. */
export function localIsoDate(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** A new census: taken today, nothing else said yet. */
export function emptyCensusValues(now: Date): CensusFormValues {
  return {
    date: localIsoDate(now),
    formNumber: '',
    observations: '',
    newFarm: false,
    sections: emptySections(),
  };
}

const textOrNull = (value: string) => (value.trim() === '' ? null : value.trim());

export function toCensusPayload(values: CensusFormValues): CensusPayload {
  return {
    schemaVersion: SCHEMA_VERSION,
    date: values.date === '' ? null : values.date,
    formNumber: textOrNull(values.formNumber),
    observations: textOrNull(values.observations),
    newFarm: values.newFarm,
    ...values.sections,
  };
}

const isSection = (value: unknown): value is Section =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringOr = (value: unknown, fallback: string) =>
  typeof value === 'string' ? value : fallback;

/** A saved draft back into the form. Whatever the draft lacks starts empty. */
export function fromCensusPayload(payload: Record<string, unknown>): CensusFormValues {
  const sections = emptySections();
  for (const section of CENSUS_SECTIONS) {
    const value = payload[section];
    if (isSection(value)) sections[section] = value;
  }
  return {
    date: stringOr(payload.date, ''),
    formNumber: stringOr(payload.formNumber, ''),
    observations: stringOr(payload.observations, ''),
    newFarm: payload.newFarm === true,
    sections,
  };
}

/**
 * What stops a census from being finished: the API would only reject it. Everything else the
 * API checks, and a 422 brings the census back to fix.
 */
export function missingToFinish(values: CensusFormValues): ('date' | 'producer')[] {
  const missing: ('date' | 'producer')[] = [];
  if (values.date === '') missing.push('date');
  const producer = values.sections.producer;
  const filled = (field: string) =>
    typeof producer[field] === 'string' && (producer[field] as string).trim() !== '';
  if (!filled('fullName') || !filled('documentType') || !filled('documentNumber')) {
    missing.push('producer');
  }
  return missing;
}
