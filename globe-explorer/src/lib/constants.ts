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

// restcountries.com limits ?fields to 10 per request, so we split into two
export const REST_COUNTRIES_API_1 =
  'https://restcountries.com/v3.1/all?fields=name,cca3,ccn3,capital,population,area,region,subregion,latlng,flags';
export const REST_COUNTRIES_API_2 =
  'https://restcountries.com/v3.1/all?fields=name,cca3,languages,currencies';
