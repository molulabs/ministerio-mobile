import { useTokens } from '@molulabs/ds/native';
import { Children, type ReactNode } from 'react';
import { View } from 'react-native';

import { TextField } from '@/src/shared/ui/TextField';

type Props = {
  /** What a screen reader hears: "Vacas: Propios". */
  label: string;
  /** What the screen shows, when shorter than the label: "Propios", under "Vacas". */
  shown?: string;
  value: string;
  onChange: (value: string) => void;
  /** Hectares take a comma; counts only digits. */
  decimal?: boolean;
  error?: string;
};

/** A figure of the census: a count, or hectares (the web's NumberField). */
export function NumberField({ label, shown, value, onChange, decimal, error }: Props) {
  return (
    <TextField
      label={shown ?? label}
      accessibilityLabel={label}
      value={value}
      onChangeText={onChange}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      error={error}
      mono
    />
  );
}

/** Short fields two by two, as a phone fits them; an odd last one keeps half the width. */
export function FieldPairs({ children }: { children: ReactNode }) {
  const t = useTokens();
  const fields = Children.toArray(children);
  const pairs = Array.from({ length: Math.ceil(fields.length / 2) }, (_, index) =>
    fields.slice(index * 2, index * 2 + 2),
  );
  return (
    <View style={{ gap: t.space7 }}>
      {pairs.map((pair, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: t.space6 }}>
          <View style={{ flex: 1 }}>{pair[0]}</View>
          <View style={{ flex: 1 }}>{pair[1]}</View>
        </View>
      ))}
    </View>
  );
}
