import { Box, Container, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { Cross, Search, FileText, CalendarClock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { green, darkGreen, muted, line, soft } from './components';

const keyframesId = 'damorex-loader-styles';

const loaderStyles = `
@keyframes damorex-pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.04); }
}
@keyframes damorex-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes damorex-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@keyframes damorex-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes damorex-fade {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}
@keyframes damorex-skeleton-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
`;

function injectLoaderStyles() {
  if (typeof document !== 'undefined' && !document.getElementById(keyframesId)) {
    const style = document.createElement('style');
    style.id = keyframesId;
    style.textContent = loaderStyles;
    document.head.appendChild(style);
  }
}

function PillIcon({ size = 24 }: { size?: number; color?: string }) {
  return (
    <Box
      style={{
        width: size * 1.6,
        height: size,
        borderRadius: size / 2,
        background: `linear-gradient(135deg, ${green}, ${darkGreen})`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '48%',
          width: '4%',
          background: 'rgba(255,255,255,0.35)',
        }}
      />
    </Box>
  );
}

function SkeletonBar({
  width = '100%',
  height = 14,
  radius = 999,
}: {
  width?: string | number;
  height?: number;
  radius?: number;
}) {
  return (
    <Box
      style={{
        width,
        height,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${line} 25%, rgba(22,163,74,0.1) 50%, ${line} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'damorex-shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

const messages = [
  'Checking stock...',
  'Reviewing your prescription...',
  'Preparing your order...',
  'Consulting with pharmacists...',
  'Packing your medicines...',
];

export function FullPageLoader() {
  useEffect(() => {
    injectLoaderStyles();
  }, []);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: soft,
      }}
    >
      <Stack align="center" gap="xl">
        <Box
          style={{
            position: 'relative',
            width: 80,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            style={{
              position: 'absolute',
              animation: 'damorex-rotate 2s linear infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Cross size={64} color={green} opacity={0.15} />
          </Box>
          <Box style={{ animation: 'damorex-bounce 1.2s ease-in-out infinite' }}>
            <PillIcon size={40} />
          </Box>
        </Box>
        <Title order={3} c={darkGreen} className="damorex-heading">
          Damorex
        </Title>
        <Text c={muted} size="lg" style={{ animation: 'damorex-fade 1.8s ease-in-out infinite' }}>
          {messages[msgIndex]}
        </Text>
      </Stack>
    </Box>
  );
}

export function PageLoader() {
  useEffect(() => {
    injectLoaderStyles();
  }, []);

  return (
    <Container size="xl" py="xl">
      <Stack align="center" gap="lg" py={80}>
        <Box style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              style={{
                animation: `damorex-bounce 1s ease-in-out ${i * 0.15}s infinite`,
              }}
            >
              <PillIcon size={20 + i * 4} />
            </Box>
          ))}
        </Box>
        <Text c={muted} size="sm" style={{ animation: 'damorex-fade 1.8s ease-in-out infinite' }}>
          Loading...
        </Text>
      </Stack>
    </Container>
  );
}

export function SectionLoader() {
  useEffect(() => {
    injectLoaderStyles();
  }, []);

  return (
    <Stack gap="md" py="md">
      {[90, 75, 60, 45].map((w, i) => (
        <Box
          key={i}
          style={{ animation: `damorex-skeleton-pulse 1.5s ease-in-out ${i * 0.15}s infinite` }}
        >
          <SkeletonBar width={`${w}%`} height={16} />
        </Box>
      ))}
      <Box mt="xs" style={{ animation: 'damorex-skeleton-pulse 1.5s ease-in-out 0.6s infinite' }}>
        <SkeletonBar width="100%" height={120} radius={16} />
      </Box>
    </Stack>
  );
}

export function ProductLoader({ count = 8 }: { count?: number }) {
  useEffect(() => {
    injectLoaderStyles();
  }, []);

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          style={{
            border: `1px solid ${line}`,
            borderRadius: 24,
            overflow: 'hidden',
            background: '#fff',
            animation: `damorex-skeleton-pulse 1.5s ease-in-out ${i * 0.08}s infinite`,
          }}
        >
          <Box
            style={{
              height: 190,
              background: `linear-gradient(90deg, ${line} 25%, rgba(22,163,74,0.06) 50%, ${line} 75%)`,
              backgroundSize: '200% 100%',
              animation: 'damorex-shimmer 1.5s ease-in-out infinite',
            }}
          />
          <Stack p="md" gap="sm">
            <SkeletonBar width="80%" height={16} />
            <SkeletonBar width="55%" height={12} />
            <SkeletonBar width="40%" height={12} />
            <Box mt="xs">
              <SkeletonBar width="100%" height={36} radius={999} />
            </Box>
          </Stack>
        </Box>
      ))}
    </SimpleGrid>
  );
}

export function SearchLoader() {
  useEffect(() => {
    injectLoaderStyles();
  }, []);

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Search size={20} color={muted} />
          <SkeletonBar width="60%" height={18} />
        </Box>
        {Array.from({ length: 5 }).map((_, i) => (
          <Box
            key={i}
            style={{
              display: 'flex',
              gap: 16,
              padding: 16,
              border: `1px solid ${line}`,
              borderRadius: 16,
              animation: `damorex-skeleton-pulse 1.5s ease-in-out ${i * 0.1}s infinite`,
            }}
          >
            <Box
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                background: line,
                flexShrink: 0,
              }}
            />
            <Stack gap={8} style={{ flex: 1 }}>
              <SkeletonBar width="50%" height={16} />
              <SkeletonBar width="80%" height={12} />
              <SkeletonBar width="30%" height={12} />
            </Stack>
          </Box>
        ))}
      </Stack>
    </Container>
  );
}

export function PrescriptionLoader() {
  useEffect(() => {
    injectLoaderStyles();
  }, []);

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <GroupWithIcon icon={<FileText size={24} />} />
        <Box
          style={{
            border: `1px solid ${line}`,
            borderRadius: 20,
            padding: 24,
            background: '#fff',
          }}
        >
          <Stack gap="md">
            {[100, 88, 72, 56, 92].map((w, i) => (
              <Box
                key={i}
                style={{
                  animation: `damorex-skeleton-pulse 1.5s ease-in-out ${i * 0.1}s infinite`,
                }}
              >
                <SkeletonBar width={`${w}%`} height={i === 0 ? 20 : 14} />
              </Box>
            ))}
            <Box
              mt="md"
              style={{
                height: 200,
                borderRadius: 12,
                background: `linear-gradient(90deg, ${line} 25%, rgba(22,163,74,0.06) 50%, ${line} 75%)`,
                backgroundSize: '200% 100%',
                animation: 'damorex-shimmer 1.5s ease-in-out infinite',
              }}
            />
          </Stack>
        </Box>
        <Box style={{ display: 'flex', gap: 12 }}>
          <SkeletonBar width={140} height={40} />
          <SkeletonBar width={120} height={40} />
        </Box>
      </Stack>
    </Container>
  );
}

export function CheckoutLoader() {
  useEffect(() => {
    injectLoaderStyles();
  }, []);

  const steps = ['Cart', 'Delivery', 'Payment', 'Review'];

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl" align="center">
        <Box style={{ display: 'flex', gap: 0, width: '100%', position: 'relative' }}>
          {steps.map((step, i) => (
            <Box
              key={step}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: i === 0 ? green : line,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: i === 0 ? 'damorex-pulse 1.2s ease-in-out infinite' : undefined,
                  transition: 'background 0.3s',
                }}
              >
                <Text size="xs" c={i === 0 ? '#fff' : muted} fw={900}>
                  {i + 1}
                </Text>
              </Box>
              <Text size="xs" c={i === 0 ? green : muted} fw={700}>
                {step}
              </Text>
              {i < steps.length - 1 ? (
                <Box
                  style={{
                    position: 'absolute',
                    top: 16,
                    left: `${(i / (steps.length - 1)) * 100 + 50 / (steps.length - 1)}%`,
                    right: `${100 - ((i + 1) / (steps.length - 1)) * 100 - 50 / (steps.length - 1)}%`,
                    height: 2,
                    background: i === 0 ? `linear-gradient(90deg, ${green}, ${line})` : line,
                  }}
                />
              ) : null}
            </Box>
          ))}
        </Box>
        <Box
          style={{
            width: '100%',
            border: `1px solid ${line}`,
            borderRadius: 20,
            padding: 24,
            background: '#fff',
          }}
        >
          <Stack gap="md">
            {[100, 85, 70, 90, 50].map((w, i) => (
              <Box
                key={i}
                style={{
                  animation: `damorex-skeleton-pulse 1.5s ease-in-out ${i * 0.1}s infinite`,
                }}
              >
                <SkeletonBar width={`${w}%`} height={14} />
              </Box>
            ))}
          </Stack>
        </Box>
        <Box style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'space-between' }}>
          <SkeletonBar width={120} height={44} />
          <SkeletonBar width={160} height={44} />
        </Box>
      </Stack>
    </Container>
  );
}

export function ConsultationLoader() {
  useEffect(() => {
    injectLoaderStyles();
  }, []);

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <GroupWithIcon icon={<CalendarClock size={24} />} />
        <Box
          style={{
            border: `1px solid ${line}`,
            borderRadius: 20,
            padding: 24,
            background: '#fff',
          }}
        >
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {[1, 2, 3, 4].map((i) => (
              <Box
                key={i}
                style={{
                  animation: `damorex-skeleton-pulse 1.5s ease-in-out ${i * 0.1}s infinite`,
                }}
              >
                <SkeletonBar width="70%" height={12} />
                <Box mt={4}>
                  <SkeletonBar width="100%" height={36} radius={8} />
                </Box>
              </Box>
            ))}
          </SimpleGrid>
          <Box
            mt="lg"
            style={{ animation: 'damorex-skeleton-pulse 1.5s ease-in-out 0.4s infinite' }}
          >
            <SkeletonBar width="100%" height={120} radius={12} />
          </Box>
        </Box>
        <SkeletonBar width={180} height={44} />
      </Stack>
    </Container>
  );
}

function GroupWithIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <ThemeIcon radius="xl" size={40} color="green" variant="light">
        {icon}
      </ThemeIcon>
      <SkeletonBar width="40%" height={22} />
    </Box>
  );
}
