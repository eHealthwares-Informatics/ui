import {
  Card,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
  Box,
} from '@mantine/core';
import { Mail, User, Link } from 'lucide-react';

type FieldProps = {
  label: string;
  description: string;
  value: string;
  readOnly?: boolean;
  icon?: React.ReactNode;
  placeholder?: string;
};

function Field({ label, description, value, readOnly, icon, placeholder }: FieldProps) {
  return (
    <Stack gap="xs">
      <Group align="center" gap="xs" wrap="nowrap">
        {icon && <Box size={18} style={{ lineHeight: 1 }}>{icon}</Box>}
        <Text fw={600} size="sm">{label}</Text>
        <Text fw={600} size="sm">{label}</Text>
      </Group>
      <Text size="xs" c="dimmed">{description}</Text>
      <TextInput
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        style={{ height: 34 }}
        disabled={readOnly}
      />
    </Stack>
  );
}

export function BasicInformationSection() {
  return (
    <Card withBorder radius="md" p="lg" data-testid="account-basic-information">
      <Stack gap="md">
        <Title order={3}>Basic information</Title>

        <Field
          icon={<User size={16} strokeWidth={1.5} />}
          label="First name"
          description="Your first name. Enter to personalize your account."
          value="John"
          placeholder="First name"
        />

        <Field
          icon={<User size={16} strokeWidth={1.5} />}
          label="Last name"
          description="Your last name. Used for easier identification."
          value="Doe"
          placeholder="Last name"
        />

        <Field
          icon={<Mail size={16} strokeWidth={1.5} />}
          label="Email"
          description="Email address associated with your account. This cannot be changed."
          value="johnhealthwares@gmail.com"
          readOnly
        />

        <Field
          icon={<Link size={16} strokeWidth={1.5} />}
          label="GitHub username"
          description="To link your account, just sign in with GitHub on the login page. Make sure that your email address matches the primary email on GitHub."
          value="ehealthwares"
          placeholder="GitHub username"
        />

        <Field
          icon={<Link size={16} strokeWidth={1.5} />}
          label="GitLab username"
          description="To link your account, just sign in with GitLab on the login page. Make sure that your email address matches the primary email on GitLab."
          value="Not connected"
          readOnly
        />

        <Field
          icon={<Link size={16} strokeWidth={1.5} />}
          label="Google account"
          description="To link your account, just sign in with Google on the login page. Make sure that your email address matches the one Google has verified."
          value="Not connected"
          readOnly
        />
      </Stack>
    </Card>
  );
}
