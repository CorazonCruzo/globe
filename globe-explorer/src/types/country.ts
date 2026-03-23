export interface Country {
  name: {
    common: string;
    official: string;
  };
  cca3: string;
  ccn3?: string;
  capital?: Array<string>;
  population: number;
  area: number;
  region: string;
  subregion?: string;
  languages?: Record<string, string>;
  currencies?: Record<string, {name: string; symbol: string}>;
  flags: {
    png: string;
    svg: string;
    alt?: string;
  };
  latlng: [number, number];
}

export interface CountryDataEntry {
  lat: number;
  lon: number;
}
