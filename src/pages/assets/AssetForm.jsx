import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save, Loader2 } from 'lucide-react';
import Modal from '../../components/Modal';
import { create, update } from '../../api/assets';
import { getAllLocations } from '../../api/assets';
import ColorSelect from '../../components/ColorSelect';

const categoryOptions = [
  { value: 'HVAC', label: 'Calefacción/Ventilación' },
  { value: 'PLUMBING', label: 'Plomería' },
  { value: 'ELECTRICAL', label: 'Eléctrico' },
  { value: 'STRUCTURAL', label: 'Estructural' },
  { value: 'APPLIANCE', label: 'Electrodoméstico' },
  { value: 'SAFETY', label: 'Seguridad' },
  { value: 'FURNITURE', label: 'Muebles' },
  { value: 'TECHNOLOGY', label: 'Tecnología' },
  { value: 'LANDSCAPING', label: 'Jardinería' },
  { value: 'CLEANING', label: 'Limpieza' },
  { value: 'OTHER', label: 'Otro' },
];
const categoryColors = {
  HVAC: '#f59e0b', PLUMBING: '#06b6d4', ELECTRICAL: '#f97316', STRUCTURAL: '#64748b',
  APPLIANCE: '#3b82f6', SAFETY: '#dc2626', FURNITURE: '#8b5cf6', TECHNOLOGY: '#14b8a6',
  LANDSCAPING: '#22c55e', CLEANING: '#a855f7', OTHER: '#94a3b8',
};

const subcategories = [
  'AIR_CONDITIONER', 'HEATER', 'VENTILATION', 'PIPE', 'FAUCET', 'TOILET',
  'WATER_HEATER', 'CIRCUIT_BREAKER', 'WIRING', 'LIGHTING', 'GENERATOR',
  'ROOF', 'WALL', 'FLOORING', 'REFRIGERATOR', 'WASHER', 'DRYER', 'OVEN',
  'MICROWAVE', 'FIRE_EXTINGUISHER', 'ALARM', 'SPRINKLER', 'DETECTOR',
  'TABLE', 'CHAIR', 'BED', 'DESK', 'COMPUTER', 'PRINTER', 'CAMERA',
  'FENCE', 'TREE', 'IRRIGATION', 'VACUUM', 'MOP', 'OTHER',
];

const statusOptions = [
  { value: 'OPERATIONAL', label: 'Operativo' },
  { value: 'NEEDS_MAINTENANCE', label: 'Requiere Mantención' },
  { value: 'OUT_OF_SERVICE', label: 'Fuera de Servicio' },
  { value: 'DECOMMISSIONED', label: 'Dado de Baja' },
];
const statusColors = { OPERATIONAL: '#16a34a', NEEDS_MAINTENANCE: '#f59e0b', OUT_OF_SERVICE: '#dc2626', DECOMMISSIONED: '#94a3b8' };

const criticalityOptions = [
  { value: 'LOW', label: 'Baja' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'CRITICAL', label: 'Crítica' },
];
const criticalityColors = { LOW: '#94a3b8', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#dc2626' };

const emptyForm = {
  assetCode: '', name: '', description: '', category: 'OTHER', subcategory: 'OTHER',
  brand: '', model: '', serialNumber: '', manufactureYear: '', purchaseDate: '',
  purchaseCost: '', warrantyExpiryDate: '', locationId: '', status: 'OPERATIONAL',
  criticality: 'MEDIUM', expectedLifeYears: '', maintenanceIntervalDays: '', manualUrl: '',
};

export default function AssetForm({ isOpen, onClose, asset, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(asset ? { ...emptyForm, ...asset } : emptyForm);
      setErrors({});
      loadLocations();
    }
  }, [isOpen, asset]);

  const loadLocations = async () => {
    try {
      const res = await getAllLocations({ size: 200 });
      setLocations(res.data.data.content || []);
    } catch { /* ignore */ }
  };

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.assetCode.trim()) e.assetCode = 'El código del activo es obligatorio';
    if (!form.name.trim()) e.name = 'El nombre es obligatorio';
    if (form.purchaseCost && isNaN(Number(form.purchaseCost))) e.purchaseCost = 'Debe ser un número';
    if (form.expectedLifeYears && isNaN(Number(form.expectedLifeYears))) e.expectedLifeYears = 'Debe ser un número';
    if (form.maintenanceIntervalDays && isNaN(Number(form.maintenanceIntervalDays))) e.maintenanceIntervalDays = 'Debe ser un número';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (asset?.id) {
        await update(asset.id, form);
        toast.success('Activo actualizado');
      } else {
        await create(form);
        toast.success('Activo creado');
      }
      onSaved?.();
      onClose();
    } catch {
      toast.error('Error al guardar activo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={asset?.id ? 'Editar Activo' : 'Nuevo Activo'}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Código del Activo" error={errors.assetCode}>
            <input value={form.assetCode} onChange={(e) => setField('assetCode', e.target.value)} className="input-field" />
          </Field>
          <Field label="Nombre" error={errors.name}>
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} className="input-field" />
          </Field>
          <Field label="Categoría">
            <ColorSelect value={form.category} onChange={(v) => setField('category', v)}
              options={categoryOptions} colorMap={categoryColors} />
          </Field>
          <Field label="Subcategoría">
            <select value={form.subcategory} onChange={(e) => setField('subcategory', e.target.value)} className="input-field">
              {subcategories.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </Field>
          <Field label="Marca">
            <input value={form.brand} onChange={(e) => setField('brand', e.target.value)} className="input-field" />
          </Field>
          <Field label="Modelo">
            <input value={form.model} onChange={(e) => setField('model', e.target.value)} className="input-field" />
          </Field>
          <Field label="Número de Serie">
            <input value={form.serialNumber} onChange={(e) => setField('serialNumber', e.target.value)} className="input-field" />
          </Field>
          <Field label="Año de Fabricación">
            <input type="number" value={form.manufactureYear} onChange={(e) => setField('manufactureYear', e.target.value)} className="input-field" />
          </Field>
          <Field label="Fecha de Compra">
            <input type="date" value={form.purchaseDate} onChange={(e) => setField('purchaseDate', e.target.value)} className="input-field" />
          </Field>
          <Field label="Costo de Compra" error={errors.purchaseCost}>
            <input type="number" step="0.01" value={form.purchaseCost} onChange={(e) => setField('purchaseCost', e.target.value)} className="input-field" />
          </Field>
          <Field label="Vencimiento de Garantía">
            <input type="date" value={form.warrantyExpiryDate} onChange={(e) => setField('warrantyExpiryDate', e.target.value)} className="input-field" />
          </Field>
          <Field label="Ubicación">
            <select value={form.locationId} onChange={(e) => setField('locationId', e.target.value)} className="input-field">
              <option value="">-- Ninguno --</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.code} - {l.name}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <ColorSelect value={form.status} onChange={(v) => setField('status', v)}
              options={statusOptions} colorMap={statusColors} />
          </Field>
          <Field label="Criticidad">
            <ColorSelect value={form.criticality} onChange={(v) => setField('criticality', v)}
              options={criticalityOptions} colorMap={criticalityColors} />
          </Field>
          <Field label="Vida Útil (años)" error={errors.expectedLifeYears}>
            <input type="number" value={form.expectedLifeYears} onChange={(e) => setField('expectedLifeYears', e.target.value)} className="input-field" />
          </Field>
          <Field label="Intervalo de Mantenimiento (días)" error={errors.maintenanceIntervalDays}>
            <input type="number" value={form.maintenanceIntervalDays} onChange={(e) => setField('maintenanceIntervalDays', e.target.value)} className="input-field" />
          </Field>
          <div className="col-span-2">
            <Field label="Descripción">
              <textarea value={form.description} onChange={(e) => setField('description', e.target.value)}
                className="input-field resize-y" rows={3} />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="URL del Manual">
              <input value={form.manualUrl} onChange={(e) => setField('manualUrl', e.target.value)} className="input-field" placeholder="https://..." />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {asset?.id ? 'Actualizar' : 'Crear'}
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
