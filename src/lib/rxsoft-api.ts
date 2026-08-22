import type { AxiosRequestConfig } from 'axios';
import { createAuthApiClient } from '@/lib/create-api-client';

export const RXSOFT_API_BASE_URL =
  (import.meta.env.VITE_RXSOFT_API_URL as string | undefined) ??
  'https://rxsoft-backend.onrender.com/api';

export const rxsoftApi = createAuthApiClient({
  baseURL: RXSOFT_API_BASE_URL,
  timeout: 15000,
});

export async function downloadBlob(config: AxiosRequestConfig, filename: string): Promise<void> {
  const response = await rxsoftApi.request<Blob>({
    ...config,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}