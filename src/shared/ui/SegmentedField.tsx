import { Field, SegmentedControl } from '@molulabs/ds';
import { View } from 'react-native';

type Props<T> = {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: string;
  error?: string;
  required?: boolean;
};

/** One of a few options side by side, under its question. */
export function SegmentedField<T extends string | boolean>({
  label,
  value,
  options,
  onChange,
  hint,
  error,
  required,
}: Props<T>) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {/* The question names the options it holds, for a screen reader. */}
      <View accessibilityRole="radiogroup" accessibilityLabel={label}>
        <SegmentedControl
          value={value}
          onChange={(next: T) => onChange(next)}
          options={options}
          invalid={!!error}
        />
      </View>
    </Field>
  );
}
