import { Field, MultiChoice, SectionHeader } from '@molulabs/ds';

import { Text } from '@/src/shared/ui/Text';
import { TextField } from '@/src/shared/ui/TextField';
import { YesNoField } from '@/src/shared/ui/YesNoField';

import { FieldPairs, NumberField } from '../../fields/NumberField';
import {
  ASSOCIATIVISM_OPTIONS,
  CHILDREN,
  FAMILY_FINANCES_TEXTS as T,
  FINANCES,
  OTHER_OPTION,
  TECHNICAL_ADVISORY_OPTIONS,
  WORKERS,
} from './familyFinances.constants';
import { type FamilyFinancesValues, moreChildrenInSchool, sumOf } from './familyFinances.helper';

type Props = {
  values: FamilyFinancesValues;
  onChange: (values: FamilyFinancesValues) => void;
};

/**
 * The family and finances step (the web's CensusFamilyFinancesStep): the producer's family,
 * the advice and associations they have, their finances and who works on the farm.
 */
export function FamilyFinancesStep({ values, onChange }: Props) {
  const set = (patch: Partial<FamilyFinancesValues>) => onChange({ ...values, ...patch });

  return (
    <>
      <SectionHeader first title={T.family} />
      <YesNoField
        label={T.hasSpouse}
        value={values.hasSpouse}
        onChange={(hasSpouse) => set({ hasSpouse })}
      />
      {values.hasSpouse && (
        <YesNoField
          label={T.spouseWorksOnFarm}
          value={values.spouseWorksOnFarm}
          onChange={(spouseWorksOnFarm) => set({ spouseWorksOnFarm })}
        />
      )}
      <FieldPairs>
        {CHILDREN.map((field) => (
          <NumberField
            key={field.key}
            label={field.label}
            value={values[field.key]}
            onChange={(count) => set({ [field.key]: count })}
          />
        ))}
      </FieldPairs>
      <NumberField
        label={T.childrenInSchool}
        value={values.childrenInSchool}
        onChange={(childrenInSchool) => set({ childrenInSchool })}
        error={moreChildrenInSchool(values) ? T.childrenInSchoolWarning : undefined}
      />
      <Text variant="muted">
        {T.totalChildren(
          sumOf(
            values,
            CHILDREN.map((field) => field.key),
          ),
        )}
      </Text>

      <SectionHeader title={T.advisory} />
      <Field label={T.technicalAdvisory}>
        <MultiChoice
          variant="list"
          value={values.technicalAdvisory}
          onChange={(technicalAdvisory) => set({ technicalAdvisory })}
          options={TECHNICAL_ADVISORY_OPTIONS}
        />
      </Field>
      {values.technicalAdvisory.includes(OTHER_OPTION) && (
        <TextField
          label={T.technicalAdvisoryOtherDetail}
          value={values.technicalAdvisoryOtherDetail}
          onChangeText={(technicalAdvisoryOtherDetail) => set({ technicalAdvisoryOtherDetail })}
        />
      )}
      <Field label={T.associativism}>
        <MultiChoice
          variant="list"
          value={values.associativism}
          onChange={(associativism) => set({ associativism })}
          options={ASSOCIATIVISM_OPTIONS}
        />
      </Field>
      {values.associativism.includes(OTHER_OPTION) && (
        <TextField
          label={T.associativismOtherDetail}
          value={values.associativismOtherDetail}
          onChangeText={(associativismOtherDetail) => set({ associativismOtherDetail })}
        />
      )}

      <SectionHeader title={T.finances} />
      {FINANCES.map((question) => (
        <YesNoField
          key={question.key}
          label={question.label}
          value={values[question.key]}
          onChange={(answer) => set({ [question.key]: answer })}
        />
      ))}

      <SectionHeader title={T.workers} />
      <FieldPairs>
        {WORKERS.map((field) => (
          <NumberField
            key={field.key}
            label={field.label}
            value={values[field.key]}
            onChange={(count) => set({ [field.key]: count })}
          />
        ))}
      </FieldPairs>
      <Text variant="muted">
        {T.totalWorkers(
          sumOf(
            values,
            WORKERS.map((field) => field.key),
          ),
        )}
      </Text>
    </>
  );
}
