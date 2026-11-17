import { texts } from '@/src/shared/constants/texts';

describe('texts.profile.versionValue', () => {
  it('says the phone runs the APK as it came', () => {
    expect(texts.profile.versionValue('0.4.0', null)).toBe('0.4.0 · sin actualizaciones');
  });

  it('names the update with the date and the time, which tell two updates of a day apart', () => {
    const value = texts.profile.versionValue('0.4.0', {
      id: '556666',
      createdAt: new Date('2026-11-17T13:30:00Z'),
    });

    expect(value).toMatch(
      /^0\.4\.0 · actualización 556666 del \d{1,2}\/\d{1,2}\/\d{4} \d{2}:\d{2}$/,
    );
  });
});
