import { Button } from '@molulabs/ds';
import { View } from 'react-native';

import { AutocompleteField } from '@/src/shared/ui/AutocompleteField';
import { SegmentedField } from '@/src/shared/ui/SegmentedField';
import { Text } from '@/src/shared/ui/Text';

import { useForestSpecies } from '../../../catalogs.queries';
import { FieldPairs, NumberField } from '../../fields/NumberField';
import {
  FARM_INPUTS_TEXTS as T,
  FOREST_TYPE_OPTIONS,
  type ForestType,
} from './farmInputs.constants';
import { type ForestRow, isEmptyRow, isIncompleteRow, newForestRow } from './farmInputs.helper';

type Props = {
  rows: ForestRow[];
  onChange: (rows: ForestRow[]) => void;
};

/**
 * The forest species planted on the farm (the web's ForestationRows): each with its species, its
 * type, how many and how many hectares. A species the phone lacks is picked by its name, and the
 * API adds it when the census arrives.
 */
export function ForestationRows({ rows, onChange }: Props) {
  const species = useForestSpecies();
  const nameOf = (row: ForestRow) =>
    row.species === null
      ? ''
      : typeof row.species === 'number'
        ? (species.find((item) => item.id === row.species)?.name ?? '')
        : row.species.name;

  const update = (key: string, patch: Partial<ForestRow>) =>
    onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <>
      {rows.map((row, index) => {
        const label = T.forestRow(index);
        const incomplete = isIncompleteRow(row);
        return (
          <View key={row.key} style={{ gap: 12 }}>
            <Text variant="subtitle">{label}</Text>
            <AutocompleteField
              label={T.species}
              valueLabel={nameOf(row)}
              options={species.map((item) => ({ label: item.name, value: item.id }))}
              onPick={(option) => update(row.key, { species: option.value })}
              onCreate={(name) => update(row.key, { species: { name } })}
              createLabel={T.createSpecies}
              placeholder={T.speciesPlaceholder}
              emptyLabel={T.speciesEmpty}
              required={!isEmptyRow(row)}
              error={incomplete && row.species === null ? T.incomplete : undefined}
              hint={
                row.species !== null && typeof row.species === 'object' ? T.newSpecies : undefined
              }
            />
            <SegmentedField<ForestType>
              label={`${T.type} (${label.toLowerCase()})`}
              value={row.type}
              options={FOREST_TYPE_OPTIONS as { label: string; value: ForestType }[]}
              onChange={(type) => update(row.key, { type })}
              required={!isEmptyRow(row)}
              error={incomplete && row.type === null ? T.incomplete : undefined}
            />
            <FieldPairs>
              <NumberField
                label={`${label}: ${T.quantity}`}
                shown={T.quantity}
                value={row.quantity}
                onChange={(quantity) => update(row.key, { quantity })}
              />
              <NumberField
                label={`${label}: ${T.hectares}`}
                shown={T.hectares}
                value={row.hectares}
                onChange={(hectares) => update(row.key, { hectares })}
                decimal
              />
            </FieldPairs>
            <View style={{ alignItems: 'flex-start' }}>
              <Button
                tone="ghost"
                size="sm"
                icon="ti-trash"
                aria-label={`${T.removeSpecies} ${index + 1}`}
                onClick={() => onChange(rows.filter((other) => other.key !== row.key))}
              >
                {T.removeSpecies}
              </Button>
            </View>
          </View>
        );
      })}
      <View style={{ alignItems: 'flex-start' }}>
        <Button
          tone="secondary"
          size="sm"
          icon="ti-plus"
          aria-label={T.addSpecies}
          onClick={() => onChange([...rows, newForestRow()])}
        >
          {T.addSpecies}
        </Button>
      </View>
    </>
  );
}
