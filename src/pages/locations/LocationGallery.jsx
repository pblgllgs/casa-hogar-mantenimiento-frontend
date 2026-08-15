import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Image, Plus, X, Camera, Loader2, Download, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import * as locationPhotosApi from '../../api/locationPhotos';
import Modal from '../../components/Modal';

const categoryColors = {
  Exterior: '#3b82f6', Comun: '#8b5cf6', Servicios: '#f59e0b',
  Habitacion: '#10b981', Oficina: '#6366f1', Otro: '#94a3b8',
};
const DEFAULT_CATEGORIES = ['Exterior', 'Comun', 'Servicios', 'Habitacion', 'Oficina', 'Otro'];

export default function LocationGallery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState('');
  const [savingNew, setSavingNew] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const fileInputRef = useRef(null);
  const newFileInputRef = useRef(null);

  useEffect(() => { fetchPhotos(); }, []);

  const fetchPhotos = async () => {
    try {
      const res = await locationPhotosApi.getAll();
      setPhotos(res.data.data || []);
    } catch {
      toast.error('Error al cargar fotos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (photoId) => {
    setUploadTarget(photoId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    if (file.size > 5 * 1024 * 1024) { toast.warning('Maximo 5MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.warning('Use JPG, PNG o WebP'); return; }

    setUploading(uploadTarget);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { url } = uploadRes.data.data;
      const photo = photos.find(p => p.id === uploadTarget);
      if (photo) {
        await locationPhotosApi.update(uploadTarget, { title: photo.title, category: photo.category, photoUrl: url, displayOrder: photo.displayOrder });
        setPhotos(prev => prev.map(p => p.id === uploadTarget ? { ...p, photoUrl: url } : p));
        toast.success('Foto subida');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al subir foto');
    } finally {
      setUploading(null);
      setUploadTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async (photo) => {
    try {
      await locationPhotosApi.update(photo.id, { title: photo.title, category: photo.category, photoUrl: null, displayOrder: photo.displayOrder });
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, photoUrl: null } : p));
      toast.success('Foto eliminada');
    } catch {
      toast.error('Error al eliminar foto');
    }
  };

  const confirmRemovePhoto = (photo) => {
    Swal.fire({
      title: 'Eliminar Foto',
      text: `Eliminar la foto de "${photo.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then(result => { if (result.isConfirmed) handleRemovePhoto(photo); });
  };

  const handleAddPhoto = async () => {
    if (!newTitle.trim()) { toast.warning('Ingrese un titulo'); return; }
    setSavingNew(true);
    try {
      let photoUrl = null;
      if (newPhotoFile) {
        const formData = new FormData();
        formData.append('file', newPhotoFile);
        const uploadRes = await api.post('/uploads/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        photoUrl = uploadRes.data.data.url;
      }
      const res = await locationPhotosApi.create({
        title: newTitle.trim(),
        category: newCategory.trim() || 'Otro',
        photoUrl,
        displayOrder: photos.length,
      });
      setPhotos(prev => [...prev, res.data.data]);
      setNewTitle('');
      setNewCategory('');
      setNewPhotoFile(null);
      setNewPhotoPreview('');
      setShowForm(false);
      toast.success('Ubicacion agregada');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear ubicacion');
    } finally {
      setSavingNew(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setNewTitle('');
    setNewCategory('');
    setNewPhotoFile(null);
    setNewPhotoPreview('');
  };

  const handleNewFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.warning('Maximo 5MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.warning('Use JPG, PNG o WebP'); return; }
    setNewPhotoFile(file);
    setNewPhotoPreview(URL.createObjectURL(file));
    if (newFileInputRef.current) newFileInputRef.current.value = '';
  };

  const handleDeleteCard = async (photo) => {
    try {
      await locationPhotosApi.remove(photo.id);
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      toast.success('Ubicacion eliminada');
    } catch {
      toast.error('Error al eliminar ubicacion');
    }
  };

  const confirmDeleteCard = (photo) => {
    Swal.fire({
      title: 'Eliminar Ubicacion',
      text: `Eliminar "${photo.title}"? Esta accion no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then(result => { if (result.isConfirmed) handleDeleteCard(photo); });
  };

  const handleDownload = (url, filename) => {
    fetch(url, { mode: 'cors' })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.download = filename || 'foto.png';
        a.click();
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => toast.error('Error al descargar'));
  };

  const getColor = (category) => categoryColors[category] || '#94a3b8';

  if (loading) return <div className="p-10 text-center text-slate-500 text-sm">Cargando...</div>;

  return (
    <div className="p-0 bg-gray-100 min-h-screen">
      <div className="max-w-[1100px] mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/ubicaciones')} className="bg-none border-none cursor-pointer p-2 rounded-lg text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors" title="Volver"><ArrowLeft size={20} /></button>
            <h1 className="m-0 text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Image size={22} /> Galeria de Ubicaciones
            </h1>
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-[18px] py-2 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-semibold text-xs transition-colors hover:bg-blue-700">
              <Plus size={16} /> Agregar
            </button>
          )}
        </div>

        <Modal isOpen={showForm} onClose={closeForm} title="Agregar Ubicacion">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Titulo</label>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nombre de la ubicacion" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none box-border" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Categoria</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none box-border bg-white">
                <option value="" disabled>Seleccione una categoria</option>
                {DEFAULT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Foto</label>
              {newPhotoPreview ? (
                <div className="flex items-center gap-2">
                  <img src={newPhotoPreview} alt="Preview" className="w-14 h-14 rounded-lg object-cover border border-slate-200" />
                  <button onClick={() => { setNewPhotoFile(null); setNewPhotoPreview(''); }} className="bg-none border-none cursor-pointer text-red-500 hover:text-red-700" title="Quitar foto"><X size={16} /></button>
                </div>
              ) : (
                <button onClick={() => newFileInputRef.current?.click()} disabled={savingNew}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg cursor-pointer text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50">
                  <Camera size={14} /> Seleccionar foto
                </button>
              )}
              <input ref={newFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleNewFileChange} />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={closeForm} disabled={savingNew} className="px-5 py-2 bg-slate-100 border border-slate-200 rounded-lg cursor-pointer text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50">Cancelar</button>
              <button onClick={handleAddPhoto} disabled={savingNew}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white border-none rounded-lg cursor-pointer text-xs font-semibold whitespace-nowrap hover:bg-blue-700 disabled:opacity-50">
                {savingNew ? <Loader2 size={14} className="spin" /> : null} {savingNew ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </Modal>

        {photos.length === 0 ? (
          <div className="text-center p-15 text-slate-400 text-sm">
            <Image size={48} className="mx-auto mb-3 opacity-40" />
            No hay ubicaciones registradas
          </div>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {photos.map((photo) => {
              const color = getColor(photo.category);
              return (
                <div key={photo.id} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <div onClick={(e) => { if (photo.photoUrl && !e.target.closest('button')) setLightbox(photo); }}
                    className="w-full aspect-[4/3] rounded-lg flex items-center justify-center relative"
                    style={{
                      background: photo.photoUrl ? 'transparent' : `linear-gradient(135deg, ${color}22, ${color}44)`,
                      cursor: photo.photoUrl ? 'pointer' : 'default',
                    }}>
                      {photo.photoUrl ? (
                        <img src={photo.photoUrl} alt={photo.title} className="w-full h-full object-contain" />
                      ) : (
                      <Image size={40} color={color} className="opacity-50" />
                    )}
                    {uploading === photo.id && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 size={32} color="#fff" className="spin" />
                      </div>
                    )}
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button onClick={() => handleFileClick(photo.id)} className="bg-black/55 border-none text-white rounded-md p-1 cursor-pointer flex items-center hover:bg-black/70" title="Subir foto">
                          <Camera size={14} />
                        </button>
                        {photo.photoUrl && (
                          <button onClick={() => confirmRemovePhoto(photo)} className="bg-red-600/85 border-none text-white rounded-md p-1 cursor-pointer flex items-center hover:bg-red-700" title="Eliminar foto">
                            <X size={14} />
                          </button>
                        )}
                        <button onClick={() => confirmDeleteCard(photo)} className="bg-red-600/85 border-none text-white rounded-md p-1 cursor-pointer flex items-center hover:bg-red-700" title="Eliminar ubicacion">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="px-1 pt-3 pb-1">
                    <div className="text-sm font-semibold text-slate-800">{photo.title}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ color, background: `${color}15` }}>
                        {photo.category}
                      </span>
                      {photo.photoUrl && (
                        <button onClick={() => handleDownload(photo.photoUrl, `${photo.title}.png`)}
                          className="bg-none border-none cursor-pointer p-0.5 flex items-center text-slate-400 hover:text-slate-600" title="Descargar foto">
                          <Download size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {lightbox && (
          <div className="fixed inset-0 bg-black/92 flex items-center justify-center flex-col z-[200]" onClick={() => setLightbox(null)}>
            <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 bg-black/50 border-none text-white rounded-full w-10 h-10 cursor-pointer flex items-center justify-center z-[201] hover:bg-black/70"><X size={24} /></button>
            <div className="max-w-[90vw] max-h-[85vh] relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <img src={lightbox.photoUrl} alt={lightbox.title} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
              <div className="text-center mt-3 text-white text-sm font-medium">{lightbox.title}</div>
            </div>
          </div>
        )}

      </div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={handleFileChange} />
    </div>
  );
}