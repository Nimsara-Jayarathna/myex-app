export const PASSWORD_MIN_LENGTH = 12;
export const IOS_PASSWORD_RULES =
  'minlength: 12; required: upper; required: lower; required: digit;';

export const isStrongPassword = (value: string) => {
  return (
    value.length >= PASSWORD_MIN_LENGTH &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value)
  );
};

export const PASSWORD_REQUIREMENTS_LABEL =
  'At least 12 characters with uppercase, lowercase, and a number';
