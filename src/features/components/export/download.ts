import type { AxiosInstance, AxiosRequestConfig } from 'axios';

// Downloads a backend-generated file (CSV/PDF/…) using the caller's axios
// client so the request is authenticated for the active module's API.
export async function triggerBlobDownload(
  client: AxiosInstance,
  config: AxiosRequestConfig,
  filename: string,
): Promise<void> {
  const response = await client.request<Blob>({
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