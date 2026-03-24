import {CoreContextModule} from '@vladkrutenyuk/three-kvy-core';
import type {CoreContext} from '@vladkrutenyuk/three-kvy-core';
import type {CountryDataEntry} from '../../types/country.ts';
import type {GlobeModules} from '../types.ts';

interface CountryStateEvents {
  select: [code: string];
  deselect: [code: string];
  hover: [code: string];
  unhover: [code: string];
}

export class CountryStateModule extends CoreContextModule<
  CountryStateEvents,
  GlobeModules
> {
  private _selectedCode: string | null = null;
  private _hoveredCode: string | null = null;

  /** Map<cca3, {lat, lon}> — filled from restcountries data */
  readonly countryData = new Map<string, CountryDataEntry>();

  get selectedCode() {
    return this._selectedCode;
  }

  get hoveredCode() {
    return this._hoveredCode;
  }

  select(code: string | null) {
    if (code === this._selectedCode) {
      // Deselect on re-click
      if (this._selectedCode) {
        const prev = this._selectedCode;
        this._selectedCode = null;
        this.emit('deselect', prev);
      }
      return;
    }

    if (this._selectedCode) {
      const prev = this._selectedCode;
      this._selectedCode = null;
      this.emit('deselect', prev);
    }

    if (code) {
      this._selectedCode = code;
      this.emit('select', code);

      // Fly camera to country
      if (this.hasCtx) {
        const data = this.countryData.get(code);
        if (data) {
          this.ctx.modules.camera.flyTo(data.lat, data.lon, data.area);
        }
      }
    }
  }

  hover(code: string | null) {
    if (code === this._hoveredCode) return;

    if (this._hoveredCode) {
      const prev = this._hoveredCode;
      this._hoveredCode = null;
      this.emit('unhover', prev);
    }

    if (code) {
      this._hoveredCode = code;
      this.emit('hover', code);
    }
  }

  protected useCtx(_ctx: CoreContext<GlobeModules>) {
    return () => {
      this._selectedCode = null;
      this._hoveredCode = null;
      this.countryData.clear();
    };
  }
}
