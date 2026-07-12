import { TELEFONO_FIJO_PREFIX, formatTelefonoFijo } from '../lib/phone'
import './PhoneField.css'

export function TelefonoFijoField({
  id,
  label,
  value,
  onChange,
  wrapperClassName = 'panel-field',
  labelClassName = 'panel-field__label',
}) {
  const number = formatTelefonoFijo(value)

  const handleChange = (event) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 8)
    onChange(digits ? `${TELEFONO_FIJO_PREFIX}${digits}` : '')
  }

  return (
    <label className={wrapperClassName} htmlFor={id}>
      {label && <span className={labelClassName}>{label}</span>}
      <span className="phone-field__row">
        <span className="phone-field__prefix" aria-hidden="true">
          {TELEFONO_FIJO_PREFIX}
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          maxLength={8}
          className="phone-field__number"
          placeholder="27123456"
          autoComplete="tel-national"
          value={number}
          onChange={handleChange}
        />
      </span>
    </label>
  )
}
