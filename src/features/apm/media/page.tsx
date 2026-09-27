import { Anchor, Box, Container, Group, Loader, SimpleGrid, Stack, Text } from '@mantine/core';
import { SectionHeading } from '../website/components';
import { useMedia } from '../website/hooks';
import { WebsiteLayout, apmBlue, ink, muted, soft } from '../website/layout';

export default function MediaPage() {
  const { data, isLoading } = useMedia();

  return (
    <WebsiteLayout>
      <Box
        py={80}
        style={{ background: `linear-gradient(135deg, ${soft} 0%, #DBEAFE 30%, #ffffff 100%)` }}
      >
        <Container size="xl">
          <SectionHeading
            title="Media Gallery"
            subtitle="Campaign videos, interviews, press releases, and photo highlights from across Oyo State."
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
            <Stack ta="center" gap="md">
              <Text style={{ color: muted }}>Media content coming soon.</Text>
            </Stack>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={24}>
              {data.map((item) => (
                <Anchor
                  key={item.id}
                  href={item.assetUrl}
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
                      flexDirection: 'column',
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
                    {item.type === 'video' && (
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
                    )}
                    {item.category && (
                      <Text
                        size="xs"
                        style={{
                          color: 'rgba(255,255,255,0.7)',
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          background: 'rgba(0,0,0,0.4)',
                          padding: '4px 10px',
                          borderRadius: 8,
                        }}
                      >
                        {item.category}
                      </Text>
                    )}
                  </Box>
                  <Text ta="center" size="sm" fw={600} mt="sm" style={{ color: ink }}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text ta="center" size="xs" style={{ color: muted, marginTop: 4 }}>
                      {item.description.slice(0, 80)}
                      {(item.description?.length ?? 0) > 80 ? '…' : ''}
                    </Text>
                  )}
                </Anchor>
              ))}
            </SimpleGrid>
          )}
        </Container>
      </Box>
    </WebsiteLayout>
  );
}
