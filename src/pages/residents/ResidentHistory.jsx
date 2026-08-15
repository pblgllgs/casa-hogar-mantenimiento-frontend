import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Sun, Moon, Save, Trash2, Loader2, Clock, User, Edit, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { getById } from '../../api/residents';
import { getByResidentAndDate, save as saveHistory, remove as deleteHistory } from '../../api/residentHistory';
import { useAuth } from '../../context/AuthContext';
import RichTextEditor from '../../components/RichTextEditor';
import Swal from 'sweetalert2';

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function ResidentHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const canEdit = user?.roles?.includes('ADMIN') || user?.roles?.includes('HR');

  const getChileToday = () => {
    const fmt = new Intl.DateTimeFormat('en', { timeZone: 'America/Santiago', year: 'numeric', month: 'numeric', day: 'numeric' });
    const parts = fmt.formatToParts(new Date());
    const get = (t) => parts.find(p => p.type === t)?.value || '';
    const year = parseInt(get('year'));
    const month = parseInt(get('month'));
    const day = parseInt(get('day'));
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState(getChileToday());
  const [resident, setResident] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);

  const dayRef = useRef('');
  const nightRef = useRef('');
  const [dayHasText, setDayHasText] = useState(false);
  const [nightHasText, setNightHasText] = useState(false);

  const todayStr = getChileToday();

  const recordFor = (period) => records.find(r => r.period === period) || null;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, historyRes] = await Promise.all([
        getById(id),
        getByResidentAndDate(id, selectedDate)
      ]);
      setResident(resRes.data.data);
      const data = historyRes.data.data || [];
      setRecords(data);
    } catch {
      toast.error('Error al cargar historial');
      navigate('/residentes');
    } finally {
      setLoading(false);
    }
  }, [id, selectedDate, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const day = recordFor('DAY');
    const night = recordFor('NIGHT');
    dayRef.current = day?.comment || '';
    nightRef.current = night?.comment || '';
    setDayHasText(!!day?.comment && day.comment.trim().length > 0);
    setNightHasText(!!night?.comment && night.comment.trim().length > 0);
    setEditingPeriod(null);
  }, [records]);

  const startEdit = (period) => {
    const record = recordFor(period);
    if (period === 'DAY') {
      dayRef.current = record?.comment || '';
      setDayHasText(!!record?.comment && record.comment.trim().length > 0);
    } else {
      nightRef.current = record?.comment || '';
      setNightHasText(!!record?.comment && record.comment.trim().length > 0);
    }
    setEditingPeriod(period);
  };

  const cancelEdit = () => {
    const day = recordFor('DAY');
    const night = recordFor('NIGHT');
    dayRef.current = day?.comment || '';
    nightRef.current = night?.comment || '';
    setDayHasText(!!day?.comment && day.comment.trim().length > 0);
    setNightHasText(!!night?.comment && night.comment.trim().length > 0);
    setEditingPeriod(null);
  };

  const handleSave = async (period) => {
    if (!canEdit) return;
    const comment = period === 'DAY' ? dayRef.current : nightRef.current;
    if (!comment || comment.trim().length === 0) {
      toast.warning(`El comentario del turno ${period === 'DAY' ? 'diurno' : 'nocturno'} está vacío`);
      return;
    }
    setSaving(true);
    try {
      await saveHistory(id, {
        logDate: selectedDate,
        period,
        comment
      });
      toast.success('Historial guardado');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (period) => {
    if (!canEdit) return;
    const record = recordFor(period);
    if (!record) return;
    Swal.fire({
      title: 'Eliminar Historial',
      text: `¿Eliminar el registro del turno ${period === 'DAY' ? 'diurno' : 'nocturno'} del ${selectedDate}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteHistory(id, record.id);
          toast.success('Historial eliminado');
          fetchData();
        } catch {
          toast.error('Error al eliminar');
        }
      }
    });
  };

  const dateObj = new Date(selectedDate + 'T12:00:00');
  const dateLabel = `${dateObj.getDate()} ${MONTHS_ES[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

  const renderPeriodCard = (period) => {
    const record = recordFor(period);
    const isDay = period === 'DAY';
    const title = isDay ? 'Turno Diurno' : 'Turno Nocturno';
    const timeRange = isDay ? '08:00 - 20:00' : '20:00 - 08:00';
    const icon = isDay ? Sun : Moon;
    const color = isDay ? '#f59e0b' : '#6366f1';
    const bg = isDay ? '#fef3c7' : '#eef2ff';

    return (
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
            {icon === Sun ? <Sun size={20} color={color} /> : <Moon size={20} color={color} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>{title}</div>
            <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> {timeRange}
            </div>
          </div>
          {record && (
            <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <User size={11} /> Actualizado: {record.updatedAt ? new Date(record.updatedAt).toLocaleString('es-AR') : '-'}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 20px' }}>
          {!canEdit ? (
            record && record.comment ? (
              <div dangerouslySetInnerHTML={{ __html: record.comment }} style={{ fontSize: 14, color: '#334155', lineHeight: 1.7 }} />
            ) : (
              <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>
                Sin registro para este turno
              </div>
            )
          ) : editingPeriod === period ? (
            <>
              <RichTextEditor
                value={record?.comment || ''}
                onChange={(html, hasText) => {
                  if (isDay) { dayRef.current = html; setDayHasText(hasText); }
                  else { nightRef.current = html; setNightHasText(hasText); }
                }}
                placeholder={`Describa lo ocurrido durante el turno ${isDay ? 'diurno' : 'nocturno'} de ${resident?.firstName || ''}...`}
                minHeight={140}
                maxHeight={360}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                {record && (
                  <button onClick={() => handleDelete(period)} disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    <Trash2 size={14} /> Eliminar
                  </button>
                )}
                <button onClick={cancelEdit} disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  <X size={14} /> Cancelar
                </button>
                <button onClick={() => handleSave(period)} disabled={saving || (isDay ? !dayHasText : !nightHasText)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: '#2563eb', color: '#fff',
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                    opacity: (saving || (isDay ? !dayHasText : !nightHasText)) ? 0.5 : 1
                  }}>
                  {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                  {saving ? 'Guardando...' : 'Guardar Historial'}
                </button>
              </div>
            </>
          ) : (
            <>
              {record && record.comment ? (
                <div dangerouslySetInnerHTML={{ __html: record.comment }} style={{ fontSize: 14, color: '#334155', lineHeight: 1.7 }} />
              ) : (
                <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>
                  Sin registro para este turno
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => startEdit(period)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  <Edit size={14} /> {record ? 'Editar' : 'Registrar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading && !resident) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: 0, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate(`/residentes/${id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Volver al perfil">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b' }}>
              Historial - {resident?.firstName} {resident?.lastName}
            </h1>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Código: {resident?.code} · {dateLabel}{selectedDate === todayStr ? ' (Hoy)' : ''}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <Calendar size={18} color="#64748b" />
            <input type="date" value={selectedDate} max={todayStr} onChange={e => { if (e.target.value) setSelectedDate(e.target.value); }}
              style={{ border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: '#1e293b' }} />
          </div>
          {canEdit && (
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Solo ADMIN y HR pueden editar el historial
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Cargando...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {renderPeriodCard('DAY')}
            {renderPeriodCard('NIGHT')}
          </div>
        )}
      </div>
    </div>
  );
}
