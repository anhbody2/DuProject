import { useCallback, useState } from 'react';
import { validateAll, type Validator } from '@/lib/validation';

/**
 * Live validation for a form. Errors are recomputed on every render, but a
 * field only shows its error once it has been touched (edited or blurred),
 * or after a submit attempt, so a blank form doesn't open covered in red.
 */
export function useFieldErrors<K extends string>(values: Record<K, string>, rules: Partial<Record<K, Validator>>) {
  const [touched, setTouched] = useState<Partial<Record<K, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = validateAll(values, rules);
  const valid = Object.values<string>(errors).every((e) => !e);

  /** The error to show for a field right now ('' while untouched). */
  const errorOf = (key: K) => ((submitted || touched[key]) && errors[key]) || '';
  const touch = useCallback((key: K) => setTouched((t) => (t[key] ? t : { ...t, [key]: true })), []);
  /** Call on submit: reveals every error and returns whether the form is valid. */
  const check = () => { setSubmitted(true); return valid; };
  const reset = useCallback(() => { setTouched({}); setSubmitted(false); }, []);

  return { errors, errorOf, touch, check, reset, valid };
}
