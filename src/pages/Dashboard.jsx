import { useState, useEffect } from 'react';
import { getDashboard } from '../api/reports';
import * as shiftsApi from '../api/shifts';
import * as shiftLogsApi from '../api/shiftLogs';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isViewer as checkIsViewer } from '../utils/roles';
import {
  Users, UserCog, Clock, CheckCircle, Sun, Moon, MessageSquare,
  ChevronRight, User
} from 'lucide-react';

const dayMap = { 0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT' };
const dayNames = { SUN: 'Domingo', MON: 'Lunes', TUE: 'Martes', WED: 'Miercoles', THU: 'Jueves', FRI: 'Viernes', SAT: 'Sabado' };

function getSantiagoNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
}

function isNightShift(time) {
  return time >= 20 || time < 8;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isViewer = checkIsViewer(user);
  const [dashData, setDashData] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [dashRes, shiftsRes, assignRes, logsRes] = await Promise.all([
        getDashboard(),
        shiftsApi.getAll(),
        shiftsApi.getAssignments(),
        shiftLogsApi.getAll()
      ]);
      setDashData(dashRes.data?.data || dashRes.data);
      const shiftsData = shiftsRes.data?.data;
      setShifts(Array.isArray(shiftsData) ? shiftsData : shiftsData?.content || []);
      setAssignments(Array.isArray(assignRes.data?.data) ? assignRes.data.data : []);
      setLogs(Array.isArray(logsRes.data?.data) ? logsRes.data.data : []);
    } catch {
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const now = getSantiagoNow();
  const todayCode = dayMap[now.getDay()];
  const todayName = dayNames[todayCode] || todayCode;
  const currentHour = now.getHours();
  const isNight = isNightShift(currentHour);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const getDayCode = (date) => dayMap[date.getDay()];
  const prevDate = new Date(now);
  prevDate.setDate(prevDate.getDate() - 1);
  const yesterdayCode = getDayCode(prevDate);
  const yesterdayStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;

  const todayShifts = shifts.filter(s =>
    s.isActive && s.daysOfWeek && s.daysOfWeek.split(',').map(d => d.trim()).includes(todayCode)
  );

  const currentShift = todayShifts.find(s => {
    const start = parseInt(s.startTime?.split(':')[0], 10);
    const end = parseInt(s.endTime?.split(':')[0], 10);
    if (start < end) return currentHour >= start && currentHour < end;
    return currentHour >= start || currentHour < end;
  });

  let previousShift = null;
  let previousShiftDate = todayStr;
  if (currentShift) {
    const isCurrentNocturno = currentShift.name?.toLowerCase().includes('nocturno');
    if (isCurrentNocturno) {
      previousShift = todayShifts.find(s => s.id !== currentShift.id);
    } else {
      const yesterdayShifts = shifts.filter(s =>
        s.isActive && s.daysOfWeek && s.daysOfWeek.split(',').map(d => d.trim()).includes(yesterdayCode)
      );
      previousShift = yesterdayShifts.find(s => s.name?.toLowerCase().includes('nocturno'));
      previousShiftDate = yesterdayStr;
    }
  } else {
    if (!isNight) {
      const yesterdayShifts = shifts.filter(s =>
        s.isActive && s.daysOfWeek && s.daysOfWeek.split(',').map(d => d.trim()).includes(yesterdayCode)
      );
      previousShift = yesterdayShifts.find(s => s.name?.toLowerCase().includes('nocturno'));
      previousShiftDate = yesterdayStr;
    }
  }

  const currentLogs = currentShift
    ? logs.filter(l => l.shiftId === currentShift.id && l.logDate === todayStr)
    : [];

  const previousLogs = previousShift
    ? logs.filter(l => l.shiftId === previousShift.id && l.logDate === previousShiftDate)
    : [];

  const getShiftIcon = (name) => {
    if (!name) return Clock;
    const lower = name.toLowerCase();
    if (lower.includes('nocturno') || lower.includes('noche')) return Moon;
    return Sun;
  };

  const getShiftColor = (name) => {
    if (!name) return { color: '#6366f1', bg: 'rgba(99,102,241,0.1)' };
    const lower = name.toLowerCase();
    if (lower.includes('nocturno') || lower.includes('noche')) return { color: '#6366f1', bg: 'rgba(99,102,241,0.1)' };
    return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  };

  const statCards = [
    { label: 'Residentes', value: dashData?.residentCount ?? dashData?.totalResidents ?? dashData?.residents ?? 0, icon: Users, color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)' },
    { label: 'Personal', value: dashData?.staffCount ?? dashData?.totalStaff ?? dashData?.staff ?? 0, icon: UserCog, color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)' },
    { label: 'Ordenes Pendientes', value: dashData?.pendingOrders ?? dashData?.pendingWorkOrders ?? 0, icon: Clock, color: '#f97316', bgColor: 'rgba(249,115,22,0.1)' },
    { label: 'Ordenes Completadas', value: dashData?.completedOrders ?? dashData?.completedWorkOrders ?? 0, icon: CheckCircle, color: '#22c55e', bgColor: 'rgba(34,197,94,0.1)' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-[50vh] text-gray-500 text-base">Cargando dashboard...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="m-0 text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="mt-1 m-0 text-sm text-gray-500">
          {todayName} {now.getDate()} de {now.toLocaleString('es-CL', { month: 'long', timeZone: 'America/Santiago' })} &middot; {String(currentHour).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')} hrs
        </p>
      </div>

      <div className="grid gap-4 mb-8 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-[18px] flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: card.bgColor }}>
              <card.icon size={22} color={card.color} />
            </div>
            <div>
              <p className="m-0 text-xs text-gray-500 font-medium">{card.label}</p>
              <p className="mt-0.5 m-0 text-2xl font-bold text-gray-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-8">
        {currentShift && (() => {
          const Icon = getShiftIcon(currentShift.name);
          const colors = getShiftColor(currentShift.name);
          const staffForShift = assignments.filter(a => a.shiftId === currentShift.id && a.isActive);
          return (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon size={18} color={colors.color} />
                <h3 className="m-0 text-base font-bold text-slate-800">Turno Actual</h3>
              </div>
              <div className="flex items-center justify-between mb-2.5 px-3 py-2 rounded-lg" style={{ background: colors.bg }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: colors.bg }}>
                    <Icon size={14} color={colors.color} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{currentShift.name}</div>
                    <div className="text-[11px] text-slate-400">{currentShift.startTime} - {currentShift.endTime}</div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white" style={{ background: colors.color }}>ACTIVO</span>
              </div>
              {staffForShift.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {staffForShift.map(a => (
                    <div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-xs text-slate-600">
                      <User size={12} />
                      {a.staffName || `Staff #${a.staffId}`}
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-slate-100 pt-2.5 mt-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare size={14} color="#6366f1" />
                  <span className="text-xs font-semibold text-slate-500">Registros</span>
                </div>
                {currentLogs.length === 0 ? (
                  <p className="text-slate-400 text-sm m-0">Sin registros aún.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                    {currentLogs.map(log => (
                      <div key={log.id} className="px-2.5 py-2 rounded-lg border border-slate-100 bg-white">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-[22px] h-[22px] rounded-full bg-indigo-100 flex items-center justify-center">
                            <User size={11} color="#6366f1" />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-600">{log.staffName || `Staff #${log.staffId}`}</span>
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' }) : ''}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: log.comment }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {previousShift && (() => {
          const Icon = getShiftIcon(previousShift.name);
          const colors = getShiftColor(previousShift.name);
          const staffForShift = assignments.filter(a => a.shiftId === previousShift.id && a.isActive);
          return (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon size={18} color={colors.color} />
                <h3 className="m-0 text-base font-bold text-slate-800">Turno Anterior</h3>
              </div>
              <div className="flex items-center justify-between mb-2.5 px-3 py-2 rounded-lg" style={{ background: colors.bg }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: colors.bg }}>
                    <Icon size={14} color={colors.color} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{previousShift.name}</div>
                    <div className="text-[11px] text-slate-400">{previousShift.startTime} - {previousShift.endTime}</div>
                  </div>
                </div>
              </div>
              {staffForShift.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {staffForShift.map(a => (
                    <div key={a.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-xs text-slate-600">
                      <User size={12} />
                      {a.staffName || `Staff #${a.staffId}`}
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-slate-100 pt-2.5 mt-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare size={14} color="#8b5cf6" />
                  <span className="text-xs font-semibold text-slate-500">Registros</span>
                </div>
                {previousLogs.length === 0 ? (
                  <p className="text-slate-400 text-sm m-0">Sin registros aún.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                    {previousLogs.map(log => (
                      <div key={log.id} className="px-2.5 py-2 rounded-lg border border-slate-100 bg-white">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-[22px] h-[22px] rounded-full bg-indigo-100 flex items-center justify-center">
                            <User size={11} color="#6366f1" />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-600">{log.staffName || `Staff #${log.staffId}`}</span>
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' }) : ''}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: log.comment }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {!isViewer && (
        <div className="text-right">
          <button onClick={() => navigate('/historia')} className="inline-flex items-center gap-1 bg-none border-none text-indigo-500 font-semibold text-sm cursor-pointer hover:underline">
            Ver historial completo <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
