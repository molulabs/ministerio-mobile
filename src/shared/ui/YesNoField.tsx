import { SegmentedField } from './SegmentedField';

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
export function YesNoField(props: Props) {
  return <SegmentedField {...props} options={OPTIONS} />;
}
