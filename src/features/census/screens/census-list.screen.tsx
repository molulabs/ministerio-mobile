import { Button, EmptyState, useToasts } from '@molulabs/ds';
import { useState } from 'react';

import type { SendOutcome } from '@/src/infrastructure/sync/syncEngine';
import { texts } from '@/src/shared/constants/texts';
import { Screen } from '@/src/shared/ui/Screen';

import { sendSummary } from '../sendSummary';

type Props = {
  /** Sends the finished censuses now. It comes in by props: the sync engine lives in src/app. */
  onSend: () => Promise<SendOutcome>;
  /** Development builds only: leaves a census ready to send, until the census form exists. */
  onCreateTestCensus?: () => Promise<void>;
};

/** Placeholder until the list of drafts and sent censuses exists; sending already works. */
export function CensusListScreen({ onSend, onCreateTestCensus }: Props) {
  const toasts = useToasts();
  const [sending, setSending] = useState(false);

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

  return (
    <Screen centered>
      <EmptyState icon="ti-clipboard-list" title={texts.census.emptyTitle}>
        {texts.census.empty}
      </EmptyState>
      <Button
        icon="ti-send"
        disabled={sending}
        onClick={() => void send()}
        // The icon is a character of the icon font: without a label it would be read as part of the name.
        aria-label={sending ? texts.census.send.sending : texts.census.send.button}
      >
        {sending ? texts.census.send.sending : texts.census.send.button}
      </Button>
      {onCreateTestCensus && (
        <Button tone="secondary" onClick={() => void createTestCensus()}>
          {texts.census.test.button}
        </Button>
      )}
    </Screen>
  );
}
