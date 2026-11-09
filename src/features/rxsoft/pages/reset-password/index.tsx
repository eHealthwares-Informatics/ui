import { zodResolver } from '@hookform/resolvers/zod';
import { Card, Text, Stack, TextInput, Button } from '@mantine/core';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { AuthLayout } from '@/features/identity/auth/auth-layout';

const resetPasswordSchema = z.object({
  email: z.string().min(1, 'Please enter your email').email('Invalid email address'),
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function RxResetPasswordPage() {
  const [submitted, setSubmitted] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (values: ResetPasswordValues) => {
    setSubmitted(values.email);
    // TODO: call API here
  };

  return (
    <AuthLayout>
      <Card shadow="sm" padding="lg" radius="md">
        <Stack gap="md">
          {/* Header */}
          <div>
            <Text fw={600} size="lg">
              Reset Password
            </Text>
            <Text size="sm" c="dimmed">
              Enter your email and we’ll send you a reset link.
            </Text>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack gap="sm">
              <TextInput
                label="Email"
                placeholder="name@example.com"
                autoComplete="email"
                {...register('email')}
                error={errors.email?.message}
              />

              <Button type="submit" rightSection={<ArrowRight size={16} />}>
                Request Reset
              </Button>
            </Stack>
          </form>

          {/* Feedback */}
          {submitted && (
            <Text size="sm" c="dimmed">
              Reset link queued for <span style={{ fontWeight: 500 }}>{submitted}</span>.
            </Text>
          )}
        </Stack>
      </Card>
    </AuthLayout>
  );
}
