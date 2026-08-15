import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ArrowLeft, Send, Clock, User, MessageSquare } from 'lucide-react';
import { getById, getComments, addComment } from '../../api/workOrders';

const priorityColors = { LOW: '#94a3b8', MEDIUM: '#f59e0b', HIGH: '#f97316', URGENT: '#dc2626', CRITICAL: '#7c3aed' };
const statusColors = { PENDING: '#f59e0b', ASSIGNED: '#3b82f6', IN_PROGRESS: '#8b5cf6', ON_HOLD: '#94a3b8', PENDING_REVIEW: '#f97316', COMPLETED: '#16a34a', CANCELLED: '#dc2626', REOPENED: '#ec4899' };
const commentTypes = ['GENERAL', 'UPDATE', 'QUESTION', 'RESOLUTION', 'INTERNAL'];

export default function WorkOrderDetail({ workOrderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentForm, setCommentForm] = useState({ content: '', commentType: 'GENERAL', isInternal: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (workOrderId) loadOrder();
  }, [workOrderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const [orderRes, commentsRes] = await Promise.all([
        getById(workOrderId),
        getComments(workOrderId),
      ]);
      setOrder(orderRes.data.data);
      setComments(commentsRes.data.data || []);
    } catch {
      toast.error('Error al cargar orden de trabajo');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (ev) => {
    ev.preventDefault();
    if (!commentForm.content.trim()) return toast.warning('El comentario no puede estar vacío');
    setSubmitting(true);
    try {
      await addComment(workOrderId, commentForm);
      toast.success('Comentario agregado');
      setCommentForm({ content: '', commentType: 'GENERAL', isInternal: false });
      const res = await getComments(workOrderId);
      setComments(res.data.data || []);
    } catch {
      toast.error('Error al agregar comentario');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500 text-sm">Cargando detalles de la orden de trabajo...</div>;
  if (!order) return <div className="p-10 text-center text-slate-500 text-sm">Orden de trabajo no encontrada</div>;

  const Field = ({ label, value }) => (
    <div className="mb-2.5">
      <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{label}</div>
      <div className="text-sm text-slate-700 mt-0.5">{value || '-'}</div>
    </div>
  );

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 bg-none border-none cursor-pointer text-sm text-blue-600 font-semibold mb-4 p-0">
        <ArrowLeft size={16} /> Volver a la Lista
      </button>

      <div className="bg-white rounded-xl p-6 mb-4 border border-slate-200">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-800 m-0">{order.title}</h2>
            <span className="text-xs text-slate-500">#{order.orderNumber}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="px-3 py-1 rounded-xl text-xs font-semibold text-white"
              style={{ background: priorityColors[order.priority] || '#94a3b8' }}>
              {order.priority}
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-semibold text-white"
              style={{ background: statusColors[order.status] || '#94a3b8' }}>
              {order.status?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {order.description && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 leading-relaxed">
            {order.description}
          </div>
        )}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          <Field label="Tipo" value={order.type} />
          <Field label="Asignado A" value={order.assignedToName} />
          <Field label="Supervisor" value={order.supervisorName} />
          <Field label="Ubicación" value={order.locationName} />
          <Field label="Activo" value={order.assetName} />
          <Field label="Horas Estimadas" value={order.estimatedHours} />
          <Field label="Inicio Programado" value={order.scheduledStartDate} />
          <Field label="Fin Programado" value={order.scheduledEndDate} />
          <Field label="Costo de Materiales" value={order.costMaterials ? `$${Number(order.costMaterials).toFixed(2)}` : null} />
          <Field label="Costo de Mano de Obra" value={order.costLabor ? `$${Number(order.costLabor).toFixed(2)}` : null} />
          <Field label="Proveedor Externo" value={order.requiresExternalVendor ? order.vendorName : 'No'} />
          {order.requiresExternalVendor && <Field label="Contacto del Proveedor" value={order.vendorContact} />}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 mb-4 border border-slate-200">
        <h3 className="text-base font-bold text-slate-800 m-0 mb-4 flex items-center gap-2">
          <MessageSquare size={18} /> Comentarios ({comments.length})
        </h3>

        <form onSubmit={handleAddComment} className="mb-5 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <textarea value={commentForm.content} onChange={(e) => setCommentForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Escribir un comentario..."
            className="w-full min-h-[80px] p-2.5 border border-slate-200 rounded-md text-sm outline-none resize-vertical box-border" />
          <div className="flex gap-2.5 mt-2 items-center flex-wrap">
            <select value={commentForm.commentType} onChange={(e) => setCommentForm(f => ({ ...f, commentType: e.target.value }))}
              className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs outline-none">
              {commentTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <label className="flex items-center gap-1 text-xs cursor-pointer text-slate-600">
              <input type="checkbox" checked={commentForm.isInternal}
                onChange={(e) => setCommentForm(f => ({ ...f, isInternal: e.target.checked }))} />
              Interno
            </label>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-blue-600 text-white border-none rounded-md cursor-pointer text-xs font-semibold ml-auto hover:bg-blue-700 disabled:opacity-50">
              <Send size={14} /> {submitting ? 'Enviando...' : 'Agregar Comentario'}
            </button>
          </div>
        </form>

        {comments.length === 0 ? (
          <div className="text-center p-6 text-slate-400 text-sm">Aún no hay comentarios</div>
        ) : (
          <div className="flex flex-col gap-3">
            {comments.map((c, i) => (
              <div key={c.id || i} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-1.5 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-slate-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700">{c.authorName || 'Unknown'}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] ${c.isInternal ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {c.commentType} {c.isInternal && '(Interno)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} /> {c.createdAt}
                  </div>
                </div>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{c.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
