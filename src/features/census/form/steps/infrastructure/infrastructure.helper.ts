import { asText, textOrNull, toCount } from '../../fields/fields.helper';

/** The counts of the step (the API's InfrastructureRequest). */
export const COUNT_KEYS = [
  'tractors',
  'harrows',
  'seeders',
  'chiselPlows',
  'sprayers',
  'otherMachinery1',
  'otherMachinery2',
  'pickUps',
  'trucks',
  'trailers',
  'otherVehicles',
  'sheds',
  'openSheds',
  'corrals',
  'australianTanks',
  'wateringPoints',
  'dams',
] as const;

export const TEXT_KEYS = [
  'otherMachinery1Detail',
  'otherMachinery2Detail',
  'otherVehiclesDetail',
] as const;

export type InfrastructureCountKey = (typeof COUNT_KEYS)[number];
export type InfrastructureTextKey = (typeof TEXT_KEYS)[number];

/** What the infrastructure step edits, as typed (the web's InfrastructureValues). */
export type InfrastructureValues = Record<
  InfrastructureCountKey | InfrastructureTextKey,
  string
> & {
  commercializationChannels: string[];
};

export const EMPTY_INFRASTRUCTURE = {
  ...Object.fromEntries([...COUNT_KEYS, ...TEXT_KEYS].map((key) => [key, ''])),
  commercializationChannels: [] as string[],
} as InfrastructureValues;

/** The infrastructure section of the payload: the API's InfrastructureRequest. */
export function toInfrastructurePayload(values: InfrastructureValues): Record<string, unknown> {
  return {
    ...Object.fromEntries(COUNT_KEYS.map((key) => [key, toCount(values[key])])),
    ...Object.fromEntries(TEXT_KEYS.map((key) => [key, textOrNull(values[key])])),
    commercializationChannels:
      values.commercializationChannels.length > 0 ? values.commercializationChannels : null,
  };
}

/** A saved infrastructure section back into the step. */
export function fromInfrastructurePayload(section: Record<string, unknown>): InfrastructureValues {
  const channels = section.commercializationChannels;
  return {
    ...(Object.fromEntries(
      [...COUNT_KEYS, ...TEXT_KEYS].map((key) => [key, asText(section[key])]),
    ) as Record<InfrastructureCountKey | InfrastructureTextKey, string>),
    commercializationChannels: Array.isArray(channels)
      ? channels.filter((item): item is string => typeof item === 'string')
      : [],
  };
}
