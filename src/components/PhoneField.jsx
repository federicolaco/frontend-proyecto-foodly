import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, findCountryByPhoneValue } from '../lib/phoneCodes'
import './PhoneField.css'

function splitValue(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return { code: DEFAULT_COUNTRY_CODE, number: '' }

  const country = findCountryByPhoneValue(trimmed)
  if (country) return { code: country.code, number: trimmed.slice(country.code.length) }

  return { code: DEFAULT_COUNTRY_CODE, number: trimmed.replace(/^\+/, '') }
}

export function PhoneField({
  id,
  label,
  value,
  onChange,
  required = false,
  wrapperClassName = 'panel-field',
  labelClassName = 'panel-field__label',
}) {
  const { code, number } = splitValue(value)

  const handleCodeChange = (event) => {
    onChange(number ? `${event.target.value}${number}` : '')
  }

  const handleNumberChange = (event) => {
    const digits = event.target.value.replace(/\D/g, '')
    onChange(digits ? `${code}${digits}` : '')
  }

  return (
    <label className={wrapperClassName} htmlFor={id}>
      {label && <span className={labelClassName}>{label}</span>}
      <span className="phone-field__row">
        <select
          className="phone-field__code"
          value={code}
          onChange={handleCodeChange}
          aria-label="Código de país"
        >
          {COUNTRY_CODES.map((country) => (
            <option key={`${country.iso}-${country.code}`} value={country.code}>
              {country.flag} {country.code}
            </option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          className="phone-field__number"
          placeholder="99123456"
          autoComplete="tel-national"
          value={number}
          onChange={handleNumberChange}
          required={required}
        />
      </span>
    </label>
  )
}
