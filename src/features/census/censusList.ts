import type { CensusFieldError, CensusStatus } from '@/src/infrastructure/db/schema';

/** A census as the list shows it. Drafts are not listed until the census form exists. */
export type CensusListItem = {
  id: string;
  status: Exclude<CensusStatus, 'draft'>;
  producer: string | null;
  /** "DNI 99000001", "CUIL 20-…": how the census identifies the producer. */
  document: string | null;
  /** The census date as the payload has it, YYYY-MM-DD. */
  date: string | null;
  errors: CensusFieldError[];
  conflict: string | null;
};

export type CensusRow = {
  id: string;
  status: CensusStatus;
  payload: Record<string, unknown>;
  errors: CensusFieldError[] | null;
  conflict: string | null;
};

const stringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null;

function describeDocument(type: unknown, number: unknown): string | null {
  const documentNumber = stringOrNull(number);
  if (!documentNumber) return null;
  const documentType = stringOrNull(type);
  return documentType ? `${documentType} ${documentNumber}` : documentNumber;
}

/** Reads what the list shows from the payload, which is whatever the form saved. */
export function toListItem(row: CensusRow): CensusListItem | null {
  if (row.status === 'draft') return null;
  const producer = (row.payload.producer ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    status: row.status,
    producer: stringOrNull(producer.fullName),
    document: describeDocument(producer.documentType, producer.documentNumber),
    date: stringOrNull(row.payload.date),
    errors: row.errors ?? [],
    conflict: row.conflict,
  };
}

export type CensusSectionKey = 'toCheck' | 'pending' | 'sent';

export type CensusSection = { key: CensusSectionKey; items: CensusListItem[] };

const SECTION_OF: Record<CensusListItem['status'], CensusSectionKey> = {
  needs_fix: 'toCheck',
  anomaly: 'toCheck',
  ready: 'pending',
  sent: 'sent',
  in_review: 'sent',
};

/** What needs the enumerator first, then what is still on the phone, then what went out. */
const SECTION_ORDER: CensusSectionKey[] = ['toCheck', 'pending', 'sent'];

/** Groups the censuses by what the enumerator has to do, keeping their order; empty groups go. */
export function groupCensuses(items: CensusListItem[]): CensusSection[] {
  return SECTION_ORDER.map((key) => ({
    key,
    items: items.filter((item) => SECTION_OF[item.status] === key),
  })).filter((section) => section.items.length > 0);
}

/** 2026-11-13 → 13/11/2026; anything else is shown as it is. */
export function formatCensusDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : date;
}
