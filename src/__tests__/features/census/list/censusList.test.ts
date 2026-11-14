import {
  type CensusListItem,
  type CensusRow,
  formatCensusDate,
  groupCensuses,
  toListItem,
} from '@/src/features/census/list/censusList';

const row = (change: Partial<CensusRow> = {}): CensusRow => ({
  id: '01a1d70a-496a-7a5e-bf6a-29b1b22455f3',
  status: 'ready',
  payload: {
    date: '2026-11-13',
    producer: { fullName: 'Rosa Quispe', documentType: 'DNI', documentNumber: '30111222' },
  },
  errors: null,
  conflict: null,
  ...change,
});

const item = (id: string, status: CensusListItem['status']): CensusListItem => ({
  id,
  status,
  producer: null,
  document: null,
  date: null,
  errors: [],
  conflict: null,
});

describe('toListItem', () => {
  it('reads the producer and the date from the payload', () => {
    expect(toListItem(row())).toEqual({
      id: '01a1d70a-496a-7a5e-bf6a-29b1b22455f3',
      status: 'ready',
      producer: 'Rosa Quispe',
      document: 'DNI 30111222',
      date: '2026-11-13',
      errors: [],
      conflict: null,
    });
  });

  it('keeps what the API said about the census', () => {
    const errors = [{ field: 'producer.fullName', message: 'Este valor no debería estar vacío.' }];
    expect(toListItem(row({ status: 'needs_fix', errors }))?.errors).toEqual(errors);
  });

  it('leaves out what the payload does not have', () => {
    expect(toListItem(row({ payload: { producer: { fullName: '  ' } } }))).toMatchObject({
      producer: null,
      document: null,
      date: null,
    });
  });

  it('shows the document number alone when the type is missing', () => {
    expect(
      toListItem(row({ payload: { producer: { documentNumber: '30111222' } } }))?.document,
    ).toBe('30111222');
  });

  it('lists drafts, which may have no producer yet', () => {
    expect(toListItem(row({ status: 'draft', payload: {} }))).toMatchObject({
      status: 'draft',
      producer: null,
    });
  });
});

describe('groupCensuses', () => {
  it('puts what needs the enumerator first, then the drafts, the pending and the sent', () => {
    const sections = groupCensuses([
      item('6', 'draft'),
      item('5', 'sent'),
      item('4', 'ready'),
      item('3', 'anomaly'),
      item('2', 'in_review'),
      item('1', 'needs_fix'),
    ]);

    expect(sections.map((section) => [section.key, section.items.map(({ id }) => id)])).toEqual([
      ['toCheck', ['3', '1']],
      ['drafts', ['6']],
      ['pending', ['4']],
      ['sent', ['5', '2']],
    ]);
  });

  it('leaves out the empty groups', () => {
    expect(groupCensuses([item('1', 'sent')]).map((section) => section.key)).toEqual(['sent']);
  });
});

describe('formatCensusDate', () => {
  it('writes the date the Argentine way', () => {
    expect(formatCensusDate('2026-11-13')).toBe('13/11/2026');
  });

  it('shows any other text as it is', () => {
    expect(formatCensusDate('ayer')).toBe('ayer');
  });
});
