import { Autocomplete, Field } from '@molulabs/ds';
import { useId, useState } from 'react';

export type AutocompleteOption<T> = { label: string; value: T; meta?: string };

type Props<T> = {
  label: string;
  /** What the field shows for the value chosen; empty for none. */
  valueLabel: string;
  options: AutocompleteOption<T>[];
  onPick: (option: AutocompleteOption<T>) => void;
  /** Offers adding the text typed when nothing on the list is it. */
  onCreate?: (text: string) => void;
  createLabel?: (text: string) => string;
  placeholder?: string;
  emptyLabel?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
};

/**
 * A labelled search over a list of the design system, for picking one value. The design system's
 * Autocomplete shows the text being searched; here it starts as the value chosen and goes back to
 * it on each pick.
 */
export function AutocompleteField<T>({
  label,
  valueLabel,
  options,
  onPick,
  onCreate,
  createLabel,
  placeholder,
  emptyLabel,
  error,
  hint,
  required,
  disabled,
}: Props<T>) {
  const id = useId();
  const [query, setQuery] = useState(valueLabel);
  // A value chosen elsewhere (another producer, a draft opened) shows instead of the search.
  const [shown, setShown] = useState(valueLabel);
  if (shown !== valueLabel) {
    setShown(valueLabel);
    setQuery(valueLabel);
  }

  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={id}>
      <Autocomplete
        id={id}
        value={query}
        onChange={setQuery}
        items={options}
        onSelect={(item) => {
          setQuery(item.label as string);
          onPick(item as AutocompleteOption<T>);
        }}
        onCreate={
          onCreate
            ? (text) => {
                setQuery(text);
                onCreate(text);
              }
            : undefined
        }
        createLabel={createLabel}
        placeholder={placeholder}
        emptyLabel={emptyLabel}
        invalid={!!error}
        disabled={disabled}
      />
    </Field>
  );
}
