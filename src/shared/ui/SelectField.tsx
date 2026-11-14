import { Field, Select } from '@molulabs/ds';
import { useId } from 'react';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  /** The empty choice, also the title of the list. */
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
};

/** A labelled closed list of the design system: a screen reader reads the label with it. */
export function SelectField({ label, error, hint, required, ...select }: Props) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={id}>
      <Select {...select} id={id} invalid={!!error} />
    </Field>
  );
}
