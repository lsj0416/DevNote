import { NavLink, Outlet } from 'react-router-dom'
import { getStoredUser } from '../../shared/lib/auth-storage'

const appNavigation = [
  { to: '/app', label: 'Dashboard', end: true },
  { to: '/app/analysis', label: 'Analysis' },
  { to: '/app/notes', label: 'Notes' },
  { to: '/app/settings', label: 'Settings' },
]

export function AppLayout() {
  const user = getStoredUser()

  return (
    <div className="app-layout-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Protected Area</p>
          <h1 className="app-title">DevNote Workspace</h1>
        </div>
        <div className="app-header-meta">
          <p className="app-header-copy">
            Step 3에서는 OAuth 콜백 이후 사용자 prefetch까지 연결합니다.
          </p>
          {user ? (
            <div className="user-badge">
              <span className="user-name">{user.username}</span>
              <span className="user-email">{user.email}</span>
            </div>
          ) : null}
        </div>
      </header>

      <div className="app-layout-body">
        <aside className="app-sidebar">
          <nav className="app-nav" aria-label="앱 탐색">
            {appNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? 'app-nav-link active' : 'app-nav-link'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
