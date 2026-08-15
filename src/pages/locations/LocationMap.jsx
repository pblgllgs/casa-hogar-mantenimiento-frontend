import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { MapPin, ChevronLeft, Upload, Loader2, GripVertical, X } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import { locationTypeColors } from '../../constants/locationTypes';
import { getAllLocations, updateLocation } from '../../api/assets';

export default function LocationMap({ onBack }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [placingId, setPlacingId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [saving, setSaving] = useState(null);
  const imageRef = useRef(null);
  const fileRef = useRef(null);
  const dragStart = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => { fetchLocations(); }, []);

  const fetchLocations = async () => {
    try {
      const res = await getAllLocations({ size: 200 });
      setLocations(res.data.data.content || []);
    } catch {
      toast.error('Error al cargar ubicaciones');
    } finally {
      setLoading(false);
    }
  };

  const mapImageUrl = locations.find(l => l.mapImage)?.mapImage || null;

  const placed = locations
    .filter(l => l.mapX != null && l.mapY != null)
    .sort((a, b) => a.id - b.id);

  const unplaced = locations.filter(l => l.mapX == null || l.mapY == null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.warning('Máximo 10MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.warning('Formato no soportado'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/uploads/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.data.url;
      const target = locations.find(l => l.mapImage) || locations[0];
      if (target) {
        await updateLocation(target.id, { ...target, mapImage: url });
        setLocations(prev => prev.map(l => l.id === target.id ? { ...l, mapImage: url } : l));
      }
      toast.success('Plano subido');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al subir');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const getPercent = useCallback((clientX, clientY) => {
    const img = imageRef.current;
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  }, []);

  const savePosition = async (locId, x, y) => {
    setSaving(locId);
    try {
      const loc = locations.find(l => l.id === locId);
      await updateLocation(locId, { ...loc, mapX: x, mapY: y });
      setLocations(prev => prev.map(l => l.id === locId ? { ...l, mapX: x, mapY: y } : l));
      toast.success('Posición guardada');
    } catch {
      toast.error('Error al guardar posición');
    } finally {
      setSaving(null);
    }
  };

  const removePosition = async (locId) => {
    Swal.fire({
      title: 'Quitar del Plano',
      text: '¿Está seguro de quitar esta ubicación del plano?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Quitar',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        setSaving(locId);
        try {
          const loc = locations.find(l => l.id === locId);
          await updateLocation(locId, { ...loc, mapX: null, mapY: null });
          setLocations(prev => prev.map(l => l.id === locId ? { ...l, mapX: null, mapY: null } : l));
          toast.success('Ubicación removida del plano');
        } catch { toast.error('Error al remover'); }
        finally { setSaving(null); }
      }
    });
  };

  const handleImageMouseDown = (e) => {
    if (e.button !== 0) return;
    if (placingId) return;
    const marker = e.target.closest('[data-loc-id]');
    if (!marker) return;
    e.preventDefault();
    const locId = Number(marker.dataset.locId);
    const loc = locations.find(l => l.id === locId);
    if (!loc) return;
    const rect = imageRef.current.getBoundingClientRect();
    dragStart.current = {
      locId,
      startX: e.clientX,
      startY: e.clientY,
      origX: (loc.mapX / 100) * rect.width,
      origY: (loc.mapY / 100) * rect.height,
    };
    setDragging(locId);
  };

  const handleImageMouseMove = useCallback((e) => {
    if (!dragging || !dragStart.current) return;
    const ds = dragStart.current;
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    const newX = Math.max(0, Math.min(100, ((ds.origX + dx) / rect.width) * 100));
    const newY = Math.max(0, Math.min(100, ((ds.origY + dy) / rect.height) * 100));
    setLocations(prev => prev.map(l =>
      l.id === ds.locId ? { ...l, mapX: Math.round(newX * 10) / 10, mapY: Math.round(newY * 10) / 10 } : l
    ));
  }, [dragging]);

  const handleImageMouseUp = useCallback(async (e) => {
    if (!dragging || !dragStart.current) return;
    const ds = dragStart.current;
    dragStart.current = null;
    setDragging(null);
    const loc = locations.find(l => l.id === ds.locId);
    if (loc && loc.mapX != null && loc.mapY != null) {
      await savePosition(ds.locId, loc.mapX, loc.mapY);
    }
  }, [dragging, locations]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleImageMouseMove);
      window.addEventListener('mouseup', handleImageMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleImageMouseMove);
        window.removeEventListener('mouseup', handleImageMouseUp);
      };
    }
  }, [dragging, handleImageMouseMove, handleImageMouseUp]);

  const handleImageClick = (e) => {
    if (dragging) return;
    if (!placingId || !mapImageUrl) return;
    const pos = getPercent(e.clientX, e.clientY);
    if (pos) savePosition(placingId, pos.x, pos.y);
    setPlacingId(null);
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Cargando mapa...</div>;
  }

  if (!mapImageUrl) {
    return (
      <div>
        <Header onBack={onBack} />
        <div className="p-15 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <MapPin size={48} color="#cbd5e1" className="mb-3 inline-block" />
          <p className="m-0 text-base font-semibold">No hay plano configurado</p>
          <p className="mt-1.5 mb-4 text-sm text-slate-400">
            Subí una imagen del plano para empezar a posicionar las ubicaciones.
          </p>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-semibold text-sm disabled:opacity-60">
            {uploading ? <><Loader2 size={16} className="spin" /> Subiendo...</> : <><Upload size={16} /> Subir Plano</>}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header onBack={onBack}>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md cursor-pointer font-semibold text-xs hover:bg-slate-200">
          {uploading ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
          {uploading ? 'Subiendo...' : 'Cambiar plano'}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
      </Header>

      {placingId && (
        <div className="mb-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 font-semibold flex items-center justify-between">
          <span>Hacé click en el plano para posicionar: <strong>{locations.find(l => l.id === placingId)?.name}</strong></span>
          <button onClick={() => setPlacingId(null)} className="bg-none border-none text-blue-400 cursor-pointer font-bold text-base hover:text-blue-600">×</button>
        </div>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 280px' }}>
        <div className="bg-white rounded-xl border border-gray-200 p-4 relative">
          <div
            ref={imageRef}
            className="relative select-none max-w-[80%] mx-auto"
            style={{ cursor: placingId ? 'crosshair' : 'default' }}
            onMouseDown={handleImageMouseDown}
            onClick={handleImageClick}
          >
            <img src={mapImageUrl} alt="Plano" className="w-full block rounded-lg" draggable={false} />

            {placed.map((loc, idx) => (
              <div
                key={loc.id}
                data-loc-id={loc.id}
                onMouseEnter={() => setHoveredId(loc.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="absolute"
                style={{
                  left: `${loc.mapX}%`,
                  top: `${loc.mapY}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: dragging === loc.id ? 'grabbing' : 'grab',
                  zIndex: dragging === loc.id ? 100 : hoveredId === loc.id ? 10 : 1,
                  transition: dragging === loc.id ? 'none' : 'transform 0.1s',
                }}
              >
                <div
                  className="w-[30px] h-[30px] rounded-full text-white flex items-center justify-center text-xs font-bold border-3 border-white"
                  style={{
                    background: locationTypeColors[loc.type] || '#6366f1',
                    boxShadow: dragging === loc.id
                      ? `0 0 0 3px ${locationTypeColors[loc.type] || '#6366f1'}80, 0 6px 20px rgba(0,0,0,0.3)`
                      : hoveredId === loc.id
                      ? `0 0 0 3px ${locationTypeColors[loc.type] || '#6366f1'}40, 0 4px 12px rgba(0,0,0,0.25)`
                      : '0 2px 8px rgba(0,0,0,0.25)',
                    transition: dragging === loc.id ? 'none' : 'box-shadow 0.15s',
                  }}
                >
                  {saving === loc.id ? <Loader2 size={14} className="spin" /> : idx + 1}
                </div>

                {(hoveredId === loc.id || dragging === loc.id) && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white px-2.5 py-1.5 rounded-lg text-[11px] whitespace-nowrap shadow-lg pointer-events-none z-20">
                    <div className="font-bold">{loc.name}</div>
                    <div className="text-slate-400 text-[10px]">{loc.mapX}%, {loc.mapY}%</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {unplaced.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-3.5">
              <p className="m-0 mb-2 text-xs font-bold text-slate-600 uppercase tracking-[0.5px]">Sin posicionar ({unplaced.length})</p>
              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                {unplaced.map(loc => (
                  <div key={loc.id}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-md"
                    style={{ background: placingId === loc.id ? '#eff6ff' : '#f8fafc', border: `1px solid ${placingId === loc.id ? '#93c5fd' : '#f1f5f9'}` }}>
                    <span className="w-[18px] h-[18px] rounded-full text-white flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{ background: locationTypeColors[loc.type] || '#94a3b8' }}>?</span>
                    <span className="text-xs font-semibold text-slate-700 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{loc.name}</span>
                    <button onClick={() => setPlacingId(placingId === loc.id ? null : loc.id)}
                      className="text-[10px] font-semibold bg-none border-none cursor-pointer p-0.5 shrink-0"
                      style={{ color: placingId === loc.id ? '#dc2626' : '#3b82f6' }}>
                      {placingId === loc.id ? 'Cancelar' : 'Ubicar'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-3.5 flex-1">
            <p className="m-0 mb-2 text-xs font-bold text-slate-600 uppercase tracking-[0.5px]">Posicionadas ({placed.length})</p>
            <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto">
              {placed.map((loc, idx) => (
                <div key={loc.id}
                  onMouseEnter={() => setHoveredId(loc.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-grab"
                  style={{ background: hoveredId === loc.id ? '#f0f9ff' : '#f8fafc', border: `1px solid ${hoveredId === loc.id ? '#93c5fd' : '#f1f5f9'}` }}>
                  <GripVertical size={12} color="#cbd5e1" />
                  <span className="w-[18px] h-[18px] rounded-full text-white flex items-center justify-center text-[9px] font-bold shrink-0"
                    style={{ background: locationTypeColors[loc.type] || '#6366f1' }}>{idx + 1}</span>
                  <span className="text-xs font-semibold text-slate-700 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{loc.name}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">{loc.mapX},{loc.mapY}</span>
                  <button onClick={(e) => { e.stopPropagation(); removePosition(loc.id); }}
                    title="Quitar del plano"
                    className="bg-none border-none cursor-pointer p-0.5 flex items-center text-slate-300 shrink-0 hover:text-red-600">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ onBack, children }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="bg-slate-100 border border-slate-200 rounded-lg cursor-pointer p-1.5 flex items-center text-slate-600 hover:bg-slate-200"><ChevronLeft size={18} /></button>
        <h2 className="m-0 text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MapPin size={22} /> Plano del Lugar
        </h2>
      </div>
      <div className="flex gap-2 items-center">{children}</div>
    </div>
  );
}
