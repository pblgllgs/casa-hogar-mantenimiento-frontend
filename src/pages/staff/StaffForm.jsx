import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save, Loader2 } from 'lucide-react';
import Modal from '../../components/Modal';
import ImageUpload from '../../components/ImageUpload';
import { create, update } from '../../api/staff';
import { getAll as getShifts } from '../../api/shifts';
import ColorSelect from '../../components/ColorSelect';

const documentTypes = ['CC', 'CE', 'TI', 'RC', 'PA', 'DNI'];
const genders = ['MALE', 'FEMALE', 'OTHER'];
const statusOptions = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'ON_LEAVE', label: 'Permiso' },
  { value: 'TERMINATED', label: 'Retirado' },
];
const statusColors = { ACTIVE: '#16a34a', INACTIVE: '#94a3b8', ON_LEAVE: '#f59e0b', TERMINATED: '#dc2626' };

const emptyForm = {
  employeeCode: '', userId: '', firstName: '', lastName: '', documentType: 'CC',
  documentNumber: '', birthDate: '', gender: 'MALE', hireDate: '', terminationDate: '',
  position: '', department: '', shiftId: '', phone: '', emergencyContactName: '',
  emergencyContactPhone: '', bankAccount: '', salary: '', status: 'ACTIVE', isActive: true,
  photoUrl: '',
};

export default function StaffForm({ isOpen, onClose, staffMember, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(staffMember ? { ...emptyForm, ...staffMember } : emptyForm);
      setErrors({});
      loadShifts();
    }
  }, [isOpen, staffMember]);

  const loadShifts = async () => {
    try {
      const res = await getShifts({ size: 200 });
      setShifts(res.data.data.content || []);
    } catch { /* ignore */ }
  };

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.employeeCode.trim()) e.employeeCode = 'El código de empleado es obligatorio';
    if (!form.firstName.trim()) e.firstName = 'El nombre es obligatorio';
    if (!form.lastName.trim()) e.lastName = 'El apellido es obligatorio';
    if (form.salary && isNaN(Number(form.salary))) e.salary = 'Debe ser un número';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (staffMember?.id) {
        await update(staffMember.id, form);
        toast.success('Personal actualizado');
      } else {
        await create(form);
        toast.success('Personal creado');
      }
      onSaved?.();
      onClose();
    } catch {
      toast.error('Error al guardar personal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={staffMember?.id ? 'Editar Personal' : 'Nuevo Personal'}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <ImageUpload value={form.photoUrl} onChange={(url) => setField('photoUrl', url)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Código de Empleado" error={errors.employeeCode}>
            <input value={form.employeeCode} onChange={(e) => setField('employeeCode', e.target.value)} className="input-field" />
          </Field>
          <Field label="ID de Usuario (opcional)">
            <input value={form.userId} onChange={(e) => setField('userId', e.target.value)} className="input-field" />
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
          <Field label="Número de Documento">
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
          <Field label="Fecha de Contratación">
            <input type="date" value={form.hireDate} onChange={(e) => setField('hireDate', e.target.value)} className="input-field" />
          </Field>
          <Field label="Fecha de Terminación">
            <input type="date" value={form.terminationDate} onChange={(e) => setField('terminationDate', e.target.value)} className="input-field" />
          </Field>
          <Field label="Cargo">
            <input value={form.position} onChange={(e) => setField('position', e.target.value)} className="input-field" />
          </Field>
          <Field label="Departamento">
            <input value={form.department} onChange={(e) => setField('department', e.target.value)} className="input-field" />
          </Field>
          <Field label="Turno">
            <select value={form.shiftId} onChange={(e) => setField('shiftId', e.target.value)} className="input-field">
              <option value="">-- Ninguno --</option>
              {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Teléfono">
            <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} className="input-field" />
          </Field>
          <Field label="Salario" error={errors.salary}>
            <input type="number" step="0.01" value={form.salary} onChange={(e) => setField('salary', e.target.value)} className="input-field" />
          </Field>
          <Field label="Cuenta Bancaria">
            <input value={form.bankAccount} onChange={(e) => setField('bankAccount', e.target.value)} className="input-field" />
          </Field>
          <Field label="Estado">
            <ColorSelect value={form.status} onChange={(v) => setField('status', v)}
              options={statusOptions} colorMap={statusColors} />
          </Field>
        </div>

        <h4 className="text-sm font-bold text-slate-800 mt-4 mb-2">Contacto de Emergencia</h4>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre de Contacto">
            <input value={form.emergencyContactName} onChange={(e) => setField('emergencyContactName', e.target.value)} className="input-field" />
          </Field>
          <Field label="Teléfono de Contacto">
            <input value={form.emergencyContactPhone} onChange={(e) => setField('emergencyContactPhone', e.target.value)} className="input-field" />
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
            {staffMember?.id ? 'Actualizar' : 'Crear'}
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
