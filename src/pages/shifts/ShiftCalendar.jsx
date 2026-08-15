import { useMemo, useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS = { MON: 'Lunes', TUE: 'Martes', WED: 'Miércoles', THU: 'Jueves', FRI: 'Viernes', SAT: 'Sábado', SUN: 'Domingo' };
const DAY_TO_CODE = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const SHIFT_COLORS = [
  { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  { bg: '#e0e7ff', border: '#6366f1', text: '#312e81' },
  { bg: '#ffe4e6', border: '#ef4444', text: '#991b1b' },
  { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
  { bg: '#e0f2fe', border: '#0ea5e9', text: '#0c4a6e' },
  { bg: '#f1f5f9', border: '#64748b', text: '#1e293b' },
];

function getShiftColor(index) {
  return SHIFT_COLORS[index % SHIFT_COLORS.length];
}

function formatTimeForDisplay(timeStr) {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
}

function isOvernight(shift) {
  const [sh, sm] = shift.startTime.split(':').map(Number);
  const [eh, em] = shift.endTime.split(':').map(Number);
  return (eh * 60 + em) <= (sh * 60 + sm);
}

function isShiftActive(shift) {
  const now = new Date();
  const today = DAY_TO_CODE[now.getDay()];
  const yesterdayIdx = (now.getDay() + 6) % 7;
  const yesterday = DAY_TO_CODE[yesterdayIdx];
  if (!shift.daysOfWeek) return false;
  const days = typeof shift.daysOfWeek === 'string' ? shift.daysOfWeek.split(',').map(d => d.trim()) : shift.daysOfWeek;
  const [sh, sm] = shift.startTime.split(':').map(Number);
  const [eh, em] = shift.endTime.split(':').map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (isOvernight(shift)) {
    if (days.includes(today) && nowMin >= startMin) return true;
    if (days.includes(yesterday) && nowMin < endMin) return true;
    return false;
  }
  if (!days.includes(today)) return false;
  return nowMin >= startMin && nowMin < endMin;
}

function StaffAssignModal({ isOpen, onClose, shift, staffList, onAssign, onRemove, assignedStaff, blockDate }) {
  if (!isOpen) return null;

  const confirmRemove = (shift, staff) => {
    Swal.fire({ title: 'Remover Personal', text: `¿Quitar a ${staff.firstName} ${staff.lastName} del turno?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Remover', cancelButtonText: 'Cancelar' }).then(r => { if (r.isConfirmed) { onRemove(shift.id, staff.id); onClose(); } })
  };
  
  const dateStr = blockDate instanceof Date
    ? `${blockDate.getDate()}/${blockDate.getMonth() + 1}/${blockDate.getFullYear()}`
    : '';

  const shiftAssignments = (assignedStaff || [])
    .filter(a => a.shiftId === shift.id)
    .sort((a, b) => a.id - b.id)
  const assignedCount = shiftAssignments.length;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            Personal de {shift.name} {dateStr ? `(${dateStr})` : ''}
          </h3>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>
        <div style={{ padding: 16, maxHeight: 300, overflowY: 'auto' }}>
          {staffList.map(staff => {
            const assignmentIdx = shiftAssignments.findIndex(a => a.staffId === staff.id);
            const isAssigned = assignmentIdx >= 0;
            const isLast = isAssigned && assignedCount <= 1;
            return (
              <div key={staff.id} style={assignmentIdx === 0 ? { ...staffRowStyle, background: '#eff6ff', borderLeft: '3px solid #2563eb' } : staffRowStyle}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: assignmentIdx === 0 ? 700 : 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#000' }}>
                    {staff.firstName} {staff.lastName}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{staff.employeeCode} - {staff.department}</div>
                </div>
                {isAssigned ? (
                  <button
                     onClick={() => { if (!isLast) { confirmRemove(shift, staff); } }}
                    style={{ ...removeBtnStyle, opacity: isLast ? 0.4 : 1, cursor: isLast ? 'not-allowed' : 'pointer' }}
                    title={isLast ? 'Debe haber al menos 1 persona asignada' : 'Remover del turno'}
                    disabled={isLast}
                  >
                    <Trash2 size={15} />
                    <span>Remover</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { onAssign(shift.id, staff.id, blockDate); onClose(); }}
                    style={assignBtnStyle}
                    title="Asignar al turno"
                  >
                    <Plus size={15} />
                    <span>Asignar</span>
                  </button>
                )}
              </div>
            );
          })}
          {staffList.length === 0 && (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No hay personal disponible</div>
          )}
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalStyle = { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' };
const closeBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 };
const staffRowStyle = { display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #f1f5f9', gap: 8 };
const baseActionBtn = { display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' };
const assignBtnStyle = { ...baseActionBtn, background: '#2563eb', color: '#fff' };
const removeBtnStyle = { ...baseActionBtn, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };

export default function ShiftCalendar({ shifts = [], loading = false, staffList = [], onAssignStaff, onRemoveStaff, assignedStaff = [], weekDates = {}, weekRange, canEdit = true }) {
  const [assignModal, setAssignModal] = useState({ open: false, shift: null, date: null });
  const todayCode = DAY_TO_CODE[new Date().getDay()];

  const weekStaff = useMemo(() => {
    if (!weekRange) return assignedStaff
    return assignedStaff.filter(a => new Date(a.startDate) <= weekRange.sunday && (!a.endDate || new Date(a.endDate) >= weekRange.monday))
  }, [assignedStaff, weekRange])
  
  // Build shifts per day
  const shiftsByDay = useMemo(() => {
    const map = {};
    DAYS.forEach(d => map[d] = []);
    
    shifts.forEach((shift, idx) => {
      const days = shift.daysOfWeek 
        ? (typeof shift.daysOfWeek === 'string' 
            ? shift.daysOfWeek.split(',').map(d => d.trim()) 
            : shift.daysOfWeek)
        : [];
      
      days.forEach(day => {
        if (map[day]) {
          map[day].push({ ...shift, colorIndex: idx });
        }
      });
    });
    
    // Sort shifts within each day by start time
    DAYS.forEach(day => {
      map[day].sort((a, b) => {
        const timeA = a.startTime || '00:00';
        const timeB = b.startTime || '00:00';
        return timeA.localeCompare(timeB);
      });
    });
    
    return map;
  }, [shifts]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <svg className="spin" width="24" height="24" viewBox="0 0 24 24" style={{ marginBottom: 12, animation: 'spin 1s linear infinite' }}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeDashoffset="31.4" strokeLinecap="round" />
        </svg>
        <div>Cargando turnos...</div>
      </div>
    );
  }

  const handleShiftClick = (shift, date) => {
    if (!canEdit) return;
    setAssignModal({ open: true, shift, date });
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Turnos Semanales
        </h3>
      </div>

      <div style={{ overflowX: 'auto', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, 1fr)`, gap: 12, minWidth: 800 }}>
          {DAYS.map(day => {
            const dayShifts = shiftsByDay[day] || [];
            const isToday = day === todayCode;
            return (
              <div key={day} style={dayColumnStyle}>
                <div style={dayHeaderStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{DAY_LABELS[day]}</div>
                    {isToday && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#2563eb', padding: '2px 8px', borderRadius: 10 }}>HOY</span>}
                  </div>
                  {weekDates[day] && (
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb', marginTop: 2 }}>{weekDates[day].getDate()}</div>
                  )}
                </div>
                <div style={dayContentStyle}>
                  {dayShifts.map((shift, idx) => {
                    const color = getShiftColor(shift.colorIndex);
                    const overnight = isOvernight(shift);
                    const active = isShiftActive(shift);
                    
                    const dateObj = weekDates[day]
                    const shiftAssignments = weekStaff
                      .filter(a => a.shiftId === shift.id && (!a.endDate || new Date(a.endDate) >= (dateObj || new Date())))
                      .sort((a, b) => a.id - b.id)
                    const assignedPeople = shiftAssignments
                      .map(a => ({ staff: staffList.find(s => s.id === a.staffId), assignment: a }))
                      .filter(item => item.staff)
                    return (
                      <div
                        key={shift.id}
                        style={{
                          ...shiftBlockStyle,
                          flex: 1,
                          justifyContent: 'center',
                          background: active ? '#1e293b' : color.bg,
                          borderColor: active ? '#0f172a' : color.border,
                          color: active ? '#f8fafc' : color.text,
                          boxShadow: active ? '0 0 0 2px #2563eb, 0 4px 12px rgba(37,99,235,0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
                          cursor: canEdit ? 'pointer' : 'default',
                        }}
                        onClick={() => handleShiftClick(shift, dateObj)}
                        title={`${shift.name} (${formatTimeForDisplay(shift.startTime)} - ${formatTimeForDisplay(shift.endTime)})${active ? ' - TURNO ACTIVO' : ''}`}
                      >
                        <div style={{ fontWeight: 700, fontSize: 16, textAlign: 'center' }}>
                          {dateObj ? `${dateObj.getDate()}/${dateObj.getMonth() + 1}` : ''}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 12, textAlign: 'center', marginTop: 2 }}>
                          {shift.name}
                        </div>
                        <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <span>{formatTimeForDisplay(shift.startTime)} - {formatTimeForDisplay(shift.endTime)}</span>
                          {isOvernight(shift) && (
                            <span style={{ fontSize: 9, background: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)', padding: '1px 4px', borderRadius: 3 }}>nocturno</span>
                          )}
                        </div>
                        {active && (
                          <div style={{ marginTop: 6, textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#22c55e', textTransform: 'uppercase' }}>
                            ● Activo
                          </div>
                        )}
                        {assignedPeople.length > 0 && (
                          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {assignedPeople.map((item, i) => (
                              <div key={item.staff.id} style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.25)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span style={{ fontWeight: i === 0 ? 700 : 500 }}>{item.staff.firstName} {item.staff.lastName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {canEdit && (
        <StaffAssignModal
          isOpen={assignModal.open}
          onClose={() => setAssignModal({ open: false, shift: null, date: null })}
          shift={assignModal.shift}
          staffList={staffList}
          onAssign={onAssignStaff}
          onRemove={onRemoveStaff}
          assignedStaff={weekStaff}
          blockDate={assignModal.date}
        />
      )}
    </div>
  );
}

const dayColumnStyle = {
  background: '#fafafa',
  borderRadius: 8,
  padding: '12px',
  border: '1px solid #f1f5f9',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 400,
};

const dayHeaderStyle = {
  padding: '8px 0',
  marginBottom: '12px',
  borderBottom: '1px solid #e2e8f0',
};

const dayContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  flex: 1,
  minHeight: 0,
};

const shiftBlockStyle = {
  borderRadius: 8,
  padding: '10px 12px',
  cursor: 'pointer',
  transition: 'transform 0.1s, box-shadow 0.1s',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid',
  position: 'relative',
};