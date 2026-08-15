import { describe, it, expect } from 'vitest';
import { INVENTORY_CATEGORIES, CATEGORY_COLORS, categoryLabel } from '../../constants/inventoryCategories';
import { locationTypeLabels, locationTypeColors } from '../../constants/locationTypes';

describe('inventoryCategories', () => {
  it('expone categorías con value y label', () => {
    expect(INVENTORY_CATEGORIES.length).toBeGreaterThan(0);
    for (const c of INVENTORY_CATEGORIES) {
      expect(c.value).toBeTruthy();
      expect(c.label).toBeTruthy();
    }
  });

  it('cada categoría tiene color definido', () => {
    for (const c of INVENTORY_CATEGORIES) {
      expect(CATEGORY_COLORS[c.value]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('categoryLabel retorna la etiqueta correcta', () => {
    expect(categoryLabel('LIMPIEZA')).toBe('Limpieza');
    expect(categoryLabel('MANTENIMIENTO')).toBe('Mantenimiento');
  });

  it('categoryLabel retorna el valor si no existe', () => {
    expect(categoryLabel('DESCONOCIDO')).toBe('DESCONOCIDO');
  });
});

describe('locationTypes', () => {
  it('cada tipo tiene etiqueta y color', () => {
    for (const [type, label] of Object.entries(locationTypeLabels)) {
      expect(label).toBeTruthy();
      expect(locationTypeColors[type]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('traduce tipos comunes', () => {
    expect(locationTypeLabels.ROOM).toBe('Habitación');
    expect(locationTypeLabels.KITCHEN).toBe('Cocina');
    expect(locationTypeLabels.OUTDOOR).toBe('Exterior');
  });
});
