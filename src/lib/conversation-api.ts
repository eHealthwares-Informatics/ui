import type { AxiosRequestConfig } from 'axios';
import { createAuthApiClient } from '@/lib/create-api-client';

export const CONVERSATION_API_BASE_URL =
  (import.meta.env.VITE_CONVERSATION_API_URL as string | undefined) ?? 'http://localhost:8001/api';

/** @deprecated Use CONVERSATION_API_BASE_URL instead */
export const API_BASE_URL = CONVERSATION_API_BASE_URL;

export const conversationApi = createAuthApiClient({
  baseURL: CONVERSATION_API_BASE_URL,
  timeout: 15000,
});

export async function downloadBlob(config: AxiosRequestConfig, filename: string): Promise<void> {
  const response = await conversationApi.request<Blob>({
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