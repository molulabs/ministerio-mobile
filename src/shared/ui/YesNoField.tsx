import { Field, SegmentedControl } from '@molulabs/ds';
import { View } from 'react-native';

type Props = {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  hint?: string;
  error?: string;
};

const OPTIONS = [
  { value: true, label: 'Sí' },
  { value: false, label: 'No' },
];

/** A Sí/No question of a form that is saved (the web's YesNoToggle). */
export function YesNoField({ label, value, onChange, hint, error }: Props) {
  return (
    <Field label={label} hint={hint} error={error}>
      {/* The question names the Sí and No it holds, for a screen reader. */}
      <View accessibilityRole="radiogroup" accessibilityLabel={label}>
        <SegmentedControl
          value={value}
          onChange={(next: boolean) => onChange(next)}
          options={OPTIONS}
          invalid={!!error}
        />
      </View>
    </Field>
  );
}
