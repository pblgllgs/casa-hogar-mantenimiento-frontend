import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, Settings, Search } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Swal from 'sweetalert2';
import { getAll, remove as deleteAsset } from '../../api/assets';

const statusColors = { OPERATIONAL: '#16a34a', NEEDS_MAINTENANCE: '#f59e0b', OUT_OF_SERVICE: '#dc2626', DECOMMISSIONED: '#94a3b8' };
const statusLabels = { OPERATIONAL: 'Operativo', NEEDS_MAINTENANCE: 'Requiere Mantención', OUT_OF_SERVICE: 'Fuera de Servicio', DECOMMISSIONED: 'Dado de Baja', UNDER_MAINTENANCE: 'En Mantención', REPAIR_NEEDED: 'Requiere Reparación', PENDING_INSPECTION: 'Pendiente de Inspección', RETIRED: 'Retirado' };
const criticalityColors = { LOW: '#94a3b8', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#dc2626' };
const criticalityLabels = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica' };
const categoryLabels = { PLUMBING: 'Plomería', ELECTRICAL: 'Eléctrico', STRUCTURAL: 'Estructural', FURNITURE: 'Muebles', APPLIANCES: 'Electrodomésticos', APPLIANCE: 'Electrodoméstico', SAFETY: 'Seguridad', HVAC: 'Calefacción/Ventilación', OTHER: 'Otro', MEDICAL: 'Médico', KITCHEN: 'Cocina', LAUNDRY: 'Lavandería', IT_NETWORK: 'Red/TI', SECURITY: 'Seguridad', VEHICLES: 'Vehículos', TOOLS: 'Herramientas', FIRE_SAFETY: 'Seguridad contra Incendios', VEHICLE: 'Vehículo' };
const categoryColors = {
  HVAC: '#f59e0b', PLUMBING: '#06b6d4', ELECTRICAL: '#f97316', STRUCTURAL: '#64748b',
  APPLIANCE: '#3b82f6', APPLIANCES: '#3b82f6', SAFETY: '#dc2626', FURNITURE: '#8b5cf6',
  TECHNOLOGY: '#14b8a6', LANDSCAPING: '#22c55e', CLEANING: '#a855f7', MEDICAL: '#ec4899',
  KITCHEN: '#f59e0b', LAUNDRY: '#a855f7', IT_NETWORK: '#6366f1', SECURITY: '#dc2626',
  VEHICLES: '#14b8a6', VEHICLE: '#14b8a6', TOOLS: '#f97316', FIRE_SAFETY: '#dc2626',
  OTHER: '#94a3b8',
};

export default function AssetList({ onEdit, onCreate }) {
  const [assets, setAssets] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const fetchData = async (searchOverride) => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      const s = searchOverride !== undefined ? searchOverride : search;
      if (s) params.search = s;
      if (categoryFilter) params.category = categoryFilter;
      const res = await getAll(params);
      const d = res.data.data;
      setAssets(d.content || []);
      setTotalPages(d.totalPages || 0);
    } catch {
      toast.error('Error al cargar activos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, categoryFilter]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(value), 400);
  };

  const categories = Object.keys(categoryLabels).sort();

  const columns = [
    { header: 'Código', accessor: 'assetCode' },
    { header: 'Nombre', accessor: 'name' },
    {
      header: 'Categoría', accessor: 'category',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
              style={{ background: categoryColors[row.category] || '#94a3b8' }}>
          {categoryLabels[row.category] || row.category}
        </span>
      ),
    },
    {
      header: 'Estado', accessor: 'status',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
          style={{ background: statusColors[row.status] || '#94a3b8' }}>
          {statusLabels[row.status] || row.status?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: 'Criticidad', accessor: 'criticality',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
          style={{ background: criticalityColors[row.criticality] || '#94a3b8' }}>
          {criticalityLabels[row.criticality] || row.criticality}
        </span>
      ),
    },
    { header: 'Ubicación', accessor: 'locationName' },
    {
      header: 'Acciones', accessor: 'actions',
      render: (row) => (
        <div className="flex gap-1.5">
          <button onClick={() => onEdit?.(row)} className="bg-none border-none cursor-pointer p-1 flex items-center text-blue-500"><Pencil size={16} /></button>
           <button onClick={() => Swal.fire({ title: 'Eliminar Activo', text: `¿Está seguro de eliminar "${row.name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' }).then(r => { if (r.isConfirmed) { deleteAsset(row.id).then(() => { toast.success('Activo eliminado'); fetchData(); }).catch(() => toast.error('Error al eliminar activo')) } }) } className="bg-none border-none cursor-pointer p-1 flex items-center text-red-600"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800 m-0 flex items-center gap-2">
          <Settings size={22} /> Activos
        </h2>
        <button onClick={onCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-semibold text-sm">
          <Plus size={18} /> Nuevo Activo
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar activos..." value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none" />
        </div>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none bg-white">
          <option value="">Todas las Categorías</option>
          {categories.map(c => <option key={c} value={c}>{categoryLabels[c] || c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-500 text-sm">Cargando...</div>
      ) : assets.length === 0 ? (
        <div className="p-10 text-center text-slate-500 text-sm bg-white rounded-lg border border-slate-200">No se encontraron activos</div>
      ) : (
        <DataTable columns={columns} data={assets} page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

    </div>
  );
}
