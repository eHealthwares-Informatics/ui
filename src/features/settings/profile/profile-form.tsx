import {
  TextInput,
  Textarea,
  Button,
  Select,
  Stack,
  Group,
  Text,
  Anchor,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link } from '@tanstack/react-router';
import { showSubmittedData } from '@/lib/show-submitted-data';

type ProfileFormValues = {
  username: string;
  email: string;
  bio: string;
  urls: { value: string }[];
};

const defaultValues: ProfileFormValues = {
  username: '',
  email: '',
  bio: 'I own a computer.',
  urls: [{ value: 'https://shadcn.com' }, { value: 'http://twitter.com/shadcn' }],
};

export function ProfileForm() {
  const form = useForm<ProfileFormValues>({
    initialValues: defaultValues,

    validate: {
      username: (value) => {
        if (!value) {
          return 'Please enter your username.';
        }
        if (value.length < 2) {
          return 'Username must be at least 2 characters.';
        }
        if (value.length > 30) {
          return 'Username must not be longer than 30 characters.';
        }
        return null;
      },

      email: (value) => {
        if (!value) {
          return 'Please select an email to display.';
        }
        const ok = /^\S+@\S+\.\S+$/.test(value);
        if (!ok) {
          return 'Invalid email';
        }
        return null;
      },

      bio: (value) => {
        if (!value) {
          return 'Bio is required';
        }
        if (value.length < 4) {
          return 'Bio must be at least 4 characters';
        }
        if (value.length > 160) {
          return 'Bio must be under 160 characters';
        }
        return null;
      },

      urls: {
        value: (value) => {
          if (!value) {
            return 'URL is required';
          }
          try {
            new URL(value);
            return null;
          } catch {
            return 'Please enter a valid URL.';
          }
        },
      },
    },
  });

  return (
    <form onSubmit={form.onSubmit((data) => showSubmittedData(data))}>
      <Stack gap="md">
        {/* ===== Username ===== */}
        <TextInput
          label="Username"
          placeholder="shadcn"
          description="This is your public display name. It can be your real name or a pseudonym. You can only change this once every 30 days."
          {...form.getInputProps('username')}
        />

        {/* ===== Email ===== */}
        <Select
          label="Email"
          placeholder="Select a verified email to display"
          data={[
            { value: 'm@example.com', label: 'm@example.com' },
            { value: 'm@google.com', label: 'm@google.com' },
            { value: 'm@support.com', label: 'm@support.com' },
          ]}
          {...form.getInputProps('email')}
        />

        <Text size="sm" c="dimmed">
          You can manage verified email addresses in your{' '}
          <Anchor component={Link} to="/">
            email settings
          </Anchor>
          .
        </Text>

        {/* ===== Bio ===== */}
        <Textarea
          label="Bio"
          placeholder="Tell us a little bit about yourself"
          description="You can @mention other users and organizations to link to them."
          autosize
          minRows={3}
          {...form.getInputProps('bio')}
        />

        {/* ===== Dynamic URLs ===== */}
        <Stack gap="xs">
          <Text fw={500}>URLs</Text>
          <Text size="sm" c="dimmed">
            Add links to your website, blog, or social media profiles.
          </Text>

          {form.values.urls.map((_, index) => (
            <TextInput
              key={index}
              placeholder="https://example.com"
              {...form.getInputProps(`urls.${index}.value`)}
            />
          ))}

          <Button
            variant="outline"
            size="xs"
            onClick={() => form.insertListItem('urls', { value: '' })}
          >
            Add URL
          </Button>
        </Stack>

        <Divider />

        {/* ===== Submit ===== */}
        <Group justify="flex-end">
          <Button type="submit">Update profile</Button>
        </Group>
      </Stack>
    </form>
  );
}
