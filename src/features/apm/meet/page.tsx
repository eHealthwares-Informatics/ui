import { Box, Container, Grid, Group, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { BadgeCheck } from 'lucide-react';
import candidatePortrait from '../assets/Bimbo-Adekanmbi.webp';
import endorsementsImg from '../assets/Makinde-declares-Bimbo-Adekanmbi-as-his-preferred-successor-in-Oyo.png';
import candidateWithLadoja from '../assets/with_ladoja.jpg';
import candidateWithMakinde from '../assets/with_seyi_makinde.jpg';
import { SectionHeading, PrimaryButton, OutlineButton } from '../website/components';
import { WebsiteLayout, apmBlue, ink, muted, soft } from '../website/layout';

export default function MeetAdekanmbiPage() {
  const navigate = useNavigate();

  return (
    <WebsiteLayout>
      <Box
        py={80}
        style={{ background: `linear-gradient(135deg, ${soft} 0%, #DBEAFE 30%, #ffffff 100%)` }}
      >
        <Container size="xl">
          <SectionHeading
            title="Meet Bimbo Adekanmbi"
            subtitle="The man behind the movement — competence, integrity, and a lifetime of service to Oyo State."
          />
        </Container>
      </Box>
      <Box py={80} style={{ background: '#fff' }}>
        <Container size="xl">
          <Grid gap={48} align="center">
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Box
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  position: 'relative',
                  minHeight: 480,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                }}
              >
                <img
                  src={candidatePortrait}
                  alt="Bimbo Adekanmbi"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    minHeight: 480,
                  }}
                />
                <Box
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '40px 32px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                    color: '#fff',
                  }}
                >
                  <Title
                    order={2}
                    style={{
                      color: '#fff',
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.3,
                      marginBottom: 8,
                    }}
                  >
                    Bimbo Adekanmbi
                  </Title>
                  <Text size="sm" style={{ opacity: 0.8, marginBottom: 16 }}>
                    Your Choice for Continuous Transformation
                  </Text>
                  <PrimaryButton onClick={() => navigate({ to: '/apm/join' })}>
                    Join The Movement
                  </PrimaryButton>
                </Box>
              </Box>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Stack gap="lg">
                <Text size="lg" style={{ color: ink, lineHeight: 1.9 }}>
                  Bimbo Adekanmbi is a seasoned financial executive, technocrat, and grassroots
                  leader with over two decades of experience in public and private sector
                  transformation.
                </Text>
                <Text style={{ color: muted, lineHeight: 1.9 }}>
                  As Governor Seyi Makinde's preferred successor, he represents continuity,
                  competence, and a relentless commitment to Oyo State's progress. His journey from
                  financial management to community mobilization has equipped him with the
                  discipline, vision, and heart to lead Oyo State into its next chapter of growth.
                </Text>
              </Stack>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* Interview video */}
      <Box py={80} style={{ background: '#fff' }}>
        <Container size="md">
          <SectionHeading
            title="In Conversation"
            subtitle="Hear directly from Bimbo Adekanmbi on his vision, values, and plans for Oyo State."
          />
          <Box
            style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
            }}
          >
            <iframe
              src="https://www.youtube.com/embed/CQeRLccE4Qg"
              title="Bimbo Adekanmbi in Conversation"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
          </Box>
        </Container>
      </Box>

      {/* Stakeholder engagement gallery */}
      <Box py={80} style={{ background: soft }}>
        <Container size="xl">
          <SectionHeading
            title="Stakeholder Engagement"
            subtitle="Building bridges with traditional institutions, community leaders, and political stakeholders across Oyo State."
          />
          <Grid gap={24}>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Box
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = '';
                }}
              >
                <img
                  src={candidateWithMakinde}
                  alt="With Governor Makinde"
                  style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }}
                />
                <Box p="md">
                  <Text fw={600} size="sm" style={{ color: ink }}>
                    Endorsed by Governor Seyi Makinde
                  </Text>
                </Box>
              </Box>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Box
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = '';
                }}
              >
                <img
                  src={candidateWithLadoja}
                  alt="With stakeholders"
                  style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }}
                />
                <Box p="md">
                  <Text fw={600} size="sm" style={{ color: ink }}>
                    Traditional Institution Engagement
                  </Text>
                </Box>
              </Box>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Box
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = '';
                }}
              >
                <img
                  src={endorsementsImg}
                  alt="Makinde declares Adekanmbi as preferred successor"
                  style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }}
                />
                <Box p="md">
                  <Text fw={600} size="sm" style={{ color: ink }}>
                    Official Endorsement Declaration
                  </Text>
                </Box>
              </Box>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      <Box py={80} style={{ background: '#fff' }}>
        <Container size="md">
          <Stack gap="lg">
            <Title
              order={2}
              style={{ fontSize: '1.5rem', fontWeight: 800, color: ink, letterSpacing: '-0.03em' }}
            >
              Professional Background
            </Title>
            <Text style={{ color: muted, lineHeight: 1.9 }}>
              Throughout his career, Adekanmbi has demonstrated an unwavering commitment to fiscal
              responsibility, strategic planning, and people-centered governance. His deep
              understanding of both the public and private sectors makes him uniquely qualified to
              sustain and advance the transformation agenda of the Makinde administration.
            </Text>
            <Text style={{ color: muted, lineHeight: 1.9 }}>
              His experience spans financial management, public sector reform, community
              development, and grassroots political mobilization. These competencies, combined with
              his calm leadership style and respect for traditional institutions, position him as
              the best candidate to continue the Omituntun transformation of Oyo State.
            </Text>
          </Stack>
        </Container>
      </Box>
    </WebsiteLayout>
  );
}
