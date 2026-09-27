import { useState, useMemo } from 'react'
import ChargingStationCard from './ChargingStationCard'
import './ChargingStationList.css'

function ChargingStationList({ stations = [], isLoading = false, error = null, corridorRadiusKm = 25 }) {
  const [filterType, setFilterType] = useState('all') // 'all' | 'fast' | 'ac'
  const [searchQuery, setSearchQuery] = useState('')

  // Filter stations based on fast charger toggle and search input
  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      // Type filter
      if (filterType === 'fast' && (!station.maxPowerKw || station.maxPowerKw < 40)) {
        return false
      }
      if (filterType === 'ac' && station.maxPowerKw && station.maxPowerKw >= 40) {
        return false
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = station.name?.toLowerCase().includes(q)
        const matchesOperator = station.operator?.toLowerCase().includes(q)
        const matchesCity = station.city?.toLowerCase().includes(q)
        const matchesAddress = station.address?.toLowerCase().includes(q)
        return matchesName || matchesOperator || matchesCity || matchesAddress
      }

      return true
    })
  }, [stations, filterType, searchQuery])

  // Count fast chargers
  const fastChargersCount = useMemo(() => {
    return stations.filter((s) => s.maxPowerKw && s.maxPowerKw >= 40).length
  }, [stations])

  return (
    <div className="charging-stations">
      <div className="stations-section-header">
        <div>
          <h2 className="section-title">
            <span className="title-icon">⚡</span>
            Charging Stations Along Route
          </h2>
          <p className="section-subtitle">
            Real charging stations from <strong>Open Charge Map</strong> within {corridorRadiusKm} km of your route corridor.
          </p>
        </div>

        {!isLoading && !error && stations.length > 0 && (
          <div className="stations-stats-badges">
            <span className="stat-badge total">
              <strong>{stations.length}</strong> Total Found
            </span>
            <span className="stat-badge fast">
              <strong>{fastChargersCount}</strong> DC Fast Chargers
            </span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="stations-loading-card">
          <div className="stations-spinner"></div>
          <div className="loading-text">
            <h3>Searching Open Charge Map...</h3>
            <p>Querying real-world charging stations within {corridorRadiusKm} km along your route polyline.</p>
          </div>
        </div>
      )}

      {/* API Error State */}
      {!isLoading && error && (
        <div className="stations-error-card">
          <span className="error-icon">⚠️</span>
          <div className="error-content">
            <h4>Could Not Load Charging Stations</h4>
            <p>{error}</p>
            <span className="error-hint">Please verify your Open Charge Map API key in <code>.env</code> or try planning the trip again.</span>
          </div>
        </div>
      )}

      {/* Empty / No Stations Found State */}
      {!isLoading && !error && stations.length === 0 && (
        <div className="stations-empty-card">
          <span className="empty-icon">🔌</span>
          <h4>No Charging Stations Found</h4>
          <p>
            No public charging stations were reported by Open Charge Map within a {corridorRadiusKm} km corridor of this route.
          </p>
        </div>
      )}

      {/* Loaded Stations Content */}
      {!isLoading && !error && stations.length > 0 && (
        <>
          {/* Controls Bar: Filter & Search */}
          <div className="stations-controls-bar">
            <div className="filter-pill-group">
              <button
                className={`filter-pill-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                All ({stations.length})
              </button>
              <button
                className={`filter-pill-btn ${filterType === 'fast' ? 'active' : ''}`}
                onClick={() => setFilterType('fast')}
              >
                ⚡ Fast Chargers &ge;40 kW ({fastChargersCount})
              </button>
              <button
                className={`filter-pill-btn ${filterType === 'ac' ? 'active' : ''}`}
                onClick={() => setFilterType('ac')}
              >
                🔌 AC Chargers ({stations.length - fastChargersCount})
              </button>
            </div>

            <div className="search-station-box">
              <span className="search-station-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by name, operator, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="station-search-input"
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Results count feedback if filtered */}
          {(filterType !== 'all' || searchQuery) && (
            <div className="filter-results-info">
              Showing {filteredStations.length} of {stations.length} stations
            </div>
          )}

          {/* Stations Grid */}
          <div className="stations-grid">
            {filteredStations.map((station) => (
              <ChargingStationCard key={station.id} station={station} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default ChargingStationList
