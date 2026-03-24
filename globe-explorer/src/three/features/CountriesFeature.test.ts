import {describe, expect, it} from 'vitest';
import {buildBorderPositions, buildIsoMap} from './CountriesFeature.ts';

describe('buildIsoMap', () => {
  it('creates a map from ccn3 to cca3', () => {
    const countries = [
      {ccn3: '840', cca3: 'USA'},
      {ccn3: '643', cca3: 'RUS'},
      {ccn3: '250', cca3: 'FRA'},
    ];
    const map = buildIsoMap(countries);
    expect(map.size).toBe(3);
    expect(map.get('840')).toBe('USA');
    expect(map.get('643')).toBe('RUS');
    expect(map.get('250')).toBe('FRA');
  });

  it('skips entries without ccn3', () => {
    const countries = [
      {ccn3: '840', cca3: 'USA'},
      {cca3: 'ATA'}, // Antarctica has no ccn3
      {ccn3: '250', cca3: 'FRA'},
    ];
    const map = buildIsoMap(countries);
    expect(map.size).toBe(2);
    expect(map.has('ATA')).toBe(false);
  });

  it('handles empty input', () => {
    const map = buildIsoMap([]);
    expect(map.size).toBe(0);
  });

  it('falls back to name matching when ccn3 is missing', () => {
    const countries = [
      {ccn3: '840', cca3: 'USA', name: {common: 'United States'}},
      {cca3: 'ATA', name: {common: 'Antarctica'}},
    ];
    const geoNames = [
      {id: '840', name: 'United States of America'},
      {id: '010', name: 'Antarctica'},
    ];
    const map = buildIsoMap(countries, geoNames);
    // 840 matched by ccn3, 010 matched by name fallback
    expect(map.get('840')).toBe('USA');
    expect(map.get('010')).toBe('ATA');
  });

  it('name fallback is case-insensitive', () => {
    const countries = [{cca3: 'FJI', name: {common: 'Fiji'}}];
    const geoNames = [{id: '242', name: 'fiji'}];
    const map = buildIsoMap(countries, geoNames);
    expect(map.get('242')).toBe('FJI');
  });

  it('does not overwrite ccn3 match with name fallback', () => {
    const countries = [{ccn3: '242', cca3: 'FJI', name: {common: 'Fiji'}}];
    const geoNames = [{id: '242', name: 'Fiji'}];
    const map = buildIsoMap(countries, geoNames);
    expect(map.get('242')).toBe('FJI');
    expect(map.size).toBe(1);
  });
});

describe('buildBorderPositions', () => {
  it('subdivides long border segments and keeps all points on the sphere', () => {
    const radius = 5.018;
    const positions = buildBorderPositions(
      [
        [
          [0, 0],
          [30, 0],
        ],
      ],
      radius,
    );

    expect(positions.length).toBeGreaterThan(6);

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      const length = Math.sqrt(x * x + y * y + z * z);
      expect(length).toBeCloseTo(radius, 5);
    }
  });

  it('drops duplicate vertices and skips degenerate border lines', () => {
    const positions = buildBorderPositions(
      [
        [
          [10, 10],
          [10, 10],
          [20, 10],
        ],
        [[0, 0]],
      ],
      5.018,
    );

    expect(positions.length).toBeGreaterThan(0);
    expect(positions.length % 6).toBe(0);
  });
});
