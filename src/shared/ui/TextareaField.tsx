import { Field, Textarea } from '@molulabs/ds';
import type { ComponentType } from 'react';
import type { TextInputProps as NativeTextInputProps } from 'react-native';

/** Like the input (TextField): typed with a web <textarea>'s props, handing the rest to the native one. */
const NativeTextarea = Textarea as unknown as ComponentType<
  Omit<NativeTextInputProps, 'style' | 'onChange'> & {
    onChange?: (text: string) => void;
    rows?: number;
    invalid?: boolean;
    disabled?: boolean;
  }
>;

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  /** Shown under the box, which turns red. */
  error?: string;
  hint?: string;
  rows?: number;
  placeholder?: string;
};

/** A labelled multi-line text box of the design system. */
export function TextareaField({
  label,
  value,
  onChangeText,
  error,
  hint,
  rows,
  placeholder,
}: Props) {
  return (
    <Field label={label} error={error} hint={hint}>
      <NativeTextarea
        value={value}
        onChange={onChangeText}
        rows={rows}
        placeholder={placeholder}
        accessibilityLabel={label}
        invalid={!!error}
      />
    </Field>
  );
}
