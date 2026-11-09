import {
  Button,
  Container,
  MultiSelect,
  Paper,
  PasswordInput,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import { useState } from 'react';

// export function HomePage() {
//   return (
//     <>
//       <Welcome />
//       <ColorSchemeToggle />

export function Auth() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [modules, setModules] = useState<string[]>([]);

  const handleSubmit = () => {
    console.log({
      username,
      password,
      modules,
    });
  };

  return (
    <Container size={420} my={80}>
      <Title ta="center" mb="md">
        Login
      </Title>

      <Paper withBorder shadow="md" p="lg" radius="md">
        <Stack>
          <TextInput
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            required
          />

          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
          />

          <MultiSelect
            label="Modules"
            placeholder="Select modules"
            data={[
              { value: 'lab', label: 'Laboratory' },
              { value: 'radiology', label: 'Radiology' },
              { value: 'pharmacy', label: 'Pharmacy' },
              { value: 'admin', label: 'Admin' },
            ]}
            value={modules}
            onChange={setModules}
            searchable
            clearable
          />

          <Button fullWidth mt="md" onClick={handleSubmit}>
            Sign in
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
