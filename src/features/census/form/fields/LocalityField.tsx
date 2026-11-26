import { AutocompleteField } from '@/src/shared/ui/AutocompleteField';

import type { Locality } from '../../catalogs.queries';
import { FIELD_TEXTS as T } from './fields.constants';
import type { LocalityRef } from './fields.helper';

type Props = {
  department: string;
  /** The department's localities on the phone. */
  localities: Locality[];
  /** Once there is one, only its localities are offered, and a new one is added inside it. */
  municipality: number | null;
  value: LocalityRef;
  onChange: (locality: LocalityRef) => void;
  error?: string;
};

/**
 * The locality, among the department's (or its municipality's) on the phone, or a new one by its
 * name: only inside a municipality, since every locality is in one.
 */
export function LocalityField({
  department,
  localities,
  municipality,
  value,
  onChange,
  error,
}: Props) {
  const offered =
    municipality === null
      ? localities
      : localities.filter((locality) => locality.municipalityId === municipality);
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
      options={offered.map((locality) => ({ label: locality.name, value: locality.id }))}
      onPick={(option) => onChange(option.value)}
      onCreate={municipality === null ? undefined : (name) => onChange({ name })}
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
            : municipality === null
              ? T.localityNeedsMunicipality
              : undefined
      }
    />
  );
}
