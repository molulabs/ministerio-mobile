import { Field, MultiChoice, SectionHeader } from '@molulabs/ds';

import { TextField } from '@/src/shared/ui/TextField';
import { YesNoField } from '@/src/shared/ui/YesNoField';

import {
  AGROCHEMICALS,
  FARM_INPUTS_TEXTS as T,
  FERTILIZER_OPTIONS,
  OTHER_FERTILIZER,
  WATER_SOURCE_OPTIONS,
} from './farmInputs.constants';
import type { FarmInputsValues } from './farmInputs.helper';
import { ForestationRows } from './ForestationRows';

type Props = {
  values: FarmInputsValues;
  onChange: (values: FarmInputsValues) => void;
};

/** The farm inputs step (the web's CensusFarmInputsStep): fertilizers, agrochemicals, water and forestation. */
export function FarmInputsStep({ values, onChange }: Props) {
  const set = (patch: Partial<FarmInputsValues>) => onChange({ ...values, ...patch });

  return (
    <>
      <SectionHeader first title={T.fertilizersTitle} />
      <Field label={T.fertilizers}>
        <MultiChoice
          variant="list"
          value={values.fertilizers}
          onChange={(fertilizers) => set({ fertilizers })}
          options={FERTILIZER_OPTIONS}
        />
      </Field>
      {values.fertilizers.includes(OTHER_FERTILIZER) && (
        <TextField
          label={T.fertilizersOtherDetail}
          value={values.fertilizersOtherDetail}
          onChangeText={(fertilizersOtherDetail) => set({ fertilizersOtherDetail })}
        />
      )}

      <SectionHeader title={T.agrochemicals} />
      {AGROCHEMICALS.map((agrochemical) => (
        <AgrochemicalField
          key={agrochemical.usesKey}
          label={agrochemical.label}
          uses={values[agrochemical.usesKey]}
          ingredient={values[agrochemical.ingredientKey]}
          onUses={(uses) => set({ [agrochemical.usesKey]: uses })}
          onIngredient={(text) => set({ [agrochemical.ingredientKey]: text })}
        />
      ))}

      <SectionHeader title={T.waterTitle} />
      <Field label={T.waterSources}>
        <MultiChoice
          variant="list"
          value={values.waterSources}
          onChange={(waterSources) => set({ waterSources })}
          options={WATER_SOURCE_OPTIONS}
        />
      </Field>

      <SectionHeader title={T.forestation} />
      <ForestationRows
        rows={values.forestSpecies}
        onChange={(forestSpecies) => set({ forestSpecies })}
      />
    </>
  );
}

/** Whether an agrochemical is used and, if so, its active ingredient. */
function AgrochemicalField({
  label,
  uses,
  ingredient,
  onUses,
  onIngredient,
}: {
  label: string;
  uses: boolean;
  ingredient: string;
  onUses: (uses: boolean) => void;
  onIngredient: (text: string) => void;
}) {
  return (
    <>
      <YesNoField label={label} value={uses} onChange={onUses} />
      {uses && (
        <TextField
          label={T.activeIngredient}
          accessibilityLabel={`${label}: ${T.activeIngredient}`}
          value={ingredient}
          onChangeText={onIngredient}
        />
      )}
    </>
  );
}
