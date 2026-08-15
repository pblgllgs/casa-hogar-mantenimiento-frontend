import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save, Loader2 } from 'lucide-react';
import Modal from '../../components/Modal';
import ImageUpload from '../../components/ImageUpload';
import { create, update } from '../../api/residents';
import { getAllLocations } from '../../api/assets';
import ColorSelect from '../../components/ColorSelect';

const documentTypes = ['CC', 'CE', 'TI', 'RC', 'PA', 'CURP'];
const genders = ['MALE', 'FEMALE', 'OTHER'];
const statusOptions = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'TRANSFERRED', label: 'Transferido' },
  { value: 'DISCHARGED', label: 'Dado de Alta' },
];
const statusColors = { ACTIVE: '#16a34a', INACTIVE: '#94a3b8', TRANSFERRED: '#3b82f6', DISCHARGED: '#dc2626' };

const emptyForm = {
  code: '', firstName: '', lastName: '', documentType: 'CC', documentNumber: '',
  birthDate: '', gender: 'MALE', entryDate: '', exitDate: '', status: 'ACTIVE',
  roomId: '', guardianName: '', guardianPhone: '', guardianEmail: '',
  guardianRelationship: '', medicalInfo: '', dietaryRestrictions: '', notes: '',
  photoUrl: '',
};

export default function ResidentForm({ isOpen, onClose, resident, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(resident ? { ...emptyForm, ...resident } : emptyForm);
      setErrors({});
      loadRooms();
    }
  }, [isOpen, resident]);

  const loadRooms = async () => {
    try {
      const res = await getAllLocations({ size: 500, type: 'ROOM' });
      setRooms(res.data.data.content || []);
    } catch { /* ignore */ }
  };

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = 'El código es obligatorio';
    if (!form.firstName.trim()) e.firstName = 'El nombre es obligatorio';
    if (!form.lastName.trim()) e.lastName = 'El apellido es obligatorio';
    if (!form.documentNumber.trim()) e.documentNumber = 'El número de documento es obligatorio';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (resident?.id) {
        await update(resident.id, form);
        toast.success('Residente actualizado');
      } else {
        await create(form);
        toast.success('Residente creado');
      }
      onSaved?.();
      onClose();
    } catch {
      toast.error('Error al guardar residente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={resident?.id ? 'Editar Residente' : 'Nuevo Residente'}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <ImageUpload value={form.photoUrl} onChange={(url) => setField('photoUrl', url)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Código" error={errors.code}>
            <input value={form.code} onChange={(e) => setField('code', e.target.value)} className="input-field" />
          </Field>
          <Field label="Estado">
            <ColorSelect value={form.status} onChange={(v) => setField('status', v)}
              options={statusOptions} colorMap={statusColors} />
          </Field>
          <Field label="Nombre" error={errors.firstName}>
            <input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} className="input-field" />
          </Field>
          <Field label="Apellido" error={errors.lastName}>
            <input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} className="input-field" />
          </Field>
          <Field label="Tipo de Documento">
            <select value={form.documentType} onChange={(e) => setField('documentType', e.target.value)} className="input-field">
              {documentTypes.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Número de Documento" error={errors.documentNumber}>
            <input value={form.documentNumber} onChange={(e) => setField('documentNumber', e.target.value)} className="input-field" />
          </Field>
          <Field label="Fecha de Nacimiento">
            <input type="date" value={form.birthDate} onChange={(e) => setField('birthDate', e.target.value)} className="input-field" />
          </Field>
          <Field label="Género">
            <select value={form.gender} onChange={(e) => setField('gender', e.target.value)} className="input-field">
              {genders.map(g => <option key={g} value={g}>{g === 'MALE' ? 'Masculino' : g === 'FEMALE' ? 'Femenino' : 'Otro'}</option>)}
            </select>
          </Field>
          <Field label="Fecha de Ingreso">
            <input type="date" value={form.entryDate} onChange={(e) => setField('entryDate', e.target.value)} className="input-field" />
          </Field>
          <Field label="Fecha de Salida">
            <input type="date" value={form.exitDate} onChange={(e) => setField('exitDate', e.target.value)} className="input-field" />
          </Field>
          <Field label="Habitación">
            <select value={form.roomId} onChange={(e) => setField('roomId', e.target.value)} className="input-field">
              <option value="">-- Ninguno --</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.code} - {r.name}</option>)}
            </select>
          </Field>
        </div>

        <h4 className="text-sm font-bold text-slate-800 mt-4 mb-2">Información del Tutor</h4>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre del Tutor">
            <input value={form.guardianName} onChange={(e) => setField('guardianName', e.target.value)} className="input-field" />
          </Field>
          <Field label="Teléfono del Tutor">
            <input value={form.guardianPhone} onChange={(e) => setField('guardianPhone', e.target.value)} className="input-field" />
          </Field>
          <Field label="Email del Tutor">
            <input type="email" value={form.guardianEmail} onChange={(e) => setField('guardianEmail', e.target.value)} className="input-field" />
          </Field>
          <Field label="Parentesco del Tutor">
            <input value={form.guardianRelationship} onChange={(e) => setField('guardianRelationship', e.target.value)} className="input-field" />
          </Field>
        </div>

        <div className="mt-2">
          <Field label="Información Médica">
            <textarea value={form.medicalInfo} onChange={(e) => setField('medicalInfo', e.target.value)}
              className="input-field resize-y" rows={2} />
          </Field>
        </div>
        <div className="mt-2">
          <Field label="Restricciones Dietéticas">
            <input value={form.dietaryRestrictions} onChange={(e) => setField('dietaryRestrictions', e.target.value)} className="input-field" />
          </Field>
        </div>
        <div className="mt-2">
          <Field label="Notas">
            <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)}
              className="input-field resize-y" rows={2} />
          </Field>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {resident?.id ? 'Actualizar' : 'Crear'}
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
