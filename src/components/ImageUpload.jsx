import { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import api from '../api/axios';

export default function ImageUpload({ value, onChange, size = 120 }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('La imagen no puede superar 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.warning('Use formato JPG, PNG o WebP');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { url } = res.data.data;
      setPreview(url);
      onChange?.(url);
      toast.success('Imagen subida');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al subir imagen');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    Swal.fire({
      title: 'Eliminar Foto',
      text: '¿Está seguro de eliminar la foto del perfil?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        setPreview(null);
        onChange?.('');
      }
    });
  };

  return (
    <div className="flex items-center gap-4">
      <div onClick={() => !uploading && inputRef.current?.click()}
        className="rounded-full overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 relative cursor-pointer hover:border-blue-500 transition-colors shrink-0"
        style={{ width: size, height: size }}>
        {uploading ? (
          <Loader2 size={28} className="text-slate-400 animate-spin" />
        ) : preview ? (
          <img src={preview} alt="Foto de perfil" className="w-full h-full object-cover" />
        ) : (
          <Camera size={28} className="text-slate-400" />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md cursor-pointer text-xs font-semibold text-slate-600 flex items-center gap-1 hover:bg-slate-200 disabled:opacity-50">
          <Camera size={14} /> {preview ? 'Cambiar foto' : 'Subir foto'}
        </button>
        {preview && (
          <button type="button" onClick={handleRemove} disabled={uploading}
            className="px-3 py-1.5 bg-white border border-red-200 rounded-md cursor-pointer text-xs text-red-600 flex items-center gap-1 hover:bg-red-50 disabled:opacity-50">
            <X size={14} /> Eliminar
          </button>
        )}
        <span className="text-[11px] text-slate-400">JPG, PNG o WebP. Máx 5MB.</span>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
    </div>
  );
}
