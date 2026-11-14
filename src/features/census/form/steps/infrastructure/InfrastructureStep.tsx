import { Field, MultiChoice, SectionHeader } from '@molulabs/ds';

import { TextField } from '@/src/shared/ui/TextField';

import { FieldPairs, NumberField } from '../../fields/NumberField';
import {
  COMMERCIALIZATION_CHANNEL_OPTIONS,
  type CountRow,
  FACILITIES,
  INFRASTRUCTURE_TEXTS as T,
  MACHINERY,
  VEHICLES,
} from './infrastructure.constants';
import type { InfrastructureValues } from './infrastructure.helper';

type Props = {
  values: InfrastructureValues;
  onChange: (values: InfrastructureValues) => void;
};

/**
 * The infrastructure and commercialization step (the web's CensusInfrastructureStep): how many
 * machines, vehicles and facilities the farm has, and where it sells.
 */
export function InfrastructureStep({ values, onChange }: Props) {
  const set = (patch: Partial<InfrastructureValues>) => onChange({ ...values, ...patch });

  const counts = (rows: CountRow[]) => (
    <>
      <FieldPairs>
        {rows.map((row) => (
          <NumberField
            key={row.key}
            label={row.label}
            value={values[row.key]}
            onChange={(count) => set({ [row.key]: count })}
          />
        ))}
      </FieldPairs>
      {rows.map(
        ({ detail }) =>
          detail && (
            <TextField
              key={detail.key}
              label={detail.label}
              value={values[detail.key]}
              onChangeText={(text) => set({ [detail.key]: text })}
            />
          ),
      )}
    </>
  );

  return (
    <>
      <SectionHeader first title={T.machinery} />
      {counts(MACHINERY)}
      <SectionHeader title={T.vehicles} />
      {counts(VEHICLES)}
      <SectionHeader title={T.facilities} />
      {counts(FACILITIES)}
      <SectionHeader title={T.commercialization} />
      <Field label={T.channels}>
        <MultiChoice
          variant="list"
          value={values.commercializationChannels}
          onChange={(commercializationChannels) => set({ commercializationChannels })}
          options={COMMERCIALIZATION_CHANNEL_OPTIONS}
        />
      </Field>
    </>
  );
}
