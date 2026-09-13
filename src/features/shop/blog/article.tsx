import {
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Image,
  Paper,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  Calendar,
  ChevronRight,
  Clock3,
  Link2,
  MessageCircle,
  Share2,
  Smartphone,
  Star,
  User,
  BookOpen,
} from 'lucide-react';
import { useMemo } from 'react';
import { SectionHeading } from '../website/components';
import { useArticleBySlug } from '../website/hooks';
import { WebsiteLayout, green, ink, muted, line, soft } from '../website/layout';

const PLACEHOLDER_IMG = 'https://placehold.co/1200x500/16A34A/white?text=Article';

function ArticleSkeleton() {
  return (
    <Container size="md" py={{ base: 28, md: 48 }}>
      <Stack gap="xl">
        <Skeleton h={400} radius={24} />
        <Skeleton h={40} w="70%" />
        <Skeleton h={20} w="40%" />
        <Skeleton h={200} radius={24} />
        <Skeleton h={14} w="100%" />
        <Skeleton h={14} w="100%" />
        <Skeleton h={14} w="80%" />
        <Skeleton h={14} w="100%" />
        <Skeleton h={14} w="60%" />
      </Stack>
    </Container>
  );
}

function ShareButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Tooltip label={label}>
      <Box
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: soft,
          border: `1px solid ${line}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1), background 220ms ease',
        }}
        onClick={() => console.log(`Share via ${label}`)}
        className="lift-card"
      >
        {icon}
      </Box>
    </Tooltip>
  );
}

export default function ArticlePage() {
  const { slug } = useParams({ from: '/shop/blog/$slug' });
  const navigate = useNavigate();
  const { data, isLoading, isError } = useArticleBySlug(slug);

  const article = data?.article;
  const related = data?.related || [];

  const headings = useMemo(() => {
    if (!article?.content) {return [];}
    const regex = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
    const results: { level: number; text: string; id: string }[] = [];
    let match;
    while ((match = regex.exec(article.content)) !== null) {
      const text = match[2].replace(/<[^>]+>/g, '');
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      results.push({ level: Number(match[1]), text, id });
    }
    return results;
  }, [article?.content]);

  const styledContent = useMemo(() => {
    if (!article?.content) {return '';}
    let html = article.content;
    headings.forEach((h) => {
      const regex = new RegExp(
        `<h${h.level}[^>]*>${h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h${h.level}>`
      );
      html = html.replace(regex, `<h${h.level} id="${h.id}">${h.text}</h${h.level}>`);
    });
    html = html.replace(/<p>/g, '<p style="margin-bottom:1.2em;line-height:1.9;color:#64748B;">');
    html = html.replace(
      /<h2/g,
      '<h2 style="font-size:1.5rem;font-weight:900;margin-top:2rem;margin-bottom:0.75rem;color:#0F172A;letter-spacing:-0.02em;"'
    );
    html = html.replace(
      /<h3/g,
      '<h3 style="font-size:1.15rem;font-weight:900;margin-top:1.5rem;margin-bottom:0.5rem;color:#0F172A;"'
    );
    html = html.replace(
      /<ul>/g,
      '<ul style="padding-left:1.5rem;margin-bottom:1.2em;color:#64748B;line-height:1.9;">'
    );
    html = html.replace(
      /<ol>/g,
      '<ol style="padding-left:1.5rem;margin-bottom:1.2em;color:#64748B;line-height:1.9;">'
    );
    html = html.replace(/<li>/g, '<li style="margin-bottom:0.4em;">');
    html = html.replace(
      /<blockquote>/g,
      '<blockquote style="border-left:4px solid #16A34A;padding:1rem 1.5rem;margin:1.5rem 0;background:#F7FBF9;border-radius:12px;color:#0F172A;font-style:italic;">'
    );
    return html;
  }, [article?.content, headings]);

  if (isLoading) {
    return (
      <WebsiteLayout>
        <ArticleSkeleton />
      </WebsiteLayout>
    );
  }

  if (isError || !article) {
    return (
      <WebsiteLayout>
        <Container size="md" py={{ base: 28, md: 48 }}>
          <Paper radius={24} p="xl" withBorder style={{ borderColor: line, textAlign: 'center' }}>
            <Stack gap="md" align="center">
              <BookOpen size={48} color={muted} />
              <Title order={3} c={ink}>
                Article Not Found
              </Title>
              <Text c={muted} maw={480}>
                The article you're looking for doesn't exist or has been removed.
              </Text>
              <Button radius="xl" color="green" onClick={() => navigate({ to: '/shop/blog' })}>
                Back to Blog
              </Button>
            </Stack>
          </Paper>
        </Container>
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <Box
        style={{
          position: 'relative',
          height: 480,
          overflow: 'hidden',
        }}
      >
        <Box
          style={{
            height: '100%',
            position: 'relative',
          }}
        >
          <Image
            src={article.imageUrl || PLACEHOLDER_IMG}
            alt={article.title}
            h={480}
            fit="cover"
            style={{ width: '100%' }}
          />
        </Box>
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.1) 100%)',
          }}
        />
        <Container
          size="md"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '0 16px 48px',
            margin: '0 auto',
          }}
        >
          <Stack gap="sm" style={{ color: '#fff' }}>
            <Badge
              size="lg"
              radius="xl"
              style={{
                background: 'rgba(22, 163, 74, 0.9)',
                color: '#fff',
                width: 'fit-content',
                backdropFilter: 'blur(4px)',
              }}
            >
              Health Education
            </Badge>
            <Title
              order={1}
              style={{
                fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                maxWidth: 720,
              }}
            >
              {article.title}
            </Title>
            <Group gap="md" wrap="wrap">
              {article.authorName ? (
                <Group gap={6}>
                  <User size={14} />
                  <Text size="sm" fw={700}>
                    {article.authorName}
                  </Text>
                </Group>
              ) : null}
              {article.readingTime ? (
                <Group gap={6}>
                  <Clock3 size={14} />
                  <Text size="sm">{article.readingTime} min read</Text>
                </Group>
              ) : null}
              {article.publishedAt ? (
                <Group gap={6}>
                  <Calendar size={14} />
                  <Text size="sm">
                    {new Date(article.publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </Group>
              ) : null}
            </Group>
          </Stack>
        </Container>
      </Box>

      <Container size="md" py={{ base: 28, md: 48 }}>
        <Grid>
          {headings.length > 0 ? (
            <Grid.Col span={{ base: 12, md: 3 }} visibleFrom="md">
              <Box
                style={{
                  position: 'sticky',
                  top: 100,
                  alignSelf: 'start',
                }}
              >
                <Text fw={900} size="sm" c={ink} mb="sm" tt="uppercase" lts={1.2}>
                  On this page
                </Text>
                <Stack gap={4}>
                  {headings.map((h) => (
                    <Anchor
                      key={h.id}
                      href={`#${h.id}`}
                      size="sm"
                      c={muted}
                      fw={h.level === 2 ? 700 : 400}
                      underline="never"
                      style={{
                        paddingLeft: h.level === 3 ? 16 : 0,
                        cursor: 'pointer',
                        transition: 'color 220ms ease',
                      }}
                      className="damorex-link"
                    >
                      {h.text}
                    </Anchor>
                  ))}
                </Stack>
              </Box>
            </Grid.Col>
          ) : null}

          <Grid.Col span={{ base: 12, md: headings.length > 0 ? 9 : 12 }}>
            <Stack gap="xl">
              <Paper
                radius={24}
                p={{ base: 'md', md: 'xl' }}
                withBorder
                style={{ borderColor: line, background: '#fff' }}
              >
                <Box
                  dangerouslySetInnerHTML={{ __html: styledContent }}
                  style={{
                    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
                  }}
                />
              </Paper>

              {article.authorName ? (
                <Paper
                  radius={24}
                  p="lg"
                  withBorder
                  style={{ borderColor: line, background: soft }}
                >
                  <Group gap="md" wrap="nowrap" align="start">
                    <Box
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: green,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {article.authorName.charAt(0).toUpperCase()}
                    </Box>
                    <Box>
                      <Text fw={900} c={ink}>
                        {article.authorName}
                      </Text>
                      <Text size="sm" c={muted} lh={1.7}>
                        {article.authorName} is a licensed pharmacist and health educator at
                        Damorex, dedicated to providing accurate, practical health information to
                        the community.
                      </Text>
                    </Box>
                  </Group>
                </Paper>
              ) : null}

              <Group gap="sm" justify="space-between" wrap="wrap">
                <Group gap="xs">
                  <Text size="sm" fw={700} c={muted}>
                    Share this article:
                  </Text>
                  <Group gap={6}>
                    <ShareButton
                      icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                        </svg>
                      }
                      label="Facebook"
                    />
                    <ShareButton
                      icon={
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#1DA1F2"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                        </svg>
                      }
                      label="Twitter"
                    />
                    <ShareButton
                      icon={<MessageCircle size={16} color="#25D366" />}
                      label="WhatsApp"
                    />
                    <ShareButton icon={<Link2 size={16} color={muted} />} label="Copy Link" />
                  </Group>
                </Group>
                <Button
                  radius="xl"
                  variant="light"
                  color="green"
                  leftSection={<Share2 size={16} />}
                >
                  Share
                </Button>
              </Group>

              <Divider color={line} />
            </Stack>
          </Grid.Col>
        </Grid>

        {related.filter((r) => r.id !== article.id).length > 0 ? (
          <Box mt={48}>
            <SectionHeading eyebrow="Related Articles" title="More articles you might like" />
            <Grid mt="md">
              {related
                .filter((r) => r.id !== article.id)
                .slice(0, 3)
                .map((r) => (
                  <Grid.Col key={r.id} span={{ base: 12, sm: 6, md: 4 }}>
                    <Paper
                      className="lift-card"
                      radius={24}
                      withBorder
                      style={{
                        borderColor: line,
                        cursor: 'pointer',
                        height: '100%',
                        overflow: 'hidden',
                        background: '#fff',
                      }}
                      onClick={() => navigate({ to: `/shop/blog/${r.slug}` })}
                    >
                      <Image
                        src={r.imageUrl || PLACEHOLDER_IMG}
                        alt={r.title}
                        h={160}
                        fit="cover"
                      />
                      <Stack p="lg" gap="sm">
                        <Text fw={900} lh={1.3} c={ink}>
                          {r.title}
                        </Text>
                        {r.excerpt ? (
                          <Text
                            size="sm"
                            c={muted}
                            lh={1.7}
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {r.excerpt}
                          </Text>
                        ) : null}
                        <Group gap={4}>
                          <Text size="sm" c={green} fw={800}>
                            Read Article
                          </Text>
                          <ChevronRight size={14} color={green} />
                        </Group>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                ))}
            </Grid>
          </Box>
        ) : null}

        <Container size="md" py={{ base: 48, md: 64 }}>
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
                    styles={{
                      root: {
                        transition:
                          'transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease, background-color 220ms ease',
                      },
                    }}
                    style={{ background: green, alignSelf: 'flex-start' }}
                  >
                    Subscribe
                  </Button>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        </Container>
      </Container>
    </WebsiteLayout>
  );
}
