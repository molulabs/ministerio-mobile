import { Field, MultiChoice, SectionHeader } from '@molulabs/ds';

import { Text } from '@/src/shared/ui/Text';
import { TextField } from '@/src/shared/ui/TextField';
import { YesNoField } from '@/src/shared/ui/YesNoField';

import { CoordinatesFields } from '../../fields/CoordinatesFields';
import { PlaceFields } from '../../fields/PlaceFields';
import {
  LAND_TENURE_OPTIONS,
  MAX_LENGTH,
  OTHER_LAND_TENURE,
  PRODUCTION_UNIT_TEXTS as T,
} from './productionUnit.constants';
import { producesMoreThanItHas, type ProductionUnitValues } from './productionUnit.helper';

type Props = {
  values: ProductionUnitValues;
  /** Asked with the producer: a farm the producer lives on is at the producer's address. */
  producerLivesOnFarm: boolean;
  onChange: (values: ProductionUnitValues) => void;
};

type Service =
  'drinkingWater' | 'irrigationWater' | 'electricGrid' | 'gas' | 'telephone' | 'internet';

const SERVICES: Service[] = [
  'drinkingWater',
  'irrigationWater',
  'electricGrid',
  'gas',
  'telephone',
  'internet',
];

/**
 * The farm the census is of (the web's CensusProductionUnitStep): where it is, its land and its
 * services. A farm the producer lives on is at the producer's address, so it is not asked again.
 */
export function ProductionUnitStep({ values, producerLivesOnFarm, onChange }: Props) {
  const set = (patch: Partial<ProductionUnitValues>) => onChange({ ...values, ...patch });

  return (
    <>
      <SectionHeader first title={T.address} />
      {producerLivesOnFarm ? (
        <Text variant="muted">{T.livesOnFarm}</Text>
      ) : (
        <>
          <TextField
            label={T.street}
            value={values.street}
            onChangeText={(street) => set({ street })}
            maxLength={MAX_LENGTH.street}
          />
          <TextField
            label={T.number}
            value={values.number}
            onChangeText={(number) => set({ number })}
            maxLength={MAX_LENGTH.number}
          />
          <PlaceFields
            value={{
              department: values.department,
              municipality: values.municipality,
              locality: values.locality,
            }}
            onChange={set}
          />
          <TextField
            label={T.paraje}
            value={values.paraje}
            onChangeText={(paraje) => set({ paraje })}
            maxLength={MAX_LENGTH.paraje}
          />
          <CoordinatesFields
            latitude={values.latitude}
            longitude={values.longitude}
            onChange={(latitude, longitude) => set({ latitude, longitude })}
          />
        </>
      )}

      <SectionHeader title={T.surface} />
      <TextField
        label={T.totalHectares}
        value={values.totalHectares}
        onChangeText={(totalHectares) => set({ totalHectares })}
        keyboardType="decimal-pad"
        mono
      />
      <TextField
        label={T.producedHectares}
        value={values.producedHectares}
        onChangeText={(producedHectares) => set({ producedHectares })}
        keyboardType="decimal-pad"
        error={producesMoreThanItHas(values) ? T.hectaresWarning : undefined}
        mono
      />

      <SectionHeader title={T.landTenure} />
      <Field label={T.landTenure} hideLabel>
        <MultiChoice
          variant="list"
          value={values.landTenure}
          onChange={(landTenure) => set({ landTenure })}
          options={LAND_TENURE_OPTIONS}
        />
      </Field>
      {values.landTenure.includes(OTHER_LAND_TENURE) && (
        <TextField
          label={T.landTenureOtherDetail}
          value={values.landTenureOtherDetail}
          onChangeText={(landTenureOtherDetail) => set({ landTenureOtherDetail })}
        />
      )}

      <SectionHeader title={T.services} />
      {SERVICES.map((service) => (
        <YesNoField
          key={service}
          label={T[service]}
          value={values[service]}
          onChange={(answer) => set({ [service]: answer })}
        />
      ))}
    </>
  );
}
