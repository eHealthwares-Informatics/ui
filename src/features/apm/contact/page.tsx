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
import { Mail, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';
import { SectionHeading, PrimaryButton } from '../website/components';
import { useSubmitContact } from '../website/hooks';
import { WebsiteLayout, apmBlue, ink, muted, soft } from '../website/layout';

export default function ContactPage() {
  const { mutate, isPending } = useSubmitContact();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      return;
    }
    mutate(
      { name, email, phone: phone || undefined, subject, message },
      {
        onSuccess: () => {
          setName('');
          setEmail('');
          setPhone('');
          setSubject('');
          setMessage('');
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
            title="Contact Us"
            subtitle="Have questions, suggestions, or want to get involved? We'd love to hear from you."
          />
        </Container>
      </Box>
      <Box py={80} style={{ background: '#fff' }}>
        <Container size="md">
          <Grid gap={48}>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Stack gap="xl">
                <Box>
                  <Group gap="sm" mb="xs">
                    <Phone size={20} color={apmBlue} />
                    <Text fw={600} style={{ color: ink }}>
                      Phone
                    </Text>
                  </Group>
                  <Text size="sm" style={{ color: muted }}>
                    0800-CALL-APM
                  </Text>
                </Box>
                <Box>
                  <Group gap="sm" mb="xs">
                    <Mail size={20} color={apmBlue} />
                    <Text fw={600} style={{ color: ink }}>
                      Email
                    </Text>
                  </Group>
                  <Text size="sm" style={{ color: muted }}>
                    contact@adekanmbi2027.apm.ng
                  </Text>
                </Box>
                <Box>
                  <Group gap="sm" mb="xs">
                    <MapPin size={20} color={apmBlue} />
                    <Text fw={600} style={{ color: ink }}>
                      Campaign Headquarters
                    </Text>
                  </Group>
                  <Text size="sm" style={{ color: muted }}>
                    Ibadan, Oyo State, Nigeria
                  </Text>
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
                  Send a Message
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
                        label="Email *"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        type="email"
                        styles={{
                          input: { borderColor: '#E2E8F0' },
                          label: { color: ink, fontWeight: 500 },
                        }}
                      />
                    </Grid.Col>
                  </Grid>
                  <TextInput
                    label="Phone"
                    placeholder="08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    styles={{
                      input: { borderColor: '#E2E8F0' },
                      label: { color: ink, fontWeight: 500 },
                    }}
                  />
                  <TextInput
                    label="Subject *"
                    placeholder="What is this about?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    styles={{
                      input: { borderColor: '#E2E8F0' },
                      label: { color: ink, fontWeight: 500 },
                    }}
                  />
                  <Textarea
                    label="Message *"
                    placeholder="Write your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    minRows={4}
                    styles={{
                      input: { borderColor: '#E2E8F0' },
                      label: { color: ink, fontWeight: 500 },
                    }}
                  />
                  <PrimaryButton onClick={handleSubmit}>
                    {isPending ? 'Sending...' : 'Send Message'}
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
