import { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { isViewer } from './utils/roles'
import { getAll as getShifts, assignStaff as assignStaffToShift, removeStaff as removeStaffFromShift, getAssignments } from './api/shifts'
import { getAll as getStaff } from './api/staff'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))

const WorkOrderList = lazy(() => import('./pages/work-orders/WorkOrderList'))
const WorkOrderForm = lazy(() => import('./pages/work-orders/WorkOrderForm'))
const WorkOrderDetail = lazy(() => import('./pages/work-orders/WorkOrderDetail'))

const AssetList = lazy(() => import('./pages/assets/AssetList'))
const AssetForm = lazy(() => import('./pages/assets/AssetForm'))

const LocationList = lazy(() => import('./pages/locations/LocationList'))
const LocationForm = lazy(() => import('./pages/locations/LocationForm'))
const LocationGallery = lazy(() => import('./pages/locations/LocationGallery'))
const LocationMap = lazy(() => import('./pages/locations/LocationMap'))

const ItemList = lazy(() => import('./pages/inventory/ItemList'))
const ItemForm = lazy(() => import('./pages/inventory/ItemForm'))
const MovementList = lazy(() => import('./pages/inventory/MovementList'))
const MovementForm = lazy(() => import('./pages/inventory/MovementForm'))

const ResidentList = lazy(() => import('./pages/residents/ResidentList'))
const ResidentForm = lazy(() => import('./pages/residents/ResidentForm'))
const ResidentProfile = lazy(() => import('./pages/residents/ResidentProfile'))
const ResidentHistory = lazy(() => import('./pages/residents/ResidentHistory'))

const StaffList = lazy(() => import('./pages/staff/StaffList'))
const StaffForm = lazy(() => import('./pages/staff/StaffForm'))
const StaffProfile = lazy(() => import('./pages/staff/StaffProfile'))

const ShiftList = lazy(() => import('./pages/shifts/ShiftList'))
const ShiftForm = lazy(() => import('./pages/shifts/ShiftForm'))
const ShiftCalendar = lazy(() => import('./pages/shifts/ShiftCalendar'))
const ShiftHistory = lazy(() => import('./pages/shifts/ShiftHistory'))

const ClinicalRecord = lazy(() => import('./pages/clinical/ClinicalRecord'))

const Reports = lazy(() => import('./pages/reports/Reports'))
const UserRolesAdmin = lazy(() => import('./pages/admin/UserRolesAdmin'))

function WorkOrdersPage() {
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  if (view === 'detail' && selected) {
    return <WorkOrderDetail workOrderId={selected.id} onBack={() => { setView('list'); setSelected(null); refresh() }} />
  }

  return (
    <>
      <WorkOrderList
        key={refreshKey}
        onCreate={() => { setSelected(null); setView('create') }}
        onViewDetail={(row) => { setSelected(row); setView('detail') }}
      />
      <WorkOrderForm
        isOpen={view === 'create'}
        onClose={() => setView('list')}
        workOrder={null}
        onSaved={() => { setView('list'); refresh() }}
      />
      <WorkOrderForm
        isOpen={view === 'edit' && !!selected}
        onClose={() => { setView('list'); setSelected(null) }}
        workOrder={selected}
        onSaved={() => { setView('list'); setSelected(null); refresh() }}
      />
    </>
  )
}

function AssetsPage() {
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  return (
    <>
      <AssetList
        key={refreshKey}
        onCreate={() => { setSelected(null); setView('create') }}
        onEdit={(row) => { setSelected(row); setView('edit') }}
      />
      <AssetForm
        isOpen={view === 'create'}
        onClose={() => setView('list')}
        asset={null}
        onSaved={() => { setView('list'); refresh() }}
      />
      <AssetForm
        isOpen={view === 'edit' && !!selected}
        onClose={() => { setView('list'); setSelected(null) }}
        asset={selected}
        onSaved={() => { setView('list'); setSelected(null); refresh() }}
      />
    </>
  )
}

function LocationsPage() {
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  return (
    <>
      {view === 'map' ? (
        <LocationMap onBack={() => setView('list')} />
      ) : (
        <>
          <LocationList
            key={refreshKey}
            onCreate={() => { setSelected(null); setView('create') }}
            onEdit={(row) => { setSelected(row); setView('edit') }}
            onShowMap={() => setView('map')}
          />
          <LocationForm
            isOpen={view === 'create'}
            onClose={() => setView('list')}
            location={null}
            onSaved={() => { setView('list'); refresh() }}
          />
          <LocationForm
            isOpen={view === 'edit' && !!selected}
            onClose={() => { setView('list'); setSelected(null) }}
            location={selected}
            onSaved={() => { setView('list'); setSelected(null); refresh() }}
          />
        </>
      )}
    </>
  )
}

function InventoryPage() {
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  if ((view === 'movements' || view === 'newMovement') && selected) {
    return (
      <>
        <MovementList key={refreshKey} item={selected} onBack={() => { setView('list'); setSelected(null) }} onNewMovement={() => setView('newMovement')} />
        <MovementForm
          isOpen={view === 'newMovement'}
          onClose={() => setView('movements')}
          defaultItemId={selected.id}
          onSaved={() => { refresh() }}
        />
      </>
    )
  }

  return (
    <>
      <ItemList
        key={refreshKey}
        onCreate={() => { setSelected(null); setView('create') }}
        onEdit={(row) => { setSelected(row); setView('edit') }}
        onViewMovements={(row) => { setSelected(row); setView('movements') }}
      />
      <ItemForm
        isOpen={view === 'create'}
        onClose={() => setView('list')}
        item={null}
        onSaved={() => { setView('list'); refresh() }}
      />
      <ItemForm
        isOpen={view === 'edit' && !!selected}
        onClose={() => { setView('list'); setSelected(null) }}
        item={selected}
        onSaved={() => { setView('list'); setSelected(null); refresh() }}
      />
    </>
  )
}

function ResidentsPage() {
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])
  const location = useLocation()

  useEffect(() => {
    if (location.state?.editResident) {
      setSelected(location.state.editResident)
      setView('edit')
      window.history.replaceState({}, '')
    }
  }, [])

  return (
    <>
      <ResidentList
        key={refreshKey}
        onCreate={() => { setSelected(null); setView('create') }}
        onEdit={(row) => { setSelected(row); setView('edit') }}
      />
      <ResidentForm
        isOpen={view === 'create'}
        onClose={() => setView('list')}
        resident={null}
        onSaved={() => { setView('list'); refresh() }}
      />
      <ResidentForm
        isOpen={view === 'edit' && !!selected}
        onClose={() => { setView('list'); setSelected(null) }}
        resident={selected}
        onSaved={() => { setView('list'); setSelected(null); refresh() }}
      />
    </>
  )
}

function StaffPage() {
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])
  const location = useLocation()

  useEffect(() => {
    if (location.state?.editStaff) {
      setSelected(location.state.editStaff)
      setView('edit')
      window.history.replaceState({}, '')
    }
  }, [])

  return (
    <>
      <StaffList
        key={refreshKey}
        onCreate={() => { setSelected(null); setView('create') }}
        onEdit={(row) => { setSelected(row); setView('edit') }}
      />
      <StaffForm
        isOpen={view === 'create'}
        onClose={() => setView('list')}
        staffMember={null}
        onSaved={() => { setView('list'); refresh() }}
      />
      <StaffForm
        isOpen={view === 'edit' && !!selected}
        onClose={() => { setView('list'); setSelected(null) }}
        staffMember={selected}
        onSaved={() => { setView('list'); setSelected(null); refresh() }}
      />
    </>
  )
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const SHORT_MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function getWeeksInMonth(year, month) {
  const result = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstMonday = new Date(firstDay)
  const dow = firstMonday.getDay()
  firstMonday.setDate(firstMonday.getDate() + (dow === 0 ? -6 : 1 - dow))
  let monday = new Date(firstMonday)
  let idx = 1
  while (monday <= lastDay || (monday.getMonth() === month && monday <= lastDay)) {
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    if (sunday >= firstDay && monday <= lastDay) {
      const sm = SHORT_MONTHS[monday.getMonth()]
      const em = SHORT_MONTHS[sunday.getMonth()]
      result.push({ index: idx - 1, monday: new Date(monday), sunday: new Date(sunday), label: `Sem ${idx} (${monday.getDate()} ${sm} - ${sunday.getDate()} ${em})` })
      idx++
    }
    monday.setDate(monday.getDate() + 7)
    if (monday.getMonth() > month + 1) break
  }
  return result
}

function ShiftsPage() {
  const { user } = useAuth()
  const canEdit = !isViewer(user)
  const [view, setView] = useState('calendar')
  const [selected, setSelected] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [shifts, setShifts] = useState([])
  const [staffList, setStaffList] = useState([])
  const [assignedStaff, setAssignedStaff] = useState([])
  const [loadingShifts, setLoadingShifts] = useState(true)
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)
  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  const weeks = useMemo(() => getWeeksInMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth])
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const idx = weeks.findIndex(w => w.monday <= today && w.sunday >= today)
    setSelectedWeekIndex(idx >= 0 ? idx : 0)
  }, [weeks])
  const weekDates = useMemo(() => {
    if (weeks.length === 0) return {}
    const week = weeks[Math.min(selectedWeekIndex, weeks.length - 1)]
    const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    const dates = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(week.monday)
      d.setDate(d.getDate() + i)
      dates[DAYS[i]] = d
    }
    return dates
  }, [weeks, selectedWeekIndex])
  const weekRange = useMemo(() => {
    if (weeks.length === 0) return null
    const week = weeks[Math.min(selectedWeekIndex, weeks.length - 1)]
    return { monday: week.monday, sunday: week.sunday }
  }, [weeks, selectedWeekIndex])

  useEffect(() => {
    const fetchData = async () => {
      setLoadingShifts(true)
      try {
        const [shiftsRes, staffRes, assignmentsRes] = await Promise.all([
          getShifts({ page: 0, size: 50 }),
          getStaff({ page: 0, size: 100 }),
          getAssignments()
        ])
        setShifts(shiftsRes.data.data.content || [])
        setStaffList(staffRes.data.data.content || [])
        setAssignedStaff(assignmentsRes.data.data || [])
      } catch {
        setShifts([])
        setStaffList([])
        setAssignedStaff([])
      } finally {
        setLoadingShifts(false)
      }
    }
    fetchData()
  }, [refreshKey])

  const handleAssignStaff = async (shiftId, staffId, startDate) => {
    if (!canEdit) return
    try {
      const dateStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate
      await assignStaffToShift(shiftId, staffId, dateStr)
      toast.success('Personal asignado al turno')
      refresh()
    } catch (e) {
      const msg = e.response?.data?.message || 'Error al asignar personal'
      toast.error(msg)
    }
  }

  const handleRemoveStaff = async (shiftId, staffId) => {
    if (!canEdit) return
    try {
      await removeStaffFromShift(staffId, shiftId)
      toast.success('Personal removido del turno')
      refresh()
    } catch (e) {
      const msg = e.response?.data?.message || 'Error al remover personal'
      toast.error(msg)
    }
  }

  const guardedCreate = () => { if (canEdit) { setSelected(null); setView('create') } }
  const guardedEdit = (row) => { if (canEdit) { setSelected(row); setView('edit') } }

  const viewToggle = (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
          <button
            onClick={() => setView('calendar')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: view === 'calendar' ? '#2563eb' : 'transparent',
              color: view === 'calendar' ? '#fff' : '#475569',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Calendar
          </button>
          <button
            onClick={() => setView('list')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: view === 'list' ? '#2563eb' : 'transparent',
              color: view === 'list' ? '#fff' : '#475569',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
            List
          </button>
      </div>
    </div>
  )

  const selectStyle = { padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#1e293b', background: '#fff', cursor: 'pointer', outline: 'none' }

  return (
    <>
      {viewToggle}
      {view === 'calendar' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={selectStyle}>
            {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={selectStyle}>
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select value={selectedWeekIndex} onChange={e => setSelectedWeekIndex(Number(e.target.value))} style={selectStyle}>
            {weeks.map(w => (
              <option key={w.index} value={w.index}>{w.label}</option>
            ))}
          </select>
        </div>
      )}
      {view === 'calendar' ? (
        <ShiftCalendar
          shifts={shifts}
          loading={loadingShifts}
          key={refreshKey}
          onCreate={guardedCreate}
          onEdit={guardedEdit}
          staffList={staffList}
          assignedStaff={assignedStaff}
          onAssignStaff={handleAssignStaff}
          onRemoveStaff={handleRemoveStaff}
          weekDates={weekDates}
          weekRange={weekRange}
          canEdit={canEdit}
        />
      ) : (
        <ShiftList
          key={refreshKey}
          onCreate={guardedCreate}
          onEdit={guardedEdit}
        />
      )}
      {canEdit && (
        <>
          <ShiftForm
            isOpen={view === 'create'}
            onClose={() => setView('calendar')}
            shift={null}
            onSaved={() => { setView('calendar'); refresh() }}
          />
          <ShiftForm
            isOpen={view === 'edit' && !!selected}
            onClose={() => { setView('calendar'); setSelected(null) }}
            shift={selected}
            onSaved={() => { setView('calendar'); setSelected(null); refresh() }}
          />
        </>
      )}
    </>
  )
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="mantenimiento" element={<WorkOrdersPage />} />
            <Route path="activos" element={<AssetsPage />} />
            <Route path="ubicaciones" element={<LocationsPage />} />
            <Route path="ubicaciones/galeria" element={<LocationGallery />} />
            <Route path="inventario" element={<InventoryPage />} />
            <Route path="residentes/:id" element={<ResidentProfile />} />
            <Route path="residentes/:id/historial" element={<ResidentHistory />} />
            <Route path="residentes" element={<ResidentsPage />} />
            <Route path="personal" element={<StaffPage />} />
            <Route path="personal/:id" element={<StaffProfile />} />
            <Route path="turnos" element={<ShiftsPage />} />
            <Route path="historia" element={<ShiftHistory />} />
            <Route path="fichas-clinicas" element={<ClinicalRecord />} />
            <Route path="fichas-clinicas/:residentId" element={<ClinicalRecord />} />
            <Route path="reportes" element={<Reports />} />
            <Route path="admin/usuarios" element={<UserRolesAdmin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
