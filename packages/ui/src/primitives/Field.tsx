import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { useId } from 'react';

import { cx } from '../lib/cx.js';

const controlClass = cx(
  'font-sans w-full min-h-11 rounded-md border border-beige bg-ivory px-3 py-2 text-body text-ink',
  'placeholder:text-botanical/50',
  'disabled:cursor-not-allowed disabled:bg-soft-green disabled:text-ink/50',
);

const invalidClass = 'border-coral aria-invalid:border-coral';

export type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  htmlFor: string;
  children: ReactNode;
};

export function Field({ label, hint, error, required, htmlFor, children }: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-body-sm font-semibold text-ink">
        {label}
        {required ? (
          <span className="text-botanical" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={hintId} className="text-caption text-botanical">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-caption font-medium text-ink" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(hintId: string | undefined, errorId: string | undefined): string | undefined {
  return [errorId, hintId].filter(Boolean).join(' ') || undefined;
}

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  id?: string;
};

export function TextField({
  label,
  hint,
  error,
  id,
  required,
  className,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={fieldId}>
      <input
        {...props}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hintId, errorId)}
        className={cx(controlClass, error ? invalidClass : undefined, className)}
      />
    </Field>
  );
}

export type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  id?: string;
};

export function TextAreaField({
  label,
  hint,
  error,
  id,
  required,
  className,
  rows = 4,
  ...props
}: TextAreaFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={fieldId}>
      <textarea
        {...props}
        id={fieldId}
        required={required}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hintId, errorId)}
        className={cx(controlClass, 'min-h-24 py-3', error ? invalidClass : undefined, className)}
      />
    </Field>
  );
}

export type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  id?: string;
  children: ReactNode;
};

export function SelectField({
  label,
  hint,
  error,
  id,
  required,
  className,
  children,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={fieldId}>
      <select
        {...props}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hintId, errorId)}
        className={cx(controlClass, error ? invalidClass : undefined, className)}
      >
        {children}
      </select>
    </Field>
  );
}

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
};

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <label htmlFor={fieldId} className="flex items-start gap-2.5 text-body text-ink">
      <input
        {...props}
        id={fieldId}
        type="checkbox"
        className={cx(
          'border-botanical text-botanical mt-1 h-4 w-4 shrink-0 rounded-sm accent-botanical',
          className,
        )}
      />
      <span>{label}</span>
    </label>
  );
}

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
};

export function Radio({ label, className, id, ...props }: RadioProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <label htmlFor={fieldId} className="flex items-start gap-2.5 text-body text-ink">
      <input
        {...props}
        id={fieldId}
        type="radio"
        className={cx(
          'border-botanical text-botanical mt-1 h-4 w-4 shrink-0 accent-botanical',
          className,
        )}
      />
      <span>{label}</span>
    </label>
  );
}

export function RadioGroup({
  legend,
  children,
  error,
}: {
  legend: ReactNode;
  children: ReactNode;
  error?: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
      <legend className="text-body-sm mb-1 font-semibold text-ink">{legend}</legend>
      {children}
      {error ? (
        <p className="text-caption font-medium text-ink" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
