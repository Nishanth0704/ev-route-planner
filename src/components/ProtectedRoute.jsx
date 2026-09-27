import { useAuth } from '../context/AuthContext'
import LoginPage from './LoginPage'
import './ProtectedRoute.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="loading-card">
          <div className="loading-icon-container">
            <span className="loading-bolt">⚡</span>
            <div className="loading-spinner"></div>
          </div>
          <h2 className="loading-title">EV Route & Charging Planner</h2>
          <p className="loading-subtitle">Verifying authentication session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return children
}

export default ProtectedRoute
