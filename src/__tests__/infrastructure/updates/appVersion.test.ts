import { appVersion } from '@/src/infrastructure/updates/appVersion';

const mockUpdates = {
  isEnabled: true,
  isEmbeddedLaunch: true,
  updateId: null as string | null,
  createdAt: null as Date | null,
};

jest.mock('expo-updates', () => ({
  get isEnabled() {
    return mockUpdates.isEnabled;
  },
  get isEmbeddedLaunch() {
    return mockUpdates.isEmbeddedLaunch;
  },
  get updateId() {
    return mockUpdates.updateId;
  },
  get createdAt() {
    return mockUpdates.createdAt;
  },
}));

jest.mock('expo-constants', () => ({ expoConfig: { version: '0.4.0' } }));

describe('appVersion', () => {
  beforeEach(() => {
    Object.assign(mockUpdates, {
      isEnabled: true,
      isEmbeddedLaunch: true,
      updateId: 'e7a1c3f0-1111-2222-3333-444455556666',
      createdAt: null,
    });
  });

  it('has no update while the APK runs its own JS', () => {
    expect(appVersion()).toEqual({ version: '0.4.0', update: null });
  });

  it('names the OTA update the phone runs', () => {
    const createdAt = new Date('2026-11-17T13:30:00Z');
    Object.assign(mockUpdates, { isEmbeddedLaunch: false, createdAt });

    expect(appVersion()).toEqual({ version: '0.4.0', update: { id: 'e7a1c3f', createdAt } });
  });

  it('has no update in development, where expo-updates is off', () => {
    Object.assign(mockUpdates, { isEnabled: false, isEmbeddedLaunch: false });

    expect(appVersion()).toEqual({ version: '0.4.0', update: null });
  });
});
