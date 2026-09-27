import { placeholderTripSummary, inrFormatter } from '../data/placeholderData'
import './TripSummary.css'

function TripSummary({ tripData, batteryAnalysis }) {
  const summary = placeholderTripSummary

  // If dynamic battery & range analysis is provided, use it; otherwise fallback to placeholder
  const isDynamic = Boolean(batteryAnalysis)

  const displayedDistance = isDynamic
    ? `${batteryAnalysis.tripDistanceKm} km`
    : tripData?.distanceKm
    ? `${tripData.distanceKm} km`
    : summary.distance

  const currentBatteryVal = isDynamic
    ? `${batteryAnalysis.currentBatteryPercent}%`
    : summary.currentBattery

  const arrivalBatteryVal = isDynamic
    ? `${batteryAnalysis.destinationBatteryPercent}%`
    : summary.arrivalBattery

  const energyRequiredVal = isDynamic
    ? `${batteryAnalysis.energyRequiredKwh} kWh`
    : summary.energyRequired

  const chargingStatusVal = isDynamic
    ? batteryAnalysis.chargingStatus
    : summary.chargingRequired

  const estimatedCostVal = isDynamic
    ? batteryAnalysis.estimatedCostInr
    : typeof tripData?.estimatedCost === 'number'
    ? inrFormatter.format(tripData.estimatedCost)
    : summary.estimatedCost

  const cards = [
    { label: 'Distance', value: displayedDistance, icon: '📏', highlight: true },
    { label: 'Current Battery', value: currentBatteryVal, icon: '🔋', highlight: isDynamic },
    {
      label: 'Est. Arrival Battery',
      value: arrivalBatteryVal,
      icon: '🎯',
      highlight: isDynamic,
      statusClass: isDynamic
        ? batteryAnalysis.canCompleteTrip
          ? 'val-success'
          : 'val-warning'
        : '',
    },
    { label: 'Energy Required', value: energyRequiredVal, icon: '⚡', highlight: isDynamic },
    {
      label: 'Charging Status',
      value: chargingStatusVal,
      icon: isDynamic && batteryAnalysis.canCompleteTrip ? '✅' : '🔌',
      highlight: isDynamic,
      statusClass: isDynamic
        ? batteryAnalysis.canCompleteTrip
          ? 'val-success'
          : 'val-warning'
        : '',
    },
    { label: 'Est. Charging Cost', value: estimatedCostVal, icon: '💰', highlight: isDynamic },
  ]

  return (
    <div className="trip-summary-container">
      {/* 1. Clear Battery & Range Summary Card */}
      {batteryAnalysis && (
        <div className="card battery-range-summary-card">
          <div className="battery-summary-header">
            <div className="battery-header-title-group">
              <span className="battery-header-icon">🔋</span>
              <div>
                <h2 className="battery-summary-title">Battery & Range Summary</h2>
                <span className="vehicle-badge">
                  {batteryAnalysis.vehicle.brand} {batteryAnalysis.vehicle.model} ({batteryAnalysis.vehicle.batteryKwh} kWh · {batteryAnalysis.vehicle.efficiencyKmPerKwh} km/kWh)
                </span>
              </div>
            </div>

            {/* Prominent Charging Status Badge */}
            <div className={`charging-badge badge-${batteryAnalysis.chargingStatusType}`}>
              <span className="badge-icon">
                {batteryAnalysis.canCompleteTrip ? '✅' : '⚡'}
              </span>
              <span className="badge-text">{batteryAnalysis.chargingStatus}</span>
            </div>
          </div>

          {/* Status Explanation Banner */}
          <div className={`status-explanation-banner banner-${batteryAnalysis.chargingStatusType}`}>
            <span className="status-banner-icon">
              {batteryAnalysis.canCompleteTrip ? '🟢' : '⚠️'}
            </span>
            <div className="status-banner-content">
              <strong>{batteryAnalysis.chargingStatus}</strong>
              <p>{batteryAnalysis.statusDetail}</p>
            </div>
          </div>

          {/* Core 6 Fields Requested */}
          <div className="battery-fields-grid">
            <div className="battery-metric-item">
              <span className="metric-label">Current Battery</span>
              <span className="metric-value">{batteryAnalysis.currentBatteryPercent}%</span>
              <span className="metric-sub">Start of trip</span>
            </div>

            <div className="battery-metric-item">
              <span className="metric-label">Available Energy</span>
              <span className="metric-value highlight">{batteryAnalysis.availableEnergyKwh} kWh</span>
              <span className="metric-sub">Usable capacity</span>
            </div>

            <div className="battery-metric-item">
              <span className="metric-label">Estimated Range</span>
              <span className="metric-value">{batteryAnalysis.estimatedRangeKm} km</span>
              <span className="metric-sub">At current charge</span>
            </div>

            <div className="battery-metric-item">
              <span className="metric-label">Trip Distance</span>
              <span className="metric-value highlight">{batteryAnalysis.tripDistanceKm} km</span>
              <span className="metric-sub">Calculated road route</span>
            </div>

            <div className={`battery-metric-item ${batteryAnalysis.canCompleteTrip ? 'item-success' : 'item-warning'}`}>
              <span className="metric-label">Estimated Battery at Destination</span>
              <span className={`metric-value ${batteryAnalysis.canCompleteTrip ? 'val-success' : 'val-warning'}`}>
                {batteryAnalysis.destinationBatteryPercent}%
              </span>
              <span className="metric-sub">Remaining arrival SOC</span>
            </div>

            <div className="battery-metric-item">
              <span className="metric-label">Reserve Target</span>
              <span className="metric-value">{batteryAnalysis.reserveTargetPercent}%</span>
              <span className="metric-sub">Safety buffer</span>
            </div>
          </div>

          {/* Visual Battery Level Bar */}
          <div className="battery-visual-section">
            <div className="battery-visual-labels">
              <span>0%</span>
              <span className="reserve-label" style={{ left: `${batteryAnalysis.reserveTargetPercent}%` }}>
                ▼ Reserve ({batteryAnalysis.reserveTargetPercent}%)
              </span>
              <span>100%</span>
            </div>
            <div className="battery-gauge-track">
              {/* Destination battery fill */}
              <div
                className={`battery-gauge-fill ${batteryAnalysis.canCompleteTrip ? 'fill-success' : 'fill-warning'}`}
                style={{ width: `${Math.min(100, Math.max(0, batteryAnalysis.destinationBatteryPercent))}%` }}
                title={`Projected Arrival: ${batteryAnalysis.destinationBatteryPercent}%`}
              />
              {/* Energy consumed slice */}
              <div
                className="battery-gauge-consumed"
                style={{
                  left: `${Math.min(100, Math.max(0, batteryAnalysis.destinationBatteryPercent))}%`,
                  width: `${Math.min(100, Math.max(0, batteryAnalysis.currentBatteryPercent - batteryAnalysis.destinationBatteryPercent))}%`,
                }}
                title={`Energy to be consumed: ${batteryAnalysis.energyRequiredKwh} kWh`}
              />
              {/* Reserve marker line */}
              <div
                className="battery-reserve-marker"
                style={{ left: `${batteryAnalysis.reserveTargetPercent}%` }}
                title={`Reserve Target: ${batteryAnalysis.reserveTargetPercent}%`}
              />
            </div>
            <div className="battery-legend">
              <span className="legend-item"><span className="legend-color color-arrival"></span> Arrival Battery ({batteryAnalysis.destinationBatteryPercent}%)</span>
              <span className="legend-item"><span className="legend-color color-consumed"></span> Energy Needed for Trip ({batteryAnalysis.energyRequiredKwh} kWh)</span>
              <span className="legend-item"><span className="legend-color color-reserve"></span> Reserve Target ({batteryAnalysis.reserveTargetPercent}%)</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Overview Metrics Cards */}
      <div className="trip-summary">
        <h2 className="section-title">Trip Overview</h2>
        <div className="summary-grid">
          {cards.map((card) => (
            <div key={card.label} className={`summary-card ${card.highlight ? 'summary-card-highlight' : ''}`}>
              <span className="summary-icon">{card.icon}</span>
              <span className="summary-label">{card.label}</span>
              <span className={`summary-value ${card.statusClass || ''} ${card.highlight ? 'summary-value-highlight' : ''}`}>
                {card.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TripSummary
