import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, MapPin, Image, Map } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Swal from 'sweetalert2';
import { getAllLocations, deleteLocation } from '../../api/assets';
import { locationTypeLabels, locationTypeColors } from '../../constants/locationTypes';

export default function LocationList({ onEdit, onCreate, onShowMap }) {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const fetchData = async (searchOverride) => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      const s = searchOverride !== undefined ? searchOverride : search;
      if (s) params.search = s;
      const res = await getAllLocations(params);
      const d = res.data.data;
      setLocations(d.content || []);
      setTotalPages(d.totalPages || 0);
    } catch {
      toast.error('Error al cargar ubicaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(value), 400);
  };

  const columns = [
    { header: 'Código', accessor: 'code' },
    { header: 'Nombre', accessor: 'name' },
    {
      header: 'Tipo', accessor: 'type',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
          style={{ background: locationTypeColors[row.type] || '#94a3b8' }}>
          {locationTypeLabels[row.type] || row.type}
        </span>
      ),
    },
    { header: 'Piso', accessor: 'floor' },
    { header: 'Ala', accessor: 'wing' },
    { header: 'Habitación #', accessor: 'roomNumber' },
    { header: 'Capacidad', accessor: 'capacity' },
    {
      header: 'Activo', accessor: 'isActive',
      render: (row) => (
        <span className={`font-semibold text-sm ${row.isActive ? 'text-green-600' : 'text-red-600'}`}>
          {row.isActive ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      header: 'Acciones', accessor: 'actions',
      render: (row) => (
        <div className="flex gap-1.5">
          <button onClick={() => onEdit?.(row)} className="bg-none border-none cursor-pointer p-1 flex items-center text-blue-500"><Pencil size={16} /></button>
          <button onClick={() => Swal.fire({ title: 'Eliminar Ubicación', text: `¿Está seguro de eliminar "${row.name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' }).then(r => { if (r.isConfirmed) { deleteLocation(row.id).then(() => { toast.success('Ubicación eliminada'); fetchData(); }).catch(() => toast.error('Error al eliminar ubicación')) } }) } className="bg-none border-none cursor-pointer p-1 flex items-center text-red-600"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800 m-0 flex items-center gap-2">
          <MapPin size={22} /> Ubicaciones
        </h2>
        <div className="flex gap-2">
          <button onClick={onShowMap} className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 text-white border-none rounded-lg cursor-pointer font-semibold text-sm hover:bg-cyan-600 transition-colors"><Map size={16} /> Mapa</button>
          <button onClick={() => navigate('/ubicaciones/galeria')} className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 text-slate-600 border-none rounded-lg cursor-pointer font-semibold text-sm hover:bg-slate-300 transition-colors"><Image size={16} /> Galería</button>
          <button onClick={onCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-semibold text-sm"><Plus size={18} /> Nueva Ubicación</button>
        </div>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Buscar ubicaciones..." value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none box-border" />
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-500 text-sm">Cargando...</div>
      ) : locations.length === 0 ? (
        <div className="p-10 text-center text-slate-500 text-sm bg-white rounded-lg border border-slate-200">No se encontraron ubicaciones</div>
      ) : (
        <DataTable columns={columns} data={locations} page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

    </div>
  );
}
