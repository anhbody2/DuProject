import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * The password policy for every new password (register, reset, change). Mirrors
 * PASSWORD_RULES in frontend/src/lib/validation.ts: 8-72 characters with at least one
 * lower-case letter, one upper-case letter and one digit. 72 is bcrypt's input limit.
 * Existing passwords are not re-checked at login (LoginDto only requires a value).
 */
export function IsStrongPassword(): PropertyDecorator {
  return (target, key) => {
    IsString()(target, key);
    MinLength(8)(target, key);
    MaxLength(72)(target, key);
    Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: `${String(key)} must contain an upper-case letter, a lower-case letter and a digit`,
    })(target, key);
  };
}
