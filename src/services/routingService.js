/**
 * Routing & Geocoding Service
 *
 * Uses OpenStreetMap-backed APIs (Photon & OSRM) with environment variable overrides.
 * Includes a built-in coordinates lookup for common cities for instant response
 * and reliable offline/rate-limit fallback.
 */

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {}

const DEFAULT_GEOCODING_API = 'https://photon.komoot.io/api/'
const DEFAULT_ROUTING_API = 'https://router.project-osrm.org/route/v1/driving'
const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

export const MAP_CONFIG = {
  tileUrl: env.VITE_MAP_TILE_URL || DEFAULT_TILE_URL,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  geocodingApi: env.VITE_GEOCODING_API_URL || DEFAULT_GEOCODING_API,
  routingApi: env.VITE_ROUTING_API_URL || DEFAULT_ROUTING_API,
}

// Built-in dictionary of common cities for instant lookup
const COMMON_LOCATIONS = {
  bangalore: { lat: 12.9716, lon: 77.5946, name: 'Bengaluru, Karnataka' },
  bengaluru: { lat: 12.9716, lon: 77.5946, name: 'Bengaluru, Karnataka' },
  mysore: { lat: 12.2958, lon: 76.6394, name: 'Mysuru, Karnataka' },
  mysuru: { lat: 12.2958, lon: 76.6394, name: 'Mysuru, Karnataka' },
  chennai: { lat: 13.0827, lon: 80.2707, name: 'Chennai, Tamil Nadu' },
  mumbai: { lat: 19.076, lon: 72.8777, name: 'Mumbai, Maharashtra' },
  pune: { lat: 18.5204, lon: 73.8567, name: 'Pune, Maharashtra' },
  hyderabad: { lat: 17.385, lon: 78.4867, name: 'Hyderabad, Telangana' },
  delhi: { lat: 28.6139, lon: 77.209, name: 'New Delhi, Delhi' },
  'new delhi': { lat: 28.6139, lon: 77.209, name: 'New Delhi, Delhi' },
  jaipur: { lat: 26.9124, lon: 75.7873, name: 'Jaipur, Rajasthan' },
  ahmedabad: { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad, Gujarat' },
  kolkata: { lat: 22.5726, lon: 88.3639, name: 'Kolkata, West Bengal' },
  kochi: { lat: 9.9312, lon: 76.2673, name: 'Kochi, Kerala' },
  coimbatore: { lat: 11.0168, lon: 76.9558, name: 'Coimbatore, Tamil Nadu' },
  goa: { lat: 15.2993, lon: 74.124, name: 'Panaji, Goa' },
  chandigarh: { lat: 30.7333, lon: 76.7794, name: 'Chandigarh' },
  lucknow: { lat: 26.8467, lon: 80.9462, name: 'Lucknow, Uttar Pradesh' },
  surat: { lat: 21.1702, lon: 72.8311, name: 'Surat, Gujarat' },
  nagpur: { lat: 21.1458, lon: 79.0882, name: 'Nagpur, Maharashtra' },
  indore: { lat: 22.7196, lon: 75.8577, name: 'Indore, Madhya Pradesh' },
  bhopal: { lat: 23.2599, lon: 77.4126, name: 'Bhopal, Madhya Pradesh' },
  patna: { lat: 25.5941, lon: 85.1376, name: 'Patna, Bihar' },
  vadodara: { lat: 22.3072, lon: 73.1812, name: 'Vadodara, Gujarat' },
  visakhapatnam: { lat: 17.6868, lon: 83.2185, name: 'Visakhapatnam, Andhra Pradesh' },
  thiruvananthapuram: { lat: 8.5241, lon: 76.9366, name: 'Thiruvananthapuram, Kerala' },
  // International hubs
  'new york': { lat: 40.7128, lon: -74.006, name: 'New York, USA' },
  boston: { lat: 42.3601, lon: -71.0589, name: 'Boston, USA' },
  'san francisco': { lat: 37.7749, lon: -122.4194, name: 'San Francisco, USA' },
  'los angeles': { lat: 34.0522, lon: -118.2437, name: 'Los Angeles, USA' },
  london: { lat: 51.5074, lon: -0.1278, name: 'London, UK' },
}

/**
 * Geocodes an address or city string to coordinates [lat, lon]
 */
export async function geocodeLocation(query) {
  if (!query || !query.trim()) {
    throw new Error('Please enter a location name')
  }

  const cleanQuery = query.trim().toLowerCase()

  // 1. Check direct coordinates (e.g. "12.9716, 77.5946")
  const coordMatch = cleanQuery.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/)
  if (coordMatch) {
    return {
      lat: parseFloat(coordMatch[1]),
      lon: parseFloat(coordMatch[3]),
      name: query.trim(),
    }
  }

  // 2. Check in-memory common locations dictionary
  if (COMMON_LOCATIONS[cleanQuery]) {
    return COMMON_LOCATIONS[cleanQuery]
  }

  // Check partial key matches in common locations
  for (const [key, loc] of Object.entries(COMMON_LOCATIONS)) {
    if (cleanQuery.includes(key) || key.includes(cleanQuery)) {
      return loc
    }
  }

  // 3. Query Photon Geocoding API
  try {
    const url = `${MAP_CONFIG.geocodingApi}?q=${encodeURIComponent(query.trim())}&limit=1`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      if (data?.features?.length > 0) {
        const feature = data.features[0]
        const [lon, lat] = feature.geometry.coordinates
        const props = feature.properties
        const name = [props.name, props.city, props.state, props.country]
          .filter(Boolean)
          .join(', ') || query.trim()

        return { lat, lon, name }
      }
    }
  } catch (err) {
    console.warn('Geocoding API network issue, attempting fallback:', err)
  }

  throw new Error(`Location "${query}" could not be found. Please check spelling or try another city.`)
}

/**
 * Calculate great-circle distance between two points in km (Haversine formula)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth radius in km
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
 * Generates an interpolated curved path between two coordinates
 */
function generateFallbackRoute(start, dest) {
  const points = []
  const steps = 30
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // Add slight natural road curvature
    const arc = Math.sin(t * Math.PI) * 0.05
    const lat = start.lat + (dest.lat - start.lat) * t + arc
    const lon = start.lon + (dest.lon - start.lon) * t + arc
    points.push([lat, lon])
  }
  return points
}

/**
 * Fetches the real driving road route between two coordinate points
 */
export async function fetchDrivingRoute(startCoords, destCoords) {
  const { lon: sLon, lat: sLat } = startCoords
  const { lon: dLon, lat: dLat } = destCoords

  try {
    const url = `${MAP_CONFIG.routingApi}/${sLon},${sLat};${dLon},${dLat}?overview=full&geometries=geojson`
    const res = await fetch(url)

    if (res.ok) {
      const data = await res.json()
      if (data.code === 'Ok' && data.routes?.length > 0) {
        const route = data.routes[0]
        const distanceKm = Math.round(route.distance / 1000)
        const durationMinutes = Math.round(route.duration / 60)

        // GeoJSON coordinates are [lon, lat], Leaflet polyline expects [lat, lon]
        const coordinates = route.geometry.coordinates.map(([lon, lat]) => [lat, lon])

        return {
          coordinates,
          distanceKm: distanceKm > 0 ? distanceKm : 1,
          durationMinutes,
          summary: route.legs?.[0]?.summary || '',
        }
      }
    }
  } catch (err) {
    console.warn('OSRM routing API error, utilizing fallback route calculation:', err)
  }

  // Fallback: Compute estimated road distance (straight line * road curvature factor ~1.25)
  const straightLine = haversineDistance(sLat, sLon, dLat, dLon)
  const distanceKm = Math.max(1, Math.round(straightLine * 1.25))
  const durationMinutes = Math.round((distanceKm / 60) * 60) // approx 60 km/h avg speed
  const coordinates = generateFallbackRoute(startCoords, destCoords)

  return {
    coordinates,
    distanceKm,
    durationMinutes,
    summary: 'Estimated Road Route',
  }
}

/**
 * Master function: Geocodes start and dest, fetches road route and distance
 */
export async function planTripRoute(startLocation, destination) {
  if (!startLocation?.trim()) {
    throw new Error('Please enter a Starting Point')
  }
  if (!destination?.trim()) {
    throw new Error('Please enter a Destination')
  }

  const [startPoint, destPoint] = await Promise.all([
    geocodeLocation(startLocation),
    geocodeLocation(destination),
  ])

  const routeResult = await fetchDrivingRoute(startPoint, destPoint)

  return {
    startPoint,
    destPoint,
    coordinates: routeResult.coordinates,
    distanceKm: routeResult.distanceKm,
    durationMinutes: routeResult.durationMinutes,
    summary: routeResult.summary,
  }
}
