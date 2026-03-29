import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';

import { useAuthStore } from '../store/authStore';

const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true, // send refreshToken cookie
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error?.response?.status;
    const originalConfig = error?.config as RetriableConfig | undefined;

    const isRefreshRequest =
      typeof originalConfig?.url === 'string' && originalConfig.url.includes('/api/auth/refresh');

    if (status === 401 && originalConfig && !originalConfig._retry && !isRefreshRequest) {
      originalConfig._retry = true;
      try {
        const refreshResponse = await api.post('/api/auth/refresh');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newAccessToken = (refreshResponse as any)?.data?.data?.accessToken as string | undefined;

        if (newAccessToken) {
          useAuthStore.getState().setAccessToken(newAccessToken);

          try {
            const meResponse = await api.get('/api/auth/me', {
              headers: { Authorization: `Bearer ${newAccessToken}` },
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            useAuthStore.getState().setUser((meResponse as any)?.data?.data || null);
          } catch {
            useAuthStore.getState().logout();
            return Promise.reject(error);
          }

          originalConfig.headers = originalConfig.headers || {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (originalConfig.headers as any).Authorization = `Bearer ${newAccessToken}`;
        }

        return api(originalConfig);
      } catch (refreshErr) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  },
);

export default api;

