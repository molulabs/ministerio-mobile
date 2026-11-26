import {
  type PlaceValues,
  toId,
  withDepartment,
  withLocality,
  withMunicipality,
} from '@/src/features/census/form/fields/fields.helper';

const localities = [
  { id: 4, municipalityId: 2 },
  { id: 5, municipalityId: 1 },
  { id: 6, municipalityId: null },
];
const atMaimara: PlaceValues = { department: 'TILCARA', municipality: 2, locality: 4 };

describe('the place of an address', () => {
  it('starts the municipality and the locality over with another department', () => {
    expect(withDepartment('YAVI')).toEqual({
      department: 'YAVI',
      municipality: null,
      locality: null,
    });
  });

  it('keeps the locality only while it is in the municipality', () => {
    expect(withMunicipality(atMaimara, 2, localities).locality).toBe(4);
    expect(withMunicipality(atMaimara, 1, localities).locality).toBeNull();
    expect(withMunicipality(atMaimara, null, localities).locality).toBeNull();
    // One the catalog does not place yet goes with no municipality
    expect(withMunicipality({ ...atMaimara, locality: 6 }, null, localities).locality).toBe(6);
  });

  it('keeps a new locality while there is a municipality to add it to', () => {
    const newOne: PlaceValues = { ...atMaimara, locality: { name: 'El Moreno' } };

    expect(withMunicipality(newOne, 1, localities).locality).toEqual({ name: 'El Moreno' });
    expect(withMunicipality(newOne, null, localities).locality).toBeNull();
  });

  it('brings the municipality of the locality picked, when the catalog says which', () => {
    const inTilcara: PlaceValues = { department: 'TILCARA', municipality: null, locality: null };

    expect(withLocality(inTilcara, 5, localities).municipality).toBe(1);
    expect(withLocality({ ...inTilcara, municipality: 2 }, 6, localities).municipality).toBe(2);
    expect(withLocality(atMaimara, null, localities).municipality).toBe(2);
  });

  it('reads back a saved id, and nothing else', () => {
    expect(toId(3)).toBe(3);
    expect(toId('3')).toBeNull();
    expect(toId({ name: 'X' })).toBeNull();
  });
});
