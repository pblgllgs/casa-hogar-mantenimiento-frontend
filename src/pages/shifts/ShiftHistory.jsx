import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Clock, User, Send, Trash2, UserCheck, Edit, X, Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Undo, Redo, Heading1, Heading2, Strikethrough, Quote, Code, AlignLeft, AlignCenter, AlignRight, RemoveFormatting } from 'lucide-react';
import { getAll as getShifts } from '../../api/shifts';
import { getAll as getStaff } from '../../api/staff';
import { getAssignments } from '../../api/shifts';
import { getAll as getLogs, create as createLog, update as updateLog, remove as deleteLog } from '../../api/shiftLogs';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const DAY_LABELS = { MON: 'Lunes', TUE: 'Martes', WED: 'Miércoles', THU: 'Jueves', FRI: 'Viernes', SAT: 'Sábado', SUN: 'Domingo' };
const DAY_MAP = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 0 };

export default function ShiftHistory() {
  const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  const getChileNow = () => {
    const fmt = new Intl.DateTimeFormat('en', { timeZone: 'America/Santiago', year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false });
    const parts = fmt.formatToParts(new Date());
    const get = (t) => parts.find(p => p.type === t)?.value || '';
    const year = parseInt(get('year'));
    const month = parseInt(get('month'));
    const day = parseInt(get('day'));
    const weekdayShort = get('weekday');
    const hour = parseInt(get('hour'));
    const minute = parseInt(get('minute'));
    const dayMap = { Sun: 'SUN', Mon: 'MON', Tue: 'TUE', Wed: 'WED', Thu: 'THU', Fri: 'FRI', Sat: 'SAT' };
    const today = new Date(year, month - 1, day);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const formatLabel = (d) => {
      const dd = d.getDate();
      const mm = MONTHS_ES[d.getMonth()];
      const yy = d.getFullYear();
      return `${dd} ${mm} ${yy}`;
    };
    const todayLabel = formatLabel(today);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayLabel = formatLabel(yesterday);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowLabel = formatLabel(tomorrow);
    return { todayStr, todayLabel, yesterdayLabel, tomorrowLabel, dayKey: dayMap[weekdayShort] || '', hour, minute };
  };

  const chileNow = getChileNow();
const [selectedDate, setSelectedDate] = useState(chileNow.todayStr);
  const [shifts, setShifts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formShift, setFormShift] = useState('');
  const [formStaff, setFormStaff] = useState('');
  const [formComment, setFormComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [commentHasText, setCommentHasText] = useState(false);
  const [activeFormats, setActiveFormats] = useState({});
  const editorRef = useRef(null);
  const commentRef = useRef('');

  const execCmd = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    if (editorRef.current) {
      commentRef.current = editorRef.current.innerHTML;
      setCommentHasText(commentRef.current.trim().length > 0);
    }
    syncActiveFormats();
  };

  const syncActiveFormats = () => {
    const cmds = ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'];
    const next = {};
    cmds.forEach(c => { try { next[c] = document.queryCommandState(c); } catch { next[c] = false; } });
    try { next.block = (document.queryCommandValue('formatBlock') || '').toLowerCase(); } catch { next.block = ''; }
    setActiveFormats(next);
  };

  const handleEditorKeydown = (e) => {
    if ((e.ctrlKey || e.metaKey)) {
      const key = e.key.toLowerCase();
      const map = { b: 'bold', i: 'italic', u: 'underline' };
      if (map[key]) { e.preventDefault(); execCmd(map[key]); }
      else if (key === 'z' && !e.shiftKey) { e.preventDefault(); execCmd('undo'); }
      else if ((key === 'z' && e.shiftKey) || key === 'y') { e.preventDefault(); execCmd('redo'); }
    }
  };

  const insertLink = () => {
    const url = window.prompt('URL del enlace:');
    if (url) execCmd('createLink', url);
  };

  const autoSelectCurrentShift = useCallback((allShifts, allAssignments, allStaff) => {
    const now = new Date();
    const chileParts = Intl.DateTimeFormat('en', { timeZone: 'America/Santiago', hour: 'numeric', minute: 'numeric', hour12: false, weekday: 'short' }).formatToParts(now);
    const dayMap = { Sun: 'SUN', Mon: 'MON', Tue: 'TUE', Wed: 'WED', Thu: 'THU', Fri: 'FRI', Sat: 'SAT' };
    let dayKey = '', hour = 0, minute = 0;
    chileParts.forEach(p => { if (p.type === 'weekday') dayKey = dayMap[p.value] || ''; if (p.type === 'hour') hour = parseInt(p.value); if (p.type === 'minute') minute = parseInt(p.value); });
    const currentMinutes = hour * 60 + minute;
    const activeShift = allShifts.find(s => {
      if (!s.daysOfWeek) return false;
      const days = s.daysOfWeek.split(',').map(d => d.trim());
      if (!days.includes(dayKey)) return false;
      if (!s.startTime || !s.endTime) return false;
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      if (endMin <= startMin) {
        return currentMinutes >= startMin || currentMinutes < endMin;
      }
      return currentMinutes >= startMin && currentMinutes < endMin;
    });
    if (activeShift) {
      setFormShift(String(activeShift.id));
      const assigned = allAssignments
        .filter(a => a.shiftId === activeShift.id && a.isActive)
        .sort((a, b) => a.id - b.id);
      if (assigned.length > 0) {
        setFormStaff(String(assigned[0].staffId));
      }
      return;
    }
    const firstActive = allShifts.find(s => s.isActive);
    if (firstActive) {
      setFormShift(String(firstActive.id));
      const assigned = allAssignments
        .filter(a => a.shiftId === firstActive.id && a.isActive)
        .sort((a, b) => a.id - b.id);
      if (assigned.length > 0) {
        setFormStaff(String(assigned[0].staffId));
      }
    }
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [shiftsRes, staffRes, assignRes, logsRes] = await Promise.all([
        getShifts({ page: 0, size: 50 }),
        getStaff({ page: 0, size: 100 }),
        getAssignments(),
        getLogs()
      ]);
      const shiftsData = shiftsRes.data.data.content || [];
      const staffData = staffRes.data.data.content || [];
      const assignData = assignRes.data.data || [];
      setShifts(shiftsData);
      setStaffList(staffData);
      setAssignments(assignData);
      setLogs(logsRes.data.data || []);
      autoSelectCurrentShift(shiftsData, assignData, staffData);
    } catch {
      setShifts([]); setStaffList([]); setAssignments([]); setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const dateObj = new Date(selectedDate + 'T12:00:00');
  const dayOfWeek = dateObj.getDay();
  const dayKey = Object.entries(DAY_MAP).find(([, v]) => v === dayOfWeek)?.[0];

  const DAY_ORDER = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const shiftOffsetDayKey = (baseKey, offset) => {
    const i = DAY_ORDER.indexOf(baseKey);
    return DAY_ORDER[((i + offset) % 7 + 7) % 7];
  };
  const findShift = (dayKeyToFind, isNocturno) => shifts.find(s => {
    if (!s.daysOfWeek || !s.startTime) return false;
    const days = s.daysOfWeek.split(',').map(d => d.trim());
    if (!days.includes(dayKeyToFind)) return false;
    const [sh] = s.startTime.split(':').map(Number);
    return isNocturno ? sh >= 20 : sh < 12;
  });
  const findAllShiftsForDay = (dayKeyToFind) => shifts.filter(s => {
    if (!s.daysOfWeek) return false;
    const days = s.daysOfWeek.split(',').map(d => d.trim());
    return days.includes(dayKeyToFind);
  });

  const isToday = selectedDate === chileNow.todayStr;
  const currentDayKey = chileNow.dayKey;
  const hourNow = chileNow.hour;
  let prevShift, currShift, nextShift;
  let dayShifts;
  const shiftDateLabel = {};
  const selDateObj = new Date(selectedDate + 'T12:00:00');
  const selDateLabel = `${selDateObj.getDate()} ${MONTHS_ES[selDateObj.getMonth()]} ${selDateObj.getFullYear()}`;
  if (!isToday) {
    dayShifts = findAllShiftsForDay(dayKey);
    currShift = null;
    prevShift = null;
    nextShift = null;
    dayShifts.forEach(s => { shiftDateLabel[s.id] = selDateLabel; });
  } else {
    if (hourNow >= 8 && hourNow < 20) {
      currShift = findShift(currentDayKey, false);
      prevShift = findShift(shiftOffsetDayKey(currentDayKey, -1), true);
      nextShift = findShift(currentDayKey, true);
      if (prevShift) shiftDateLabel[prevShift.id] = chileNow.yesterdayLabel;
      if (currShift) shiftDateLabel[currShift.id] = chileNow.todayLabel;
      if (nextShift) shiftDateLabel[nextShift.id] = chileNow.todayLabel;
    } else if (hourNow >= 20) {
      currShift = findShift(currentDayKey, true);
      prevShift = findShift(currentDayKey, false);
      nextShift = findShift(shiftOffsetDayKey(currentDayKey, 1), false);
      if (prevShift) shiftDateLabel[prevShift.id] = chileNow.todayLabel;
      if (currShift) shiftDateLabel[currShift.id] = chileNow.todayLabel;
      if (nextShift) shiftDateLabel[nextShift.id] = chileNow.tomorrowLabel;
    } else {
      currShift = findShift(shiftOffsetDayKey(currentDayKey, -1), true);
      prevShift = findShift(shiftOffsetDayKey(currentDayKey, -1), false);
      nextShift = findShift(currentDayKey, false);
      if (prevShift) shiftDateLabel[prevShift.id] = chileNow.yesterdayLabel;
      if (currShift) shiftDateLabel[currShift.id] = chileNow.yesterdayLabel;
      if (nextShift) shiftDateLabel[nextShift.id] = chileNow.todayLabel;
    }
    dayShifts = [prevShift, currShift, nextShift].filter(Boolean);
  }

  const assignedForShift = (shiftId) => {
    return assignments
      .filter(a => a.shiftId === shiftId && a.isActive)
      .sort((a, b) => a.id - b.id)
      .map(a => ({ ...a, staff: staffList.find(s => s.id === a.staffId) }))
      .filter(a => a.staff);
  };

  const logsForShift = (shiftId) => {
    return logs.filter(l => l.shiftId === shiftId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const handleSubmit = async () => {
    const comment = commentRef.current.trim();
    if (!comment || !formStaff || !formShift) {
      toast.warning('Complete todos los campos');
      return;
    }
    setSaving(true);
    try {
      if (editingLogId) {
        await updateLog(editingLogId, { comment });
        toast.success('Comentario actualizado');
        setEditingLogId(null);
      } else {
        await createLog({
          shiftId: parseInt(formShift),
          staffId: parseInt(formStaff),
          logDate: selectedDate,
          comment
        });
        toast.success('Comentario registrado');
      }
      commentRef.current = '';
      setCommentHasText(false);
      if (editorRef.current) editorRef.current.innerHTML = '';
      const logsRes = await getLogs();
      setLogs(logsRes.data.data || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (log) => {
    setEditingLogId(log.id);
    commentRef.current = log.comment || '';
    setCommentHasText(!!log.comment && log.comment.trim().length > 0);
    if (editorRef.current) editorRef.current.innerHTML = log.comment;
    setFormShift(String(log.shiftId));
    const assigned = assignedForShift(log.shiftId);
    if (assigned.length > 0) {
      setFormStaff(String(assigned[0].staffId));
    }
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    commentRef.current = '';
    setCommentHasText(false);
    if (editorRef.current) editorRef.current.innerHTML = '';
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Eliminar',
      text: '¿Está seguro de eliminar este comentario?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteLog(id);
          toast.success('Comentario eliminado');
          if (editingLogId === id) setEditingLogId(null);
          const logsRes = await getLogs();
          setLogs(logsRes.data.data || []);
        } catch { toast.error('Error al eliminar'); }
      }
    });
  };

  const selectedShiftStaff = formShift ? assignedForShift(parseInt(formShift)) : [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <Calendar size={18} color="#64748b" />
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: '#1e293b' }} />
        </div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
          Historia - {DAY_LABELS[dayKey] || ''} {chileNow.todayLabel}
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Cargando...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {dayShifts.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No hay turnos para este día</div>
          )}

          {dayShifts.map(shift => {
            const isCurrent = currShift && shift.id === currShift.id;
            const assigned = assignedForShift(shift.id);
            const logs = logsForShift(shift.id);
            return (
              <div key={shift.id} style={{
                background: isCurrent ? 'linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%)' : '#fff',
                borderRadius: 12,
                border: isCurrent ? '2px solid #6366f1' : '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: isCurrent ? '0 4px 16px rgba(99,102,241,0.15)' : 'none',
                transition: 'all 0.2s'
              }}>
                <div style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: isCurrent ? '#e0e7ff' : 'transparent'
                }}>
                  <Clock size={18} color={isCurrent ? '#4338ca' : '#2563eb'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: isCurrent ? '#312e81' : '#1e293b' }}>{shift.name}</span>
                      {isCurrent && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 10px', borderRadius: 12,
                          fontSize: 11, fontWeight: 700,
                          background: '#10b981', color: '#fff',
                          letterSpacing: 0.3, textTransform: 'uppercase'
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s ease-in-out infinite' }} />
                          Turno Actual
                        </span>
                      )}
                      <span style={{
                        padding: '2px 8px', borderRadius: 8,
                        fontSize: 11, fontWeight: 600,
                        background: isCurrent ? '#c7d2fe' : '#e0e7ff',
                        color: isCurrent ? '#3730a3' : '#4338ca',
                        whiteSpace: 'nowrap'
                      }}>
                        {shiftDateLabel[shift.id]}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: isCurrent ? '#4338ca' : '#64748b', marginTop: 2 }}>{shift.startTime?.substring(0, 5)} - {shift.endTime?.substring(0, 5)}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    {assigned.map((a, i) => (
                      <div key={a.id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', borderRadius: 20, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
                        background: i === 0 ? '#dbeafe' : '#f1f5f9',
                        color: i === 0 ? '#1e40af' : '#475569'
                      }}>
                        <UserCheck size={14} />
                        <span style={{ color: i === 0 ? '#1e40af' : 'inherit' }}>{a.staff.firstName} {a.staff.lastName}</span>
                      </div>
                    ))}
                    {assigned.length === 0 && (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Sin personal asignado</span>
                    )}
                  </div>
                </div>

                <div style={{ padding: '14px 20px' }}>
                  {logs.length > 0 && (
                    <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {logs.map(log => (
                        <div key={log.id} style={{
                          padding: '10px 14px', background: '#f8fafc', borderRadius: 8,
                          borderLeft: '3px solid #2563eb'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                              <User size={13} />
                              <span style={{ fontWeight: 600 }}>{log.staffName}</span>
                              <span>·</span>
                              <span>{new Date(log.createdAt).toLocaleString('es-AR')}</span>
                              {log.updatedAt && log.updatedAt !== log.createdAt && (
                                <span style={{ fontSize: 11, opacity: 0.6 }}>· editado {new Date(log.updatedAt).toLocaleString('es-AR')}</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => handleEdit(log)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: 2 }} title="Editar">
                                <Edit size={14} />
                              </button>
                              <button onClick={() => handleDelete(log.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }} title="Eliminar">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div dangerouslySetInnerHTML={{ __html: log.comment }} style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }} />
                        </div>
                      ))}
                    </div>
                  )}
                  {logs.length === 0 && (
                    <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>Sin novedades registradas</div>
                  )}
                </div>
              </div>
            );
          })}

          {dayShifts.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={16} /> Registrar novedad
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                   <select value={formShift} onChange={e => {
                     const shiftId = e.target.value;
                     setFormShift(shiftId);
                     setFormStaff('');
                     if (shiftId) {
                       const assigned = assignedForShift(parseInt(shiftId));
                       if (assigned.length > 0) {
                         setFormStaff(String(assigned[0].staffId));
                       }
                     }
                   }}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }}>
                    <option value="">Seleccionar turno...</option>
                    {dayShifts.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)})</option>
                    ))}
                  </select>
                   <select value={formStaff} onChange={e => setFormStaff(e.target.value)}
                     style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }}>
                     <option value="">Quien reporta...</option>
                     {selectedShiftStaff.length === 0 ? (
                       <option value="" disabled>Sin personal asignado a este turno</option>
                     ) : (
                       selectedShiftStaff.map((a, i) => (
                         <option key={a.staffId} value={a.staffId}>
                            {a.staff.firstName} {a.staff.lastName}
                         </option>
                       ))
                     )}
                   </select>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff', minHeight: 120 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '5px 8px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexWrap: 'wrap' }}>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('undo'); }} title="Deshacer (Ctrl+Z)" className="rich-toolbar-btn"><Undo size={16} /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('redo'); }} title="Rehacer (Ctrl+Y)" className="rich-toolbar-btn"><Redo size={16} /></button>
                    <div className="rich-toolbar-sep" />
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} title="Negrita (Ctrl+B)" className={`rich-toolbar-btn ${activeFormats.bold ? 'active' : ''}`}><Bold size={16} /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} title="Cursiva (Ctrl+I)" className={`rich-toolbar-btn ${activeFormats.italic ? 'active' : ''}`}><Italic size={16} /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }} title="Subrayado (Ctrl+U)" className={`rich-toolbar-btn ${activeFormats.underline ? 'active' : ''}`}><Underline size={16} /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('strikeThrough'); }} title="Tachado" className={`rich-toolbar-btn ${activeFormats.strikeThrough ? 'active' : ''}`}><Strikethrough size={16} /></button>
                    <div className="rich-toolbar-sep" />
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'h2'); }} title="Título" className={`rich-toolbar-btn ${activeFormats.block === 'h2' ? 'active' : ''}`}><Heading1 size={16} /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'h3'); }} title="Subtítulo" className={`rich-toolbar-btn ${activeFormats.block === 'h3' ? 'active' : ''}`}><Heading2 size={16} /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'blockquote'); }} title="Cita" className={`rich-toolbar-btn ${activeFormats.block === 'blockquote' ? 'active' : ''}`}><Quote size={16} /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'pre'); }} title="Código" className={`rich-toolbar-btn ${activeFormats.block === 'pre' ? 'active' : ''}`}><Code size={16} /></button>
                    <div className="rich-toolbar-sep" />
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} title="Lista" className={`rich-toolbar-btn ${activeFormats.insertUnorderedList ? 'active' : ''}`}><List size={16} /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList'); }} title="Lista numerada" className={`rich-toolbar-btn ${activeFormats.insertOrderedList ? 'active' : ''}`}><ListOrdered size={16} /></button>
                    <div className="rich-toolbar-sep" />
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyLeft'); }} title="Alinear izquierda"><AlignLeft size={16} /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyCenter'); }} title="Centrar"><AlignCenter size={16} /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyRight'); }} title="Alinear derecha"><AlignRight size={16} /></button>
                    <div className="rich-toolbar-sep" />
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); insertLink(); }} title="Insertar enlace"><LinkIcon size={16} /></button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat'); }} title="Quitar formato"><RemoveFormatting size={16} /></button>
                  </div>
                  <div
                    contentEditable
                    ref={editorRef}
                    role="textbox"
                    aria-multiline="true"
                    aria-label="Comentario"
                    className="rich-editor"
                    data-placeholder="Describa lo ocurrido durante el turno..."
                    suppressContentEditableWarning
                    onInput={(e) => { commentRef.current = e.currentTarget.innerHTML; setCommentHasText(e.currentTarget.textContent.trim().length > 0); syncActiveFormats(); }}
                    onKeyDown={handleEditorKeydown}
                    onMouseUp={syncActiveFormats}
                    onKeyUp={syncActiveFormats}
                    dangerouslySetInnerHTML={{ __html: commentRef.current }}
                    style={{ minHeight: 140, maxHeight: 360, padding: '12px 14px', outline: 'none', fontSize: 14, lineHeight: 1.6, overflowY: 'auto', color: '#1e293b' }}
                  />
                </div>
                <button onClick={handleSubmit} disabled={saving || !commentHasText || !formStaff || !formShift}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-end',
                    padding: '9px 20px', background: '#2563eb', color: '#fff',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    fontWeight: 600, fontSize: 14,
                    opacity: (saving || !commentHasText || !formStaff || !formShift) ? 0.5 : 1
                  }}>
                  <Send size={16} />
                  {saving ? 'Guardando...' : editingLogId ? 'Guardar cambios' : 'Registrar novedad'}
                </button>
                {editingLogId && (
                  <button onClick={handleCancelEdit} type="button"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-end',
                      padding: '9px 20px', background: '#e2e8f0', color: '#475569',
                      border: 'none', borderRadius: 8, cursor: 'pointer',
                      fontWeight: 600, fontSize: 14
                    }}>
                    <X size={16} />
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}