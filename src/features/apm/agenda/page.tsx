import { Box, Container, Group, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { SectionHeading, PrimaryButton, GreenBadge } from '../website/components';
import { useAgenda } from '../website/hooks';
import { WebsiteLayout, apmBlue, ink, muted, soft, apmGreen } from '../website/layout';

const iconLUT: Record<string, React.ReactNode> = {
  CircleDollarSign: '💰',
  Building2: '🏗️',
  Wheat: '🌾',
  HeartPulse: '🏥',
  BookOpen: '📚',
  ShieldCheck: '🛡️',
  Cpu: '💻',
};

export default function AgendaPage() {
  const { data, isLoading } = useAgenda();
  const navigate = useNavigate();

  return (
    <WebsiteLayout>
      <Box
        py={80}
        style={{ background: `linear-gradient(135deg, ${soft} 0%, #DBEAFE 30%, #ffffff 100%)` }}
      >
        <Container size="xl">
          <SectionHeading
            title="Oyo Next Agenda"
            subtitle="A bold seven-pillar vision to sustain and accelerate Oyo State's transformation."
          />
        </Container>
      </Box>

      <Box py={80} style={{ background: '#fff' }}>
        <Container size="xl">
          {isLoading ? (
            <Group justify="center">
              <Loader color={apmBlue} />
            </Group>
          ) : !data?.length ? (
            <Text ta="center" style={{ color: muted }}>
              Agenda items coming soon.
            </Text>
          ) : (
            <Stack gap={40}>
              {data.map((item) => (
                <Box
                  key={item.id}
                  style={{
                    padding: 32,
                    borderRadius: 16,
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    transition:
                      'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = 'translateY(-2px)';
                    el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = '';
                    el.style.boxShadow = '';
                  }}
                >
                  <Group align="flex-start" gap="md" style={{ flexWrap: 'nowrap' }}>
                    <Box
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        background: '#DBEAFE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon ? (iconLUT[item.icon] ?? '📋') : '📋'}
                    </Box>
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group gap="xs">
                        <Title
                          order={3}
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: ink,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {item.title}
                        </Title>
                        {item.category && <GreenBadge>{item.category}</GreenBadge>}
                      </Group>
                      <Text style={{ color: muted, lineHeight: 1.8 }}>{item.description}</Text>
                    </Stack>
                  </Group>
                </Box>
              ))}
            </Stack>
          )}

          <Group justify="center" mt={48}>
            <PrimaryButton onClick={() => navigate({ to: '/apm/join' })}>
              Join The Movement
            </PrimaryButton>
          </Group>
        </Container>
      </Box>
    </WebsiteLayout>
  );
}
