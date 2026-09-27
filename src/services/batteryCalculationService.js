import { inrFormatter, DEFAULT_CHARGING_RATE_INR_PER_KWH } from '../data/placeholderData.js'

/**
 * Calculates EV battery energy, consumption, destination state of charge,
 * and charging requirement based on vehicle CSV specifications, user battery
 * parameters, and actual route road distance.
 *
 * @param {Object} params
 * @param {Object} params.vehicle - Vehicle object from CSV (battery_kwh, efficiency_km_per_kwh, range_km, brand, model)
 * @param {number|string} params.currentBattery - User current battery percentage (0-100)
 * @param {number|string} params.reserveBattery - User target reserve percentage (0-100)
 * @param {number|string} params.searchAtBattery - User charging search threshold percentage (0-100)
 * @param {number} params.distanceKm - Actual driving distance in km from routing service
 */
export function calculateBatteryAndRange({
  vehicle,
  currentBattery = 85,
  reserveBattery = 10,
  searchAtBattery = 20,
  distanceKm = 0,
}) {
  if (!vehicle) {
    return null
  }

  const batteryKwh = Number(vehicle.battery_kwh) || 0
  const ratedRangeKm = Number(vehicle.range_km) || 0
  const efficiencyKmPerKwh = Number(vehicle.efficiency_km_per_kwh) || (batteryKwh > 0 ? ratedRangeKm / batteryKwh : 10)

  const currentPct = Math.min(100, Math.max(0, Number(currentBattery) || 0))
  const reservePct = Math.min(100, Math.max(0, Number(reserveBattery) || 0))
  const searchAtPct = Math.min(100, Math.max(0, Number(searchAtBattery) || 0))
  const distKm = Math.max(0, Number(distanceKm) || 0)

  // 1. Available Energy in kWh: (Current Battery % / 100) * total battery capacity
  const availableEnergyKwh = (currentPct / 100) * batteryKwh

  // 2. Estimated Remaining Range in km: available energy * efficiency
  const estimatedRangeKm = Math.round(availableEnergyKwh * efficiencyKmPerKwh)

  // 3. Energy Required for the planned route in kWh: distance / efficiency
  const energyRequiredKwh = efficiencyKmPerKwh > 0 ? distKm / efficiencyKmPerKwh : 0

  // 4. Remaining Energy at destination in kWh
  const destinationEnergyKwh = availableEnergyKwh - energyRequiredKwh

  // 5. Estimated Battery Percentage at Destination: (remaining energy / total capacity) * 100
  const rawDestBatteryPct = batteryKwh > 0 ? (destinationEnergyKwh / batteryKwh) * 100 : 0
  const destinationBatteryPercent = Math.round(rawDestBatteryPct)

  // 6. Reserve target energy in kWh
  const reserveTargetEnergyKwh = (reservePct / 100) * batteryKwh

  // 7. Whether the vehicle can complete the trip while maintaining the reserve %
  const canCompleteTrip = destinationBatteryPercent >= reservePct

  // 8. If below reserve, calculate how much energy must be added to reach reserve
  let energyDeficitKwh = 0
  let batteryDeficitPercent = 0
  let chargingStatus = 'No Charging Required'
  let chargingStatusType = 'success' // 'success' | 'warning' | 'danger'
  let statusDetail = ''
  let estimatedCostInr = inrFormatter.format(0)

  if (canCompleteTrip) {
    chargingStatus = 'No Charging Required'
    chargingStatusType = 'success'
    statusDetail = `Vehicle can complete the trip with ${destinationBatteryPercent}% remaining at destination, safely above your ${reservePct}% reserve target.`
  } else {
    chargingStatus = 'Charging Required'
    batteryDeficitPercent = Math.max(0, reservePct - destinationBatteryPercent)
    energyDeficitKwh = batteryKwh > 0 ? (batteryDeficitPercent / 100) * batteryKwh : 0

    const costNum = Math.round(energyDeficitKwh * DEFAULT_CHARGING_RATE_INR_PER_KWH)
    estimatedCostInr = inrFormatter.format(costNum)

    if (destinationBatteryPercent <= 0) {
      chargingStatusType = 'danger'
      const depletionKm = Math.round(availableEnergyKwh * efficiencyKmPerKwh)
      statusDetail = `Battery will deplete after ~${depletionKm} km (before reaching destination). You must add at least ${energyDeficitKwh.toFixed(1)} kWh (+${Math.ceil(batteryDeficitPercent)}%) along the route to reach destination with ${reservePct}% reserve.`
    } else {
      chargingStatusType = 'warning'
      statusDetail = `Destination battery (${destinationBatteryPercent}%) falls below your ${reservePct}% reserve target. Add ~${energyDeficitKwh.toFixed(1)} kWh (+${Math.ceil(batteryDeficitPercent)}%) along the route to maintain reserve.`
    }
  }

  return {
    vehicle: {
      brand: vehicle.brand,
      model: vehicle.model,
      batteryKwh: batteryKwh.toFixed(1),
      efficiencyKmPerKwh: efficiencyKmPerKwh.toFixed(2),
      ratedRangeKm,
      vehicleType: vehicle.vehicle_type,
    },
    currentBatteryPercent: currentPct,
    availableEnergyKwh: Number(availableEnergyKwh.toFixed(1)),
    estimatedRangeKm,
    tripDistanceKm: distKm,
    energyRequiredKwh: Number(energyRequiredKwh.toFixed(1)),
    destinationEnergyKwh: Number(destinationEnergyKwh.toFixed(1)),
    destinationBatteryPercent,
    reserveTargetPercent: reservePct,
    searchAtPercent: searchAtPct,
    canCompleteTrip,
    chargingStatus,
    chargingStatusType,
    statusDetail,
    energyDeficitKwh: Number(energyDeficitKwh.toFixed(1)),
    batteryDeficitPercent: Math.ceil(batteryDeficitPercent),
    estimatedCostInr,
  }
}
