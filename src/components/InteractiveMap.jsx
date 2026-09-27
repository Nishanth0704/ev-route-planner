import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP_CONFIG } from '../services/routingService'
import './InteractiveMap.css'

function createCustomMarker(type, label) {
  const isStart = type === 'start'
  const color = isStart ? '#00e676' : '#ff1744'
  const iconSymbol = isStart ? '🟢' : '🏁'

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div class="pin-wrapper ${isStart ? 'start-pin' : 'dest-pin'}">
        <span class="pin-icon">${iconSymbol}</span>
        <span class="pin-label">${label}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

function createStationMarker(station) {
  const isFast = station.maxPowerKw && station.maxPowerKw >= 40
  const powerBadge = station.maxPowerKw ? `${station.maxPowerKw}kW` : '⚡'

  return L.divIcon({
    className: 'custom-station-pin',
    html: `
      <div class="station-pin-wrapper ${isFast ? 'fast-station' : 'standard-station'}">
        <span class="station-pin-icon">🔌</span>
        <span class="station-pin-kw">${powerBadge}</span>
      </div>
    `,
    iconSize: [46, 26],
    iconAnchor: [23, 13],
    popupAnchor: [0, -14],
  })
}

function buildStationPopupHtml(station) {
  const connectorsHtml = station.connectors && station.connectors.length > 0
    ? station.connectors
        .map(
          (c) =>
            `<span class="popup-conn-tag">${c.title}${c.powerKw ? ` (${c.powerKw}kW)` : ''}</span>`
        )
        .join('')
    : '<span class="popup-conn-tag">Standard Connector</span>'

  return `
    <div class="station-popup">
      <div class="station-popup-header">
        <span class="popup-badge-icon">⚡</span>
        <strong class="popup-title">${station.name}</strong>
      </div>
      <div class="popup-field">
        <span class="popup-label">Operator:</span>
        <span class="popup-value">${station.operator || 'Independent / Unknown'}</span>
      </div>
      <div class="popup-field">
        <span class="popup-label">Location:</span>
        <span class="popup-value">${station.address || station.city}</span>
      </div>
      <div class="popup-field">
        <span class="popup-label">Coordinates:</span>
        <span class="popup-value">${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}</span>
      </div>
      <div class="popup-field">
        <span class="popup-label">Status:</span>
        <span class="popup-value popup-status-badge">${station.operationalStatus || 'Operational'}</span>
      </div>
      <div class="popup-connectors-section">
        <span class="popup-label">Connectors:</span>
        <div class="popup-connectors-list">${connectorsHtml}</div>
      </div>
      <div class="popup-availability-banner">
        <span class="avail-dot"></span>
        <span>Availability: Unknown</span>
      </div>
    </div>
  `
}

function InteractiveMap({ route, isLoading, chargingStations = [] }) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const routeLayerRef = useRef(null)
  const markersLayerRef = useRef(null)
  const stationsLayerRef = useRef(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    // Default center at India / general view
    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    })

    L.tileLayer(MAP_CONFIG.tileUrl, {
      attribution: MAP_CONFIG.attribution,
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    // Fix initial tile rendering dimensions
    setTimeout(() => {
      map.invalidateSize()
    }, 200)

    // Window resize handler
    const handleResize = () => map.invalidateSize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update route on map
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear existing route and markers
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current)
      routeLayerRef.current = null
    }
    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current)
      markersLayerRef.current = null
    }

    if (!route || !route.coordinates || route.coordinates.length === 0) {
      return
    }

    const markersGroup = L.featureGroup()

    // Background shadow polyline for glow effect
    const glowLine = L.polyline(route.coordinates, {
      color: 'rgba(0, 230, 118, 0.35)',
      weight: 9,
      lineCap: 'round',
      lineJoin: 'round',
    })

    // Main route polyline
    const mainLine = L.polyline(route.coordinates, {
      color: '#00e676',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    })

    const routeGroup = L.featureGroup([glowLine, mainLine]).addTo(map)
    routeLayerRef.current = routeGroup

    // Start marker
    if (route.startPoint) {
      const startMarker = L.marker([route.startPoint.lat, route.startPoint.lon], {
        icon: createCustomMarker('start', 'Start'),
        zIndexOffset: 1000,
      }).bindPopup(`<b>Starting Point</b><br/>${route.startPoint.name}`)

      markersGroup.addLayer(startMarker)
    }

    // Destination marker
    if (route.destPoint) {
      const destMarker = L.marker([route.destPoint.lat, route.destPoint.lon], {
        icon: createCustomMarker('dest', 'Destination'),
        zIndexOffset: 1000,
      }).bindPopup(`<b>Destination</b><br/>${route.destPoint.name}`)

      markersGroup.addLayer(destMarker)
    }

    markersGroup.addTo(map)
    markersLayerRef.current = markersGroup

    // Fit map bounds to encompass the entire route
    const allBounds = mainLine.getBounds()
    map.fitBounds(allBounds, {
      padding: [45, 45],
      maxZoom: 15,
      animate: true,
    })

    setTimeout(() => {
      map.invalidateSize()
    }, 150)
  }, [route])

  // Update charging stations on map
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear existing station markers
    if (stationsLayerRef.current) {
      map.removeLayer(stationsLayerRef.current)
      stationsLayerRef.current = null
    }

    if (!chargingStations || chargingStations.length === 0) {
      return
    }

    const stationsGroup = L.featureGroup()

    chargingStations.forEach((station) => {
      if (typeof station.latitude === 'number' && typeof station.longitude === 'number') {
        const marker = L.marker([station.latitude, station.longitude], {
          icon: createStationMarker(station),
          zIndexOffset: 500,
        }).bindPopup(buildStationPopupHtml(station), {
          maxWidth: 320,
          className: 'station-leaflet-popup',
        })

        stationsGroup.addLayer(marker)
      }
    })

    stationsGroup.addTo(map)
    stationsLayerRef.current = stationsGroup
  }, [chargingStations])

  return (
    <div className="card interactive-map-card">
      <div className="map-container" ref={mapContainerRef} />

      {/* Loading overlay when calculating route */}
      {isLoading && (
        <div className="map-overlay-loading">
          <div className="map-spinner"></div>
          <span>Calculating road route...</span>
        </div>
      )}

      {/* Initial guidance watermark when no route is planned yet */}
      {!route && !isLoading && (
        <div className="map-hint-banner">
          <span>🗺️ Enter Starting Point & Destination, then click <strong>PLAN TRIP</strong> to view the route.</span>
        </div>
      )}
    </div>
  )
}

export default InteractiveMap
