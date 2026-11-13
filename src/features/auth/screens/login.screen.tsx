import { AlertBanner, Button, useToasts } from '@molulabs/ds';
import { useInsets } from '@molulabs/ds/native';
import { useFormik } from 'formik';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, View } from 'react-native';

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

/**
 * The same as the web login (app/src/pages/Login): logo, title and subtitle, the form, the error
 * in a toast and the copyright at the foot. The web's "Recordar mi usuario" is not here: on the
 * phone the session is always kept, the offline sign-in needs it.
 */
export function LoginScreen() {
  const signIn = useSession((state) => state.signIn);
  const signedOutReason = useSession((state) => state.signedOutReason);
  const toasts = useToasts();
  const insets = useInsets();
  const [failed, setFailed] = useState(false);

  const form = useFormik<LoginFormValues>({
    initialValues,
    validationSchema,
    onSubmit: async ({ email, password }) => {
      try {
        await signIn(email.trim(), password);
      } catch (error) {
        setFailed(true);
        toasts.push(
          'danger',
          texts.login.failed,
          signInErrorText(error instanceof SignInError ? error : new SignInError('server')),
        );
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
      <Screen scroll>
        <View style={{ flexGrow: 1, justifyContent: 'center', paddingTop: insets.top }}>
          {/* 600×266, shown at a quarter of its width (as on the web) so it stays sharp */}
          <Image
            source={require('@/assets/logo-jujuy.png')}
            style={{ width: 150, height: 67, alignSelf: 'center', marginBottom: 14 }}
            accessibilityLabel={texts.login.logo}
            accessibilityRole="image"
          />
          <Text variant="display" style={{ marginBottom: 4 }}>
            {texts.login.title}
          </Text>
          <Text variant="subtitle" style={{ marginBottom: 22 }}>
            {texts.login.subtitle}
          </Text>

          <View style={{ gap: 16 }}>
            {signedOutReason && !failed && (
              <AlertBanner tone="warning" title={texts.login.notices[signedOutReason]} />
            )}

            <TextField
              label={texts.login.email}
              required
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
              required
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

            <Button disabled={form.isSubmitting} onClick={() => form.handleSubmit()}>
              {form.isSubmitting ? texts.login.submitting : texts.login.submit}
            </Button>
          </View>
        </View>

        <Text variant="small" style={{ textAlign: 'right', paddingBottom: insets.bottom }}>
          {texts.login.copyright}
        </Text>
      </Screen>
    </KeyboardAvoidingView>
  );
}
