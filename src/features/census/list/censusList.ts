import type { CensusFieldError, CensusStatus } from '@/src/infrastructure/db/schema';

import { labelOfField } from '../form/fieldLabels';
import { PROVISIONAL_DOCUMENT } from '../form/steps/producer/producer.constants';

/** A census as the list shows it. */
export type CensusListItem = {
  id: string;
  status: CensusStatus;
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
  if (documentType === PROVISIONAL_DOCUMENT.type) {
    return `${PROVISIONAL_DOCUMENT.label} (${documentNumber})`;
  }
  return documentType ? `${documentType} ${documentNumber}` : documentNumber;
}

/** Reads what the list shows from the payload, which is whatever the form saved. */
export function toListItem(row: CensusRow): CensusListItem {
  const producer = (row.payload.producer ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    status: row.status,
    producer: stringOrNull(producer.fullName),
    document: describeDocument(producer.documentType, producer.documentNumber),
    date: stringOrNull(row.payload.date),
    // A census to fix still has the payload the API rejected; a draft being fixed keeps the
    // names given when it was reopened.
    errors: (row.errors ?? []).map((error) => ({
      ...error,
      label: error.label ?? labelOfField(error.field, row.payload),
    })),
    conflict: row.conflict,
  };
}

export type CensusSectionKey = 'toCheck' | 'drafts' | 'pending' | 'sent';

export type CensusSection = { key: CensusSectionKey; items: CensusListItem[] };

const SECTION_OF: Record<CensusListItem['status'], CensusSectionKey> = {
  draft: 'drafts',
  needs_fix: 'toCheck',
  anomaly: 'toCheck',
  ready: 'pending',
  sent: 'sent',
  in_review: 'sent',
};

/** What needs the enumerator first, then what they are still taking, what is still on the phone, and what went out. */
const SECTION_ORDER: CensusSectionKey[] = ['toCheck', 'drafts', 'pending', 'sent'];

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
