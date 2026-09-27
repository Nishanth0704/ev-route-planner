import './ChargingStationCard.css'

function ChargingStationCard({ station }) {
  const isFast = station.maxPowerKw && station.maxPowerKw >= 40
  const isOperational = station.isOperational !== false

  // Format connector titles uniquely
  const connectorSummary = station.connectors && station.connectors.length > 0
    ? station.connectors.map((c) => `${c.title}${c.powerKw ? ` (${c.powerKw} kW)` : ''}`).join(' • ')
    : 'Standard EV Connector'

  return (
    <div className={`station-card ${isFast ? 'is-fast-charger' : ''}`}>
      <div className="station-header">
        <div className="station-name-group">
          <span className="station-icon">{isFast ? '⚡' : '🔌'}</span>
          <div>
            <h3 className="station-name">{station.name}</h3>
            <span className="station-operator">{station.operator}</span>
          </div>
        </div>
        <div className="station-header-badges">
          {station.maxPowerKw && (
            <span className={`power-pill ${isFast ? 'power-fast' : 'power-standard'}`}>
              {station.maxPowerKw} kW {isFast ? 'DC Fast' : 'AC'}
            </span>
          )}
          <span className={`status-pill ${isOperational ? 'status-operational' : 'status-other'}`}>
            {station.operationalStatus || 'Operational'}
          </span>
        </div>
      </div>

      <div className="station-address-row">
        <span className="location-icon">📍</span>
        <span className="station-address-text">{station.address}</span>
      </div>

      <div className="station-details-grid">
        <div className="station-detail-item">
          <span className="detail-label">Coordinates</span>
          <span className="detail-value mono">
            {station.latitude?.toFixed(4)}°, {station.longitude?.toFixed(4)}°
          </span>
        </div>

        <div className="station-detail-item">
          <span className="detail-label">Route Distance</span>
          <span className="detail-value">
            {station.distanceFromStartKm !== null
              ? `~${station.distanceFromStartKm} km from start`
              : 'Along route'}
          </span>
        </div>

        <div className="station-detail-item full-width">
          <span className="detail-label">Connectors</span>
          <span className="detail-value connector-text">{connectorSummary}</span>
        </div>

        <div className="station-detail-item full-width">
          <span className="detail-label">Live Availability</span>
          <div className="availability-box">
            <span className="avail-indicator-dot"></span>
            <span className="availability-text">Availability: Unknown</span>
            <span className="availability-subtext">(Real-time occupancy not reported by station API)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChargingStationCard
