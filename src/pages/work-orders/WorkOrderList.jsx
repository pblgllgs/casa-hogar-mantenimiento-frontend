import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Plus, Eye, Trash2, RefreshCw, Filter, Search } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Swal from 'sweetalert2';
import { getAll, remove as deleteWorkOrder, changeStatus } from '../../api/workOrders';

const priorityColors = {
  LOW: '#94a3b8',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#dc2626',
  CRITICAL: '#7c3aed',
};
const priorityLabels = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', URGENT: 'Urgente', CRITICAL: 'Crítica' };

const statusColors = {
  PENDING: '#f59e0b',
  ASSIGNED: '#3b82f6',
  IN_PROGRESS: '#8b5cf6',
  ON_HOLD: '#94a3b8',
  PENDING_REVIEW: '#f97316',
  COMPLETED: '#16a34a',
  CANCELLED: '#dc2626',
  REOPENED: '#ec4899',
  SCHEDULED: '#06b6d4',
};
const statusLabels = { PENDING: 'Pendiente', ASSIGNED: 'Asignada', IN_PROGRESS: 'En Progreso', ON_HOLD: 'En Espera', PENDING_REVIEW: 'Pendiente Revisión', COMPLETED: 'Completada', CANCELLED: 'Cancelada', REOPENED: 'Reabierta', SCHEDULED: 'Programada' };

const typeLabels = { PREVENTIVE: 'Preventivo', CORRECTIVE: 'Correctivo', PREDICTIVE: 'Predictivo', EMERGENCY: 'Emergencia', INSPECTION: 'Inspección', CALIBRATION: 'Calibración' };
const typeColors = { PREVENTIVE: '#16a34a', CORRECTIVE: '#f59e0b', PREDICTIVE: '#8b5cf6', EMERGENCY: '#dc2626', INSPECTION: '#3b82f6', CALIBRATION: '#06b6d4' };

const statusOptions = [
  'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD',
  'PENDING_REVIEW', 'COMPLETED', 'CANCELLED', 'REOPENED', 'SCHEDULED',
];

export default function WorkOrderList({ onViewDetail, onCreate }) {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
  const debounceRef = useRef(null);

  const fetchData = async (searchOverride) => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      const s = searchOverride !== undefined ? searchOverride : search;
      if (s) params.search = s;
      if (statusFilter) params.status = statusFilter;
      const res = await getAll(params);
      const d = res.data.data;
      setOrders(d.content || []);
      setTotalPages(d.totalPages || 0);
    } catch {
      toast.error('Error al cargar órdenes de trabajo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, statusFilter]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(value), 400);
  };

  const handleStatusChange = async (id, status) => {
    try {
      await changeStatus(id, status);
      toast.success('Estado actualizado');
      setStatusDropdownOpen(null);
      fetchData();
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  const columns = [
    { header: 'Orden #', accessor: 'orderNumber' },
    { header: 'Título', accessor: 'title' },
    {
      header: 'Tipo', accessor: 'type',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
              style={{ background: typeColors[row.type] || '#94a3b8' }}>
          {typeLabels[row.type] || row.type?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: 'Prioridad', accessor: 'priority',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
          style={{ background: priorityColors[row.priority] || '#94a3b8' }}>
          {priorityLabels[row.priority] || row.priority}
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
    { header: 'Programado', accessor: 'scheduledStartDate' },
    { header: 'Asignado A', accessor: 'assignedToName' },
    {
      header: 'Acciones', accessor: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1.5 relative">
          <button onClick={() => onViewDetail?.(row)} title="Ver"
            className="bg-none border-none cursor-pointer p-1 flex items-center text-blue-500">
            <Eye size={16} />
          </button>
          <div className="relative">
            <button onClick={() => setStatusDropdownOpen(statusDropdownOpen === row.id ? null : row.id)}
              title="Cambiar estado" className="bg-none border-none cursor-pointer p-1 flex items-center text-purple-500">
              <RefreshCw size={16} />
            </button>
            {statusDropdownOpen === row.id && (
              <div className="absolute top-full right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[160px] p-1 transition-all duration-200 origin-top-right">
                {statusOptions.map((s) => (
                  <button key={s} onClick={() => handleStatusChange(row.id, s)}
                    className="flex items-center w-full px-2.5 py-1.5 border-none bg-none cursor-pointer text-sm text-left rounded text-slate-700 hover:bg-slate-100">
                    <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ background: statusColors[s] }} />
                    {statusLabels[s] || s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => Swal.fire({ title: 'Eliminar Orden de Trabajo', text: `¿Está seguro de eliminar "${row.title}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' }).then(r => { if (r.isConfirmed) { deleteWorkOrder(row.id).then(() => { toast.success('Orden de trabajo eliminada'); fetchData(); }).catch(() => toast.error('Error al eliminar orden de trabajo')) } }) } title="Eliminar"
            className="bg-none border-none cursor-pointer p-1 flex items-center text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800 m-0">Órdenes de Trabajo</h2>
        <button onClick={onCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-semibold text-sm">
          <Plus size={18} /> Nueva Orden de Trabajo
        </button>
      </div>

      <div className="flex gap-3 mb-4 items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar órdenes de trabajo..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={16} color="#64748b" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none bg-white">
            <option value="">Todos los Estados</option>
            {statusOptions.map((s) => <option key={s} value={s}>{statusLabels[s] || s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-500 text-sm">Cargando...</div>
      ) : orders.length === 0 ? (
        <div className="p-10 text-center text-slate-500 text-sm bg-white rounded-lg border border-slate-200">No se encontraron órdenes de trabajo</div>
      ) : (
        <DataTable columns={columns} data={orders} page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

    </div>
  );
}
