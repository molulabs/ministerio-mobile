import { DEFAULT_NATIONALITY } from '@/src/shared/constants/nationality';

import type { IndexedProducer } from '../../../catalogs.queries';
import {
  asText as text,
  type LocalityRef,
  textOrNull,
  toCatalogRef,
  toNumber as toCoordinate,
} from '../../fields/fields.helper';
import { CUIL_DIGITS } from './producer.constants';

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

/**
 * What the census does not ask a registered producer: the office already has it. Of them it only
 * shows the name and the document, and those are not edited.
 */
const KEPT_BY_THE_OFFICE = [
  'birthDate',
  'nationality',
  'cuil',
  'phone',
  'email',
  'street',
  'number',
  'department',
  'locality',
  'postalCode',
  'paraje',
  'community',
  'apartment',
  'brandAndSignals',
  'latitude',
  'longitude',
] as const;

/**
 * The registered producer as the census sends it: the office's name, and the rest empty, which the
 * API reads as "keep". Nothing typed of a producer that turns out registered replaces their data.
 */
export const asRegistered = (producer: ProducerValues, found: IndexedProducer): ProducerValues => ({
  ...producer,
  ...Object.fromEntries(KEPT_BY_THE_OFFICE.map((key) => [key, EMPTY_PRODUCER[key]])),
  fullName: found.fullName,
});

/** Whether the producer already goes as asRegistered does. */
export const isAsRegistered = (producer: ProducerValues, found: IndexedProducer) =>
  producer.fullName === found.fullName &&
  KEPT_BY_THE_OFFICE.every((key) => producer[key] === EMPTY_PRODUCER[key]);

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
    locality: toCatalogRef(section.localityId),
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
