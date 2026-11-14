import { DEFAULT_NATIONALITY } from '@/src/shared/constants/nationality';

import type { IndexedProducer } from '../../../catalogs.queries';
import { CUIL_DIGITS } from './producer.constants';

/** A locality of the catalog by its id, or one the catalog lacks by its name (the API adds it). */
export type LocalityRef = number | { name: string } | null;

/** What the producer step edits of the producer, as typed. */
export type ProducerValues = {
  fullName: string;
  documentType: string;
  documentNumber: string;
  /** YYYY-MM-DD. */
  birthDate: string;
  nationality: string;
  cuil: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  department: string;
  locality: LocalityRef;
  postalCode: string;
  paraje: string;
  community: string;
  apartment: string;
  brandAndSignals: string;
  latitude: string;
  longitude: string;
};

/** What the producer step asks of the farm. It travels in productionUnit. */
export type FarmValues = {
  renspa: string;
  producerLivesOnFarm: boolean;
};

export const EMPTY_PRODUCER: ProducerValues = {
  fullName: '',
  documentType: 'DNI',
  documentNumber: '',
  birthDate: '',
  nationality: '',
  cuil: '',
  phone: '',
  email: '',
  street: '',
  number: '',
  department: '',
  locality: null,
  postalCode: '',
  paraje: '',
  community: '',
  apartment: '',
  brandAndSignals: '',
  latitude: '',
  longitude: '',
};

export const EMPTY_FARM: FarmValues = { renspa: '', producerLivesOnFarm: false };

export const onlyDigits = (text: string) => text.replace(/\D/g, '');

/** Whether a producer was chosen or started: the step shows the form only then. */
export const hasProducer = (producer: ProducerValues) =>
  producer.fullName.trim() !== '' || producer.documentNumber.trim() !== '';

/**
 * A new producer from the text searched (the web's toNewProducerDefaults): a document, a CUIL by
 * its 11 digits, or the name when it is not a number. Most producers are Argentine.
 */
export function newProducer(text: string): ProducerValues {
  const start = { ...EMPTY_PRODUCER, nationality: DEFAULT_NATIONALITY };
  if (!/^[\d.\-\s]+$/.test(text)) return { ...start, fullName: text.trim() };
  const digits = onlyDigits(text);
  return digits.length === CUIL_DIGITS
    ? { ...start, documentNumber: digits, documentType: 'CUIL' }
    : { ...start, documentNumber: digits };
}

/**
 * A registered producer, of whom the phone has only the name and the document. The API keeps
 * their document type and every field left empty, so nothing else starts filled: not even the
 * nationality, which would replace theirs.
 */
export function registeredProducer(producer: IndexedProducer): ProducerValues {
  return {
    ...EMPTY_PRODUCER,
    fullName: producer.fullName,
    documentNumber: producer.documentNumber,
    documentType: onlyDigits(producer.documentNumber).length === CUIL_DIGITS ? 'CUIL' : 'DNI',
  };
}

const textOrNull = (value: string) => (value.trim() === '' ? null : value.trim());

/** A lone "-" or "." is no figure yet: it goes as no coordinate (the web's toCoordinate). */
function toCoordinate(value: string): number | null {
  const coordinate = Number(value.replace(',', '.'));
  return value.trim() !== '' && Number.isFinite(coordinate) ? coordinate : null;
}

/** A passport keeps its letters; any other document is its digits, as the index has them. */
const documentOf = (values: ProducerValues) =>
  values.documentType === 'PASAPORTE'
    ? values.documentNumber.trim()
    : onlyDigits(values.documentNumber);

/** The producer section of the payload: the API's ProducerRequest. */
export function toProducerPayload(values: ProducerValues): Record<string, unknown> {
  return {
    fullName: values.fullName.trim(),
    documentType: values.documentType,
    documentNumber: documentOf(values),
    birthDate: textOrNull(values.birthDate),
    nationality: textOrNull(values.nationality),
    cuil: textOrNull(values.cuil),
    phone: textOrNull(values.phone),
    email: textOrNull(values.email),
    street: textOrNull(values.street),
    number: textOrNull(values.number),
    department: textOrNull(values.department),
    localityId: values.locality,
    postalCode: textOrNull(values.postalCode),
    paraje: textOrNull(values.paraje),
    community: textOrNull(values.community),
    apartment: textOrNull(values.apartment),
    brandAndSignals: textOrNull(values.brandAndSignals),
    latitude: toCoordinate(values.latitude),
    longitude: toCoordinate(values.longitude),
  };
}

const text = (value: unknown) =>
  typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';

function toLocalityRef(value: unknown): LocalityRef {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'object' && value !== null && 'name' in value) {
    const name = (value as { name: unknown }).name;
    if (typeof name === 'string' && name.trim() !== '') return { name };
  }
  return null;
}

/** A saved producer section back into the step. */
export function fromProducerPayload(section: Record<string, unknown>): ProducerValues {
  return {
    fullName: text(section.fullName),
    documentType: text(section.documentType) || EMPTY_PRODUCER.documentType,
    documentNumber: text(section.documentNumber),
    birthDate: text(section.birthDate),
    nationality: text(section.nationality),
    cuil: text(section.cuil),
    phone: text(section.phone),
    email: text(section.email),
    street: text(section.street),
    number: text(section.number),
    department: text(section.department),
    locality: toLocalityRef(section.localityId),
    postalCode: text(section.postalCode),
    paraje: text(section.paraje),
    community: text(section.community),
    apartment: text(section.apartment),
    brandAndSignals: text(section.brandAndSignals),
    latitude: text(section.latitude),
    longitude: text(section.longitude),
  };
}

/** The farm fields within productionUnit: the API's FarmDataRequest. */
export function toFarmPayload(values: FarmValues): Record<string, unknown> {
  return { renspa: textOrNull(values.renspa), producerLivesOnFarm: values.producerLivesOnFarm };
}

export function fromFarmPayload(productionUnit: Record<string, unknown>): FarmValues {
  return {
    renspa: text(productionUnit.renspa),
    producerLivesOnFarm: productionUnit.producerLivesOnFarm === true,
  };
}
