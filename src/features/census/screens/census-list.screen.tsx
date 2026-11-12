import { EmptyState } from '@molulabs/ds';

import { texts } from '@/src/shared/constants/texts';
import { Screen } from '@/src/shared/ui/Screen';

/** Placeholder until the drafts and the outbox exist. */
export function CensusListScreen() {
  return (
    <Screen centered>
      <EmptyState icon="ti-clipboard-list" title={texts.census.emptyTitle}>
        {texts.census.empty}
      </EmptyState>
    </Screen>
  );
}
