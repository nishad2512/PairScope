export type AuthFields = { name: string; email: string; password: string; confirmPassword: string };
export type AuthErrors = Partial<Record<keyof AuthFields, string>>;

export function isEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateAuth(values: AuthFields, signup: boolean): AuthErrors {
  const errors: AuthErrors = {};
  if (!isEmail(values.email)) errors.email = "Enter a valid email address.";
  if (!values.password.trim()) errors.password = "Enter your password.";
  if (signup) {
    if (values.name.length < 3 || values.name.length > 20) {
      errors.name = "Use 3–20 characters for your name.";
    }
    if (!errors.password && values.password !== values.password.trim()) {
      errors.password = "Remove spaces at the beginning or end of your password.";
    }
    if (!errors.password && (
      values.password.length < 8 || values.password.length > 64 ||
      !/[A-Z]/.test(values.password) || !/[a-z]/.test(values.password) ||
      !/[0-9]/.test(values.password)
    )) errors.password = "Use 8–64 characters with uppercase, lowercase, and a number.";
    if (values.password !== values.confirmPassword || !values.confirmPassword) {
      errors.confirmPassword = "Enter the same password again.";
    }
  }
  return errors;
}
