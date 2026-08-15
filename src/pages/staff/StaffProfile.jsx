import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, User, Briefcase, Shield, Edit, Clock, CreditCard, Camera, Loader2 } from 'lucide-react';
import { getById, update } from '../../api/staff';
import api from '../../api/axios';

const statusColors = { ACTIVE: '#16a34a', INACTIVE: '#94a3b8', ON_LEAVE: '#f59e0b', TERMINATED: '#dc2626' };
const statusLabels = { ACTIVE: 'Activo', INACTIVE: 'Inactivo', ON_LEAVE: 'Permiso', TERMINATED: 'Retirado' };

const cardStyle = { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const sectionTitle = { margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 };
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 };
const valueStyle = { fontSize: 14, color: '#1e293b' };
const backBtn = { background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' };
const primaryBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, textDecoration: 'none' };

const InfoRow = ({ label, value }) => (
  <div>
    <span style={labelStyle}>{label}</span>
    <span style={valueStyle}>{value || '-'}</span>
  </div>
);

export default function StaffProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getById(id);
        setStaff(res.data.data);
      } catch {
        toast.error('Error al cargar perfil');
        navigate('/personal');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando...</div>;
  if (!staff) return <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>Personal no encontrado</div>;

  const age = staff.birthDate ? new Date().getFullYear() - new Date(staff.birthDate).getFullYear() : null;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.warning('La imagen no puede superar 5MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.warning('Use formato JPG, PNG o WebP'); return; }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { url } = uploadRes.data.data;
      await update(id, { ...staff, photoUrl: url });
      setStaff({ ...staff, photoUrl: url });
      toast.success('Foto actualizada');
    } catch {
      toast.error('Error al subir foto');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ padding: 0, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate('/personal')} style={backBtn} title="Volver">
            <ArrowLeft size={20} />
          </button>
          <div style={{ position: 'relative', width: 165, height: 165, flexShrink: 0 }}
            onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.cursor = 'pointer'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.cursor = 'default'; }}
          >
            <div style={{
              width: 165, height: 165, borderRadius: '50%', overflow: 'hidden',
              border: '3px solid #e2e8f0', background: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
            }}>
              {uploadingPhoto ? (
                <Loader2 size={32} color="#94a3b8" className="spin" />
              ) : staff.photoUrl ? (
                <img src={staff.photoUrl} alt={`${staff.firstName} ${staff.lastName}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 42, fontWeight: 700, color: '#6366f1' }}>
                  {(staff.firstName?.[0] || '').toUpperCase()}{(staff.lastName?.[0] || '').toUpperCase()}
                </span>
              )}
            </div>
            {!uploadingPhoto && (
              <div style={{
                position: 'absolute', bottom: 4, right: 4, width: 36, height: 36, borderRadius: '50%',
                background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '3px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}>
                <Camera size={16} color="#fff" />
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload} style={{ display: 'none' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#1e293b' }}>
              {staff.firstName} {staff.lastName}
            </h1>
            <span style={{ fontSize: 13, color: '#64748b' }}>Código: {staff.employeeCode}</span>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: statusColors[staff.status] || '#94a3b8' }}>
                {statusLabels[staff.status] || staff.status}
              </span>
              {staff.shift && (
                <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#3b82f6', background: '#dbeafe' }}>
                  {staff.shift}
                </span>
              )}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Link to="/personal" state={{ editStaff: staff }} style={primaryBtn}>
              <Edit size={16} /> Editar
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, marginBottom: 24 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            <div style={cardStyle}>
              <h2 style={sectionTitle}><User size={18} /> Datos Personales</h2>
              <div style={grid2}>
                <InfoRow label="Nombre completo" value={`${staff.firstName} ${staff.lastName}`} />
                {age != null && <InfoRow label="Edad" value={`${age} años`} />}
                <InfoRow label="Fecha nacimiento" value={staff.birthDate ? new Date(staff.birthDate).toLocaleDateString('es-ES') : '-'} />
                <InfoRow label="Género" value={staff.gender === 'MALE' ? 'Masculino' : staff.gender === 'FEMALE' ? 'Femenino' : staff.gender || '-'} />
                <InfoRow label="Tipo documento" value={staff.documentType || '-'} />
                <InfoRow label="Número documento" value={staff.documentNumber || '-'} />
                <InfoRow label="Teléfono" value={staff.phone || '-'} />
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={sectionTitle}><Briefcase size={18} /> Datos Laborales</h2>
              <div style={grid2}>
                <InfoRow label="Cargo" value={staff.position || '-'} />
                <InfoRow label="Departamento" value={staff.department || '-'} />
                <InfoRow label="Fecha de contratación" value={staff.hireDate ? new Date(staff.hireDate).toLocaleDateString('es-ES') : '-'} />
                {staff.terminationDate && (
                  <InfoRow label="Fecha de terminación" value={new Date(staff.terminationDate).toLocaleDateString('es-ES')} />
                )}
                <InfoRow label="Turno" value={staff.shift || '-'} />
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {staff.emergencyContactName && (
              <div style={cardStyle}>
                <h2 style={sectionTitle}><Shield size={18} /> Contacto de Emergencia</h2>
                <div style={grid2}>
                  <InfoRow label="Nombre" value={staff.emergencyContactName} />
                  <InfoRow label="Teléfono" value={staff.emergencyContactPhone || '-'} />
                </div>
              </div>
            )}

            <div style={cardStyle}>
              <h2 style={sectionTitle}><CreditCard size={18} /> Información Financiera</h2>
              <div style={grid2}>
                <InfoRow label="Salario" value={staff.salary ? `$${Number(staff.salary).toLocaleString('es-CL')}` : '-'} />
                <InfoRow label="Cuenta bancaria" value={staff.bankAccount || '-'} />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
