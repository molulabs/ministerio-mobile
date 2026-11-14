import { Field, TextInput } from '@molulabs/ds';
import type { ComponentType } from 'react';
import type { TextInputProps as NativeTextInputProps } from 'react-native';

/**
 * The design system's input takes the props of a web <input> in its types, but on React Native
 * it hands every prop it does not use to the native TextInput: typed here as what it really is.
 */
const NativeInput = TextInput as unknown as ComponentType<
  Omit<NativeTextInputProps, 'style'> & {
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
    invalid?: boolean;
    disabled?: boolean;
    mono?: boolean;
    icon?: string;
  }
>;

type Props = Omit<NativeTextInputProps, 'style' | 'editable'> & {
  label: string;
  /** What a screen reader says, when the label alone is not enough (default: the label). */
  accessibilityLabel?: string;
  /** Shown under the input, which turns red. */
  error?: string;
  hint?: string;
  /** Marks the label with an asterisk. */
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  disabled?: boolean;
  mono?: boolean;
  icon?: string;
};

/** A labelled text input of the design system, with React Native's input props. */
export function TextField({
  label,
  accessibilityLabel,
  error,
  hint,
  required,
  disabled,
  ...input
}: Props) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <NativeInput
        {...input}
        accessibilityLabel={accessibilityLabel ?? label}
        invalid={!!error}
        disabled={disabled}
      />
    </Field>
  );
}
