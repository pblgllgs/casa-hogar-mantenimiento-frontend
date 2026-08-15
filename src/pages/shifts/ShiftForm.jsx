import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save, Loader2 } from 'lucide-react';
import Modal from '../../components/Modal';
import { create, update } from '../../api/shifts';

const allDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const dayLabels = { MON: 'Lunes', TUE: 'Martes', WED: 'Miércoles', THU: 'Jueves', FRI: 'Viernes', SAT: 'Sábado', SUN: 'Domingo' };

const emptyForm = {
  name: '', startTime: '08:00', endTime: '17:00', daysOfWeek: [], isActive: true,
};

export default function ShiftForm({ isOpen, onClose, shift, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (shift) {
        const days = shift.daysOfWeek
          ? (typeof shift.daysOfWeek === 'string' ? shift.daysOfWeek.split(',').map(d => d.trim()) : shift.daysOfWeek)
          : [];
        const startTime = shift.startTime ? shift.startTime.substring(0, 5) : '08:00';
        const endTime = shift.endTime ? shift.endTime.substring(0, 5) : '17:00';
        setForm({ ...emptyForm, ...shift, startTime, endTime, daysOfWeek: days });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
    }
  }, [isOpen, shift]);

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter(d => d !== day)
        : [...f.daysOfWeek, day],
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'El nombre es obligatorio';
    if (!form.startTime) e.startTime = 'La hora de inicio es obligatoria';
    if (!form.endTime) e.endTime = 'La hora de fin es obligatoria';
    if (form.daysOfWeek.length === 0) e.daysOfWeek = 'Seleccione al menos un día';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form, daysOfWeek: form.daysOfWeek.join(',') };
      if (shift?.id) {
        await update(shift.id, payload);
        toast.success('Turno actualizado');
      } else {
        await create(payload);
        toast.success('Turno creado');
      }
      onSaved?.();
      onClose();
    } catch {
      toast.error('Error al guardar turno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={shift?.id ? 'Editar Turno' : 'Nuevo Turno'}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Nombre" error={errors.name}>
              <input value={form.name} onChange={(e) => setField('name', e.target.value)} className="input-field" placeholder="ej. Turno Matutino" />
            </Field>
          </div>
          <Field label="Hora Inicio" error={errors.startTime}>
            <input type="time" value={form.startTime} onChange={(e) => setField('startTime', e.target.value)} className="input-field" />
          </Field>
          <Field label="Hora Fin" error={errors.endTime}>
            <input type="time" value={form.endTime} onChange={(e) => setField('endTime', e.target.value)} className="input-field" />
          </Field>
        </div>

        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-600 mb-2">Días de la Semana</label>
          <div className="flex gap-2 flex-wrap">
            {allDays.map(day => (
              <button key={day} type="button" onClick={() => toggleDay(day)}
                className={`px-3.5 py-1.5 rounded-md border-2 cursor-pointer text-xs font-semibold transition-all ${
                  form.daysOfWeek.includes(day)
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}>
                {dayLabels[day].slice(0, 3)}
              </button>
            ))}
          </div>
          {errors.daysOfWeek && <span className="text-[11px] text-red-600 mt-1 block">{errors.daysOfWeek}</span>}
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} />
            Activo
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {shift?.id ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {children}
      {error && <span className="text-[11px] text-red-600 mt-0.5 block">{error}</span>}
    </div>
  );
}
