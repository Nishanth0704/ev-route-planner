import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

function LoginPage() {
  const { loginWithGoogle, demoLogin, isConfigured, authError } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState(null)

  const handleGoogleLogin = async () => {
    setLocalError(null)

    if (!isConfigured) {
      setLocalError(
        'Supabase credentials not yet configured in .env. You can use "Quick Test Login" below for testing, or set up VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      )
      return
    }

    try {
      setSubmitting(true)
      await loginWithGoogle()
    } catch (err) {
      setLocalError(err.message || 'Failed to initiate Google sign in')
      setSubmitting(false)
    }
  }

  const displayedError = localError || authError

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">⚡</div>
          <h1 className="login-title">EV Route & Charging Planner</h1>
          <p className="login-subtitle">Plan your EV journey intelligently.</p>
        </div>

        <div className="login-features">
          <div className="feature-item">
            <span className="feature-icon">🚗</span>
            <span>Accurate EV catalog & consumption metrics</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🗺️</span>
            <span>Interactive road routing & distance calculation</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔋</span>
            <span>Real-time battery reserve & arrival estimation</span>
          </div>
        </div>

        {!isConfigured && (
          <div className="config-warning-banner">
            <div className="warning-icon">⚙️</div>
            <div className="warning-text">
              <strong>Supabase Setup Notice</strong>
              <p>
                To enable live Google OAuth, add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code>. You can also use <strong>Quick Test Login</strong> below to test the full flow right now.
              </p>
            </div>
          </div>
        )}

        {displayedError && (
          <div className="login-error-banner">
            <span className="error-icon">⚠️</span>
            <span>{displayedError}</span>
          </div>
        )}

        <div className="login-buttons-group">
          <button
            className="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={submitting}
          >
            {submitting ? (
              <div className="btn-spinner"></div>
            ) : (
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>{submitting ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <button
            className="demo-login-btn"
            onClick={demoLogin}
            type="button"
          >
            ⚡ Quick Test Login (Development Mode)
          </button>
        </div>

        <p className="login-security-note">
          🔒 Secure authentication powered by Supabase Auth with Google OAuth
        </p>
      </div>
    </div>
  )
}

export default LoginPage
