import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Group,
  Input,
  Paper,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from '@tanstack/react-router';
import {
  Apple,
  CreditCard,
  Eye,
  Gift,
  Heart,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Pill,
  Receipt,
  Stethoscope,
  Truck,
  User,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from './auth-store';
import { useAccountDrawerStore } from './account-drawer-store';
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

function LoggedOutView({ onSuccess, onClose, initialTab }: { onSuccess: () => void; onClose: () => void; initialTab?: string }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<string | null>(initialTab ?? 'signin');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const authLogin = useAuthStore((s) => s.login);
  const authRegister = useAuthStore((s) => s.register);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {return;}
    setLoginLoading(true);
    try {
      await authLogin(loginEmail, loginPassword);
      onSuccess();
    } catch {
      notifications.show({ message: 'Invalid credentials.', color: 'red' });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName || !regPassword || regPassword !== regConfirm) {
      notifications.show({ message: 'Please fill all fields and ensure passwords match.', color: 'red' });
      return;
    }
    setRegLoading(true);
    try {
      await authRegister({ username: regName, email: regEmail || undefined, phone: regPhone || undefined, password: regPassword });
      onSuccess();
    } catch {
      notifications.show({ message: 'Registration failed.', color: 'red' });
    } finally {
      setRegLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Social login: ${provider}`);
  };

  return (
    <>
      <Box p="xl">
        <Stack gap="sm" mb="lg">
          <Title order={3} className="damorex-heading" c={ink}>
            {tab === 'signin' ? 'Welcome Back' : 'Join Damorex'}
          </Title>
          <Text c={muted} size="sm" lh={1.6}>
            {tab === 'signin'
              ? 'Sign in to access your prescriptions, orders and rewards.'
              : 'Create an account for faster ordering, refills and rewards.'}
          </Text>
        </Stack>

        <Tabs value={tab} onChange={setTab}>
          <Tabs.List grow mb="lg">
            <Tabs.Tab value="signin" fw={800} style={{ fontSize: 14 }}>
              Sign In
            </Tabs.Tab>
            <Tabs.Tab value="register" fw={800} style={{ fontSize: 14 }}>
              Register
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="signin">
            <Stack gap="md">
              <div>
                <Text size="sm" fw={800} mb={4}>
                  Email
                </Text>
                <Input
                  placeholder="you@example.com"
                  radius="xl"
                  size="md"
                  leftSection={<Mail size={18} />}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.currentTarget.value)}
                  styles={{ input: { borderColor: '#CFE5D7' } }}
                />
              </div>
              <div>
                <Text size="sm" fw={800} mb={4}>
                  Password
                </Text>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  radius="xl"
                  size="md"
                  leftSection={<Eye size={18} />}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.currentTarget.value)}
                  styles={{ input: { borderColor: '#CFE5D7' } }}
                />
              </div>
              <Group justify="space-between">
                <Checkbox label="Remember me" color="green" size="xs" />
                <Text
                  size="xs"
                  fw={800}
                  c={green}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    onClose();
                    navigate({ to: '/shop/forgot-password' });
                  }}
                >
                  Forgot password?
                </Text>
              </Group>
              <Button
                radius="xl"
                size="md"
                fullWidth
                styles={buttonStyles}
                loading={loginLoading}
                style={{ background: green }}
                onClick={handleLogin}
              >
                Sign In
              </Button>

              <Divider label="or continue with" labelPosition="center" />

              <Group grow>
                <Button
                  radius="xl"
                  variant="outline"
                  color="gray"
                  leftSection={<Mail size={16} />}
                  styles={buttonStyles}
                  onClick={() => handleSocialLogin('Google')}
                  style={{ borderColor: line, color: ink }}
                >
                  Google
                </Button>
                <Button
                  radius="xl"
                  variant="outline"
                  color="gray"
                  leftSection={<Apple size={16} />}
                  styles={buttonStyles}
                  onClick={() => handleSocialLogin('Apple')}
                  style={{ borderColor: line, color: ink }}
                >
                  Apple
                </Button>
                <Button
                  radius="xl"
                  variant="outline"
                  color="gray"
                  leftSection={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  }
                  styles={buttonStyles}
                  onClick={() => handleSocialLogin('Facebook')}
                  style={{ borderColor: line, color: ink }}
                >
                  Facebook
                </Button>
              </Group>

              <Divider label="or" labelPosition="center" />

              <Button
                radius="xl"
                variant="light"
                color="green"
                fullWidth
                leftSection={<MessageCircle size={16} />}
                styles={buttonStyles}
              >
                Guest Checkout
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="register">
            <Stack gap="md">
              <div>
                <Text size="sm" fw={800} mb={4}>
                  Full Name
                </Text>
                <Input
                  placeholder="Your full name"
                  radius="xl"
                  size="md"
                  leftSection={<User size={18} />}
                  value={regName}
                  onChange={(e) => setRegName(e.currentTarget.value)}
                  styles={{ input: { borderColor: '#CFE5D7' } }}
                />
              </div>
              <div>
                <Text size="sm" fw={800} mb={4}>
                  Email
                </Text>
                <Input
                  placeholder="you@example.com"
                  radius="xl"
                  size="md"
                  leftSection={<Mail size={18} />}
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.currentTarget.value)}
                  styles={{ input: { borderColor: '#CFE5D7' } }}
                />
              </div>
              <div>
                <Text size="sm" fw={800} mb={4}>
                  Phone
                </Text>
                <Input
                  placeholder="+234"
                  radius="xl"
                  size="md"
                  leftSection={<Phone size={18} />}
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.currentTarget.value)}
                  styles={{ input: { borderColor: '#CFE5D7' } }}
                />
              </div>
              <div>
                <Text size="sm" fw={800} mb={4}>
                  Password
                </Text>
                <Input
                  type="password"
                  placeholder="Create a strong password"
                  radius="xl"
                  size="md"
                  leftSection={<Eye size={18} />}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.currentTarget.value)}
                  styles={{ input: { borderColor: '#CFE5D7' } }}
                />
              </div>
              <div>
                <Text size="sm" fw={800} mb={4}>
                  Confirm Password
                </Text>
                <Input
                  type="password"
                  placeholder="Repeat your password"
                  radius="xl"
                  size="md"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.currentTarget.value)}
                  styles={{ input: { borderColor: '#CFE5D7' } }}
                />
              </div>
              <Button
                radius="xl"
                size="md"
                fullWidth
                leftSection={<UserPlus size={18} />}
                styles={buttonStyles}
                loading={regLoading}
                style={{ background: green }}
                onClick={handleRegister}
              >
                Create Account
              </Button>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Box>
    </>
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

      <Stack p="md" gap={4}>
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

      <Box p="md" style={{ marginTop: 'auto' }}>
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
        <LoggedOutView key={tab} onSuccess={close} onClose={close} initialTab={tab} />
      )}
    </Drawer>
  );
}
