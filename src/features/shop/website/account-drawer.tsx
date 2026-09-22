import {
  Avatar,
  Box,
  Button,
  Drawer,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import {
  CreditCard,
  Gift,
  Heart,
  LogOut,
  MapPin,
  Pill,
  Receipt,
  Stethoscope,
  Truck,
} from 'lucide-react';
import { useAuthStore } from './auth-store';
import { useAccountDrawerStore } from './account-drawer-store';
import { AuthPanel } from '../auth/auth-panel';
import { green, ink, muted, line, soft, buttonStyles } from './components';
import { useOrders, usePrescriptions, useRewards } from './hooks';

const DASHBOARD_LINKS = [
  { label: 'My Orders', icon: Receipt, path: '/shop/orders' },
  { label: 'Prescriptions', icon: Pill, path: '/shop/my-prescriptions' },
  { label: 'Saved Medicines', icon: Heart, path: '/shop/dashboard' },
  { label: 'Consultation History', icon: Stethoscope, path: '/shop/consultations' },
  { label: 'Rewards & Points', icon: Gift, path: '/shop/rewards' },
  { label: 'Addresses', icon: MapPin, path: '/shop/dashboard' },
  { label: 'Payment Methods', icon: CreditCard, path: '/shop/dashboard' },
];

function LoggedOutView({ onSuccess, initialTab }: { onSuccess: () => void; initialTab: 'signin' | 'register' }) {
  return (
    <Box p="xl">
      <Stack gap={4} mb="lg" align="center">
        <Text fw={900} size="xl" className="damorex-heading">
          Damorex
        </Text>
        <Text size="sm" c={muted} ta="center">
          Sign in or create an account to continue.
        </Text>
      </Stack>
      <AuthPanel variant="drawer" initialTab={initialTab} onSuccess={onSuccess} />
    </Box>
  );
}

function LoggedInView({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data: orders } = useOrders();
  const { data: prescriptions } = usePrescriptions();
  const { data: rewards } = useRewards();

  const initials = user?.username
    ? user.username
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const activeOrders =
    orders?.filter((o: any) => o.status !== 'Delivered' && o.status !== 'Cancelled').length ?? 0;
  const pendingPrescriptions =
    prescriptions?.filter((p: any) => p.status === 'Pending').length ?? 0;
  const rewardPoints = rewards?.totalPoints ?? 0;

  const handleLogout = () => {
    logout();
    onClose();
    navigate({ to: '/shop' });
  };

  return (
    <>
      <Box
        p="xl"
        style={{
          background: `radial-gradient(circle at 20% 30%, rgba(22,163,74,0.12), transparent 60%), ${soft}`,
          borderBottom: `1px solid ${line}`,
        }}
      >
        <Stack align="center" gap="sm">
          <Avatar
            radius="xl"
            size={72}
            style={{ background: green, color: '#fff', fontWeight: 900, fontSize: 28 }}
          >
            {initials}
          </Avatar>
          <Box ta="center">
            <Text fw={900} size="lg" c={ink}>
              {user?.username || 'User'}
            </Text>
            <Text size="sm" c={muted}>
              {user?.email || ''}
            </Text>
          </Box>
        </Stack>
      </Box>

      <Stack p="md" gap={4} style={{ flex: 1 }}>
        <Paper radius={16} p="sm" withBorder style={{ borderColor: line }}>
          <Group grow gap="xs">
            {[
              { value: activeOrders, label: 'Active Orders', icon: Truck },
              { value: pendingPrescriptions, label: 'Pending Rx', icon: Pill },
              { value: rewardPoints, label: 'Points', icon: Gift },
            ].map((stat) => (
              <Stack key={stat.label} align="center" gap={2}>
                <ThemeIcon radius="xl" size={32} color="green" variant="light">
                  <stat.icon size={16} />
                </ThemeIcon>
                <Text fw={900} size="lg" c={ink}>
                  {stat.value}
                </Text>
                <Text size="xs" c={muted} ta="center">
                  {stat.label}
                </Text>
              </Stack>
            ))}
          </Group>
        </Paper>

        <Stack gap={2}>
          {DASHBOARD_LINKS.map((link) => (
            <Group
              key={link.label}
              gap="sm"
              p="sm"
              style={{
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'background 220ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = soft;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              onClick={() => {
                onClose();
                navigate({ to: link.path as any });
              }}
            >
              <ThemeIcon radius="xl" size={36} color="green" variant="light">
                <link.icon size={18} />
              </ThemeIcon>
              <Text fw={700} size="sm" c={ink}>
                {link.label}
              </Text>
            </Group>
          ))}
        </Stack>
      </Stack>

      <Box p="md">
        <Button
          radius="xl"
          variant="outline"
          color="red"
          fullWidth
          leftSection={<LogOut size={16} />}
          styles={buttonStyles}
          style={{ borderColor: line, color: '#EF4444' }}
          onClick={handleLogout}
        >
          Sign Out
        </Button>
      </Box>
    </>
  );
}

export default function AccountDrawer() {
  const { isAuthenticated } = useAuthStore();
  const opened = useAccountDrawerStore((s) => s.opened);
  const close = useAccountDrawerStore((s) => s.close);
  const tab = useAccountDrawerStore((s) => s.tab);

  return (
    <Drawer
      opened={opened}
      onClose={close}
      position="right"
      size={380}
      padding={0}
      styles={{
        body: {
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        },
      }}
    >
      {isAuthenticated ? (
        <LoggedInView onClose={close} />
      ) : (
        <LoggedOutView key={tab} onSuccess={close} initialTab={tab} />
      )}
    </Drawer>
  );
}
