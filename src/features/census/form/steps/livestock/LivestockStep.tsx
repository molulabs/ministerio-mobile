import { Field, MultiChoice, SectionHeader } from '@molulabs/ds';
import type { ReactNode } from 'react';

import { Text } from '@/src/shared/ui/Text';
import { TextField } from '@/src/shared/ui/TextField';
import { YesNoField } from '@/src/shared/ui/YesNoField';

import { BreedsField } from './BreedsField';
import {
  CATTLE_ROWS,
  EQUINE_ROWS,
  GOAT_PRACTICES,
  GOAT_ROWS,
  keysOf,
  LIVESTOCK_TEXTS as T,
  LLAMA_PRACTICES,
  LLAMA_ROWS,
  PIG_ROWS,
  POULTRY_FIELDS,
  SHEEP_ORIENTATION_OPTIONS,
  SHEEP_ROWS,
  type SpeciesRow,
} from './livestock.constants';
import {
  type BreedKey,
  type CountKey,
  declaredTotalDiffers,
  type LivestockValues,
  sum,
  type YesNoKey,
} from './livestock.helper';
import { CountField, SpeciesCounts } from './SpeciesCounts';

type Props = {
  values: LivestockValues;
  onChange: (values: LivestockValues) => void;
};

/**
 * The livestock step (the web's CensusLivestockStep): whether the farm has livestock, and of each
 * species whether it has any, how many of each kind, their breeds and what the paper form says.
 */
export function LivestockStep({ values, onChange }: Props) {
  const set = (patch: Partial<LivestockValues>) => onChange({ ...values, ...patch });

  const species = (props: Omit<SpeciesProps, 'values' | 'set'>) => (
    <Species {...props} values={values} set={set} />
  );

  return (
    <>
      <YesNoField
        label={T.hasActivity}
        value={values.hasLivestockActivity}
        onChange={(hasLivestockActivity) => set({ hasLivestockActivity })}
      />

      {values.hasLivestockActivity && (
        <>
          {species({
            title: 'Bovinos',
            question: '¿Posee bovinos?',
            hasKey: 'hasCattle',
            rows: CATTLE_ROWS,
            name: 'bovinos',
            breeds: { key: 'cattleBreeds', species: 'CATTLE' },
            declaredKey: 'cattleDeclaredTotal',
          })}

          <SectionHeader title="Aves de corral" />
          <YesNoField
            label="¿Posee aves de corral?"
            value={values.hasPoultry}
            onChange={(hasPoultry) => set({ hasPoultry })}
          />
          {values.hasPoultry && (
            <>
              {POULTRY_FIELDS.map((field) => (
                <CountField
                  key={field.key}
                  label={field.label}
                  value={values[field.key]}
                  onChange={(count) => set({ [field.key]: count })}
                />
              ))}
              <TextField
                label={T.poultryOtherDetail}
                value={values.poultryOtherDetail}
                onChangeText={(poultryOtherDetail) => set({ poultryOtherDetail })}
              />
              <Text variant="muted">
                {T.total(
                  'aves',
                  sum(
                    values,
                    POULTRY_FIELDS.map((field) => field.key),
                  ),
                )}
              </Text>
            </>
          )}

          {species({
            title: 'Ovinos',
            question: '¿Posee ovinos?',
            hasKey: 'hasSheep',
            rows: SHEEP_ROWS,
            name: 'ovinos',
            breeds: { key: 'sheepBreeds', species: 'SHEEP' },
            declaredKey: 'sheepDeclaredTotal',
            extra: (
              <Field label={T.sheepOrientation}>
                <MultiChoice
                  variant="list"
                  value={values.sheepOrientation}
                  onChange={(sheepOrientation) => set({ sheepOrientation })}
                  options={SHEEP_ORIENTATION_OPTIONS}
                />
              </Field>
            ),
          })}

          {species({
            title: 'Caprinos',
            question: '¿Posee caprinos?',
            hasKey: 'hasGoats',
            rows: GOAT_ROWS,
            name: 'caprinos',
            breeds: { key: 'goatBreeds', species: 'GOAT' },
            declaredKey: 'goatDeclaredTotal',
            practices: GOAT_PRACTICES,
          })}

          {species({
            title: 'Llamas',
            question: '¿Posee llamas?',
            hasKey: 'hasLlamas',
            rows: LLAMA_ROWS,
            name: 'llamas',
            declaredKey: 'llamaDeclaredTotal',
            extra: (
              <TextField
                label={T.otherCamelids}
                value={values.llamaOtherCamelidsDetail}
                onChangeText={(llamaOtherCamelidsDetail) => set({ llamaOtherCamelidsDetail })}
              />
            ),
            practices: LLAMA_PRACTICES,
          })}

          {species({
            title: 'Porcinos',
            question: '¿Posee porcinos?',
            hasKey: 'hasPigs',
            rows: PIG_ROWS,
            name: 'porcinos',
            breeds: { key: 'pigBreeds', species: 'PIG' },
            declaredKey: 'pigDeclaredTotal',
          })}

          {species({
            title: 'Equinos y asnales',
            question: '¿Posee equinos o asnales?',
            hasKey: 'hasEquines',
            rows: EQUINE_ROWS,
          })}
        </>
      )}
    </>
  );
}

type SpeciesProps = {
  title: string;
  question: string;
  hasKey: YesNoKey;
  rows: SpeciesRow[];
  /** For the totals, "bovinos"; a species without totals has none. */
  name?: string;
  breeds?: { key: BreedKey; species: string };
  declaredKey?: CountKey;
  /** What the species asks besides the counts, after the totals. */
  extra?: ReactNode;
  practices?: { key: YesNoKey; label: string }[];
  values: LivestockValues;
  set: (patch: Partial<LivestockValues>) => void;
};

/** One species: whether the farm has it and, if so, its counts, totals, breeds and practices. */
function Species({
  title,
  question,
  hasKey,
  rows,
  name,
  breeds,
  declaredKey,
  extra,
  practices = [],
  values,
  set,
}: SpeciesProps) {
  const total = sum(values, keysOf(rows));

  return (
    <>
      <SectionHeader title={title} />
      <YesNoField
        label={question}
        value={values[hasKey]}
        onChange={(has) => set({ [hasKey]: has })}
      />
      {values[hasKey] && (
        <>
          <SpeciesCounts rows={rows} values={values} onChange={set} />
          {name && <Text variant="muted">{T.total(name, total)}</Text>}
          {breeds && name && (
            <BreedsField
              label={`${T.breeds} (${name})`}
              species={breeds.species}
              value={values[breeds.key]}
              onChange={(picked) => set({ [breeds.key]: picked })}
            />
          )}
          {declaredKey && name && (
            <CountField
              label={T.declaredTotal(name)}
              value={values[declaredKey]}
              onChange={(count) => set({ [declaredKey]: count })}
              error={
                declaredTotalDiffers(values[declaredKey], total)
                  ? T.declaredTotalWarning
                  : undefined
              }
            />
          )}
          {extra}
          {practices.map((practice) => (
            <YesNoField
              key={practice.key}
              label={practice.label}
              value={values[practice.key]}
              onChange={(answer) => set({ [practice.key]: answer })}
            />
          ))}
        </>
      )}
    </>
  );
}
