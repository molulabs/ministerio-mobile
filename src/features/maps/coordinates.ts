/** Six decimals: about 10 cm, finer than any GPS on a phone. The API keeps farms the same way. */
const DECIMALS = 6;

export const formatDegrees = (degrees: number) => degrees.toFixed(DECIMALS);

/** "latitude, longitude": the order other map apps read when the text is pasted. */
export const coordinatesText = ([longitude, latitude]: [number, number]) =>
  `${formatDegrees(latitude)}, ${formatDegrees(longitude)}`;

export const formatAccuracy = (metres: number) => `± ${Math.max(1, Math.round(metres))} m`;
