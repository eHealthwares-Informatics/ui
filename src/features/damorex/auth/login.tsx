import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Group,
  Input,
  Paper,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import {
  Apple,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  UserPlus,
  Eye,
  User,
  MessageCircle,
} from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useAuthStore } from '../website/auth-store';
import {
  WebsiteLayout,
  green,
  darkGreen,
  ink,
  muted,
  line,
  soft,
  buttonStyles,
} from '../website/layout';

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<string | null>('login');
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
      notifications.show({ message: 'Signed in successfully', color: 'green' });
      navigate({ to: '/damorex' });
    } catch {
      notifications.show({ message: 'Invalid credentials. Try again.', color: 'red' });
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
      notifications.show({ message: 'Account created successfully', color: 'green' });
      navigate({ to: '/damorex' });
    } catch {
      notifications.show({ message: 'Registration failed. Try again.', color: 'red' });
    } finally {
      setRegLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Social login with ${provider}`);
  };

  return (
    <WebsiteLayout>
      <Container size="sm" py={{ base: 28, md: 48 }}>
        <Tabs value={tab} onChange={setTab}>
          <Tabs.List grow mb="xl">
            <Tabs.Tab value="login" fw={800}>
              Sign In
            </Tabs.Tab>
            <Tabs.Tab value="register" fw={800}>
              Create Account
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="login">
            <Paper radius={30} p="xl" withBorder style={{ borderColor: line }}>
              <Stack gap="lg">
                <Box>
                  <Title order={2} className="damorex-heading">
                    Welcome Back
                  </Title>
                  <Text c={muted} lh={1.7}>
                    Sign in to access your prescriptions, orders and rewards.
                  </Text>
                </Box>

                <div>
                  <Text size="sm" fw={800} mb={4}>
                    Email or Phone
                  </Text>
                  <Input
                    placeholder="you@example.com or +234"
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
                    leftSection={<Lock size={18} />}
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
                    onClick={() => navigate({ to: '/shop/forgot-password' })}
                  >
                    Forgot password?
                  </Text>
                </Group>

                <Button
                  radius="xl"
                  size="lg"
                  fullWidth
                  leftSection={<ArrowRight size={18} />}
                  styles={buttonStyles}
                  loading={loginLoading}
                  style={{ background: green }}
                  onClick={handleLogin}
                >
                  Sign In
                </Button>

                <Divider label="or sign in with" labelPosition="center" />

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
                  leftSection={<Phone size={18} />}
                  styles={buttonStyles}
                >
                  Sign in with OTP
                </Button>
              </Stack>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="register">
            <Paper radius={30} p="xl" withBorder style={{ borderColor: line }}>
              <Stack gap="lg">
                <Box>
                  <Title order={2} className="damorex-heading">
                    Create Account
                  </Title>
                  <Text c={muted} lh={1.7}>
                    Join Damorex for faster ordering, refills and rewards.
                  </Text>
                </Box>

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
                    leftSection={<Lock size={18} />}
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
                  size="lg"
                  fullWidth
                  leftSection={<UserPlus size={18} />}
                  styles={buttonStyles}
                  loading={regLoading}
                  style={{ background: green }}
                  onClick={handleRegister}
                >
                  Create Account
                </Button>

                <Divider label="or register with" labelPosition="center" />

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
              </Stack>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Container>
    </WebsiteLayout>
  );
}
