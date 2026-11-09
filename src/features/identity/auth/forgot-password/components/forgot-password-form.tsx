import { zodResolver } from '@hookform/resolvers/zod';
import { Button, TextInput, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { sleep } from '@/lib/utils';

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Please enter your email' : undefined),
  }),
});

export function ForgotPasswordForm({ className, ...props }: React.HTMLAttributes<HTMLFormElement>) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);

    notifications.show({
      id: 'forgot-password',
      loading: true,
      title: 'Sending email...',
      message: 'Please wait while we send your reset link',
      autoClose: false,
      withCloseButton: false,
    });

    try {
      await sleep(2000);

      form.reset();
      navigate({ to: '/otp' });

      notifications.update({
        id: 'forgot-password',
        color: 'teal',
        title: 'Email sent',
        message: `Email sent to ${data.email}`,
        loading: false,
        autoClose: 3000,
      });
    } catch (err) {
      notifications.update({
        id: 'forgot-password',
        color: 'red',
        title: 'Error',
        message: 'Something went wrong',
        loading: false,
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={className} {...props}>
      <Stack gap="sm">
        <TextInput
          label="Email"
          placeholder="name@example.com"
          {...form.register('email')}
          error={form.formState.errors.email?.message}
        />

        <Button
          type="submit"
          loading={isLoading}
          rightSection={
            !isLoading ? <ArrowRight size={16} /> : <Loader2 size={16} className="animate-spin" />
          }
        >
          Continue
        </Button>
      </Stack>
    </form>
  );
}
