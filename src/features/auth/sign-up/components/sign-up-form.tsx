import { TextInput, PasswordInput, Button, Divider, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';

export function SignUpForm(props: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },

    validate: {
      email: (value) => {
        if (!value) {
          return 'Please enter your email';
        }
        const isValid = /^\S+@\S+\.\S+$/.test(value);
        if (!isValid) {
          return 'Invalid email address';
        }
        return null;
      },

      password: (value) => {
        if (!value) {
          return 'Please enter your password';
        }
        if (value.length < 7) {
          return 'Password must be at least 7 characters long';
        }
        return null;
      },

      confirmPassword: (value, values) => {
        if (!value) {
          return 'Please confirm your password';
        }
        if (value !== values.password) {
          return "Passwords don't match";
        }
        return null;
      },
    },
  });

  function onSubmit(values: typeof form.values) {
    setIsLoading(true);

    // eslint-disable-next-line no-console

    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  }

  return (
    <form onSubmit={form.onSubmit(onSubmit)} {...props}>
      <Stack gap="sm">
        <TextInput label="Email" placeholder="name@example.com" {...form.getInputProps('email')} />

        <PasswordInput
          label="Password"
          placeholder="********"
          {...form.getInputProps('password')}
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="********"
          {...form.getInputProps('confirmPassword')}
        />

        <Button type="submit" loading={isLoading} mt="xs">
          Create Account
        </Button>

        <Divider label="Or continue with" labelPosition="center" />

        <Group grow>
          <Button variant="outline" type="button" disabled={isLoading}>
            GitHub
          </Button>

          <Button variant="outline" type="button" disabled={isLoading}>
            Facebook
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
