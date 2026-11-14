import { Autocomplete, Button, DateInput, Field, SectionHeader } from '@molulabs/ds';
import { useEffect, useId, useState } from 'react';

import {
  currentLocation,
  requestLocationPermission,
} from '@/src/infrastructure/location/currentLocation';
import { COUNTRIES } from '@/src/shared/constants/nationality';
import { AutocompleteField } from '@/src/shared/ui/AutocompleteField';
import { SelectField } from '@/src/shared/ui/SelectField';
import { Text } from '@/src/shared/ui/Text';
import { TextField } from '@/src/shared/ui/TextField';
import { formatDegrees } from '@/src/shared/utilities/coordinates';

import {
  type IndexedProducer,
  searchProducers,
  useIsRegisteredProducer,
  useLocalities,
} from '../../../catalogs.queries';
import { FarmFields } from './FarmFields';
import {
  DEPARTMENT_OPTIONS,
  DOCUMENT_TYPE_OPTIONS,
  MAX_LENGTH,
  MIN_SEARCH_CHARS,
  PRODUCER_TEXTS as T,
} from './producer.constants';
import {
  type FarmValues,
  hasProducer,
  type LocalityRef,
  newProducer,
  onlyDigits,
  type ProducerValues,
  registeredProducer,
} from './producer.helper';

type Props = {
  producer: ProducerValues;
  farm: FarmValues;
  newFarm: boolean;
  onChange: (patch: { producer?: ProducerValues; farm?: FarmValues; newFarm?: boolean }) => void;
};

const NATIONALITY_OPTIONS = COUNTRIES.map((country) => ({ label: country, value: country }));

/**
 * The producer step (the web's CensusProducerStep): find the producer by DNI or CUIL among the
 * registered ones, or start a new one from the text searched; then their data and the farm's.
 */
export function ProducerStep({ producer, farm, newFarm, onChange }: Props) {
  const registered = useIsRegisteredProducer(producer.documentNumber);
  const set = (patch: Partial<ProducerValues>) => onChange({ producer: { ...producer, ...patch } });

  // Another producer is another person: the farm questions start over too.
  const choose = (next: ProducerValues) => onChange({ producer: next, newFarm: false });

  return (
    <>
      <ProducerSearch
        initial={producer.documentNumber}
        onPick={(found) => choose(registeredProducer(found))}
        onCreate={(text) => choose(newProducer(text))}
      />

      {hasProducer(producer) && (
        <>
          <Text variant="muted">{registered ? T.registered : T.newProducer}</Text>

          <SectionHeader title={T.data} />
          <TextField
            label={T.fullName}
            required
            value={producer.fullName}
            onChangeText={(fullName) => set({ fullName })}
            maxLength={MAX_LENGTH.fullName}
            autoCapitalize="words"
          />
          {registered ? (
            <TextField label={T.document} value={producer.documentNumber} disabled />
          ) : (
            <>
              <SelectField
                label={T.documentType}
                required
                value={producer.documentType}
                onChange={(documentType) => set({ documentType })}
                options={DOCUMENT_TYPE_OPTIONS}
                placeholder={T.documentTypePlaceholder}
              />
              <TextField
                label={T.documentNumber}
                required
                value={producer.documentNumber}
                onChangeText={(documentNumber) => set({ documentNumber })}
                keyboardType={producer.documentType === 'PASAPORTE' ? 'default' : 'number-pad'}
                autoCapitalize="characters"
              />
            </>
          )}
          <TextField
            label={T.cuil}
            value={producer.cuil}
            onChangeText={(cuil) => set({ cuil })}
            maxLength={MAX_LENGTH.cuil}
            keyboardType="number-pad"
          />
          <Field label={T.birthDate}>
            <DateInput
              value={producer.birthDate}
              onChange={(birthDate: string) => set({ birthDate })}
            />
          </Field>
          <AutocompleteField
            label={T.nationality}
            valueLabel={producer.nationality}
            options={NATIONALITY_OPTIONS}
            onPick={(option) => set({ nationality: option.value })}
            placeholder={T.nationalityPlaceholder}
          />

          <SectionHeader title={T.contact} />
          <TextField
            label={T.phone}
            value={producer.phone}
            onChangeText={(phone) => set({ phone })}
            maxLength={MAX_LENGTH.phone}
            keyboardType="phone-pad"
          />
          <TextField
            label={T.email}
            value={producer.email}
            onChangeText={(email) => set({ email })}
            maxLength={MAX_LENGTH.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <SectionHeader title={T.address} />
          <TextField
            label={T.street}
            value={producer.street}
            onChangeText={(street) => set({ street })}
            maxLength={MAX_LENGTH.street}
          />
          <TextField
            label={T.number}
            value={producer.number}
            onChangeText={(number) => set({ number })}
            maxLength={MAX_LENGTH.number}
          />
          <SelectField
            label={T.department}
            value={producer.department}
            // The locality belongs to the department, so a new one starts it over.
            onChange={(department) => set({ department, locality: null })}
            options={DEPARTMENT_OPTIONS}
            placeholder={T.departmentPlaceholder}
          />
          <LocalityField
            department={producer.department}
            value={producer.locality}
            onChange={(locality) => set({ locality })}
          />
          <TextField
            label={T.postalCode}
            value={producer.postalCode}
            onChangeText={(postalCode) => set({ postalCode })}
            maxLength={MAX_LENGTH.postalCode}
          />
          <TextField
            label={T.paraje}
            value={producer.paraje}
            onChangeText={(paraje) => set({ paraje })}
            maxLength={MAX_LENGTH.paraje}
          />
          <TextField
            label={T.community}
            value={producer.community}
            onChangeText={(community) => set({ community })}
            maxLength={MAX_LENGTH.community}
          />
          <TextField
            label={T.apartment}
            value={producer.apartment}
            onChangeText={(apartment) => set({ apartment })}
            maxLength={MAX_LENGTH.apartment}
          />
          <TextField
            label={T.brandAndSignals}
            value={producer.brandAndSignals}
            onChangeText={(brandAndSignals) => set({ brandAndSignals })}
            maxLength={MAX_LENGTH.brandAndSignals}
          />
          <Coordinates
            latitude={producer.latitude}
            longitude={producer.longitude}
            onChange={(latitude, longitude) => set({ latitude, longitude })}
          />

          <FarmFields
            farm={farm}
            newFarm={newFarm}
            // A new producer has no farm yet: this one is their first.
            canBeAnotherFarm={registered}
            onChange={onChange}
          />
        </>
      )}
    </>
  );
}

/** The search of the registered producers, on the phone's copy of them. */
function ProducerSearch({
  initial,
  onPick,
  onCreate,
}: {
  initial: string;
  onPick: (producer: IndexedProducer) => void;
  onCreate: (text: string) => void;
}) {
  const id = useId();
  const [search, setSearch] = useState(initial);
  const [found, setFound] = useState<IndexedProducer[]>([]);
  const searching = search.trim().length >= MIN_SEARCH_CHARS;

  useEffect(() => {
    if (!searching) return;
    let active = true;
    void searchProducers(search).then((producers) => {
      if (active) setFound(producers);
    });
    return () => {
      active = false;
    };
  }, [search, searching]);

  return (
    <>
      {/* The step is already titled Productor: only what to do. */}
      <Text variant="muted">{T.searchHint}</Text>
      <Field label={T.searchLabel} htmlFor={id}>
        <Autocomplete
          id={id}
          value={search}
          onChange={setSearch}
          items={(searching ? found : []).map((producer) => ({
            label: producer.fullName,
            meta: producer.documentNumber,
            value: producer.documentNumber,
            producer,
          }))}
          onSelect={(item) => {
            const producer = item.producer as IndexedProducer;
            setSearch(producer.documentNumber);
            onPick(producer);
          }}
          onCreate={(text) => onCreate(text)}
          createLabel={T.create}
          // A document already registered is that producer, not a new one: no "Crear productor".
          matchExact={(item, text) =>
            onlyDigits(text) !== '' && onlyDigits(String(item.meta)) === onlyDigits(text)
          }
          placeholder={T.searchPlaceholder}
          emptyLabel={T.searchEmpty}
        />
      </Field>
    </>
  );
}

/** The locality, among the department's on the phone, or a new one by its name. */
function LocalityField({
  department,
  value,
  onChange,
}: {
  department: string;
  value: LocalityRef;
  onChange: (locality: LocalityRef) => void;
}) {
  const localities = useLocalities(department);
  const label =
    value === null
      ? ''
      : typeof value === 'number'
        ? (localities.find((locality) => locality.id === value)?.name ?? '')
        : value.name;

  return (
    <AutocompleteField
      label={T.locality}
      valueLabel={label}
      options={localities.map((locality) => ({ label: locality.name, value: locality.id }))}
      onPick={(option) => onChange(option.value)}
      onCreate={(name) => onChange({ name })}
      createLabel={T.createLocality}
      placeholder={T.localityPlaceholder}
      emptyLabel={T.localityEmpty}
      disabled={department === ''}
      hint={
        department === ''
          ? T.localityNeedsDepartment
          : value !== null && typeof value === 'object'
            ? T.newLocality
            : undefined
      }
    />
  );
}

type Locating = 'idle' | 'locating' | 'denied' | 'none';

/** Latitude and longitude, typed or taken from the GPS (it needs no signal). */
function Coordinates({
  latitude,
  longitude,
  onChange,
}: {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
}) {
  const [locating, setLocating] = useState<Locating>('idle');

  const locate = async () => {
    if (!(await requestLocationPermission())) {
      setLocating('denied');
      return;
    }
    setLocating('locating');
    const position = await currentLocation();
    if (!position) {
      setLocating('none');
      return;
    }
    setLocating('idle');
    onChange(formatDegrees(position.coords.latitude), formatDegrees(position.coords.longitude));
  };

  const notice =
    locating === 'denied' ? T.locationDenied : locating === 'none' ? T.noLocation : null;

  return (
    <>
      <TextField
        label={T.latitude}
        value={latitude}
        onChangeText={(next) => onChange(next, longitude)}
        keyboardType="numbers-and-punctuation"
        mono
      />
      <TextField
        label={T.longitude}
        value={longitude}
        onChangeText={(next) => onChange(latitude, next)}
        keyboardType="numbers-and-punctuation"
        mono
      />
      <Button
        tone="secondary"
        icon="ti-current-location"
        disabled={locating === 'locating'}
        onClick={() => void locate()}
        aria-label={locating === 'locating' ? T.locating : T.useLocation}
      >
        {locating === 'locating' ? T.locating : T.useLocation}
      </Button>
      {notice && <Text variant="muted">{notice}</Text>}
    </>
  );
}
