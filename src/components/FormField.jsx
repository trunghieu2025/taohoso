/**
 * Reusable form field components defined outside of any parent component
 * to prevent React from re-mounting them on every render.
 */

export function FormInput({ label, name, value, onChange, required, type = 'text', placeholder, hint, error }) {
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

export function FormTextArea({ label, name, value, onChange, placeholder, hint, rows = 3 }) {
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

export function FormSelect({ label, name, value, onChange, options, hint }) {
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
