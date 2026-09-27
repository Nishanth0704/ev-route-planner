import { useState } from 'react'
import './BatterySettings.css'

function BatterySettings({
  currentBattery, setCurrentBattery,
  reserveBattery, setReserveBattery,
  searchAtBattery, setSearchAtBattery,
}) {
  const [errors, setErrors] = useState({})

  const validateAndSet = (value, setter, field) => {
    const num = parseInt(value, 10)
    if (value === '') {
      setter('')
      setErrors(prev => ({ ...prev, [field]: null }))
      return
    }
    if (isNaN(num) || num < 0 || num > 100) {
      setErrors(prev => ({ ...prev, [field]: 'Must be between 0 and 100' }))
    } else {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
    setter(isNaN(num) ? value : num)
  }

  return (
    <div className="card battery-settings">
      <h2 className="card-title">
        <span className="card-icon">🔋</span>
        Battery Settings
      </h2>
      <div className="battery-fields">
        <div className="battery-field">
          <label className="form-label">Current Battery %</label>
          <div className="battery-input-group">
            <input
              type="number"
              className={`form-input battery-input ${errors.current ? 'input-error' : ''}`}
              value={currentBattery}
              onChange={(e) => validateAndSet(e.target.value, setCurrentBattery, 'current')}
              min="0"
              max="100"
            />
            <span className="input-suffix">%</span>
          </div>
          {errors.current && <span className="error-text">{errors.current}</span>}
          <div className="battery-bar">
            <div
              className="battery-fill current-fill"
              style={{ width: `${Math.min(Math.max(currentBattery || 0, 0), 100)}%` }}
            />
          </div>
        </div>

        <div className="battery-field">
          <label className="form-label">Reserve %</label>
          <div className="battery-input-group">
            <input
              type="number"
              className={`form-input battery-input ${errors.reserve ? 'input-error' : ''}`}
              value={reserveBattery}
              onChange={(e) => validateAndSet(e.target.value, setReserveBattery, 'reserve')}
              min="0"
              max="100"
            />
            <span className="input-suffix">%</span>
          </div>
          {errors.reserve && <span className="error-text">{errors.reserve}</span>}
          <div className="battery-bar">
            <div
              className="battery-fill reserve-fill"
              style={{ width: `${Math.min(Math.max(reserveBattery || 0, 0), 100)}%` }}
            />
          </div>
        </div>

        <div className="battery-field">
          <label className="form-label">Search at %</label>
          <div className="battery-input-group">
            <input
              type="number"
              className={`form-input battery-input ${errors.searchAt ? 'input-error' : ''}`}
              value={searchAtBattery}
              onChange={(e) => validateAndSet(e.target.value, setSearchAtBattery, 'searchAt')}
              min="0"
              max="100"
            />
            <span className="input-suffix">%</span>
          </div>
          {errors.searchAt && <span className="error-text">{errors.searchAt}</span>}
          <div className="battery-bar">
            <div
              className="battery-fill search-fill"
              style={{ width: `${Math.min(Math.max(searchAtBattery || 0, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BatterySettings
