import { useState, useEffect } from 'react'
import { getBrands, getModelsByBrand, getVehicles } from '../services/vehicleService'
import './VehicleSelector.css'

function VehicleSelector({ selectedBrand, setSelectedBrand, selectedModel, setSelectedModel, onVehicleSelect }) {
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [currentVehicle, setCurrentVehicle] = useState(null)
  const [error, setError] = useState(null)

  // Load brands on mount
  useEffect(() => {
    const { error: loadError } = getVehicles()
    if (loadError) {
      setError(loadError)
      return
    }
    setBrands(getBrands())
  }, [])

  // Update models when brand changes
  useEffect(() => {
    if (selectedBrand) {
      const brandModels = getModelsByBrand(selectedBrand)
      setModels(brandModels)
    } else {
      setModels([])
    }
    setCurrentVehicle(null)
    if (onVehicleSelect) {
      onVehicleSelect(null)
    }
  }, [selectedBrand])

  // Update vehicle info when model changes
  useEffect(() => {
    if (selectedModel) {
      const vehicle = models.find(m => m.vehicle_id === parseInt(selectedModel, 10))
      setCurrentVehicle(vehicle || null)
      if (onVehicleSelect) {
        onVehicleSelect(vehicle || null)
      }
    } else {
      setCurrentVehicle(null)
      if (onVehicleSelect) {
        onVehicleSelect(null)
      }
    }
  }, [selectedModel, models])

  const handleBrandChange = (e) => {
    setSelectedBrand(e.target.value)
    setSelectedModel('')
  }

  if (error) {
    return (
      <div className="card vehicle-selector">
        <h2 className="card-title">
          <span className="card-icon">🚗</span>
          Vehicle
        </h2>
        <div className="vehicle-error">
          <span className="error-icon">⚠️</span>
          <p>Failed to load vehicle data</p>
          <p className="error-detail">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card vehicle-selector">
      <h2 className="card-title">
        <span className="card-icon">🚗</span>
        Vehicle
      </h2>
      <div className="form-group">
        <label className="form-label">Vehicle Brand</label>
        <select
          className="form-select"
          value={selectedBrand}
          onChange={handleBrandChange}
        >
          <option value="">Select brand...</option>
          {brands.map(brand => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Vehicle Model</label>
        <select
          className="form-select"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={!selectedBrand}
        >
          <option value="">Select model...</option>
          {models.map(model => (
            <option key={model.vehicle_id} value={model.vehicle_id}>
              {model.model}
            </option>
          ))}
        </select>
      </div>

      {currentVehicle && (
        <div className="vehicle-info-card">
          <h3 className="vehicle-name">
            {currentVehicle.brand} {currentVehicle.model}
          </h3>
          <div className="vehicle-specs">
            <div className="spec">
              <span className="spec-label">Vehicle Type</span>
              <span className="spec-value">{currentVehicle.vehicle_type}</span>
            </div>
            <div className="spec">
              <span className="spec-label">Battery Capacity</span>
              <span className="spec-value">{currentVehicle.battery_kwh} kWh</span>
            </div>
            <div className="spec">
              <span className="spec-label">Range</span>
              <span className="spec-value">{currentVehicle.range_km} km</span>
            </div>
            <div className="spec">
              <span className="spec-label">Efficiency</span>
              <span className="spec-value">{currentVehicle.efficiency_km_per_kwh} km/kWh</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VehicleSelector
