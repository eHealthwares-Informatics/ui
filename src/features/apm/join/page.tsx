import { Box, Container, Grid, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { BadgeCheck, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { SectionHeading, PrimaryButton } from '../website/components';
import { useJoinMovement } from '../website/hooks';
import { WebsiteLayout, apmBlue, ink, muted, soft } from '../website/layout';

export default function JoinPage() {
  const { mutate, isPending } = useJoinMovement();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [lga, setLga] = useState('');
  const [ward, setWard] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      return;
    }
    mutate(
      { name, phone, email: email || undefined, lga: lga || undefined, ward: ward || undefined },
      {
        onSuccess: () => {
          setName('');
          setPhone('');
          setEmail('');
          setLga('');
          setWard('');
        },
      }
    );
  };

  return (
    <WebsiteLayout>
      <Box
        py={80}
        style={{ background: `linear-gradient(135deg, ${soft} 0%, #DBEAFE 30%, #ffffff 100%)` }}
      >
        <Container size="xl">
          <SectionHeading
            title="Join The Movement"
            subtitle="Be part of the continuity movement — together we can build a better Oyo State."
          />
        </Container>
      </Box>
      <Box py={80} style={{ background: '#fff' }}>
        <Container size="md">
          <Grid gap={48}>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Stack gap="lg">
                <BadgeCheck size={40} color={apmBlue} />
                <Title order={3} style={{ fontSize: '1.3rem', fontWeight: 700, color: ink }}>
                  Why Join?
                </Title>
                <Stack gap="sm">
                  {[
                    'Receive campaign updates and news directly',
                    'Get invited to events, town halls, and community meetings',
                    'Connect with supporters across your LGA and ward',
                    'Shape the future of Oyo State with your voice',
                    'Access exclusive campaign content and resources',
                  ].map((reason, i) => (
                    <Group key={i} gap="sm">
                      <Text size="sm" style={{ color: apmBlue, fontWeight: 700 }}>
                        {i + 1}.
                      </Text>
                      <Text size="sm" style={{ color: muted }}>
                        {reason}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Box
                component="form"
                onSubmit={handleSubmit}
                style={{
                  padding: 40,
                  borderRadius: 16,
                  border: '1px solid #E2E8F0',
                  background: '#fff',
                }}
              >
                <Title
                  order={3}
                  style={{ fontSize: '1.2rem', fontWeight: 700, color: ink, marginBottom: 24 }}
                >
                  Sign Up
                </Title>
                <Stack gap="md">
                  <Grid gap="md">
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Full Name *"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        styles={{
                          input: { borderColor: '#E2E8F0' },
                          label: { color: ink, fontWeight: 500 },
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Phone Number *"
                        placeholder="08123456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        styles={{
                          input: { borderColor: '#E2E8F0' },
                          label: { color: ink, fontWeight: 500 },
                        }}
                      />
                    </Grid.Col>
                  </Grid>
                  <TextInput
                    label="Email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    styles={{
                      input: { borderColor: '#E2E8F0' },
                      label: { color: ink, fontWeight: 500 },
                    }}
                  />
                  <Grid gap="md">
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="LGA"
                        placeholder="Your Local Government Area"
                        value={lga}
                        onChange={(e) => setLga(e.target.value)}
                        styles={{
                          input: { borderColor: '#E2E8F0' },
                          label: { color: ink, fontWeight: 500 },
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Ward"
                        placeholder="Your ward (optional)"
                        value={ward}
                        onChange={(e) => setWard(e.target.value)}
                        styles={{
                          input: { borderColor: '#E2E8F0' },
                          label: { color: ink, fontWeight: 500 },
                        }}
                      />
                    </Grid.Col>
                  </Grid>
                  <PrimaryButton onClick={handleSubmit}>
                    {isPending ? 'Joining...' : 'Join The Movement'}
                  </PrimaryButton>
                </Stack>
              </Box>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>
    </WebsiteLayout>
  );
}
