import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  Vector3,
} from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import {Object3DFeature, addFeature} from '@vladkrutenyuk/three-kvy-core';
import {feature, mesh as topoMesh} from 'topojson-client';
import countriesTopology from 'world-atlas/countries-110m.json';
import {COUNTRY_RADIUS} from '../../lib/constants.ts';
import {
  lonLatToVec3,
  processRing,
  subdivideEdge,
} from '../utils/geoProjection.ts';
import {triangulatePolygon} from '../utils/triangulate.ts';
import {createCountryMaterial} from '../shaders/countryShader.ts';
import {CountryMeshFeature} from './CountryMeshFeature.ts';
import type {CoreContext} from '@vladkrutenyuk/three-kvy-core';
import type {GeometryCollection, Topology} from 'topojson-specification';
import type {Feature, MultiLineString, MultiPolygon, Polygon} from 'geojson';
import type {GlobeModules} from '../types.ts';

interface CountryProperties {
  name: string;
}

const BORDER_RADIUS = COUNTRY_RADIUS + 0.009;
const BORDER_COLOR = new Color(0x294c61);
const BORDER_OPACITY = 0.82;

/**
 * Build a Map<numericISO, cca3> from restcountries data.
 * For countries without ccn3, attempts fallback matching by name.
 */
export function buildIsoMap(
  countries: Array<{ccn3?: string; cca3: string; name?: {common: string}}>,
  geoNames?: Array<{id: string; name: string}>,
): Map<string, string> {
  const map = new Map<string, string>();

  // Primary: match by numeric ISO code
  for (const c of countries) {
    if (c.ccn3) {
      map.set(c.ccn3, c.cca3);
    }
  }

  // Fallback: match remaining geo features by name for countries without ccn3
  if (geoNames) {
    const nameToCode = new Map<string, string>();
    for (const c of countries) {
      if (c.name?.common) {
        nameToCode.set(c.name.common.toLowerCase(), c.cca3);
      }
    }

    for (const geo of geoNames) {
      if (map.has(geo.id)) continue;
      const match = nameToCode.get(geo.name.toLowerCase());
      if (match) {
        map.set(geo.id, match);
        console.log(
          `[buildIsoMap] Fallback name match: "${geo.name}" (id=${geo.id}) → ${match}`,
        );
      }
    }
  }

  return map;
}

/**
 * Extract geo feature names from world-atlas topology for fallback matching.
 */
export function getGeoNames(): Array<{id: string; name: string}> {
  const topology = countriesTopology as unknown as Topology;
  const countriesObject = topology.objects[
    'countries'
  ] as GeometryCollection<CountryProperties>;
  return countriesObject.geometries.map((g) => ({
    id: String(g.id),
    name: (g.properties as CountryProperties).name,
  }));
}

export function buildBorderPositions(
  lines: Array<Array<ReadonlyArray<number>>>,
  radius: number,
): Float32Array {
  const positions: Array<number> = [];
  const start = new Vector3();
  const end = new Vector3();

  for (const line of lines) {
    const lonLatLine = line.flatMap((point) => {
      const lon = point[0];
      const lat = point[1];
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        return [];
      }
      return [[lon, lat] as [number, number]];
    });
    const processedLine = processRing(lonLatLine);
    if (processedLine.length < 2) continue;

    for (let i = 0; i < processedLine.length - 1; i++) {
      const [lon0, lat0] = processedLine[i];
      const [lon1, lat1] = processedLine[i + 1];
      const arcPoints = subdivideEdge(lon0, lat0, lon1, lat1);
      arcPoints.push([lon1, lat1]);

      for (let j = 0; j < arcPoints.length - 1; j++) {
        const [startLon, startLat] = arcPoints[j];
        const [endLon, endLat] = arcPoints[j + 1];
        lonLatToVec3(startLon, startLat, radius, start);
        lonLatToVec3(endLon, endLat, radius, end);
        positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
      }
    }
  }

  return new Float32Array(positions);
}

export class CountriesFeature extends Object3DFeature<GlobeModules> {
  private countryGroup = new Group();
  readonly meshMap = new Map<string, Mesh>();
  private isoMap = new Map<string, string>();

  setIsoMap(isoMap: Map<string, string>) {
    this.isoMap = isoMap;
  }

  protected useCtx(_ctx: CoreContext<GlobeModules>) {
    this.object.add(this.countryGroup);

    return () => {
      this.clearMeshes();
      this.object.remove(this.countryGroup);
    };
  }

  private clearMeshes() {
    this.countryGroup.traverse((child) => {
      if (child instanceof Mesh || child instanceof LineSegments) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    this.countryGroup.clear();
    this.meshMap.clear();
  }

  buildCountries() {
    if (!this.hasCtx) return;
    const ctx = this.ctx;
    this.clearMeshes();
    const topology = countriesTopology as unknown as Topology;
    const countriesObject = topology.objects[
      'countries'
    ] as GeometryCollection<CountryProperties>;
    const geoCollection = feature(topology, countriesObject);
    const borderLines = this.buildBorderLines(topology, countriesObject);

    const allMeshes: Array<Mesh> = [];

    for (const feat of geoCollection.features) {
      const numericId = String(feat.id);
      const cca3 = this.isoMap.get(numericId) ?? null;
      const matched = cca3 !== null;

      if (!matched) {
        console.warn(
          `[CountriesFeature] Unmatched country: id=${numericId}, name=${feat.properties.name}`,
        );
      }

      const geom = feat.geometry;
      if (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon') {
        continue;
      }
      const geometries = this.featureToGeometries(
        feat as Feature<Polygon | MultiPolygon>,
      );
      if (geometries.length === 0) continue;

      let finalGeometry: BufferGeometry;
      if (geometries.length === 1) {
        finalGeometry = geometries[0];
      } else {
        finalGeometry = BufferGeometryUtils.mergeGeometries(geometries);
        // Dispose source geometries
        for (const g of geometries) g.dispose();
      }

      const {material, hoverFactor, selectFactor} =
        createCountryMaterial(matched);
      const mesh = new Mesh(finalGeometry, material);
      mesh.renderOrder = 1;
      mesh.userData['countryCode'] = cca3;

      this.countryGroup.add(mesh);
      if (cca3) {
        this.meshMap.set(cca3, mesh);
      }
      allMeshes.push(mesh);

      // Attach per-country visual behavior feature
      if (cca3) {
        const meshFeature = addFeature(mesh, CountryMeshFeature);
        meshFeature.countryCode = cca3;
        meshFeature.hoverFactor = hoverFactor;
        meshFeature.selectFactor = selectFactor;
      }
    }

    if (borderLines) {
      this.countryGroup.add(borderLines);
    }

    // Set raycast targets
    ctx.modules.raycast.setTargets(
      allMeshes.filter((m) => m.userData['countryCode'] !== null),
    );
  }

  private featureToGeometries(
    feat: Feature<Polygon | MultiPolygon>,
  ): Array<BufferGeometry> {
    const geom = feat.geometry;

    const polygons: Array<Array<Array<[number, number]>>> = [];

    if (geom.type === 'Polygon') {
      polygons.push(geom.coordinates as Array<Array<[number, number]>>);
    } else {
      for (const poly of geom.coordinates) {
        polygons.push(poly as Array<Array<[number, number]>>);
      }
    }

    const geometries: Array<BufferGeometry> = [];

    for (const polygon of polygons) {
      const outerRing = polygon[0];
      const holes = polygon.slice(1);

      const processedOuter = processRing(outerRing);
      const processedHoles = holes
        .map((h) => processRing(h))
        .filter((h) => h.length >= 3);

      if (processedOuter.length >= 3) {
        geometries.push(
          triangulatePolygon(processedOuter, processedHoles, COUNTRY_RADIUS),
        );
      }
    }

    return geometries;
  }

  private buildBorderLines(
    topology: Topology,
    countriesObject: GeometryCollection<CountryProperties>,
  ): LineSegments | null {
    const borderGeometry: MultiLineString = topoMesh(
      topology,
      countriesObject,
      (a, b) => a !== b,
    );

    const positions = buildBorderPositions(
      borderGeometry.coordinates,
      BORDER_RADIUS,
    );
    if (positions.length === 0) {
      return null;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const material = new LineBasicMaterial({
      color: BORDER_COLOR,
      transparent: true,
      opacity: BORDER_OPACITY,
      depthTest: true,
      depthWrite: false,
    });
    const lines = new LineSegments(geometry, material);
    lines.renderOrder = 2;
    return lines;
  }
}
