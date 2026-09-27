import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select,
  Radio,
  Group,
  Stack,
  Text,
  Button,
  Card,
  useMantineColorScheme,
  MantineColorScheme,
} from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { fonts } from '@/config/fonts';
import { useFont } from '@/context/font-provider';
import { useTheme } from '@/context/theme-provider';
import { showSubmittedData } from '@/lib/show-submitted-data';

const appearanceFormSchema = z.object({
  theme: z.enum(['light', 'dark']),
  font: z.enum(fonts),
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

export function AppearanceForm() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useMantineColorScheme();

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: colorScheme as 'light' | 'dark',
      font: fonts[0],
    },
  });

  function onSubmit(data: AppearanceFormValues) {
    if (data.theme !== colorScheme) {
      setColorScheme(data.theme);
    }
    showSubmittedData(data);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Stack gap="xl">
        {/* FONT */}
        <Controller
          name="font"
          control={form.control}
          render={({ field }) => (
            <Select
              label="Font"
              data={fonts.map((f) => ({ value: f, label: f }))}
              value={field.value}
              onChange={(value) => field.onChange(value)}
              description="Set the font you want to use in the dashboard."
              searchable
            />
          )}
        />

        {/* THEME */}
        <Controller
          name="theme"
          control={form.control}
          render={({ field }) => (
            <div>
              <Text fw={500}>Theme</Text>
              <Text size="sm" c="dimmed">
                Select the theme for the dashboard.
              </Text>

              <Radio.Group value={field.value} onChange={field.onChange} mt="md">
                <Group align="flex-start">
                  {/* LIGHT */}
                  <Card
                    withBorder
                    p="xs"
                    radius="md"
                    style={{
                      cursor: 'pointer',
                      border:
                        field.value === 'light'
                          ? '2px solid var(--mantine-color-blue-6)'
                          : undefined,
                    }}
                    onClick={() => field.onChange('light')}
                  >
                    <Stack align="center" gap={6}>
                      <Radio value="light" label="Light" />

                      {/* Preview */}
                      <div style={{ width: 120 }}>
                        <div style={{ background: '#ecedef', padding: 8 }}>
                          <div style={{ background: '#fff', padding: 6, marginBottom: 6 }} />
                          <div style={{ background: '#fff', padding: 6 }} />
                        </div>
                      </div>
                    </Stack>
                  </Card>

                  {/* DARK */}
                  <Card
                    withBorder
                    p="xs"
                    radius="md"
                    style={{
                      cursor: 'pointer',
                      border:
                        field.value === 'dark'
                          ? '2px solid var(--mantine-color-blue-6)'
                          : undefined,
                    }}
                    onClick={() => field.onChange('dark')}
                  >
                    <Stack align="center" gap={6}>
                      <Radio value="dark" label="Dark" />

                      {/* Preview */}
                      <div style={{ width: 120 }}>
                        <div style={{ background: '#020617', padding: 8 }}>
                          <div style={{ background: '#1e293b', padding: 6, marginBottom: 6 }} />
                          <div style={{ background: '#1e293b', padding: 6 }} />
                        </div>
                      </div>
                    </Stack>
                  </Card>
                </Group>
              </Radio.Group>
            </div>
          )}
        />

        <Button type="submit">Update preferences</Button>
      </Stack>
    </form>
  );
}
