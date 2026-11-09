import { Center, Paper, Stack, Group, Title } from '@mantine/core';
import { Box } from 'lucide-react';

type AuthLayoutProps = {
  children: React.ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Center h="100vh" px="md">
      <Paper shadow="md" p="lg" radius="md" w={420}>
        {/* HEADER */}
        <Group justify="center" gap="xs" mb="sm">
          <Box />
          <Title order={5} fw={600}>
            RxSoft Admin
          </Title>
        </Group>

        {/* CONTENT */}
        <Stack gap="sm">{children}</Stack>
      </Paper>
    </Center>
  );
}
