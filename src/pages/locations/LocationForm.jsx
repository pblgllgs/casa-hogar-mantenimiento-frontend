import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save, Loader2 } from 'lucide-react';
import Modal from '../../components/Modal';
import { createLocation, updateLocation, getAllLocations } from '../../api/assets';
import { locationTypeLabels } from '../../constants/locationTypes';

const locationTypes = [
  'BUILDING', 'FLOOR', 'WING', 'ROOM', 'COMMON_AREA', 'KITCHEN', 'BATHROOM',
  'LAUNDRY', 'OFFICE', 'STORAGE', 'OUTDOOR', 'PARKING', 'GARDEN', 'PLAYGROUND',
  'MEDICAL_ROOM', 'DINING_ROOM', 'CLASSROOM', 'LIBRARY', 'CHAPEL', 'OTHER',
];

const emptyForm = {
  code: '', name: '', description: '', type: 'ROOM', parentId: '',
  floor: '', wing: '', roomNumber: '', capacity: '', areaSqm: '', isActive: true,
  mapX: '', mapY: '', mapImage: '',
};

export default function LocationForm({ isOpen, onClose, location, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [parentLocations, setParentLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(location ? { ...emptyForm, ...location } : emptyForm);
      setErrors({});
      loadParents();
    }
  }, [isOpen, location]);

  const loadParents = async () => {
    try {
      const res = await getAllLocations({ size: 200 });
      const content = res.data.data.content || [];
      setParentLocations(location ? content.filter(l => l.id !== location.id) : content);
    } catch { /* ignore */ }
  };

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = 'El código es obligatorio';
    if (!form.name.trim()) e.name = 'El nombre es obligatorio';
    if (!form.type) e.type = 'El tipo es obligatorio';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (location?.id) {
        await updateLocation(location.id, form);
        toast.success('Ubicación actualizada');
      } else {
        await createLocation(form);
        toast.success('Ubicación creada');
      }
      onSaved?.();
      onClose();
    } catch {
      toast.error('Error al guardar ubicación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={location?.id ? 'Editar Ubicación' : 'Nueva Ubicación'}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Código" error={errors.code}>
            <input value={form.code} onChange={(e) => setField('code', e.target.value)} className="input-field" placeholder="ej. B1-R101" />
          </Field>
          <Field label="Nombre" error={errors.name}>
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} className="input-field" />
          </Field>
          <Field label="Tipo" error={errors.type}>
            <select value={form.type} onChange={(e) => setField('type', e.target.value)} className="input-field">
              {locationTypes.map(t => <option key={t} value={t}>{locationTypeLabels[t] || t}</option>)}
            </select>
          </Field>
          <Field label="Ubicación Padre">
            <select value={form.parentId} onChange={(e) => setField('parentId', e.target.value)} className="input-field">
              <option value="">-- Ninguno --</option>
              {parentLocations.map(l => <option key={l.id} value={l.id}>{l.code} - {l.name}</option>)}
            </select>
          </Field>
          <Field label="Piso">
            <input value={form.floor} onChange={(e) => setField('floor', e.target.value)} className="input-field" />
          </Field>
          <Field label="Ala">
            <input value={form.wing} onChange={(e) => setField('wing', e.target.value)} className="input-field" />
          </Field>
          <Field label="Número de Habitación">
            <input value={form.roomNumber} onChange={(e) => setField('roomNumber', e.target.value)} className="input-field" />
          </Field>
          <Field label="Capacidad">
            <input type="number" value={form.capacity} onChange={(e) => setField('capacity', e.target.value)} className="input-field" />
          </Field>
          <Field label="Área (m²)">
            <input type="number" step="0.01" value={form.areaSqm} onChange={(e) => setField('areaSqm', e.target.value)} className="input-field" />
          </Field>
        </div>

        <div className="mt-2">
          <Field label="Descripción">
            <textarea value={form.description} onChange={(e) => setField('description', e.target.value)}
              className="input-field resize-y" rows={3} />
          </Field>
        </div>

        <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
          <p className="m-0 mb-2 text-sm font-bold text-slate-600">Posición en Plano</p>
          <p className="m-0 mb-2 text-xs text-slate-400">Posición de esta ubicación en el plano (se puede ajustar arrastrando en el mapa)</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Posición X (%)">
              <input type="number" step="0.1" min="0" max="100" value={form.mapX}
                onChange={(e) => setField('mapX', e.target.value)} className="input-field" placeholder="0-100" />
            </Field>
            <Field label="Posición Y (%)">
              <input type="number" step="0.1" min="0" max="100" value={form.mapY}
                onChange={(e) => setField('mapY', e.target.value)} className="input-field" placeholder="0-100" />
            </Field>
          </div>
        </div>

        <div className="mt-3 mb-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} />
            Activo
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {location?.id ? 'Actualizar' : 'Crear'}
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
