import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save, Loader2 } from 'lucide-react';
import Modal from '../../components/Modal';
import { create, update } from '../../api/inventory';
import { getAllLocations } from '../../api/assets';
import { INVENTORY_CATEGORIES, CATEGORY_COLORS } from '../../constants/inventoryCategories';
import ColorSelect from '../../components/ColorSelect';

const unitOptions = ['UN', 'M', 'KG', 'L', 'MT2', 'MT3', 'PAR', 'ROLLO', 'CAJA'];

const emptyForm = {
  code: '', name: '', description: '', category: '', unitOfMeasure: 'UN',
  currentStock: 0, minimumStock: 0, maximumStock: 0, reorderPoint: 0,
  unitCost: '', locationId: '', supplierName: '', supplierContact: '',
  supplierSKU: '', lastPurchaseDate: '', lastPurchaseCost: '', isActive: true,
};

export default function ItemForm({ isOpen, onClose, item, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(item ? { ...emptyForm, ...item } : emptyForm);
      setErrors({});
      loadLocations();
    }
  }, [isOpen, item]);

  const loadLocations = async () => {
    try {
      const res = await getAllLocations({ size: 200 });
      setLocations(res.data.data.content || []);
    } catch { /* ignore */ }
  };

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = 'El código es obligatorio';
    if (!form.name.trim()) e.name = 'El nombre es obligatorio';
    if (!form.unitOfMeasure) e.unitOfMeasure = 'La unidad es obligatoria';
    if (form.unitCost && isNaN(Number(form.unitCost))) e.unitCost = 'Debe ser un número';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (item?.id) {
        await update(item.id, form);
        toast.success('Artículo actualizado');
      } else {
        await create(form);
        toast.success('Artículo creado');
      }
      onSaved?.();
      onClose();
    } catch {
      toast.error('Error al guardar artículo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item?.id ? 'Editar Artículo' : 'Nuevo Artículo'}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Código" error={errors.code}>
            <input value={form.code} onChange={(e) => setField('code', e.target.value)} className="input-field" />
          </Field>
          <Field label="Nombre" error={errors.name}>
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} className="input-field" />
          </Field>
          <Field label="Categoría">
            <ColorSelect value={form.category} onChange={(v) => setField('category', v)}
              options={INVENTORY_CATEGORIES} colorMap={CATEGORY_COLORS} placeholder="-- Seleccionar --" />
          </Field>
          <Field label="Unidad de Medida" error={errors.unitOfMeasure}>
            <select value={form.unitOfMeasure} onChange={(e) => setField('unitOfMeasure', e.target.value)} className="input-field">
              {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="Stock Actual">
            <input type="number" value={form.currentStock} onChange={(e) => setField('currentStock', e.target.value)} className="input-field" />
          </Field>
          <Field label="Stock Mínimo">
            <input type="number" value={form.minimumStock} onChange={(e) => setField('minimumStock', e.target.value)} className="input-field" />
          </Field>
          <Field label="Stock Máximo">
            <input type="number" value={form.maximumStock} onChange={(e) => setField('maximumStock', e.target.value)} className="input-field" />
          </Field>
          <Field label="Punto de Reorden">
            <input type="number" value={form.reorderPoint} onChange={(e) => setField('reorderPoint', e.target.value)} className="input-field" />
          </Field>
          <Field label="Costo Unitario" error={errors.unitCost}>
            <input type="number" step="0.01" value={form.unitCost} onChange={(e) => setField('unitCost', e.target.value)} className="input-field" />
          </Field>
          <Field label="Ubicación">
            <select value={form.locationId} onChange={(e) => setField('locationId', e.target.value)} className="input-field">
              <option value="">-- Ninguno --</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.code} - {l.name}</option>)}
            </select>
          </Field>
          <Field label="Nombre del Proveedor">
            <input value={form.supplierName} onChange={(e) => setField('supplierName', e.target.value)} className="input-field" />
          </Field>
          <Field label="Contacto del Proveedor">
            <input value={form.supplierContact} onChange={(e) => setField('supplierContact', e.target.value)} className="input-field" />
          </Field>
          <Field label="SKU del Proveedor">
            <input value={form.supplierSKU} onChange={(e) => setField('supplierSKU', e.target.value)} className="input-field" />
          </Field>
          <Field label="Última Fecha de Compra">
            <input type="date" value={form.lastPurchaseDate} onChange={(e) => setField('lastPurchaseDate', e.target.value)} className="input-field" />
          </Field>
          <Field label="Último Costo de Compra">
            <input type="number" step="0.01" value={form.lastPurchaseCost} onChange={(e) => setField('lastPurchaseCost', e.target.value)} className="input-field" />
          </Field>
        </div>

        <div className="mt-2">
          <Field label="Descripción">
            <textarea value={form.description} onChange={(e) => setField('description', e.target.value)}
              className="input-field resize-y" rows={3} />
          </Field>
        </div>

        <div className="mt-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} />
            Activo
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {item?.id ? 'Actualizar' : 'Crear'}
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
