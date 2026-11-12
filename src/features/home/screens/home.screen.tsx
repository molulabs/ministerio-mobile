import { AlertBanner, EmptyState } from '@molulabs/ds';

import { texts } from '@/src/shared/constants/texts';
import { Screen } from '@/src/shared/ui/Screen';

type Props = {
  firstname: string;
  /** The data needed to work without signal was never downloaded on this phone. */
  offlineDataMissing: boolean;
};

/**
 * Landing tab after signing in. Generic on purpose: the app will be forked for other apps, so
 * nothing here knows about censuses.
 */
export function HomeScreen({ firstname, offlineDataMissing }: Props) {
  return (
    <Screen centered>
      <EmptyState icon="ti-mood-smile" title={texts.home.welcome(firstname)}>
        {texts.home.empty}
      </EmptyState>
      {offlineDataMissing && (
        <AlertBanner tone="warning" title={texts.home.offlineDataMissingTitle}>
          {texts.home.offlineDataMissing}
        </AlertBanner>
      )}
    </Screen>
  );
}
