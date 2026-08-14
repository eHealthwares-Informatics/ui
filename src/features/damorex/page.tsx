import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  Image,
  Input,
  Loader,
  Paper,
  Rating,
  ScrollArea,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
  VisuallyHidden,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from '@tanstack/react-router';
import productPlaceholder from './sample_images/generic_product_image.png';
import {
  Baby,
  BadgeCheck,
  BellRing,
  BookOpen,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileUp,
  HeartPulse,
  MapPin,
  MessageCircle,
  MessageSquare,
  Minus,
  PackageCheck,
  Pill,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Stethoscope,
  Truck,
  Upload,
  User,
  UsersRound,
  WalletCards,
  Mail,
} from 'lucide-react';
import { useState } from 'react';
import { useChatbotStore } from './website/chatbot-store';
import { useProducts } from './website/hooks';
import {
  toHL7Prescription,
  buildWhatsAppUrl,
  WEBSITE_PRESCRIPTION_PHONE,
  QUESTIONNAIRE_CODES,
} from './website/hl7-prescription';
import { websiteApi } from './website/api';
import type { WebsiteProduct } from './website/types';
import { useCartStore } from './website/cart-store';
import { SectionHeading, PrimaryButton, OutlineButton, Logo } from './website/components';
import {
  WebsiteLayout,
  green,
  darkGreen,
  blue,
  ink,
  muted,
  line,
  soft,
  buttonStyles,
} from './website/layout';

const heroImage = new URL('./sample_images/nappy-jkQzYGJ7dBA-unsplash.jpg', import.meta.url).href;
const pharmacistImage = new URL(
  './sample_images/myriam-zilles-KltoLK6Mk-g-unsplash.jpg',
  import.meta.url
).href;
const deliveryImage = new URL(
  './sample_images/markus-winkler-pOu_UmkOG-0-unsplash.jpg',
  import.meta.url
).href;
const productImage = new URL('./sample_images/generic_product_image.png', import.meta.url).href;

const quickSearches = [
  'Malaria',
  'Diabetes',
  'Hypertension',
  'Pain Relief',
  'Vitamins',
  'Family Care',
];

const trustItems = [
  { label: 'Licensed Pharmacists', icon: BadgeCheck },
  { label: 'Genuine Medicines', icon: ShieldCheck },
  { label: 'Same-Day Delivery', icon: Truck },
  { label: 'Secure Payments', icon: CreditCard },
];

const healthConcerns = [
  { title: 'Diabetes Care', count: '180+ products', icon: HeartPulse, slug: 'diabetes' },
  { title: 'Hypertension', count: '120+ products', icon: Stethoscope, slug: 'hypertension' },
  { title: 'Heart Health', count: '95+ products', icon: HeartPulse, slug: 'heart-disease' },
  { title: 'Malaria Treatment', count: '140+ products', icon: Pill, slug: 'malaria' },
  { title: "Women's Health", count: '110+ products', icon: UsersRound, slug: 'women-health' },
  { title: "Men's Health", count: '90+ products', icon: User, slug: 'mens-health' },
  { title: "Children's Health", count: '130+ products', icon: Baby, slug: 'child-health' },
  { title: 'Mental Wellness', count: '70+ products', icon: Sparkles, slug: 'mental-wellness' },
  {
    title: 'Vitamins & Supplements',
    count: '240+ products',
    icon: Plus,
    slug: 'vitamins-supplements',
  },
  { title: 'Weight Management', count: '65+ products', icon: Minus, slug: 'weight-management' },
  { title: 'Respiratory Care', count: '85+ products', icon: Stethoscope, slug: 'respiratory-care' },
  { title: 'Digestive Health', count: '100+ products', icon: Pill, slug: 'digestive-health' },
];

const categories = [
  {
    title: 'Prescription Medicines',
    count: '1,200+ items',
    icon: FileUp,
    slug: 'prescription-medicines',
  },
  { title: 'OTC Medicines', count: '780+ items', icon: Pill, slug: 'otc-medicines' },
  { title: 'Supplements', count: '420+ items', icon: Sparkles, slug: 'supplements' },
  { title: 'Wellness Products', count: '360+ items', icon: HeartPulse, slug: 'wellness' },
  { title: 'Medical Devices', count: '160+ items', icon: Stethoscope, slug: 'medical-devices' },
  { title: 'Personal Care', count: '510+ items', icon: UsersRound, slug: 'personal-care' },
  { title: 'Baby Care', count: '190+ items', icon: Baby, slug: 'baby-care' },
  { title: 'First Aid', count: '115+ items', icon: PackageCheck, slug: 'first-aid' },
  {
    title: 'Supermarket Essentials',
    count: '650+ items',
    icon: ShoppingCart,
    slug: 'supermarket-essentials',
  },
];

const products = [
  {
    id: 'coartem-20120',
    name: 'Coartem 20/120mg Tablets',
    generic: 'Artemether / Lumefantrine',
    price: '₦4,800',
    badge: 'Best seller',
    availability: 'In stock today',
    prescription: 'Prescription may be required',
    rating: 4.8,
  },
  {
    id: 'norvasc-5mg',
    name: 'Norvasc 5mg Tablets',
    generic: 'Amlodipine',
    price: '₦8,950',
    badge: 'Most ordered',
    availability: 'Available in 3 branches',
    prescription: 'Prescription required',
    rating: 4.7,
  },
  {
    id: 'wellwoman',
    name: 'Wellwoman Original',
    generic: 'Multivitamin supplement',
    price: '₦18,500',
    badge: 'New arrival',
    availability: 'In stock today',
    prescription: 'No prescription needed',
    rating: 4.9,
  },
  {
    id: 'accuchek-strips',
    name: 'Accu-Chek Active Strips',
    generic: 'Blood glucose test strips',
    price: '₦16,200',
    badge: 'Family care',
    availability: 'Low stock',
    prescription: 'No prescription needed',
    rating: 4.6,
  },
];

const whyItems = [
  {
    title: 'Genuine Medicines',
    text: '100% authentic medicines sourced from licensed suppliers.',
    icon: ShieldCheck,
  },
  {
    title: 'Licensed Pharmacists',
    text: 'Professional pharmaceutical support before and after you order.',
    icon: BadgeCheck,
  },
  {
    title: 'Same-Day Delivery',
    text: 'Fast delivery across supported locations when you order early.',
    icon: Truck,
  },
  {
    title: 'Secure Payments',
    text: 'Protected card, transfer and cash-on-delivery options.',
    icon: WalletCards,
  },
  {
    title: 'Refill Reminders',
    text: 'Helpful reminders for chronic medicines and recurring care.',
    icon: BellRing,
  },
  {
    title: 'Multi-Branch Availability',
    text: 'Access inventory across Damorex branches for faster fulfillment.',
    icon: PackageCheck,
  },
];

const testimonials = [
  {
    name: 'Aisha M.',
    text: 'My prescription was reviewed quickly and delivered the same evening. The pharmacist explained everything clearly.',
    focus: 'Verified prescription order',
  },
  {
    name: 'Tunde A.',
    text: 'I use Damorex for my BP refills. The reminders and WhatsApp support make it easy to stay consistent.',
    focus: 'Chronic refill customer',
  },
  {
    name: 'Mrs. Adeyemi',
    text: 'Authentic products, neat packaging and polite delivery. It feels like a pharmacy I can trust.',
    focus: 'Verified purchase',
  },
];

const articles = [
  { title: 'How to use malaria medicines safely', slug: 'how-to-use-malaria-medicines-safely' },
  {
    title: 'Managing blood pressure refills without missed doses',
    slug: 'managing-blood-pressure-refills',
  },
  {
    title: 'A simple family guide to first aid essentials',
    slug: 'family-guide-first-aid-essentials',
  },
];

export default function DamorexPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const navigate = useNavigate();
  const { data: trendingData } = useProducts({ limit: 4 });
  const { data: catalogData } = useProducts({ limit: 8 });
  const trendingProducts = trendingData?.data ?? [];
  const catalogProducts = catalogData?.data ?? [];

  return (
    <WebsiteLayout>
      <Container size="xl" pt={{ base: 34, md: 56 }} pb={32}>
        <Grid gap={{ base: 28, lg: 44 }} align="center">
          <Grid.Col span={{ base: 12, lg: 6 }} style={{ minWidth: 0 }}>
            <Stack gap={22}>
              <Badge
                radius="xl"
                size="lg"
                color="green"
                variant="light"
                leftSection={<ShieldCheck size={14} />}
                w="fit-content"
              >
                Licensed pharmacy care online
              </Badge>

              <Stack gap={14} className="hero-copy">
                <Title
                  order={1}
                  className="damorex-heading hero-title"
                  style={{
                    color: ink,
                    maxWidth: '100%',
                    width: 'min(100%, calc(100vw - 32px))',
                    overflowWrap: 'break-word',
                  }}
                >
                  Your Trusted Online Pharmacy. Fast, Safe & Convenient.
                </Title>
                <Text
                  size="xl"
                  c={muted}
                  lh={1.7}
                  maw={650}
                  style={{ width: 'min(100%, calc(100vw - 32px))' }}
                >
                  Order medicines, upload prescriptions, consult pharmacists and get same-day
                  delivery across Lagos, Ogun and Oyo.
                </Text>
              </Stack>

              <Paper
                className="hero-search"
                shadow="md"
                radius={24}
                p={{ base: 12, sm: 16 }}
                style={{
                  border: `1px solid ${line}`,
                  boxShadow: '0 28px 80px rgba(15, 111, 53, 0.14)',
                  width: 'min(100%, calc(100vw - 32px))',
                }}
              >
                <Stack gap={12}>
                  <Group gap={10} wrap="nowrap">
                    <ThemeIcon radius="xl" size={44} color="green" variant="light">
                      <Search size={22} />
                    </ThemeIcon>
                    <Input
                      aria-label="Search medicines"
                      placeholder="Search by medicine name, generic name, brand name or health concern..."
                      size="lg"
                      radius="xl"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          navigate({ to: `/damorex/search?q=${encodeURIComponent(searchQuery)}` });
                        }
                      }}
                      style={{ flex: 1, minWidth: 0 }}
                      styles={{
                        input: {
                          borderColor: '#CFE5D7',
                          color: ink,
                          minHeight: 52,
                          minWidth: 0,
                        },
                      }}
                    />
                  </Group>
                  <Group gap={8}>
                    {quickSearches.map((tag) => (
                      <Button
                        key={tag}
                        variant="light"
                        color="green"
                        radius="xl"
                        size="xs"
                        styles={buttonStyles}
                        onClick={() =>
                          navigate({ to: `/damorex/search?q=${encodeURIComponent(tag)}` })
                        }
                      >
                        {tag}
                      </Button>
                    ))}
                  </Group>
                </Stack>
              </Paper>

              <Group
                gap="sm"
                className="hero-actions"
                style={{ width: 'min(100%, calc(100vw - 32px))' }}
              >
                <PrimaryButton
                  leftSection={<ShoppingCart size={18} />}
                  onClick={() => navigate({ to: '/damorex/shop' })}
                >
                  Shop Medicines
                </PrimaryButton>
                <OutlineButton
                  leftSection={<FileUp size={18} />}
                  onClick={() => navigate({ to: '/damorex/upload-prescription' })}
                >
                  Upload Prescription
                </OutlineButton>
                <Button
                  size="md"
                  radius="xl"
                  variant="light"
                  color="green"
                  leftSection={<MessageCircle size={18} />}
                  styles={buttonStyles}
                  onClick={() => {
                    const url = `https://wa.me/${WEBSITE_PRESCRIPTION_PHONE.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${QUESTIONNAIRE_CODES.PHARMACY_ORDER}\r\nHello Damorex, I want to order medicines`)}`;
                    window.open(url, '_blank');
                  }}
                >
                  Order via WhatsApp
                </Button>
              </Group>

              <SimpleGrid
                className="hero-trust"
                cols={{ base: 1, sm: 2, md: 4 }}
                spacing={12}
                style={{ width: 'min(100%, calc(100vw - 32px))' }}
              >
                {trustItems.map((item) => (
                  <Paper
                    key={item.label}
                    radius={18}
                    p="sm"
                    withBorder
                    style={{
                      borderColor: '#D8EEE0',
                      background: 'rgba(255, 255, 255, 0.82)',
                    }}
                  >
                    <Group gap={8} wrap="nowrap">
                      <ThemeIcon radius="xl" color="green" variant="light" size={30}>
                        <item.icon size={16} />
                      </ThemeIcon>
                      <Text size="sm" fw={800} lh={1.2}>
                        {item.label}
                      </Text>
                    </Group>
                  </Paper>
                ))}
              </SimpleGrid>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 6 }} style={{ minWidth: 0 }}>
            <Box
              style={{
                position: 'relative',
                minHeight: 520,
              }}
            >
              <Paper
                radius={32}
                p={0}
                style={{
                  overflow: 'hidden',
                  minHeight: 520,
                  border: `1px solid ${line}`,
                  boxShadow: '0 36px 90px rgba(15, 23, 42, 0.14)',
                  position: 'relative',
                }}
              >
                <Image
                  src={heroImage}
                  alt="Nigerian customer receiving healthcare support"
                  h={520}
                  fit="cover"
                />
                <Box
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 111, 53, 0.72))',
                    mixBlendMode: 'multiply',
                  }}
                />
                <Paper
                  radius={22}
                  p="lg"
                  style={{
                    position: 'absolute',
                    left: 22,
                    right: 22,
                    bottom: 22,
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <Group justify="space-between" gap="md">
                    <Stack gap={2}>
                      <Text fw={900} c={ink}>
                        Pharmacist review in progress
                      </Text>
                      <Text size="sm" c={muted}>
                        Prescription checked, branch stock confirmed, dispatch queued.
                      </Text>
                    </Stack>
                    <ThemeIcon radius="xl" size={48} color="green">
                      <BadgeCheck size={24} />
                    </ThemeIcon>
                  </Group>
                </Paper>
              </Paper>

              <Paper
                radius={24}
                p="md"
                visibleFrom="md"
                style={{
                  position: 'absolute',
                  top: 36,
                  left: -18,
                  width: 230,
                  background: '#fff',
                  boxShadow: '0 24px 60px rgba(14, 165, 233, 0.18)',
                }}
              >
                <Group gap={10} wrap="nowrap">
                  <ThemeIcon radius="xl" color="blue" variant="light">
                    <Truck size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={900}>Same-day dispatch</Text>
                    <Text size="xs" c={muted}>
                      Express delivery slots
                    </Text>
                  </Box>
                </Group>
              </Paper>

              <Paper
                radius={24}
                p="md"
                visibleFrom="md"
                style={{
                  position: 'absolute',
                  top: 156,
                  right: -10,
                  width: 240,
                  background: '#fff',
                  boxShadow: '0 24px 60px rgba(22, 163, 74, 0.18)',
                }}
              >
                <Group gap={10} wrap="nowrap">
                  <ThemeIcon radius="xl" color="green" variant="light">
                    <Pill size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={900}>2,500+ medicines</Text>
                    <Text size="xs" c={muted}>
                      Across Damorex branches
                    </Text>
                  </Box>
                </Group>
              </Paper>
            </Box>
          </Grid.Col>
        </Grid>
      </Container>

      <Box py={{ base: 36, md: 54 }} style={{ background: soft }}>
        <Container size="xl">
          <Grid gap="lg" align="stretch">
            <Grid.Col span={{ base: 12, lg: 5 }}>
              <Paper
                radius={28}
                p={{ base: 'lg', md: 'xl' }}
                h="100%"
                style={{
                  background: darkGreen,
                  color: '#fff',
                  boxShadow: '0 26px 70px rgba(15, 111, 53, 0.22)',
                }}
              >
                <Stack gap="md">
                  <ThemeIcon radius="xl" size={52} style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <Upload size={26} />
                  </ThemeIcon>
                  <Title order={2} className="damorex-heading">
                    Have a Prescription?
                  </Title>
                  <Text c="rgba(255,255,255,0.82)" lh={1.7}>
                    Upload your doctor's prescription and our licensed pharmacists will review and
                    prepare your medications.
                  </Text>
                  <Group gap={8}>
                    {['JPG', 'PNG', 'PDF'].map((format) => (
                      <Badge key={format} color="gray" variant="white" radius="xl">
                        {format} upload
                      </Badge>
                    ))}
                  </Group>
                  <Button
                    radius="xl"
                    size="md"
                    color="gray"
                    variant="white"
                    leftSection={<FileUp size={18} />}
                    w="fit-content"
                    styles={buttonStyles}
                    onClick={() => navigate({ to: '/damorex/upload-prescription' })}
                  >
                    Upload Prescription
                  </Button>
                </Stack>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 7 }}>
              <SimpleGrid cols={{ base: 1, sm: 3 }} h="100%">
                {[
                  {
                    title: '1. Upload',
                    text: 'Send prescription images or PDFs securely.',
                  },
                  {
                    title: '2. Pharmacist Review',
                    text: 'A licensed pharmacist validates details and stock.',
                  },
                  {
                    title: '3. Dispatch',
                    text: 'Pay securely and receive delivery updates.',
                  },
                ].map((step) => (
                  <Paper
                    className="lift-card"
                    key={step.title}
                    radius={24}
                    p="xl"
                    withBorder
                    style={{
                      borderColor: line,
                      background: '#fff',
                      minHeight: 220,
                    }}
                  >
                    <Stack justify="space-between" h="100%">
                      <Box>
                        <Text fw={900} c={green}>
                          {step.title}
                        </Text>
                        <Text c={muted} mt={8} lh={1.7}>
                          {step.text}
                        </Text>
                      </Box>
                      <ThemeIcon radius="xl" color="green" variant="light" size={42}>
                        <ChevronRight size={22} />
                      </ThemeIcon>
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      <Container size="xl" py={{ base: 48, md: 76 }}>
        <Stack gap="xl">
          <SectionHeading
            eyebrow="Shop by health concern"
            title="Find the right care faster"
            text="Browse practical care groups built around the health needs Nigerian families search for every day."
          />
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
            {healthConcerns.map((item) => (
              <Card
                className="lift-card"
                key={item.title}
                radius={22}
                p="lg"
                withBorder
                style={{
                  borderColor: line,
                  boxShadow: '0 16px 46px rgba(15, 23, 42, 0.05)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate({ to: `/damorex/health-concerns/${item.slug}` })}
              >
                <Stack gap="sm">
                  <ThemeIcon radius="xl" size={46} color="green" variant="light">
                    <item.icon size={22} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={900}>{item.title}</Text>
                    <Text size="sm" c={muted}>
                      {item.count}
                    </Text>
                  </Box>
                  <Anchor
                    underline="never"
                    c={green}
                    fw={900}
                    size="sm"
                    className="damorex-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate({ to: `/damorex/health-concerns/${item.slug}` });
                    }}
                  >
                    Shop care <ChevronRight size={14} />
                  </Anchor>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

      <Box py={{ base: 48, md: 76 }} style={{ background: soft }}>
        <Container size="xl">
          <Stack gap="xl">
            <Group justify="space-between" align="end">
              <SectionHeading
                eyebrow="Shop by category"
                title="Everyday medicines and wellness essentials"
              />
              <Button
                visibleFrom="sm"
                radius="xl"
                variant="subtle"
                color="green"
                rightSection={<ChevronRight size={16} />}
                styles={buttonStyles}
                onClick={() => navigate({ to: '/damorex/categories' })}
              >
                View all categories
              </Button>
            </Group>
            <Box className="mobile-scroll">
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {categories.map((item) => (
                  <Paper
                    className="lift-card"
                    key={item.title}
                    radius={24}
                    p="lg"
                    withBorder
                    style={{
                      borderColor: line,
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate({ to: `/damorex/categories/${item.slug}` })}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="md" wrap="nowrap">
                        <ThemeIcon radius={16} size={52} color="green" variant="light">
                          <item.icon size={24} />
                        </ThemeIcon>
                        <Box>
                          <Text fw={900}>{item.title}</Text>
                          <Text size="sm" c={muted}>
                            {item.count}
                          </Text>
                        </Box>
                      </Group>
                      <ActionIcon
                        aria-label={`Shop ${item.title}`}
                        radius="xl"
                        color="green"
                        variant="light"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate({ to: `/damorex/categories/${item.slug}` });
                        }}
                      >
                        <ChevronRight size={18} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                ))}
              </SimpleGrid>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Box py={{ base: 40, md: 64 }}>
        <Container size="xl">
          <Stack gap="xl">
            <Group justify="space-between" align="end">
              <SectionHeading
                eyebrow="Browse categories"
                title="Explore by category"
              />
              <Button
                visibleFrom="sm"
                radius="xl"
                variant="subtle"
                color="green"
                rightSection={<ChevronRight size={16} />}
                styles={buttonStyles}
                onClick={() => navigate({ to: '/damorex/categories' })}
              >
                View all
              </Button>
            </Group>
            <ScrollArea offsetScrollbars type="never">
              <Group gap="md" wrap="nowrap" style={{ minWidth: 'max-content', paddingBottom: 8 }}>
                {categories.map((item) => (
                  <Paper
                    key={item.slug}
                    radius={60}
                    p={0}
                    withBorder
                    style={{
                      width: 106,
                      borderColor: line,
                      cursor: 'pointer',
                      transition: 'transform 220ms, box-shadow 220ms',
                    }}
                    onClick={() =>
                      navigate({ to: `/damorex/categories/${item.slug}` })
                    }
                  >
                    <Stack align="center" gap={4} py="md" px={6}>
                      <ThemeIcon radius="xl" size={48} color="green" variant="light">
                        <item.icon size={22} />
                      </ThemeIcon>
                      <Text size="xs" fw={800} ta="center" lh={1.2} style={{ wordBreak: 'break-word' }}>
                        {item.title}
                      </Text>
                    </Stack>
                  </Paper>
                ))}
              </Group>
            </ScrollArea>
          </Stack>
        </Container>
      </Box>

      <Container size="xl" py={{ base: 48, md: 76 }}>
        <Stack gap="xl">
          <Group justify="space-between" align="end">
            <SectionHeading
              eyebrow="Featured products"
              title="Popular picks from Damorex"
              text="Realistic product cards with availability, ratings, prescription status and WhatsApp ordering."
            />
            <Tabs defaultValue="best" visibleFrom="md">
              <Tabs.List>
                <Tabs.Tab value="best">Best Sellers</Tabs.Tab>
                <Tabs.Tab value="ordered">Most Ordered</Tabs.Tab>
                <Tabs.Tab value="new">New Arrivals</Tabs.Tab>
              </Tabs.List>
            </Tabs>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            {products.map((item) => (
              <Card
                className="lift-card"
                key={item.name}
                radius={24}
                withBorder
                padding="md"
                style={{
                  borderColor: line,
                  boxShadow: '0 18px 52px rgba(15, 23, 42, 0.06)',
                }}
              >
                <Card.Section
                  style={{
                    background: '#F1F8F4',
                    borderBottom: `1px solid ${line}`,
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate({ to: `/damorex/shop/${item.id}` })}
                >
                  <Badge
                    radius="xl"
                    color="green"
                    style={{ position: 'absolute', top: 12, left: 12 }}
                  >
                    {item.badge}
                  </Badge>
                  <Image src={(item as any).mediumImageUrl || (item as any).imageUrl || productImage} alt={item.name} h={190} fit="contain" p="lg" />
                </Card.Section>
                <Stack mt="md" gap="sm">
                  <Box>
                    <Text fw={900} lh={1.25}>
                      {item.name}
                    </Text>
                    <Text size="sm" c={muted}>
                      {item.generic}
                    </Text>
                  </Box>
                  <Group gap={6}>
                    <Rating value={item.rating} fractions={2} readOnly />
                    <Text size="xs" c={muted}>
                      {item.rating}
                    </Text>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text fw={950} size="xl" c={darkGreen}>
                      {item.price}
                    </Text>
                    <Badge
                      color={item.availability.includes('Low') ? 'yellow' : 'green'}
                      variant="light"
                      radius="xl"
                    >
                      {item.availability}
                    </Badge>
                  </Group>
                  <Text size="xs" c={muted}>
                    {item.prescription}
                  </Text>
                  <Group grow gap={8}>
                    <Button
                      radius="xl"
                      color="green"
                      leftSection={<ShoppingCart size={16} />}
                      styles={buttonStyles}
                      style={{ background: green }}
                      onClick={() => {
                        useCartStore.getState().addItem(item.id);
                        notifications.show({
                          message: 'Added to cart',
                          color: 'green',
                          icon: <ShoppingCart size={18} />,
                        });
                      }}
                    >
                      Add
                    </Button>
                    <Button
                      radius="xl"
                      variant="light"
                      color="green"
                      leftSection={<MessageCircle size={16} />}
                      styles={buttonStyles}
                      onClick={() => {
                        const hl7 = toHL7Prescription(
                          { product: item as unknown as WebsiteProduct, quantity: 1 },//TODO
                          { questionnaireCode: QUESTIONNAIRE_CODES.PRODUCT_INQUIRY, customerName: item.name },
                        );
                        window.open(
                          buildWhatsAppUrl(hl7, WEBSITE_PRESCRIPTION_PHONE, QUESTIONNAIRE_CODES.PRODUCT_INQUIRY),
                          '_blank',
                        );
                      }}
                    >
                      WhatsApp
                    </Button>
                    <Button
                      radius="xl"
                      variant="filled"
                      color="blue"
                      leftSection={<MessageSquare size={16} />}
                      styles={buttonStyles}
                      onClick={() => {
                        const hl7 = toHL7Prescription(
                          { product: item as unknown as WebsiteProduct, quantity: 1 },
                          { questionnaireCode: QUESTIONNAIRE_CODES.PRODUCT_INQUIRY, customerName: item.name },
                        );
                        useChatbotStore.getState().openWith(hl7, QUESTIONNAIRE_CODES.PRODUCT_INQUIRY);
                      }}
                    >
                      Chat
                    </Button>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

      <Container size="xl" py={{ base: 48, md: 76 }}>
        <Stack gap="xl">
          <Group justify="space-between" align="end">
            <SectionHeading
              eyebrow="Trending now"
              title="Trending products for you!"
            />
            <Button
              visibleFrom="sm"
              radius="xl"
              variant="subtle"
              color="green"
              rightSection={<ChevronRight size={16} />}
              styles={buttonStyles}
              onClick={() => navigate({ to: '/damorex/shop' })}
            >
              See All Product
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            {trendingProducts.length > 0 ? trendingProducts.slice(0, 4).map((product) => (
              <Card
                key={product.id}
                className="lift-card"
                radius={24}
                withBorder
                padding="md"
                style={{
                  borderColor: line,
                  boxShadow: '0 18px 52px rgba(15, 23, 42, 0.06)',
                }}
              >
                <Card.Section
                  style={{
                    background: '#F1F8F4',
                    borderBottom: `1px solid ${line}`,
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate({ to: `/damorex/shop/${product.id}`, params: { slug: product.id } })}
                >
                  <Image
                    src={product.mediumImageUrl || product.imageUrl || productPlaceholder}
                    alt={product.name}
                    h={180}
                    fit="contain"
                    p="lg"
                  />
                </Card.Section>
                <Stack mt="md" gap={6}>
                  {product.category ? (
                    <Badge radius="xl" color="green" variant="light" size="sm" w="fit-content">
                      {product.category.name}
                    </Badge>
                  ) : null}
                  <Text fw={900} lh={1.25} lineClamp={2}>
                    {product.name}
                  </Text>
                  <Rating value={5} readOnly size="sm" />
                  <Button
                    radius="xl"
                    color="green"
                    fullWidth
                    leftSection={<ShoppingCart size={16} />}
                    styles={buttonStyles}
                    style={{ background: green, marginTop: 4 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      useCartStore.getState().addItem(product.id);
                      notifications.show({
                        message: 'Added to cart',
                        color: 'green',
                        icon: <ShoppingCart size={18} />,
                      });
                    }}
                  >
                    Add to cart
                  </Button>
                </Stack>
              </Card>
            )) : Array.from({ length: 4 }).map((_, i) => (
              <Card key={`trending-skel-${i}`} radius={24} withBorder padding="md" style={{ borderColor: line }}>
                <Box style={{ background: '#F1F8F4', borderRadius: 16, height: 180 }} />
                <Stack mt="md" gap={6}>
                  <Box style={{ height: 12, background: '#E8F0EC', borderRadius: 8, width: '60%' }} />
                  <Box style={{ height: 16, background: '#E8F0EC', borderRadius: 8, width: '80%' }} />
                  <Box style={{ height: 12, background: '#E8F0EC', borderRadius: 8, width: '40%' }} />
                  <Box style={{ height: 36, background: '#E8F0EC', borderRadius: 18, marginTop: 4 }} />
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

      <Box py={{ base: 48, md: 64 }} style={{ background: soft }}>
        <Container size="xl">
          <Grid gap="xl" align="stretch">
            <Grid.Col span={{ base: 12, lg: 8 }}>
              <Paper
                radius={28}
                p={{ base: 'lg', md: 'xl' }}
                style={{
                  background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
                  minHeight: 280,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Stack gap="md" style={{ position: 'relative', zIndex: 1 }}>
                  <Badge radius="xl" color="blue" variant="filled" size="lg" w="fit-content">
                    Limited time offer
                  </Badge>
                  <Title order={3} className="damorex-heading" style={{ color: ink, letterSpacing: '-0.03em', maxWidth: 360 }}>
                    Get 20% Off Your First Order
                  </Title>
                  <Text c={ink} lh={1.7} maw={400}>
                    Use code <Text span fw={900}>WELCOME20</Text> at checkout. Valid for new customers on orders above ₦5,000.
                  </Text>
                  <PrimaryButton
                    leftSection={<ShoppingCart size={18} />}
                    onClick={() => navigate({ to: '/damorex/shop' })}
                  >
                    Shop Now
                  </PrimaryButton>
                </Stack>
                <Box
                  style={{
                    position: 'absolute',
                    right: -40,
                    top: -40,
                    width: 240,
                    height: 240,
                    borderRadius: '50%',
                    background: 'rgba(14, 165, 233, 0.10)',
                  }}
                />
                <Box
                  style={{
                    position: 'absolute',
                    right: 40,
                    bottom: -30,
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    background: 'rgba(14, 165, 233, 0.08)',
                  }}
                />
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <Stack gap="md">
                <Paper
                  radius={24}
                  p="lg"
                  style={{
                    background: darkGreen,
                    color: '#fff',
                    minHeight: 126,
                  }}
                >
                  <Group gap="sm" wrap="nowrap" h="100%">
                    <ThemeIcon radius="xl" size={44} style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Truck size={22} />
                    </ThemeIcon>
                    <Box>
                      <Text fw={900} size="lg">Free Delivery</Text>
                      <Text size="sm" c="rgba(255,255,255,0.82)" lh={1.5}>
                        On orders over ₦10,000 within Lagos
                      </Text>
                    </Box>
                  </Group>
                </Paper>
                <Paper
                  radius={24}
                  p="lg"
                  withBorder
                  style={{ borderColor: line, minHeight: 126 }}
                >
                  <Group gap="sm" wrap="nowrap" h="100%">
                    <ThemeIcon radius="xl" size={44} color="green" variant="light">
                      <ShieldCheck size={22} />
                    </ThemeIcon>
                    <Box>
                      <Text fw={900} size="lg">Pharmacist Support</Text>
                      <Text size="sm" c={muted} lh={1.5}>
                        Free consultation with every order
                      </Text>
                    </Box>
                  </Group>
                </Paper>
              </Stack>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      <Container size="xl" py={{ base: 48, md: 76 }}>
        <Stack gap="xl">
          <Group justify="space-between" align="end">
            <SectionHeading
              eyebrow="Product catalog"
              title="Browse our full range"
              text="Explore medicines, supplements, wellness products and more from Damorex."
            />
            <Button
              visibleFrom="sm"
              radius="xl"
              variant="subtle"
              color="green"
              rightSection={<ChevronRight size={16} />}
              styles={buttonStyles}
              onClick={() => navigate({ to: '/damorex/shop' })}
            >
              View all products
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            {catalogProducts.length > 0 ? catalogProducts.slice(0, 8).map((product) => (
              <Card
                key={product.id}
                className="lift-card"
                radius={24}
                withBorder
                padding="md"
                style={{
                  borderColor: line,
                  boxShadow: '0 18px 52px rgba(15, 23, 42, 0.06)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate({ to: `/damorex/shop/${product.id}`, params: { slug: product.id } })}
              >
                <Card.Section
                  style={{
                    background: '#F1F8F4',
                    borderBottom: `1px solid ${line}`,
                    position: 'relative',
                  }}
                >
                  <Image src={product.mediumImageUrl || product.imageUrl || productPlaceholder} alt={product.name} h={170} fit="contain" p="lg" />
                </Card.Section>
                <Stack mt="md" gap={4}>
                  {product.category ? (
                    <Badge radius="xl" color="green" variant="light" size="sm" w="fit-content">
                      {product.category.name}
                    </Badge>
                  ) : null}
                  <Text fw={900} lh={1.25} lineClamp={2}>
                    {product.name}
                  </Text>
                  {product.genericProduct ? (
                    <Text size="sm" c={muted} lineClamp={1}>
                      {product.genericProduct.name}
                    </Text>
                  ) : null}
                  <Button
                    radius="xl"
                    color="green"
                    fullWidth
                    leftSection={<ShoppingCart size={16} />}
                    styles={buttonStyles}
                    style={{ background: green, marginTop: 6 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      useCartStore.getState().addItem(product.id);
                      notifications.show({
                        message: 'Added to cart',
                        color: 'green',
                        icon: <ShoppingCart size={18} />,
                      });
                    }}
                  >
                    Add to cart
                  </Button>
                </Stack>
              </Card>
            )) : Array.from({ length: 8 }).map((_, i) => (
              <Card key={`catalog-skel-${i}`} radius={24} withBorder padding="md" style={{ borderColor: line }}>
                <Box style={{ background: '#F1F8F4', borderRadius: 16, height: 170 }} />
                <Stack mt="md" gap={4}>
                  <Box style={{ height: 10, background: '#E8F0EC', borderRadius: 8, width: '50%' }} />
                  <Box style={{ height: 14, background: '#E8F0EC', borderRadius: 8, width: '70%' }} />
                  <Box style={{ height: 10, background: '#E8F0EC', borderRadius: 8, width: '40%' }} />
                  <Box style={{ height: 36, background: '#E8F0EC', borderRadius: 18, marginTop: 6 }} />
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

      <Box py={{ base: 48, md: 76 }} style={{ background: soft }}>
        <Container size="xl">
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
            <Paper
              radius={30}
              p={{ base: 'lg', md: 'xl' }}
              withBorder
              style={{ borderColor: line, background: '#fff' }}
            >
              <Stack gap="lg">
                <SectionHeading
                  eyebrow="Speak with a pharmacist"
                  title="Professional support before you buy"
                  text="Get medication advice, drug information, refill guidance and wellness support from a friendly Damorex pharmacist."
                />
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  {[
                    'Medication advice',
                    'Drug information',
                    'Refill guidance',
                    'Wellness support',
                  ].map((item) => (
                    <Group key={item} gap={8}>
                      <ThemeIcon radius="xl" color="green" variant="light">
                        <BadgeCheck size={16} />
                      </ThemeIcon>
                      <Text fw={800}>{item}</Text>
                    </Group>
                  ))}
                </SimpleGrid>
                <Group>
                  <PrimaryButton
                    leftSection={<CalendarClock size={18} />}
                    onClick={() => navigate({ to: '/damorex/consult-pharmacist' })}
                  >
                    Book Consultation
                  </PrimaryButton>
                  <OutlineButton
                    leftSection={<MessageCircle size={18} />}
                    onClick={() => {
                      const url = `https://wa.me/${WEBSITE_PRESCRIPTION_PHONE.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${QUESTIONNAIRE_CODES.HEALTH_CONSULTATION}\r\nHello Damorex, I want to speak with a pharmacist`)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    WhatsApp Pharmacist
                  </OutlineButton>
                </Group>
              </Stack>
            </Paper>

            <Paper
              radius={30}
              p={0}
              style={{
                overflow: 'hidden',
                minHeight: 420,
                position: 'relative',
                boxShadow: '0 24px 70px rgba(15, 23, 42, 0.10)',
              }}
            >
              <Image
                src={pharmacistImage}
                alt="Friendly pharmacist consultation"
                h={420}
                fit="cover"
              />
              <Box
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(15,23,42,0.02), rgba(15,111,53,0.68))',
                }}
              />
              <Paper
                radius={22}
                p="lg"
                style={{
                  position: 'absolute',
                  left: 20,
                  right: 20,
                  bottom: 20,
                  background: 'rgba(255, 255, 255, 0.93)',
                }}
              >
                <Group justify="space-between">
                  <Box>
                    <Text fw={900}>Average response</Text>
                    <Text c={muted} size="sm">
                      WhatsApp pharmacist replies in minutes
                    </Text>
                  </Box>
                  <Badge color="green" radius="xl">
                    Online now
                  </Badge>
                </Group>
              </Paper>
            </Paper>
          </SimpleGrid>
        </Container>
      </Box>

      <Container size="xl" py={{ base: 48, md: 76 }}>
        <Stack gap="xl">
          <SectionHeading
            eyebrow="Why choose Damorex"
            title="Trust signals that matter in healthcare"
          />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {whyItems.map((item) => (
              <Paper
                className="lift-card"
                key={item.title}
                radius={24}
                p="xl"
                withBorder
                style={{ borderColor: line }}
              >
                <Stack gap="md">
                  <ThemeIcon radius="xl" size={50} color="green" variant="light">
                    <item.icon size={24} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={900} size="lg">
                      {item.title}
                    </Text>
                    <Text c={muted} lh={1.7}>
                      {item.text}
                    </Text>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

      <Box py={{ base: 48, md: 76 }} style={{ background: '#0F172A', color: '#fff' }}>
        <Container size="xl">
          <Grid gap={48} align="center">
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Stack gap="lg">
                <Badge radius="xl" color="green" variant="filled" size="lg" w="fit-content">
                  About Damorex
                </Badge>
                <Title order={2} className="damorex-heading" style={{ color: '#fff', letterSpacing: '-0.03em' }}>
                  Your Trusted Partner in Healthcare
                </Title>
                <Text c="rgba(255,255,255,0.76)" lh={1.7}>
                  Damorex Pharmacy is a licensed online pharmacy dedicated to providing safe, authentic, and affordable
                  medicines across Nigeria. With a network of branches and a team of licensed pharmacists, we ensure you
                  receive the right care, every time.
                </Text>
                <Group gap={8}>
                  {[
                    { label: 'Licensed by PCN', icon: BadgeCheck },
                    { label: '500+ Quality Medicines', icon: Pill },
                    { label: 'Same-Day Delivery', icon: Truck },
                    { label: '24/7 Pharmacist Support', icon: MessageCircle },
                  ].map((item) => (
                    <Badge
                      key={item.label}
                      radius="xl"
                      color="gray"
                      variant="outline"
                      size="lg"
                      leftSection={<item.icon size={14} />}
                      style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.88)' }}
                    >
                      {item.label}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <SimpleGrid cols={2} spacing="md">
                {[
                  { value: '10+', label: 'Years of Trust' },
                  { value: '50K+', label: 'Happy Customers' },
                  { value: '2,500+', label: 'Quality Medicines' },
                  { value: '1K+', label: 'Daily Orders' },
                ].map((stat) => (
                  <Paper
                    key={stat.label}
                    radius={24}
                    p="xl"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.10)',
                    }}
                  >
                    <Stack align="center" gap={4}>
                      <Text fw={950} size="xxxl" style={{ color: green, fontSize: 42, lineHeight: 1 }}>
                        {stat.value}
                      </Text>
                      <Text c="rgba(255,255,255,0.76)" ta="center" fw={700}>
                        {stat.label}
                      </Text>
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      <Box py={{ base: 48, md: 76 }} style={{ background: '#F0F9F5' }}>
        <Container size="xl">
          <Grid gap="xl" align="center">
            <Grid.Col span={{ base: 12, lg: 5 }}>
              <SectionHeading
                eyebrow="Delivery coverage"
                title="Fast dispatch across Lagos, Ogun and Oyo"
                text="Choose same-day delivery, scheduled delivery or express dispatch where available."
              />
              <SimpleGrid mt="xl" cols={{ base: 1, sm: 3 }}>
                {['Same Day Delivery', 'Scheduled Delivery', 'Express Dispatch'].map((item) => (
                  <Paper
                    key={item}
                    radius={20}
                    p="md"
                    withBorder
                    style={{ borderColor: '#CDEDD8', background: '#fff' }}
                  >
                    <Text fw={900}>{item}</Text>
                  </Paper>
                ))}
              </SimpleGrid>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 7 }}>
              <Paper
                radius={30}
                p={{ base: 'lg', md: 'xl' }}
                style={{
                  minHeight: 360,
                  background:
                    'radial-gradient(circle at 25% 28%, rgba(22,163,74,0.28), transparent 18%), radial-gradient(circle at 55% 55%, rgba(14,165,233,0.22), transparent 20%), radial-gradient(circle at 75% 32%, rgba(34,197,94,0.24), transparent 16%), #FFFFFF',
                  border: `1px solid ${line}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {[
                  { city: 'Lagos', top: '28%', left: '26%' },
                  { city: 'Ogun State', top: '56%', left: '52%' },
                  { city: 'Oyo State', top: '32%', left: '74%' },
                ].map((pin) => (
                  <Paper
                    key={pin.city}
                    radius="xl"
                    p="sm"
                    style={{
                      position: 'absolute',
                      top: pin.top,
                      left: pin.left,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 18px 42px rgba(15, 111, 53, 0.18)',
                    }}
                  >
                    <Group gap={6} wrap="nowrap">
                      <MapPin size={16} color={green} />
                      <Text fw={900} size="sm">
                        {pin.city}
                      </Text>
                    </Group>
                  </Paper>
                ))}
                <Image
                  src={deliveryImage}
                  alt="Delivery and pharmacy logistics"
                  radius={24}
                  h={150}
                  w={220}
                  fit="cover"
                  style={{
                    position: 'absolute',
                    right: 22,
                    bottom: 22,
                    border: '6px solid #fff',
                    boxShadow: '0 20px 54px rgba(15, 23, 42, 0.18)',
                  }}
                />
              </Paper>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      <Container size="xl" py={{ base: 48, md: 76 }}>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
          <Paper
            radius={30}
            p={{ base: 'lg', md: 'xl' }}
            style={{ background: darkGreen, color: '#fff' }}
          >
            <Stack gap="lg">
              <ThemeIcon radius="xl" size={54} style={{ background: 'rgba(255,255,255,0.16)' }}>
                <Star size={26} />
              </ThemeIcon>
              <Box>
                <Title order={2} className="damorex-heading">
                  Loyalty & Rewards
                </Title>
                <Text c="rgba(255,255,255,0.82)" mt={8} lh={1.7}>
                  Earn points on purchases, redeem rewards, unlock referral bonuses and receive
                  exclusive discounts.
                </Text>
              </Box>
              <Button
                color="gray"
                variant="white"
                radius="xl"
                w="fit-content"
                leftSection={<CircleDollarSign size={18} />}
                styles={buttonStyles}
                onClick={() => navigate({ to: '/damorex/rewards' })}
              >
                Join Rewards Program
              </Button>
            </Stack>
          </Paper>

          <Paper radius={30} p={{ base: 'lg', md: 'xl' }} withBorder>
            <Stack gap="lg">
              <SectionHeading
                eyebrow="Mobile app coming soon"
                title="Manage your health anywhere."
                text="Android and iOS experiences are planned for refills, reminders, deliveries and pharmacist chat."
              />
              <Group>
                <Badge size="lg" radius="xl" color="green" leftSection={<Smartphone size={14} />}>
                  Android
                </Badge>
                <Badge size="lg" radius="xl" color="blue" leftSection={<Smartphone size={14} />}>
                  iOS
                </Badge>
              </Group>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Container>

      <Box py={{ base: 48, md: 76 }} style={{ background: soft }}>
        <Container size="xl">
          <Stack gap="xl">
            <Group justify="space-between" align="end">
              <SectionHeading
                eyebrow="Customer stories"
                title="Trusted by families and chronic care customers"
              />
              <Badge color="green" radius="xl" size="lg">
                Verified purchase badges
              </Badge>
            </Group>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
              {testimonials.map((item) => (
                <Paper
                  className="lift-card"
                  key={item.name}
                  radius={24}
                  p="xl"
                  withBorder
                  style={{ borderColor: line, background: '#fff' }}
                >
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Rating value={5} readOnly />
                      <Badge color="green" variant="light">
                        Verified
                      </Badge>
                    </Group>
                    <Text c={ink} lh={1.7}>
                      &ldquo;{item.text}&rdquo;
                    </Text>
                    <Box>
                      <Text fw={900}>{item.name}</Text>
                      <Text size="sm" c={muted}>
                        {item.focus}
                      </Text>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      <Container size="xl" py={{ base: 48, md: 76 }}>
        <Grid gap="xl">
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Stack gap="xl">
              <SectionHeading
                eyebrow="Health blog"
                title="Practical health education from the pharmacy team"
              />
              <SimpleGrid cols={{ base: 1, md: 3 }}>
                {articles.map((article) => (
                  <Paper
                    className="lift-card"
                    key={article.title}
                    radius={24}
                    p="lg"
                    withBorder
                    style={{ borderColor: line }}
                  >
                    <Stack h="100%" justify="space-between">
                      <ThemeIcon radius="xl" color="green" variant="light" size={46}>
                        <BookOpen size={22} />
                      </ThemeIcon>
                      <Text fw={900} lh={1.3}>
                        {article.title}
                      </Text>
                      <Anchor
                        c={green}
                        fw={900}
                        underline="never"
                        className="damorex-link"
                        onClick={() => navigate({ to: `/damorex/blog/${article.slug}` })}
                      >
                        Read article
                      </Anchor>
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Paper
              radius={30}
              p={{ base: 'lg', md: 'xl' }}
              style={{
                background:
                  'radial-gradient(circle at top right, rgba(14,165,233,0.18), transparent 35%), #0F172A',
                color: '#fff',
                minHeight: '100%',
              }}
            >
              <Stack gap="lg">
                <ThemeIcon radius="xl" color="blue" size={54}>
                  <Mail size={26} />
                </ThemeIcon>
                <Box>
                  <Title order={2} className="damorex-heading">
                    Stay Healthy. Stay Informed.
                  </Title>
                  <Text c="rgba(255,255,255,0.76)" mt={8} lh={1.7}>
                    Get health tips, promotions and refill reminders sent to your inbox or phone.
                  </Text>
                </Box>
                <Stack gap="sm">
                  <label>
                    <Text size="sm" fw={800} mb={6}>
                      Email address
                    </Text>
                    <Input
                      aria-label="Email address"
                      placeholder="you@example.com"
                      radius="xl"
                      size="md"
                      value={email}
                      onChange={(e) => setEmail(e.currentTarget.value)}
                    />
                  </label>
                  <label>
                    <Text size="sm" fw={800} mb={6}>
                      Phone number
                    </Text>
                    <Input
                      aria-label="Phone number"
                      placeholder="+234"
                      radius="xl"
                      size="md"
                      value={phone}
                      onChange={(e) => setPhone(e.currentTarget.value)}
                    />
                  </label>
                </Stack>
                <Button
                  radius="xl"
                  color="green"
                  size="md"
                  leftSection={
                    subscribing ? <Loader size={18} color="white" /> : <BellRing size={18} />
                  }
                  styles={buttonStyles}
                  style={{ background: green }}
                  disabled={subscribing}
                  onClick={async () => {
                    if (!email && !phone) {return;}
                    setSubscribing(true);
                    try {
                      await websiteApi.subscribe({ email, phone: phone || undefined });
                      notifications.show({ message: 'Subscribed successfully!', color: 'green' });
                      setEmail('');
                      setPhone('');
                    } catch {
                      notifications.show({
                        message: 'Subscription failed. Try again.',
                        color: 'red',
                      });
                    } finally {
                      setSubscribing(false);
                    }
                  }}
                >
                  Subscribe
                </Button>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </WebsiteLayout>
  );
}
