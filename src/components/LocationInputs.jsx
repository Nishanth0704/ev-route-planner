import './LocationInputs.css'

function LocationInputs({ startLocation, setStartLocation, destination, setDestination }) {
  return (
    <div className="card location-inputs">
      <h2 className="card-title">
        <span className="card-icon">📍</span>
        Trip Locations
      </h2>
      <div className="form-group">
        <label className="form-label">Starting Point</label>
        <div className="input-wrapper">
          <span className="input-icon start-icon">●</span>
          <input
            type="text"
            className="form-input"
            placeholder="Enter starting location..."
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
          />
        </div>
      </div>
      <div className="location-connector">
        <div className="connector-line"></div>
      </div>
      <div className="form-group">
        <label className="form-label">Destination</label>
        <div className="input-wrapper">
          <span className="input-icon dest-icon">◆</span>
          <input
            type="text"
            className="form-input"
            placeholder="Enter destination..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

export default LocationInputs
