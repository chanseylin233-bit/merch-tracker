import { NavLink, useLocation } from 'react-router-dom'
import './TabBar.css'

const tabs = [
  { path: '/', icon: '🏠', label: '首页' },
  { path: '/records', icon: '📋', label: '记录' },
  { path: '/add', icon: '＋', label: '新增', isAdd: true },
  { path: '/stats', icon: '📊', label: '统计' },
  { path: '/settings', icon: '⚙️', label: '设置' },
]

export function TabBar() {
  const { pathname } = useLocation()
  return (
    <nav className="tab-bar">
      {tabs.map(t => (
        <NavLink
          key={t.path}
          to={t.path}
          className={`tab-bar__item ${t.isAdd ? 'tab-bar__item--add' : ''} ${pathname === t.path ? 'active' : ''}`}
        >
          <span className="tab-bar__icon">{t.icon}</span>
          {!t.isAdd && <span className="tab-bar__label">{t.label}</span>}
        </NavLink>
      ))}
    </nav>
  )
}
