import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isViewer as checkIsViewer } from '../utils/roles'
import {
  LayoutDashboard,
  Wrench,
  Package,
  MapPin,
  Boxes,
  Users,
  UserCog,
  Calendar,
  BarChart3,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Shield,
  ShieldCheck,
  PlusCircle,
  FileText,
} from 'lucide-react'

const iconColors = {
  '/': { bg: 'rgba(99,102,241,0.15)', fg: '#818cf8' },
  '/mantenimiento': { bg: 'rgba(249,115,22,0.15)', fg: '#fb923c' },
  '/activos': { bg: 'rgba(59,130,246,0.15)', fg: '#60a5fa' },
  '/ubicaciones': { bg: 'rgba(236,72,153,0.15)', fg: '#f472b6' },
  '/inventario': { bg: 'rgba(34,197,94,0.15)', fg: '#4ade80' },
  '/residentes': { bg: 'rgba(168,85,247,0.15)', fg: '#c084fc' },
  '/personal': { bg: 'rgba(14,165,233,0.15)', fg: '#38bdf8' },
  '/turnos': { bg: 'rgba(234,179,8,0.15)', fg: '#facc15' },
  '/historia': { bg: 'rgba(239,68,68,0.15)', fg: '#f87171' },
  '/reportes': { bg: 'rgba(52,211,153,0.15)', fg: '#34d399' },
  '/admin/usuarios': { bg: 'rgba(220,38,38,0.15)', fg: '#dc2626' },
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/mantenimiento', icon: Wrench, label: 'Mantenimiento', roles: ['ADMIN'] },
  { to: '/activos', icon: Package, label: 'Activos', roles: ['ADMIN'] },
  { to: '/ubicaciones', icon: MapPin, label: 'Ubicaciones', roles: ['ADMIN'] },
  { to: '/inventario', icon: Boxes, label: 'Inventario', roles: ['ADMIN'] },
  { to: '/residentes', icon: Users, label: 'Residentes', roles: ['ADMIN', 'HR'] },
  { to: '/personal', icon: UserCog, label: 'Personal', roles: ['ADMIN'] },
  { to: '/turnos', icon: Calendar, label: 'Turnos', roles: ['ADMIN', 'HR', 'VIEWER'] },
  { to: '/historia', icon: MessageSquare, label: 'Historia', roles: ['ADMIN', 'HR'] },
  { to: '/reportes', icon: BarChart3, label: 'Reportes', roles: ['ADMIN'] },
  { to: '/admin/usuarios', icon: ShieldCheck, label: 'Roles', roles: ['ADMIN'] },
]

const dropItems = [
  { icon: PlusCircle, label: 'Nuevo Activo', to: '/activos', color: '#3b82f6' },
  { icon: FileText, label: 'Nueva Orden', to: '/mantenimiento', color: '#f97316' },
  { icon: Users, label: 'Nuevo Residente', to: '/residentes', color: '#22c55e' },
  { icon: UserCog, label: 'Nuevo Personal', to: '/personal', color: '#8b5cf6' },
  { icon: Calendar, label: 'Turnos', to: '/turnos', color: '#ec4899' },
  { icon: BarChart3, label: 'Reportes', to: '/reportes', color: '#6366f1' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const adminRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (adminRef.current && !adminRef.current.contains(e.target)) setAdminOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userRoles = user?.roles || []
  const hasRole = (roles) => !roles || roles.some(r => userRoles.includes(r))
  const visibleNavItems = navItems.filter(item => hasRole(item.roles))
  const isViewer = checkIsViewer(user)

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      <aside
        className="flex flex-col relative z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[2px_0_20px_rgba(0,0,0,0.15)]"
        style={{
          width: collapsed ? 72 : 260,
          minWidth: collapsed ? 72 : 260,
          background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a3e 50%, #16213e 100%)',
          color: '#e0e0e0',
        }}
      >
        <div className="flex items-center justify-between px-4 py-5 min-h-[72px] relative">
          <div className="flex items-center gap-2.5">
            <div               className="w-[34px] h-[34px] rounded-lg flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(99,102,241,0.4)] bg-gradient-to-br from-indigo-500 to-purple-500">
              <Shield size={18} color="#fff" />
            </div>
            {!collapsed && (
              <span className="text-white font-bold text-[17px] whitespace-nowrap tracking-[0.3px]">
                Casa Hogar
              </span>
            )}
          </div>
          {!collapsed ? (
            <button
              onClick={() => setCollapsed(true)}
              className="bg-white/5 border-none text-[#8b8fa3] cursor-pointer p-1.5 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
              title="Colapsar"
            >
              <ChevronLeft size={16} />
            </button>
          ) : (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute right-[-12px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-500 border-none text-white cursor-pointer flex items-center justify-center z-10 transition-all hover:scale-110 shadow-[0_2px_8px_rgba(99,102,241,0.5)]"
              title="Expandir"
            >
              <Menu size={11} />
            </button>
          )}
        </div>

        <div className="px-2.5 mb-2">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-1">
          {visibleNavItems.map((item) => {
            const colors = iconColors[item.to] || { bg: 'rgba(99,102,241,0.15)', fg: '#818cf8' }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 mx-2 my-0.5 rounded-lg text-[13.5px] whitespace-nowrap relative transition-all duration-200 ${
                    collapsed ? 'justify-center py-2.5' : 'justify-start py-2.5 px-3'
                  } ${
                    isActive
                      ? 'text-white font-semibold bg-indigo-500/15'
                      : 'text-[#8b8fa3] font-normal hover:bg-white/5'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
                      style={{ backgroundColor: isActive ? colors.bg : 'transparent' }}
                    >
                      <item.icon size={17} color={isActive ? colors.fg : '#8b8fa3'} />
                    </div>
                    {!collapsed && <span>{item.label}</span>}
                    {isActive && !collapsed && (
                      <div
                        className="w-1 h-1 rounded-full ml-auto shrink-0"
                        style={{ backgroundColor: colors.fg }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="px-2.5 mb-2">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="px-2.5 pb-4">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full rounded-lg cursor-pointer text-[13.5px] font-medium transition-all ${
              collapsed ? 'justify-center py-2.5' : 'justify-start py-2.5 px-3'
            } bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20`}
            title={collapsed ? 'Cerrar Sesión' : undefined}
          >
            <LogOut size={17} />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden bg-[#f0f2f5]">
        <header className="flex items-center justify-between px-7 h-[68px] bg-white border-b border-[#eef0f4] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="hidden max-md:block bg-none border-none text-gray-600 cursor-pointer p-1"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="text-[17px] font-semibold text-[#1e293b] m-0 tracking-[0.2px]">
              Sistema de Mantenimiento
            </h1>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex flex-col items-end">
              <span className="text-[13.5px] font-semibold text-[#1e293b]">
                {user?.firstName || user?.username || 'Usuario'}
              </span>
              <span className="text-[11.5px] text-[#94a3b8]">
                {user?.email || ''}
              </span>
            </div>
            <div className="relative" ref={adminRef}>
              <div
                onClick={() => { if (!isViewer) setAdminOpen(!adminOpen); }}
                className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white text-sm font-bold transition-all shadow-[0_2px_8px_rgba(99,102,241,0.3)] bg-gradient-to-br from-indigo-500 to-purple-500"
                style={{ cursor: isViewer ? 'default' : 'pointer' }}
              >
                {(user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
              </div>
              {!isViewer && adminOpen && (
                <div className="absolute top-full right-0 mt-2 w-[220px] bg-white border border-[#eef0f4] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.1)] p-1.5 z-50">
                  {dropItems.map(item => (
                    <button
                      key={item.to}
                      onClick={() => { navigate(item.to); setAdminOpen(false) }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg bg-none border-none cursor-pointer text-sm font-medium text-slate-700 text-left hover:bg-slate-50 transition-colors"
                    >
                      <item.icon size={16} color={item.color} /> {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}