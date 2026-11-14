import { AutocompleteField } from '@/src/shared/ui/AutocompleteField';

import { useLocalities } from '../../catalogs.queries';
import { FIELD_TEXTS as T } from './fields.constants';
import type { LocalityRef } from './fields.helper';

type Props = {
  department: string;
  value: LocalityRef;
  onChange: (locality: LocalityRef) => void;
  error?: string;
};

/** The locality, among the department's on the phone, or a new one by its name. */
export function LocalityField({ department, value, onChange, error }: Props) {
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
      error={error}
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
