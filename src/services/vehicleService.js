import csvData from '../data/evVehicles.csv?raw'

/**
 * Vehicle data service — abstracts data access so the source
 * (CSV today, Supabase/PostgreSQL tomorrow) can be swapped
 * without touching UI components.
 */

let _vehicles = null
let _parseError = null

/**
 * Parse a single CSV line, handling commas inside quoted fields.
 */
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

/**
 * Parse CSV text into an array of vehicle objects.
 * Skips blank lines and rows with missing critical fields.
 */
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')

  if (lines.length < 2) {
    throw new Error('CSV file is empty or contains only headers')
  }

  const headers = parseCSVLine(lines[0])

  const requiredFields = ['vehicle_id', 'vehicle_type', 'brand', 'model', 'battery_kwh', 'range_km', 'efficiency_km_per_kwh']
  const missingFields = requiredFields.filter(f => !headers.includes(f))
  if (missingFields.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingFields.join(', ')}`)
  }

  const vehicles = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length < headers.length) continue // skip malformed rows

    const row = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })

    // Validate critical fields
    if (!row.brand || !row.model || !row.vehicle_id) continue

    vehicles.push({
      vehicle_id: parseInt(row.vehicle_id, 10) || 0,
      vehicle_type: row.vehicle_type || 'Unknown',
      brand: row.brand,
      model: row.model,
      battery_kwh: parseFloat(row.battery_kwh) || 0,
      range_km: parseFloat(row.range_km) || 0,
      efficiency_km_per_kwh: parseFloat(row.efficiency_km_per_kwh) || 0,
      data_status: row.data_status || '',
    })
  }

  if (vehicles.length === 0) {
    throw new Error('No valid vehicle records found in CSV')
  }

  return vehicles
}

/**
 * Initialize vehicle data from CSV. Called once on import.
 */
function init() {
  try {
    _vehicles = parseCSV(csvData)
  } catch (err) {
    _parseError = err.message
    _vehicles = []
    console.error('Failed to parse EV vehicle CSV:', err)
  }
}

init()

// ─── Public API ─────────────────────────────────────────────

/**
 * Returns all parsed vehicles.
 * @returns {{ vehicles: Array, error: string|null }}
 */
export function getVehicles() {
  return { vehicles: _vehicles || [], error: _parseError }
}

/**
 * Returns unique brand names sorted alphabetically.
 * @returns {string[]}
 */
export function getBrands() {
  if (!_vehicles) return []
  const brands = [...new Set(_vehicles.map(v => v.brand))]
  return brands.sort((a, b) => a.localeCompare(b))
}

/**
 * Returns models belonging to a specific brand.
 * @param {string} brand
 * @returns {Array}
 */
export function getModelsByBrand(brand) {
  if (!_vehicles || !brand) return []
  return _vehicles
    .filter(v => v.brand === brand)
    .sort((a, b) => a.model.localeCompare(b.model))
}

/**
 * Returns a single vehicle by its vehicle_id.
 * @param {number} vehicleId
 * @returns {object|null}
 */
export function getVehicleById(vehicleId) {
  if (!_vehicles) return null
  return _vehicles.find(v => v.vehicle_id === vehicleId) || null
}

/**
 * Returns unique vehicle types from the dataset.
 * @returns {string[]}
 */
export function getVehicleTypes() {
  if (!_vehicles) return []
  return [...new Set(_vehicles.map(v => v.vehicle_type))].sort()
}
