import { Checkbox, RadioGroup, SectionHeader } from '@molulabs/ds';

import { TextField } from '@/src/shared/ui/TextField';
import { YesNoField } from '@/src/shared/ui/YesNoField';

import type { ProducerFarm } from '../../../catalogs.queries';
import { MAX_LENGTH, PRODUCER_TEXTS as T } from './producer.constants';
import { EMPTY_FARM, type FarmValues } from './producer.helper';

/** The farm part of the census, as the producer step changes it. */
export type FarmPatch = { farm?: FarmValues; newFarm?: boolean; farmId?: number | null };

type Props = {
  farm: FarmValues;
  newFarm: boolean;
  farmId: number | null;
  /** The producer's farms the phone knows: a new producer has none. */
  farms: ProducerFarm[];
  /** Only a registered producer may have a farm censused before. */
  canBeAnotherFarm: boolean;
  onChange: (patch: FarmPatch) => void;
};

/** The radio value of "Otra finca": farm ids are numbers. */
const ANOTHER_FARM = 'new';

/**
 * The farm the census is of, at the producer step (the web's CensusFarmFields). Of a producer with
 * farms on the phone, the census taker chooses one, which fills its RENSPA and whether the producer
 * lives there, or says it is another. Without them (an older catalogue) the API picks the farm with
 * the same RENSPA, or the last one censused, unless this is another farm.
 */
export function FarmFields({ farm, newFarm, farmId, farms, canBeAnotherFarm, onChange }: Props) {
  const set = (patch: Partial<FarmValues>) => onChange({ farm: { ...farm, ...patch } });

  const choose = (value: string) => {
    const chosen = farms.find((one) => String(one.id) === value);
    onChange(
      chosen
        ? {
            farmId: chosen.id,
            newFarm: false,
            farm: {
              renspa: chosen.renspa ?? '',
              producerLivesOnFarm: chosen.producerLivesOnFarm ?? false,
            },
          }
        : { farmId: null, newFarm: true, farm: EMPTY_FARM },
    );
  };

  const choosing = farms.length > 0;
  const chosen = farmId !== null ? String(farmId) : newFarm ? ANOTHER_FARM : undefined;

  return (
    <>
      <SectionHeader title={T.farm} />
      {choosing ? (
        <RadioGroup
          value={chosen}
          onChange={choose}
          options={[
            ...farms.map((one) => ({ value: String(one.id), label: one.label })),
            { value: ANOTHER_FARM, label: T.anotherFarm, hint: T.anotherFarmHint },
          ]}
        />
      ) : (
        canBeAnotherFarm && (
          <Checkbox
            checked={newFarm}
            onChange={(checked) => onChange({ newFarm: checked })}
            label={T.newFarm}
            hint={T.newFarmHint}
          />
        )
      )}
      {(!choosing || chosen !== undefined) && (
        <>
          <TextField
            label={T.renspa}
            value={farm.renspa}
            onChangeText={(renspa) => set({ renspa })}
            maxLength={MAX_LENGTH.renspa}
            autoCapitalize="characters"
            mono
          />
          <YesNoField
            label={T.livesOnFarm}
            value={farm.producerLivesOnFarm}
            onChange={(producerLivesOnFarm) => set({ producerLivesOnFarm })}
          />
        </>
      )}
    </>
  );
}
