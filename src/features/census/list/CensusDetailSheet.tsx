import { Button, Sheet } from '@molulabs/ds';
import { View } from 'react-native';

import { texts } from '@/src/shared/constants/texts';
import { Text } from '@/src/shared/ui/Text';

import type { CensusListItem } from './censusList';

/** What the API said about a census: the fields to fix, the review to come, or the rejection. */
export function CensusDetailSheet({
  census,
  onClose,
}: {
  census: CensusListItem | null;
  onClose: () => void;
}) {
  const list = texts.census.list;
  const title =
    census?.status === 'needs_fix'
      ? list.needsFixTitle
      : census?.status === 'in_review'
        ? list.inReviewTitle
        : list.anomalyTitle;

  return (
    <Sheet
      open={census !== null}
      onClose={onClose}
      title={title}
      sub={census ? (census.producer ?? list.noProducer) : undefined}
      actions={
        <Button tone="secondary" onClick={onClose}>
          {list.close}
        </Button>
      }
    >
      {census?.status === 'needs_fix' && (
        <View style={{ gap: 8 }}>
          <Text variant="muted">{list.needsFix}</Text>
          {census.errors.map((error) => (
            <View key={`${error.field}:${error.message}`}>
              <Text>{error.message}</Text>
              <Text variant="small">{error.field}</Text>
            </View>
          ))}
        </View>
      )}
      {census?.status === 'in_review' && (
        <View style={{ gap: 8 }}>
          <Text variant="muted">{list.inReview}</Text>
          {census.conflict && <Text>{census.conflict}</Text>}
        </View>
      )}
      {census?.status === 'anomaly' && <Text variant="muted">{list.anomaly}</Text>}
    </Sheet>
  );
}
