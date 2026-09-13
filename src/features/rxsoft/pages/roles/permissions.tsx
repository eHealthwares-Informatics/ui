import { Box, Button, Group, Loader, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PermissionPicker } from '@/features/components/form/permission-picker';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { useAuthStore } from '@/stores/auth-store';

export function RolePermissionsPage() {
  const { id } = useParams({} as any);
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);

  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    const fetch = async () => {
      try {
        const roleRes = await rxsoftApi.get<{ permissionCodes: string[] }>(`/roles/${id}`);
        setSelected(roleRes.data.permissionCodes ?? []);
      } catch {
        notifications.show({ color: 'red', message: 'Failed to load permissions' });
        setLoadFailed(true);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [accessToken, id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await rxsoftApi.put(`/roles/${id}`, {
        permissionCodes: selected,
      });
      notifications.show({ color: 'green', message: 'Permissions updated' });
      (navigate as any)({ to: '/roles' });
    } catch {
      notifications.show({ color: 'red', message: 'Failed to save permissions' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box p="xl" style={{ textAlign: 'center' }}>
        <Loader />
      </Box>
    );
  }

  if (loadFailed) {
    return (
      <Box p="md" maw={900}>
        <Text c="red">Failed to load role permissions.</Text>
      </Box>
    );
  }

  return (
    <Box p="md" maw={1100}>
      <Group mb="lg">
        <Button
          variant="subtle"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => (navigate as any)({ to: '/roles' })}
        >
          Back to Roles
        </Button>
      </Group>

      <Title order={3} mb="xs">
        Role Permissions
      </Title>
      <Text c="dimmed" mb="lg">
        Select the modules and actions this role can access.
      </Text>

      <PermissionPicker
        value={selected}
        onChange={setSelected}
        apiProvider={rxsoftApi}
        height={520}
      />

      <Group mt="xl">
        <Button leftSection={<Save size={16} />} loading={saving} onClick={handleSave}>
          Save Permissions
        </Button>
      </Group>
    </Box>
  );
}
