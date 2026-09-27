import { useState, useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import VehicleSelector from './components/VehicleSelector'
import LocationInputs from './components/LocationInputs'
import BatterySettings from './components/BatterySettings'
import TripSummary from './components/TripSummary'
import InteractiveMap from './components/InteractiveMap'
import ChargingStationList from './components/ChargingStationList'
import { planTripRoute } from './services/routingService'
import { calculateBatteryAndRange } from './services/batteryCalculationService'
import { searchStationsAlongRoute } from './services/chargingStationService'
import './App.css'

function Dashboard() {
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [startLocation, setStartLocation] = useState('')
  const [destination, setDestination] = useState('')
  const [currentBattery, setCurrentBattery] = useState(80)
  const [reserveBattery, setReserveBattery] = useState(20)
  const [searchAtBattery, setSearchAtBattery] = useState(25)
  const [tripPlanned, setTripPlanned] = useState(false)

  // Route calculation and battery analysis state
  const [isRouting, setIsRouting] = useState(false)
  const [routeData, setRouteData] = useState(null)
  const [batteryAnalysis, setBatteryAnalysis] = useState(null)
  const [routeError, setRouteError] = useState(null)

  // Real charging stations state (Open Charge Map API)
  const [chargingStations, setChargingStations] = useState([])
  const [isStationsLoading, setIsStationsLoading] = useState(false)
  const [stationsError, setStationsError] = useState(null)

  // Recalculate battery & range dynamically if user adjusts battery sliders after trip is planned
  useEffect(() => {
    if (tripPlanned && routeData?.distanceKm && selectedVehicle) {
      const analysis = calculateBatteryAndRange({
        vehicle: selectedVehicle,
        currentBattery,
        reserveBattery,
        searchAtBattery,
        distanceKm: routeData.distanceKm,
      })
      setBatteryAnalysis(analysis)
    }
  }, [currentBattery, reserveBattery, searchAtBattery, selectedVehicle, tripPlanned, routeData])

  const handlePlanTrip = async () => {
    if (!selectedVehicle) {
      setRouteError('Please select an EV Brand and Model from the catalog first.')
      return
    }
    if (!startLocation || !startLocation.trim()) {
      setRouteError('Please enter a Starting Point (e.g. Bangalore, Mumbai, Delhi).')
      return
    }
    if (!destination || !destination.trim()) {
      setRouteError('Please enter a Destination (e.g. Mysore, Pune, Jaipur).')
      return
    }

    setRouteError(null)
    setStationsError(null)
    setChargingStations([])
    setIsRouting(true)

    try {
      // 1. Calculate road route and distance
      const result = await planTripRoute(startLocation, destination)
      setRouteData(result)

      // 2. Calculate EV battery & range based on real road distance and CSV specs
      const analysis = calculateBatteryAndRange({
        vehicle: selectedVehicle,
        currentBattery,
        reserveBattery,
        searchAtBattery,
        distanceKm: result.distanceKm,
      })
      setBatteryAnalysis(analysis)
      setTripPlanned(true)
      setIsRouting(false)

      // 3. Search for real charging stations along the route corridor (Open Charge Map)
      setIsStationsLoading(true)
      try {
        const stations = await searchStationsAlongRoute(result.coordinates, result.distanceKm, 25)
        setChargingStations(stations)
      } catch (stationErr) {
        console.warn('Charging stations query error:', stationErr.message)
        setStationsError(stationErr.message || 'Could not load charging stations from Open Charge Map.')
      } finally {
        setIsStationsLoading(false)
      }
    } catch (err) {
      console.error('Failed to calculate route:', err)
      setRouteError(err.message || 'Could not find a driving route between these locations. Please check names and try again.')
      setIsRouting(false)
    }
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <div className="planning-section">
          <div className="controls-panel">
            <VehicleSelector
              selectedBrand={selectedBrand}
              setSelectedBrand={setSelectedBrand}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              onVehicleSelect={setSelectedVehicle}
            />
            <LocationInputs
              startLocation={startLocation}
              setStartLocation={setStartLocation}
              destination={destination}
              setDestination={setDestination}
            />
            <BatterySettings
              currentBattery={currentBattery}
              setCurrentBattery={setCurrentBattery}
              reserveBattery={reserveBattery}
              setReserveBattery={setReserveBattery}
              searchAtBattery={searchAtBattery}
              setSearchAtBattery={setSearchAtBattery}
            />

            {routeError && (
              <div className="route-error-banner">
                <span className="error-icon">⚠️</span>
                <span>{routeError}</span>
              </div>
            )}

            <button
              className="plan-trip-btn"
              onClick={handlePlanTrip}
              disabled={isRouting}
            >
              {isRouting ? '🔄 CALCULATING ROUTE...' : '⚡ PLAN TRIP'}
            </button>
          </div>

          <div className="map-panel">
            <InteractiveMap
              route={routeData}
              isLoading={isRouting}
              chargingStations={chargingStations}
            />
          </div>
        </div>

        {tripPlanned && (
          <div className="results-section">
            <TripSummary tripData={routeData} batteryAnalysis={batteryAnalysis} />
            <ChargingStationList
              stations={chargingStations}
              isLoading={isStationsLoading}
              error={stationsError}
              corridorRadiusKm={25}
            />
          </div>
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default App
