import { AutocompleteMulti, Field } from '@molulabs/ds';
import { useId } from 'react';

import { useBreeds } from '../../../catalogs.queries';
import type { CatalogRef } from '../../fields/fields.helper';
import { LIVESTOCK_TEXTS as T } from './livestock.constants';

type Props = {
  label: string;
  /** The API's LivestockSpecies. */
  species: string;
  value: CatalogRef[];
  onChange: (breeds: CatalogRef[]) => void;
};

const keyOf = (ref: CatalogRef) => (typeof ref === 'number' ? `id:${ref}` : `name:${ref.name}`);

/**
 * Several breeds of the species' catalog on the phone (the web's BreedsField). A breed the phone
 * lacks is picked by its name, and the API adds it when the census arrives.
 */
export function BreedsField({ label, species, value, onChange }: Props) {
  const id = useId();
  const breeds = useBreeds(species);
  const nameOf = (ref: CatalogRef) =>
    typeof ref === 'number' ? (breeds.find((breed) => breed.id === ref)?.name ?? '') : ref.name;
  const toItem = (ref: CatalogRef) => ({ label: nameOf(ref), value: keyOf(ref), ref });

  return (
    <Field
      label={label}
      htmlFor={id}
      hint={value.some((ref) => typeof ref === 'object') ? T.newBreeds : undefined}
    >
      <AutocompleteMulti
        id={id}
        value={value.map(toItem)}
        items={breeds.map((breed) => toItem(breed.id))}
        onChange={(picked) => onChange(picked.map((item) => item.ref as CatalogRef))}
        onCreate={(name) => onChange([...value, { name }])}
        createLabel={T.createBreed}
        placeholder={T.breedsPlaceholder}
        emptyLabel={T.breedsEmpty}
      />
    </Field>
  );
}
