import axios from 'axios';

import { useAuthStore } from '../store/authStore';

const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL,
  withCredentials: true, // send refreshToken cookie
});

// Attach JWT access token from the in-memory Zustand store.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh + retry on 401.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalConfig = error?.config;

    const isRefreshRequest =
      typeof originalConfig?.url === 'string' && originalConfig.url.includes('/api/auth/refresh');

    if (status === 401 && originalConfig && !originalConfig._retry && !isRefreshRequest) {
      originalConfig._retry = true;

      try {
        const refreshResponse = await api.post('/api/auth/refresh');
        const newAccessToken = refreshResponse?.data?.data?.accessToken;

        if (newAccessToken) {
          useAuthStore.getState().setAccessToken(newAccessToken);

          originalConfig.headers = originalConfig.headers || {};
          originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
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

