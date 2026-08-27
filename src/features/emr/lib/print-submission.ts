import { emrApi } from '@/lib/emr-api';
import type { FormSubmission } from './emr-types';

function openPdf(blob: Blob, filename: string): boolean {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.focus();
  } else {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

/** Requests the submission PDF from the backend, which renders a professional template, and opens it. */
export async function printSubmission(submission: FormSubmission): Promise<boolean> {
  try {
    const response = await emrApi.get<Blob>(`/form-submissions/${submission.id}/pdf`, {
      responseType: 'blob',
    });
    const filename = `submission-${submission.submissionNumber.replace(/[^\w.-]/g, '_')}.pdf`;
    return openPdf(response.data, filename);
  } catch {
    return false;
  }
}
