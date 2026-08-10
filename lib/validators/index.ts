/**
 * Validators Index
 * Exports all validators and validation utilities
 */

// Email validator
export { validateEmail } from './email';

// Password validator
export {
  validatePassword,
  type PasswordValidationResult,
  type PasswordValidationOptions,
} from './password';

// Field validators
export {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePattern,
  validateOneOf,
  validateNumber,
  validateRange,
  validateMatches,
  validateAlphanumeric,
  validateUrl,
  composeValidators,
  type FieldValidator,
} from './fields';

// Form validators
export {
  validateForm,
  createFormValidator,
  validateFormFields,
  hasFormErrors,
  getFormErrorCount,
  clearFormFieldErrors,
  mergeValidationSchemas,
  type FormValidationSchema,
} from './form';
