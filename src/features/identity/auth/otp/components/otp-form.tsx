import { zodResolver } from '@hookform/resolvers/zod';
import { PinInput, Button, Stack, Text } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { showSubmittedData } from '@/lib/show-submitted-data';

const formSchema = z.object({
  otp: z.string().min(6, 'Please enter the 6-digit code.').max(6, 'Please enter the 6-digit code.'),
});

type OtpFormProps = React.HTMLAttributes<HTMLFormElement>;

export function OtpForm({ className, ...props }: OtpFormProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: '' },
  });

  const otp = form.watch('otp');

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    showSubmittedData(data);

    setTimeout(() => {
      setIsLoading(false);
      navigate({ to: '/' });
    }, 1000);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={className} {...props}>
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          One-Time Password
        </Text>

        <PinInput
          length={6}
          value={form.watch('otp')}
          onChange={(value) => form.setValue('otp', value)}
          error={!!form.formState.errors.otp}
          type="number"
          inputMode="numeric"
          oneTimeCode
        />

        {form.formState.errors.otp && (
          <Text size="xs" c="red">
            {form.formState.errors.otp.message}
          </Text>
        )}
      </Stack>

      <Button type="submit" mt="sm" loading={isLoading} disabled={otp.length < 6 || isLoading}>
        Verify
      </Button>
    </form>
  );
}
