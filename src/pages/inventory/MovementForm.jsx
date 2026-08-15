import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save, Loader2, ArrowRightLeft } from 'lucide-react';
import Modal from '../../components/Modal';
import { createMovement, getAll } from '../../api/inventory';

const movementTypes = ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'];
const movementTypeLabels = { IN: 'Entrada', OUT: 'Salida', ADJUSTMENT: 'Ajuste', TRANSFER: 'Transferencia' };

const emptyForm = {
  inventoryItemId: '', movementType: 'IN', quantity: 1, unitCost: 0,
  referenceType: '', referenceId: '', notes: '',
};

export default function MovementForm({ isOpen, onClose, defaultItemId, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm({ ...emptyForm, inventoryItemId: defaultItemId || '' });
      setErrors({});
      loadItems();
    }
  }, [isOpen, defaultItemId]);

  const loadItems = async () => {
    try {
      const res = await getAll({ size: 500 });
      setItems(res.data.data.content || []);
    } catch { /* ignore */ }
  };

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const totalCost = (Number(form.quantity) || 0) * (Number(form.unitCost) || 0);

  const validate = () => {
    const e = {};
    if (!form.inventoryItemId) e.inventoryItemId = 'El artículo es obligatorio';
    if (!form.movementType) e.movementType = 'El tipo es obligatorio';
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = 'La cantidad debe ser > 0';
    if (form.unitCost && isNaN(Number(form.unitCost))) e.unitCost = 'Debe ser un número';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await createMovement({
        ...form,
        quantity: Number(form.quantity),
        unitCost: Number(form.unitCost) || 0,
        totalCost,
      });
      toast.success('Movimiento registrado');
      onSaved?.();
      onClose();
    } catch {
      toast.error('Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Movimiento">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Artículo de Inventario" error={errors.inventoryItemId}>
              <select value={form.inventoryItemId} onChange={(e) => setField('inventoryItemId', e.target.value)} className="input-field">
                <option value="">-- Seleccionar Artículo --</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.code} - {item.name} (Stock: {item.currentStock})</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Tipo de Movimiento" error={errors.movementType}>
            <select value={form.movementType} onChange={(e) => setField('movementType', e.target.value)} className="input-field">
              {movementTypes.map(t => (
                <option key={t} value={t}>{movementTypeLabels[t] || t}</option>
              ))}
            </select>
          </Field>
          <Field label="Cantidad" error={errors.quantity}>
            <input type="number" min="1" value={form.quantity} onChange={(e) => setField('quantity', e.target.value)} className="input-field" />
          </Field>
          <Field label="Costo Unitario" error={errors.unitCost}>
            <input type="number" step="0.01" value={form.unitCost} onChange={(e) => setField('unitCost', e.target.value)} className="input-field" />
          </Field>
          <Field label="Costo Total">
            <div className="px-2.5 py-2 bg-slate-100 rounded-md text-sm font-semibold text-slate-800">
              ${totalCost.toFixed(2)}
            </div>
          </Field>
          <Field label="Tipo de Referencia">
            <input value={form.referenceType} onChange={(e) => setField('referenceType', e.target.value)} className="input-field" placeholder="ej. WORK_ORDER" />
          </Field>
          <Field label="ID de Referencia">
            <input value={form.referenceId} onChange={(e) => setField('referenceId', e.target.value)} className="input-field" />
          </Field>
        </div>

        <div className="mt-2">
          <Field label="Notas">
            <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)}
              className="input-field resize-y" rows={3} />
          </Field>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? <Loader2 size={16} className="spin" /> : <ArrowRightLeft size={16} />}
            Registrar Movimiento
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
