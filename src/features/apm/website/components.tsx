import { Text, ThemeIcon, Box, Group, Stack, Title, Button, Card, Divider } from '@mantine/core';
import { BadgeCheck, Calendar, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { apmBlue, ink, muted, apmGreen } from './layout';

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Stack gap={4} style={{ textAlign: 'center', marginBottom: '3rem' }}>
      <Title
        order={2}
        style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: ink,
        }}
      >
        {title}
      </Title>
      {subtitle && (
        <Text size="lg" style={{ color: muted, maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
          {subtitle}
        </Text>
      )}
    </Stack>
  );
}

export function PrimaryButton({
  children,
  onClick,
  fullWidth,
  type,
}: {
  children: ReactNode;
  onClick?: any;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) {
  return (
    <Button
      type={type}
      onClick={onClick}
      fullWidth={fullWidth}
      styles={{
        root: {
          background: apmBlue,
          border: 'none',
          fontWeight: 700,
          fontSize: '1rem',
          padding: '12px 32px',
          height: 'auto',
          transition:
            'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease, background-color 220ms ease',
          '&:hover': {
            background: '#0052A3',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,102,204,0.25)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:focus-visible': {
            outline: '3px solid rgba(0,102,204,0.5)',
            outlineOffset: '2px',
          },
        },
      }}
    >
      {children}
    </Button>
  );
}

export function OutlineButton({
  children,
  onClick,
  fullWidth,
}: {
  children: ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      fullWidth={fullWidth}
      variant="outline"
      styles={{
        root: {
          borderColor: apmBlue,
          color: apmBlue,
          fontWeight: 700,
          fontSize: '1rem',
          padding: '12px 32px',
          height: 'auto',
          background: 'transparent',
          transition:
            'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease, background-color 220ms ease, color 220ms ease',
          '&:hover': {
            background: apmBlue,
            color: '#fff',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,102,204,0.15)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:focus-visible': {
            outline: '3px solid rgba(0,102,204,0.5)',
            outlineOffset: '2px',
          },
        },
      }}
    >
      {children}
    </Button>
  );
}

export function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Box style={{ textAlign: 'center', padding: '16px 0' }}>
      <Text
        style={{
          fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
          fontWeight: 800,
          color: apmBlue,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </Text>
      <Text size="sm" style={{ color: muted, marginTop: 4 }}>
        {label}
      </Text>
    </Box>
  );
}

export function AchievementCard({
  title,
  summary,
  category,
  icon,
}: {
  title: string;
  summary: string;
  category: string;
  icon: ReactNode;
}) {
  return (
    <Card
      padding="xl"
      radius="md"
      styles={{
        root: {
          border: '1px solid #E2E8F0',
          background: '#fff',
          transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
          },
        },
      }}
    >
      <Stack gap="sm">
        <ThemeIcon size={48} radius="xl" color={apmBlue} variant="light">
          {icon}
        </ThemeIcon>
        <Text
          size="xs"
          fw={600}
          style={{ color: apmBlue, textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          {category}
        </Text>
        <Text fw={700} style={{ fontSize: '1.1rem', color: ink, lineHeight: 1.4 }}>
          {title}
        </Text>
        <Text size="sm" style={{ color: muted, lineHeight: 1.7 }}>
          {summary}
        </Text>
      </Stack>
    </Card>
  );
}

export function NewsCard({
  title,
  excerpt,
  category,
  publishedAt,
  authorName,
  slug,
}: {
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  authorName: string;
  slug: string;
}) {
  const date = new Date(publishedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card
      padding="lg"
      radius="md"
      component="a"
      href={`/apm/news/${slug}`}
      styles={{
        root: {
          border: '1px solid #E2E8F0',
          background: '#fff',
          textDecoration: 'none',
          transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
          },
        },
      }}
    >
      <Stack gap="xs">
        <Text
          size="xs"
          fw={600}
          style={{ color: apmBlue, textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          {category}
        </Text>
        <Text fw={700} style={{ fontSize: '1.05rem', color: ink, lineHeight: 1.4 }}>
          {title}
        </Text>
        <Text size="sm" style={{ color: muted, lineHeight: 1.7 }}>
          {excerpt}
        </Text>
        <Group gap="xs">
          <Text size="xs" style={{ color: muted }}>
            {date}
          </Text>
          {authorName && (
            <>
              <Text size="xs" style={{ color: muted }}>
                ·
              </Text>
              <Text size="xs" style={{ color: muted }}>
                {authorName}
              </Text>
            </>
          )}
        </Group>
      </Stack>
    </Card>
  );
}

export function EventCard({
  title,
  description,
  location,
  eventDate,
  eventTime,
  category,
  onClick,
}: {
  title: string;
  description: string;
  location: string;
  eventDate: string;
  eventTime: string;
  category: string;
  onClick?: () => void;
}) {
  const date = new Date(eventDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card
      padding="lg"
      radius="md"
      onClick={onClick}
      styles={{
        root: {
          border: '1px solid #E2E8F0',
          background: '#fff',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
          },
        },
      }}
    >
      <Stack gap="xs">
        <Text
          size="xs"
          fw={600}
          style={{ color: apmBlue, textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          {category}
        </Text>
        <Text fw={700} style={{ fontSize: '1.05rem', color: ink, lineHeight: 1.4 }}>
          {title}
        </Text>
        <Text size="sm" style={{ color: muted, lineHeight: 1.7 }}>
          {description?.slice(0, 100)}
          {(description?.length ?? 0) > 100 ? '…' : ''}
        </Text>
        <Divider color="#E2E8F0" />
        <Group gap="lg">
          <Group gap={6}>
            <MapPin size={14} color={muted} />
            <Text size="xs" style={{ color: muted }}>
              {location}
            </Text>
          </Group>
          <Group gap={6}>
            <Calendar size={14} color={muted} />
            <Text size="xs" style={{ color: muted }}>
              {date} · {eventTime}
            </Text>
          </Group>
        </Group>
      </Stack>
    </Card>
  );
}

export function TestimonialCard({
  name,
  text,
  focus,
  isVerified,
}: {
  name: string;
  text: string;
  focus: string;
  isVerified: boolean;
}) {
  return (
    <Card
      padding="xl"
      radius="md"
      styles={{
        root: {
          border: '1px solid #E2E8F0',
          background: '#fff',
        },
      }}
    >
      <Stack gap="md">
        <Text size="md" style={{ color: ink, lineHeight: 1.8, fontStyle: 'italic' }}>
          &ldquo;{text}&rdquo;
        </Text>
        <Group gap="xs">
          {isVerified && <BadgeCheck size={16} color={apmBlue} />}
          <Box>
            <Text fw={700} size="sm" style={{ color: ink }}>
              {name}
            </Text>
            {focus && (
              <Text size="xs" style={{ color: muted }}>
                {focus}
              </Text>
            )}
          </Box>
        </Group>
      </Stack>
    </Card>
  );
}

export function GreenBadge({ children }: { children: ReactNode }) {
  return (
    <Box
      style={{
        background: '#DCFCE7',
        color: apmGreen,
        borderRadius: 9999,
        padding: '4px 14px',
        fontSize: 13,
        fontWeight: 600,
        display: 'inline-block',
      }}
    >
      {children}
    </Box>
  );
}
