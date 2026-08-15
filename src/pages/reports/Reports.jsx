import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { BarChart3, AlertTriangle, Wrench, ClipboardList, Package, Users, UserCheck, Clock } from 'lucide-react';
import { getDashboard, getMaintenanceSummary, getInventoryAlerts, getWorkOrdersByStatus, getWorkOrdersByPriority, getAssetsReport, getInventoryReport, getResidentsReport, getStaffReport, getShiftsReport } from '../../api/reports';

const priorityColors = { LOW: '#94a3b8', MEDIUM: '#f59e0b', HIGH: '#f97316', URGENT: '#dc2626', CRITICAL: '#7c3aed' };
const statusColors = { PENDING: '#f59e0b', ASSIGNED: '#3b82f6', IN_PROGRESS: '#8b5cf6', ON_HOLD: '#94a3b8', PENDING_REVIEW: '#f97316', COMPLETED: '#16a34a', CANCELLED: '#dc2626', REOPENED: '#ec4899' };

export default function Reports() {
  const [dashboard, setDashboard] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [byPriority, setByPriority] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dashRes, maintRes, alertsRes, statusRes, prioRes] = await Promise.allSettled([
        getDashboard(), getMaintenanceSummary(), getInventoryAlerts(),
        getWorkOrdersByStatus(), getWorkOrdersByPriority(),
      ]);
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data.data);
      if (maintRes.status === 'fulfilled') setMaintenance(maintRes.value.data.data);
      if (alertsRes.status === 'fulfilled') setAlerts(Array.isArray(alertsRes.value.data.data) ? alertsRes.value.data.data : alertsRes.value.data.data?.content || []);
      if (statusRes.status === 'fulfilled') setByStatus(Array.isArray(statusRes.value.data.data) ? statusRes.value.data.data : []);
      if (prioRes.status === 'fulfilled') setByPriority(Array.isArray(prioRes.value.data.data) ? prioRes.value.data.data : []);
    } catch {
      toast.error('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (reportFn, filename) => {
    setDownloadingReport(filename);
    try {
      const res = await reportFn();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('PDF descargado');
    } catch (e) {
      toast.error('Error al descargar PDF');
    } finally {
      setDownloadingReport(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <BarChart3 size={32} style={{ marginBottom: 8 }} />
        <div>Cargando reportes...</div>
      </div>
    );
  }

  const maxStatusCount = Math.max(...byStatus.map(s => s.count || 0), 1);
  const maxPriorityCount = Math.max(...byPriority.map(p => p.count || 0), 1);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <BarChart3 size={22} /> Panel de Reportes
      </h2>

      {dashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {Object.entries(dashboard).filter(([k]) => typeof dashboard[k] === 'number').map(([key, value]) => (
            <div key={key} style={statCard}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>{value}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', marginBottom: 24 }}>
        <h3 style={{ ...cardTitle, marginBottom: 16 }}>Generar Reportes PDF</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          <button onClick={() => handleDownloadPdf(getAssetsReport, 'reporte-activos.pdf')} disabled={downloadingReport !== null} style={pdfBtn}>
            <Package size={16} /> {downloadingReport === 'activos' ? 'Generando...' : 'Activos'}
          </button>
          <button onClick={() => handleDownloadPdf(getInventoryReport, 'reporte-inventario.pdf')} disabled={downloadingReport !== null} style={pdfBtn}>
            <ClipboardList size={16} /> {downloadingReport === 'inventario' ? 'Generando...' : 'Inventario'}
          </button>
          <button onClick={() => handleDownloadPdf(getResidentsReport, 'reporte-residentes.pdf')} disabled={downloadingReport !== null} style={pdfBtn}>
            <Users size={16} /> {downloadingReport === 'residentes' ? 'Generando...' : 'Residentes'}
          </button>
          <button onClick={() => handleDownloadPdf(getStaffReport, 'reporte-personal.pdf')} disabled={downloadingReport !== null} style={pdfBtn}>
            <UserCheck size={16} /> {downloadingReport === 'personal' ? 'Generando...' : 'Personal'}
          </button>
          <button onClick={() => handleDownloadPdf(getShiftsReport, 'reporte-turnos.pdf')} disabled={downloadingReport !== null} style={pdfBtn}>
            <Clock size={16} /> {downloadingReport === 'turnos' ? 'Generando...' : 'Turnos Semana'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={card}>
          <h3 style={cardTitle}>Órdenes de Trabajo por Estado</h3>
          {byStatus.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Sin datos</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {byStatus.map((item) => {
                const label = item.status || item.name || item.label || 'Desconocido';
                const count = item.count || item.value || 0;
                const pct = (count / maxStatusCount) * 100;
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontSize: 13 }}>
                      <span style={{ color: '#334155', fontWeight: 500 }}>{label.replace(/_/g, ' ')}</span>
                      <span style={{ color: '#64748b' }}>{count}</span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: statusColors[label] || '#94a3b8', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Órdenes de Trabajo por Prioridad</h3>
          {byPriority.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Sin datos</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {byPriority.map((item) => {
                const label = item.priority || item.name || item.label || 'Desconocido';
                const count = item.count || item.value || 0;
                const pct = (count / maxPriorityCount) * 100;
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontSize: 13 }}>
                      <span style={{ color: '#334155', fontWeight: 500 }}>{label}</span>
                      <span style={{ color: '#64748b' }}>{count}</span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: priorityColors[label] || '#94a3b8', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={card}>
          <h3 style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="#f59e0b" /> Inventory Alerts
          </h3>
          {alerts.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#16a34a', fontSize: 14 }}>Todos los niveles de stock son adecuados</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {alerts.map((item, i) => (
                <div key={item.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fef2f2', borderRadius: 6, border: '1px solid #fecaca' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{item.name || item.itemName}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Código: {item.code || item.itemCode}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626' }}>{item.currentStock} / {item.minimumStock}</div>
                    <div style={{ fontSize: 11, color: '#dc2626' }}>Debajo del mínimo</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={card}>
          <h3 style={{ ...cardTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wrench size={18} color="#2563eb" /> Resumen de Mantenimiento
          </h3>
          {maintenance ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {typeof maintenance === 'object' && !Array.isArray(maintenance) ? (
                Object.entries(maintenance).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 14, color: '#64748b' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 14, color: '#334155' }}>{JSON.stringify(maintenance)}</div>
              )}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No hay datos disponibles</div>
          )}
        </div>
      </div>
    </div>
  );
}

const statCard = { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', textAlign: 'center' };
const card = { background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' };
const cardTitle = { fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 16px 0' };
const pdfBtn = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'background 0.2s' };
