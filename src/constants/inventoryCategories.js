export const INVENTORY_CATEGORIES = [
  { value: 'LIMPIEZA', label: 'Limpieza' },
  { value: 'HIGIENE', label: 'Higiene' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'ELECTRICOS', label: 'Eléctricos' },
  { value: 'PLOMERIA', label: 'Plomería' },
  { value: 'VEHICULOS', label: 'Vehículos' },
  { value: 'SEGURIDAD', label: 'Seguridad' },
];

export const CATEGORY_COLORS = {
  LIMPIEZA: '#06b6d4',
  HIGIENE: '#8b5cf6',
  MANTENIMIENTO: '#f59e0b',
  ELECTRICOS: '#3b82f6',
  PLOMERIA: '#14b8a6',
  VEHICULOS: '#ec4899',
  SEGURIDAD: '#dc2626',
};

export const categoryLabel = (value) =>
  INVENTORY_CATEGORIES.find(c => c.value === value)?.label || value;
