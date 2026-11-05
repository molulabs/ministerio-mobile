import { useFormik } from 'formik';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { texts } from '@/src/shared/constants/texts';

import { SignInError, type SignInErrorKind } from '../auth.model';
import { useSession } from '../session.store';
import { initialValues, type LoginFormValues, validationSchema } from './login.schema';

export function LoginScreen() {
  const signIn = useSession((state) => state.signIn);
  const expired = useSession((state) => state.expired);
  const [signInError, setSignInError] = useState<SignInErrorKind | null>(null);

  const form = useFormik<LoginFormValues>({
    initialValues,
    validationSchema,
    onSubmit: async ({ email, password }) => {
      setSignInError(null);
      try {
        await signIn(email.trim(), password);
      } catch (error) {
        setSignInError(error instanceof SignInError ? error.kind : 'server');
      }
    },
  });

  const emailError = form.touched.email ? form.errors.email : undefined;
  const passwordError = form.touched.password ? form.errors.password : undefined;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>{texts.login.title}</Text>

      {expired && !signInError && <Text style={styles.notice}>{texts.login.sessionExpired}</Text>}

      <View style={styles.field}>
        <Text style={styles.label}>{texts.login.email}</Text>
        <TextInput
          style={[styles.input, emailError && styles.inputError]}
          value={form.values.email}
          onChangeText={form.handleChange('email')}
          onBlur={form.handleBlur('email')}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          returnKeyType="next"
          editable={!form.isSubmitting}
        />
        {emailError && <Text style={styles.fieldError}>{emailError}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{texts.login.password}</Text>
        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
          value={form.values.password}
          onChangeText={form.handleChange('password')}
          onBlur={form.handleBlur('password')}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => form.handleSubmit()}
          editable={!form.isSubmitting}
        />
        {passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
      </View>

      {signInError && <Text style={styles.formError}>{texts.login.errors[signInError]}</Text>}

      <Pressable
        style={[styles.button, form.isSubmitting && styles.buttonDisabled]}
        onPress={() => form.handleSubmit()}
        disabled={form.isSubmitting}
      >
        <Text style={styles.buttonText}>
          {form.isSubmitting ? texts.login.submitting : texts.login.submit}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  notice: {
    fontSize: 14,
    color: '#9a6700',
    backgroundColor: '#fff8c5',
    borderRadius: 8,
    padding: 12,
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#cf222e',
  },
  fieldError: {
    fontSize: 13,
    color: '#cf222e',
  },
  formError: {
    fontSize: 14,
    color: '#cf222e',
  },
  button: {
    backgroundColor: '#0969da',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
