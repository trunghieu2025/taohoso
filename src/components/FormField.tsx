/**
 * Reusable form field components defined outside of any parent component
 * to prevent React from re-mounting them on every render.
 */
import { ChangeEvent } from 'react';

interface FormInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
}

interface FormTextAreaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
}

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  hint?: string;
}

export function FormInput({ label, name, value, onChange, required, type = 'text', placeholder, hint, error }: FormInputProps) {
    return (
        <div className="form-group">
            <label className="form-label">
                {label} {required && <span className="required">*</span>}
            </label>
            <input
                type={type}
                name={name}
                className={`form-input ${error ? 'error' : ''}`}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
            {error && <div className="form-error">{error}</div>}
            {hint && <div className="form-hint">{hint}</div>}
        </div>
    );
}

export function FormTextArea({ label, name, value, onChange, placeholder, hint, rows = 3 }: FormTextAreaProps) {
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <textarea
                name={name}
                className="form-textarea"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
            />
            {hint && <div className="form-hint">{hint}</div>}
        </div>
    );
}

export function FormSelect({ label, name, value, onChange, options, hint }: FormSelectProps) {
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <select className="form-select" name={name} value={value} onChange={onChange}>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {hint && <div className="form-hint">{hint}</div>}
        </div>
    );
}
