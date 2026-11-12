import { AlertBanner, Button } from '@molulabs/ds';
import { useFormik } from 'formik';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import { texts } from '@/src/shared/constants/texts';
import { Screen } from '@/src/shared/ui/Screen';
import { Text } from '@/src/shared/ui/Text';
import { TextField } from '@/src/shared/ui/TextField';

import { SignInError } from '../auth.model';
import { useSession } from '../session.store';
import { initialValues, type LoginFormValues, validationSchema } from './login.schema';

function signInErrorText(error: SignInError): string {
  if (error.kind === 'offline_wrong_password') {
    return texts.login.offlineWrongPassword(error.remainingAttempts ?? 0);
  }
  return texts.login.errors[error.kind];
}

export function LoginScreen() {
  const signIn = useSession((state) => state.signIn);
  const signedOutReason = useSession((state) => state.signedOutReason);
  const [signInError, setSignInError] = useState<SignInError | null>(null);

  const form = useFormik<LoginFormValues>({
    initialValues,
    validationSchema,
    onSubmit: async ({ email, password }) => {
      setSignInError(null);
      try {
        await signIn(email.trim(), password);
      } catch (error) {
        setSignInError(error instanceof SignInError ? error : new SignInError('server'));
      }
    },
  });

  const emailError = form.touched.email ? form.errors.email : undefined;
  const passwordError = form.touched.password ? form.errors.password : undefined;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen centered scroll>
        <Text variant="title">{texts.login.title}</Text>

        {signedOutReason && !signInError && (
          <AlertBanner tone="warning" title={texts.login.notices[signedOutReason]} />
        )}

        <TextField
          label={texts.login.email}
          type="email"
          error={emailError}
          value={form.values.email}
          onChangeText={form.handleChange('email')}
          onBlur={form.handleBlur('email')}
          autoComplete="email"
          textContentType="username"
          returnKeyType="next"
          disabled={form.isSubmitting}
        />

        <TextField
          label={texts.login.password}
          type="password"
          error={passwordError}
          value={form.values.password}
          onChangeText={form.handleChange('password')}
          onBlur={form.handleBlur('password')}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => form.handleSubmit()}
          disabled={form.isSubmitting}
        />

        {signInError && (
          <AlertBanner title={texts.login.failed}>{signInErrorText(signInError)}</AlertBanner>
        )}

        <Button size="lg" disabled={form.isSubmitting} onClick={() => form.handleSubmit()}>
          {form.isSubmitting ? texts.login.submitting : texts.login.submit}
        </Button>
      </Screen>
    </KeyboardAvoidingView>
  );
}
