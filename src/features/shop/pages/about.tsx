import {
  Box,
  Button,
  Container,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { BadgeCheck, Heart, Pill, Shield, ShoppingCart, Star, Truck, Users } from 'lucide-react';
import { SectionHeading, PrimaryButton } from '../website/components';
import {
  WebsiteLayout,
  green,
  darkGreen,
  ink,
  muted,
  line,
  soft,
  buttonStyles,
} from '../website/layout';

const stats = [
  { value: '10,000+', label: 'Customers' },
  { value: '2,500+', label: 'Medicines' },
  { value: '3', label: 'States Covered' },
  { value: '100%', label: 'Genuine Products' },
];

const values = [
  {
    title: 'Trust',
    text: 'Every medicine dispensed is verified for authenticity and sourced from licensed manufacturers and distributors.',
    icon: Shield,
  },
  {
    title: 'Care',
    text: 'Our pharmacists take the time to understand your health needs and provide professional guidance with every order.',
    icon: Heart,
  },
  {
    title: 'Innovation',
    text: 'We use technology to make pharmacy services faster, more transparent and more convenient for Nigerian families.',
    icon: Star,
  },
  {
    title: 'Accessibility',
    text: 'Quality healthcare should be within reach for everyone. We deliver to homes across three states with expanding coverage.',
    icon: Users,
  },
  {
    title: 'Quality',
    text: 'From storage to delivery, every medicine is handled according to strict pharmaceutical standards and regulations.',
    icon: BadgeCheck,
  },
  {
    title: 'Community',
    text: 'We are building a health-conscious community by educating customers and supporting local healthcare initiatives.',
    icon: Truck,
  },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <WebsiteLayout>
      <Box
        py={{ base: 48, md: 80 }}
        style={{
          background: `linear-gradient(135deg, ${darkGreen} 0%, #0B4A28 50%, #0F172A 100%)`,
          color: '#fff',
        }}
      >
        <Container size="xl">
          <Stack gap={24} maw={820}>
            <Text tt="uppercase" size="xs" fw={900} c="rgba(255,255,255,0.6)" lts={1.4}>
              About Damorex
            </Text>
            <Title order={1} className="damorex-heading hero-title">
              Your Health. Our Purpose.
            </Title>
            <Text size="lg" lh={1.7} c="rgba(255,255,255,0.78)" maw={680}>
              Damorex is a Nigerian online pharmacy dedicated to making healthcare accessible, safe
              and convenient through technology and genuine pharmaceutical care.
            </Text>
          </Stack>
        </Container>
      </Box>

      <Container size="xl" py={{ base: 48, md: 76 }}>
        <Grid gap="xl" align="center">
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <Stack gap="md">
              <SectionHeading eyebrow="Our story" title="Built on a foundation of care and trust" />
              <Text c={muted} lh={1.7}>
                Damorex was founded with a simple but powerful belief: that every Nigerian deserves
                access to genuine medicines and professional pharmaceutical care without leaving
                their home. What started as a single pharmacy outlet has grown into a
                technology-driven healthcare platform serving thousands of customers across Lagos,
                Ogun and Oyo states.
              </Text>
              <Text c={muted} lh={1.7}>
                We recognised that busy families, chronic care patients and working professionals
                often struggle to find time for pharmacy visits. Long queues, traffic, medicine
                shortages and concerns about product authenticity were common frustrations. Damorex
                was built to solve these problems — combining a robust inventory system, licensed
                pharmacists and reliable logistics into a seamless online experience.
              </Text>
              <Text c={muted} lh={1.7}>
                Our mission is to become the most trusted pharmacy platform in Nigeria by putting
                patient safety, product quality and convenience at the centre of everything we do.
                We envision a future where healthcare access is not limited by geography, traffic or
                time of day.
              </Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 6 }}>
            <SimpleGrid cols={2} spacing="md">
              {stats.map((stat) => (
                <Paper
                  key={stat.label}
                  radius={24}
                  p="xl"
                  withBorder
                  style={{ borderColor: line, textAlign: 'center' }}
                >
                  <Text fw={950} size="xl" c={green} className="damorex-heading">
                    {stat.value}
                  </Text>
                  <Text size="sm" c={muted} mt={4}>
                    {stat.label}
                  </Text>
                </Paper>
              ))}
            </SimpleGrid>
          </Grid.Col>
        </Grid>
      </Container>

      <Box py={{ base: 48, md: 76 }} style={{ background: soft }}>
        <Container size="xl">
          <Stack gap="xl">
            <SectionHeading
              eyebrow="Our values"
              title="What guides every decision we make"
              text="These principles shape how we serve our customers, handle medicines and build the future of pharmacy in Nigeria."
            />
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <Paper
                    className="lift-card"
                    key={value.title}
                    radius={24}
                    p="xl"
                    withBorder
                    style={{ borderColor: line, background: '#fff' }}
                  >
                    <Stack gap="md">
                      <ThemeIcon radius="xl" size={50} color="green" variant="light">
                        <Icon size={24} />
                      </ThemeIcon>
                      <Box>
                        <Text fw={900} size="lg">
                          {value.title}
                        </Text>
                        <Text c={muted} lh={1.7} mt={6}>
                          {value.text}
                        </Text>
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      <Box py={{ base: 48, md: 76 }} style={{ background: darkGreen }}>
        <Container size="xl">
          <Stack gap={24} align="center" style={{ textAlign: 'center' }}>
            <ThemeIcon radius="xl" size={58} style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Heart size={28} color="#fff" />
            </ThemeIcon>
            <Title order={2} className="damorex-heading" c="#fff">
              Join thousands of Nigerians who trust Damorex
            </Title>
            <Text c="rgba(255,255,255,0.78)" size="lg" lh={1.7} maw={560}>
              Browse genuine medicines and healthcare products. Our pharmacists are ready to help.
            </Text>
            <PrimaryButton
              leftSection={<ShoppingCart size={18} />}
              onClick={() => navigate({ to: '/shop/shop' })}
            >
              Shop Medicines
            </PrimaryButton>
          </Stack>
        </Container>
      </Box>
    </WebsiteLayout>
  );
}
