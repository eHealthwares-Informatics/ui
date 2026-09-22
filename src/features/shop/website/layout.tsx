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
  Popover,
  Stack,
  Text,
  ThemeIcon,
  VisuallyHidden,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useModuleTitle } from '@/features/shared/use-module-title';
import { ChatbotWidget } from './chatbot-widget';
import {
  ChevronDown,
  Clock3,
  HeartPulse,
  Hospital,
  LayoutGrid,
  Mail,
  MapPinned,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Newspaper,
  Package,
  Phone,
  Pill,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Stethoscope,
  Truck,
  Upload,
  User,
} from 'lucide-react';
import { useWebsiteBranding, useWebsiteContact } from './hooks';
import AccountDrawer from './account-drawer';
import { useAccountDrawerStore } from './account-drawer-store';
import { useCartStore } from './cart-store';
import { ExpandableSearch } from './generic-search';

export const green = '#16A34A';
export const darkGreen = '#0F6F35';
export const ink = '#0F172A';
export const muted = '#64748B';
export const line = '#DDE7E2';
export const soft = '#F7FBF9';
export const blue = '#0EA5E9';

const navMenus = [
  {
    label: 'Shop',
    icon: ShoppingBag,
    color: '#16A34A',
    desc: 'Browse our catalog of authentic medicines and healthcare products.',
    learnMore: '/shop/shop',
    items: [
      { label: 'Shop Products', path: '/shop/shop', icon: Package, color: '#16A34A', desc: 'Browse our full catalog of medicines and healthcare products' },
      { label: 'Shop Medicines', path: '/shop/medicines', icon: Pill, color: '#0EA5E9', desc: 'Browse medicines by generic name and find available brands' },
      { label: 'Shop Supermarket Items', path: '/shop/supermarket', icon: ShoppingBasket, color: '#D97706', desc: 'Essential everyday items and supermarket products' },
      { label: 'Categories', path: '/shop/categories', icon: LayoutGrid, color: '#7C3AED', desc: 'Browse products by category and therapeutic class' },
    ],
  },
  {
    label: 'My Health',
    icon: HeartPulse,
    color: '#E11D48',
    desc: 'Access health information, consultations, and wellness resources.',
    learnMore: '/shop/health-concerns',
    items: [
      { label: 'Health Concerns', path: '/shop/health-concerns', icon: Stethoscope, color: '#E11D48', desc: 'Find medicines and advice for common health conditions' },
      { label: 'Blog', path: '/shop/blog', icon: Newspaper, color: '#0EA5E9', desc: 'Read health tips, news, and pharmacy insights' },
    ],
  },
  {
    label: 'Facility Locator',
    icon: MapPinned,
    color: '#0D9488',
    desc: 'Find registered hospitals, clinics and pharmacies near you.',
    learnMore: '/shop/facility-locator',
    items: [
      { label: 'Health Facility/Hospital Locator', path: '/shop/facility-locator', icon: Hospital, color: '#0D9488', desc: 'Search hospitals and clinics by name and location' },
      { label: 'Pharmacy Drug Store Locator', path: '/shop/pharmacy-locator', icon: Pill, color: '#D97706', desc: 'Find licensed pharmacies and drug stores near you' },
    ],
  },
  {
    label: 'Contact',
    icon: Phone,
    color: '#0EA5E9',
    desc: 'Get in touch with our pharmacists and support team.',
    learnMore: '/shop/contact',
    items: [
      { label: 'Conversational shopping', path: '/shop/conversation', icon: MessagesSquare, color: '#0EA5E9', desc: 'Chat with our pharmacist and shop through the conversation' },
      { label: 'Consult Pharmacist', path: '/shop/consult-pharmacist', icon: MessageCircle, color: '#16A34A', desc: 'Speak with a licensed pharmacist online' },
      { label: 'Contact Us', path: '/shop/contact', icon: Mail, color: '#D97706', desc: 'Reach our customer support team' },
      { label: 'Delivery Areas', path: '/shop/delivery-areas', icon: Truck, color: '#7C3AED', desc: 'Check delivery coverage and areas' },
    ],
  },
];

export const buttonStyles = {
  root: {
    transition:
      'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease, background-color 220ms ease',
  },
};

export function WebsiteHeader() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(false);
  const [cartHovered, { open: openCartHover, close: closeCartHover }] =
    useDisclosure(false);
  const { websiteName, logoUrl } = useWebsiteBranding();
  const openAccount = useAccountDrawerStore((s) => s.open);
  const totalItems = useCartStore((s) => s.totalItems);
  const cartItems = useCartStore((s) => s.items);
  const cartSubtotal = useCartStore((s) => s.subtotal);
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
                  <Image src={logoUrl} alt={`${websiteName} logo`} fit="cover" h="100%" />
                </Box>
                <Box>
                  <Text fw={900} size="xl" c={ink} lh={1}>
                    {websiteName}
                  </Text>
                  <Text size="xs" c={green} fw={800} lh={1.1}>
                    Rx Online Pharmacy
                  </Text>
                </Box>
              </Group>
            </Group>

            <Group visibleFrom="lg" gap={8} wrap="nowrap">
              {navMenus.map((menu) => {
                const MenuIcon = menu.icon;
                return (
                  <Popover
                    key={menu.label}
                    position="bottom-start"
                    width={1140}
                    shadow="lg"
                    offset={12}
                    withArrow
                  >
                    <Popover.Target>
                      <Button
                        variant="subtle"
                        color="dark"
                        fw={800}
                        radius="xl"
                        size="sm"
                        leftSection={<MenuIcon size={16} style={{ color: menu.color }} />}
                        rightSection={<ChevronDown size={14} />}
                        style={{
                          transition: 'all 200ms cubic-bezier(0.22,1,0.36,1)',
                        }}
                      >
                        {menu.label}
                      </Button>
                    </Popover.Target>
                    <Popover.Dropdown
                      style={{
                        padding: 0,
                        borderRadius: 16,
                        overflow: 'hidden',
                        border: `1px solid ${line}`,
                      }}
                    >
                      <Box style={{ display: 'flex', minHeight: 280 }}>
                        {/* Left section: title, description, learn more */}
                        <Box
                          style={{
                            flex: '0 0 260px',
                            padding: '28px 24px',
                            background: soft,
                            borderRight: `1px solid ${line}`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            gap: 12,
                          }}
                        >
                          <Group gap={8} wrap="nowrap">
                            <Box
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                background: `${menu.color}18`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <MenuIcon size={18} style={{ color: menu.color }} />
                            </Box>
                            <Text fw={900} size="lg" style={{ color: ink, letterSpacing: '-0.02em' }}>
                              {menu.label}
                            </Text>
                          </Group>
                          <Text size="sm" style={{ color: muted, lineHeight: 1.6 }}>
                            {menu.desc}
                          </Text>
                          <Anchor
                            size="sm"
                            fw={700}
                            style={{ color: green, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => navigate({ to: menu.learnMore })}
                          >
                            Learn more <ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} />
                          </Anchor>
                        </Box>

                        {/* Right section: grid of items */}
                        <Box
                          style={{
                            flex: 1,
                            padding: '20px 24px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 4,
                            alignContent: 'start',
                          }}
                        >
                          {menu.items.map((item) => {
                            const ItemIcon = item.icon;
                            return (
                              <Box
                                key={item.path}
                                onClick={() => navigate({ to: item.path })}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 12,
                                  padding: '12px 12px',
                                  borderRadius: 10,
                                  cursor: 'pointer',
                                  transition: 'background 150ms ease',
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget.style.background = '#f0f7f3');
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget.style.background = 'transparent');
                                }}
                              >
                                <Box
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: `${item.color}14`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <ItemIcon size={18} style={{ color: item.color }} aria-hidden />
                                </Box>
                                <Stack gap={2} style={{ flex: 1 }}>
                                  <Text fw={700} size="sm" style={{ color: ink, lineHeight: 1.3 }}>
                                    {item.label}
                                  </Text>
                                  <Text size="xs" style={{ color: muted, lineHeight: 1.4 }}>
                                    {item.desc}
                                  </Text>
                                </Stack>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Popover.Dropdown>
                  </Popover>
                );
              })}
            </Group>

            <Group gap={8} wrap="nowrap">
              <Box visibleFrom="md" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ExpandableSearch
                  onSelect={(gp) =>
                    navigate({ to: '/shop/shop', search: { gp: gp as any } })
                  }
                  onSubmit={(text) =>
                    navigate({ to: '/shop/shop', search: { q: text as any } })
                  }
                />
              </Box>
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
              <Popover
                width={330}
                position="bottom-end"
                withArrow
                shadow="md"
                withinPortal
                offset={10}
                opened={cartHovered}
                onChange={(next) => {
                  if (!next) closeCartHover();
                }}
                trapFocus={false}
                closeOnClickOutside={false}
              >
                <Popover.Target>
                  <Box
                    onMouseEnter={openCartHover}
                    onMouseLeave={closeCartHover}
                    style={{ display: 'inline-flex', position: 'relative' }}
                  >
                    <ActionIcon
                      variant="filled"
                      color="green"
                      radius="xl"
                      aria-label="Cart"
                      style={{ background: green, position: 'relative' }}
                      onClick={() => {
                        closeCartHover();
                        navigate({ to: '/shop/cart' });
                      }}
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
                  </Box>
                </Popover.Target>
                <Popover.Dropdown
                  onMouseEnter={openCartHover}
                  onMouseLeave={closeCartHover}
                  style={{
                    padding: 0,
                    borderRadius: 14,
                    border: `1px solid ${line}`,
                    overflow: 'hidden',
                    cursor: 'default',
                  }}
                >
                  {cartItems.length === 0 ? (
                    <Stack gap={6} px="md" py="lg" align="center">
                      <ShoppingCart size={22} style={{ color: muted }} />
                      <Text size="sm" fw={700} c={ink}>
                        Your cart is empty
                      </Text>
                      <Text size="xs" c={muted} ta="center">
                        Browse medicines and supermarket items to get started.
                      </Text>
                    </Stack>
                  ) : (
                    <>
                      <Box
                        px="md"
                        py={10}
                        style={{
                          background: soft,
                          borderBottom: `1px solid ${line}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text size="sm" fw={800} c={ink}>
                          Cart summary
                        </Text>
                        <Text size="xs" c={muted}>
                          {totalItems} item{totalItems === 1 ? '' : 's'}
                        </Text>
                      </Box>
                      <Box
                        px="md"
                        style={{
                          maxHeight: 240,
                          overflowY: 'auto',
                          paddingTop: 8,
                          paddingBottom: 8,
                        }}
                      >
                        <Stack gap={8}>
                          {cartItems.map((item, index) => {
                            const name =
                              item.name ??
                              (item.product as { name?: string } | undefined)?.name ??
                              'Item';
                            const unitPrice =
                              (item.product as { unitPrice?: number } | undefined)
                                ?.unitPrice ??
                              item.unitPrice ??
                              0;
                            return (
                              <Group
                                key={`${item.productId ?? item.genericProductCode ?? item.genericDrugCode ?? 'line'}-${index}`}
                                justify="space-between"
                                wrap="nowrap"
                                gap={10}
                              >
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                  <Text size="sm" fw={600} c={ink} lineClamp={1}>
                                    {name}
                                  </Text>
                                  <Text size="xs" c={muted}>
                                    {item.quantity} × ₦{Number(unitPrice).toLocaleString()}
                                  </Text>
                                </Box>
                                <Text size="sm" fw={700} c={green} style={{ flexShrink: 0 }}>
                                  ₦{(Number(unitPrice) * item.quantity).toLocaleString()}
                                </Text>
                              </Group>
                            );
                          })}
                        </Stack>
                      </Box>
                      <Box
                        px="md"
                        py={10}
                        style={{
                          borderTop: `1px solid ${line}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text size="sm" fw={700} c={ink}>
                          Subtotal
                        </Text>
                        <Text size="sm" fw={900} c={green}>
                          ₦{Number(cartSubtotal).toLocaleString()}
                        </Text>
                      </Box>
                      <Box px="md" pb="md">
                        <Button
                          fullWidth
                          radius="md"
                          color="green"
                          styles={buttonStyles}
                          onClick={() => {
                            closeCartHover();
                            navigate({ to: '/shop/cart' });
                          }}
                        >
                          View cart
                        </Button>
                      </Box>
                    </>
                  )}
                </Popover.Dropdown>
              </Popover>
            </Group>
          </Group>

          {mobileOpened ? (
            <Stack hiddenFrom="lg" mt="md" gap={6}>
              {navMenus.map((menu) => (
                <Box key={menu.label}>
                  <Text fw={900} size="sm" c={green} mt={8}>
                    {menu.label}
                  </Text>
                  {menu.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <Anchor
                        key={item.path}
                        onClick={() => {
                          navigate({ to: item.path });
                          toggleMobile();
                        }}
                        underline="never"
                        c={ink}
                        fw={700}
                        py={6}
                        pl={12}
                        style={{ cursor: 'pointer' }}
                      >
                        <Group gap={8} wrap="nowrap">
                          <ItemIcon size={16} style={{ color: item.color }} aria-hidden />
                          {item.label}
                        </Group>
                      </Anchor>
                    );
                  })}
                </Box>
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
  const { websiteName, logoUrl } = useWebsiteBranding();
  const { contactPhone, contactEmail, contactWhatsApp } = useWebsiteContact();

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
                  <Image src={logoUrl} alt={`${websiteName} logo`} fit="cover" h="100%" />
                </Box>
                <Box>
                  <Text fw={900} size="xl" c="#fff" lh={1}>
                    {websiteName}
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
              <Anchor href={`tel:${contactPhone}`} c="rgba(255,255,255,0.68)" underline="never">
                Phone
              </Anchor>
              <Anchor href={`mailto:${contactEmail}`} c="rgba(255,255,255,0.68)" underline="never">
                Email
              </Anchor>
              <Anchor
                href={`https://wa.me/${contactWhatsApp.replace(/[^0-9]/g, '')}`}
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
            &copy; {websiteName}. All rights reserved.
          </Text>
          <Group gap={8}>
            <VisuallyHidden>Delivery and support channels</VisuallyHidden>
            <ThemeIcon
              radius="xl"
              color="green"
              variant="light"
              style={{ cursor: 'pointer' }}
              onClick={() => window.open(`https://wa.me/${contactWhatsApp.replace(/[^0-9]/g, '')}`, '_blank')}
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
  useWebsiteBranding();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const showWidget = pathname !== '/shop/conversation';
  return (
    <>
      {showWidget && <ChatbotWidget />}
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
