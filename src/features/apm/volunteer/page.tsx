import {
  Box,
  Container,
  Grid,
  Group,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { UsersRound, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { SectionHeading, PrimaryButton } from '../website/components';
import { useRegisterVolunteer } from '../website/hooks';
import { WebsiteLayout, apmBlue, ink, muted, soft } from '../website/layout';

export default function VolunteerPage() {
  const { mutate, isPending } = useRegisterVolunteer();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [lga, setLga] = useState('');
  const [ward, setWard] = useState('');
  const [skills, setSkills] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      return;
    }
    mutate(
      {
        name,
        phone,
        email: email || undefined,
        lga: lga || undefined,
        ward: ward || undefined,
        skills: skills || undefined,
      },
      {
        onSuccess: () => {
          setName('');
          setPhone('');
          setEmail('');
          setLga('');
          setWard('');
          setSkills('');
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
            title="Become a Volunteer"
            subtitle="The success of this movement depends on people like you. Register and help us build a better Oyo."
          />
        </Container>
      </Box>
      <Box py={80} style={{ background: '#fff' }}>
        <Container size="md">
          <Grid gap={48}>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Stack gap="lg">
                <UsersRound size={40} color={apmBlue} />
                <Title order={3} style={{ fontSize: '1.3rem', fontWeight: 700, color: ink }}>
                  Why Volunteer?
                </Title>
                <Stack gap="sm">
                  {[
                    "Be part of a movement shaping Oyo State's future",
                    'Connect with like-minded citizens across all 33 LGAs',
                    'Develop leadership and community organizing skills',
                    'Receive campaign updates, talking points, and content packs',
                    'Help ensure continuity, stability, and progress',
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
                <Box
                  style={{
                    background: '#DCFCE7',
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <Group gap="sm">
                    <MessageCircle size={20} color="#1F8A3B" />
                    <Box>
                      <Text size="sm" fw={700} style={{ color: '#1F8A3B' }}>
                        Join our WhatsApp Community
                      </Text>
                      <Text size="xs" style={{ color: '#166534' }}>
                        For instant updates and assignments
                      </Text>
                    </Box>
                  </Group>
                </Box>
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
                  Registration Form
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
                  <TextInput
                    label="Skills / Interests"
                    placeholder="e.g., community organising, social media, events, door-to-door"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    styles={{
                      input: { borderColor: '#E2E8F0' },
                      label: { color: ink, fontWeight: 500 },
                    }}
                  />
                  <PrimaryButton onClick={handleSubmit}>
                    {isPending ? 'Registering...' : 'Register as Volunteer'}
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
