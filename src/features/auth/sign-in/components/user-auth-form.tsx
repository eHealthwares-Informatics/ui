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
          <Button variant="outline">GitHub</Button>

          <Button variant="outline">Facebook</Button>
        </Group>
      </Stack>
    </form>
  );
}
