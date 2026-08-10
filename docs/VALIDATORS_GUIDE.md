# Validators Usage Guide

This guide covers all validation utilities available in the application.

## Table of Contents

- [Email Validator](#email-validator)
- [Password Validator](#password-validator)
- [Field Validators](#field-validators)
- [Form Validators](#form-validators)
- [Composition Patterns](#composition-patterns)
- [Error Handling](#error-handling)

---

## Email Validator

Validates email addresses using RFC 5322 compatible patterns.

### Function Signature

```typescript
validateEmail(email: string): ValidationResult

interface ValidationResult {
  valid: boolean;
  error?: string;
}
```

### Basic Usage

```tsx
import { validateEmail } from '@/lib/validators';

const result = validateEmail('user@example.com');
if (!result.valid) {
  console.log(result.error); // "Please enter a valid email address"
}
```

### Examples

```tsx
// Valid emails
validateEmail('user@example.com');           // { valid: true }
validateEmail('test.user+tag@example.co.uk'); // { valid: true }
validateEmail('info@company.name');          // { valid: true }

// Invalid emails
validateEmail('invalid.email');              // { valid: false, error: "..." }
validateEmail('user@');                      // { valid: false, error: "..." }
validateEmail('@example.com');               // { valid: false, error: "..." }
validateEmail('');                           // { valid: false, error: "Email is required" }
validateEmail('   ');                        // { valid: false, error: "Email is required" }
```

### Error Messages

- Empty value: `"Email is required"`
- Invalid format: `"Please enter a valid email address"`
- Too long (>254 chars): `"Email address is too long"`
- Local part too long (>64 chars): `"Email local part is too long"`

### In Form Validation

```tsx
const form = useForm({
  initialValues: { email: '' },
  validate: (values) => {
    const errors: Partial<Record<keyof typeof values, string>> = {};

    const emailResult = validateEmail(values.email);
    if (!emailResult.valid) {
      errors.email = emailResult.error;
    }

    return errors;
  },
  onSubmit: async (values) => {
    // Submit form
  },
});
```

---

## Password Validator

Validates passwords against security requirements and calculates strength.

### Function Signature

```typescript
validatePassword(
  password: string,
  options?: PasswordValidationOptions
): PasswordValidationResult

interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

interface PasswordValidationOptions {
  minLength?: number;           // Default: 8
  requireUppercase?: boolean;   // Default: true
  requireLowercase?: boolean;   // Default: true
  requireNumbers?: boolean;     // Default: true
  requireSpecialChars?: boolean; // Default: true
}
```

### Basic Usage

```tsx
import { validatePassword } from '@/lib/validators';

const result = validatePassword('MyPassword123!');
console.log(result);
// {
//   valid: true,
//   errors: [],
//   strength: 'strong'
// }

// Weak password
const weakResult = validatePassword('abc123');
console.log(weakResult);
// {
//   valid: false,
//   errors: [
//     "Password must be at least 8 characters long",
//     "Password must contain at least one uppercase letter",
//     "Password must contain at least one special character"
//   ],
//   strength: 'weak'
// }
```

### Custom Options

```tsx
// Require longer, more complex password
const result = validatePassword('MyPassword123!', {
  minLength: 12,
  requireSpecialChars: true,
});

// Relax requirements
const result = validatePassword('password123', {
  minLength: 6,
  requireUppercase: false,
  requireSpecialChars: false,
});
```

### Strength Levels

- **Weak** (25%): 0-1 criteria met
- **Fair** (50%): 2 criteria met
- **Good** (75%): 3 criteria met
- **Strong** (100%): 4+ criteria met

### Password Requirements Check

```tsx
export function PasswordStrengthIndicator({ password }: { password: string }) {
  const result = validatePassword(password);

  return (
    <div>
      <div className={`strength-bar strength-${result.strength}`}>
        {/* Progress bar */}
      </div>
      <ul>
        {result.errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
```

### In Form Validation

```tsx
const form = useForm({
  initialValues: { password: '', confirmPassword: '' },
  validate: (values) => {
    const errors: Partial<Record<keyof typeof values, string>> = {};

    const passwordResult = validatePassword(values.password);
    if (!passwordResult.valid) {
      errors.password = passwordResult.errors.join('; ');
    }

    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords must match';
    }

    return errors;
  },
  onSubmit: async (values) => {
    // Submit form
  },
});
```

---

## Field Validators

Reusable validators for individual form fields.

### Available Validators

#### validateRequired

```tsx
import { validateRequired } from '@/lib/validators';

const error = validateRequired('', 'Email');
// "Email is required"

const error = validateRequired('value@example.com', 'Email');
// undefined (valid)
```

#### validateMinLength

```tsx
import { validateMinLength } from '@/lib/validators';

const validator = validateMinLength(8, 'Password');
validator('short');    // "Password must be at least 8 characters long"
validator('validpass'); // undefined
```

#### validateMaxLength

```tsx
import { validateMaxLength } from '@/lib/validators';

const validator = validateMaxLength(50, 'Username');
validator('a'.repeat(51)); // "Username must be no more than 50 characters long"
validator('valid');        // undefined
```

#### validatePattern

```tsx
import { validatePattern } from '@/lib/validators';

// Alphanumeric only
const validator = validatePattern(/^[a-zA-Z0-9]+$/, 'Username');
validator('user_123');  // "Username format is invalid"
validator('user123');   // undefined

// Custom error message
const validator = validatePattern(
  /^\d+$/,
  'Phone',
  'Phone must contain only numbers'
);
validator('555-1234'); // "Phone must contain only numbers"
```

#### validateOneOf

```tsx
import { validateOneOf } from '@/lib/validators';

const validator = validateOneOf(['admin', 'user', 'guest'], 'Role');
validator('admin');     // undefined
validator('invalid');   // "Role must be one of: admin, user, guest"
```

#### validateNumber

```tsx
import { validateNumber } from '@/lib/validators';

const validator = validateNumber('Age');
validator('abc');  // "Age must be a valid number"
validator('25');   // undefined
```

#### validateRange

```tsx
import { validateRange } from '@/lib/validators';

const validator = validateRange(0, 100, 'Score');
validator('-5');   // "Score must be between 0 and 100"
validator('150');  // "Score must be between 0 and 100"
validator('75');   // undefined
```

#### validateMatches

```tsx
import { validateMatches } from '@/lib/validators';

const passwordValue = 'MyPassword123!';
const validator = validateMatches(passwordValue, 'Confirm Password');
validator('MyPassword123!'); // undefined
validator('different');      // "Confirm Password must match"
```

#### validateAlphanumeric

```tsx
import { validateAlphanumeric } from '@/lib/validators';

const validator = validateAlphanumeric('Username');
validator('user123');  // undefined
validator('user@123'); // "Username must contain only alphanumeric characters"
```

#### validateUrl

```tsx
import { validateUrl } from '@/lib/validators';

const validator = validateUrl('Website');
validator('https://example.com');  // undefined
validator('not-a-url');            // "Website must be a valid URL"
```

### Composing Validators

```tsx
import { composeValidators, validateRequired, validateMinLength } from '@/lib/validators';

const validator = composeValidators(
  validateRequired('Username'),
  validateMinLength(3, 'Username'),
  validateAlphanumeric('Username')
);

validator('');         // "Username is required"
validator('ab');       // "Username must be at least 3 characters long"
validator('user@');    // "Username must contain only alphanumeric characters"
validator('user123');  // undefined
```

---

## Form Validators

Validators for validating multiple form fields at once.

### validateForm

Validates all fields in a form using a validation schema.

```tsx
import { validateForm } from '@/lib/validators';
import {
  validateRequired,
  validateMinLength,
  validateMatches,
} from '@/lib/validators';

const schema = {
  email: validateEmail,
  password: validatePassword,
  confirmPassword: validateMatches(password, 'Confirm Password'),
};

const values = {
  email: 'user@example.com',
  password: 'MyPass123!',
  confirmPassword: 'MyPass123!',
};

const errors = validateForm(values, schema);
// errors = { } (all valid)

// With errors
const invalidValues = {
  email: 'invalid',
  password: 'weak',
  confirmPassword: 'different',
};

const errors = validateForm(invalidValues, schema);
// errors = {
//   email: "Please enter a valid email address",
//   password: "Password is not strong enough",
//   confirmPassword: "Confirm Password must match"
// }
```

### createFormValidator

Creates a reusable validator function from a schema.

```tsx
import { createFormValidator } from '@/lib/validators';

const loginValidator = createFormValidator({
  email: validateEmail,
  password: validatePassword,
});

// Use in multiple forms
const errors = loginValidator(formValues);

// Or use with useForm
const form = useForm({
  initialValues: { email: '', password: '' },
  validate: loginValidator,
  onSubmit: async (values) => {
    // Submit
  },
});
```

### validateFormFields

Validates only specific fields from a form.

```tsx
import { validateFormFields } from '@/lib/validators';

const schema = {
  email: validateEmail,
  password: validatePassword,
  confirmPassword: validateMatches(password, 'Confirm Password'),
};

// Validate only email and password
const errors = validateFormFields(values, schema, ['email', 'password']);
```

### Form Helper Functions

```tsx
import {
  hasFormErrors,
  getFormErrorCount,
  clearFormFieldErrors,
  mergeValidationSchemas,
} from '@/lib/validators';

const errors = validateForm(values, schema);

// Check if form has any errors
if (hasFormErrors(errors)) {
  console.log('Form has errors');
}

// Get count of fields with errors
const errorCount = getFormErrorCount(errors);
console.log(`${errorCount} fields have errors`);

// Clear errors for specific fields
const clearedErrors = clearFormFieldErrors(errors, ['email']);

// Merge multiple schemas
const baseSchema = { email: validateEmail };
const additionalSchema = { password: validatePassword };
const mergedSchema = mergeValidationSchemas(baseSchema, additionalSchema);
```

---

## Composition Patterns

### Pattern 1: Schema-Based Validation

```tsx
const registrationSchema = createFormValidator({
  fullName: composeValidators(
    validateRequired('Full Name'),
    validateMinLength(2, 'Full Name')
  ),
  email: validateEmail,
  password: validatePassword,
  confirmPassword: validateMatches(password, 'Confirm Password'),
  agreeToTerms: (value) => !value ? 'You must agree to terms' : undefined,
});

const form = useForm({
  initialValues: { /* ... */ },
  validate: registrationSchema,
  onSubmit: async (values) => { /* ... */ },
});
```

### Pattern 2: Conditional Validation

```tsx
const form = useForm({
  initialValues: { type: '', customValue: '' },
  validate: (values) => {
    const errors: Partial<typeof values> = {};

    if (!values.type) {
      errors.type = 'Type is required';
    }

    // Only validate customValue if type is 'custom'
    if (values.type === 'custom') {
      if (!values.customValue) {
        errors.customValue = 'Custom value is required';
      }
    }

    return errors;
  },
  onSubmit: async (values) => { /* ... */ },
});
```

### Pattern 3: Field-Level Validation

```tsx
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');

const handleEmailChange = (value: string) => {
  setEmail(value);

  // Validate on every change (for real-time feedback)
  const result = validateEmail(value);
  setEmailError(result.error || '');
};
```

### Pattern 4: Cross-Field Validation

```tsx
const form = useForm({
  initialValues: { startDate: '', endDate: '' },
  validate: (values) => {
    const errors: Partial<typeof values> = {};

    const startDate = new Date(values.startDate);
    const endDate = new Date(values.endDate);

    if (endDate <= startDate) {
      errors.endDate = 'End date must be after start date';
    }

    return errors;
  },
  onSubmit: async (values) => { /* ... */ },
});
```

---

## Error Handling

### Displaying Validation Errors

```tsx
export function FormField({
  label,
  error,
  touched,
  ...inputProps
}: {
  label: string;
  error?: string;
  touched?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label>{label}</label>
      <input
        {...inputProps}
        aria-invalid={!!error}
        aria-describedby={error ? 'error' : undefined}
      />
      {touched && error && (
        <p id="error" className="error">
          {error}
        </p>
      )}
    </div>
  );
}

export function RegistrationForm() {
  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: registrationSchema,
    onSubmit: async (values) => { /* ... */ },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <FormField
        label="Email"
        name="email"
        value={form.values.email}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        error={form.errors.email}
        touched={form.touched.email}
      />
      <FormField
        label="Password"
        type="password"
        name="password"
        value={form.values.password}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        error={form.errors.password}
        touched={form.touched.password}
      />
      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Submitting...' : 'Register'}
      </button>
    </form>
  );
}
```

### Error Message Formatting

```tsx
// Single error message
const result = validatePassword(password);
if (!result.valid) {
  const errorMessage = result.errors.join(', ');
  // "Password must be at least 8 characters long, Password must contain..."
}

// List of errors
const result = validatePassword(password);
if (!result.valid) {
  return (
    <ul>
      {result.errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}
```

---

For more examples, see the test files in `/lib/validators/__tests__/`.
