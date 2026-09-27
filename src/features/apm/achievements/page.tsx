import { Box, Container, Group, Loader, SimpleGrid, Stack, Text } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import {
  BookOpen,
  Building2,
  CircleDollarSign,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import ibadanAgricImg from '../assets/ibadan_agric_cocoa.jpg';
import ibadanRoadImg from '../assets/ibadan_road.jpg';
import ibadanMarketImg from '../assets/ibbadan_market.jpg';
import keepingPromiseImg from '../assets/keepinng_promise.webp';
import uchImg from '../assets/uch.jpg';
import youthImg from '../assets/youth.avif';
import { SectionHeading, PrimaryButton } from '../website/components';
import { useAchievements } from '../website/hooks';
import { WebsiteLayout, apmBlue, ink, muted, soft } from '../website/layout';

const iconLUT: Record<string, React.ReactNode> = {
  Economy: <CircleDollarSign size={28} />,
  Education: <BookOpen size={28} />,
  Healthcare: <HeartPulse size={28} />,
  Infrastructure: <Building2 size={28} />,
  Security: <ShieldCheck size={28} />,
  Youth: <Sparkles size={28} />,
};

const imageLUT: Record<string, string> = {
  Economy: ibadanMarketImg,
  Education: keepingPromiseImg,
  Healthcare: uchImg,
  Infrastructure: ibadanRoadImg,
  Security: keepingPromiseImg,
  Youth: youthImg,
};

export default function AchievementsPage() {
  const { data, isLoading } = useAchievements();
  const navigate = useNavigate();

  return (
    <WebsiteLayout>
      <Box
        py={80}
        style={{ background: `linear-gradient(135deg, ${soft} 0%, #DBEAFE 30%, #ffffff 100%)` }}
      >
        <Container size="xl">
          <SectionHeading
            title="Our Achievements"
            subtitle="Building on the legacy of the Omituntun transformation — real results across six sectors."
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
              Achievements coming soon.
            </Text>
          ) : (
            <Stack gap={48}>
              {data.map((item) => (
                <Box
                  key={item.id}
                  style={{
                    borderRadius: 16,
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
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
                  <Box style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                    <Box style={{ width: '100%', minWidth: 0 }}>
                      {(() => {
                        const cat = item.category ?? '';
                        const imgSrc = imageLUT[cat];
                        if (
                          !imgSrc ||
                          !['Economy', 'Infrastructure', 'Healthcare', 'Youth'].includes(cat)
                        ) {
                          return null;
                        }
                        return (
                          <Box style={{ height: 220, overflow: 'hidden' }}>
                            <img
                              src={imgSrc}
                              alt={item.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <Box
                              style={{
                                height: '100%',
                                width: '100%',
                                background:
                                  'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)',
                                marginTop: -220,
                                position: 'relative',
                              }}
                            />
                          </Box>
                        );
                      })()}
                    </Box>
                    <Box style={{ padding: 32, minWidth: 0 }}>
                      <Group align="flex-start" gap="md" style={{ marginBottom: 16 }}>
                        <Box style={{ color: apmBlue }}>
                          {item.category ? (
                            (iconLUT[item.category] ?? <Star size={28} />)
                          ) : (
                            <Star size={28} />
                          )}
                        </Box>
                        <Stack gap={4}>
                          <Text
                            size="xs"
                            fw={600}
                            style={{
                              color: apmBlue,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                            }}
                          >
                            {item.category}
                          </Text>
                          <Text
                            fw={700}
                            style={{
                              fontSize: '1.3rem',
                              color: '#1E293B',
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {item.title}
                          </Text>
                        </Stack>
                        {item.statLabel && item.statValue && (
                          <Box
                            style={{
                              marginLeft: 'auto',
                              padding: '12px 24px',
                              borderRadius: 12,
                              background: '#DBEAFE',
                              textAlign: 'center',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                color: apmBlue,
                                lineHeight: 1.2,
                              }}
                            >
                              {item.statValue}
                            </Text>
                            <Text size="xs" style={{ color: apmBlue, fontWeight: 600 }}>
                              {item.statLabel}
                            </Text>
                          </Box>
                        )}
                      </Group>
                      <Text style={{ color: muted, lineHeight: 1.9, fontSize: '1rem' }}>
                        {item.description}
                      </Text>
                    </Box>
                  </Box>
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
