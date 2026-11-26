import { SelectField } from '@/src/shared/ui/SelectField';

import { useLocalities, useMunicipalities } from '../../catalogs.queries';
import { DEPARTMENT_OPTIONS, FIELD_TEXTS as T } from './fields.constants';
import { type PlaceValues, withDepartment, withLocality, withMunicipality } from './fields.helper';
import { LocalityField } from './LocalityField';

type Props = {
  value: PlaceValues;
  onChange: (place: PlaceValues) => void;
};

/**
 * Department, municipality and locality of an address, one inside the other (the web's
 * PlaceFields): a level picked drops what below it is not inside it, and a locality picked brings
 * its municipality.
 */
export function PlaceFields({ value, onChange }: Props) {
  const municipalities = useMunicipalities(value.department);
  const localities = useLocalities(value.department);

  return (
    <>
      <SelectField
        label={T.department}
        value={value.department}
        onChange={(department) => onChange(withDepartment(department))}
        options={DEPARTMENT_OPTIONS}
        placeholder={T.departmentPlaceholder}
      />
      <SelectField
        label={T.municipality}
        value={value.municipality === null ? '' : String(value.municipality)}
        onChange={(id) =>
          onChange(withMunicipality(value, id === '' ? null : Number(id), localities))
        }
        options={municipalities.map((municipality) => ({
          label: municipality.name,
          value: String(municipality.id),
        }))}
        placeholder={T.municipalityPlaceholder}
        // The locality below says why it waits for the department
        disabled={value.department === ''}
      />
      <LocalityField
        department={value.department}
        localities={localities}
        municipality={value.municipality}
        value={value.locality}
        onChange={(locality) => onChange(withLocality(value, locality, localities))}
      />
    </>
  );
}
