import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, ArrowRightLeft } from 'lucide-react';
import DataTable from '../../components/DataTable';
import { categoryLabel, CATEGORY_COLORS } from '../../constants/inventoryCategories';
import Swal from 'sweetalert2';
import { getAll, remove as deleteItem } from '../../api/inventory';

const unitColors = { UN: '#3b82f6', M: '#8b5cf6', KG: '#f59e0b', L: '#06b6d4', MT2: '#14b8a6', MT3: '#22c55e', PAR: '#ec4899', ROLLO: '#a855f7', CAJA: '#f97316' };

export default function ItemList({ onEdit, onCreate, onViewMovements }) {
  const [items, setItems] = useState([]);
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
      const res = await getAll(params);
      const d = res.data.data;
      setItems(d.content || []);
      setTotalPages(d.totalPages || 0);
    } catch {
      toast.error('Error al cargar artículos de inventario');
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

  const handleDelete = (row) => {
    Swal.fire({ title: 'Eliminar Artículo', text: `¿Está seguro de eliminar "${row.name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' }).then(r => { if (r.isConfirmed) { deleteItem(row.id).then(() => { toast.success('Artículo eliminado'); fetchData(); }).catch(() => toast.error('Error al eliminar artículo')) } })
  };

  const columns = [
    { header: 'Código', accessor: 'code' },
    { header: 'Nombre', accessor: 'name' },
    {
      header: 'Categoría', accessor: 'category',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
              style={{ background: CATEGORY_COLORS[row.category] || '#94a3b8' }}>
          {categoryLabel(row.category)}
        </span>
      ),
    },
    {
      header: 'Stock', accessor: 'currentStock',
      render: (row) => {
        const isLow = row.minimumStock && row.currentStock < row.minimumStock;
        return (
          <span className={`font-semibold text-sm ${isLow ? 'text-red-600' : 'text-slate-700'}`}>
            {row.currentStock} {isLow && <span className="text-[11px] text-red-600">(BAJO)</span>}
          </span>
        );
      },
    },
    { header: 'Stock Mínimo', accessor: 'minimumStock' },
    {
      header: 'Costo Unitario', accessor: 'unitCost',
      render: (row) => row.unitCost ? `$${Number(row.unitCost).toFixed(2)}` : '-',
    },
    {
      header: 'Unidad', accessor: 'unitOfMeasure',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: unitColors[row.unitOfMeasure] || '#94a3b8' }}>
          {row.unitOfMeasure}
        </span>
      ),
    },
    {
      header: 'Acciones', accessor: 'actions',
      render: (row) => (
        <div className="flex gap-1.5">
          <button onClick={() => onEdit?.(row)} className="bg-none border-none cursor-pointer p-1 flex items-center text-blue-500"><Pencil size={16} /></button>
          <button onClick={() => onViewMovements?.(row)} className="bg-none border-none cursor-pointer p-1 flex items-center text-purple-500" title="Movements"><ArrowRightLeft size={16} /></button>
          <button onClick={() => handleDelete(row)} className="bg-none border-none cursor-pointer p-1 flex items-center text-red-600"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800 m-0">Artículos de Inventario</h2>
        <button onClick={onCreate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-semibold text-sm">
          <Plus size={18} /> Nuevo Artículo
        </button>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Buscar artículos..." value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none box-border" />
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-500 text-sm">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="p-10 text-center text-slate-500 text-sm bg-white rounded-lg border border-slate-200">No se encontraron artículos</div>
      ) : (
        <DataTable columns={columns} data={items} page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

    </div>
  );
}
