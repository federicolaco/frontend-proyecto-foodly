import { useState } from 'react'
import './PasswordField.css'

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    )
  }

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.5 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.8-2M6.4 6.5C4.6 7.9 3.2 9.8 2 12s3.5 7 10 7c1.8 0 3.5-.5 5-1.3M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.2 18.2 0 0 1-4.1 5.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function PasswordField({
  id,
  label,
  placeholder,
  hint,
  value,
  onChange,
  autoComplete,
  ...inputProps
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-field">
      <label className="auth-field" htmlFor={id}>
        <span className="auth-field__label">{label}</span>
        <span className="auth-field__control auth-field__control--password">
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            placeholder={placeholder}
            autoComplete={autoComplete ?? (id.includes('confirm') ? 'new-password' : 'current-password')}
            value={value}
            onChange={onChange}
            {...inputProps}
          />
          <button
            type="button"
            className="password-field__toggle"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <EyeIcon open={visible} />
          </button>
        </span>
      </label>
      {hint ? (
        typeof hint === 'string' ? (
          <p className="password-field__hint">{hint}</p>
        ) : (
          <div className="password-field__hint">
            <p className="password-field__hint-intro">{hint.intro}</p>
            <ul className="password-field__hint-list">
              {hint.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )
      ) : null}
    </div>
  )
}
