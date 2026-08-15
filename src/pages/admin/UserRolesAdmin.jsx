import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { ShieldCheck, Search, RefreshCw } from 'lucide-react';
import { listUsers, updateUserRoles } from '../../api/users';

const ALL_ROLES = ['ADMIN', 'SUPERVISOR', 'MAINTENANCE', 'INVENTORY', 'RESIDENTS', 'HR', 'VIEWER'];

const roleColors = {
  ADMIN:       { bg: 'rgba(220,38,38,0.15)',  fg: '#dc2626', selectedBg: '#dc2626' },
  SUPERVISOR:  { bg: 'rgba(168,85,247,0.15)', fg: '#a855f7', selectedBg: '#a855f7' },
  MAINTENANCE: { bg: 'rgba(249,115,22,0.15)', fg: '#f97316', selectedBg: '#f97316' },
  INVENTORY:   { bg: 'rgba(34,197,94,0.15)',  fg: '#22c55e', selectedBg: '#22c55e' },
  RESIDENTS:   { bg: 'rgba(236,72,153,0.15)', fg: '#ec4899', selectedBg: '#ec4899' },
  HR:          { bg: 'rgba(14,165,233,0.15)', fg: '#0ea5e9', selectedBg: '#0ea5e9' },
  VIEWER:      { bg: 'rgba(107,114,128,0.15)',fg: '#6b7280', selectedBg: '#6b7280' },
};

function RoleChip({ role, selected, disabled, onClick }) {
  const colors = roleColors[role] || roleColors.VIEWER;
  const style = selected
    ? { backgroundColor: colors.selectedBg, color: '#fff', border: `1px solid ${colors.selectedBg}` }
    : { backgroundColor: colors.bg, color: colors.fg, border: `1px solid transparent` };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...style,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 150ms',
      }}
    >
      {role}
    </button>
  );
}

function UserRow({ user, onSaved }) {
  const [selected, setSelected] = useState(new Set(user.roles || []));
  const [saving, setSaving] = useState(false);
  const dirty = !(selected.size === (user.roles || []).length && [...selected].every(r => user.roles.includes(r)));

  const toggle = (role) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role); else next.add(role);
      return next;
    });
  };

  const save = async () => {
    if (selected.size === 0) {
      toast.error('El usuario debe tener al menos un role');
      return;
    }
    const confirm = await Swal.fire({
      title: 'Actualizar roles',
      text: `¿Cambiar los roles de ${user.username} a ${[...selected].join(', ')}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      await updateUserRoles(user.id, [...selected]);
      toast.success(`Roles de ${user.username} actualizados`);
      onSaved();
    } catch (e) {
      const msg = e.response?.data?.message || 'Error al actualizar roles';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => setSelected(new Set(user.roles || []));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-800">
            {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            @{user.username} · {user.email}
          </div>
        </div>
        {dirty && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Cambios sin guardar
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ALL_ROLES.map(role => (
          <RoleChip
            key={role}
            role={role}
            selected={selected.has(role)}
            disabled={saving}
            onClick={() => toggle(role)}
          />
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
        <button
          onClick={reset}
          disabled={!dirty || saving}
          className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Descartar
        </button>
        <button
          onClick={save}
          disabled={!dirty || saving || selected.size === 0}
          className="px-4 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

export default function UserRolesAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listUsers();
      setUsers(res.data.data || []);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.username || '').toLowerCase().includes(q)
      || (u.email || '').toLowerCase().includes(q)
      || (u.firstName || '').toLowerCase().includes(q)
      || (u.lastName || '').toLowerCase().includes(q)
      || (u.fullName || '').toLowerCase().includes(q)
      || (u.roles || []).some(r => r.toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-slate-800 m-0 flex items-center gap-2">
          <ShieldCheck size={22} /> Gestión de Roles
        </h2>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg cursor-pointer font-semibold text-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario, email o role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2.5 pl-9 border border-slate-200 rounded-lg text-sm outline-none box-border"
          />
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div className="p-15 text-center text-slate-500">Cargando usuarios...</div>
      ) : filtered.length === 0 ? (
        <div className="p-15 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <ShieldCheck size={40} className="opacity-30 mb-2 inline-block" />
          <p className="m-0 text-sm font-semibold">
            {users.length === 0 ? 'No hay usuarios en el sistema' : 'No se encontraron usuarios con esa búsqueda'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
          {filtered.map(u => (
            <UserRow key={u.id} user={u} onSaved={fetchData} />
          ))}
        </div>
      )}
    </div>
  );
}
