import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

let _getToken: (() => Promise<string | null>) | null = null;
let _onUnauthorized: (() => void) | null = null;

// Called once at app startup to wire in token storage
export function configureApiClient(opts: {
  baseURL: string;
  getToken: () => Promise<string | null>;
  onUnauthorized: () => void;
}) {
  _getToken = opts.getToken;
  _onUnauthorized = opts.onUnauthorized;
  client.defaults.baseURL = opts.baseURL;
}

export const client: AxiosInstance = axios.create({
  baseURL: 'https://pretty-planets-rhyme.loca.lt',
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
  },
});

// Attach Bearer token to every request
client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (_getToken) {
    const token = await _getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// On 401 → trigger re-auth
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && _onUnauthorized) {
      _onUnauthorized();
    }
    return Promise.reject(error);
  },
);
