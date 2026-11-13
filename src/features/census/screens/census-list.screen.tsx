import { Button, EmptyState, ListGroup, ListRow, Sheet, Tag, useToasts } from '@molulabs/ds';
import { useState } from 'react';
import { View } from 'react-native';

import type { SendOutcome } from '@/src/infrastructure/sync/syncEngine';
import { texts } from '@/src/shared/constants/texts';
import { Screen } from '@/src/shared/ui/Screen';
import { Text } from '@/src/shared/ui/Text';

import { type CensusListItem, formatCensusDate, groupCensuses } from '../censusList';
import { sendSummary } from '../sendSummary';

type Props = {
  /** The user's censuses, newest first. */
  censuses: CensusListItem[];
  /** Sends the finished censuses now. It comes in by props: the sync engine lives in src/app. */
  onSend: () => Promise<SendOutcome>;
  /** Development builds only: leaves a census ready to send, until the census form exists. */
  onCreateTestCensus?: () => Promise<void>;
};

const TAG_TONE: Record<CensusListItem['status'], 'ok' | 'warn' | 'bad' | 'mut'> = {
  ready: 'mut',
  sent: 'ok',
  in_review: 'warn',
  needs_fix: 'bad',
  anomaly: 'bad',
};

/** A census the API answered with something to read opens it; the rest has nothing more to show. */
const hasDetail = (census: CensusListItem) =>
  census.status === 'needs_fix' || census.status === 'anomaly' || census.status === 'in_review';

/** The censuses on the phone, by what the enumerator has to do with them, and the send button. */
export function CensusListScreen({ censuses, onSend, onCreateTestCensus }: Props) {
  const toasts = useToasts();
  const [sending, setSending] = useState(false);
  const [opened, setOpened] = useState<CensusListItem | null>(null);
  const pending = censuses.some((census) => census.status === 'ready');

  const send = async () => {
    setSending(true);
    try {
      const { tone, title, message } = sendSummary(await onSend());
      toasts.push(tone, title, message);
    } finally {
      setSending(false);
    }
  };

  const createTestCensus = async () => {
    await onCreateTestCensus?.();
    toasts.push('info', texts.census.test.created);
  };

  const actions = (
    <>
      {pending && (
        <Button
          icon="ti-send"
          disabled={sending}
          onClick={() => void send()}
          // The icon is a character of the icon font: without a label it would be read as part of the name.
          aria-label={sending ? texts.census.send.sending : texts.census.send.button}
        >
          {sending ? texts.census.send.sending : texts.census.send.button}
        </Button>
      )}
      {onCreateTestCensus && (
        <Button tone="secondary" onClick={() => void createTestCensus()}>
          {texts.census.test.button}
        </Button>
      )}
    </>
  );

  if (censuses.length === 0) {
    return (
      <Screen centered>
        <EmptyState icon="ti-clipboard-list" title={texts.census.emptyTitle}>
          {texts.census.empty}
        </EmptyState>
        {actions}
      </Screen>
    );
  }

  return (
    <Screen scroll>
      {actions}
      {groupCensuses(censuses).map((section) => (
        <ListGroup key={section.key} label={texts.census.list.sections[section.key]}>
          {section.items.map((census, index) => (
            <ListRow
              key={census.id}
              first={index === 0}
              title={census.producer ?? texts.census.list.noProducer}
              meta={describe(census)}
              tag={
                <Tag tone={TAG_TONE[census.status]}>{texts.census.list.status[census.status]}</Tag>
              }
              onClick={hasDetail(census) ? () => setOpened(census) : undefined}
            />
          ))}
        </ListGroup>
      ))}
      <CensusDetail census={opened} onClose={() => setOpened(null)} />
    </Screen>
  );
}

/** "DNI 99000001 · 13/11/2026", with whatever the census has of it. */
function describe(census: CensusListItem): string | undefined {
  const parts = [census.document, census.date && formatCensusDate(census.date)];
  return parts.filter(Boolean).join(' · ') || undefined;
}

/** What the API said about a census: the fields to fix, the review to come, or the rejection. */
function CensusDetail({ census, onClose }: { census: CensusListItem | null; onClose: () => void }) {
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
