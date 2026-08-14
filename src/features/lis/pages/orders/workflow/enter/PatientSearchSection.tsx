import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Select,
  Table,
  Paper,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { Search, UserCheck, Plus } from 'lucide-react';
import { useDebouncedValue } from '@mantine/hooks';
import { lisApi } from '@/lib/lis-api';
import { useOrderContext } from '../OrderContext';

interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  dateOfBirth: string | null;
}

const parseDate = (s: string | null | undefined): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const ageFromDob = (dob: string | null | undefined): number | null => {
  const birth = parseDate(dob);
  if (!birth) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

const dobFromAge = (age: number): string | null => {
  if (!Number.isFinite(age) || age < 0) return null;
  return `${new Date().getFullYear() - age}-01-01`;
};

export function PatientSearchSection() {
  const { state, dispatch } = useOrderContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [debounced] = useDebouncedValue(searchQuery, 400);
  const [results, setResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [newPatientOpen, setNewPatientOpen] = useState(false);

  useEffect(() => {
    if (!debounced || debounced.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    lisApi
      .get('/lis/patients', { params: { search: debounced, limit: 20 } })
      .then((res) => {
        setResults(res.data?.data ?? []);
      })
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, [debounced]);

  const selectPatient = (p: Patient) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientId', value: p.patientId } });
    dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientName', value: `${p.firstName} ${p.lastName}` } });
    dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientGender', value: p.gender } });
    dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientDateOfBirth', value: p.dateOfBirth } });
    dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientAge', value: ageFromDob(p.dateOfBirth) } });
    dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientSelected', value: true } });
  };

  const handleDobChange = (value: string | null) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientDateOfBirth', value: value || null } });
    dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientAge', value: ageFromDob(value) } });
  };

  const handleAgeChange = (value: string) => {
    const age = value === '' ? null : Number(value);
    dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientAge', value: age } });
    dispatch({
      type: 'UPDATE_FIELD',
      payload: { name: 'patientDateOfBirth', value: age != null && Number.isFinite(age) ? dobFromAge(age) : null },
    });
  };

  const handleAddPatient = () => {
    dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientSelected', value: true } });
    setNewPatientOpen(false);
  };

  const isSelected = state.patientSelected;
  const dobValue = state.patientDateOfBirth ?? null;

  return (
    <Card withBorder p="md" radius="md">
      <Stack gap="sm">
        <Text fw={600}>Patient Information</Text>

        {!isSelected ? (
          <>
            <Group gap="xs">
              <ActionIcon
                variant="light"
                size="md"
                onClick={() => setNewPatientOpen(true)}
                aria-label="Add new patient"
              >
                <Plus size={16} />
              </ActionIcon>
              <TextInput
                placeholder="Search by name, MRN, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                leftSection={<Search size={16} />}
                style={{ flex: 1 }}
              />
            </Group>

            {results.length > 0 && (
              <Paper withBorder>
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>MRN</Table.Th>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Gender</Table.Th>
                      <Table.Th>DOB</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {results.map((p) => (
                      <Table.Tr key={p.id}>
                        <Table.Td>{p.patientId}</Table.Td>
                        <Table.Td>
                          {p.firstName} {p.lastName}
                        </Table.Td>
                        <Table.Td>{p.gender ?? '—'}</Table.Td>
                        <Table.Td>{p.dateOfBirth ?? '—'}</Table.Td>
                        <Table.Td>
                          <Button size="xs" variant="light" onClick={() => selectPatient(p)} leftSection={<UserCheck size={14} />}>
                            Select
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}

            {searching && <Text size="sm" c="dimmed">Searching...</Text>}
          </>
        ) : (
          <Paper withBorder p="sm" bg="blue.0">
            <Group justify="space-between">
              <Group gap="sm">
                <UserCheck size={20} />
                <div>
                  <Text fw={500}>{state.patientName}</Text>
                  <Text size="sm" c="dimmed">
                    MRN: {state.patientId} | Gender: {state.patientGender ?? '—'} | DOB: {state.patientDateOfBirth ?? '—'}
                  </Text>
                </div>
              </Group>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => {
                  dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientSelected', value: false } });
                  dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientId', value: '' } });
                  dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientName', value: '' } });
                  dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientGender', value: null } });
                  dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientDateOfBirth', value: null } });
                  dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientAge', value: null } });
                }}
              >
                Change
              </Button>
            </Group>
          </Paper>
        )}
      </Stack>

      <Modal
        opened={newPatientOpen}
        onClose={() => setNewPatientOpen(false)}
        title="New Patient"
        size="lg"
      >
        <Stack gap="sm">
          <Group grow>
            <TextInput
              label="Patient Name"
              placeholder="e.g. John Doe"
              value={state.patientName}
              onChange={(e) => dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientName', value: e.currentTarget.value } })}
              required
            />
            <TextInput
              label="MRN"
              placeholder="Medical record number"
              value={state.patientId}
              onChange={(e) => dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientId', value: e.currentTarget.value } })}
              required
            />
          </Group>
          <Group grow>
            <Select
              label="Gender"
              placeholder="Select gender"
              data={['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']}
              value={state.patientGender}
              onChange={(v) => dispatch({ type: 'UPDATE_FIELD', payload: { name: 'patientGender', value: v } })}
              clearable
            />
            <DatePickerInput
              label="Date of Birth"
              placeholder="Pick date"
              value={dobValue}
              onChange={handleDobChange}
              clearable
            />
            <TextInput
              label="Age"
              type="number"
              placeholder="Age"
              value={state.patientAge ?? ''}
              onChange={(e) => handleAgeChange(e.currentTarget.value)}
            />
          </Group>
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setNewPatientOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPatient} disabled={!state.patientName || !state.patientId}>
              Add Patient
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
}
