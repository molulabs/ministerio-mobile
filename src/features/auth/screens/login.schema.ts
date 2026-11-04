import * as Yup from 'yup';

import { texts } from '@/src/shared/constants/texts';

/** Same rule as the web (app/src/domain/constants/form.constant.ts). */
const REGEX_EMAIL = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;

export interface LoginFormValues {
  email: string;
  password: string;
}

export const initialValues: LoginFormValues = { email: '', password: '' };

export const validationSchema = Yup.object({
  email: Yup.string()
    .trim()
    .matches(REGEX_EMAIL, texts.login.emailInvalid)
    .required(texts.login.emailRequired),
  password: Yup.string().required(texts.login.passwordRequired),
});
