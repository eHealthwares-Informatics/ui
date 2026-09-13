import {
  Badge,
  Box,
  Button,
  Container,
  Group,
  Input,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { CalendarClock, MessageCircle, Phone, Video, Check } from 'lucide-react';
import { useState } from 'react';
import { useCreateConsultation } from '../website/hooks';
import { WebsiteLayout, green, ink, muted, line, buttonStyles } from '../website/layout';
import { ConsultationLoader } from '../website/loaders';

export default function BookConsultationPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [questions, setQuestions] = useState('');
  const [channel, setChannel] = useState<string | null>('WhatsApp');
  const [success, setSuccess] = useState(false);
  const { mutate: submit, isPending } = useCreateConsultation();

  const handleSubmit = () => {
    submit(
      {
        name,
        phone,
        email: email || undefined,
        symptoms: symptoms || undefined,
        questions: questions || undefined,
        channel: channel || undefined,
      },
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
              Consultation Booked
            </Title>
            <Text c={muted} lh={1.7} mt="sm">
              A pharmacist will contact you via {channel} shortly.
            </Text>
          </Paper>
        </Container>
      </WebsiteLayout>
    );
  }

  if (isPending) {
    return (
      <WebsiteLayout>
        <ConsultationLoader />
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <Container size="sm" py={{ base: 28, md: 48 }}>
        <Stack gap="xl">
          <Box>
            <Title order={1} className="damorex-heading" style={{ color: ink }}>
              Consult a Pharmacist
            </Title>
            <Text c={muted} size="lg" lh={1.7}>
              Get professional medication advice and wellness support.
            </Text>
          </Box>

          <Paper radius={30} p="xl" withBorder style={{ borderColor: line }}>
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
              <Input.Wrapper label="Phone Number">
                <Input
                  placeholder="+234"
                  radius="xl"
                  value={phone}
                  onChange={(e) => setPhone(e.currentTarget.value)}
                  styles={{ input: { borderColor: '#CFE5D7' } }}
                />
              </Input.Wrapper>
              <Input.Wrapper label="Email (optional)">
                <Input
                  placeholder="you@example.com"
                  radius="xl"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  styles={{ input: { borderColor: '#CFE5D7' } }}
                />
              </Input.Wrapper>
              <Input.Wrapper label="Symptoms (optional)">
                <Textarea
                  placeholder="Describe your symptoms..."
                  radius="xl"
                  minRows={3}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.currentTarget.value)}
                  styles={{ input: { borderColor: '#CFE5D7' } }}
                />
              </Input.Wrapper>
              <Input.Wrapper label="Questions (optional)">
                <Textarea
                  placeholder="What would you like to ask the pharmacist?"
                  radius="xl"
                  minRows={3}
                  value={questions}
                  onChange={(e) => setQuestions(e.currentTarget.value)}
                  styles={{ input: { borderColor: '#CFE5D7' } }}
                />
              </Input.Wrapper>

              <Text fw={800} size="sm">
                Preferred Communication
              </Text>
              <Group>
                {['WhatsApp', 'Phone', 'Video Call'].map((c) => (
                  <Badge
                    key={c}
                    radius="xl"
                    size="lg"
                    color={channel === c ? 'green' : 'gray'}
                    variant={channel === c ? 'filled' : 'light'}
                    style={{ cursor: 'pointer' }}
                    leftSection={
                      c === 'WhatsApp' ? (
                        <MessageCircle size={14} />
                      ) : c === 'Phone' ? (
                        <Phone size={14} />
                      ) : (
                        <Video size={14} />
                      )
                    }
                    onClick={() => setChannel(c)}
                  >
                    {c}
                  </Badge>
                ))}
              </Group>

              <Button
                radius="xl"
                size="lg"
                fullWidth
                leftSection={<CalendarClock size={18} />}
                styles={buttonStyles}
                style={{ background: green }}
                onClick={handleSubmit}
                loading={isPending}
                disabled={!name || !phone}
              >
                Book Consultation
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}
