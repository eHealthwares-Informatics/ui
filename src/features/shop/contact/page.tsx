import {
  Box,
  Button,
  Container,
  Group,
  Input,
  Paper,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { Mail, Phone, MapPin, MessageCircle, Send, Check } from 'lucide-react';
import { useState } from 'react';
import { useSubmitContact } from '../website/hooks';
import {
  WebsiteLayout,
  green,
  darkGreen,
  ink,
  muted,
  line,
  soft,
  buttonStyles,
} from '../website/layout';
import { PageLoader } from '../website/loaders';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const { mutate: submit, isPending } = useSubmitContact();

  const handleSubmit = () => {
    submit(
      { name, email, phone: phone || undefined, subject, message },
      {
        onSuccess: () => setSuccess(true),
      }
    );
  };

  if (success) {
    return (
      <WebsiteLayout>
        <Container size="sm" py={80}>
          <Paper radius={30} p="xl" withBorder style={{ borderColor: line, textAlign: 'center' }}>
            <ThemeIcon radius="xl" size={64} color="green" mx="auto">
              <Check size={32} />
            </ThemeIcon>
            <Title order={2} className="damorex-heading" mt="md">
              Message Sent
            </Title>
            <Text c={muted} lh={1.7} mt="sm">
              We&apos;ll get back to you within 24 hours.
            </Text>
          </Paper>
        </Container>
      </WebsiteLayout>
    );
  }

  if (isPending) {
    return (
      <WebsiteLayout>
        <PageLoader />
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <Container size="md" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Box>
            <Title order={1} className="damorex-heading" style={{ color: ink }}>
              Contact Us
            </Title>
            <Text c={muted} size="lg" lh={1.7}>
              We&apos;re here to help. Send us a message.
            </Text>
          </Box>

          <Group grow align="start" gap="lg">
            <Paper radius={24} p="xl" withBorder style={{ borderColor: line, flex: 1 }}>
              <Stack gap="md">
                <Input.Wrapper label="Your Name">
                  <Input
                    placeholder="Full name"
                    radius="xl"
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    styles={{ input: { borderColor: '#CFE5D7' } }}
                  />
                </Input.Wrapper>
                <Input.Wrapper label="Email">
                  <Input
                    placeholder="you@example.com"
                    radius="xl"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    styles={{ input: { borderColor: '#CFE5D7' } }}
                  />
                </Input.Wrapper>
                <Input.Wrapper label="Phone (optional)">
                  <Input
                    placeholder="+234"
                    radius="xl"
                    value={phone}
                    onChange={(e) => setPhone(e.currentTarget.value)}
                    styles={{ input: { borderColor: '#CFE5D7' } }}
                  />
                </Input.Wrapper>
                <Input.Wrapper label="Subject">
                  <Input
                    placeholder="How can we help?"
                    radius="xl"
                    value={subject}
                    onChange={(e) => setSubject(e.currentTarget.value)}
                    styles={{ input: { borderColor: '#CFE5D7' } }}
                  />
                </Input.Wrapper>
                <Input.Wrapper label="Message">
                  <Textarea
                    placeholder="Your message..."
                    radius="xl"
                    minRows={4}
                    value={message}
                    onChange={(e) => setMessage(e.currentTarget.value)}
                    styles={{ input: { borderColor: '#CFE5D7' } }}
                  />
                </Input.Wrapper>
                <Button
                  radius="xl"
                  size="md"
                  fullWidth
                  leftSection={<Send size={18} />}
                  styles={buttonStyles}
                  style={{ background: green }}
                  onClick={handleSubmit}
                  loading={isPending}
                  disabled={!name || !email || !subject || !message}
                >
                  Send Message
                </Button>
              </Stack>
            </Paper>

            <Paper radius={24} p="xl" style={{ background: darkGreen, color: '#fff', flex: 1 }}>
              <Stack gap="lg">
                <Text fw={900} size="lg">
                  Get in Touch
                </Text>
                <Group gap="md">
                  <ThemeIcon radius="xl" size={44} style={{ background: 'rgba(255,255,255,0.16)' }}>
                    <Phone size={22} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={800}>Phone</Text>
                    <Text c="rgba(255,255,255,0.76)" size="sm">
                      +234
                    </Text>
                  </Box>
                </Group>
                <Group gap="md">
                  <ThemeIcon radius="xl" size={44} style={{ background: 'rgba(255,255,255,0.16)' }}>
                    <Mail size={22} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={800}>Email</Text>
                    <Text c="rgba(255,255,255,0.76)" size="sm">
                      info@damorex.com
                    </Text>
                  </Box>
                </Group>
                <Group gap="md">
                  <ThemeIcon radius="xl" size={44} style={{ background: 'rgba(255,255,255,0.16)' }}>
                    <MessageCircle size={22} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={800}>WhatsApp</Text>
                    <Text c="rgba(255,255,255,0.76)" size="sm">
                      Chat with our team
                    </Text>
                  </Box>
                </Group>
              </Stack>
            </Paper>
          </Group>
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}
