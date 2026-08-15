import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save, Loader2 } from 'lucide-react';
import Modal from '../../components/Modal';
import { create, update } from '../../api/workOrders';
import { getAll as getAssets, getAllLocations } from '../../api/assets';
import { getAll as getStaff } from '../../api/staff';
import ColorSelect from '../../components/ColorSelect';

const typeOptions = [
  { value: 'PREVENTIVE', label: 'Preventivo' },
  { value: 'CORRECTIVE', label: 'Correctivo' },
  { value: 'PREDICTIVE', label: 'Predictivo' },
  { value: 'EMERGENCY', label: 'Emergencia' },
  { value: 'INSPECTION', label: 'Inspección' },
  { value: 'CALIBRATION', label: 'Calibración' },
];
const typeColors = {
  PREVENTIVE: '#16a34a', CORRECTIVE: '#f59e0b', PREDICTIVE: '#8b5cf6',
  EMERGENCY: '#dc2626', INSPECTION: '#3b82f6', CALIBRATION: '#06b6d4',
};

const priorityOptions = [
  { value: 'LOW', label: 'Baja' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
  { value: 'CRITICAL', label: 'Crítica' },
];
const priorityColors = { LOW: '#94a3b8', MEDIUM: '#f59e0b', HIGH: '#f97316', URGENT: '#dc2626', CRITICAL: '#7c3aed' };

const emptyForm = {
  title: '', description: '', type: 'PREVENTIVE', priority: 'MEDIUM',
  locationId: '', assetId: '', assignedToId: '', supervisorId: '',
  estimatedHours: '', scheduledStartDate: '', scheduledEndDate: '',
  costMaterials: '', costLabor: '', requiresExternalVendor: false,
  vendorName: '', vendorContact: '',
};

export default function WorkOrderForm({ isOpen, onClose, workOrder, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [assets, setAssets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (workOrder) {
        setForm({ ...emptyForm, ...workOrder });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
      loadDropdowns();
    }
  }, [isOpen, workOrder]);

  const loadDropdowns = async () => {
    try {
      const [assetRes, staffRes, locRes] = await Promise.all([
        getAssets({ size: 200 }),
        getStaff({ size: 200 }),
        getAllLocations({ size: 200 }),
      ]);
      setAssets(assetRes.data.data.content || []);
      setStaff(staffRes.data.data.content || []);
      setLocations(locRes.data.data.content || []);
    } catch { /* ignore */ }
  };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'El título es obligatorio';
    if (!form.type) e.type = 'El tipo es obligatorio';
    if (!form.priority) e.priority = 'La prioridad es obligatoria';
    if (form.estimatedHours && isNaN(Number(form.estimatedHours))) e.estimatedHours = 'Debe ser un número';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form };
      if (workOrder?.id) {
        await update(workOrder.id, payload);
        toast.success('Orden de trabajo actualizada');
      } else {
        await create(payload);
        toast.success('Orden de trabajo creada');
      }
      onSaved?.();
      onClose();
    } catch {
      toast.error('Error al guardar orden de trabajo');
    } finally {
      setLoading(false);
    }
  };

  const staffOptions = staff.map(s => ({ id: s.id, label: `${s.firstName} ${s.lastName}` }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={workOrder?.id ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Título" error={errors.title}>
            <input value={form.title} onChange={(e) => setField('title', e.target.value)} className="input-field" />
          </Field>
          <Field label="Tipo" error={errors.type}>
            <ColorSelect value={form.type} onChange={(v) => setField('type', v)}
              options={typeOptions} colorMap={typeColors} />
          </Field>
          <Field label="Prioridad" error={errors.priority}>
            <ColorSelect value={form.priority} onChange={(v) => setField('priority', v)}
              options={priorityOptions} colorMap={priorityColors} />
          </Field>
          <Field label="Asignado A">
            <select value={form.assignedToId} onChange={(e) => setField('assignedToId', e.target.value)} className="input-field">
              <option value="">-- Ninguno --</option>
              {staffOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Supervisor">
            <select value={form.supervisorId} onChange={(e) => setField('supervisorId', e.target.value)} className="input-field">
              <option value="">-- Ninguno --</option>
              {staffOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Activo">
            <select value={form.assetId} onChange={(e) => setField('assetId', e.target.value)} className="input-field">
              <option value="">-- Ninguno --</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.assetCode} - {a.name}</option>)}
            </select>
          </Field>
          <Field label="Ubicación">
            <select value={form.locationId} onChange={(e) => setField('locationId', e.target.value)} className="input-field">
              <option value="">-- Ninguno --</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.code} - {l.name}</option>)}
            </select>
          </Field>
          <Field label="Horas Estimadas" error={errors.estimatedHours}>
            <input type="number" value={form.estimatedHours} onChange={(e) => setField('estimatedHours', e.target.value)} className="input-field" />
          </Field>
          <Field label="Inicio Programado">
            <input type="date" value={form.scheduledStartDate} onChange={(e) => setField('scheduledStartDate', e.target.value)} className="input-field" />
          </Field>
          <Field label="Fin Programado">
            <input type="date" value={form.scheduledEndDate} onChange={(e) => setField('scheduledEndDate', e.target.value)} className="input-field" />
          </Field>
          <Field label="Costo de Materiales">
            <input type="number" step="0.01" value={form.costMaterials} onChange={(e) => setField('costMaterials', e.target.value)} className="input-field" />
          </Field>
          <Field label="Costo de Mano de Obra">
            <input type="number" step="0.01" value={form.costLabor} onChange={(e) => setField('costLabor', e.target.value)} className="input-field" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="col-span-2">
            <Field label="Descripción">
              <textarea value={form.description} onChange={(e) => setField('description', e.target.value)}
                className="input-field resize-y" rows={4} />
            </Field>
          </div>
        </div>

        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={form.requiresExternalVendor}
              onChange={(e) => setField('requiresExternalVendor', e.target.checked)} />
            Requiere Proveedor Externo
          </label>
          {form.requiresExternalVendor && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Field label="Nombre del Proveedor">
                <input value={form.vendorName} onChange={(e) => setField('vendorName', e.target.value)} className="input-field" />
              </Field>
              <Field label="Contacto del Proveedor">
                <input value={form.vendorContact} onChange={(e) => setField('vendorContact', e.target.value)} className="input-field" />
              </Field>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {workOrder?.id ? 'Actualizar' : 'Crear'}
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
