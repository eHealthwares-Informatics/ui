import {
  ActionIcon,
  Anchor,
  Box,
  Burger,
  Button,
  Container,
  Divider,
  Group,
  Image,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from '@tanstack/react-router';
import {
  ChevronRight,
  Heart,
  MapPin,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Share2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import logoImg from '../assets/logo.webp';

export const apmBlue = '#0066CC';
export const apmGreen = '#1F8A3B';
export const ink = '#1E293B';
export const muted = '#64748B';
export const line = '#E2E8F0';
export const soft = '#F8FAFC';
export const accent = '#F59E0B';

const navItems = [
  { label: 'Home', path: '/apm' },
  { label: 'Meet Adekanmbi', path: '/apm/meet' },
  { label: 'Oyo Next', path: '/apm/agenda' },
  { label: 'Achievements', path: '/apm/achievements' },
  { label: 'News', path: '/apm/news' },
  { label: 'Events', path: '/apm/events' },
  { label: 'Volunteer', path: '/apm/volunteer' },
  { label: 'Media', path: '/apm/media' },
  { label: 'Contact', path: '/apm/contact' },
];

export function WebsiteHeader() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const navigate = useNavigate();

  return (
    <>
      <Box
        style={{
          background: '#002D5A',
          color: '#fff',
          fontSize: 13,
        }}
      >
        <Container size="xl" py={8}>
          <Group justify="space-between" gap="xs">
            <Group gap="lg">
              <Text size="xs" fw={700}>
                Continuity with Competence
              </Text>
            </Group>
            <Group gap="lg" visibleFrom="sm">
              <Group gap={6}>
                <Phone size={13} aria-hidden />
                <Text size="xs" fw={600}>
                  0800-CALL-APM
                </Text>
              </Group>
              <Group gap={6}>
                <MessageCircle size={13} aria-hidden />
                <Text size="xs" fw={600}>
                  Join WhatsApp Community
                </Text>
              </Group>
            </Group>
          </Group>
        </Container>
      </Box>
      <Box
        component="header"
        style={{
          background: '#fff',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container size="xl">
          <Group justify="space-between" h={72}>
            <Group gap={8} style={{ cursor: 'pointer' }} onClick={() => navigate({ to: '/apm' })}>
              <img
                src={logoImg}
                alt="Adekanmbi/APM"
                style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'contain' }}
              />
              <Box visibleFrom="sm">
                <Text
                  fw={800}
                  size="lg"
                  style={{ color: ink, letterSpacing: '-0.02em', lineHeight: 1.2 }}
                >
                  Adekanmbi/APM
                </Text>
                <Text size="xs" style={{ color: muted }}>
                  Oyo State 2027
                </Text>
              </Box>
            </Group>

            <Group gap="xs" visibleFrom="md">
              {navItems.slice(0, 5).map((item) => (
                <Anchor
                  key={item.path}
                  href={item.path}
                  underline="never"
                  style={{
                    color: ink,
                    fontWeight: 500,
                    fontSize: 14,
                    padding: '6px 12px',
                    borderRadius: 6,
                    transition: 'background-color 180ms ease, color 180ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = '#F0F4FF';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  }}
                >
                  {item.label}
                </Anchor>
              ))}
              <Button
                onClick={() => navigate({ to: '/apm/join' })}
                styles={{
                  root: {
                    background: apmBlue,
                    fontWeight: 700,
                    fontSize: 14,
                    transition:
                      'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease',
                    '&:hover': {
                      background: '#0052A3',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 16px rgba(0,102,204,0.3)',
                    },
                  },
                }}
              >
                Join The Movement
              </Button>
            </Group>

            <Group gap="sm">
              <ActionIcon
                variant="subtle"
                size="lg"
                color="dark"
                aria-label="Share"
                visibleFrom="sm"
              >
                <Share2 size={18} />
              </ActionIcon>
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="md"
                aria-label="Toggle navigation"
              />
            </Group>
          </Group>
        </Container>

        {opened && (
          <Box
            style={{
              background: '#fff',
              borderTop: '1px solid #E2E8F0',
              padding: '16px 0',
            }}
            hiddenFrom="md"
          >
            <Container>
              <Stack gap={4}>
                {navItems.map((item) => (
                  <Anchor
                    key={item.path}
                    href={item.path}
                    underline="never"
                    onClick={close}
                    style={{
                      color: ink,
                      fontWeight: 600,
                      fontSize: 16,
                      padding: '12px 8px',
                      borderRadius: 8,
                    }}
                  >
                    {item.label}
                  </Anchor>
                ))}
                <Divider my="sm" />
                <Button
                  fullWidth
                  onClick={() => {
                    close();
                    navigate({ to: '/apm/join' });
                  }}
                  styles={{
                    root: {
                      background: apmBlue,
                      fontWeight: 700,
                      marginTop: 8,
                      '&:hover': { background: '#0052A3' },
                    },
                  }}
                >
                  Join The Movement
                </Button>
              </Stack>
            </Container>
          </Box>
        )}
      </Box>
    </>
  );
}

export function WebsiteFooter() {
  return (
    <Box
      component="footer"
      style={{
        background: '#002D5A',
        color: '#CBD5E1',
        paddingTop: 64,
        paddingBottom: 32,
      }}
    >
      <Container size="xl">
        <Box mb={48}>
          <Group align="flex-start" style={{ flexWrap: 'wrap' }} justify="space-between">
            <Box style={{ maxWidth: 320, minWidth: 240 }}>
              <Group gap={8} mb="md">
                <img
                  src={logoImg}
                  alt="APM"
                  style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain' }}
                />
                <Box>
                  <Text fw={800} size="lg" style={{ color: '#fff', lineHeight: 1.2 }}>
                    Adekanmbi/APM
                  </Text>
                  <Text size="xs" style={{ color: '#94A3B8' }}>
                    Oyo State 2027
                  </Text>
                </Box>
              </Group>
              <Text size="sm" style={{ lineHeight: 1.8, marginBottom: 16 }}>
                The official campaign website of Bimbo Adekanmbi, candidate for Governor of Oyo
                State under the Allied Peoples Movement.
              </Text>
              <Group gap="xs">
                <ActionIcon variant="subtle" size="lg" color="gray" aria-label="Facebook">
                  <Share2 size={18} />
                </ActionIcon>
                <ActionIcon variant="subtle" size="lg" color="gray" aria-label="Twitter">
                  <Send size={18} />
                </ActionIcon>
                <ActionIcon variant="subtle" size="lg" color="gray" aria-label="Instagram">
                  <Heart size={18} />
                </ActionIcon>
              </Group>
            </Box>

            {[
              {
                heading: 'Campaign',
                links: [
                  { label: 'Meet Adekanmbi', path: '/apm/meet' },
                  { label: 'Oyo Next Agenda', path: '/apm/agenda' },
                  { label: 'Achievements', path: '/apm/achievements' },
                  { label: 'News & Media', path: '/apm/news' },
                  { label: 'Events', path: '/apm/events' },
                ],
              },
              {
                heading: 'Get Involved',
                links: [
                  { label: 'Join The Movement', path: '/apm/join' },
                  { label: 'Volunteer', path: '/apm/volunteer' },
                  { label: 'Citizens Speak', path: '/apm/citizens-speak' },
                  { label: 'Report Issues', path: '/apm/report' },
                  { label: 'Donate', path: '/apm/donate' },
                ],
              },
              {
                heading: 'Contact',
                links: [
                  { label: 'Contact Us', path: '/apm/contact' },
                  { label: 'Media Resources', path: '/apm/media' },
                  { label: 'WhatsApp Community', path: '#' },
                ],
              },
            ].map((col) => (
              <Box key={col.heading} style={{ minWidth: 160 }}>
                <Text fw={700} style={{ color: '#fff', marginBottom: 16, fontSize: 14 }}>
                  {col.heading}
                </Text>
                <Stack gap={10}>
                  {col.links.map((link) => (
                    <Anchor
                      key={link.label}
                      href={link.path}
                      underline="never"
                      style={{
                        color: '#94A3B8',
                        fontSize: 14,
                        transition: 'color 180ms ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = '#94A3B8';
                      }}
                    >
                      {link.label}
                    </Anchor>
                  ))}
                </Stack>
              </Box>
            ))}
          </Group>
        </Box>

        <Divider color="#1E3A5F" mb={24} />

        <Group justify="space-between" gap="xs" style={{ flexWrap: 'wrap' }}>
          <Text size="xs" style={{ color: '#64748B' }}>
            &copy; {new Date().getFullYear()} Adekanmbi/APM Campaign. All rights reserved.
          </Text>
          <Group gap="lg">
            <Anchor href="#" underline="never" size="xs" style={{ color: '#64748B' }}>
              Privacy Policy
            </Anchor>
            <Anchor href="#" underline="never" size="xs" style={{ color: '#64748B' }}>
              Terms of Use
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}

export function WebsiteLayout({ children }: { children: ReactNode }) {
  return (
    <Box style={{ minHeight: '100vh', background: '#fff' }}>
      <WebsiteHeader />
      <Box component="main">{children}</Box>
      <WebsiteFooter />
    </Box>
  );
}
