import { Button, Center, Stack, Text, Title, Group, Loader } from '@mantine/core';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { rxsoftApi } from '@/lib/rxsoft-api';

export function ServiceUnavailableError() {
  const navigate = useNavigate();
  const { return: returnPath, url: failedUrl } = useSearch({
    from: '/(errors)/service-unavailable',
  });
  const [retryCount, setRetryCount] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      setChecking(true);
      try {
        await rxsoftApi.get('/auth/me', { timeout: 5000 });
        clearInterval(interval);
        navigate({ to: returnPath || '/' });
      } catch {
        setRetryCount((c) => c + 1);
      } finally {
        setChecking(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Center style={{ height: '100vh', width: '100%' }}>
      <Stack align="center" gap="lg" maw={480}>
        <WifiOff size={64} strokeWidth={1.5} />
        <Title order={1}>Service Unavailable</Title>
        <Text c="dimmed" ta="center">
          The backend server is not responding. Automatically retrying...
        </Text>
        <Group>
          {checking ? <Loader size="sm" /> : null}
          <Text size="sm" c="dimmed">
            Retry #{retryCount}
          </Text>
        </Group>
        {failedUrl ? (
          <Text size="xs" c="dimmed">
            Failed URL: {failedUrl}
          </Text>
        ) : null}
        <Button
          leftSection={<RefreshCw size={16} />}
          onClick={() => {
            setRetryCount(0);
          }}
        >
          Retry Now
        </Button>
      </Stack>
    </Center>
  );
}
