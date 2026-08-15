import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, Briefcase, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { getAll, remove as deleteStaff } from '../../api/staff';

const statusColors = { ACTIVE: '#16a34a', INACTIVE: '#94a3b8', ON_LEAVE: '#f59e0b', TERMINATED: '#dc2626' };
const statusLabels = { ACTIVE: 'Activo', INACTIVE: 'Inactivo', ON_LEAVE: 'Permiso', TERMINATED: 'Retirado' };

const deptColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#10b981'];
const shiftLabels = { MANANA: 'MAÑANA', NOCTURNO: 'Nocturno', NOCHE: 'Noche' };

export default function StaffList({ onEdit, onCreate }) {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const fetchData = async (searchOverride) => {
    setLoading(true);
    try {
      const params = { page, size: 12 };
      const s = searchOverride !== undefined ? searchOverride : search;
      if (s) params.search = s;
      if (deptFilter) params.department = deptFilter;
      const res = await getAll(params);
      const d = res.data.data;
      setStaff(d.content || []);
      setTotalPages(d.totalPages || 0);
    } catch {
      toast.error('Error al cargar personal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, deptFilter]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(value), 400);
  };

  const departments = [...new Set(staff.map(s => s.department).filter(Boolean))];
  const getDeptColor = (dept) => {
    if (!dept) return '#94a3b8';
    const idx = departments.indexOf(dept);
    return deptColors[idx % deptColors.length];
  };

  const getAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const confirmDelete = (s) => {
    Swal.fire({ title: 'Eliminar Personal', text: `¿Está seguro de eliminar a "${s.firstName} ${s.lastName}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' }).then(res => { if (res.isConfirmed) { deleteStaff(s.id).then(() => { toast.success('Personal eliminado'); fetchData(); }).catch(() => toast.error('Error al eliminar personal')) } })
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-slate-800 m-0 flex items-center gap-2">
          <Briefcase size={22} /> Personal
        </h2>
        <button onClick={onCreate} className="flex items-center gap-1.5 px-[18px] py-2.5 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-semibold text-sm">
          <Plus size={18} /> Nuevo Personal
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre, código o cargo..." value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-3 py-2.5 pl-9 border border-slate-200 rounded-lg text-sm outline-none box-border" />
        </div>
        <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(0); }}
          className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none bg-white min-w-[160px]">
          <option value="">Todos los Departamentos</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="p-15 text-center text-slate-500">Cargando personal...</div>
      ) : staff.length === 0 ? (
        <div className="p-15 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <Briefcase size={40} className="opacity-30 mb-2 inline-block" />
          <p className="m-0 text-sm font-semibold">No se encontró personal</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {staff.map((s) => {
            const age = getAge(s.birthDate);
            return (
              <div key={s.id}
                className="bg-white rounded-xl p-[18px] border border-slate-200 shadow-sm cursor-pointer transition-shadow duration-200 hover:shadow-md flex flex-col h-full"
                onClick={() => navigate(`/personal/${s.id}`)}>
                <div className="flex flex-col items-center mb-3.5">
                  <div className="w-[165px] h-[165px] rounded-full overflow-hidden border-3 border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 mb-3">
                    {s.photoUrl ? (
                      <img src={s.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[42px] font-bold text-indigo-500">
                        {(s.firstName?.[0] || '').toUpperCase()}{(s.lastName?.[0] || '').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-slate-800 leading-tight">
                      {s.firstName} {s.lastName}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{s.employeeCode}</div>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap justify-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                        style={{ background: statusColors[s.status] || '#94a3b8' }}>
                        {statusLabels[s.status] || s.status}
                      </span>
                      {s.shift && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-blue-600 bg-blue-100">
                          {shiftLabels[s.shift] || s.shift}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 mb-3.5 text-xs">
                  <div className="px-2 py-1.5 rounded-md bg-slate-50 border border-slate-100 flex justify-between">
                    <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-[0.3px]">Cargo</span>
                    <span className="text-slate-700 font-semibold text-xs">{s.position || '-'}</span>
                  </div>
                  <div className="px-2 py-1.5 rounded-md bg-slate-50 border border-slate-100 flex justify-between">
                    <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-[0.3px]">Depto.</span>
                    {s.department
                      ? <span className="text-xs font-semibold text-white px-2 py-0.5 rounded-md" style={{ background: getDeptColor(s.department) }}>{s.department}</span>
                      : <span className="text-slate-700 font-semibold text-xs">-</span>
                    }
                  </div>
                  <div className="px-2 py-1.5 rounded-md bg-slate-50 border border-slate-100 flex justify-between">
                    <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-[0.3px]">Edad</span>
                    <span className="text-slate-700 font-semibold text-xs">{age != null ? `${age} años` : '-'}</span>
                  </div>
                  <div className="px-2 py-1.5 rounded-md bg-slate-50 border border-slate-100 flex justify-between">
                    <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-[0.3px]">Tel.</span>
                    <span className="text-slate-700 font-semibold text-xs">{s.phone || '-'}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2.5 flex gap-1 justify-end">
                  <button onClick={(e) => { e.stopPropagation(); onEdit?.(s); }}
                    className="bg-none border-none cursor-pointer p-1.5 rounded-md flex items-center transition-colors duration-150 hover:bg-slate-100 text-blue-500"
                    title="Editar">
                    <Pencil size={15} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); confirmDelete(s); }} className="bg-none border-none cursor-pointer p-1.5 rounded-md flex items-center transition-colors duration-150 hover:bg-slate-100 text-red-600" title="Eliminar">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className={`bg-white border border-slate-200 rounded-lg cursor-pointer p-1.5 flex items-center hover:bg-slate-50 ${page === 0 ? 'opacity-40' : ''}`}>
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-semibold text-slate-500">
            Página {page + 1} de {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className={`bg-white border border-slate-200 rounded-lg cursor-pointer p-1.5 flex items-center hover:bg-slate-50 ${page >= totalPages - 1 ? 'opacity-40' : ''}`}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

        </div>
  );
}
