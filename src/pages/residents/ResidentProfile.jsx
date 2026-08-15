import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, User, Shield, Download, Pill, Stethoscope, AlertTriangle, Syringe, Activity, ClipboardList, HeartPulse, FileText as FileTextIcon, Edit, Eye, Camera, Loader2, ImagePlus, Plus, X, Clock, History } from 'lucide-react';
import { getById } from '../../api/residents';
import Swal from 'sweetalert2';
import { getByResident } from '../../api/clinicalRecords';
import { getAttachments } from '../../api/clinicalRecords';
import { getMedicationsByResident, createMedication, updateMedication, deleteMedication } from '../../api/medications';
import api from '../../api/axios';

const TYPE_CONFIG = {
  CONSULTA: { icon: Stethoscope, label: 'Consulta', color: '#3b82f6', bg: '#dbeafe' },
  MEDICACION: { icon: Pill, label: 'Medicación', color: '#16a34a', bg: '#dcfce7' },
  VACUNA: { icon: Syringe, label: 'Vacuna', color: '#f59e0b', bg: '#fef3c7' },
  ALERGIA: { icon: AlertTriangle, label: 'Alergia', color: '#dc2626', bg: '#fee2e2' },
  DIAGNOSTICO: { icon: ClipboardList, label: 'Diagnóstico', color: '#8b5cf6', bg: '#ede9fe' },
  PROCEDIMIENTO: { icon: Activity, label: 'Procedimiento', color: '#0891b2', bg: '#cffafe' },
  SIGNOS_VITALES: { icon: HeartPulse, label: 'Signos Vitales', color: '#ec4899', bg: '#fce7f3' },
  NOTA: { icon: FileTextIcon, label: 'Nota', color: '#64748b', bg: '#f1f5f9' },
  EXAMEN: { icon: ImagePlus, label: 'Examen', color: '#0ea5e9', bg: '#e0f2fe' },
};

const statusColors = { ACTIVE: '#16a34a', INACTIVE: '#94a3b8', TRANSFERRED: '#3b82f6', DISCHARGED: '#dc2626' };
const statusLabels = { ACTIVE: 'Activo', INACTIVE: 'Inactivo', TRANSFERRED: 'Transferido', DISCHARGED: 'Dado de Alta' };

const cardStyle = { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const sectionTitle = { margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 };
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 };
const valueStyle = { fontSize: 14, color: '#1e293b' };
const backBtn = { background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' };
const primaryBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, textDecoration: 'none' };
const secondaryBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, opacity: 1 };
const InfoRow = ({ label, value }) => (
  <div>
    <span style={labelStyle}>{label}</span>
    <span style={valueStyle}>{value || '-'}</span>
  </div>
);

export default function ResidentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resident, setResident] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  const handleDownload = (url, filename) => {
    fetch(url, { mode: 'cors' })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.download = filename || 'archivo';
        a.click();
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => toast.error('Error al descargar'));
  };
  const [recordAttachments, setRecordAttachments] = useState({});
  const [medications, setMedications] = useState([]);
  const [showMedModal, setShowMedModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [medForm, setMedForm] = useState({
    medicationName: '', dosage: '', frequencyHours: 8, administrationRoute: 'ORAL',
    startDate: '', endDate: '', instructions: '', prescribedBy: '', status: 'ACTIVE', notes: ''
  });
  const [downloadingMedPdf, setDownloadingMedPdf] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resRes, recRes, medRes] = await Promise.all([
          getById(id),
          getByResident(id, { page: 0, size: 50 }),
          getMedicationsByResident(id)
        ]);
        setResident(resRes.data.data);
        setRecords(recRes.data.data.content || []);
        setMedications(medRes.data || []);
      } catch (e) {
        toast.error('Error al cargar perfil');
        navigate('/residentes');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    if (records.length > 0) {
      records.forEach(r => {
        if (!recordAttachments[r.id]) {
          getAttachments(r.id).then(res => {
            setRecordAttachments(prev => ({ ...prev, [r.id]: res.data.data || [] }));
          }).catch(() => {});
        }
      });
    }
  }, [records]);

  const handleDownloadPdf = async () => {
    if (!resident) return;
    setDownloadingPdf(true);
    try {
      const res = await api.get(`/residents/${resident.id}/report`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `ficha-${resident.firstName}-${resident.lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('PDF descargado');
    } catch (e) {
      toast.error('Error al descargar PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadMedPdf = async () => {
    if (!resident) return;
    setDownloadingMedPdf(true);
    try {
      const res = await api.get(`/residents/${resident.id}/medications-report`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `medicamentos-${resident.firstName}-${resident.lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('PDF de medicamentos descargado');
    } catch (e) {
      toast.error('Error al descargar PDF');
    } finally {
      setDownloadingMedPdf(false);
    }
  };

  const openAddMed = () => {
    setEditingMed(null);
    setMedForm({
      medicationName: '', dosage: '', frequencyHours: 8, administrationRoute: 'ORAL',
      startDate: new Date().toISOString().split('T')[0], endDate: '',
      instructions: '', prescribedBy: '', status: 'ACTIVE', notes: ''
    });
    setShowMedModal(true);
  };

  const openEditMed = (med) => {
    setEditingMed(med);
    setMedForm({
      medicationName: med.medicationName,
      dosage: med.dosage,
      frequencyHours: med.frequencyHours,
      administrationRoute: med.administrationRoute,
      startDate: med.startDate || '',
      endDate: med.endDate || '',
      instructions: med.instructions || '',
      prescribedBy: med.prescribedBy || '',
      status: med.status,
      notes: med.notes || ''
    });
    setShowMedModal(true);
  };

  const handleSaveMed = async () => {
    if (!medForm.medicationName.trim()) { toast.warning('Nombre del medicamento requerido'); return; }
    if (!medForm.dosage.trim()) { toast.warning('Dosis requerida'); return; }
    if (!medForm.startDate) { toast.warning('Fecha de inicio requerida'); return; }
    try {
      const payload = { ...medForm, residentId: Number(id) };
      if (editingMed) {
        await updateMedication(editingMed.id, payload);
        toast.success('Medicamento actualizado');
      } else {
        await createMedication(payload);
        toast.success('Medicamento registrado');
      }
      const medRes = await getMedicationsByResident(id);
      setMedications(medRes.data.data || []);
      setShowMedModal(false);
    } catch (e) {
      toast.error('Error al guardar medicamento');
    }
  };

  const handleDeleteMed = async (medId) => {
    Swal.fire({
      title: 'Eliminar Medicamento',
      text: '¿Está seguro de eliminar este medicamento?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteMedication(medId);
          setMedications(prev => prev.filter(m => m.id !== medId));
          toast.success('Medicamento eliminado');
        } catch { toast.error('Error al eliminar'); }
      }
    });
  };

  const routeLabels = { ORAL: 'Oral', INTRAVENOUS: 'Intravenosa', INTRAMUSCULAR: 'Intramuscular', TOPICAL: 'Tópica', SUBLINGUAL: 'Sublingual' };
  const medStatusLabels = { ACTIVE: 'Activo', SUSPENDED: 'Suspendido', COMPLETED: 'Completado' };
  const medStatusColors = { ACTIVE: '#16a34a', SUSPENDED: '#f59e0b', COMPLETED: '#64748b' };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando...</div>;
  if (!resident) return <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>Residente no encontrado</div>;

  const age = resident.birthDate ? new Date().getFullYear() - new Date(resident.birthDate).getFullYear() : '-';

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
      await api.put(`/residents/${resident.id}`, { ...resident, photoUrl: url });
      setResident({ ...resident, photoUrl: url });
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
          <button onClick={() => navigate('/residentes')} style={backBtn} title="Volver">
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
              ) : resident.photoUrl ? (
                <img src={resident.photoUrl} alt={`${resident.firstName} ${resident.lastName}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 42, fontWeight: 700, color: '#6366f1' }}>
                  {(resident.firstName?.[0] || '').toUpperCase()}{(resident.lastName?.[0] || '').toUpperCase()}
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
              {resident.firstName} {resident.lastName}
            </h1>
            <span style={{ fontSize: 13, color: '#64748b' }}>Código: {resident.code}</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={handleDownloadPdf} disabled={downloadingPdf} style={secondaryBtn} title="Descargar PDF">
              <FileTextIcon size={16} /> {downloadingPdf ? 'Generando...' : 'Descargar PDF'}
            </button>
            <Link to={`/residentes/${resident.id}/historial`} style={{ ...primaryBtn, background: '#7c3aed' }}>
              <History size={16} /> Historial
            </Link>
            <Link to="/residentes" state={{ editResident: resident }} style={primaryBtn}>
              <Edit size={16} /> Editar
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, marginBottom: 24 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            <div style={cardStyle}>
              <h2 style={sectionTitle}><User size={18} /> Datos Personales</h2>
              <div style={grid2}>
                <InfoRow label="Nombre completo" value={`${resident.firstName} ${resident.lastName}`} />
                <InfoRow label="Edad" value={`${age} años`} />
                <InfoRow label="Fecha nacimiento" value={resident.birthDate ? new Date(resident.birthDate).toLocaleDateString('es-ES') : '-'} />
                <InfoRow label="Género" value={resident.gender === 'MALE' ? 'Masculino' : resident.gender === 'FEMALE' ? 'Femenino' : resident.gender === 'OTHER' ? 'Otro' : resident.gender || '-'} />
                <InfoRow label="Tipo documento" value={resident.documentType || '-'} />
                <InfoRow label="Número documento" value={resident.documentNumber || '-'} />
                <InfoRow label="Fecha ingreso" value={resident.entryDate ? new Date(resident.entryDate).toLocaleDateString('es-ES') : '-'} />
                <InfoRow label="Estado" value={<span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: statusColors[resident.status] || '#94a3b8' }}>{statusLabels[resident.status] || resident.status}</span>} />
                <InfoRow label="Habitación" value={resident.roomName || '-'} />
              </div>
            </div>

            {(resident.medicalInfo || resident.dietaryRestrictions || resident.notes) && (
              <div style={cardStyle}>
                <h2 style={sectionTitle}><Shield size={18} /> Información Médica y Dietética</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {resident.medicalInfo && (
                    <div>
                      <span style={labelStyle}>Información Médica</span>
                      <p style={{ margin: 4, color: '#1e293b', whiteSpace: 'pre-wrap' }}>{resident.medicalInfo}</p>
                    </div>
                  )}
                  {resident.dietaryRestrictions && (
                    <div>
                      <span style={labelStyle}>Restricciones Alimentarias</span>
                      <p style={{ margin: 4, color: '#1e293b', whiteSpace: 'pre-wrap' }}>{resident.dietaryRestrictions}</p>
                    </div>
                  )}
                  {resident.notes && (
                    <div>
                      <span style={labelStyle}>Notas Adicionales</span>
                      <p style={{ margin: 4, color: '#1e293b', whiteSpace: 'pre-wrap' }}>{resident.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {resident.guardianName && (
              <div style={cardStyle}>
                <h2 style={sectionTitle}><User size={18} /> Tutor / Contacto de Emergencia</h2>
                <div style={grid2}>
                  <InfoRow label="Nombre" value={resident.guardianName} />
                  <InfoRow label="Parentesco" value={resident.guardianRelationship || '-'} />
                  <InfoRow label="Teléfono" value={resident.guardianPhone || '-'} />
                  <InfoRow label="Email" value={resident.guardianEmail || '-'} />
                </div>
              </div>
            )}

          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={sectionTitle}><Pill size={18} /> Medicamentos Prescritos</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleDownloadMedPdf} disabled={downloadingMedPdf} style={secondaryBtn} title="Descargar PDF medicamentos">
                <FileTextIcon size={14} /> {downloadingMedPdf ? 'Generando...' : 'PDF Medicamentos'}
              </button>
              <button onClick={openAddMed} style={{ ...primaryBtn, background: '#16a34a' }}>
                <Plus size={14} /> Agregar Medicamento
              </button>
            </div>
          </div>

          {medications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
              <Pill size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
              <p>Sin medicamentos registrados</p>
              <button onClick={openAddMed} style={{ ...primaryBtn, background: '#16a34a', marginTop: 12 }}>
                <Plus size={14} /> Registrar primer medicamento
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Medicamento</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Dosis</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Frecuencia</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Vía</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Inicio</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Fin</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Indicaciones</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Estado</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', color: '#1e293b', fontWeight: 600 }}>{m.medicationName}</td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>{m.dosage}</td>
                    <td style={{ padding: '10px 12px', color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color="#64748b" /> {m.frequencyHours}h
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>{routeLabels[m.administrationRoute] || m.administrationRoute}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12 }}>{m.startDate ? new Date(m.startDate).toLocaleDateString('es-ES') : '-'}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12 }}>{m.endDate ? new Date(m.endDate).toLocaleDateString('es-ES') : '-'}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.instructions}>{m.instructions || '-'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, color: '#fff', background: medStatusColors[m.status] || '#94a3b8' }}>
                        {medStatusLabels[m.status] || m.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', display: 'flex', gap: 4 }}>
                      <button onClick={() => openEditMed(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4, color: '#2563eb' }} title="Editar">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDeleteMed(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4, color: '#dc2626' }} title="Eliminar">
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ ...cardStyle, marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={sectionTitle}><HeartPulse size={18} /> Historial Clínico</h2>
            <Link to={`/fichas-clinicas/${resident.id}`} style={primaryBtn}><Eye size={14} /> Ver Historia Completa</Link>
          </div>

          {records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
              <ClipboardList size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
              <p>Sin registros clínicos</p>
              <Link to={`/fichas-clinicas/${resident.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '8px 16px', background: '#2563eb', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
                <FileTextIcon size={14} /> Crear primer registro
              </Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Fecha</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Tipo</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Descripción</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Diagnóstico</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Médico</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b' }}>Archivos</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const cfg = TYPE_CONFIG[r.recordType] || TYPE_CONFIG.NOTA;
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', color: '#1e293b', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {r.recordDate ? new Date(r.recordDate).toLocaleDateString('es-ES') : '-'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                          <cfg.icon size={10} /> {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{r.description || '-'}</td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>{r.diagnosis || '-'}</td>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12 }}>{r.doctorName || '-'}</td>
                      <td style={{ padding: '10px 12px' }}>
                         {(recordAttachments[r.id] || []).length > 0 ? (() => {
                           const imgs = recordAttachments[r.id];
                           return <div style={{ display: 'flex', gap: 4 }}>{imgs.slice(0, 3).map((att) => (
                             <img key={att.id} src={att.fileUrl} alt="" onClick={() => setLightboxImg(att.fileUrl)}
                               style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover', border: '1px solid #e2e8f0', cursor: 'pointer' }} />
                           ))}{imgs.length > 3 && <span style={{ fontSize: 10, color: '#94a3b8', alignSelf: 'center' }}>+{imgs.length - 3}</span>}</div>;
                         })() : '-'}
                       </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showMedModal && (
        <div onClick={() => setShowMedModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 520,
            maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                {editingMed ? 'Editar Medicamento' : 'Agregar Medicamento'}
              </h3>
              <button onClick={() => setShowMedModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nombre del medicamento *</label>
                <input value={medForm.medicationName} onChange={e => setMedForm({ ...medForm, medicationName: e.target.value })}
                  placeholder="Ej: Paracetamol" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Dosis *</label>
                  <input value={medForm.dosage} onChange={e => setMedForm({ ...medForm, dosage: e.target.value })}
                    placeholder="Ej: 500mg" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
                </div>
                <div>
                  <label style={labelStyle}>Frecuencia (horas) *</label>
                  <input type="number" min="1" value={medForm.frequencyHours} onChange={e => setMedForm({ ...medForm, frequencyHours: parseInt(e.target.value) || 8 })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Vía de administración</label>
                  <select value={medForm.administrationRoute} onChange={e => setMedForm({ ...medForm, administrationRoute: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff' }}>
                    <option value="ORAL">Oral</option>
                    <option value="INTRAVENOUS">Intravenosa</option>
                    <option value="INTRAMUSCULAR">Intramuscular</option>
                    <option value="TOPICAL">Tópica</option>
                    <option value="SUBLINGUAL">Sublingual</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Estado</label>
                  <select value={medForm.status} onChange={e => setMedForm({ ...medForm, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff' }}>
                    <option value="ACTIVE">Activo</option>
                    <option value="SUSPENDED">Suspendido</option>
                    <option value="COMPLETED">Completado</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Fecha de inicio *</label>
                  <input type="date" value={medForm.startDate} onChange={e => setMedForm({ ...medForm, startDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
                </div>
                <div>
                  <label style={labelStyle}>Fecha de fin</label>
                  <input type="date" value={medForm.endDate} onChange={e => setMedForm({ ...medForm, endDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Indicaciones</label>
                <input value={medForm.instructions} onChange={e => setMedForm({ ...medForm, instructions: e.target.value })}
                  placeholder="Ej: Con alimentos, antes de dormir" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
              </div>

              <div>
                <label style={labelStyle}>Prescrito por</label>
                <input value={medForm.prescribedBy} onChange={e => setMedForm({ ...medForm, prescribedBy: e.target.value })}
                  placeholder="Nombre del médico" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }} />
              </div>

              <div>
                <label style={labelStyle}>Notas</label>
                <textarea rows={2} value={medForm.notes} onChange={e => setMedForm({ ...medForm, notes: e.target.value })}
                  placeholder="Observaciones generales" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => setShowMedModal(false)} style={secondaryBtn}>Cancelar</button>
              <button onClick={handleSaveMed} style={{ ...primaryBtn, background: '#16a34a' }}>
                {editingMed ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxImg && (
        <div onClick={() => setLightboxImg(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }}>
          <img src={lightboxImg} alt="" style={{ maxWidth: '90%', maxHeight: '80%', borderRadius: 8 }} />
          <button onClick={() => handleDownload(lightboxImg, 'examen.png')}
            style={{ marginTop: 16, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <Download size={18} /> Descargar imagen
          </button>
        </div>
      )}
    </div>
  );
}