import { notifications } from '@mantine/notifications';
import { getApiErrorMessage } from './get-api-error-message';

export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error, (error as any).response);

  if (error && typeof error === 'object' && 'status' in error && Number(error.status) === 204) {
    notifications.show({
      title: 'Content not found',
      message: 'The requested content was not found.',
      color: 'red',
    });
    return;
  }

  notifications.show({ title: 'Server Error', message: getApiErrorMessage(error), color: 'red' });
}
