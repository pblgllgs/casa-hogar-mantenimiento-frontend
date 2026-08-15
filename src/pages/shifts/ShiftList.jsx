import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, Clock } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Swal from 'sweetalert2';
import { getAll, remove as deleteShift } from '../../api/shifts';
import { useAuth } from '../../context/AuthContext';
import { isViewer } from '../../utils/roles';

const dayLabels = { MON: 'Lun', TUE: 'Mar', WED: 'Mié', THU: 'Jue', FRI: 'Vie', SAT: 'Sáb', SUN: 'Dom' };

export default function ShiftList({ onEdit, onCreate }) {
  const { user } = useAuth();
  const canEdit = !isViewer(user);
  const [shifts, setShifts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAll({ page, size: 10 });
      const d = res.data.data;
      setShifts(d.content || []);
      setTotalPages(d.totalPages || 0);
    } catch {
      toast.error('Error al cargar turnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const columns = [
    { header: 'Nombre', accessor: 'name' },
    { header: 'Hora Inicio', accessor: 'startTime' },
    { header: 'Hora Fin', accessor: 'endTime' },
    {
      header: 'Días', accessor: 'daysOfWeek',
      render: (row) => {
        const days = row.daysOfWeek ? (typeof row.daysOfWeek === 'string' ? row.daysOfWeek.split(',').map(d => d.trim()) : row.daysOfWeek) : [];
        return (
          <div className="flex gap-0.5 flex-wrap">
            {days.map(d => (
              <span key={d} className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-700">
                {dayLabels[d] || d}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Activo', accessor: 'isActive',
      render: (row) => (
        <span className={`font-semibold text-xs ${row.isActive ? 'text-green-600' : 'text-red-600'}`}>
          {row.isActive ? 'Sí' : 'No'}
        </span>
      ),
    },
    ...(canEdit ? [{
      header: 'Acciones', accessor: 'actions',
      render: (row) => (
        <div className="flex gap-1.5">
          <button onClick={() => onEdit?.(row)} className="bg-none border-none cursor-pointer p-1 flex items-center text-blue-500"><Pencil size={16} /></button>
          <button onClick={() => Swal.fire({ title: 'Eliminar Turno', text: `¿Está seguro de eliminar "${row.name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' }).then(r => { if (r.isConfirmed) { deleteShift(row.id).then(() => { toast.success('Turno eliminado'); fetchData(); }).catch(() => toast.error('Error al eliminar turno')) } }) } className="bg-none border-none cursor-pointer p-1 flex items-center text-red-600"><Trash2 size={16} /></button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800 m-0 flex items-center gap-2">
          <Clock size={22} /> Turnos
        </h2>
        <button onClick={onCreate} className={`flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-semibold text-sm ${canEdit ? '' : 'hidden'}`}>
          <Plus size={18} /> Nuevo Turno
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-500 text-sm">Cargando...</div>
      ) : shifts.length === 0 ? (
        <div className="p-10 text-center text-slate-500 text-sm bg-white rounded-lg border border-slate-200">No se encontraron turnos</div>
      ) : (
        <DataTable columns={columns} data={shifts} page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

    </div>
  );
}
