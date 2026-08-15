import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ArrowRightLeft, ArrowLeft, Plus } from 'lucide-react';
import { getMovements } from '../../api/inventory';

const typeColors = { IN: '#16a34a', OUT: '#dc2626', ADJUSTMENT: '#f59e0b', TRANSFER: '#3b82f6' };

export default function MovementList({ item, onBack, onNewMovement }) {
  const [movements, setMovements] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (item?.id) fetchMovements();
  }, [item, page]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await getMovements({ inventoryItemId: item.id, page, size: 15 });
      const d = res.data.data;
      setMovements(d.content || []);
      setTotalPages(d.totalPages || 0);
    } catch {
      toast.error('Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 bg-none border-none cursor-pointer text-sm text-blue-600 font-semibold mb-4 p-0">
        <ArrowLeft size={16} /> Volver a Artículos
      </button>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-2">
          <ArrowRightLeft size={20} /> Movimientos de {item?.name}
        </h2>
        <button onClick={onNewMovement} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-semibold text-sm">
          <Plus size={18} /> Nuevo Movimiento
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-500 text-sm">Cargando...</div>
      ) : movements.length === 0 ? (
        <div className="p-10 text-center text-slate-500 text-sm bg-white rounded-lg border border-slate-200">
          No hay movimientos registrados para este artículo
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3.5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-3.5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="px-3.5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cant</th>
                <th className="px-3.5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Costo Unitario</th>
                <th className="px-3.5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Costo Total</th>
                <th className="px-3.5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Realizado Por</th>
                <th className="px-3.5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notas</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m, i) => (
                <tr key={m.id || i} className="border-b border-slate-100">
                  <td className="px-3.5 py-2.5 text-sm text-slate-700">{m.movementDate}</td>
                  <td className="px-3.5 py-2.5 text-sm text-slate-700">
                    <span className="px-2.5 py-0.5 rounded-xl text-xs font-semibold text-white"
                      style={{ background: typeColors[m.movementType] || '#94a3b8' }}>
                      {m.movementType}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-sm text-slate-700">{m.quantity}</td>
                  <td className="px-3.5 py-2.5 text-sm text-slate-700">${Number(m.unitCost).toFixed(2)}</td>
                  <td className="px-3.5 py-2.5 text-sm text-slate-700 font-semibold">${Number(m.totalCost).toFixed(2)}</td>
                  <td className="px-3.5 py-2.5 text-sm text-slate-700">{m.performedByName || '-'}</td>
                  <td className="px-3.5 py-2.5 text-sm text-slate-700 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{m.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-3">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
              <span className="px-3 py-1.5 text-xs text-slate-500">Página {page + 1} de {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
