import {describe, expect, it} from 'vitest';
import {Mesh} from 'three';
import {addFeature} from '@vladkrutenyuk/three-kvy-core';
import {CountryMeshFeature} from './CountryMeshFeature.ts';

describe('CountryMeshFeature', () => {
  it('can be attached to a Mesh via addFeature', () => {
    const mesh = new Mesh();
    const feature = addFeature(mesh, CountryMeshFeature);
    expect(feature).toBeDefined();
    expect(feature.isObject3DFeature).toBe(true);
  });

  it('has default empty state', () => {
    const mesh = new Mesh();
    const feature = addFeature(mesh, CountryMeshFeature);
    expect(feature.countryCode).toBe('');
    expect(feature.hoverFactor).toBeNull();
    expect(feature.selectFactor).toBeNull();
  });

  it('allows setting countryCode and factors', () => {
    const mesh = new Mesh();
    const feature = addFeature(mesh, CountryMeshFeature);
    feature.countryCode = 'USA';
    feature.hoverFactor = {value: 0};
    feature.selectFactor = {value: 0};

    expect(feature.countryCode).toBe('USA');
    expect(feature.hoverFactor.value).toBe(0);
    expect(feature.selectFactor.value).toBe(0);
  });
});
