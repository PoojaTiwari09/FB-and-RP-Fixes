import { MODULE_API } from './module-api';

export const ENV = {
  API_BASE_URL: MODULE_API.M01,
  M01_API_BASE_URL: MODULE_API.M01,
  M02_API_BASE_URL: MODULE_API.M02,
  M09_API_BASE_URL: MODULE_API.M09,
  M08_API_BASE_URL: MODULE_API.M08,
  USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
  IS_DEV: process.env.NODE_ENV === 'development',
  HOME_PATH: process.env.NEXT_PUBLIC_HOME_PATH || '/engage',
} as const;
