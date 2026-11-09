import { Drawer, Stack, Text, Title, Badge, Table } from '@mantine/core';

export type InfoField = {
  name: string;
  description: string;
};

export type EntityInfo = {
  title: string;
  description: string;
  openelisTable?: string;
  fields?: InfoField[];
};

type InfoDrawerProps = {
  opened: boolean;
  onClose: () => void;
  info: EntityInfo | null;
};

export function InfoDrawer({ opened, onClose, info }: InfoDrawerProps) {
  if (!info) {
    return null;
  }
  return (
    <Drawer opened={opened} onClose={onClose} title={info.title} position="right" size="md">
      <Stack gap="md">
        {info.openelisTable && (
          <Badge variant="light" color="violet" size="sm" style={{ alignSelf: 'flex-start' }}>
            {info.openelisTable}
          </Badge>
        )}

        <Text size="sm" lh={1.6}>
          {info.description}
        </Text>

        {info.fields && info.fields.length > 0 && (
          <>
            <Title order={5} mt="sm">
              Key Fields
            </Title>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Field</Table.Th>
                  <Table.Th>Description</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {info.fields.map((f) => (
                  <Table.Tr key={f.name}>
                    <Table.Td>
                      <Text size="sm" fw={500} ff="monospace">
                        {f.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{f.description}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </>
        )}
      </Stack>
    </Drawer>
  );
}
