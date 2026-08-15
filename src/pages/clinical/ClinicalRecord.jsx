import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { User, Plus, Pencil, Trash2, HeartPulse, Pill, Syringe, AlertTriangle, Stethoscope, Activity, FileText, ClipboardList, ImagePlus, Paperclip, X, Loader2, Download } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Swal from 'sweetalert2';
import Modal from '../../components/Modal';
import { getAll as getResidents } from '../../api/residents';
import { getByResident, create, update, remove as deleteRecord, getAttachments, addAttachment, removeAttachment } from '../../api/clinicalRecords';
import api from '../../api/axios';

const TYPE_CONFIG = {
  CONSULTA: { icon: Stethoscope, label: 'Consulta', color: '#3b82f6', bg: '#dbeafe' },
  MEDICACION: { icon: Pill, label: 'Medicación', color: '#16a34a', bg: '#dcfce7' },
  VACUNA: { icon: Syringe, label: 'Vacuna', color: '#f59e0b', bg: '#fef3c7' },
  ALERGIA: { icon: AlertTriangle, label: 'Alergia', color: '#dc2626', bg: '#fee2e2' },
  DIAGNOSTICO: { icon: ClipboardList, label: 'Diagnóstico', color: '#8b5cf6', bg: '#ede9fe' },
  PROCEDIMIENTO: { icon: Activity, label: 'Procedimiento', color: '#0891b2', bg: '#cffafe' },
  SIGNOS_VITALES: { icon: HeartPulse, label: 'Signos Vitales', color: '#ec4899', bg: '#fce7f3' },
  NOTA: { icon: FileText, label: 'Nota', color: '#64748b', bg: '#f1f5f9' },
  EXAMEN: { icon: ImagePlus, label: 'Examen', color: '#0ea5e9', bg: '#e0f2fe' },
};

export default function ClinicalRecord() {
  const { residentId } = useParams();
  const [residents, setResidents] = useState([]);
  const [selectedResident, setSelectedResident] = useState(residentId || '');
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileInputRef = useRef(null);
  const attachFileRef = useRef(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [recordAttachments, setRecordAttachments] = useState({});
  const [attachTarget, setAttachTarget] = useState(null);
  const [attachUploading, setAttachUploading] = useState(false);
  const [identifierOpen, setIdentifierOpen] = useState(false);
  const [identifierValue, setIdentifierValue] = useState('');
  const pendingFileRef = useRef(null);
  const pendingUploadContext = useRef(null);

  const [formData, setFormData] = useState({
    recordDate: new Date().toISOString().split('T')[0],
    recordType: 'CONSULTA',
    description: '',
    diagnosis: '',
    treatment: '',
    medication: '',
    dosage: '',
    doctorName: '',
    notes: '',
  });

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const res = await getResidents({ page: 0, size: 100 });
        setResidents(res.data.data.content || []);
      } catch { setResidents([]); }
    };
    fetchResidents();
  }, []);

  const fetchRecords = async () => {
    if (!selectedResident) return;
    setLoading(true);
    try {
      const res = await getByResident(selectedResident, { page, size: 10 });
      const d = res.data.data;
      setRecords(d.content || []);
      setTotalPages(d.totalPages || 0);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (selectedResident) { setPage(0); fetchRecords(); } }, [selectedResident]);
  useEffect(() => { if (selectedResident) fetchRecords(); }, [page]);

  useEffect(() => {
    if (records.length > 0) {
      records.forEach(r => {
        if (!recordAttachments[r.id]) loadAttachments(r.id);
      });
    }
  }, [records]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      recordDate: new Date().toISOString().split('T')[0],
      recordType: 'CONSULTA',
      description: '',
      diagnosis: '',
      treatment: '',
      medication: '',
      dosage: '',
      doctorName: '',
      notes: '',
    });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setFormData({
      recordDate: row.recordDate || '',
      recordType: row.recordType || 'CONSULTA',
      description: row.description || '',
      diagnosis: row.diagnosis || '',
      treatment: row.treatment || '',
      medication: row.medication || '',
      dosage: row.dosage || '',
      doctorName: row.doctorName || '',
      notes: row.notes || '',
    });
    loadAttachments(row.id);
    setFormOpen(true);
  };

  const loadAttachments = async (recordId) => {
      try {
        const res = await getAttachments(recordId);
        setRecordAttachments(prev => ({ ...prev, [recordId]: res.data.data || [] }));
      } catch { /* ignore */ }
    };

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

  const buildAttachmentName = (record, identifier) => {
    const name = (record.residentName || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').toLowerCase();
    const type = (record.recordType || 'examen').toLowerCase();
    const date = record.recordDate || new Date().toISOString().split('T')[0];
    const id = (identifier || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').toLowerCase().replace(/^_|_$/g, '');
    return `${name}_${type}_${date}_${id}`;
  };

  const promptIdentifier = (file, context) => {
    pendingFileRef.current = file;
    pendingUploadContext.current = context;
    setIdentifierValue('');
    setIdentifierOpen(true);
  };

  const confirmIdentifier = async () => {
    const file = pendingFileRef.current;
    const ctx = pendingUploadContext.current;
    if (!file || !ctx || !identifierValue.trim()) return;
    setIdentifierOpen(false);
    if (ctx.type === 'edit') {
      setUploadingImg(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const uploadRes = await api.post('/uploads/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const url = uploadRes.data.data.url;
        const attName = buildAttachmentName(ctx.record, identifierValue.trim());
        await addAttachment({ clinicalRecordId: ctx.record.id, fileUrl: url, fileName: attName, fileType: file.type });
        await loadAttachments(ctx.record.id);
        toast.success('Imagen adjuntada');
      } catch {
        toast.error('Error al subir imagen');
      } finally {
        setUploadingImg(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else {
      setAttachUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const uploadRes = await api.post('/uploads/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const url = uploadRes.data.data.url;
        const attName = buildAttachmentName(ctx.record, identifierValue.trim());
        await addAttachment({ clinicalRecordId: ctx.record.id, fileUrl: url, fileName: attName, fileType: file.type });
        await loadAttachments(ctx.record.id);
        toast.success('Archivo adjuntado');
      } catch {
        toast.error('Error al subir archivo');
      } finally {
        setAttachUploading(false);
        if (attachFileRef.current) attachFileRef.current.value = '';
      }
    }
    pendingFileRef.current = null;
    pendingUploadContext.current = null;
  };

  const cancelIdentifier = () => {
    setIdentifierOpen(false);
    pendingFileRef.current = null;
    pendingUploadContext.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (attachFileRef.current) attachFileRef.current.value = '';
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.warning('La imagen no puede superar 5MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.warning('Use JPG, PNG o WebP'); return; }
    if (!editing?.id) return;
    promptIdentifier(file, { type: 'edit', record: editing });
  };

  const removeImageAttachment = async (attachmentId) => {
    Swal.fire({
      title: 'Eliminar Imagen',
      text: '¿Está seguro de eliminar esta imagen?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await removeAttachment(attachmentId);
          if (editing?.id) await loadAttachments(editing.id);
          toast.success('Imagen eliminada');
        } catch { toast.error('Error al eliminar imagen'); }
      }
    });
  };

  const handleSubmit = async () => {
    if (!selectedResident || !formData.recordDate) {
      toast.warning('Complete todos los campos requeridos');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formData, residentId: parseInt(selectedResident) };
      if (editing) {
        await update(editing.id, payload);
        toast.success('Registro clínico actualizado');
        setFormOpen(false);
        resetForm();
        fetchRecords();
      } else {
        const res = await create(payload);
        const newRecord = res.data.data;
        toast.success('Registro clínico creado');
        setEditing({ ...newRecord });
        loadAttachments(newRecord.id);
      }
    } catch (e) {
      console.error('Error guardando registro clínico:', e);
      toast.error(e.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    resetForm();
    fetchRecords();
  };

  const openAttach = (row) => {
    setAttachTarget(row);
    if (!recordAttachments[row.id]) loadAttachments(row.id);
  };

  const handleAttachUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !attachTarget) return;
    if (file.size > 5 * 1024 * 1024) { toast.warning('La imagen no puede superar 5MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.warning('Use JPG, PNG o WebP'); return; }
    promptIdentifier(file, { type: 'attach', record: attachTarget });
  };

  const handleAttachRemove = async (attachmentId) => {
    Swal.fire({
      title: 'Eliminar Archivo',
      text: '¿Está seguro de eliminar este archivo adjunto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await removeAttachment(attachmentId);
          await loadAttachments(attachTarget.id);
          toast.success('Archivo eliminado');
        } catch { toast.error('Error al eliminar archivo'); }
      }
    });
  };

  const columns = [
    {
      header: 'Fecha', accessor: 'recordDate',
      render: (row) => {
        const d = row.recordDate ? row.recordDate.split('-') : [];
        return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : row.recordDate;
      }
    },
    {
      header: 'Tipo', accessor: 'recordType',
      render: (row) => {
        const cfg = TYPE_CONFIG[row.recordType] || TYPE_CONFIG.NOTA;
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
            <cfg.icon size={12} /> {cfg.label}
          </span>
        );
      },
    },
    { header: 'Descripción', accessor: 'description' },
    { header: 'Diagnóstico', accessor: 'diagnosis' },
    { header: 'Médico', accessor: 'doctorName' },
    {
      header: 'Archivos', accessor: 'attachments',
      render: (row) => {
        const atts = recordAttachments[row.id] || [];
        if (!atts.length) return <span style={{ color: '#94a3b8' }}>-</span>;
        return (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {atts.slice(0, 3).map((att) => (
              <img key={att.id} src={att.fileUrl} alt="" title={att.fileName} onClick={() => setLightboxImg(att.fileUrl)}
                style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover', border: '1px solid #e2e8f0', cursor: 'pointer' }} />
            ))}
            {atts.length > 3 && <span style={{ fontSize: 10, color: '#94a3b8' }}>+{atts.length - 3}</span>}
          </div>
        );
      },
    },
    {
      header: 'Acciones', accessor: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => openAttach(row)} title="Adjuntar archivos" style={{ ...iconBtn, color: '#8b5cf6' }}><Paperclip size={16} /></button>
          <button onClick={() => openEdit(row)} style={{ ...iconBtn, color: '#3b82f6' }}><Pencil size={16} /></button>
          <button onClick={() => Swal.fire({ title: 'Eliminar Registro', text: `¿Eliminar el registro de ${TYPE_CONFIG[row.recordType]?.label || '?'} del ${row.recordDate || '?'}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' }).then(r => { if (r.isConfirmed) { deleteRecord(row.id).then(() => { toast.success('Registro clínico eliminado'); fetchRecords(); }).catch(() => toast.error('Error al eliminar')); } })} style={{ ...iconBtn, color: '#dc2626' }}><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  const isEditing = !!editing;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <HeartPulse size={22} color="#dc2626" /> Fichas Clínicas
        </h2>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={selectedResident} onChange={e => setSelectedResident(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }}>
          <option value="">Seleccionar residente...</option>
          {residents.map(r => (
            <option key={r.id} value={r.id}>{r.firstName} {r.lastName} - {r.code}</option>
          ))}
        </select>
        {selectedResident && (
          <button onClick={openCreate} style={createBtn}><Plus size={18} /> Nuevo Registro</button>
        )}
      </div>

      {!selectedResident ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <User size={40} style={{ marginBottom: 8, opacity: 0.4 }} />
          <div>Seleccione un residente para ver su ficha clínica</div>
        </div>
      ) : loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando...</div>
      ) : records.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          Sin registros clínicos para este residente
        </div>
      ) : (
        <DataTable columns={columns} data={records} page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <Modal isOpen={formOpen} onClose={handleCloseForm} title={isEditing ? 'Editar Registro Clínico' : 'Nuevo Registro Clínico'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 500 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Fecha *</label>
              <input type="date" name="recordDate" value={formData.recordDate} onChange={handleChange}
                style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Tipo *</label>
              <select name="recordType" value={formData.recordType} onChange={handleChange} style={inputStyle}>
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Descripción</label>
            <textarea name="description" value={formData.description} onChange={handleChange}
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
          </div>

          {(formData.recordType === 'CONSULTA' || formData.recordType === 'DIAGNOSTICO') && (
            <>
              <div>
                <label style={labelStyle}>Diagnóstico</label>
                <textarea name="diagnosis" value={formData.diagnosis} onChange={handleChange}
                  style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>Tratamiento</label>
                <textarea name="treatment" value={formData.treatment} onChange={handleChange}
                  style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
              </div>
            </>
          )}

          {formData.recordType === 'MEDICACION' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Medicamento</label>
                <input type="text" name="medication" value={formData.medication} onChange={handleChange}
                  style={inputStyle} placeholder="Nombre del medicamento" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Dosis</label>
                <input type="text" name="dosage" value={formData.dosage} onChange={handleChange}
                  style={inputStyle} placeholder="Ej: 500mg cada 8h" />
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Doctor / Profesional</label>
            <input type="text" name="doctorName" value={formData.doctorName} onChange={handleChange}
              style={inputStyle} placeholder="Nombre del médico o profesional" />
          </div>

          <div>
            <label style={labelStyle}>Notas adicionales</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange}
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
          </div>

          {isEditing && (
            <div>
              <label style={labelStyle}>Imágenes / Exámenes</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {(recordAttachments[editing.id] || []).map((att) => (
                  <div key={att.id} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <img src={att.fileUrl} alt="" title={att.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setLightboxImg(att.fileUrl)} />
                    <button onClick={() => removeImageAttachment(att.id)} style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={12} color="#fff" />
                    </button>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImg}
                  style={{ width: 80, height: 80, borderRadius: 8, border: '2px dashed #cbd5e1', background: '#f8fafc', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  {uploadingImg ? <Loader2 size={18} className="spin" color="#94a3b8" /> : <ImagePlus size={18} color="#94a3b8" />}
                  <span style={{ fontSize: 9, color: '#94a3b8' }}>{uploadingImg ? 'Subiendo...' : 'Adjuntar'}</span>
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} style={{ display: 'none' }} />
            </div>
          )}

          {!isEditing && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ImagePlus size={16} />
              Las imágenes se podrán adjuntar después de crear el registro.
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={handleSubmit} disabled={saving}
              style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
            <button onClick={handleCloseForm}
              style={{ padding: '8px 20px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              {isEditing ? 'Cerrar' : 'Cancelar'}
            </button>
          </div>
        </div>
      </Modal>



      <Modal isOpen={!!attachTarget} onClose={() => setAttachTarget(null)} title="Adjuntar Archivos">
        <div style={{ minWidth: 420 }}>
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
            {TYPE_CONFIG[attachTarget?.recordType]?.label || 'Registro'} — {attachTarget?.recordDate || ''}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {(recordAttachments[attachTarget?.id] || []).map((att) => (
              <div key={att.id} style={{ position: 'relative', width: 90, height: 90, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <img src={att.fileUrl} alt="" title={att.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setLightboxImg(att.fileUrl)} />
                <button onClick={() => handleAttachRemove(att.id)} style={{ position: 'absolute', top: 2, right: 2, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={12} color="#fff" />
                </button>
                {att.fileName && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 9, padding: '2px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.fileName}</div>}
              </div>
            ))}
            <button onClick={() => attachFileRef.current?.click()} disabled={attachUploading}
              style={{ width: 90, height: 90, borderRadius: 8, border: '2px dashed #cbd5e1', background: '#f8fafc', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {attachUploading ? <Loader2 size={20} className="spin" color="#8b5cf6" /> : <ImagePlus size={20} color="#8b5cf6" />}
              <span style={{ fontSize: 10, color: '#8b5cf6', fontWeight: 600 }}>{attachUploading ? 'Subiendo...' : 'Subir archivo'}</span>
            </button>
          </div>
          <input ref={attachFileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAttachUpload} style={{ display: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setAttachTarget(null)} style={{ padding: '8px 20px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      {identifierOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 24, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Identificador del examen</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Ingrese un nombre descriptivo para este examen (ej: endoscopia, radiografia, ecografia).</div>
            <input
              type="text"
              value={identifierValue}
              onChange={e => setIdentifierValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmIdentifier(); }}
              placeholder="Ej: endoscopia"
              autoFocus
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16, fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={cancelIdentifier} style={{ padding: '8px 16px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancelar</button>
              <button onClick={confirmIdentifier} disabled={!identifierValue.trim()}
                style={{ padding: '8px 16px', background: identifierValue.trim() ? '#2563eb' : '#94a3b8', color: '#fff', border: 'none', borderRadius: 8, cursor: identifierValue.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13 }}>
                Subir
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

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' };
const createBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' };
