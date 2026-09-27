import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './Header.css'

function Header() {
  const { user, logout } = useAuth()
  const [imageError, setImageError] = useState(false)

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'EV Driver'

  const userEmail = user?.email || ''
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  const userInitial = (userName[0] || 'U').toUpperCase()

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="header-logo">⚡</span>
          <h1 className="header-title">EV Route & Charging Planner</h1>
        </div>

        <div className="header-actions">
          <div className="user-profile">
            {avatarUrl && !imageError ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="user-avatar-image"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="user-avatar-fallback">{userInitial}</div>
            )}
            <div className="user-info">
              <span className="user-name">{userName}</span>
              {userEmail && <span className="user-email">{userEmail}</span>}
            </div>
          </div>

          <button className="logout-btn" onClick={logout} title="Sign out of account">
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
