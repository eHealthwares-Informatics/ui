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
  ThemeIcon,
  VisuallyHidden,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from '@tanstack/react-router';
import { useModuleTitle } from '@/features/shared/use-module-title';
import { ChatbotWidget } from './chatbot-widget';
import {
  BadgeCheck,
  BellRing,
  ChevronRight,
  Clock3,
  CreditCard,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Upload,
  User,
} from 'lucide-react';
import { useState } from 'react';
import logoImage from '../sample_images/sample_logo.png';
import AccountDrawer from './account-drawer';
import { useAccountDrawerStore } from './account-drawer-store';
import { useCartStore } from './cart-store';

export const green = '#16A34A';
export const darkGreen = '#0F6F35';
export const ink = '#0F172A';
export const muted = '#64748B';
export const line = '#DDE7E2';
export const soft = '#F7FBF9';
export const blue = '#0EA5E9';

const navItems = [
  { label: 'Home', path: '/shop' },
  { label: 'Shop Products', path: '/shop/shop' },
  { label: 'Shop Medicines', path: '/shop/medicines' },
  { label: 'Categories', path: '/shop/categories' },
  { label: 'Health Concerns', path: '/shop/health-concerns' },
  { label: 'Consult Pharmacist', path: '/shop/consult-pharmacist' },
  { label: 'Blog', path: '/shop/blog' },
];

export const buttonStyles = {
  root: {
    transition:
      'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease, background-color 220ms ease',
  },
};

export function WebsiteHeader() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(false);
  const openAccount = useAccountDrawerStore((s) => s.open);
  const totalItems = useCartStore((s) => s.totalItems);
  const navigate = useNavigate();

  return (
    <>
      <Box
        style={{
          background: darkGreen,
          color: '#fff',
          fontSize: 13,
        }}
      >
        <Container size="xl" py={8}>
          <Group justify="space-between" gap="xs">
            <Group gap="lg">
              <Group gap={6}>
                <Clock3 size={14} aria-hidden />
                <Text size="xs" fw={700}>
                  Open 24 Hours
                </Text>
              </Group>
              <Group gap={6} visibleFrom="sm">
                <Truck size={14} aria-hidden />
                <Text size="xs" fw={700}>
                  Free delivery above ₦10,000
                </Text>
              </Group>
            </Group>
            <Group gap="lg">
              <Group gap={6}>
                <MessageCircle size={14} aria-hidden />
                <Text size="xs" fw={700}>
                  WhatsApp support
                </Text>
              </Group>
              <Group gap={6} visibleFrom="md">
                <MapPin size={14} aria-hidden />
                <Text size="xs" fw={700}>
                  Lagos, Ogun and Oyo
                </Text>
              </Group>
            </Group>
          </Group>
        </Container>
      </Box>

      <Box
        component="header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'rgba(255, 255, 255, 0.92)',
          borderBottom: `1px solid ${line}`,
          backdropFilter: 'blur(18px)',
        }}
      >
        <Container size="xl" py={14}>
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap="md" wrap="nowrap">
              <Burger
                opened={mobileOpened}
                onClick={toggleMobile}
                hiddenFrom="lg"
                size="sm"
                aria-label="Toggle navigation"
              />
              <Group
                gap={10}
                wrap="nowrap"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate({ to: '/shop' })}
              >
                <Box
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: `1px solid ${line}`,
                    background: '#fff',
                    boxShadow: '0 12px 24px rgba(22, 163, 74, 0.12)',
                  }}
                >
                  <Image src={logoImage} alt="Damorex logo" fit="cover" h="100%" />
                </Box>
                <Box>
                  <Text fw={900} size="xl" c={ink} lh={1}>
                    Damorex
                  </Text>
                  <Text size="xs" c={green} fw={800} lh={1.1}>
                    Rx Online Pharmacy
                  </Text>
                </Box>
              </Group>
            </Group>

            <Group visibleFrom="lg" gap={24}>
              {navItems.map((item) => (
                <Anchor
                  key={item.label}
                  onClick={() => navigate({ to: item.path })}
                  style={{ cursor: 'pointer' }}
                  c={ink}
                  fw={800}
                  size="sm"
                  underline="never"
                  className="damorex-link"
                >
                  {item.label}
                </Anchor>
              ))}
            </Group>

            <Group gap={8} wrap="nowrap">
              <ActionIcon
                variant="subtle"
                color="gray"
                radius="xl"
                aria-label="Search"
                onClick={() => navigate({ to: '/shop/search' })}
              >
                <Search size={20} />
              </ActionIcon>
              <Button
                visibleFrom="md"
                radius="xl"
                variant="light"
                color="green"
                leftSection={<Upload size={16} />}
                styles={buttonStyles}
                onClick={() => navigate({ to: '/shop/upload-prescription' })}
              >
                Upload Prescription
              </Button>
              <ActionIcon
                variant="subtle"
                color="gray"
                radius="xl"
                aria-label="Account"
                visibleFrom="sm"
                onClick={() => openAccount()}
              >
                <User size={20} />
              </ActionIcon>
              <ActionIcon
                variant="filled"
                color="green"
                radius="xl"
                aria-label="Cart"
                style={{ background: green, position: 'relative' }}
                onClick={() => navigate({ to: '/shop/cart' })}
              >
                <ShoppingCart size={20} />
                {totalItems > 0 ? (
                  <Box
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#EF4444',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </Box>
                ) : null}
              </ActionIcon>
            </Group>
          </Group>

          {mobileOpened ? (
            <Stack hiddenFrom="lg" mt="md" gap={6}>
              {navItems.map((item) => (
                <Anchor
                  key={item.label}
                  onClick={() => {
                    navigate({ to: item.path });
                    toggleMobile();
                  }}
                  underline="never"
                  c={ink}
                  fw={800}
                  py={8}
                  style={{ cursor: 'pointer' }}
                >
                  {item.label}
                </Anchor>
              ))}
              <Anchor
                onClick={() => {
                  navigate({ to: '/shop/upload-prescription' });
                  toggleMobile();
                }}
                underline="never"
                c={ink}
                fw={800}
                py={8}
                style={{ cursor: 'pointer' }}
              >
                Upload Prescription
              </Anchor>
              <Anchor
                onClick={() => {
                  navigate({ to: '/shop/login' });
                  toggleMobile();
                }}
                underline="never"
                c={ink}
                fw={800}
                py={8}
                style={{ cursor: 'pointer' }}
              >
                Sign In
              </Anchor>
            </Stack>
          ) : null}
        </Container>
      </Box>
      <AccountDrawer />
    </>
  );
}

export function WebsiteFooter() {
  const navigate = useNavigate();

  return (
    <Box
      component="footer"
      style={{
        background: '#07110C',
        color: '#fff',
      }}
    >
      <Container size="xl" py={{ base: 42, md: 58 }}>
        <Group gap="xl" align="start" grow preventGrowOverflow={false} wrap="wrap">
          <Box style={{ flex: '1 1 280px', minWidth: 260 }}>
            <Stack gap="md">
              <Group
                gap={10}
                wrap="nowrap"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate({ to: '/shop' })}
              >
                <Box
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: `1px solid rgba(255,255,255,0.2)`,
                    background: '#fff',
                  }}
                >
                  <Image src={logoImage} alt="Damorex logo" fit="cover" h="100%" />
                </Box>
                <Box>
                  <Text fw={900} size="xl" c="#fff" lh={1}>
                    Damorex
                  </Text>
                  <Text size="xs" c={green} fw={800} lh={1.1}>
                    Rx Online Pharmacy
                  </Text>
                </Box>
              </Group>
              <Text c="rgba(255,255,255,0.7)" lh={1.7}>
                Damorex is a Nigerian online pharmacy and healthcare platform for medicine ordering,
                prescriptions, consultations and delivery.
              </Text>
              <Group>
                {['Licensed Pharmacy', 'Secure Payments', 'Data Privacy'].map((item) => (
                  <Text
                    key={item}
                    size="xs"
                    fw={700}
                    style={{
                      background: 'rgba(22,163,74,0.16)',
                      color: green,
                      padding: '4px 12px',
                      borderRadius: 999,
                    }}
                  >
                    {item}
                  </Text>
                ))}
              </Group>
            </Stack>
          </Box>

          {[
            ['Shop', 'Medicines', 'Supplements', 'Wellness'],
            ['Services', 'Prescription Upload', 'Consult Pharmacist', 'Delivery'],
            ['Company', 'About Us', 'Careers', 'Contact'],
            ['Support', 'FAQs', 'Privacy Policy', 'Terms'],
          ].map(([heading, ...links]) => (
            <Box key={heading} style={{ flex: '1 1 140px', minWidth: 120 }}>
              <Stack gap="xs">
                <Text fw={900} c="#fff">
                  {heading}
                </Text>
                {links.map((link) => (
                  <Anchor
                    key={link}
                    onClick={() => {
                      const path = link.toLowerCase().replace(/\s+/g, '-');
                      if (path === 'prescription-upload')
                        {navigate({ to: '/shop/upload-prescription' });}
                      else if (path === 'consult-pharmacist')
                        {navigate({ to: '/shop/consult-pharmacist' });}
                      else if (path === 'delivery') {navigate({ to: '/shop/delivery-areas' });}
                      else if (path === 'contact') {navigate({ to: '/shop/contact' });}
                      else if (path === 'about-us') {navigate({ to: '/shop/about' });}
                      else if (path === 'faqs') {navigate({ to: '/shop/faq' });}
                      else if (path === 'privacy-policy')
                        {navigate({ to: '/shop/privacy-policy' });}
                      else if (path === 'terms') {navigate({ to: '/shop/terms' });}
                      else if (path === 'careers') {navigate({ to: '/shop/about' });}
                      else if (
                        link === 'Medicines' ||
                        link === 'Supplements' ||
                        link === 'Wellness'
                      )
                        {navigate({ to: '/shop/shop' });}
                      else {navigate({ to: '/shop' });}
                    }}
                    c="rgba(255,255,255,0.68)"
                    underline="never"
                    style={{ cursor: 'pointer' }}
                    className="damorex-link"
                  >
                    {link}
                  </Anchor>
                ))}
              </Stack>
            </Box>
          ))}

          <Box style={{ flex: '1 1 140px', minWidth: 120 }}>
            <Stack gap="xs">
              <Text fw={900} c="#fff">
                Contact
              </Text>
              <Anchor href="tel:+2348000000000" c="rgba(255,255,255,0.68)" underline="never">
                Phone
              </Anchor>
              <Anchor href="mailto:hello@damorex.com" c="rgba(255,255,255,0.68)" underline="never">
                Email
              </Anchor>
              <Anchor
                href="https://wa.me/2348000000000"
                target="_blank"
                c="rgba(255,255,255,0.68)"
                underline="never"
              >
                WhatsApp
              </Anchor>
              <Anchor
                onClick={() => navigate({ to: '/shop/branches' })}
                c="rgba(255,255,255,0.68)"
                underline="never"
                style={{ cursor: 'pointer' }}
              >
                Branch Locations
              </Anchor>
            </Stack>
          </Box>
        </Group>

        <Divider my="xl" color="rgba(255,255,255,0.14)" />
        <Group justify="space-between">
          <Text size="sm" c="rgba(255,255,255,0.58)">
            &copy; Damorex. All rights reserved.
          </Text>
          <Group gap={8}>
            <VisuallyHidden>Delivery and support channels</VisuallyHidden>
            <ThemeIcon
              radius="xl"
              color="green"
              variant="light"
              style={{ cursor: 'pointer' }}
              onClick={() => window.open('https://wa.me/2348000000000', '_blank')}
            >
              <MessageCircle size={18} />
            </ThemeIcon>
            <ThemeIcon
              radius="xl"
              color="green"
              variant="light"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate({ to: '/shop/delivery-areas' })}
            >
              <Truck size={18} />
            </ThemeIcon>
            <ThemeIcon
              radius="xl"
              color="green"
              variant="light"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate({ to: '/shop/about' })}
            >
              <ShieldCheck size={18} />
            </ThemeIcon>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}

export function WebsiteLayout({ children }: { children: React.ReactNode }) {
  useModuleTitle('damorex');
  return (
    <>
      <ChatbotWidget />
    <Box
      style={{
        background:
          'radial-gradient(circle at 8% 2%, rgba(34, 197, 94, 0.12), transparent 30%), radial-gradient(circle at 90% 10%, rgba(14, 165, 233, 0.11), transparent 28%), #FFFFFF',
        color: ink,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      <style>
        {`
          .damorex-page *:focus-visible {
            outline: 3px solid rgba(14, 165, 233, 0.55);
            outline-offset: 3px;
          }
          .damorex-page {
            overflow-x: hidden;
          }
          .damorex-page button:hover,
          .damorex-page a:hover,
          .lift-card:hover {
            transform: translateY(-2px);
          }
          .damorex-page button:active,
          .damorex-page a:active,
          .lift-card:active {
            transform: translateY(0);
          }
          .lift-card {
            transition: transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease, border-color 220ms ease;
          }
          .damorex-heading {
            font-family: Manrope, "Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, sans-serif;
            letter-spacing: -0.03em;
          }
          .hero-title {
            font-size: clamp(2.15rem, 5vw, 3.2rem);
            line-height: 1;
          }
          @media (min-width: 1200px) {
            .hero-title {
              font-size: clamp(4.2rem, 6vw, 5.4rem);
              line-height: 0.96;
            }
          }
          .damorex-link {
            transition: transform 220ms cubic-bezier(0.22,1,0.36,1), color 220ms ease, opacity 220ms ease;
          }
          @media (max-width: 1199px) {
            .hero-title {
              font-size: clamp(2.15rem, 10vw, 3.2rem) !important;
              line-height: 1.05 !important;
            }
            .mobile-scroll {
              display: flex;
              overflow-x: auto;
              scroll-snap-type: x mandatory;
              padding-bottom: 12px;
            }
            .mobile-scroll > * {
              min-width: 78%;
              scroll-snap-align: start;
            }
          }
        `}
      </style>

      <Box className="damorex-page">
        <WebsiteHeader />
        <Box component="main">{children}</Box>
        <WebsiteFooter />
      </Box>
    </Box>
    </>
  );
}
