import { Field, MultiChoice, SectionHeader } from '@molulabs/ds';
import type { ReactNode } from 'react';

import { Text } from '@/src/shared/ui/Text';
import { TextField } from '@/src/shared/ui/TextField';
import { YesNoField } from '@/src/shared/ui/YesNoField';

import { NumberField } from '../../fields/NumberField';
import { BreedsField } from './BreedsField';
import {
  CATTLE,
  EQUINES,
  GOATS,
  keysOf,
  LIVESTOCK_TEXTS as T,
  LLAMAS,
  PIGS,
  POULTRY_FIELDS,
  SHEEP,
  SHEEP_ORIENTATION_OPTIONS,
  type Species,
} from './livestock.constants';
import { declaredTotalDiffers, type LivestockValues, sum } from './livestock.helper';
import { SpeciesCounts } from './SpeciesCounts';

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
    <SpeciesSection {...props} values={values} set={set} />
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
          {species(CATTLE)}

          <SectionHeader title={T.poultry} />
          <YesNoField
            label={T.hasPoultry}
            value={values.hasPoultry}
            onChange={(hasPoultry) => set({ hasPoultry })}
          />
          {values.hasPoultry && (
            <>
              {POULTRY_FIELDS.map((field) => (
                <NumberField
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
            ...SHEEP,
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

          {species(GOATS)}

          {species({
            ...LLAMAS,
            extra: (
              <TextField
                label={T.otherCamelids}
                value={values.llamaOtherCamelidsDetail}
                onChangeText={(llamaOtherCamelidsDetail) => set({ llamaOtherCamelidsDetail })}
              />
            ),
          })}

          {species(PIGS)}

          {species(EQUINES)}
        </>
      )}
    </>
  );
}

type SpeciesProps = Species & {
  /** What the species asks besides the counts, after the totals. */
  extra?: ReactNode;
  values: LivestockValues;
  set: (patch: Partial<LivestockValues>) => void;
};

/** One species: whether the farm has it and, if so, its counts, totals, breeds and practices. */
function SpeciesSection({
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
            <NumberField
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
