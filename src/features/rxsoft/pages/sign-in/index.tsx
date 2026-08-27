import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  TextInput,
  PasswordInput,
  Stack,
  Box,
  Text,
  Checkbox,
  Group,
} from '@mantine/core';
import { useForm } from 'react-hook-form';
import { useMediaQuery } from '@mantine/hooks';
import z from 'zod';
import { useAuthStore } from '@/stores/auth-store';
import { Lock, User, ShieldCheck, Building2 } from 'lucide-react';
import { OnboardOrganisation } from './onboard-organisation';
import { useState } from 'react';

const signInSchema = z.object({
  username: z.string().min(1, 'Please enter your email or username'),
  password: z.string().min(1, 'Please enter your password'),
});

type SignInValues = z.infer<typeof signInSchema>;

// Footer
function Footer({ isMobile }: { isMobile: boolean }) {
  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: isMobile ? '12px' : '16px',
        color: '#94A3B8',
        fontSize: isMobile ? '12px' : '14px',
      }}
    >
      © {new Date().getFullYear()} eHealthwares. All rights reserved.
    </Box>
  );
}

export function RxSignIn({ redirectTo }: { redirectTo?: string }) {
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSmallMobile = useMediaQuery('(max-width: 480px)');
  const [mode, setMode] = useState<'signin' | 'onboard'>('signin');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: 'admin',
      password: 'test',
    },
  });

  const onSubmit = async (values: SignInValues) => {
    try {
      await login(values.username, values.password);

      const authState = useAuthStore.getState();

      if (authState.user) {
        const firstModule = authState.modules[0];
        const fallbackRoot = '/';
        const targetUrl = redirectTo || firstModule?.root || fallbackRoot;
        const finalUrl = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
        window.location.href = finalUrl;
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        background: 'linear-gradient(135deg, #F0FDFA 0%, #E0F2FE 50%, #F0F9FF 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background hexagons decoration */}
      <Box
        style={{
          position: 'absolute',
          top: '-150px',
          left: '-150px',
          opacity: 0.06,
        }}
      >
        <svg width="500" height="500" viewBox="0 0 500 500">
          <polygon points="250,10 430,110 430,310 250,410 70,310 70,110" fill="#0D9488" />
          <polygon points="250,60 380,130 380,270 250,340 120,270 120,130" fill="#14B8A6" />
        </svg>
      </Box>

      {/* Left/Top side - Branding */}
      <Box
        style={{
          flex: isMobile ? 'none' : '1.2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: isMobile ? '40px 24px 24px' : '60px 80px',
          order: isMobile ? 1 : 0,
        }}
      >
        {/* Main eHealthWares Logo */}
        <Box mb={isMobile ? 'md' : 'lg'} style={{ textAlign: 'center' }}>
          <img
            src="/assets/logo.png"
            alt="eHealthWares"
            style={{ 
              maxWidth: isMobile ? '240px' : '380px', 
              height: 'auto',
            }}
          />
        </Box>

        {!isMobile && (
          <>
            <Text 
              size="lg" 
              style={{ 
                color: '#475569',
                textAlign: 'center',
                maxWidth: '480px',
                lineHeight: 1.6,
                marginBottom: '32px',
              }}
            >
              An integrated digital healthcare platform that connects patients,
              providers and healthcare stakeholders to deliver smarter, safer and
              better care.
            </Text>

            {/* Feature hexagons row */}
            <Group 
              gap="xl" 
              justify="center"
              style={{ flexWrap: 'wrap' }}
            >
              {[
                { label: 'Secure', sublabel: '& Reliable', color: '#10B981', bgColor: '#D1FAE5' },
                { label: 'Seamless', sublabel: 'Connectivity', color: '#3B82F6', bgColor: '#DBEAFE' },
                { label: 'Smart', sublabel: 'Insights', color: '#8B5CF6', bgColor: '#EDE9FE' },
                { label: 'Better', sublabel: 'Outcomes', color: '#F59E0B', bgColor: '#FEF3C7' },
              ].map((item) => (
                <Box key={item.label} style={{ textAlign: 'center', width: '90px' }}>
                  <Box
                    style={{
                      width: 64,
                      height: 64,
                      margin: '0 auto 8px',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 64 64"
                    >
                      <polygon
                        points="32,2 58,17 58,47 32,62 6,47 6,17"
                        fill={item.bgColor}
                        stroke={item.color}
                        strokeWidth="2"
                      />
                    </svg>
                    <img
                      src="/assets/hexagon-logo.png"
                      alt={item.label}
                      style={{
                        position: 'absolute',
                        width: '32px',
                        height: '32px',
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                  <Text size="12px" fw={600} style={{ color: '#374151', lineHeight: 1.2 }}>
                    {item.label}
                  </Text>
                  <Text size="11px" style={{ color: '#94A3B8', lineHeight: 1.2 }}>
                    {item.sublabel}
                  </Text>
                </Box>
              ))}
            </Group>
          </>
        )}

        {/* Mobile: Show description and feature hexagons in compact form */}
        {isMobile && (
          <Text 
            size="sm" 
            style={{ 
              color: '#475569',
              textAlign: 'center',
              maxWidth: '320px',
              lineHeight: 1.5,
              marginBottom: '16px',
            }}
          >
            An integrated digital healthcare platform that connects patients,
            providers and healthcare stakeholders.
          </Text>
        )}
      </Box>

      {/* Right/Bottom side - Sign in form */}
      <Box
        style={{
          flex: isMobile ? 'none' : '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '0 16px 80px' : '40px',
          order: isMobile ? 0 : 0,
        }}
      >
        <Box
          style={{
            width: '100%',
            maxWidth: '420px',
            background: 'white',
            borderRadius: isMobile ? '16px 16px 0 0' : '16px',
            padding: isMobile ? (isSmallMobile ? '24px' : '32px') : '40px',
            boxShadow: isMobile 
              ? '0 -4px 20px rgba(0, 0, 0, 0.08)' 
              : '0 10px 40px rgba(0, 0, 0, 0.08)',
            marginTop: isMobile ? '-20px' : '0',
          }}
        >
          {/* Welcome header */}
          <Group mb="lg">
            <Box
              style={{
                width: isMobile ? 48 : 56,
                height: isMobile ? 48 : 56,
                flexShrink: 0,
              }}
            >
              <img
                src="/assets/hexagon-logo.png"
                alt="eHealthWares"
                style={{
                  width: isMobile ? '48px' : '56px',
                  height: isMobile ? '48px' : '56px',
                  objectFit: 'contain',
                }}
              />
            </Box>
            <Box>
              <Text fw={600} size={isMobile ? 'lg' : 'xl'} style={{ color: '#0F172A' }}>
                Welcome back
              </Text>
              <Text size="sm" style={{ color: '#64748B' }}>
                Sign in to your account to continue
              </Text>
            </Box>
          </Group>

          {mode === 'signin' ? (
          <form data-testid="sign-in-form" onSubmit={handleSubmit(onSubmit)}>
            <Stack gap={isMobile ? 'sm' : 'md'}>
              {/* Username / email field */}
              <Box>
                <Text fw={500} size="sm" mb={6} style={{ color: '#374151' }}>
                  Email or username
                </Text>
                <TextInput
                  data-testid="sign-in-username"
                  placeholder="Enter your email or username"
                  leftSection={<User size={18} color="#9CA3AF" />}
                  {...register('username')}
                  error={errors.username?.message}
                  styles={{
                    input: {
                      height: 48,
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      '&:focus': {
                        borderColor: '#3B82F6',
                      },
                    },
                  }}
                />
              </Box>

              {/* Password field */}
              <Box>
                <Text fw={500} size="sm" mb={6} style={{ color: '#374151' }}>
                  Password
                </Text>
                <PasswordInput
                  data-testid="sign-in-password"
                  placeholder="Enter your password"
                  leftSection={<Lock size={18} color="#9CA3AF" />}
                  {...register('password')}
                  error={errors.password?.message}
                  styles={{
                    input: {
                      height: 48,
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      '&:focus': {
                        borderColor: '#3B82F6',
                      },
                    },
                  }}
                />
              </Box>

              {/* Remember me & Forgot password */}
              <Group justify="space-between">
                <Checkbox
                  label="Remember me"
                  size="sm"
                  styles={{
                    label: { color: '#6B7280' },
                  }}
                />
                <Text
                  size="sm"
                  style={{ color: '#3B82F6', cursor: 'pointer' }}
                  component="a"
                  href="#"
                >
                  Forgot password?
                </Text>
              </Group>

              {/* Error message */}
              {error && (
                <Text data-testid="sign-in-error" size="sm" style={{ color: '#DC2626' }}>
                  {error}
                </Text>
              )}

              {/* Sign in button */}
              <Button
                data-testid="sign-in-submit"
                type="submit"
                loading={loading}
                fullWidth
                size="lg"
                style={{
                  height: 48,
                  borderRadius: '8px',
                  backgroundColor: '#3B82F6',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                <Lock size={18} style={{ marginRight: 8 }} />
                Sign In
              </Button>

              {/* Divider */}
              <Group gap="xs" mt="xs">
                <Box style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                <Text size="sm" style={{ color: '#9CA3AF' }}>
                  or
                </Text>
                <Box style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
              </Group>

              {/* Google sign in */}
              <Button
                variant="outline"
                fullWidth
                size="lg"
                style={{
                  height: 48,
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  fontWeight: 500,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </Button>

              {/* Security notice */}
              <Group justify="center" mt="md">
                <ShieldCheck size={16} color="#10B981" />
                <Text size="xs" style={{ color: '#6B7280' }}>
                  Your data is secure and encrypted
                </Text>
              </Group>

              {/* Onboard toggle */}
              <Group justify="center" mt={4}>
                <Text
                  size="sm"
                  style={{ color: '#10B981', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setMode('onboard')}
                >
                  <Building2 size={15} style={{ marginRight: 6, verticalAlign: -2 }} />
                  New here? Onboard your Organisation
                </Text>
              </Group>
            </Stack>
          </form>
          ) : (
            <OnboardOrganisation onBack={() => setMode('signin')} />
          )}
        </Box>
      </Box>

      <Footer isMobile={isMobile} />
    </Box>
  );
}
