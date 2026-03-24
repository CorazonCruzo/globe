import {describe, expect, it, vi} from 'vitest';
import {CountryStateModule} from './CountryStateModule.ts';

function createModule() {
  return new CountryStateModule();
}

describe('CountryStateModule', () => {
  describe('select', () => {
    it('selects a country and emits select event', () => {
      const module = createModule();
      const onSelect = vi.fn();
      module.on('select', onSelect);

      module.select('USA');

      expect(module.selectedCode).toBe('USA');
      expect(onSelect).toHaveBeenCalledWith('USA');
    });

    it('deselects previous country when selecting a new one', () => {
      const module = createModule();
      const onDeselect = vi.fn();
      module.on('deselect', onDeselect);

      module.select('USA');
      module.select('FRA');

      expect(module.selectedCode).toBe('FRA');
      expect(onDeselect).toHaveBeenCalledWith('USA');
    });

    it('toggles off when selecting the same country', () => {
      const module = createModule();
      const onDeselect = vi.fn();
      module.on('deselect', onDeselect);

      module.select('USA');
      module.select('USA');

      expect(module.selectedCode).toBeNull();
      expect(onDeselect).toHaveBeenCalledWith('USA');
    });

    it('handles select(null) — deselects current', () => {
      const module = createModule();
      const onDeselect = vi.fn();
      module.on('deselect', onDeselect);

      module.select('USA');
      module.select(null);

      expect(module.selectedCode).toBeNull();
      expect(onDeselect).toHaveBeenCalledWith('USA');
    });

    it('does nothing when selecting null with nothing selected', () => {
      const module = createModule();
      const onSelect = vi.fn();
      const onDeselect = vi.fn();
      module.on('select', onSelect);
      module.on('deselect', onDeselect);

      module.select(null);

      expect(module.selectedCode).toBeNull();
      expect(onSelect).not.toHaveBeenCalled();
      expect(onDeselect).not.toHaveBeenCalled();
    });
  });

  describe('hover', () => {
    it('hovers a country and emits hover event', () => {
      const module = createModule();
      const onHover = vi.fn();
      module.on('hover', onHover);

      module.hover('USA');

      expect(module.hoveredCode).toBe('USA');
      expect(onHover).toHaveBeenCalledWith('USA');
    });

    it('unhovers previous country when hovering a new one', () => {
      const module = createModule();
      const onUnhover = vi.fn();
      module.on('unhover', onUnhover);

      module.hover('USA');
      module.hover('FRA');

      expect(module.hoveredCode).toBe('FRA');
      expect(onUnhover).toHaveBeenCalledWith('USA');
    });

    it('clears hover on hover(null)', () => {
      const module = createModule();
      const onUnhover = vi.fn();
      module.on('unhover', onUnhover);

      module.hover('USA');
      module.hover(null);

      expect(module.hoveredCode).toBeNull();
      expect(onUnhover).toHaveBeenCalledWith('USA');
    });

    it('ignores duplicate hover', () => {
      const module = createModule();
      const onHover = vi.fn();
      module.on('hover', onHover);

      module.hover('USA');
      module.hover('USA');

      expect(onHover).toHaveBeenCalledTimes(1);
    });
  });

  describe('countryData', () => {
    it('starts with empty map', () => {
      const module = createModule();
      expect(module.countryData.size).toBe(0);
    });

    it('stores and retrieves country data', () => {
      const module = createModule();
      module.countryData.set('USA', {lat: 38, lon: -97, area: 9_833_520});

      expect(module.countryData.get('USA')).toEqual({lat: 38, lon: -97, area: 9_833_520});
    });
  });

  describe('select + hover interaction', () => {
    it('select and hover are independent', () => {
      const module = createModule();

      module.select('USA');
      module.hover('FRA');

      expect(module.selectedCode).toBe('USA');
      expect(module.hoveredCode).toBe('FRA');
    });

    it('hovering selected country does not deselect', () => {
      const module = createModule();

      module.select('USA');
      module.hover('USA');

      expect(module.selectedCode).toBe('USA');
      expect(module.hoveredCode).toBe('USA');
    });
  });
});
