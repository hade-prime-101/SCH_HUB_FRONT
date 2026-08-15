'use client';

import { useState, useCallback, useRef } from 'react';
import { ChangeEvent, FocusEvent, FormEvent } from 'react';

/**
 * Form state generic interface
 */
export interface FormState<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
}

/**
 * useForm Hook Configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UseFormConfig<T extends Record<string, any>> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

/**
 * useForm Hook Return Type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UseFormReturn<T extends Record<string, any>> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleBlur: (
    e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldError: <K extends keyof T>(field: K, error: string) => void;
  setFieldTouched: <K extends keyof T>(field: K, isTouched: boolean) => void;
  resetForm: () => void;
  setValues: (values: T) => void;
}

/**
 * useForm Hook
 *
 * Manages form state without third-party libraries. Provides validation on blur,
 * error tracking, touched field tracking, and form submission handling.
 *
 * @template T - The shape of your form values
 * @param config - Configuration object with initialValues, onSubmit, and optional validate function
 * @returns Object with form state and handlers
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   initialValues: { email: '', password: '' },
 *   validate: (values) => {
 *     const errors: Partial<Record<keyof typeof values, string>> = {};
 *     if (!values.email) errors.email = 'Email is required';
 *     if (!values.password) errors.password = 'Password is required';
 *     return errors;
 *   },
 *   onSubmit: async (values) => {
 *     await apiClient.login(values);
 *   },
 * });
 *
 * return (
 *   <form onSubmit={form.handleSubmit}>
 *     <input
 *       name="email"
 *       value={form.values.email}
 *       onChange={form.handleChange}
 *       onBlur={form.handleBlur}
 *     />
 *     {form.touched.email && form.errors.email && (
 *       <span>{form.errors.email}</span>
 *     )}
 *     <button type="submit" disabled={form.isSubmitting}>
 *       {form.isSubmitting ? 'Submitting...' : 'Submit'}
 *     </button>
 *   </form>
 * );
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormConfig<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string>>(
    {} as Record<keyof T, string>
  );
  const [touched, setTouched] = useState<Record<keyof T, boolean>>(
    {} as Record<keyof T, boolean>
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track if component is mounted to prevent memory leaks
  const isMountedRef = useRef(true);

  /**
   * Validate all form values
   */
  const validateForm = useCallback(
    (valuesToValidate: T): Record<keyof T, string> => {
      if (!validate) {
        return {} as Record<keyof T, string>;
      }

      const validationErrors = validate(valuesToValidate);

      // Ensure all fields have error entries (empty string if no error)
      const normalizedErrors: Record<keyof T, string> = {} as Record<
        keyof T,
        string
      >;

      Object.keys(valuesToValidate).forEach((key) => {
        normalizedErrors[key as keyof T] =
          validationErrors[key as keyof T] || '';
      });

      return normalizedErrors;
    },
    [validate]
  );

  /**
   * Handle field value change
   */
  const handleChange = useCallback(
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value, type } = e.target as HTMLInputElement;

      setValues((prevValues) => {
        const newValues = { ...prevValues };

        // Handle different input types
        if (type === 'checkbox') {
          newValues[name as keyof T] = (
            e.target as HTMLInputElement
          ).checked as unknown as T[keyof T];
        } else if (type === 'number') {
          newValues[name as keyof T] = (
            parseFloat(value) || ''
          ) as unknown as T[keyof T];
        } else {
          newValues[name as keyof T] = value as unknown as T[keyof T];
        }

        return newValues;
      });
    },
    []
  );

  /**
   * Handle field blur - validate on blur
   */
  const handleBlur = useCallback(
    (
      e: FocusEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name } = e.target;

      // Mark field as touched
      setTouched((prevTouched) => ({
        ...prevTouched,
        [name]: true,
      }));

      // Validate the field
      setValues((prevValues) => {
        const newErrors = validateForm(prevValues);
        setErrors(newErrors);
        return prevValues;
      });
    },
    [validateForm]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!isMountedRef.current) return;

      setIsSubmitting(true);

      try {
        // Validate all fields
        const formErrors = validateForm(values);

        // Mark all fields as touched
        const allTouched: Record<keyof T, boolean> = {} as Record<
          keyof T,
          boolean
        >;
        Object.keys(values).forEach((key) => {
          allTouched[key as keyof T] = true;
        });

        setTouched(allTouched);
        setErrors(formErrors);

        // Check if there are any errors
        const hasErrors = Object.values(formErrors).some((error) => error !== '');

        if (hasErrors) {
          setIsSubmitting(false);
          return;
        }

        // Call onSubmit callback
        await onSubmit(values);

        if (!isMountedRef.current) return;
      } catch (error) {
        if (!isMountedRef.current) return;

        // Log error but don't prevent submission - it's up to onSubmit to handle
        console.error('Form submission error:', error);
      } finally {
        if (isMountedRef.current) {
          setIsSubmitting(false);
        }
      }
    },
    [values, validateForm, onSubmit]
  );

  /**
   * Set a specific field's value
   */
  const setFieldValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues((prevValues) => ({
        ...prevValues,
        [field]: value,
      }));
    },
    []
  );

  /**
   * Set a specific field's error
   */
  const setFieldError = useCallback(
    <K extends keyof T>(field: K, error: string) => {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: error,
      }));
    },
    []
  );

  /**
   * Set a specific field's touched state
   */
  const setFieldTouched = useCallback(
    <K extends keyof T>(field: K, isTouched: boolean) => {
      setTouched((prevTouched) => ({
        ...prevTouched,
        [field]: isTouched,
      }));
    },
    []
  );

  /**
   * Reset form to initial values
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({} as Record<keyof T, string>);
    setTouched({} as Record<keyof T, boolean>);
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Set multiple values at once
   */
  const setFormValues = useCallback((newValues: T) => {
    setValues(newValues);
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    setValues: setFormValues,
  };
}
