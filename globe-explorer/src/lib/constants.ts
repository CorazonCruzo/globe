export const GLOBE_RADIUS = 5;
export const COUNTRY_OFFSET = 0.01;
export const COUNTRY_RADIUS = GLOBE_RADIUS + COUNTRY_OFFSET;

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export const CAMERA_INITIAL_DISTANCE = 15;
export const CAMERA_MIN_DISTANCE = GLOBE_RADIUS + 1.5;
export const CAMERA_MAX_DISTANCE = 30;
export const CAMERA_MIN_POLAR = 0.05;
export const CAMERA_MAX_POLAR = Math.PI - 0.05;

export const SUBDIVISION_MAX_ANGLE_DEG = 5;

export const COUNTRIES_API_URL =
  'https://countries.dev/countries?fields=name,alpha3Code,numericCode,capital,population,area,region,subregion,latlng,flags,languages,currencies';

export const COUNTRIES_FALLBACK_URL =
  'https://cdn.jsdelivr.net/gh/restcountries/restcountries@bfadee4f951682c29970e53677707bc558e80b74/src/main/resources/countriesV3.1.json';
