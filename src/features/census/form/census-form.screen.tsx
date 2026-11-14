import {
  AlertBanner,
  AppBar,
  AppBarAction,
  Button,
  DateInput,
  Dialog,
  EmptyState,
  Field,
  useToasts,
  Wizard,
} from '@molulabs/ds';
import { useInsets, useTokens } from '@molulabs/ds/native';
import { StatusBar } from 'expo-status-bar';
import { type ComponentRef, type ReactNode, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { texts } from '@/src/shared/constants/texts';
import { Screen } from '@/src/shared/ui/Screen';
import { Text } from '@/src/shared/ui/Text';
import { TextareaField } from '@/src/shared/ui/TextareaField';
import { TextField } from '@/src/shared/ui/TextField';

import { discardDraft, finishDraft, getDraft, saveDraft } from '../census.repository';
import {
  type CensusFormValues,
  fromCensusPayload,
  missingToFinish,
  toCensusPayload,
} from './censusForm.model';
import { CENSUS_STEPS, clampStep, LAST_STEP } from './censusForm.steps';

/** How long the form waits after the last change before saving the draft. */
const SAVE_DELAY_MS = 500;

type Props = {
  /** The draft to edit. */
  id: string;
  /** Only the user's own drafts open. */
  userId: number;
  /** Leaves the form: done, discarded, or back. */
  onClose: () => void;
};

type Loaded = { values: CensusFormValues; step: number };

/** A census being taken: the web's wizard, saved on the phone as the enumerator goes. */
export function CensusFormScreen({ id, userId, onClose }: Props) {
  const [loaded, setLoaded] = useState<Loaded | 'loading' | 'gone'>('loading');

  useEffect(() => {
    let active = true;
    void getDraft(id, userId).then((draft) => {
      if (!active) return;
      setLoaded(
        draft
          ? { values: fromCensusPayload(draft.payload), step: clampStep(draft.formStep) }
          : 'gone',
      );
    });
    return () => {
      active = false;
    };
  }, [id, userId]);

  if (loaded === 'loading') {
    return (
      <Frame onBack={onClose}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </Frame>
    );
  }

  if (loaded === 'gone') {
    return (
      <Frame onBack={onClose}>
        <Screen centered>
          <EmptyState icon="ti-clipboard-off" title={texts.census.form.gone} />
          <Button tone="secondary" onClick={onClose}>
            {texts.census.list.close}
          </Button>
        </Screen>
      </Frame>
    );
  }

  return <CensusWizard id={id} userId={userId} initial={loaded} onClose={onClose} />;
}

function CensusWizard({ id, userId, initial, onClose }: Props & { initial: Loaded }) {
  const t = useTokens();
  const toasts = useToasts();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [values, setValues] = useState(initial.values);
  const [step, setStep] = useState(initial.step);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [missing, setMissing] = useState<ReturnType<typeof missingToFinish>>([]);
  const [discarding, setDiscarding] = useState(false);
  const [busy, setBusy] = useState(false);

  // What is on screen now, for the save when the form closes.
  const latest = useRef({ values, step });
  useEffect(() => {
    latest.current = { values, step };
  }, [values, step]);

  // Saved shortly after every change and step: if Android closes the app, the draft is there.
  useEffect(() => {
    const timer = setTimeout(() => {
      void saveDraft(id, userId, toCensusPayload(values), step).then(() => setSavedAt(new Date()));
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [id, userId, values, step]);

  // Leaving with the back button saves what the pause did not. A finished or discarded census
  // is no longer a draft, so this changes nothing for it.
  useEffect(
    () => () => {
      void saveDraft(id, userId, toCensusPayload(latest.current.values), latest.current.step);
    },
    [id, userId],
  );

  const goTo = (next: number) => {
    setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const change = (patch: Partial<CensusFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setMissing([]);
  };

  const finish = async () => {
    const lacking = missingToFinish(values);
    if (lacking.length > 0) {
      setMissing(lacking);
      return;
    }
    setBusy(true);
    try {
      await finishDraft(id, userId, toCensusPayload(values));
      toasts.push('success', texts.census.form.finished);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const discard = async () => {
    setDiscarding(false);
    await discardDraft(id, userId);
    onClose();
  };

  const form = texts.census.form;
  const current = CENSUS_STEPS[step];

  return (
    <Frame onBack={onClose} onDiscard={() => setDiscarding(true)}>
      <ScrollView
        ref={scroll}
        style={{ flex: 1, backgroundColor: t.page }}
        contentContainerStyle={{ padding: t.space5 }}
        keyboardShouldPersistTaps="handled"
      >
        <Wizard
          compact
          steps={CENSUS_STEPS.map((item) => ({ label: item.title }))}
          current={step}
          onStep={goTo}
          onBack={() => goTo(step - 1)}
          onNext={() => goTo(step + 1)}
          onFinish={() => void finish()}
          finishLabel={form.finish}
          busy={busy}
          draftNote={
            savedAt
              ? form.saved(
                  savedAt.toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  }),
                )
              : undefined
          }
        >
          {current.key === 'producer' && (
            <>
              <Field label={form.date} required>
                <DateInput value={values.date} onChange={(date: string) => change({ date })} />
              </Field>
              <TextField
                label={form.formNumber}
                value={values.formNumber}
                onChangeText={(formNumber) => change({ formNumber })}
              />
              <Text variant="muted">{form.notYet}</Text>
            </>
          )}
          {current.key !== 'producer' && step < LAST_STEP && (
            <Text variant="muted">{form.notYet}</Text>
          )}
          {step === LAST_STEP && (
            <>
              {missing.length > 0 && (
                <AlertBanner tone="warning" title={form.missingTitle}>
                  {missing.map((item) => form.missing[item]).join(' ')}
                </AlertBanner>
              )}
              <TextareaField
                label={form.observations}
                value={values.observations}
                onChangeText={(observations) => change({ observations })}
                rows={4}
              />
            </>
          )}
        </Wizard>
      </ScrollView>
      <Dialog
        open={discarding}
        tone="danger"
        title={form.discardTitle}
        confirmLabel={form.discard}
        cancelLabel={form.discardCancel}
        onConfirm={() => void discard()}
        onCancel={() => setDiscarding(false)}
      >
        {form.discardText}
      </Dialog>
    </Frame>
  );
}

/** The screen around the wizard: the top bar with the way back and, for a draft, discarding it. */
function Frame({
  onBack,
  onDiscard,
  children,
}: {
  onBack: () => void;
  onDiscard?: () => void;
  children: ReactNode;
}) {
  const t = useTokens();
  const insets = useInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.page, paddingBottom: insets.bottom }}>
      <StatusBar style="light" />
      <AppBar
        title={texts.census.form.title}
        onBack={onBack}
        backLabel={texts.census.form.discardCancel}
        actions={
          onDiscard ? (
            <AppBarAction icon="ti-trash" label={texts.census.form.discard} onClick={onDiscard} />
          ) : undefined
        }
        style={{ paddingTop: 8 + insets.top }}
      />
      {children}
    </View>
  );
}
