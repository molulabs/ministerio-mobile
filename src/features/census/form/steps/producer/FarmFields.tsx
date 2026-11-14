import { Checkbox, Field, SectionHeader, SegmentedControl } from '@molulabs/ds';

import { TextField } from '@/src/shared/ui/TextField';

import { MAX_LENGTH, PRODUCER_TEXTS as T } from './producer.constants';
import type { FarmValues } from './producer.helper';

type Props = {
  farm: FarmValues;
  newFarm: boolean;
  /** Only a registered producer may have a farm censused before. */
  canBeAnotherFarm: boolean;
  onChange: (patch: { farm?: FarmValues; newFarm?: boolean }) => void;
};

/**
 * The farm the census is of, at the producer step (the web's CensusFarmFields). The phone does not
 * know the producer's farms: the API picks the one with the same RENSPA, or the last one censused,
 * unless this is another farm.
 */
export function FarmFields({ farm, newFarm, canBeAnotherFarm, onChange }: Props) {
  const set = (patch: Partial<FarmValues>) => onChange({ farm: { ...farm, ...patch } });

  return (
    <>
      <SectionHeader title={T.farm} />
      {canBeAnotherFarm && (
        <Checkbox
          checked={newFarm}
          onChange={(checked) => onChange({ newFarm: checked })}
          label={T.newFarm}
          hint={T.newFarmHint}
        />
      )}
      <TextField
        label={T.renspa}
        value={farm.renspa}
        onChangeText={(renspa) => set({ renspa })}
        maxLength={MAX_LENGTH.renspa}
        autoCapitalize="characters"
        mono
      />
      <Field label={T.livesOnFarm}>
        <SegmentedControl
          value={farm.producerLivesOnFarm}
          onChange={(producerLivesOnFarm: boolean) => set({ producerLivesOnFarm })}
          options={[
            { value: true, label: T.yes },
            { value: false, label: T.no },
          ]}
        />
      </Field>
    </>
  );
}
