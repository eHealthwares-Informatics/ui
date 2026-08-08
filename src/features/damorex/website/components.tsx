import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Image,
  Paper,
  Rating,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import {
  Baby,
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileUp,
  MessageCircle,
  MessageSquare,
  Minus,
  Pill,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Stethoscope,
  Truck,
  User,
} from 'lucide-react';
import { useChatbotStore } from './chatbot-store';
import {
  toHL7Prescription,
  buildWhatsAppUrl,
  WEBSITE_PRESCRIPTION_PHONE,
  QUESTIONNAIRE_CODES,
} from './hl7-prescription';
import productPlaceholder from '../sample_images/generic_product_image.png';
import type { WebsiteProduct, HealthConcernView, TestimonialView } from './types';

export const green = '#16A34A';
export const darkGreen = '#0F6F35';
export const blue = '#0EA5E9';
export const ink = '#0F172A';
export const muted = '#64748B';
export const line = '#DDE7E2';
export const soft = '#F7FBF9';

export const buttonStyles = {
  root: {
    transition:
      'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease, background-color 220ms ease',
  },
};

export function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <Stack gap={8} maw={760}>
      <Text tt="uppercase" size="xs" fw={900} c={green} lts={1.4}>
        {eyebrow}
      </Text>
      <Title order={2} className="damorex-heading" style={{ color: ink, letterSpacing: '-0.03em' }}>
        {title}
      </Title>
      {text ? (
        <Text c={muted} size="lg" lh={1.7}>
          {text}
        </Text>
      ) : null}
    </Stack>
  );
}

export function PrimaryButton({
  children,
  leftSection,
  onClick,
}: {
  children: React.ReactNode;
  leftSection?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Button
      size="md"
      radius="xl"
      leftSection={leftSection}
      styles={buttonStyles}
      onClick={onClick}
      style={{
        background: green,
        boxShadow: '0 16px 32px rgba(22, 163, 74, 0.22)',
      }}
    >
      {children}
    </Button>
  );
}

export function OutlineButton({
  children,
  leftSection,
  onClick,
}: {
  children: React.ReactNode;
  leftSection?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Button
      size="md"
      radius="xl"
      variant="outline"
      leftSection={leftSection}
      styles={buttonStyles}
      onClick={onClick}
      style={{
        borderColor: '#B9D9C6',
        color: darkGreen,
        background: '#fff',
      }}
    >
      {children}
    </Button>
  );
}

export function ProductCard({ product }: { product: WebsiteProduct }) {
  const navigate = useNavigate();
  const gp = product.genericProduct;

  return (
    <Card
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
        <Image src={product.mediumImageUrl || product.imageUrl || productPlaceholder} alt={product.name} h={190} fit="contain" p="lg" />
      </Card.Section>
      <Stack mt="md" gap="sm">
        <Box>
          <Text fw={900} lh={1.25}>
            {product.name}
          </Text>
          {gp ? (
            <Text size="sm" c={muted}>
              {gp.name}
            </Text>
          ) : null}
        </Box>
        {product.unitPrice != null && (
          <Text fw={700} size="lg" c={green}>
            ₦{product.unitPrice.toLocaleString()}
          </Text>
        )}
        <Text size="xs" c={muted}>
          {gp?.isPrescriptionRequired ? 'Prescription required' : 'No prescription needed'}
        </Text>
        <Group grow gap={6}>
          <Button
            radius="xl"
            size="sm"
            style={{ background: green }}
            leftSection={<ShoppingCart size={16} />}
            styles={buttonStyles}
            onClick={(e) => {
              e.stopPropagation();
              navigate({ to: `/damorex/shop/${product.id}`, params: { slug: product.id } });
            }}
          >
            View
          </Button>
          <Button
            radius="xl"
            size="sm"
            variant="light"
            color="green"
            leftSection={<MessageCircle size={16} />}
            styles={buttonStyles}
            onClick={(e) => {
              e.stopPropagation();
              const hl7 = toHL7Prescription(
                { product, quantity: 1 },
                { questionnaireCode: QUESTIONNAIRE_CODES.PRODUCT_INQUIRY, customerName: product.name },
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
            size="sm"
            variant="filled"
            color="blue"
            leftSection={<MessageSquare size={16} />}
            styles={buttonStyles}
            onClick={(e) => {
              e.stopPropagation();
              const hl7 = toHL7Prescription(
                { product, quantity: 1 },
                { questionnaireCode: QUESTIONNAIRE_CODES.PRODUCT_INQUIRY, customerName: product.name },
              );
              useChatbotStore.getState().openWith(hl7, QUESTIONNAIRE_CODES.PRODUCT_INQUIRY);
            }}
          >
            Chat
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}

export function HealthConcernCard({
  concern,
  index,
}: {
  concern: HealthConcernView;
  index: number;
}) {
  const navigate = useNavigate();
  const icons = [
    BadgeCheck,
    Heart,
    Stethoscope,
    Pill,
    User,
    Baby,
    Sparkles,
    Plus,
    Minus,
    Clock3,
    ShieldCheck,
    Truck,
  ];
  const IconComponent = icons[index % icons.length];

  return (
    <Card
      className="lift-card"
      radius={22}
      p="lg"
      withBorder
      style={{
        borderColor: line,
        boxShadow: '0 16px 46px rgba(15, 23, 42, 0.05)',
        cursor: 'pointer',
      }}
      onClick={() => navigate({ to: `/damorex/health-concerns/${concern.slug}` })}
    >
      <Stack gap="sm">
        <ThemeIcon radius="xl" size={46} color="green" variant="light">
          <IconComponent size={22} />
        </ThemeIcon>
        <Box>
          <Text fw={900}>{concern.name}</Text>
          {concern.description ? (
            <Text size="sm" c={muted}>
              {concern.description}
            </Text>
          ) : null}
        </Box>
        <Anchor
          underline="never"
          c={green}
          fw={900}
          size="sm"
          className="damorex-link"
          onClick={(e) => {
            e.stopPropagation();
            navigate({ to: `/health-concerns/${concern.slug}` });
          }}
        >
          Shop care <ChevronRight size={14} style={{ display: 'inline' }} />
        </Anchor>
      </Stack>
    </Card>
  );
}

export function TestimonialCard({ testimonial }: { testimonial: TestimonialView }) {
  return (
    <Paper
      className="lift-card"
      radius={24}
      p="xl"
      withBorder
      style={{ borderColor: line, background: '#fff' }}
    >
      <Stack gap="md">
        <Group justify="space-between">
          <Rating value={5} readOnly />
          {testimonial.isVerified ? (
            <Badge color="green" variant="light">
              Verified
            </Badge>
          ) : null}
        </Group>
        <Text c={ink} lh={1.7}>
          &ldquo;{testimonial.text}&rdquo;
        </Text>
        <Box>
          <Text fw={900}>{testimonial.name}</Text>
          {testimonial.focus ? (
            <Text size="sm" c={muted}>
              {testimonial.focus}
            </Text>
          ) : null}
        </Box>
      </Stack>
    </Paper>
  );
}

export function PrescriptionUploadSection() {
  const navigate = useNavigate();

  return (
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
                  <FileUp size={26} />
                </ThemeIcon>
                <Title order={2} className="damorex-heading">
                  Have a Prescription?
                </Title>
                <Text c="rgba(255,255,255,0.82)" lh={1.7}>
                  Upload your doctor&apos;s prescription and our licensed pharmacists will review
                  and prepare your medications.
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
                { title: '1. Upload', text: 'Send prescription images or PDFs securely.' },
                {
                  title: '2. Pharmacist Review',
                  text: 'A licensed pharmacist validates details and stock.',
                },
                { title: '3. Dispatch', text: 'Pay securely and receive delivery updates.' },
              ].map((step) => (
                <Paper
                  className="lift-card"
                  key={step.title}
                  radius={24}
                  p="xl"
                  withBorder
                  style={{ borderColor: line, background: '#fff', minHeight: 220 }}
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
  );
}

export function ConsultationSection() {
  const navigate = useNavigate();

  return (
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
                  onClick={() => window.open('https://wa.me/234', '_blank')}
                >
                  WhatsApp Pharmacist
                </OutlineButton>
              </Group>
            </Stack>
          </Paper>

          <Paper
            radius={30}
            p="lg"
            style={{
              background:
                'radial-gradient(circle at 25% 28%, rgba(22,163,74,0.28), transparent 18%), radial-gradient(circle at 55% 55%, rgba(14,165,233,0.22), transparent 20%), radial-gradient(circle at 75% 32%, rgba(34,197,94,0.24), transparent 16%), #FFFFFF',
              border: `1px solid ${line}`,
              minHeight: 360,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Stack gap="md" p="md">
              <ThemeIcon radius="xl" size={54} style={{ background: 'rgba(22,163,74,0.12)' }}>
                <MessageCircle size={26} color={green} />
              </ThemeIcon>
              <Title order={3} className="damorex-heading">
                Average response time
              </Title>
              <Text c={muted} lh={1.7}>
                Our pharmacists typically reply within minutes on WhatsApp. Get professional advice
                without visiting a physical pharmacy.
              </Text>
              <Badge color="green" radius="xl" size="lg" w="fit-content">
                Online now
              </Badge>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Container>
    </Box>
  );
}

export function NewsletterSection() {
  return (
    <Container size="xl" py={{ base: 48, md: 76 }}>
      <Paper
        radius={30}
        p={{ base: 'lg', md: 'xl' }}
        style={{
          background:
            'radial-gradient(circle at top right, rgba(14,165,233,0.18), transparent 35%), #0F172A',
          color: '#fff',
        }}
      >
        <Grid align="center">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              <ThemeIcon radius="xl" color="blue" size={54}>
                <Star size={26} />
              </ThemeIcon>
              <Title order={2} className="damorex-heading">
                Stay Healthy. Stay Informed.
              </Title>
              <Text c="rgba(255,255,255,0.76)" lh={1.7}>
                Get health tips, promotions and refill reminders sent to your inbox or phone.
              </Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              <Group grow>
                <label style={{ width: '100%' }}>
                  <Text size="sm" fw={800} mb={6}>
                    Email address
                  </Text>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      borderRadius: 999,
                      border: 'none',
                      fontSize: 14,
                    }}
                  />
                </label>
                <label style={{ width: '100%' }}>
                  <Text size="sm" fw={800} mb={6}>
                    Phone number
                  </Text>
                  <input
                    type="tel"
                    placeholder="+234"
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      borderRadius: 999,
                      border: 'none',
                      fontSize: 14,
                    }}
                  />
                </label>
              </Group>
              <Button
                radius="xl"
                color="green"
                size="md"
                leftSection={<Smartphone size={18} />}
                styles={buttonStyles}
                style={{ background: green, alignSelf: 'flex-start' }}
              >
                Subscribe
              </Button>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>
    </Container>
  );
}

import logoImage from '../sample_images/sample_logo.png';

function Heart(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export function Logo() {
  return (
    <Group gap={10} wrap="nowrap">
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
  );
}
