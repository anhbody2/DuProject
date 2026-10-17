/**
 * Field validators shared by the login, register and forgot-password forms.
 * Each returns an error message, or '' when the value is valid.
 */
export type Validator = (value: string) => string;

/** Shown live as a checklist under new-password fields. */
export const PASSWORD_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: 'Tối thiểu 8 ký tự', test: (v) => v.length >= 8 },
  { label: 'Có chữ in hoa (A–Z)', test: (v) => /[A-Z]/.test(v) },
  { label: 'Có chữ thường (a–z)', test: (v) => /[a-z]/.test(v) },
  { label: 'Có chữ số (0–9)', test: (v) => /\d/.test(v) },
];

export const validators = {
  /** Email or username on the login form. */
  login: (v) => (!v.trim() ? 'Nhập email hoặc tên đăng nhập nhé' : ''),
  /** Existing password: only required, since old accounts may predate the rules. */
  currentPassword: (v) => (!v ? 'Nhập mật khẩu nhé' : ''),
  name: (v) => (!v.trim() ? 'Cho Dủ biết tên bạn nha'
    : /\d/.test(v) ? 'Tên không được chứa chữ số'
      : v.trim().length > 200 ? 'Tên quá dài' : ''),
  email: (v) => (!v.trim() ? 'Nhập email nhé' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? 'Email chưa đúng' : ''),
  username: (v) => (!v ? 'Nhập tên đăng nhập nhé' : !/^[a-zA-Z0-9_.]{3,50}$/.test(v) ? 'Tên đăng nhập 3–50 ký tự: chữ, số, _ hoặc .' : ''),
  /** Optional: only checked when filled in. */
  phone: (v) => (v.trim() && !/^(\+84|0)\d{9,10}$/.test(v.replace(/[\s.-]/g, '')) ? 'Số điện thoại chưa đúng' : ''),
  /** New password: every rule in PASSWORD_RULES. */
  password: (v) => {
    if (!v) return 'Nhập mật khẩu nhé';
    const failed = PASSWORD_RULES.find((r) => !r.test(v));
    return failed ? `Mật khẩu cần: ${failed.label.toLowerCase()}` : '';
  },
  resetCode: (v) => (!/^\d{6}$/.test(v) ? 'Mã gồm 6 chữ số' : ''),
} satisfies Record<string, Validator>;

/** Validator for a "re-enter password" field. */
export const matches = (password: string): Validator => (v) =>
  !v ? 'Nhập lại mật khẩu nhé' : v !== password ? 'Mật khẩu nhập lại chưa khớp' : '';

/** Runs every rule and returns the errors, keyed like the rules. */
export function validateAll<K extends string>(values: Record<K, string>, rules: Partial<Record<K, Validator>>) {
  const errors = {} as Record<K, string>;
  for (const key of Object.keys(rules) as K[]) errors[key] = rules[key]!(values[key] ?? '');
  return errors;
}
