// Vehicle data is now served by src/services/vehicleService.js (from CSV)

/**
 * Standard Indian Rupee (INR) currency formatter
 * Follows en-IN locale grouping (e.g. ₹100.00, ₹1,250.00, ₹12,500.00)
 */
export const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

/**
 * Average commercial public EV fast charging tariff in India (₹ per kWh)
 * Typical Indian public DC charging rates range between ₹18.00 and ₹24.00 per kWh.
 */
export const DEFAULT_CHARGING_RATE_INR_PER_KWH = 21.85

export const placeholderStations = [
  {
    id: 1,
    name: 'GreenCharge Hub - Highway 101',
    distance: '85 km',
    power: '150 kW DC',
    connector: 'CCS2',
    available: 3,
    total: 6,
    estimatedTime: '25 min',
  },
  {
    id: 2,
    name: 'ElectriFuel Station - City Center',
    distance: '165 km',
    power: '50 kW DC',
    connector: 'CCS2 / CHAdeMO',
    available: 1,
    total: 4,
    estimatedTime: '45 min',
  },
  {
    id: 3,
    name: 'VoltStop Express - Service Plaza',
    distance: '240 km',
    power: '350 kW DC',
    connector: 'CCS2',
    available: 5,
    total: 8,
    estimatedTime: '15 min',
  },
  {
    id: 4,
    name: 'ChargePoint Station - Mall Parking',
    distance: '310 km',
    power: '22 kW AC',
    connector: 'Type 2',
    available: 2,
    total: 10,
    estimatedTime: '120 min',
  },
]

export const placeholderTripSummary = {
  distance: '385 km',
  currentBattery: '85%',
  arrivalBattery: '12%',
  energyRequired: '57.2 kWh',
  chargingRequired: 'Yes — 1 stop',
  // Estimated for ~57.2 kWh at typical Indian public charging rate of ~₹21.85/kWh = ₹1,250.00
  estimatedCost: inrFormatter.format(1250),
}
