import { SectionHeader } from '@molulabs/ds';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/src/shared/ui/Text';
import { TextField } from '@/src/shared/ui/TextField';
import { YesNoField } from '@/src/shared/ui/YesNoField';

import { FieldPairs, NumberField } from '../../fields/NumberField';
import {
  ANDEAN_ROWS,
  AROMATIC_CODE,
  CEREALS,
  CITRUS,
  type CropGroup,
  type CropRow,
  CROPS_TEXTS as T,
  FLOWERS,
  INDUSTRIAL,
  POME_FRUIT,
  STONE_FRUIT,
  VEGETABLE_ROWS,
} from './crops.constants';
import { type CropsValues, withPlot } from './crops.helper';

type Props = {
  values: CropsValues;
  onChange: (values: CropsValues) => void;
};

type YesNoKey = {
  [K in keyof CropsValues]: CropsValues[K] extends boolean ? K : never;
}[keyof CropsValues];

/**
 * The crops step (the web's CensusCropsStep): whether the farm has crops and, for each kind it
 * has, the hectares (and rows of vegetables and Andean crops) of each crop.
 */
export function CropsStep({ values, onChange }: Props) {
  const set = (patch: Partial<CropsValues>) => onChange({ ...values, ...patch });

  const section = (title: string, question: string, key: YesNoKey, content: ReactNode) => (
    <>
      <SectionHeader title={title} />
      <YesNoField label={question} value={values[key]} onChange={(has) => set({ [key]: has })} />
      {values[key] && content}
    </>
  );

  return (
    <>
      <YesNoField
        label={T.hasActivity}
        value={values.hasCropActivity}
        onChange={(hasCropActivity) => set({ hasCropActivity })}
      />

      {values.hasCropActivity && (
        <>
          {section(
            T.vegetables,
            T.hasVegetables,
            'hasVegetables',
            <CropRows rows={VEGETABLE_ROWS} values={values} onChange={onChange} />,
          )}
          {section(
            T.andean,
            T.hasAndean,
            'hasAndeanCrops',
            <CropRows rows={ANDEAN_ROWS} values={values} onChange={onChange} />,
          )}
          {section(
            T.cereals,
            T.hasCereals,
            'hasCereals',
            <HectaresGroup group={CEREALS} values={values} onChange={onChange} />,
          )}
          {section(
            T.industrial,
            T.hasIndustrial,
            'hasIndustrialCrops',
            <HectaresGroup group={INDUSTRIAL} values={values} onChange={onChange} />,
          )}
          {section(
            T.fruitTrees,
            T.hasFruitTrees,
            'hasFruitTrees',
            <>
              <Text variant="subtitle">{T.citrus}</Text>
              <HectaresGroup group={CITRUS} values={values} onChange={onChange} />
              <Text variant="subtitle">{T.pomeFruit}</Text>
              <HectaresGroup group={POME_FRUIT} values={values} onChange={onChange} />
              <Text variant="subtitle">{T.stoneFruit}</Text>
              <HectaresGroup group={STONE_FRUIT} values={values} onChange={onChange} />
            </>,
          )}
          {section(
            T.flowers,
            T.hasFlowers,
            'hasFlowers',
            <HectaresGroup group={FLOWERS} values={values} onChange={onChange} />,
          )}
          {section(
            T.aromatics,
            T.hasAromatics,
            'hasAromatics',
            <>
              <NumberField
                label={`${T.aromatics}: ${T.hectares}`}
                shown={T.hectares}
                value={values.plots[AROMATIC_CODE].hectares}
                onChange={(hectares) => onChange(withPlot(values, AROMATIC_CODE, { hectares }))}
                decimal
              />
              <TextField
                label={T.detail}
                accessibilityLabel={`${T.aromatics}: ${T.detail}`}
                value={values.plots[AROMATIC_CODE].detail}
                onChangeText={(detail) => onChange(withPlot(values, AROMATIC_CODE, { detail }))}
              />
            </>,
          )}
          {section(
            T.nurseries,
            T.hasNurseries,
            'hasNurseries',
            <>
              <NumberField
                label={`${T.nurseries}: ${T.quantity}`}
                shown={T.quantity}
                value={values.nurseryQuantity}
                onChange={(nurseryQuantity) => set({ nurseryQuantity })}
              />
              <TextField
                label={T.detail}
                accessibilityLabel={`${T.nurseries}: ${T.detail}`}
                value={values.nurseryDetail}
                onChangeText={(nurseryDetail) => set({ nurseryDetail })}
              />
            </>,
          )}
        </>
      )}
    </>
  );
}

type GroupProps = { values: CropsValues; onChange: (values: CropsValues) => void };

/** Crops asked in hectares and rows, one under the other (the web's CropFieldGrid). */
function CropRows({ rows, values, onChange }: GroupProps & { rows: CropRow[] }) {
  return (
    <>
      {rows.map((row) => {
        const plot = values.plots[row.code];
        return (
          <View key={row.code} style={{ gap: 8 }}>
            <Text variant="subtitle">{row.label}</Text>
            <FieldPairs>
              <NumberField
                label={`${row.label}: ${T.hectares}`}
                shown={T.hectares}
                value={plot.hectares}
                onChange={(hectares) => onChange(withPlot(values, row.code, { hectares }))}
                decimal
              />
              <NumberField
                label={`${row.label}: ${T.rows}`}
                shown={T.rows}
                value={plot.rows}
                onChange={(rowsTyped) => onChange(withPlot(values, row.code, { rows: rowsTyped }))}
              />
            </FieldPairs>
            {row.detailLabel && (
              <TextField
                label={row.detailLabel}
                value={plot.detail}
                onChangeText={(detail) => onChange(withPlot(values, row.code, { detail }))}
              />
            )}
          </View>
        );
      })}
    </>
  );
}

/** Crops asked only in hectares, two by two, and the detail of their "otros" (the web's NumericFieldGrid). */
function HectaresGroup({ group, values, onChange }: GroupProps & { group: CropGroup }) {
  const detail = group.detail;
  return (
    <>
      <FieldPairs>
        {group.fields.map((field) => (
          <NumberField
            key={field.code}
            label={field.label}
            value={values.plots[field.code].hectares}
            onChange={(hectares) => onChange(withPlot(values, field.code, { hectares }))}
            decimal
          />
        ))}
      </FieldPairs>
      {detail && (
        <TextField
          label={detail.label}
          value={values.plots[detail.code].detail}
          onChangeText={(text) => onChange(withPlot(values, detail.code, { detail: text }))}
        />
      )}
    </>
  );
}
