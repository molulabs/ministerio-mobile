import { Autocomplete, DateInput, Field, SectionHeader } from '@molulabs/ds';
import { useEffect, useId, useState } from 'react';

import { COUNTRIES } from '@/src/shared/constants/nationality';
import { AutocompleteField } from '@/src/shared/ui/AutocompleteField';
import { SelectField } from '@/src/shared/ui/SelectField';
import { Text } from '@/src/shared/ui/Text';
import { TextField } from '@/src/shared/ui/TextField';

import {
  type IndexedProducer,
  searchProducers,
  useIsRegisteredProducer,
} from '../../../catalogs.queries';
import { CoordinatesFields } from '../../fields/CoordinatesFields';
import { DEPARTMENT_OPTIONS, FIELD_TEXTS } from '../../fields/fields.constants';
import { LocalityField } from '../../fields/LocalityField';
import { FarmFields } from './FarmFields';
import {
  DOCUMENT_TYPE_OPTIONS,
  MAX_LENGTH,
  MIN_SEARCH_CHARS,
  PRODUCER_TEXTS as T,
} from './producer.constants';
import {
  type FarmValues,
  hasContactOrAddress,
  hasProducer,
  newProducer,
  onlyDigits,
  type ProducerValues,
  registeredProducer,
  withoutContactAndAddress,
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

  // A new producer whose document turns out registered: what was typed of the contact and the
  // address is no longer shown, so it does not go either (it would replace the office's data).
  useEffect(() => {
    if (registered && hasContactOrAddress(producer)) {
      onChange({ producer: withoutContactAndAddress(producer) });
    }
  }, [registered, producer, onChange]);

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

          {/* Of a registered producer the office already has the contact and the address: the
              census does not ask them again (left empty, the API keeps them). */}
          {!registered && (
            <>
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
                label={FIELD_TEXTS.department}
                value={producer.department}
                // The locality belongs to the department, so a new one starts it over.
                onChange={(department) => set({ department, locality: null })}
                options={DEPARTMENT_OPTIONS}
                placeholder={FIELD_TEXTS.departmentPlaceholder}
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
              <CoordinatesFields
                latitude={producer.latitude}
                longitude={producer.longitude}
                onChange={(latitude, longitude) => set({ latitude, longitude })}
              />
            </>
          )}

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
          // DNI or CUIL: digits only, so the numeric keyboard.
          type="number"
        />
      </Field>
    </>
  );
}
