/**
 * Open Charge Map Charging Station Service
 *
 * Fetches real EV charging stations along a travel route using the Open Charge Map API.
 * Uses environment variable VITE_OPEN_CHARGE_MAP_API_KEY (never hardcoded, never logged).
 */

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {}
const OCM_API_KEY =
  env.VITE_OPEN_CHARGE_MAP_API_KEY ||
  env.VITE_OPENCHARGEMAP_API_KEY ||
  env.OPENCHARGEMAP_API_KEY ||
  ''

const OCM_BASE_URL = 'https://api.openchargemap.io/v3/poi/'

/**
 * Calculates Haversine distance in km between two coordinate points
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Samples evenly spaced coordinate points along a route polyline.
 *
 * @param {Array<[number, number]>} coordinates - Array of [lat, lon] points
 * @param {number} totalDistanceKm - Total route distance in km
 * @param {number} intervalKm - Approx spacing between sample queries (default 35 km)
 * @returns {Array<[number, number]>} - Array of sampled [lat, lon] points
 */
function sampleRoutePoints(coordinates, totalDistanceKm, intervalKm = 35) {
  if (!coordinates || coordinates.length === 0) return []
  if (coordinates.length <= 2) return coordinates

  // Always include start and end points
  const points = [coordinates[0]]

  // Determine how many sample points along the route
  const numSamples = Math.min(8, Math.max(2, Math.round(totalDistanceKm / intervalKm)))
  const step = Math.floor(coordinates.length / (numSamples + 1))

  for (let i = 1; i <= numSamples; i++) {
    const idx = Math.min(coordinates.length - 2, i * step)
    points.push(coordinates[idx])
  }

  points.push(coordinates[coordinates.length - 1])
  return points
}

/**
 * Formats a raw Open Charge Map POI record into an application station object.
 */
function normalizeStation(raw, startPoint) {
  const addressInfo = raw.AddressInfo || {}
  const operatorInfo = raw.OperatorInfo || {}
  const statusType = raw.StatusType || {}
  const rawConnections = raw.Connections || []

  const lat = addressInfo.Latitude
  const lon = addressInfo.Longitude

  // Format address components
  const addressParts = [
    addressInfo.AddressLine1,
    addressInfo.AddressLine2,
    addressInfo.Town,
    addressInfo.StateOrProvince,
    addressInfo.Postcode,
  ].filter(Boolean)
  const fullAddress = addressParts.join(', ') || 'Address not listed'
  const city = addressInfo.Town || addressInfo.StateOrProvince || 'Unknown City'

  // Extract connectors
  const connectors = rawConnections.map((conn) => {
    const typeTitle = conn.ConnectionType?.Title || 'Standard Connector'
    const powerKw = conn.PowerKW ? Number(conn.PowerKW) : null
    const currentType = conn.CurrentType?.Title || (conn.Level?.IsFastChargeCapable ? 'DC' : 'AC')
    const isFast = !!(conn.Level?.IsFastChargeCapable || (powerKw && powerKw >= 40))

    return {
      id: conn.ID,
      title: typeTitle,
      powerKw,
      currentType,
      isFast,
      quantity: conn.Quantity || 1,
      status: conn.StatusType?.Title || 'Operational',
    }
  })

  // Determine maximum charging power available at the station
  const powerValues = connectors.map((c) => c.powerKw).filter((p) => p !== null && p > 0)
  const maxPowerKw = powerValues.length > 0 ? Math.max(...powerValues) : null

  // Operational status
  const operationalStatus = statusType.Title || (statusType.IsOperational ? 'Operational' : 'Status Unknown')

  // Distance from route starting point
  let distanceFromStartKm = null
  if (startPoint && typeof startPoint.lat === 'number' && typeof startPoint.lon === 'number') {
    distanceFromStartKm = Math.round(haversineDistance(startPoint.lat, startPoint.lon, lat, lon) * 10) / 10
  }

  return {
    id: raw.ID,
    name: addressInfo.Title || 'EV Charging Station',
    latitude: lat,
    longitude: lon,
    address: fullAddress,
    city,
    operator: operatorInfo.Title || 'Independent / Unknown Operator',
    operatorWebsite: operatorInfo.WebsiteURL || null,
    operatorPhone: operatorInfo.PhonePrimaryContact || null,
    connectors,
    maxPowerKw,
    operationalStatus,
    isOperational: statusType.IsOperational !== false,
    // Requirement 10: "If the API does not provide live availability for a station, display:
    // 'Availability: Unknown' - Do NOT invent availability."
    availability: 'Unknown',
    distanceFromStartKm,
    generalComments: raw.GeneralComments || null,
    source: 'Open Charge Map',
  }
}

/**
 * Searches for real charging stations along the route using Open Charge Map API.
 *
 * @param {Array<[number, number]>} routeCoordinates - Array of [lat, lon] coordinates
 * @param {number} totalDistanceKm - Total driving route distance in km
 * @param {number} corridorRadiusKm - Search corridor radius in km (default 25 km)
 * @returns {Promise<Array>} - Array of deduplicated station objects sorted along route
 */
export async function searchStationsAlongRoute(routeCoordinates, totalDistanceKm, corridorRadiusKm = 25) {
  if (!OCM_API_KEY) {
    throw new Error('Open Charge Map API key is not configured. Please add VITE_OPEN_CHARGE_MAP_API_KEY to your .env file.')
  }

  if (!routeCoordinates || routeCoordinates.length === 0) {
    return []
  }

  // Sample corridor query points along route polyline
  const samplePoints = sampleRoutePoints(routeCoordinates, totalDistanceKm, 40)
  const startPoint = { lat: routeCoordinates[0][0], lon: routeCoordinates[0][1] }

  // Execute queries for each sample point
  const queryPromises = samplePoints.map(async ([lat, lon]) => {
    try {
      const url = new URL(OCM_BASE_URL)
      url.searchParams.set('output', 'json')
      url.searchParams.set('latitude', lat)
      url.searchParams.set('longitude', lon)
      url.searchParams.set('distance', corridorRadiusKm)
      url.searchParams.set('distanceunit', 'KM')
      url.searchParams.set('maxresults', '30')
      url.searchParams.set('compact', 'false')
      url.searchParams.set('verbose', 'false')
      url.searchParams.set('key', OCM_API_KEY)

      const res = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Invalid Open Charge Map API key or unauthorized request.')
        }
        if (res.status === 429) {
          throw new Error('Open Charge Map rate limit reached. Please wait a moment and try again.')
        }
        throw new Error(`Open Charge Map returned HTTP ${res.status}`)
      }

      const data = await res.json()
      return Array.isArray(data) ? data : []
    } catch (err) {
      // Return empty array for individual point failure so remaining points succeed
      console.warn('Corridor sample point query warning:', err.message)
      return []
    }
  })

  const results = await Promise.all(queryPromises)

  // Deduplicate stations using a Map keyed on station ID
  const uniqueStationsMap = new Map()

  for (const batch of results) {
    for (const rawStation of batch) {
      if (rawStation && rawStation.ID && !uniqueStationsMap.has(rawStation.ID)) {
        // Validate coordinates
        if (
          rawStation.AddressInfo &&
          typeof rawStation.AddressInfo.Latitude === 'number' &&
          typeof rawStation.AddressInfo.Longitude === 'number'
        ) {
          const normalized = normalizeStation(rawStation, startPoint)
          uniqueStationsMap.set(rawStation.ID, normalized)
        }
      }
    }
  }

  // Convert to array and sort progressively from starting point along the route
  const stations = Array.from(uniqueStationsMap.values()).sort((a, b) => {
    if (a.distanceFromStartKm !== null && b.distanceFromStartKm !== null) {
      return a.distanceFromStartKm - b.distanceFromStartKm
    }
    return 0
  })

  return stations
}
