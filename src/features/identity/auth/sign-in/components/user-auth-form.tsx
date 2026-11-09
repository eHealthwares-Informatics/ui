import { zodResolver } from '@hookform/resolvers/zod';
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Group,
  Divider,
  Checkbox,
} from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getRememberMe } from '@/lib/auth-tokens';
import { useAuthStore } from '@/stores/auth-store';

const formSchema = z.object({
  username: z.string().min(1, 'Please enter your username'),
  password: z.string().min(1, 'Please enter your password'),
});

/** Provider glyphs for the social buttons (brand-correct SVG marks). */
function SocialIconGoogle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
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
  );
}

function SocialIconFacebook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z"
        fill="#1877F2"
      />
    </svg>
  );
}

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string;
}

export function UserAuthForm({ className, redirectTo, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  // "Remember me" — persisted preference; on = tokens survive a browser
  // restart (localStorage), off = session-only (sessionStorage).
  const [remember, setRemember] = useState(getRememberMe);
  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: 'admin',
      password: 'test',
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);

    await login(data.username, data.password, remember);

    setIsLoading(false);

    if (useAuthStore.getState().user) {
      window.location.href = redirectTo || '/';
    }
  }

  /** Google / Facebook popup sign-in: the browser gets the provider token,
   * the identity service verifies it and links (or auto-registers) the
   * console account by verified email. */
  const [socialBusy, setSocialBusy] = useState<'google' | 'facebook' | null>(null);

  async function handleSocial(provider: 'google' | 'facebook') {
    if (socialBusy) return;
    setSocialBusy(provider);
    try {
      const { googleLogin, facebookLogin } = await import('@/lib/social-auth');
      const accessToken = provider === 'google' ? await googleLogin() : await facebookLogin();
      if (!accessToken) return; // user closed the popup
      setIsLoading(true);
      await useAuthStore.getState().loginWithOAuth(provider, { accessToken });
      if (useAuthStore.getState().user) {
        window.location.href = redirectTo || '/';
      }
    } catch (err) {
      useAuthStore.setState({
        error: err instanceof Error ? err.message : 'Social sign in failed',
      });
    } finally {
      setIsLoading(false);
      setSocialBusy(null);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={className} {...props}>
      <Stack gap="sm">
        {/* Username */}
        <TextInput
          label="Username"
          placeholder="admin"
          {...form.register('username')}
          error={form.formState.errors.username?.message}
        />

        {/* Password + Forgot */}
        <div style={{ position: 'relative' }}>
          <PasswordInput
            label="Password"
            placeholder="********"
            {...form.register('password')}
            error={form.formState.errors.password?.message}
          />

          <Link
            to="/forgot-password"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              fontSize: 12,
              color: 'var(--mantine-color-dimmed)',
            }}
          >
            Forgot password?
          </Link>
        </div>

        {/* Remember me */}
        <Checkbox
          label="Remember me"
          size="sm"
          data-testid="sign-in-remember-me"
          checked={remember}
          onChange={(event) => setRemember(event.currentTarget.checked)}
        />

        {/* Error */}
        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        {/* Submit */}
        <Button type="submit" loading={isLoading} leftSection={<LogIn size={16} />}>
          Sign in
        </Button>

        {/* Divider */}
        <Divider label="Or continue with" labelPosition="center" />

        {/* Social login */}
        <Group grow>
          <Button
            variant="outline"
            leftSection={<SocialIconGoogle />}
            disabled={isLoading}
            onClick={() => void handleSocial('google')}
          >
            Google
          </Button>

          <Button
            variant="outline"
            leftSection={<SocialIconFacebook />}
            disabled={isLoading}
            onClick={() => void handleSocial('facebook')}
          >
            Facebook
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
