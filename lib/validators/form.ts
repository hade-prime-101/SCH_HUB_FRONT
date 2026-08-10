import { FormErrors } from '@/types/auth';
import { FieldValidator } from './fields';

/**
 * A relaxed validator type that also covers validators returning rich result
 * objects (e.g. validateEmail → ValidationResult, validatePassword →
 * PasswordValidationResult).  The form runner only uses the string-returning
 * subset at runtime, but this type lets tests and callers pass any callable
 * without casting.
 */
type AnyValidator = (value: any) => any;

/**
 * Validation schema for form fields
 * Maps field names to validator functions
 */
export type FormValidationSchema<T extends Record<string, any>> = {
  [K in keyof T]?: FieldValidator | AnyValidator | (FieldValidator | AnyValidator)[];
};

/**
 * Validates multiple form fields at once using a validation schema
 * Returns an object with field names as keys and error messages as values
 *
 * @param values - Form values object to validate
 * @param schema - Validation schema mapping fields to validators
 * @returns Object with field names and error messages (empty if all valid)
 *
 * @example
 * const schema = {
 *   email: validateEmail,
 *   password: validatePassword,
 *   username: [
 *     validateRequired,
 *     validateMinLength(3, 'Username'),
 *   ]
 * };
 * const errors = validateForm(formValues, schema);
 * if (Object.keys(errors).length > 0) {
 *   console.log(errors); // { username: "Username must be at least 3 characters long" }
 * }
 */
export function validateForm<T extends Record<string, any>>(
  values: T,
  schema: FormValidationSchema<T>
): Partial<FormErrors> {
  const errors: Partial<FormErrors> = {};

  for (const fieldName in schema) {
    const validators = schema[fieldName];
    if (!validators) continue;

    const fieldValue = values[fieldName];
    const validatorArray = Array.isArray(validators) ? validators : [validators];

    // Run all validators for this field
    for (const validator of validatorArray) {
      const error = validator(fieldValue);
      if (error) {
        errors[fieldName] = error;
        break; // Stop at first error for this field
      }
    }
  }

  return errors;
}

/**
 * Creates a reusable form validator function from a schema
 * Useful when the same validation rules are used in multiple places
 *
 * @param schema - Validation schema
 * @returns Function that validates values and returns errors
 *
 * @example
 * const validator = createFormValidator({
 *   email: validateEmail,
 *   password: validatePassword,
 * });
 *
 * const errors = validator(formValues);
 */
export function createFormValidator<T extends Record<string, any>>(
  schema: FormValidationSchema<T>
) {
  return (values: T): Partial<FormErrors> => validateForm(values, schema);
}

/**
 * Validates only specific fields from a form
 * Useful when you want to validate a subset of fields
 *
 * @param values - Form values object
 * @param schema - Validation schema
 * @param fieldNames - Array of field names to validate (if not provided, validates all)
 * @returns Object with errors only for specified fields
 *
 * @example
 * const errors = validateFormFields(formValues, schema, ['email', 'password']);
 */
export function validateFormFields<T extends Record<string, any>>(
  values: T,
  schema: FormValidationSchema<T>,
  fieldNames?: (keyof T)[]
): Partial<FormErrors> {
  const fieldsToValidate = fieldNames
    ? fieldNames.reduce((acc, field) => ({ ...acc, [field]: schema[field] }), {} as FormValidationSchema<T>)
    : schema;

  return validateForm(values, fieldsToValidate);
}

/**
 * Checks if a form has any validation errors
 *
 * @param errors - Errors object from validateForm
 * @returns true if there are any errors, false otherwise
 *
 * @example
 * const errors = validateForm(values, schema);
 * if (hasFormErrors(errors)) {
 *   console.log('Form has errors');
 * }
 */
export function hasFormErrors(errors: Partial<FormErrors>): boolean {
  return Object.values(errors).some((error) => error !== undefined && error !== '');
}

/**
 * Gets the count of validation errors in a form
 *
 * @param errors - Errors object from validateForm
 * @returns Number of fields with errors
 *
 * @example
 * const errorCount = getFormErrorCount(errors);
 * console.log(`${errorCount} fields have errors`);
 */
export function getFormErrorCount(errors: Partial<FormErrors>): number {
  return Object.values(errors).filter((error) => error !== undefined && error !== '').length;
}

/**
 * Clears errors for specific fields
 *
 * @param errors - Current errors object
 * @param fieldNames - Array of field names to clear errors for
 * @returns New errors object with cleared fields
 *
 * @example
 * const clearedErrors = clearFormFieldErrors(errors, ['email', 'password']);
 */
export function clearFormFieldErrors(
  errors: Partial<FormErrors>,
  fieldNames: string[]
): Partial<FormErrors> {
  const result = { ...errors };
  fieldNames.forEach((field) => {
    delete result[field];
  });
  return result;
}

/**
 * Merges multiple validation schemas.
 * Later schemas override earlier ones for the same fields.
 * Accepts schemas with different field-type parameters so heterogeneous
 * schemas can be combined without requiring a common generic type.
 *
 * @param schemas - Array of validation schemas to merge
 * @returns Merged validation schema
 *
 * @example
 * const baseSchema = { email: validateEmail };
 * const additionalSchema = { password: validatePassword };
 * const merged = mergeValidationSchemas(baseSchema, additionalSchema);
 */
export function mergeValidationSchemas<T extends Record<string, any>>(
  ...schemas: FormValidationSchema<any>[]
): FormValidationSchema<T> {
  return schemas.reduce((acc, schema) => ({ ...acc, ...schema }), {} as FormValidationSchema<T>);
}
