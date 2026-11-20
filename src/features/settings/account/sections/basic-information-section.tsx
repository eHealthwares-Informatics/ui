import { Alert, Button, Card, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { AtSign, Mail, Phone, User } from 'lucide-react';
import { useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { identityApi } from '@/lib/identity-api';
import { useAuthStore } from '@/stores/auth-store';

type BasicInformationValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

/**
 * Basic identity details for the signed-in user. Editable and persisted through
 * the self-service `PATCH /users/me` endpoint (identity), then mirrored into the
 * auth store so the header/profile reflect the change immediately.
 */
export function BasicInformationSection() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<BasicInformationValues>({
    initialValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    },
    validate: {
      firstName: (value) => {
        if (!value.trim()) {
          return 'Please enter your first name.';
        }
        if (value.trim().length < 2) {
          return 'First name must be at least 2 characters.';
        }
        return null;
      },
      lastName: (value) =>
        value && value.trim().length > 0 && value.trim().length < 2
          ? 'Last name must be at least 2 characters.'
          : null,
      email: (value) =>
        value && !/^\S+@\S+\.\S+$/.test(value) ? 'Enter a valid email address.' : null,
    },
  });

  const handleSubmit = async (values: BasicInformationValues) => {
    setSubmitError(null);
    setSaving(true);
    try {
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim() || null,
        email: values.email.trim() || undefined,
        phone: values.phone.trim() || undefined,
      };

      await identityApi.patch('/users/me', payload);

      updateUser({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
      });

      notifications.show({
        color: 'green',
        title: 'Profile updated',
        message: 'Your basic details have been saved.',
      });
    } catch (error) {
      const message = getApiErrorMessage(error);
      setSubmitError(message);
      notifications.show({
        color: 'red',
        title: 'Update failed',
        message,
      });
    } finally {
      setSaving(false);
    }
  };

  const hasErrors = Object.keys(form.errors).length > 0;

  return (
    <Card withBorder radius="md" p="lg" data-testid="account-basic-information">
      <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
        <Stack gap="md">
          <Stack gap={2}>
            <Title order={3}>Basic information</Title>
            <Text size="sm" c="dimmed">
              Your name and contact details. These are shown on your profile and used in emails.
            </Text>
          </Stack>

          {hasErrors && (
            <Alert color="red" variant="light" data-testid="account-form-errors">
              Please fix the highlighted fields before saving.
            </Alert>
          )}

          {submitError && !hasErrors && (
            <Alert color="red" variant="light" data-testid="account-submit-error">
              {submitError}
            </Alert>
          )}

          <Group align="flex-start" grow gap="md">
            <TextInput
              label="First name"
              placeholder="First name"
              leftSection={<User size={16} strokeWidth={1.5} />}
              data-testid="account-first-name"
              {...form.getInputProps('firstName')}
            />
            <TextInput
              label="Last name"
              placeholder="Last name"
              leftSection={<User size={16} strokeWidth={1.5} />}
              data-testid="account-last-name"
              {...form.getInputProps('lastName')}
            />
          </Group>

          <TextInput
            label="Email"
            placeholder="you@example.com"
            leftSection={<Mail size={16} strokeWidth={1.5} />}
            data-testid="account-email"
            {...form.getInputProps('email')}
          />

          <TextInput
            label="Phone"
            placeholder="+1 555 000 0000"
            leftSection={<Phone size={16} strokeWidth={1.5} />}
            data-testid="account-phone"
            {...form.getInputProps('phone')}
          />

          <TextInput
            label="Username"
            value={user?.username ?? ''}
            leftSection={<AtSign size={16} strokeWidth={1.5} />}
            disabled
            description="Your username cannot be changed."
          />

          <Group justify="flex-end">
            <Button
              type="submit"
              loading={saving}
              data-testid="account-save"
              disabled={!form.isDirty() && !hasErrors}
            >
              Save changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}
