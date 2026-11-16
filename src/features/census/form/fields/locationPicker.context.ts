import { createContext, type ReactNode, useContext } from 'react';

/** A full-screen chooser of a place on a map, [longitude, latitude]. */
export type LocationPickerProps = {
  initial: [number, number] | null;
  onConfirm: (lngLat: [number, number]) => void;
  onCancel: () => void;
};

/** Draws the map to choose a place on, full screen. */
export type RenderLocationPicker = (props: LocationPickerProps) => ReactNode;

/**
 * The map to choose the coordinates on. The census does not know the map feature (features never
 * depend on each other, and a fork removes the census whole): `src/app/` hands it to the form.
 * Without one, the coordinates are only typed or taken from the GPS.
 */
export const LocationPickerContext = createContext<RenderLocationPicker | null>(null);

export const useLocationPicker = () => useContext(LocationPickerContext);
