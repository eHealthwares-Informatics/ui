import {
  Anchor,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from '@tanstack/react-router';
import {
  BadgeCheck,
  BookOpen,
  Building2,
  Calendar,
  ChevronRight,
  CircleDollarSign,
  Cpu,
  HeartPulse,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  Wheat,
} from 'lucide-react';
import { useState } from 'react';
import artCultureImg from './assets/art_and_culture.jpg';
import BalaMohammedImg from './assets/Bala-Mohammed-6-2026-05-07-413.avif';
import candidateAlt from './assets/Bimbo-Adekanmbi-alt.webp';
import candidatePortrait from './assets/Bimbo-Adekanmbi.webp';
import campaignEventImg from './assets/campaign_event.jpeg';
import flierImg from './assets/flier.jpg';
import grassrootsImg from './assets/grassroots.webp';
import ibadanCityImg from './assets/ibadan.jpg';
import ibadanAgricImg from './assets/ibadan_agric.jpg';
import ibadanAgricCocoaImg from './assets/ibadan_agric_cocoa.jpg';
import ibadanCocoaHouseImg from './assets/ibadan_cocoa_house.jpg';
import ibadanHouseImg from './assets/ibadan_house.avif';
import ibadanRoadImg from './assets/ibadan_road.jpg';
import ibbadanHouseImg from './assets/ibbadan_house.avif';
import ibbadanMarketImg from './assets/ibbadan_market.jpg';
import candidateGeneric from './assets/images.jpeg';
import keepingPromiseImg from './assets/keepinng_promise.webp';
import logoImg from './assets/logo.webp';
import loyalistsImg from './assets/loyalists.webp';
import makindeEndorsement from './assets/Makinde-declares-Bimbo-Adekanmbi-as-his-preferred-successor-in-Oyo.png';
import makindeImg from './assets/makinde.jpeg';
import photoCultureImg from './assets/photo-1590611870082-61d136a393de.avif';
import photoFutureImg from './assets/photo-1598800423392-35a732218f47.avif';
import photoCommunityImg from './assets/photo-1615027212409-2628cc0cc11a.avif';
import photoEducationImg from './assets/photo-1657356217673-4f7000f768b4.avif';
import photoTechImg from './assets/photo-1668773309553-c9f53621d6db.avif';
import rallyImg from './assets/rally_pdp_apm.jpeg';
import ruralCampaignImg from './assets/rural_campaign.webp';
import uchImg from './assets/uch.jpg';
import villageImg from './assets/village.avif';
import village2Img from './assets/village2.avif';
import screenshotImg from './assets/website_screenshot.png';
import candidateWithLadoja from './assets/with_ladoja.jpg';
import candidateCertificate from './assets/with_makinde_certificate.jpg';
import candidateWithMakinde from './assets/with_seyi_makinde.jpg';
import yorubaImg from './assets/yoruba.avif';
import yorubaChildImg from './assets/yoruba_child_gril.avif';
import yorubaHairImg from './assets/yoruba_hair_culture.avif';
import yorubaCoupleImg from './assets/yorubba_couple.avif';
import youthImg from './assets/youth.avif';
import youth2Img from './assets/youth2.avif';
import {
  SectionHeading,
  PrimaryButton,
  OutlineButton,
  StatCard,
  AchievementCard,
  NewsCard,
  EventCard,
  TestimonialCard,
  GreenBadge,
} from './website/components';
import {
  useHomepage,
  useJoinMovement,
  useSubscribeNewsletter,
  useSubmitContact,
} from './website/hooks';
import { WebsiteLayout, apmBlue, apmGreen, ink, muted, line, soft, accent } from './website/layout';

const iconMap: Record<string, React.ReactNode> = {
  CircleDollarSign: <CircleDollarSign size={24} />,
  Building2: <Building2 size={24} />,
  Wheat: <Wheat size={24} />,
  HeartPulse: <HeartPulse size={24} />,
  BookOpen: <BookOpen size={24} />,
  ShieldCheck: <ShieldCheck size={24} />,
  Cpu: <Cpu size={24} />,
};

const achievementIcons: Record<string, React.ReactNode> = {
  Economy: <CircleDollarSign size={28} />,
  Education: <BookOpen size={28} />,
  Healthcare: <HeartPulse size={28} />,
  Infrastructure: <Building2 size={28} />,
  Security: <ShieldCheck size={28} />,
  Youth: <Sparkles size={28} />,
};

function getInfoValue(infos: Array<{ key: string; value: string }>, key: string): string {
  return infos.find((i) => i.key === key)?.value ?? '';
}

export default function ApmHomepage() {
  const { data, isLoading } = useHomepage();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <WebsiteLayout>
        <Container size="xl" py={120}>
          <Group justify="center">
            <Loader color={apmBlue} size="lg" />
          </Group>
        </Container>
      </WebsiteLayout>
    );
  }

  const { infos, achievements, featuredNews, upcomingEvents, testimonials } = data!;

  const headline = getInfoValue(infos, 'hero_headline');
  const subheadline = getInfoValue(infos, 'hero_subheadline');
  const stat1Label = getInfoValue(infos, 'hero_stat_1_label');
  const stat1Value = getInfoValue(infos, 'hero_stat_1_value');
  const stat2Label = getInfoValue(infos, 'hero_stat_2_label');
  const stat2Value = getInfoValue(infos, 'hero_stat_2_value');
  const stat3Label = getInfoValue(infos, 'hero_stat_3_label');
  const stat3Value = getInfoValue(infos, 'hero_stat_3_value');
  const stat4Label = getInfoValue(infos, 'hero_stat_4_label');
  const stat4Value = getInfoValue(infos, 'hero_stat_4_value');
  const candidateStory = getInfoValue(infos, 'candidate_story');
  const videoUrl = getInfoValue(infos, 'video_url');

  return (
    <WebsiteLayout>
      {/* ── Hero Section ────────────────────────────────────── */}
      <Box
        style={{
          padding: '80px 0 64px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 500,
        }}
      >
        <img
          src={ibadanCityImg}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.25)',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(0,45,90,0.88) 0%, rgba(0,102,204,0.6) 50%, rgba(0,45,90,0.85) 100%)',
          }}
        />
        <Container size="xl" style={{ position: 'relative', zIndex: 1 }}>
          <Grid gap={48} align="center">
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Stack gap="lg">
                <BadgeCheck size={32} color="#fff" style={{ marginBottom: -8, opacity: 0.85 }} />
                <Title
                  order={1}
                  style={{
                    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    lineHeight: 1.15,
                    color: '#fff',
                  }}
                >
                  {headline || 'Building on Progress. Securing Our Future.'}
                </Title>
                <Text
                  size="lg"
                  style={{
                    color: 'rgba(255,255,255,0.8)',
                    lineHeight: 1.8,
                    maxWidth: 560,
                    fontSize: '1.1rem',
                  }}
                >
                  {subheadline ||
                    "Bimbo Adekanmbi — Proven leadership to sustain and advance Oyo State's transformation."}
                </Text>
                <Group gap="sm" mt="sm">
                  <PrimaryButton onClick={() => navigate({ to: '/apm/join' })}>
                    Join The Movement
                  </PrimaryButton>
                  <OutlineButton onClick={() => navigate({ to: '/apm/volunteer' })}>
                    Become a Volunteer
                  </OutlineButton>
                </Group>
                {videoUrl && (
                  <Anchor
                    href={videoUrl}
                    target="_blank"
                    underline="never"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 15,
                      marginTop: 8,
                    }}
                  >
                    <Box
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                      }}
                    >
                      ▶
                    </Box>
                    Watch Our Campaign Video
                  </Anchor>
                )}
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Box style={{ position: 'relative' }}>
                <img
                  src={candidatePortrait}
                  alt="Bimbo Adekanmbi"
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 480,
                    objectFit: 'cover',
                    borderRadius: 16,
                    display: 'block',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  }}
                />
                <Box
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    borderRadius: '0 0 16px 16px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                  }}
                />
              </Box>
              <SimpleGrid cols={4} spacing={0} mt={12}>
                <Box style={{ textAlign: 'center', padding: '8px 4px' }}>
                  <Text
                    style={{ fontSize: '1.2rem', fontWeight: 800, color: apmBlue, lineHeight: 1.2 }}
                  >
                    {stat1Value || '20+'}
                  </Text>
                  <Text size="xs" style={{ color: muted }}>
                    {stat1Label || 'Years of Experience'}
                  </Text>
                </Box>
                <Box style={{ textAlign: 'center', padding: '8px 4px' }}>
                  <Text
                    style={{ fontSize: '1.2rem', fontWeight: 800, color: apmBlue, lineHeight: 1.2 }}
                  >
                    {stat2Value || '33'}
                  </Text>
                  <Text size="xs" style={{ color: muted }}>
                    {stat2Label || 'LGAs Engaged'}
                  </Text>
                </Box>
                <Box style={{ textAlign: 'center', padding: '8px 4px' }}>
                  <Text
                    style={{ fontSize: '1.2rem', fontWeight: 800, color: apmBlue, lineHeight: 1.2 }}
                  >
                    {stat3Value || '351'}
                  </Text>
                  <Text size="xs" style={{ color: muted }}>
                    {stat3Label || 'Wards Mobilized'}
                  </Text>
                </Box>
                <Box style={{ textAlign: 'center', padding: '8px 4px' }}>
                  <Text
                    style={{ fontSize: '1.2rem', fontWeight: 800, color: apmBlue, lineHeight: 1.2 }}
                  >
                    {stat4Value || '600+'}
                  </Text>
                  <Text size="xs" style={{ color: muted }}>
                    {stat4Label || 'Communities Reached'}
                  </Text>
                </Box>
              </SimpleGrid>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* ── Campaign Image Ribbon ────────────────────────────── */}
      <Box style={{ marginTop: -40, position: 'relative', zIndex: 2 }}>
        <Container size="xl">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={16}>
            <Box
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                height: 180,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}
            >
              <img
                src={rallyImg}
                alt="APM Campaign Rally"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
            <Box
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                height: 180,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}
            >
              <img
                src={campaignEventImg}
                alt="Campaign Event"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
            <Box
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                height: 180,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}
              visibleFrom="sm"
            >
              <img
                src={grassrootsImg}
                alt="Grassroots Engagement"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* ── Achievements ────────────────────────────────────── */}
      <Box py={80} style={{ background: '#fff' }}>
        <Container size="xl">
          <SectionHeading
            title="Delivering on Our Promises"
            subtitle="Building on the legacy of the Omituntun transformation — here is what has been achieved for the people of Oyo State."
          />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={24}>
            {(() => {
              const imgMap: Record<string, string> = {
                Economy: ibadanAgricCocoaImg,
                Education: ibbadanMarketImg,
                Healthcare: uchImg,
                Infrastructure: ibadanRoadImg,
                Security: loyalistsImg,
                Youth: youthImg,
              };
              return achievements.map((a) => (
                <Box
                  key={a.id}
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid #E2E8F0',
                    background: '#fff',
                    transition:
                      'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      '0 12px 32px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = '';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                  }}
                >
                  {imgMap[a.category] && (
                    <Box style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
                      <img
                        src={imgMap[a.category]}
                        alt={a.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <Box
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background:
                            'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)',
                        }}
                      />
                    </Box>
                  )}
                  <Box p="lg">
                    <Text
                      size="xs"
                      fw={600}
                      style={{
                        color: apmBlue,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: 8,
                      }}
                    >
                      {a.category}
                    </Text>
                    <Text
                      fw={700}
                      style={{ fontSize: '1.05rem', color: ink, lineHeight: 1.4, marginBottom: 8 }}
                    >
                      {a.title}
                    </Text>
                    <Text size="sm" style={{ color: muted, lineHeight: 1.7, marginBottom: 12 }}>
                      {a.summary}
                    </Text>
                    {a.statLabel && a.statValue && (
                      <Group gap={8}>
                        <Text style={{ fontSize: '1.3rem', fontWeight: 800, color: apmBlue }}>
                          {a.statValue}
                        </Text>
                        <Text size="xs" style={{ color: muted, fontWeight: 600 }}>
                          {a.statLabel}
                        </Text>
                      </Group>
                    )}
                  </Box>
                </Box>
              ));
            })()}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ── Oyo Next Agenda ─────────────────────────────────── */}
      <Box py={80} style={{ background: soft }}>
        <Container size="xl">
          <SectionHeading
            title="Oyo Next Agenda"
            subtitle="A bold vision to sustain and advance the transformation of Oyo State across seven strategic pillars."
          />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={24}>
            {data?.infos ? <AgendaSection /> : null}
          </SimpleGrid>
          <Group justify="center" mt={40}>
            <PrimaryButton onClick={() => navigate({ to: '/apm/agenda' })}>
              View Full Agenda <ChevronRight size={18} style={{ marginLeft: 4 }} />
            </PrimaryButton>
          </Group>
        </Container>
      </Box>

      {/* ── Candidate Story ─────────────────────────────────── */}
      <Box py={80} style={{ background: '#fff' }}>
        <Container size="xl">
          <Grid gap={48} align="center">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Box
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  minHeight: 380,
                  position: 'relative',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                }}
              >
                <img
                  src={candidateWithMakinde}
                  alt="Bimbo Adekanmbi with Governor Seyi Makinde"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    minHeight: 380,
                  }}
                />
                <Box
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(135deg, rgba(0,102,204,0.85) 0%, rgba(0,45,90,0.9) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: 48,
                    color: '#fff',
                  }}
                >
                  <BadgeCheck size={40} style={{ marginBottom: 20, opacity: 0.9 }} />
                  <Text
                    fw={700}
                    size="sm"
                    style={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      opacity: 0.7,
                      marginBottom: 12,
                    }}
                  >
                    Our Candidate
                  </Text>
                  <Title
                    order={2}
                    style={{
                      color: '#fff',
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.3,
                      marginBottom: 16,
                    }}
                  >
                    Bimbo Adekanmbi
                  </Title>
                  <Text style={{ lineHeight: 1.8, opacity: 0.9 }}>
                    Your Choice for Continuous Transformation
                  </Text>
                </Box>
              </Box>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="md">
                <Text size="lg" style={{ lineHeight: 1.9, color: ink }}>
                  {candidateStory || ''}
                </Text>
                <Group gap="sm">
                  <PrimaryButton onClick={() => navigate({ to: '/apm/meet' })}>
                    Meet Bimbo Adekanmbi
                  </PrimaryButton>
                  <OutlineButton onClick={() => navigate({ to: '/apm/agenda' })}>
                    Read the Agenda
                  </OutlineButton>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* ── Latest News ─────────────────────────────────────── */}
      <Box py={80} style={{ background: soft }}>
        <Container size="xl">
          <SectionHeading
            title="Latest News"
            subtitle="Stay informed about campaign updates, policy announcements, and community engagement."
          />
          {featuredNews.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 2 }} spacing={24}>
              {featuredNews.map((article) => (
                <NewsCard
                  key={article.id}
                  title={article.title}
                  excerpt={article.excerpt ?? ''}
                  category={article.category ?? 'News'}
                  publishedAt={article.publishedAt}
                  authorName={article.authorName ?? ''}
                  slug={article.slug}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Text ta="center" style={{ color: muted }}>
              No news articles yet. Check back soon.
            </Text>
          )}
          <Group justify="center" mt={40}>
            <PrimaryButton onClick={() => navigate({ to: '/apm/news' })}>
              View All News <ChevronRight size={18} style={{ marginLeft: 4 }} />
            </PrimaryButton>
          </Group>
        </Container>
      </Box>

      {/* ── Upcoming Events ─────────────────────────────────── */}
      <Box py={80} style={{ background: '#fff' }}>
        <Container size="xl">
          <SectionHeading
            title="Upcoming Events"
            subtitle="Join us at our town halls, stakeholder meetings, and community engagements across Oyo State."
          />
          {upcomingEvents.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={24}>
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  description={event.description ?? ''}
                  location={event.location ?? ''}
                  eventDate={event.eventDate}
                  eventTime={event.eventTime ?? ''}
                  category={event.category ?? 'Event'}
                  onClick={() => navigate({ to: `/apm/events/${event.id}` })}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Text ta="center" style={{ color: muted }}>
              No upcoming events at this time. Join our newsletter to stay informed.
            </Text>
          )}
          <Group justify="center" mt={40}>
            <PrimaryButton onClick={() => navigate({ to: '/apm/events' })}>
              View All Events <Calendar size={18} style={{ marginLeft: 4 }} />
            </PrimaryButton>
          </Group>
        </Container>
      </Box>

      {/* ── Volunteer CTA ───────────────────────────────────── */}
      <Box
        py={80}
        style={{
          position: 'relative',
          overflow: 'hidden',
          color: '#fff',
        }}
      >
        <img
          src={grassrootsImg}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.35)',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(0,102,204,0.7) 0%, rgba(0,45,90,0.8) 100%)',
          }}
        />
        <Container size="xl" style={{ position: 'relative', zIndex: 1 }}>
          <Stack
            align="center"
            gap="lg"
            style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}
          >
            <UsersRound size={40} style={{ opacity: 0.9 }} />
            <Title
              order={2}
              style={{
                color: '#fff',
                fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
              }}
            >
              Join Our Campaign Team
            </Title>
            <Text size="lg" style={{ opacity: 0.85, lineHeight: 1.8 }}>
              The success of this movement depends on people like you. Register as a volunteer and
              help us build a better Oyo State — ward by ward, community by community.
            </Text>
            <Group gap="sm" mt="sm">
              <Button
                size="lg"
                variant="white"
                styles={{
                  root: {
                    color: apmBlue,
                    fontWeight: 700,
                    transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
                    '&:hover': { transform: 'translateY(-2px)' },
                  },
                }}
                onClick={() => navigate({ to: '/apm/volunteer' })}
              >
                Become a Volunteer
              </Button>
              <Button
                size="lg"
                variant="outline"
                styles={{
                  root: {
                    borderColor: 'rgba(255,255,255,0.4)',
                    color: '#fff',
                    fontWeight: 600,
                    transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  },
                }}
                component="a"
                href="#"
              >
                <MessageCircle size={18} style={{ marginRight: 6 }} />
                Join WhatsApp Community
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* ── Citizens Speak ──────────────────────────────────── */}
      <Box py={80} style={{ background: soft }}>
        <Container size="xl">
          <Grid gap={48}>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Stack gap="md">
                <MessageSquare size={32} color={apmBlue} />
                <Title
                  order={2}
                  style={{
                    fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: ink,
                  }}
                >
                  Citizens Speak
                </Title>
                <Text size="md" style={{ color: muted, lineHeight: 1.8 }}>
                  Share your thoughts, concerns, and aspirations for Oyo State. Your voice matters —
                  and we are listening.
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 7 }}>
              <CitizensSpeakForm />
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* ── Testimonials ────────────────────────────────────── */}
      <Box py={80} style={{ background: '#fff' }}>
        <Container size="xl">
          <SectionHeading
            title="What People Are Saying"
            subtitle="Voices from across Oyo State — community leaders, youth, market women, and professionals."
          />
          {testimonials.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={24}>
              {testimonials.map((t) => (
                <TestimonialCard
                  key={t.id}
                  name={t.name}
                  text={t.text}
                  focus={t.focus ?? ''}
                  isVerified={t.isVerified}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Text ta="center" style={{ color: muted }}>
              Testimonials coming soon.
            </Text>
          )}
        </Container>
      </Box>

      {/* ── Culture & Heritage ──────────────────────────────── */}
      <Box py={80} style={{ background: '#fff' }}>
        <Container size="xl">
          <SectionHeading
            title="Our Culture, Our Pride"
            subtitle="Celebrating the rich Yoruba heritage and the vibrant communities that make Oyo State great."
          />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={16}>
            {[
              { img: yorubaImg, label: 'Yoruba Heritage' },
              { img: yorubaHairImg, label: 'Rich Traditions' },
              { img: yorubaCoupleImg, label: 'Family Values' },
              { img: ibbadanMarketImg, label: 'Commerce & Enterprise' },
            ].map((item, i) => (
              <Box
                key={i}
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  height: 240,
                  position: 'relative',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                }}
              >
                <img
                  src={item.img}
                  alt={item.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <Box
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '16px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                  }}
                >
                  <Text fw={600} size="sm" style={{ color: '#fff' }}>
                    {item.label}
                  </Text>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ── Media Gallery ───────────────────────────────────── */}
      <Box py={80} style={{ background: soft }}>
        <Container size="xl">
          <SectionHeading
            title="Media Gallery"
            subtitle="Watch campaign videos, interviews, and highlights from our movement across Oyo State."
          />
          <MediaGallery />
          <Group justify="center" mt={40}>
            <PrimaryButton onClick={() => navigate({ to: '/apm/media' })}>
              View Full Gallery <ChevronRight size={18} style={{ marginLeft: 4 }} />
            </PrimaryButton>
          </Group>
        </Container>
      </Box>

      {/* ── The Future ───────────────────────────────────────── */}
      <Box py={80} style={{ background: '#fff' }}>
        <Container size="xl">
          <SectionHeading
            title="Securing Our Future"
            subtitle="Investing in our youth, education, and human capital — because the future of Oyo State is the children of today."
          />
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={20}>
            <Box
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                height: 280,
                position: 'relative',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}
            >
              <img
                src={yorubaChildImg}
                alt="Future generations"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <Box
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 20,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                }}
              >
                <Text fw={700} style={{ color: '#fff', fontSize: '1rem' }}>
                  Quality Education
                </Text>
                <Text size="xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Free education from primary to secondary school
                </Text>
              </Box>
            </Box>
            <Box
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                height: 280,
                position: 'relative',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}
            >
              <img
                src={youth2Img}
                alt="Youth empowerment"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <Box
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 20,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                }}
              >
                <Text fw={700} style={{ color: '#fff', fontSize: '1rem' }}>
                  Youth Empowerment
                </Text>
                <Text size="xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Skills, jobs, and entrepreneurship for young people
                </Text>
              </Box>
            </Box>
            <Box
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                height: 280,
                position: 'relative',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}
            >
              <img
                src={photoCommunityImg}
                alt="Community development"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <Box
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 20,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                }}
              >
                <Text fw={700} style={{ color: '#fff', fontSize: '1rem' }}>
                  Community Development
                </Text>
                <Text size="xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Building stronger wards and LGAs across Oyo State
                </Text>
              </Box>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* ── Join The Movement ───────────────────────────────── */}
      <Box
        py={80}
        style={{
          position: 'relative',
          overflow: 'hidden',
          color: '#fff',
        }}
      >
        <img
          src={rallyImg}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.3)',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(30,41,59,0.85) 0%, rgba(15,26,46,0.9) 100%)',
          }}
        />
        <Container size="xl" style={{ position: 'relative', zIndex: 1 }}>
          <Stack align="center" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
            <Title
              order={2}
              style={{
                color: '#fff',
                fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginBottom: 8,
              }}
            >
              Join The Movement
            </Title>
            <Text size="lg" style={{ opacity: 0.8, lineHeight: 1.8, marginBottom: 32 }}>
              Be part of the continuity movement. Sign up to receive updates, volunteer, and help us
              build a better Oyo State.
            </Text>
            <JoinMovementForm />
          </Stack>
        </Container>
      </Box>

      {/* ── Newsletter ──────────────────────────────────────── */}
      <Box py={60} style={{ background: soft }}>
        <Container size="xl">
          <Grid align="center" gap={32}>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Group gap="sm">
                <Send size={24} color={apmBlue} />
                <Box>
                  <Text fw={700} style={{ fontSize: '1.1rem', color: ink }}>
                    Stay Informed
                  </Text>
                  <Text size="sm" style={{ color: muted }}>
                    Get the latest campaign news and event updates delivered to your inbox.
                  </Text>
                </Box>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NewsletterForm />
            </Grid.Col>
          </Grid>
        </Container>
      </Box>
    </WebsiteLayout>
  );
}

function AgendaSection() {
  const { data } = useHomepage();
  if (!data?.infos) {
    return null;
  }

  const categories = [
    'Economy',
    'Infrastructure',
    'Agriculture',
    'Healthcare',
    'Education',
    'Security',
  ];
  const agendaItems = categories.map((cat) => ({
    title: getInfoValue(data.infos, `agenda_${cat.toLowerCase()}`) || cat,
    summary: '',
    icon: iconMap[cat] ?? <Star size={24} />,
    category: cat,
  }));

  return (
    <>
      {agendaItems.map((item) => (
        <Box
          key={item.category}
          style={{
            padding: 24,
            borderRadius: 12,
            background: '#fff',
            border: '1px solid #E2E8F0',
            transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = '';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '';
          }}
        >
          <Group gap="sm">
            <Box style={{ color: apmBlue }}>{item.icon}</Box>
            <Text fw={600} style={{ color: ink, fontSize: '1rem' }}>
              {item.category}
            </Text>
          </Group>
        </Box>
      ))}
    </>
  );
}

function CitizensSpeakForm() {
  const { mutate, isPending } = useSubmitContact();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message) {
      return;
    }
    mutate(
      { name, email, subject: 'Citizen Feedback', message },
      {
        onSuccess: () => {
          setName('');
          setEmail('');
          setMessage('');
        },
      }
    );
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack gap="md">
        <Grid gap="md">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Your Name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              styles={{ input: { borderColor: line }, label: { color: ink, fontWeight: 500 } }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              styles={{ input: { borderColor: line }, label: { color: ink, fontWeight: 500 } }}
            />
          </Grid.Col>
        </Grid>
        <Textarea
          label="Your Message"
          placeholder="Share your thoughts, concerns, or aspirations for Oyo State..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minRows={3}
          styles={{ input: { borderColor: line }, label: { color: ink, fontWeight: 500 } }}
        />
        <Group>
          <PrimaryButton onClick={handleSubmit}>
            {isPending ? 'Sending...' : 'Submit Feedback'}
          </PrimaryButton>
        </Group>
      </Stack>
    </Box>
  );
}

function JoinMovementForm() {
  const { mutate, isPending } = useJoinMovement();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [lga, setLga] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      return;
    }
    mutate(
      { name, phone, lga: lga || undefined },
      {
        onSuccess: () => {
          setName('');
          setPhone('');
          setLga('');
        },
      }
    );
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      style={{
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 32,
        width: '100%',
        maxWidth: 480,
      }}
    >
      <Stack gap="md">
        <TextInput
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          styles={{
            input: {
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              '&::placeholder': { color: 'rgba(255,255,255,0.5)' },
            },
          }}
        />
        <TextInput
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          styles={{
            input: {
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              '&::placeholder': { color: 'rgba(255,255,255,0.5)' },
            },
          }}
        />
        <TextInput
          placeholder="Local Government Area (optional)"
          value={lga}
          onChange={(e) => setLga(e.target.value)}
          styles={{
            input: {
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              '&::placeholder': { color: 'rgba(255,255,255,0.5)' },
            },
          }}
        />
        <Button
          type="submit"
          fullWidth
          loading={isPending}
          styles={{
            root: {
              background: '#fff',
              color: apmBlue,
              fontWeight: 700,
              fontSize: '1rem',
              height: 48,
              transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
              '&:hover': { transform: 'translateY(-2px)', background: '#F0F4FF' },
            },
          }}
        >
          Join The Movement
        </Button>
      </Stack>
    </Box>
  );
}

function NewsletterForm() {
  const { mutate, isPending } = useSubscribeNewsletter();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      return;
    }
    mutate({ email }, { onSuccess: () => setEmail('') });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Group gap="xs" style={{ flexWrap: 'nowrap' }}>
        <TextInput
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          style={{ flex: 1 }}
          styles={{ input: { borderColor: line } }}
        />
        <Button
          type="submit"
          loading={isPending}
          styles={{
            root: {
              background: apmBlue,
              fontWeight: 700,
              transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
              '&:hover': { background: '#0052A3', transform: 'translateY(-1px)' },
            },
          }}
        >
          Subscribe
        </Button>
      </Group>
    </Box>
  );
}

function MediaGallery() {
  const videoData = [
    { title: 'Campaign Video', url: 'https://www.youtube.com/watch?v=NGexChoo52g' },
    { title: 'Adekanmbi Interview', url: 'https://www.youtube.com/watch?v=CQeRLccE4Qg' },
    { title: 'Campaign News', url: 'https://www.youtube.com/watch?v=bkVvB-x2ZYE' },
  ];

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={24}>
      {videoData.map((video) => (
        <Anchor
          key={video.url}
          href={video.url}
          target="_blank"
          underline="never"
          style={{ textDecoration: 'none' }}
        >
          <Box
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              background: apmBlue,
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = '';
            }}
          >
            <Box
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 20,
              }}
            >
              ▶
            </Box>
          </Box>
          <Text ta="center" size="sm" fw={600} mt="sm" style={{ color: ink }}>
            {video.title}
          </Text>
        </Anchor>
      ))}
    </SimpleGrid>
  );
}
