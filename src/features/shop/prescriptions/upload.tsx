import {
  Badge,
  Box,
  Button,
  Container,
  Group,
  Input,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { FileUp, Upload, Check, Pill, Camera } from 'lucide-react';
import { useState, useRef } from 'react';
import { useCreatePrescription } from '../website/hooks';
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

export default function UploadPrescriptionPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { mutate: submit, isPending } = useCreatePrescription();

  const handleUpload = () => {
    if (!files.length) {return;}
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    if (name) {formData.append('name', name);}
    if (phone) {formData.append('phone', phone);}
    if (email) {formData.append('email', email);}
    if (notes) {formData.append('notes', notes);}

    submit(formData, {
      onSuccess: () => {
        setSuccess(true);
        setFiles([]);
        setName('');
        setPhone('');
        setEmail('');
        setNotes('');
      },
    });
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
              Prescription Submitted
            </Title>
            <Text c={muted} lh={1.7} mt="sm">
              Our licensed pharmacists will review your prescription. You&apos;ll receive an update
              via WhatsApp or email.
            </Text>
            <Button
              radius="xl"
              mt="lg"
              color="green"
              styles={buttonStyles}
              style={{ background: green }}
              onClick={() => setSuccess(false)}
            >
              Upload Another
            </Button>
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
              Upload Prescription
            </Title>
            <Text c={muted} size="lg" lh={1.7}>
              Send your prescription to our licensed pharmacists for review and preparation.
            </Text>
          </Box>

          <Paper radius={30} p="xl" withBorder style={{ borderColor: line }}>
            <Stack gap="lg">
              <Box
                style={{
                  border: `2px dashed ${line}`,
                  borderRadius: 24,
                  padding: 48,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: soft,
                }}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  style={{ display: 'none' }}
                />
                <ThemeIcon radius="xl" size={56} color="green" variant="light" mx="auto">
                  <Upload size={26} />
                </ThemeIcon>
                <Text fw={900} mt="md" size="lg">
                  {files.length
                    ? `${files.length} file(s) selected`
                    : 'Click to upload or drag files'}
                </Text>
                <Text size="sm" c={muted}>
                  JPG, PNG, or PDF. Max 10 files.
                </Text>

                {files.length > 0 ? (
                  <Group justify="center" mt="sm" gap="xs">
                    {files.map((f, i) => (
                      <Badge key={i} radius="xl" color="green" variant="light">
                        {f.name}
                      </Badge>
                    ))}
                  </Group>
                ) : null}
              </Box>

              <Stack gap="sm">
                <label>
                  <Text size="sm" fw={800} mb={4}>
                    Your Name (optional)
                  </Text>
                  <Input
                    placeholder="Full name"
                    radius="xl"
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    styles={{ input: { borderColor: '#CFE5D7' } }}
                  />
                </label>
                <label>
                  <Text size="sm" fw={800} mb={4}>
                    Phone Number
                  </Text>
                  <Input
                    placeholder="+234"
                    radius="xl"
                    value={phone}
                    onChange={(e) => setPhone(e.currentTarget.value)}
                    styles={{ input: { borderColor: '#CFE5D7' } }}
                  />
                </label>
                <label>
                  <Text size="sm" fw={800} mb={4}>
                    Email (optional)
                  </Text>
                  <Input
                    placeholder="you@example.com"
                    radius="xl"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    styles={{ input: { borderColor: '#CFE5D7' } }}
                  />
                </label>
                <label>
                  <Text size="sm" fw={800} mb={4}>
                    Notes (optional)
                  </Text>
                  <Input
                    placeholder="Additional instructions or information"
                    radius="xl"
                    value={notes}
                    onChange={(e) => setNotes(e.currentTarget.value)}
                    styles={{ input: { borderColor: '#CFE5D7' } }}
                  />
                </label>
              </Stack>

              <Group>
                <Button
                  radius="xl"
                  size="md"
                  leftSection={<FileUp size={18} />}
                  styles={buttonStyles}
                  style={{ background: green }}
                  onClick={handleUpload}
                  loading={isPending}
                  disabled={!files.length}
                >
                  Submit Prescription
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </WebsiteLayout>
  );
}
