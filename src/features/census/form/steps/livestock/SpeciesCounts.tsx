import { View } from 'react-native';

import { Text } from '@/src/shared/ui/Text';
import { TextField } from '@/src/shared/ui/TextField';

import { BreedsField } from './BreedsField';
import { LIVESTOCK_TEXTS as T, type SpeciesRow } from './livestock.constants';
import type { LivestockValues } from './livestock.helper';

type Props = {
  rows: SpeciesRow[];
  values: LivestockValues;
  onChange: (patch: Partial<LivestockValues>) => void;
};

/** Each kind of animal of a species, own and of third parties (the web's SpeciesFields). */
export function SpeciesCounts({ rows, values, onChange }: Props) {
  return (
    <>
      {rows.map((row) => (
        <View key={row.ownKey} style={{ gap: 8 }}>
          <Text variant="subtitle">{row.label}</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <CountField
                label={`${row.label}: ${T.own}`}
                shown={T.own}
                value={values[row.ownKey]}
                onChange={(count) => onChange({ [row.ownKey]: count })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <CountField
                label={`${row.label}: ${T.thirdParty}`}
                shown={T.thirdParty}
                value={values[row.thirdPartyKey]}
                onChange={(count) => onChange({ [row.thirdPartyKey]: count })}
              />
            </View>
          </View>
          {row.breeds && (
            <BreedsField
              label={T.breeds}
              species={row.breeds.species}
              value={values[row.breeds.key]}
              onChange={(breeds) => onChange({ [row.breeds!.key]: breeds })}
            />
          )}
          {row.detail && (
            <TextField
              label={row.detail.label}
              value={values[row.detail.key]}
              onChangeText={(text) => onChange({ [row.detail!.key]: text })}
            />
          )}
        </View>
      ))}
    </>
  );
}

/**
 * A count of animals. On screen it says only "Propios" or "De terceros", under the kind of
 * animal; a screen reader hears both.
 */
export function CountField({
  label,
  shown,
  value,
  onChange,
  error,
}: {
  label: string;
  shown?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <TextField
      label={shown ?? label}
      accessibilityLabel={label}
      value={value}
      onChangeText={onChange}
      keyboardType="number-pad"
      error={error}
      mono
    />
  );
}
